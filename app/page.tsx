export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="row-start-2 flex flex-col justify-center items-center h-full">
        <main className="flex flex-col gap-8 items-center text-center">
          <div className="text-2xl sm:text-4xl font-bold">Dashiell Russell</div>
          <div className="text-xl sm:text-2xl">
            Mechatronics engineer, Software developer, Physicist & Designer.
          </div>
          <div className="text-purple-600 font-semibold">
            Contact me at dashiell.russell@gmail.com
          </div>
        </main>
      </div>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <div className="text-base sm:text-lg text-gray-500">
          Website under construction
        </div>
      </footer>
    </div>
  );
}
