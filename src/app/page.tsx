"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <p
        className={`font-mono text-zinc-500 text-sm tracking-[0.5em] select-none transition-opacity duration-[3s] ease-out ${
          visible ? "opacity-90" : "opacity-0"
        }`}
        style={{ textShadow: "0 0 40px rgba(255,255,255,0.04)" }}
      >
        PRISM
      </p>
    </main>
  );
}
