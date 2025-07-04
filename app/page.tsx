'use client';
import Iridescence from './components/iridescence';

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <Iridescence
        className="absolute inset-0 -z-10 w-full h-full"
        color={[1, 1, 1]}
        mouseReact={false}
        amplitude={0.1}
        speed={1.0}
      />
      <div className="row-start-2 flex flex-col justify-center items-center h-full">
        <main className="flex flex-col gap-8 items-center text-center">
          <div className="text-2xl sm:text-4xl font-bold text-gray-600">Dashiell Russell</div>
          <div className="text-xl sm:text-2xl text-gray-500">
            Mechatronics engineer, Software developer, Physicist & Designer. 
            <br /> *well kinda, it's a work in progress*
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
