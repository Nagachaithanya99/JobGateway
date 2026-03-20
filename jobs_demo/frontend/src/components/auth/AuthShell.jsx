import { useState } from "react";
import AuthShowcase from "./AuthShowcase.jsx";

const AUTH_BACKGROUND_REEL = [
  {
    src: "https://cdn.pixabay.com/video/2023/12/01/191518-890528350_large.mp4",
    position: "50% 50%",
  },
  {
    src: "https://cdn.pixabay.com/video/2024/06/01/214888_large.mp4",
    position: "50% 42%",
  },
  {
    src: "https://cdn.pixabay.com/video/2024/07/04/219339_large.mp4",
    position: "50% 48%",
  },
  {
    src: "https://cdn.pixabay.com/video/2024/07/04/219337_large.mp4",
    position: "50% 46%",
  },
];

export default function AuthShell({
  mode = "signin",
  title,
  subtitle,
  panelTitle,
  panelText,
  panelActionLabel,
  panelActionTo,
  children,
}) {
  const formOrder = mode === "signup" ? "md:order-2" : "md:order-1";
  const panelOrder = mode === "signup" ? "md:order-1" : "md:order-2";
  const [currentBackground, setCurrentBackground] = useState(0);

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0">
        <video
          key={AUTH_BACKGROUND_REEL[currentBackground].src}
          autoPlay
          muted
          playsInline
          preload="metadata"
          onEnded={() => {
            setCurrentBackground((prev) => (prev + 1) % AUTH_BACKGROUND_REEL.length);
          }}
          onLoadedData={(event) => {
            event.currentTarget.playbackRate = 0.68;
          }}
          className="absolute inset-0 h-full w-full object-cover opacity-95"
          style={{ objectPosition: AUTH_BACKGROUND_REEL[currentBackground].position }}
        >
          <source src={AUTH_BACKGROUND_REEL[currentBackground].src} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(243,248,255,0.22)_0%,rgba(238,244,255,0.14)_42%,rgba(255,247,239,0.12)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(59,130,246,0.16),transparent_22%),radial-gradient(circle_at_88%_18%,rgba(96,165,250,0.18),transparent_20%),radial-gradient(circle_at_82%_84%,rgba(249,115,22,0.16),transparent_22%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.06),transparent_26%,transparent_74%,rgba(15,23,42,0.08))]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[36px] border border-white/42 bg-white/26 shadow-[0_36px_110px_rgba(37,99,235,0.14)] backdrop-blur-2xl md:grid-cols-[0.98fr_1.02fr]">
          <section className={`order-2 bg-[linear-gradient(180deg,rgba(255,255,255,0.58),rgba(244,247,255,0.42))] backdrop-blur-xl px-6 py-10 sm:px-10 ${formOrder} md:px-14`}>
            <div className="mx-auto flex h-full w-full max-w-md flex-col justify-center">
              <div className="mb-8">
                <h1 className="bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#f97316] bg-clip-text text-center text-4xl font-extrabold tracking-tight text-transparent sm:text-[3.15rem]">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="mt-3 text-center text-sm text-slate-600 sm:text-base">{subtitle}</p>
                ) : null}
              </div>

              {children}
            </div>
          </section>

          <aside className={`order-1 p-3 [filter:brightness(1.1)_contrast(1.08)] sm:p-4 ${panelOrder}`}>
            <AuthShowcase
              panelTitle={panelTitle}
              panelText={panelText}
              panelActionLabel={panelActionLabel}
              panelActionTo={panelActionTo}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
