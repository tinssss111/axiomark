"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { approval } from "../contract/approval";
import ApprovalModal from "./ApprovalModal";

const USDC_CONTRACT_ADDRESS = "0xB7954A5343c4EE121e61409c19B013724a25f95B";
const PREDICTION_MARKET_ADDRESS = "0x69113555Fb6df34167ea33eeD1db9eEd265a6127";

interface WalletConnectionHandlerProps {
  children: React.ReactNode;
}

export default function WalletConnectionHandler({
  children,
}: WalletConnectionHandlerProps) {
  const { address, isConnected } = useAccount();
  const [showWelcomeApproval, setShowWelcomeApproval] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  // Check current allowance
  const { data: currentAllowance } = useReadContract({
    address: USDC_CONTRACT_ADDRESS as `0x${string}`,
    abi: approval,
    functionName: "allowance",
    args: address
      ? [address, PREDICTION_MARKET_ADDRESS as `0x${string}`]
      : undefined,
  });

  // Check user's USDC balance
  const { data: userBalance } = useReadContract({
    address: USDC_CONTRACT_ADDRESS as `0x${string}`,
    abi: approval,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  useEffect(() => {
    // When wallet is connected for the first time
    if (isConnected && address && !hasShownWelcome) {
      // Check if user has USDC balance and no allowance
      if (userBalance && Number(userBalance) > 0 && (!currentAllowance || Number(currentAllowance) === 0)) {
        setShowWelcomeApproval(true);
      }
      setHasShownWelcome(true);
    }
  }, [isConnected, address, userBalance, currentAllowance, hasShownWelcome]);

  // Reset when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setHasShownWelcome(false);
      setShowWelcomeApproval(false);
    }
  }, [isConnected]);

  const handleWelcomeApprovalSuccess = () => {
    setShowWelcomeApproval(false);
  };

  const handleCloseWelcomeApproval = () => {
    setShowWelcomeApproval(false);
  };

  return (
    <>
      {children}
      
      {/* Welcome Approval Modal */}
      <ApprovalModal
        isOpen={showWelcomeApproval}
        onClose={handleCloseWelcomeApproval}
        onApprovalSuccess={handleWelcomeApprovalSuccess}
        requiredAmount="100"
      />
    </>
  );
}