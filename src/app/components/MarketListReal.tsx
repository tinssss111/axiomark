/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { formatUnits, type Abi } from "viem";
import { abi } from "../contract/abi";
import { useRouter } from "next/navigation";

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

interface Market {
  id: number;
  details: MarketDetails;
}

export const MarketListReal = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [marketIds, setMarketIds] = useState<number[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null);
  const [showPlaceBet, setShowPlaceBet] = useState(false);
  const router = useRouter();

  // Get total market count
  const { data: marketCount, isLoading: isLoadingCount } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: abi as Abi,
    functionName: "marketCount",
  });

  // Create market IDs list when marketCount is available
  useEffect(() => {
    if (marketCount && Number(marketCount) > 0) {
      const ids = Array.from({ length: Number(marketCount) }, (_, i) => i + 1);
      setMarketIds(ids);
    }
  }, [marketCount]);

  // Get details of all markets at once
  const { data: marketsData, isLoading: isLoadingMarkets } = useReadContracts({
    contracts: marketIds.map((id) => ({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: abi as Abi,
      functionName: "getMarketDetails",
      args: [BigInt(id)],
    })),
    query: {
      enabled: marketIds.length > 0,
    },
  });

  // Process data when results are available
  useEffect(() => {
    if (marketsData && marketIds.length > 0) {
      const processedMarkets: Market[] = [];

      marketsData.forEach((result, index) => {
        if (result.status === "success" && result.result) {
          const details = result.result as MarketDetails;
          processedMarkets.push({
            id: marketIds[index],
            details,
          });
        }
      });

      setMarkets(processedMarkets);
    }
  }, [marketsData, marketIds]);
  const getMarketStatus = (market: Market) => {
    const now = Date.now() / 1000;
    const endTime = Number(market.details.endTime);

    if (market.details.canceled)
      return {
        text: "Canceled",
        color: "text-gray-500",
        bgColor: "bg-gray-100",
      };
    if (market.details.resolved) {
      const outcomeText = market.details.outcome ? "Result: Yes" : "Result: No";
      return {
        text: outcomeText,
        color: "text-green-600",
        bgColor: "bg-green-100",
      };
    }
    if (endTime < now)
      return {
        text: "Awaiting Result",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
      };
    return {
      text: "Active",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    };
  };

  const isLoading = isLoadingCount || isLoadingMarkets;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 h-[240px] flex flex-col animate-pulse"
            >
              {/* Header with Avatar and Question */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Skeleton */}
              <div className="space-y-2 mb-3">
                <div className="w-full h-12 bg-gray-200 rounded-xl"></div>
                <div className="w-full h-12 bg-gray-200 rounded-xl"></div>
              </div>

              {/* Footer Skeleton */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="w-4 h-4 bg-gray-200 rounded ml-1"></div>
                </div>
                <div className="flex gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {markets.map((market) => {
          const status = getMarketStatus(market);
          const totalPoolUsdc = parseFloat(
            formatUnits(market.details.totalPool, 6)
          );

          return (
            <div
              key={market.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200 p-4 h-[240px] flex flex-col cursor-pointer"
              onClick={() => router.push(`/market/${market.id}`)}
            >
              {/* Header with Avatar and Percentage */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    {market.details.image ? (
                      <img
                        src={market.details.image}
                        alt="Market"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/banner/fed.jpeg";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        $
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2">
                    {market.details.question}
                  </h3>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 mb-3">
                {!market.details.resolved && !market.details.canceled ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMarketId(market.id);
                        setShowPlaceBet(true);
                      }}
                      className="w-full bg-green-100 hover:bg-green-200 text-green-700 py-3 px-4 rounded-sm text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      Buy Yes ↗
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMarketId(market.id);
                        setShowPlaceBet(true);
                      }}
                      className="w-full bg-red-100 hover:bg-red-200 text-red-700 py-3 px-4 rounded-sm text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      Buy No ↘
                    </button>
                  </>
                ) : (
                  <div
                    className={`w-full py-3 px-4 rounded-xl text-sm font-medium text-center ${status.color} ${status.bgColor}`}
                  >
                    {status.text}
                  </div>
                )}
              </div>

              {/* Footer with Volume and Icons */}
              <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-3">
                <div className="flex items-center gap-1">
                  <img
                    src="https://gold-imperial-tuna-683.mypinata.cloud/ipfs/bafkreih2icosfr47htkxbfzxage54angvft275sdfrqudh37rrikftp6ri"
                    alt=""
                    className="w-4 h-4"
                  />
                  <span>
                    $
                    {totalPoolUsdc > 1000
                      ? Math.round(totalPoolUsdc / 1000) + "k"
                      : totalPoolUsdc.toFixed(0)}{" "}
                    Vol
                  </span>
                  <svg
                    className="w-4 h-4 ml-1"
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
                </div>
                <div className="flex gap-2 text-gray-400">
                  <button className="hover:text-gray-600 transition-colors">
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
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                      />
                    </svg>
                  </button>
                  <button className="hover:text-gray-600 transition-colors">
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
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketListReal;
