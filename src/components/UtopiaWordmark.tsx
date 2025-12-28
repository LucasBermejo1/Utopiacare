import { useState, useEffect, useRef } from "react";
import { BETA_MODE } from "@/config/constants";
import { UtopiaEyes } from "./ChatBot";

export function UtopiaWordmark() {
  const [showAnimation, setShowAnimation] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [flyStyle, setFlyStyle] = useState<React.CSSProperties>({});
  const dotRef = useRef<HTMLSpanElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const flyingDotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!BETA_MODE) return;

    let flyTimer: NodeJS.Timeout;
    
    // Esperar a que la página cargue completamente
    const timer = setTimeout(() => {
      setShowAnimation(true);

      // Iniciar la animación de vuelo después de 2 segundos
      flyTimer = setTimeout(() => {
        // Calcular posiciones
        const dotElement = dotRef.current;
        const chatButton = document.querySelector('[aria-label="Hablar con Utopia"]') as HTMLElement;
        
        if (dotElement && chatButton) {
          const dotRect = dotElement.getBoundingClientRect();
          const chatRect = chatButton.getBoundingClientRect();
          
          const startX = dotRect.left + dotRect.width / 2;
          const startY = dotRect.top + dotRect.height / 2;
          const endX = chatRect.left + chatRect.width / 2;
          const endY = chatRect.top + chatRect.height / 2;
          
          const deltaX = endX - startX;
          const deltaY = endY - startY;
          
          setFlyStyle({
            left: `${startX}px`,
            top: `${startY}px`,
            '--delta-x': `${deltaX}px`,
            '--delta-y': `${deltaY}px`,
          } as React.CSSProperties);
          
          setIsFlying(true);
          
          // Después de la animación, ocultar el punto original
          setTimeout(() => {
            if (dotRef.current) {
              dotRef.current.style.opacity = "0";
            }
          }, 2000);
        }
      }, 2000);
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (flyTimer) clearTimeout(flyTimer);
    };
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
        utop
        <span className="relative inline-block">
          i
          {/* Punto de la i con ojos */}
          <span
            ref={dotRef}
            className="absolute -top-2 left-1/2 -translate-x-1/2 inline-block"
            style={{
              fontSize: "0.3em",
              transition: showAnimation && !isFlying ? "opacity 0.3s" : "none",
            }}
          >
            {showAnimation && !isFlying && (
              <span className="relative inline-block">
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="relative w-8 h-8 md:w-12 md:h-12">
                    <UtopiaEyes size="md" />
                  </div>
                </span>
                <span className="opacity-0">·</span>
              </span>
            )}
            {!showAnimation && <span>·</span>}
          </span>
        </span>
        a
      </span>

      {/* Punto volando hacia el chat (con ojos) */}
      {isFlying && (
        <div
          ref={flyingDotRef}
          className="fixed z-[60] pointer-events-none utopia-flying-dot"
          style={flyStyle}
        >
          <div className="relative w-12 h-12 md:w-16 md:h-16">
            <UtopiaEyes size="lg" />
          </div>
        </div>
      )}
    </div>
  );
}


