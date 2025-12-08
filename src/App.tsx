import Home from "./imports/Home";

export default function App() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-[375px] h-screen bg-white shadow-2xl overflow-hidden relative">
        <Home />
      </div>
    </div>
  );
}
