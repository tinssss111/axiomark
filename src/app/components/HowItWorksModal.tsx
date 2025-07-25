"use client";

import React from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { approval } from "../contract/approval";
import { parseUnits } from "viem";

const USDC_CONTRACT_ADDRESS = "0x0E82fDDAd51cc3ac12b69761C45bBCB9A2Bf3C83";
const PREDICTION_MARKET_ADDRESS = "0x05339e5752689E17a180D7440e61D4191446b4D6";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprovalSuccess?: () => void;
}

export default function HowItWorksModal({
  isOpen,
  onClose,
  onApprovalSuccess,
}: HowItWorksModalProps) {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const handleApprove = async () => {
    try {
      // Approve 1 million USDC (with 6 decimals)
      const amountInWei = parseUnits("1000000", 6);

      writeContract({
        address: USDC_CONTRACT_ADDRESS as `0x${string}`,
        abi: approval,
        functionName: "approve",
        args: [PREDICTION_MARKET_ADDRESS as `0x${string}`, amountInWei],
      });
    } catch (err) {
      console.error("Error approving token:", err);
    }
  };

  React.useEffect(() => {
    if (isConfirmed && onApprovalSuccess) {
      onApprovalSuccess();
    }
  }, [isConfirmed, onApprovalSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-gray-800 rounded-2xl shadow-lg p-6 max-w-lg w-full text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-lime-500">How It Works</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Approve USDC Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4 text-lime-400">Approve USDC</h3>
          <p className="text-gray-300 mb-4">
            Before placing bets, you need to approve USDC spending. This is a
            one-time approval for 1 million USDC.
          </p>
          <button
            onClick={handleApprove}
            disabled={isPending || isConfirming || isConfirmed}
            className={`w-full py-3 px-4 rounded-xl font-bold text-lg transition-colors ${
              isPending || isConfirming
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : isConfirmed
                ? "bg-green-600 text-black"
                : "bg-lime-500 text-black hover:bg-lime-400"
            }`}
          >
            {isPending || isConfirming ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                {isPending ? "Approving..." : "Confirming..."}
              </div>
            ) : isConfirmed ? (
              "Approved ✓"
            ) : (
              "Approve USDC"
            )}
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-2 text-lime-400">
              1. Market Prediction
            </h3>
            <p className="text-gray-300">
              Choose a prediction market from the available list. Each market
              includes a description, end time, and total betting value.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-2 text-lime-400">
              2. Place Your Bet
            </h3>
            <p className="text-gray-300">
              Select &quot;Yes&quot; or &quot;No&quot; based on your prediction
              of the event outcome. Enter your desired bet amount and confirm
              the transaction.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-2 text-lime-400">
              3. Track Positions
            </h3>
            <p className="text-gray-300">
              Monitor your betting positions in the &quot;Positions&quot;
              section. You can view all active predictions and betting history.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-2 text-lime-400">
              4. Claim Rewards
            </h3>
            <p className="text-gray-300">
              When the market ends and the result is determined, rewards will be
              automatically transferred to your wallet if your prediction was
              correct.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl font-bold text-lg transition-colors bg-lime-500 text-black hover:bg-lime-400"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
