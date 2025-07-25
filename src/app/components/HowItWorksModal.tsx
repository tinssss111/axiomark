"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  ArrowRight,
  Wallet,
  TrendingUp,
  Eye,
  Gift,
} from "lucide-react";

const PREDICTION_MARKET_ADDRESS = "0x05339e5752689E17a180D7440e61D4191446b4D6";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowItWorksModal({
  isOpen,
  onClose,
}: HowItWorksModalProps) {
  const [currentStep, setCurrentStep] = useState(1);

  if (!isOpen) return null;

  const renderStep1 = () => (
    <div className="flex flex-col items-center">
      {/* Steps */}
      <div className="w-full max-w-md space-y-4">
        {[
          {
            step: "1",
            desc: "Click the link to open Blockscout",
            link: true,
          },
          {
            step: "2",
            title: "Find Approve Function",
            desc: "Locate the 'approve' function",
          },
          {
            step: "3",
            title: "Enter Details",
            desc: "Add spender address and value",
          },
          {
            step: "4",
            title: "Confirm Transaction",
            desc: "Connect wallet and confirm",
          },
        ].map((item, index) => (
          <div
            key={index}
            className="flex items-start space-x-4 p-4 bg-gray-100 rounded-2xl"
          >
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-sm shadow-2xl">
              {item.step}
            </div>
            <div className="flex-1">
              <h4 className="text-gray-800 font-bold mb-1">{item.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{item.desc}</p>
              {item.link && (
                <a
                  href="https://sepolia-blockscout.lisk.com/address/0x0E82fDDAd51cc3ac12b69761C45bBCB9A2Bf3C83?tab=read_write_proxy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-bold"
                >
                  {item.desc} <ArrowRight className="w-4 h-4 ml-1" />
                </a>
              )}
              {index === 2 && (
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold">Spender:</span>
                    <code className="bg-white px-2 py-1 font-bold rounded-md">
                      {PREDICTION_MARKET_ADDRESS}
                    </code>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold">Value:</span>
                    <code className="bg-white px-2 py-1 font-bold rounded-md">
                      1000000000000
                    </code>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => {
    const steps = [
      {
        icon: TrendingUp,
        title: "Market Prediction",
        desc: "Choose a market, check details and decide your prediction",
      },
      {
        icon: Wallet,
        title: "Place Bet",
        desc: "Select Yes/No, enter amount, confirm the transaction",
      },
      {
        icon: Eye,
        title: "Track",
        desc: "Monitor your predictions in 'Positions'",
      },
      {
        icon: Gift,
        title: "Claim Rewards",
        desc: "Rewards auto-sent if prediction is correct",
      },
    ];

    return (
      <div className="flex flex-col items-center">
        {/* Roadmap */}
        <div className="w-full max-w-lg">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-5 top-10 w-0.5 h-20 bg-gradient-to-b from-gray-200 to-gray-300"></div>
              )}

              {/* Step */}
              <div className="flex items-start space-x-5 mb-6 space-y-[49px]">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <step.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 pt-2">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    {index + 1}. {step.title}
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-[500px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Content */}
        <div className="mb-8">
          {currentStep === 1 ? renderStep1() : renderStep2()}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center space-x-2">
          {currentStep === 2 && (
            <button
              onClick={() => setCurrentStep(1)}
              className="w-1/2 py-2 rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
          )}
          {currentStep === 1 ? (
            <button
              onClick={() => setCurrentStep(2)}
              className="ml-auto w-full py-2 rounded-sm text-white bg-blue-600 transition-all shadow-lg"
            >
              Next
            </button>
          ) : (
            <button
              onClick={onClose}
              className="ml-auto w-1/2 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
