"use client";

import React, { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Header } from "../components/Header";
import { abi } from "../contract/abi";

const CONTRACT_ADDRESS = "0x05339e5752689E17a180D7440e61D4191446b4D6";

export default function CreateMarket() {
  const [formData, setFormData] = useState({
    question: "",
    endTime: "",
    image: "",
    priceFeedAddress: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const { writeContract, data: hash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question || !formData.endTime || !formData.priceFeedAddress) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);

      // Convert endTime to timestamp
      const endTimeTimestamp = Math.floor(
        new Date(formData.endTime).getTime() / 1000
      );

      writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: "createMarket",
        args: [
          formData.question,
          BigInt(endTimeTimestamp),
          formData.image || "",
          formData.priceFeedAddress as `0x${string}`,
        ],
      });
    } catch (err) {
      console.error("Error creating market:", err);
      alert("An error occurred while creating the market");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      question: "",
      endTime: "",
      image: "",
      priceFeedAddress: "",
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="w-full h-px bg-black mb-8"></div>

      <div className="container mx-auto px-4 py-8 max-w-xl">
        <div className="border border-black p-6">
          <h1 className="text-2xl font-semibold text-black mb-6 text-center">
            Create New Market
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Question Field */}
            <div>
              <label
                htmlFor="question"
                className="block text-sm font-medium text-black mb-1"
              >
                Prediction Question *
              </label>
              <textarea
                id="question"
                name="question"
                value={formData.question}
                onChange={handleInputChange}
                placeholder="Example: Will Bitcoin reach $100,000 by end of 2024?"
                className="w-full px-3 py-2 border border-black focus:outline-none resize-none"
                rows={3}
                required
              />
            </div>

            {/* End Time Field */}
            <div>
              <label
                htmlFor="endTime"
                className="block text-sm font-medium text-black mb-1"
              >
                End Time *
              </label>
              <input
                type="datetime-local"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-black focus:outline-none"
                required
              />
            </div>

            {/* Image URL Field */}
            <div>
              <label
                htmlFor="image"
                className="block text-sm font-medium text-black mb-1"
              >
                Image URL (Optional)
              </label>
              <input
                type="url"
                id="image"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-black focus:outline-none"
              />
            </div>

            {/* Price Feed Address Field */}
            <div>
              <label
                htmlFor="priceFeedAddress"
                className="block text-sm font-medium text-black mb-1"
              >
                Price Feed Address *
              </label>
              <input
                type="text"
                id="priceFeedAddress"
                name="priceFeedAddress"
                value={formData.priceFeedAddress}
                onChange={handleInputChange}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-black focus:outline-none"
                pattern="^0x[a-fA-F0-9]{40}$"
                required
              />
              <p className="text-xs text-black mt-1">
                Chainlink Price Feed contract address
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading || isConfirming}
                className="flex-1 bg-black text-white py-2 px-4 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading || isConfirming ? "Processing..." : "Create Market"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-black text-black font-medium"
              >
                Reset
              </button>
            </div>
          </form>

          {/* Status Messages */}
          {error && (
            <div className="mt-4 p-3 border border-black">
              <p className="text-black text-sm">Error: {error.message}</p>
            </div>
          )}

          {isSuccess && (
            <div className="mt-4 p-3 border border-black">
              <p className="text-black text-sm">Market created successfully!</p>
              {hash && (
                <p className="text-black text-xs mt-1 break-all">
                  Transaction hash: {hash}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
