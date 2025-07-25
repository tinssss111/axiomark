/* eslint-disable @next/next/no-img-element */
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

const CONTRACT_ADDRESS = "0x05339e5752689E17a180D7440e61D4191446b4D6";
const USDC_CONTRACT_ADDRESS = "0x0E82fDDAd51cc3ac12b69761C45bBCB9A2Bf3C83";

interface PlaceBetProps {
  marketId: number;
  onClose?: () => void;
}

export default function PlaceBet({ marketId, onClose }: PlaceBetProps) {
  const { address } = useAccount();
  const [selectedSide, setSelectedSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

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

  // Get winning ratios from contract
  const { data: winningRatios } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi,
    functionName: "getWinningRatios",
    args: [BigInt(marketId)],
  });

  // Calculate potential winnings to current bet
  const betAmount =
    amount && parseFloat(amount) > 0 ? parseUnits(amount, 6) : BigInt(0);

  const { data: yesWinnings } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi,
    functionName: "calculatePotentialWinnings",
    args: [BigInt(marketId), true, betAmount],
    query: {
      enabled: betAmount > 0,
    },
  });

  const { data: noWinnings } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi,
    functionName: "calculatePotentialWinnings",
    args: [BigInt(marketId), false, betAmount],
    query: {
      enabled: betAmount > 0,
    },
  });

  const userBalance = balance ? Number(balance) / 1e6 : 0;

  // Convert ratios from contract (scaled by 1e18) to display format
  const yesOdds =
    Array.isArray(winningRatios) && winningRatios.length > 0
      ? Number(winningRatios[0]) / 1e18
      : 1.0;
  const noOdds =
    Array.isArray(winningRatios) && winningRatios.length > 1
      ? Number(winningRatios[1]) / 1e18
      : 1.0;

  // Convert potential winnings from wei to USDC
  const yesPotentialWinnings = yesWinnings ? Number(yesWinnings) / 1e6 : 0;
  const noPotentialWinnings = noWinnings ? Number(noWinnings) / 1e6 : 0;

  const handleAmountClick = (value: string) => {
    if (value === "Max") {
      setAmount(userBalance.toString());
    } else {
      const numValue = parseFloat(value.replace("+$", ""));
      const currentAmount = parseFloat(amount) || 0;
      setAmount((currentAmount + numValue).toString());
    }
  };

  const placeBet = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      setIsProcessing(true);
      const amountInWei = parseUnits(amount, 6); // USDC has 6 decimals
      const isYesBet = selectedSide === "yes";

      writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: "placeBet",
        args: [BigInt(marketId), isYesBet, amountInWei],
      });
    } catch (err) {
      console.error("Error placing bet:", err);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      setIsProcessing(false);
    }
  }, [isConfirmed]);

  // Success state
  if (isConfirmed) {
    return (
      <div className="rounded-2xl max-w-md mx-auto bg-white border border-gray-200 p-6">
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
          <h3 className="text-xl font-bold mb-2 text-gray-900">
            Trade successful!
          </h3>
          <p className="text-gray-600 mb-6">
            Your credit has been created and confirmed on the blockchain.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Position</span>
                <span className="font-medium capitalize text-gray-900">
                  {selectedSide}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium text-gray-900">${amount}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className={`${
                onClose ? "flex-1" : "w-full"
              } bg-[#1249D8] text-white py-3 px-4 rounded-xl hover:bg-blue-600 transition-colors font-medium`}
            >
              Trade again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 border border-gray-200 max-w-md mx-auto bg-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-gray-900">Your Prediction</h2>
        <div className="flex items-center justify-between">
          <span className="font-bold">Balance: </span>
          <span className="flex items-center justify-between">
            {userBalance.toFixed(2)}
            <img
              src="https://gold-imperial-tuna-683.mypinata.cloud/ipfs/bafkreih2icosfr47htkxbfzxage54angvft275sdfrqudh37rrikftp6ri"
              alt="USDC"
              className="w-4 h-4 ml-1"
            />
          </span>
        </div>
      </div>{" "}
      {/* Yes/No Selection */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setSelectedSide("yes")}
          className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-colors ${
            selectedSide === "yes"
              ? "bg-[#30A159] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <div>Yes</div>
        </button>
        <button
          onClick={() => setSelectedSide("no")}
          className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-colors ${
            selectedSide === "no"
              ? "bg-[#E23939] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <div>No</div>
        </button>
      </div>
      {/* Amount Section */}
      <div className="mb-6">
        {/* Amount Display */}
        <div className="text-center flex mb-4">
          <label className="block text-gray-500 mb-4 text-lg">Amount</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder="0"
            className="bg-transparent text-4xl font-bold text-end w-full text-gray-900 focus:outline-none"
          />
        </div>
        {/* Quick Amount Buttons - Hidden when input is focused */}
        {!isInputFocused && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            <button
              onClick={() => handleAmountClick("+$1")}
              className="bg-gray-100 text-[#1249D8] py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              +$1
            </button>
            <button
              onClick={() => handleAmountClick("+$20")}
              className="bg-gray-100 text-[#1249D8] py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              +$20
            </button>
            <button
              onClick={() => handleAmountClick("+$100")}
              className="bg-gray-100 text-[#1249D8] py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              +$100
            </button>
            <button
              onClick={() => handleAmountClick("Max")}
              className="bg-gray-100 text-[#1249D8] py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Max
            </button>
          </div>
        )}
      </div>
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex">
            <svg
              className="w-5 h-5 text-red-500 mt-0.5 mr-3"
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
              <h4 className="text-red-600 font-medium">Transaction failed</h4>
              <p className="text-red-500 text-sm mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      )}
      {/* Potential Winnings Display */}
      {amount && parseFloat(amount) > 0 && (
        <div className="text-start mb-4">
          <p className="text-gray-600 flex items-center justify-between">
            Potential Winnings:{" "}
            <span className="font-bold text-green-500 flex items-center justify-between">
              {(selectedSide === "yes"
                ? yesPotentialWinnings
                : noPotentialWinnings
              ).toFixed(2)}{" "}
              <img
                src="https://gold-imperial-tuna-683.mypinata.cloud/ipfs/bafkreih2icosfr47htkxbfzxage54angvft275sdfrqudh37rrikftp6ri"
                alt="USDC"
                className="w-4 h-4 ml-1"
              />
            </span>
          </p>
        </div>
      )}
      {/* Place Order Button */}
      <button
        onClick={placeBet}
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
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-blue-500 text-white hover:bg-blue-600"
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
    </div>
  );
}
