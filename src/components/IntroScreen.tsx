import { useEffect } from "react";
import taqseemLogo from "../assets/taqseemlogo.png";

interface IntroScreenProps {
  onComplete: () => void;
}

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50 overflow-hidden z-50">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-green-200/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      {/* Logo */}
      <img
        src={taqseemLogo}
        alt="Taqseem Logo"
        className="relative z-10 max-w-[400px] md:max-w-[500px] lg:max-w-[600px] h-auto object-contain drop-shadow-2xl animate-intro-logo"
      />

      {/* Words */}
      <div className="relative z-10 flex items-center justify-center gap-4 md:gap-6 mt-8 flex-wrap px-4">
        <span
          className="font-display font-black text-3xl md:text-4xl lg:text-5xl tracking-[0.15em] text-gray-700 animate-intro-word"
          style={{ animationDelay: "0.3s" }}
        >
          EDUCATE
        </span>
        <span
          className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-300 animate-intro-word"
          style={{ animationDelay: "0.7s" }}
        >
          |
        </span>
        <span
          className="font-display font-black text-3xl md:text-4xl lg:text-5xl tracking-[0.15em] text-gray-700 animate-intro-word"
          style={{ animationDelay: "1.1s" }}
        >
          EMPOWER
        </span>
        <span
          className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-300 animate-intro-word"
          style={{ animationDelay: "1.5s" }}
        >
          |
        </span>
        <span
          className="font-display font-black text-3xl md:text-4xl lg:text-5xl tracking-[0.15em] text-gray-700 animate-intro-word"
          style={{ animationDelay: "1.9s" }}
        >
          TRANSFORM
        </span>
      </div>

      {/* Loading dots at bottom */}
      <div
        className="absolute bottom-16 flex items-center gap-2 animate-intro-word"
        style={{ animationDelay: "2.3s" }}
      >
        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" />
        <div
          className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
          style={{ animationDelay: "0.15s" }}
        />
        <div
          className="w-2 h-2 bg-cyan-600 rounded-full animate-bounce"
          style={{ animationDelay: "0.3s" }}
        />
      </div>

      <style>{`
        @keyframes intro-logo-zoom {
          0% {
            opacity: 0;
            transform: scale(0.5) translateY(30px);
          }
          60% {
            opacity: 1;
            transform: scale(1.05) translateY(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-intro-logo {
          animation: intro-logo-zoom 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes intro-word-appear {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-intro-word {
          animation: intro-word-appear 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>
    </div>
  );
}