/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import HowItWorksModal from "./HowItWorksModal";

export const Header = () => {
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  return (
    <header className="bg-white text-gray-900 container mx-auto py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8">
            <img src="/logo/logo-nb.png" alt="Axiomark Logo" />
          </div>
          <span className="text-[23px] font-bold text-gray-900">Axiomark</span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Axiomark"
              className="w-full bg-gray-100 text-gray-900 px-4 py-2 pl-10 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-8">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            Markets
          </Link>
          <Link
            href="/create-market"
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            Create Market
          </Link>
          <a
            href="#"
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            Leaderboard
          </a>
          <button
            onClick={() => setShowHowItWorksModal(true)}
            className="text-blue-400 hover:text-blue-300 transition-colors font-bold"
          >
            How It Works
          </button>
          <HowItWorksModal
            isOpen={showHowItWorksModal}
            onClose={() => setShowHowItWorksModal(false)}
          />
        </nav>

        <div className="ml-8">
          <ConnectButton showBalance={false} />
        </div>
      </div>
    </header>
  );
};
