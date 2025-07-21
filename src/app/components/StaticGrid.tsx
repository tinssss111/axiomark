"use client";

import React from "react";
import Image from "next/image";

interface GridItem {
  id: number;
  imageUrl: string;
}

interface StaticGridProps {
  items: GridItem[];
}

const StaticGrid: React.FC<StaticGridProps> = ({ items }) => {
  return (
    <div className="">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer h-38 overflow-hidden"
          >
            <Image
              src={item.imageUrl}
              alt={`Item ${item.id}`}
              width={300}
              height={100}
              className="w-full h-full object-cover"
              onError={(e) =>
                console.error(`Image load failed for ${item.imageUrl}`, e)
              }
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1249D8] rounded-xl"></div>
            <button className="absolute bottom-4 left-4 bg-opacity-50 text-white px-6 py-1 rounded-md font-bold border border-white">
              Market
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaticGrid;
