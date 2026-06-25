"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

// Faithful React port of Codrops' "Entrance Animation for Images" Demo 1
// (d3adrabbit/EntranceAnimationForImages). Animation only starts after images
// are preloaded — running with clientHeight === 0 is the usual cause of a
// "broken" stack.

const IMAGES = [
  "/mutual/intro/patio.webp",
  "/mutual/intro/cafe-date.png",
  "/mutual/intro/dome.png",
  "/mutual/intro/run-club.png",
  "/mutual/intro/dancing.png",
  "/mutual/intro/bar-window.png",
  "/mutual/intro/hike.png",
  "/mutual/intro/loft-party.png",
];

function preloadImages(urls: string[]): Promise<void> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        }),
    ),
  ).then(() => undefined);
}

type CircularStackProps = {
  onReady?: () => void;
};

export function CircularStack({ onReady }: CircularStackProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let active = true;
    let ctx: gsap.Context | undefined;

    const scene = sceneRef.current;
    const group = groupRef.current;
    if (!scene || !group) return;

    void preloadImages(IMAGES).then(() => {
      if (!active) return;
      onReady?.();

      ctx = gsap.context(() => {
        const mm = gsap.matchMedia();
        mm.add(
          {
            isDesktop: "(min-width: 53em)",
            isMobile: "(max-width: 53em)",
          },
          (context) => {
            const isDesktop = Boolean(context.conditions?.isDesktop);

            const image = scene.querySelector<HTMLElement>(".cs-card__img");
            const cardList = gsap.utils.toArray<HTMLElement>(".cs-card");
            if (!image || cardList.length === 0 || image.clientHeight === 0) return;

            const count = cardList.length;
            const sliceAngle = (2 * Math.PI) / count;

            const radius1 = 50 + image.clientHeight / 2;
            const radius2 = isDesktop ? 300 - radius1 : 220 - radius1;

            const tl = gsap
              .timeline()
              .from(cardList, {
                y: window.innerHeight / 2 + image.clientHeight * 1.5,
                rotateX: -180,
                stagger: 0.1,
                duration: 0.5,
                opacity: 0.8,
                scale: 3,
              })
              .set(cardList, {
                transformOrigin: `center ${radius1 + image.clientHeight / 2}px`,
              })
              .set(group, { transformStyle: "preserve-3d" })
              .to(cardList, { y: -radius1, duration: 0.5, ease: "power1.out" })
              .to(
                cardList,
                {
                  rotation: (index) => (index * 360) / count,
                  rotateY: 15,
                  duration: 1,
                  ease: "power1.out",
                },
                "<",
              )
              .to(cardList, {
                x: (index) =>
                  Math.round(radius2 * Math.cos(sliceAngle * index - Math.PI / 4)),
                y: (index) =>
                  Math.round(radius2 * Math.sin(sliceAngle * index - Math.PI / 4)) -
                  radius1,
                rotation: (index) => (index + 1) * (360 / count),
              })
              .to(
                cardList,
                {
                  rotateY: 180,
                  opacity: 0.8,
                  duration: 1,
                },
                "<",
              );

            tl.to(cardList, {
              repeat: -1,
              duration: 2,
              onRepeat: () => {
                gsap.to(cardList[Math.floor(Math.random() * count)], {
                  rotateY: "+=180",
                });
              },
            }).to(
              group,
              {
                rotation: 360,
                duration: 20,
                repeat: -1,
                ease: "none",
              },
              "<-=2",
            );

            return () => tl.kill();
          },
        );
      }, scene);
    });

    return () => {
      active = false;
      ctx?.revert();
    };
  }, [onReady]);

  return (
    <div ref={sceneRef} className="cs-scene">
      <style>{`
        .cs-scene {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 1000px;
          overflow: hidden;
        }
        .cs-group {
          position: relative;
          width: 0;
          height: 0;
        }
        .cs-card {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          will-change: transform;
        }
        .cs-card__img {
          width: 5.75em;
          aspect-ratio: 2 / 3;
          border-radius: 5px;
          background-position: center;
          background-size: cover;
        }
        @media (min-width: 53em) {
          .cs-card__img {
            width: 7em;
          }
        }
      `}</style>
      <div ref={groupRef} className="cs-group">
        {IMAGES.map((src) => (
          <div key={src} className="cs-card">
            <div
              className="cs-card__img"
              style={{ backgroundImage: `url(${src})` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
