import StaticGrid from "./StaticGrid";

interface GridItem {
  id: number;
  imageUrl: string;
}

const gridItems: GridItem[] = [
  {
    id: 1,
    imageUrl: "/banner/donal-elon.jpg",
  },
  {
    id: 2,
    imageUrl: "/banner/donald-trump.jpg",
  },
  {
    id: 3,
    imageUrl: "/banner/fedanddonal.jpg",
  },
];

function App() {
  return (
    <div className="container mx-auto">
      <StaticGrid items={gridItems} />
    </div>
  );
}

export default App;
