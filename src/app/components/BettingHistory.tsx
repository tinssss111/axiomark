/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { formatUnits, decodeEventLog, Abi, parseAbiItem } from "viem";
import { abi } from "../contract/abi";
import Blockies from "react-blockies";

interface BettingHistoryProps {
  marketId: string;
  contractAddress: string;
}

interface Bet {
  bettor: string;
  amount: string;
  timestamp: number;
  txHash: string;
  isYes: boolean;
}

interface BetPlacedEvent {
  marketId: bigint;
  bettor: string;
  isYes: boolean;
  amount: bigint;
}

interface BettorSummary {
  address: string;
  totalAmount: number;
}

const BettingHistory = ({ marketId, contractAddress }: BettingHistoryProps) => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("holders");
  const publicClient = usePublicClient();

  // Format wallet addresses for display (0x1234...5678)
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format numbers with k suffix for thousands
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + "k";
    }
    return num.toFixed(0);
  };

  useEffect(() => {
    const fetchBettingHistory = async () => {
      // If publicClient is not available, exit early
      if (!publicClient) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Define the BetPlaced event signature
        const betPlacedEvent = parseAbiItem(
          "event BetPlaced(uint256 indexed marketId, address indexed bettor, bool isYes, uint256 amount)"
        );

        // Get logs from the contract
        const logs = await publicClient.getLogs({
          address: contractAddress as `0x${string}`,
          event: betPlacedEvent,
          fromBlock: BigInt(0),
          toBlock: "latest",
          args: {
            marketId: BigInt(marketId),
          },
        });

        // Process the logs
        const processedLogs = await Promise.all(
          logs.map(async (log) => {
            // Decode the log
            const event = decodeEventLog({
              abi: abi as Abi,
              data: log.data,
              topics: log.topics,
            });

            // Get the block for timestamp
            const block = await publicClient.getBlock({
              blockHash: log.blockHash,
            });

            // Type assertion for event args
            const args = event.args as unknown as BetPlacedEvent;

            return {
              bettor: args.bettor,
              isYes: args.isYes,
              amount: formatUnits(args.amount, 6), // Assuming USDC with 6 decimals
              timestamp: Number(block.timestamp),
              txHash: log.transactionHash,
            };
          })
        );

        // Sort by timestamp (newest first)
        processedLogs.sort((a, b) => b.timestamp - a.timestamp);

        setBets(processedLogs);
      } catch (error) {
        console.error("Error fetching betting history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (marketId && contractAddress) {
      fetchBettingHistory();
    }
  }, [marketId, contractAddress, publicClient]);

  // Calculate analytics data
  const yesBets = bets.filter((bet) => bet.isYes);
  const noBets = bets.filter((bet) => !bet.isYes);

  // Count unique addresses (holders)
  const yesHolders = new Set(yesBets.map((bet) => bet.bettor)).size;
  const noHolders = new Set(noBets.map((bet) => bet.bettor)).size;

  // Calculate total amounts
  const yesOpenInterest = yesBets.reduce(
    (sum, bet) => sum + parseFloat(bet.amount),
    0
  );
  const noOpenInterest = noBets.reduce(
    (sum, bet) => sum + parseFloat(bet.amount),
    0
  );

  // Get top holders for each side
  const getTopHolders = (bets: Bet[]): BettorSummary[] => {
    const holdersMap = new Map<string, number>();

    bets.forEach((bet) => {
      const currentAmount = holdersMap.get(bet.bettor) || 0;
      holdersMap.set(bet.bettor, currentAmount + parseFloat(bet.amount));
    });

    // Convert map to array and sort by amount
    const holders = Array.from(holdersMap.entries()).map(
      ([address, totalAmount]) => ({
        address,
        totalAmount,
      })
    );

    // Sort by total amount (descending)
    holders.sort((a, b) => b.totalAmount - a.totalAmount);

    // Return top 5 holders
    return holders.slice(0, 5);
  };

  const topYesHolders = getTopHolders(yesBets);
  const topNoHolders = getTopHolders(noBets);

  // Generate random avatar colors for addresses
  const getAvatarColor = (address: string) => {
    // Simple hash function to generate consistent colors for the same address
    const hash = address.split("").reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    const hue = hash % 360;
    return `hsl(${hue}, 80%, 65%)`;
  };

  return (
    <div className="rounded-lg p-6 mb-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 ${
            activeTab === "holders"
              ? "border-b-2 border-blue-500 text-black"
              : "text-gray-400"
          }`}
          onClick={() => setActiveTab("holders")}
        >
          Holders
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "activity"
              ? "border-b-2 border-blue-500 text-black"
              : "text-gray-400"
          }`}
          onClick={() => setActiveTab("activity")}
        >
          Activity
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "news"
              ? "border-b-2 border-blue-500 text-black"
              : "text-gray-400"
          }`}
          onClick={() => setActiveTab("news")}
        >
          News
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="text-gray-400">Loading betting history...</div>
        </div>
      ) : (
        <>
          {/* Analytics Section */}
          <h2 className="text-2xl font-bold mb-6">Analytics</h2>

          {/* Summary Table */}
          <div className="mb-10">
            <div className="grid grid-cols-3 border-b border-gray-200 pb-2">
              <div className="text-gray-400 text-start">Outcomes</div>
              <div className="text-gray-400 text-center">Holders</div>
              <div className="text-gray-400 text-end">Amount</div>
            </div>

            {/* Yes Row */}
            <div className="grid grid-cols-3 border-b border-gray-200 py-4">
              <div className="text-green-400 text-start">Yes</div>
              <div className="text-center">{yesHolders}</div>
              <div className="flex items-center justify-end">
                {formatNumber(yesOpenInterest)}{" "}
                <img
                  src="https://gold-imperial-tuna-683.mypinata.cloud/ipfs/bafkreih2icosfr47htkxbfzxage54angvft275sdfrqudh37rrikftp6ri"
                  alt="USDC"
                  className="w-4 h-4 ml-1"
                />
              </div>
            </div>

            {/* No Row */}
            <div className="grid grid-cols-3 py-4">
              <div className="text-pink-500 text-start">No</div>
              <div className="text-center">{noHolders}</div>
              <div className="flex items-center justify-end">
                {formatNumber(noOpenInterest)}{" "}
                <img
                  src="https://gold-imperial-tuna-683.mypinata.cloud/ipfs/bafkreih2icosfr47htkxbfzxage54angvft275sdfrqudh37rrikftp6ri"
                  alt="USDC"
                  className="w-4 h-4 ml-1"
                />
              </div>
            </div>
          </div>

          {/* Top 20 Holders Section */}
          <h2 className="text-2xl font-bold mb-6">Top 20 Holders</h2>

          <div className="grid grid-cols-2 gap-6">
            {/* Yes Column */}
            <div>
              <div className="flex justify-between border-b border-gray-200 pb-2 mb-4">
                <div className="text-green-400">Yes</div>
                <div className="text-gray-400">Amount</div>
              </div>

              {topYesHolders.map((holder, index) => (
                <div
                  key={`yes-${index}`}
                  className="flex items-center justify-between py-4 border-b border-gray-200"
                >
                  <div className="flex items-center">
                    <Blockies
                      seed={holder.address.toLowerCase()}
                      size={10}
                      scale={3}
                      className="mr-2 rounded-full"
                    />
                    <div>
                      {holder.address.includes("0x")
                        ? formatAddress(holder.address)
                        : holder.address}
                    </div>
                  </div>
                  <div className="text-green-400 flex items-center font-bold">
                    {formatNumber(holder.totalAmount)}{" "}
                    <img
                      src="https://gold-imperial-tuna-683.mypinata.cloud/ipfs/bafkreih2icosfr47htkxbfzxage54angvft275sdfrqudh37rrikftp6ri"
                      alt="USDC"
                      className="w-4 h-4 ml-1"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* No Column */}
            <div>
              <div className="flex justify-between border-b border-gray-200 pb-2 mb-4">
                <div className="text-pink-500">No</div>
                <div className="text-gray-400">Amount</div>
              </div>

              {topNoHolders.map((holder, index) => (
                <div
                  key={`no-${index}`}
                  className="flex items-center justify-between py-4 border-b border-gray-200"
                >
                  <div className="flex items-center">
                    <Blockies
                      seed={holder.address.toLowerCase()}
                      size={10}
                      scale={3}
                      className="mr-2 rounded-full"
                    />
                    <div>
                      {holder.address.includes("0x")
                        ? formatAddress(holder.address)
                        : holder.address}
                    </div>
                  </div>
                  <div className="text-pink-500 flex items-center font-bold">
                    {formatNumber(holder.totalAmount)}{" "}
                    <img
                      src="https://gold-imperial-tuna-683.mypinata.cloud/ipfs/bafkreih2icosfr47htkxbfzxage54angvft275sdfrqudh37rrikftp6ri"
                      alt="USDC"
                      className="w-4 h-4 ml-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BettingHistory;
