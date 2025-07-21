import { Header } from "./components/Header";
import MarketListReal from "./components/MarketListReal";
import StaticGridExample from "./components/StaticGridExample";

export default function Home() {
  return (
    <div className="">
      <div className="">
        <Header />
      </div>
      <div className="w-full h-[0.01rem] bg-gray-300 mb-10"></div>
      <div className="">
        <StaticGridExample />
      </div>
      <div className="container mx-auto py-8">
        <MarketListReal />
      </div>
    </div>
  );
}
