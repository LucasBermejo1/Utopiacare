import { useState, useEffect, useRef } from "react";
import { BETA_MODE } from "@/config/constants";
import { UtopiaEyes } from "./ChatBot";

export function UtopiaWordmark() {
  const [showEyes, setShowEyes] = useState(false);
  const [eyesOpacity, setEyesOpacity] = useState(0);
  const [isFlying, setIsFlying] = useState(false);
  const [flyStyle, setFlyStyle] = useState<React.CSSProperties>({});
  const dotRef = useRef<HTMLSpanElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const flyingDotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!BETA_MODE) return;

    let flyTimer: NodeJS.Timeout;
    let opacityTimer: NodeJS.Timeout;
    
    // Esperar a que la página cargue completamente
    const timer = setTimeout(() => {
      // Aparición gradual de los ojos (1 segundo)
      setShowEyes(true);
      let currentOpacity = 0;
      const opacityInterval = setInterval(() => {
        currentOpacity += 0.05;
        if (currentOpacity >= 1) {
          clearInterval(opacityInterval);
          setEyesOpacity(1);
        } else {
          setEyesOpacity(currentOpacity);
        }
      }, 50);

      // Iniciar la animación de vuelo después de que los ojos aparezcan y parpadeen
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
          }, 2500);
        }
      }, 3000); // 3 segundos: 1s aparición + 2s parpadeos
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (flyTimer) clearTimeout(flyTimer);
      if (opacityTimer) clearTimeout(opacityTimer);
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
              transition: !isFlying ? "opacity 0.3s" : "none",
            }}
          >
            <span className="relative inline-block">
              {/* Punto base siempre visible */}
              <span className="inline-block" style={{ opacity: showEyes ? 0.3 : 1 }}>·</span>
              
              {/* Ojos con aparición gradual y parpadeos */}
              {showEyes && !isFlying && (
                <span 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    opacity: eyesOpacity,
                    transition: "opacity 0.1s ease-in-out",
                  }}
                >
                  <div className="relative w-6 h-6 md:w-10 md:h-10">
                    <UtopiaEyes size="sm" />
                  </div>
                </span>
              )}
            </span>
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


