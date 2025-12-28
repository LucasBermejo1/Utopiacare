import { useState, useEffect, useRef } from "react";
import { BETA_MODE } from "@/config/constants";
import { UtopiaEyes } from "./ChatBot";

export function UtopiaWordmark() {
  const [showAnimation, setShowAnimation] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const dotRef = useRef<HTMLSpanElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!BETA_MODE) return;

    // Esperar a que la página cargue completamente
    const timer = setTimeout(() => {
      setShowAnimation(true);

      // Iniciar la animación de vuelo después de 2 segundos
      setTimeout(() => {
        setIsFlying(true);
        
        // Después de la animación, ocultar el punto original
        setTimeout(() => {
          if (dotRef.current) {
            dotRef.current.style.opacity = "0";
          }
        }, 2000);
      }, 2000);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={wordmarkRef} className="flex justify-center relative">
      <span
        className="select-none lowercase font-black leading-none tracking-tight relative"
        style={{
          fontSize: "min(18vw, 220px)",
          color: "hsl(var(--muted-foreground))",
          letterSpacing: "-0.04em"
        }}
      >
        utopi
        <span
          ref={dotRef}
          className="relative inline-block"
          style={{
            transition: showAnimation && !isFlying ? "opacity 0.3s" : "none",
          }}
        >
          {showAnimation && !isFlying && (
            <span className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
              <div className="relative w-8 h-8 md:w-12 md:h-12">
                <UtopiaEyes size="md" />
              </div>
            </span>
          )}
          a
        </span>
      </span>

      {/* Punto volando hacia el chat */}
      {isFlying && (
        <div
          className="fixed z-[60] pointer-events-none utopia-flying-dot"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="relative w-12 h-12 md:w-16 md:h-16">
            <UtopiaEyes size="lg" />
          </div>
        </div>
      )}
    </div>
  );
}


