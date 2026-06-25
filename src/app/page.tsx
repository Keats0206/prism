"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div
        className={`text-center select-none transition-opacity duration-[3s] ease-out ${
          visible ? "opacity-90" : "opacity-0"
        }`}
        style={{ fontFamily: '"Satoshi", system-ui, sans-serif' }}
      >
        <p
          className="text-neutral-900 text-3xl tracking-tight lowercase"
          style={{ fontFamily: '"Sentient", Georgia, serif', fontWeight: 500 }}
        >
          rly labs
        </p>
        <p className="mt-4 text-neutral-500 text-sm tracking-wide lowercase">
          experiments in personal software by pete keating
        </p>
      </div>
    </main>
  );
}
