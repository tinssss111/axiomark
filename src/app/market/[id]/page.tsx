/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReadContract, useAccount } from "wagmi";
import { formatUnits, type Abi } from "viem";
import { abi } from "../../contract/abi";
import { Header } from "../../components/Header";
import PlaceBet from "../../components/PlaceBet";

const CONTRACT_ADDRESS = "0x05339e5752689E17a180D7440e61D4191446b4D6";

interface MarketDetails {
  question: string;
  endTime: bigint;
  image: string;
  resolved: boolean;
  outcome: boolean;
  totalYesBets: bigint;
  totalNoBets: bigint;
  totalPool: bigint;
  finalPrice: bigint;
  canceled: boolean;
}

type UserBets = [bigint, bigint];

// Price point interface for chart data
interface PricePoint {
  timestamp: bigint;
  price: number; // 0-100 representing probability percentage
}

export default function MarketDetail() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const marketId = params.id as string;
  const [isTimelineOpen, setIsTimelineOpen] = useState(true);

  const { data: marketData, isLoading: isLoadingMarket } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: abi as Abi,
    functionName: "getMarketDetails",
    args: [BigInt(marketId)],
  });

  const { data: userBets } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: abi as Abi,
    functionName: "getUserBets",
    args: address ? [BigInt(marketId), address] : undefined,
    query: { enabled: !!address },
  });

  const { data: winningRatios } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: abi as Abi,
    functionName: "getWinningRatios",
    args: [BigInt(marketId)],
  });

  // Fetch market price history data
  const { data: priceHistory } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: abi as Abi,
    functionName: "getMarketPriceHistory",
    args: [BigInt(marketId)],
    query: {
      select: (data: any) => {
        // Convert raw contract data to PricePoint array
        if (!data || !Array.isArray(data)) return [];

        return data.map((point: any) => ({
          timestamp: point.timestamp || BigInt(0),
          price: Number(point.price || 0) / 100, // Assuming contract returns 0-10000 representing 0-100%
        }));
      },
    },
  });

  const market = marketData as MarketDetails;
  const userBetData = userBets as UserBets;

  // Calculate timeline dates
  const endTimeSeconds = market?.endTime ? Number(market.endTime) : 0;
  const publishTime = endTimeSeconds
    ? BigInt(endTimeSeconds - 7 * 24 * 60 * 60)
    : BigInt(0);
  const resolutionTime = endTimeSeconds
    ? BigInt(endTimeSeconds + 24 * 60 * 60)
    : BigInt(0);

  const getMarketStatus = () => {
    if (!market) return { text: "Loading...", color: "text-gray-500" };

    const now = Date.now() / 1000;
    const endTime = Number(market.endTime);

    if (market.canceled) return { text: "Canceled", color: "text-gray-500" };
    if (market.resolved)
      return {
        text: market.outcome ? "Resolved: YES" : "Resolved: NO",
        color: "text-black",
      };
    if (endTime < now)
      return { text: "Awaiting Result", color: "text-gray-600" };
    return { text: "Active", color: "text-black" };
  };

  const formatDate = (timestamp: bigint) => {
    if (!timestamp) return "";
    return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (timestamp: bigint) => {
    if (!timestamp) return "";
    return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const calculatePercentage = (amount: bigint, total: bigint) => {
    if (total === BigInt(0)) return 0;
    return Number((amount * BigInt(100)) / total);
  };

  // Calculate current probability from yes/no bets
  const yesPercentage = market?.totalPool
    ? calculatePercentage(market.totalYesBets, market.totalPool)
    : 0;

  // Function to generate chart points from price history
  const generateChartPoints = () => {
    if (!priceHistory || priceHistory.length === 0) {
      // Fallback for when no data is available
      return "M0,100 L800,100";
    }

    // Scale the data to fit in the SVG viewBox
    const width = 800;
    const height = 200;
    const margin = 20;

    // Calculate x and y scales
    const xScale = (width - 2 * margin) / (priceHistory.length - 1);

    // Generate the path data
    let pathData = "";
    priceHistory.forEach((point, index) => {
      // Convert price to y coordinate (100% -> top of chart, 0% -> bottom)
      // Flip the y-axis since SVG 0,0 is top-left
      const x = margin + index * xScale;
      const y = height - margin - point.price * (height - 2 * margin);

      if (index === 0) {
        pathData += `M${x},${y}`;
      } else {
        pathData += ` L${x},${y}`;
      }
    });

    return pathData;
  };

  // Calculate price change percentage for display
  const calculatePriceChange = () => {
    if (!priceHistory || priceHistory.length < 2)
      return { value: 0, isPositive: true };

    const firstPrice = priceHistory[0]?.price || 0;
    const latestPrice = priceHistory[priceHistory.length - 1]?.price || 0;

    const change = Math.round((latestPrice - firstPrice) * 100);
    return {
      value: Math.abs(change),
      isPositive: change >= 0,
    };
  };

  const priceChange = calculatePriceChange();

  if (isLoadingMarket) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading market data...</div>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Market not found</div>
        </div>
      </div>
    );
  }

  // Get min and max values for y-axis labels
  const priceValues = priceHistory?.map((p) => p.price * 100) || [30, 70];
  const maxPrice = Math.ceil(Math.max(...priceValues, yesPercentage) / 10) * 10;
  const minPrice =
    Math.floor(Math.min(...priceValues, yesPercentage) / 10) * 10;

  // Create evenly spaced y-axis labels
  const yAxisLabels = [];
  const step = Math.ceil((maxPrice - minPrice) / 4);
  for (let i = 0; i <= 4; i++) {
    yAxisLabels.push(maxPrice - i * step);
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Divider */}
      <div className="w-full h-[0.5px] bg-gray-200"></div>

      <div className="max-w-7xl mx-auto py-8 flex flex-col lg:flex-row lg:space-x-10">
        <div className="w-2/3">
          {/* Back button */}
          <button
            onClick={() => router.push("/")}
            className="mb-4 flex items-center text-gray-600 hover:text-black transition-colors group"
          >
            <svg
              className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Markets
          </button>

          {/* Market Header - Styled like the image */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-center space-x-4">
              {market.image && (
                <img
                  src={market.image}
                  alt="Market"
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                />
              )}
              <h1 className="text-3xl font-bold text-black leading-tight">
                {market.question}
              </h1>
              <div className="flex space-x-3 ml-auto">
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="text-xl font-mono text-gray-700">
                ${formatUnits(market.totalPool || BigInt(0), 6)} Vol.
              </div>
              <div className="flex items-center text-gray-500">
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formatDate(market.endTime)}
              </div>
            </div>

            {/* Timeline Selection Pills */}
            <div className="mt-4 flex space-x-2">
              <button className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <button className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium">
                {formatDateShort(publishTime)}
              </button>
              <button className="rounded-full bg-black text-white px-4 py-2 text-sm font-medium">
                {formatDateShort(market.endTime)}
              </button>
              <button className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium">
                {formatDateShort(resolutionTime)}
              </button>
            </div>
          </div>

          {/* Probability Display */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">
                {yesPercentage.toFixed(0)}% chance
              </div>
              <div
                className={`ml-3 flex items-center ${
                  priceChange.isPositive ? "text-green-500" : "text-red-500"
                }`}
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      priceChange.isPositive
                        ? "M5 15l7-7 7 7"
                        : "M19 9l-7 7-7-7"
                    }
                  />
                </svg>
                {priceChange.value}%
              </div>
              <div className="ml-auto">
                <img
                  src="/logo/logo-nb.png"
                  alt="Platform Logo"
                  className="h-8"
                />
              </div>
            </div>

            {/* Dynamic Price Chart with real data */}
            <div className="mt-6 w-full h-64 bg-white border border-gray-100 rounded-lg relative overflow-hidden">
              {/* Y-Axis labels */}
              <div className="absolute top-0 right-0 bottom-0 flex flex-col justify-between text-xs text-gray-400 pr-2 pt-1 pb-1">
                {yAxisLabels.map((label, index) => (
                  <span key={index}>{label}%</span>
                ))}
              </div>

              {/* Chart from contract data */}
              <div className="w-full h-full flex items-center justify-center">
                <svg
                  viewBox="0 0 800 200"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  {/* Path generated from price history */}
                  <path
                    d={generateChartPoints()}
                    fill="none"
                    stroke="#1E40AF"
                    strokeWidth="2"
                  />

                  {/* Current point indicator */}
                  {priceHistory && priceHistory.length > 0 && (
                    <circle
                      cx="750"
                      cy={
                        200 - priceHistory[priceHistory.length - 1].price * 200
                      }
                      r="4"
                      fill="#1E40AF"
                    />
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="w-1/3">
          {" "}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Place bet section */}
                {!market.resolved && !market.canceled && address ? (
                  <div className="">
                    <PlaceBet marketId={Number(marketId)} />
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-black mb-4">
                      Place Bet
                    </h3>
                    <div className="text-center py-8">
                      <div className="text-gray-500 mb-2">
                        {!address
                          ? "Connect wallet to place bets"
                          : "Market has ended"}
                      </div>
                      {!address && (
                        <button className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                          Connect Wallet
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Timeline */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-black">Timeline</h3>
                <button
                  onClick={() => setIsTimelineOpen(!isTimelineOpen)}
                  className="text-gray-400 hover:text-[#1249D8]"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={isTimelineOpen ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"}
                    />
                  </svg>
                </button>
              </div>
              {isTimelineOpen && (
                <div className="space-y-6 relative ml-2 mt-5">
                  {/* Timeline line */}
                  <div className="absolute left-[7.5px] top-2 bottom-8 h-auto w-0.5 bg-[#1249D8]"></div>

                  {/* Market published */}
                  <div className="flex">
                    <div className="relative z-10">
                      <div className="w-4 h-4 rounded-full bg-[#1249D8] flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-6">
                      <div className="text-base font-medium text-[#1249D8]">
                        Market published
                      </div>
                      <div className="text-sm text-gray-400">
                        {formatDate(publishTime)}
                      </div>
                    </div>
                  </div>

                  {/* Market closes */}
                  <div className="flex">
                    <div className="relative z-10">
                      <div className="w-4 h-4 rounded-full border border-[#1249D8] bg-white"></div>
                    </div>
                    <div className="ml-6">
                      <div className="text-base font-medium text-gray-500">
                        Market closes
                      </div>
                      <div className="text-sm text-gray-400">
                        {formatDate(market.endTime)}
                      </div>
                    </div>
                  </div>

                  {/* Resolution */}
                  <div className="flex">
                    <div className="relative z-10">
                      <div className="w-4 h-4 rounded-full border border-[#1249D8] bg-white"></div>
                    </div>
                    <div className="ml-6">
                      <div className="text-base font-medium text-gray-500">
                        Resolution
                      </div>
                      <div className="text-sm text-gray-400">
                        {formatDate(resolutionTime)} (within 24 hours after
                        close)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
