"use client";

import React, { useState, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useAccount,
} from "wagmi";
import { abi } from "../contract/abi";
import { approval } from "../contract/approval";
import { parseUnits } from "viem";
import ApprovalModal from "./ApprovalModal";

const CONTRACT_ADDRESS = "0x69113555Fb6df34167ea33eeD1db9eEd265a6127";
const USDC_CONTRACT_ADDRESS = "0xB7954A5343c4EE121e61409c19B013724a25f95B";

interface PlaceBetProps {
  marketId: number;
  onClose?: () => void;
}

export default function PlaceBet({ marketId, onClose }: PlaceBetProps) {
  const { address } = useAccount();
  const [selectedSide, setSelectedSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Get user's USDC balance
  const { data: balance } = useReadContract({
    address: USDC_CONTRACT_ADDRESS as `0x${string}`,
    abi: approval,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Check current allowance
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract(
    {
      address: USDC_CONTRACT_ADDRESS as `0x${string}`,
      abi: approval,
      functionName: "allowance",
      args: address
        ? [address, CONTRACT_ADDRESS as `0x${string}`]
        : undefined,
    }
  );

  const userBalance = balance ? Number(balance) / 1e6 : 0;

  const handleAmountClick = (value: string) => {
    if (value === "Max") {
      setAmount(userBalance.toString());
    } else {
      const numValue = parseFloat(value.replace("+$", ""));
      const currentAmount = parseFloat(amount) || 0;
      setAmount((currentAmount + numValue).toString());
    }
  };

  const checkAllowanceAndPlaceBet = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    const amountInWei = parseUnits(amount, 6);
    
    // Check if allowance is sufficient
    if (!currentAllowance || Number(currentAllowance) < Number(amountInWei)) {
      setShowApprovalModal(true);
      return;
    }

    // If allowance is sufficient, place bet directly
    placeBet();
  };

  const placeBet = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    try {
      setIsProcessing(true);
      const amountInWei = parseUnits(amount, 6);
      const isYesBet = selectedSide === "yes";

      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: "placeBet",
        args: [BigInt(marketId), isYesBet, amountInWei],
      });
    } catch (err) {
      console.error("Error placing bet:", err);
      setIsProcessing(false);
    }
  };

  const handleApprovalSuccess = () => {
    setShowApprovalModal(false);
    refetchAllowance();
    // After approval, place bet automatically
    setTimeout(() => {
      placeBet();
    }, 1000);
  };

  useEffect(() => {
    if (isConfirmed) {
      setIsProcessing(false);
    }
  }, [isConfirmed]);

  // Success state
  if (isConfirmed) {
    return (
      <div className="rounded-2xl p-6 max-w-md mx-auto text-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Trade successful!</h3>
          <p className="text-gray-300 mb-6">
            Your position has been created and confirmed on the blockchain.
          </p>
          <div className="bg-gray-700 rounded-xl p-4 mb-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Position</span>
                <span className="font-medium capitalize">{selectedSide}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount</span>
                <span className="font-medium">${amount}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-xl hover:bg-gray-500 transition-colors font-medium"
              >
                Close
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className={`${
                onClose ? "flex-1" : "w-full"
              } bg-blue-500 text-black py-3 px-4 rounded-xl hover:bg-blue-400 transition-colors font-medium`}
            >
              Trade again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Your Prediction</h2>
        <span className="text-gray-400">
          Balance: {userBalance.toFixed(0)} USDC
        </span>
      </div>

      {/* Yes/No Selection */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setSelectedSide("yes")}
          className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-colors ${
            selectedSide === "yes"
              ? "bg-blue-400 text-black"
              : "bg-gray-600 text-gray-300 hover:bg-gray-500"
          }`}
        >
          Yes
        </button>
        <button
          onClick={() => setSelectedSide("no")}
          className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-colors ${
            selectedSide === "no"
              ? "bg-blue-400 text-black"
              : "bg-gray-600 text-gray-300 hover:bg-gray-500"
          }`}
        >
          No
        </button>
      </div>

      {/* Amount Section */}
      <div className="mb-6">
        <label className="block text-gray-400 mb-4 text-lg">Amount</label>

        {/* Amount Display */}
        <div className="text-center flex mb-6">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="bg-transparent text-4xl font-bold text-center w-full text-gray-800 focus:outline-none"
          />
          <span className="text-4xl font-bold text-gray-800 ml-2">USDC</span>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => handleAmountClick("+$1")}
            className="bg-gray-700 text-blue-400 py-3 px-4 rounded-xl hover:bg-gray-600 transition-colors font-medium"
          >
            +$1
          </button>
          <button
            onClick={() => handleAmountClick("+$20")}
            className="bg-gray-700 text-blue-400 py-3 px-4 rounded-xl hover:bg-gray-600 transition-colors font-medium"
          >
            +$20
          </button>
          <button
            onClick={() => handleAmountClick("+$100")}
            className="bg-gray-700 text-blue-400 py-3 px-4 rounded-xl hover:bg-gray-600 transition-colors font-medium"
          >
            +$100
          </button>
          <button
            onClick={() => handleAmountClick("Max")}
            className="bg-gray-700 text-blue-400 py-3 px-4 rounded-xl hover:bg-gray-600 transition-colors font-medium"
          >
            Max
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/30 border border-red-500 rounded-xl p-4 mb-6">
          <div className="flex">
            <svg
              className="w-5 h-5 text-red-400 mt-0.5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="text-red-400 font-medium">Transaction failed</h4>
              <p className="text-red-300 text-sm mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Place Order Button */}
      <button
        onClick={checkAllowanceAndPlaceBet}
        disabled={
          !amount ||
          parseFloat(amount) <= 0 ||
          isPending ||
          isConfirming ||
          isProcessing
        }
        className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-colors ${
          !amount ||
          parseFloat(amount) <= 0 ||
          isPending ||
          isConfirming ||
          isProcessing
            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
            : "bg-lime-500 text-black hover:bg-lime-400"
        }`}
      >
        {isPending || isConfirming || isProcessing ? (
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
            {isPending || isProcessing ? "Confirming..." : "Processing..."}
          </div>
        ) : (
          "Place order"
        )}
      </button>

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        onApprovalSuccess={handleApprovalSuccess}
        requiredAmount={amount}
      />

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
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
      )}
    </div>
  );
}
