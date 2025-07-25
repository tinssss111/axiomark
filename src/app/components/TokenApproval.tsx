"use client";

import React, { useState, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useAccount,
} from "wagmi";
import { approval } from "../contract/approval";
import { parseUnits, formatUnits } from "viem";

const USDC_CONTRACT_ADDRESS = "0xb3bB7B57333d169517F5B84F4067E308d5B6324e";
const PREDICTION_MARKET_ADDRESS = "0x05339e5752689E17a180D7440e61D4191446b4D6";

interface TokenApprovalProps {
  amount: string;
  onApprovalSuccess?: () => void;
  onClose?: () => void;
}

export default function TokenApproval({
  amount,
  onApprovalSuccess,
  onClose,
}: TokenApprovalProps) {
  const { address } = useAccount();
  const [approvalAmount, setApprovalAmount] = useState(amount);
  const [isApproving, setIsApproving] = useState(false);

  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Check current allowance
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract(
    {
      address: USDC_CONTRACT_ADDRESS as `0x${string}`,
      abi: approval,
      functionName: "allowance",
      args: address
        ? [address, PREDICTION_MARKET_ADDRESS as `0x${string}`]
        : undefined,
    }
  );

  // Check user's USDC balance
  const { data: userBalance } = useReadContract({
    address: USDC_CONTRACT_ADDRESS as `0x${string}`,
    abi: approval,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  useEffect(() => {
    if (isConfirmed) {
      refetchAllowance();
      if (onApprovalSuccess) {
        onApprovalSuccess();
      }
    }
  }, [isConfirmed, refetchAllowance, onApprovalSuccess]);

  const handleApprove = async () => {
    if (!approvalAmount || parseFloat(approvalAmount) <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    try {
      setIsApproving(true);
      // Convert amount to wei (USDC has 6 decimals)
      const amountInWei = parseUnits(approvalAmount, 6);

      writeContract({
        address: USDC_CONTRACT_ADDRESS as `0x${string}`,
        abi: approval,
        functionName: "approve",
        args: [PREDICTION_MARKET_ADDRESS as `0x${string}`, amountInWei],
      });
    } catch (err) {
      console.error("Error approving token:", err);
      setIsApproving(false);
    }
  };

  const handleApproveMax = async () => {
    try {
      setIsApproving(true);
      // Approve maximum amount (2^256 - 1)
      const maxAmount = BigInt(
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      );

      writeContract({
        address: USDC_CONTRACT_ADDRESS as `0x${string}`,
        abi: approval,
        functionName: "approve",
        args: [PREDICTION_MARKET_ADDRESS as `0x${string}`, maxAmount],
      });
    } catch (err) {
      console.error("Error approving max token:", err);
      setIsApproving(false);
    }
  };

  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return "0";
    return formatUnits(balance, 6);
  };

  const formatAllowance = (allowance: bigint | undefined) => {
    if (!allowance) return "0";
    return formatUnits(allowance, 6);
  };

  const isAllowanceSufficient = () => {
    if (!currentAllowance || !approvalAmount) return false;
    const requiredAmount = parseUnits(approvalAmount, 6);
    return Number(currentAllowance) >= Number(requiredAmount);
  };

  const hasInsufficientBalance = () => {
    if (!userBalance || !approvalAmount) return false;
    const requiredAmount = parseUnits(approvalAmount, 6);
    return Number(userBalance) < Number(requiredAmount);
  };

  if (isConfirmed) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Approval thành công!
          </h3>
          <p className="text-gray-600 mb-4">
            Bạn đã cho phép sử dụng USDC để đặt cược.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={onApprovalSuccess}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tiếp tục đặt cược
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Token Approval</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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

      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            📋 Thông tin
          </h4>
          <p className="text-sm text-blue-800">
            Để đặt cược, bạn cần cho phép smart contract sử dụng USDC của bạn.
            Đây là bước bảo mật cần thiết trong DeFi.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-gray-500 block">Số dư USDC</span>
            <div className="font-bold text-lg">
              {formatBalance(userBalance as bigint)}
            </div>
            <span className="text-xs text-gray-400">USDC</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-gray-500 block">Allowance hiện tại</span>
            <div className="font-bold text-lg">
              {formatAllowance(currentAllowance as bigint)}
            </div>
            <span className="text-xs text-gray-400">USDC</span>
          </div>
        </div>

        <div>
          <label
            htmlFor="approvalAmount"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Số tiền cần approve (USDC)
          </label>
          <input
            type="number"
            id="approvalAmount"
            value={approvalAmount}
            onChange={(e) => setApprovalAmount(e.target.value)}
            placeholder="Nhập số tiền"
            step="0.01"
            min="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {hasInsufficientBalance() && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">
              ⚠️ Số dư USDC không đủ. Bạn cần có ít nhất {approvalAmount} USDC.
            </p>
          </div>
        )}

        {isAllowanceSufficient() && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-600 text-sm">
              ✅ Allowance đã đủ để thực hiện giao dịch này.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">
              <strong>Lỗi:</strong> {error.message}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleApprove}
            disabled={
              isPending ||
              isConfirming ||
              hasInsufficientBalance() ||
              isAllowanceSufficient()
            }
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isPending || isConfirming ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {isPending ? "Đang gửi..." : "Đang xác nhận..."}
              </div>
            ) : (
              `Approve ${approvalAmount || "0"} USDC`
            )}
          </button>

          <button
            onClick={handleApproveMax}
            disabled={isPending || isConfirming || hasInsufficientBalance()}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isPending || isConfirming ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {isPending ? "Đang gửi..." : "Đang xác nhận..."}
              </div>
            ) : (
              "🚀 Approve Max (Unlimited)"
            )}
          </button>
        </div>

        <div className="flex gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        🔒 Giao dịch approval an toàn và có thể thu hồi bất cứ lúc nào.
      </div>
    </div>
  );
}
