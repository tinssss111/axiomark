"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useReadContract, useAccount } from "wagmi";
import { formatUnits, type Abi } from "viem";
import { abi } from "../../contract/abi";
import { Header } from "../../components/Header";
import PlaceBet from "../../components/PlaceBet";

const CONTRACT_ADDRESS = "0x69113555Fb6df34167ea33eeD1db9eEd265a6127";

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

export default function MarketDetail() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const marketId = params.id as string;

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

  const market = marketData as MarketDetails;
  const userBetData = userBets as UserBets;

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
    return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculatePercentage = (amount: bigint, total: bigint) => {
    if (total === BigInt(0)) return 0;
    return Number((amount * BigInt(100)) / total);
  };

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

  const status = getMarketStatus();
  const yesPercentage = calculatePercentage(
    market.totalYesBets,
    market.totalPool
  );
  const noPercentage = calculatePercentage(
    market.totalNoBets,
    market.totalPool
  );

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Divider */}
      <div className="w-full h-px bg-gray-200"></div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="mb-8 flex items-center text-gray-600 hover:text-black transition-colors group"
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
          Back to Markets
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market header */}
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-black mb-4 leading-tight">
                    {market.question}
                  </h1>
                  <div className="flex items-center space-x-6 mb-6">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-medium border ${
                        status.color === "text-black"
                          ? "bg-black text-white border-black"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {status.text}
                    </span>
                    <span className="text-gray-500 text-sm font-mono">
                      Market #{marketId}
                    </span>
                  </div>
                </div>
                {market.image && (
                  <img
                    src={market.image}
                    alt="Market"
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200 ml-6"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                <div>
                  <span className="text-gray-500 text-sm font-medium block mb-1">
                    End Time
                  </span>
                  <div className="text-lg font-semibold text-black">
                    {formatDate(market.endTime)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm font-medium block mb-1">
                    Total Pool
                  </span>
                  <div className="text-2xl font-bold text-black">
                    ${formatUnits(market.totalPool, 6)} USDC
                  </div>
                </div>
              </div>
            </div>

            {/* Betting Stats */}
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-black mb-6">
                Betting Pool Distribution
              </h2>

              <div className="space-y-6">
                {/* Yes pool */}
                <div className="border border-gray-200 rounded-lg p-6 hover:border-black transition-colors">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-black rounded-full mr-3"></div>
                      <span className="font-semibold text-black text-lg">
                        YES Bets
                      </span>
                    </div>
                    <span className="text-black font-bold text-xl">
                      ${formatUnits(market.totalYesBets, 6)} USDC
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-black h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${yesPercentage}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    {yesPercentage.toFixed(1)}% of total pool
                  </div>
                </div>

                {/* No pool */}
                <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-400 rounded-full mr-3"></div>
                      <span className="font-semibold text-black text-lg">
                        NO Bets
                      </span>
                    </div>
                    <span className="text-black font-bold text-xl">
                      ${formatUnits(market.totalNoBets, 6)} USDC
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-400 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${noPercentage}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    {noPercentage.toFixed(1)}% of total pool
                  </div>
                </div>
              </div>
            </div>

            {/* User's bets */}
            {address && userBetData && (
              <div className="bg-white border border-gray-200 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-black mb-6">
                  Your Positions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-500 mb-2 font-medium">
                      YES Position
                    </div>
                    <div className="text-2xl font-bold text-black">
                      ${formatUnits(userBetData[0], 6)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">USDC</div>
                  </div>
                  <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-500 mb-2 font-medium">
                      NO Position
                    </div>
                    <div className="text-2xl font-bold text-black">
                      ${formatUnits(userBetData[1], 6)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">USDC</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Place bet section */}
              {!market.resolved && !market.canceled && address ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-black mb-4">
                    Place Bet
                  </h3>
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

              {/* Market info */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-black mb-4">
                  Market Information
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-500 font-medium">Market ID</span>
                    <span className="font-mono text-black">#{marketId}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-500 font-medium">Status</span>
                    <span className={`font-semibold ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-500 font-medium">
                      Total Bets
                    </span>
                    <span className="font-semibold text-black">
                      ${formatUnits(market.totalPool, 6)} USDC
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-500 font-medium">End Time</span>
                    <span className="font-semibold text-black text-sm">
                      {formatDate(market.endTime)}
                    </span>
                  </div>
                  {market.resolved && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-500 font-medium">
                        Final Price
                      </span>
                      <span className="font-semibold text-black">
                        ${formatUnits(market.finalPrice, 8)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
