import { BETA_MODE } from "@/config/constants";

export function UtopiaWordmark() {
  return (
    <div className="flex justify-center">
      <span
        className="select-none lowercase font-black leading-none tracking-tight"
        style={{
          fontSize: BETA_MODE 
            ? "min(12vw, 140px)" // Más pequeño en modo beta
            : "min(18vw, 220px)",
          color: "hsl(var(--muted-foreground))",
          letterSpacing: "-0.04em"
        }}
      >
        utopia
      </span>
    </div>
  );
}


