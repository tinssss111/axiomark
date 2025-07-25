"use client";

import React, { useEffect } from "react";

const PREDICTION_MARKET_ADDRESS = "0x05339e5752689E17a180D7440e61D4191446b4D6";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowItWorksModal({
  isOpen,
  onClose,
}: HowItWorksModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 bg-opacity-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-5 max-w-xl w-full space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl text-gray-800 font-bold">How It Works</h2>
        </div>

        {/* Approve Section */}
        <div>
          <h3 className="text-lg font-bold text-blue-600 mb-2">Approve USDC</h3>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-3 text-sm text-gray-700">
            <p>Before betting, approve USDC for spending:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Open{" "}
                <a
                  href="https://sepolia-blockscout.lisk.com/address/0x0E82fDDAd51cc3ac12b69761C45bBCB9A2Bf3C83?tab=read_write_proxy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  this contract
                </a>{" "}
                on Blockscout.
              </li>
              <li>
                Find the <strong>&quot;approve&quot;</strong> function.
              </li>
              <li>Enter:</li>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>spender</strong>:{" "}
                  <code className="bg-gray-100 px-1 py-0.5 rounded">
                    {PREDICTION_MARKET_ADDRESS}
                  </code>
                </li>
                <li>
                  <strong>value</strong>:{" "}
                  <code className="bg-gray-100 px-1 py-0.5 rounded">
                    1000000000000
                  </code>{" "}
                  (1M USDC)
                </li>
              </ul>
              <li>Connect wallet and confirm.</li>
              <li>Return here once confirmed.</li>
            </ol>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h4 className="text-blue-600">1. Market Prediction</h4>
            <p>Choose a market, check details and decide your prediction.</p>
          </div>
          <div>
            <h4 className=" text-blue-600">2. Place Bet</h4>
            <p>Select Yes/No, enter amount, confirm the transaction.</p>
          </div>
          <div>
            <h4 className=" text-blue-600">3. Track</h4>
            <p>Monitor your predictions in &quot;Positions&quot;.</p>
          </div>
          <div>
            <h4 className=" text-blue-600">4. Claim Rewards</h4>
            <p>Rewards auto-sent if prediction is correct.</p>
          </div>
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="w-full py-2 px-4 rounded-xl text-white bg-blue-600 hover:bg-blue-700 text-center"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
