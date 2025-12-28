export function UtopiaWordmark() {
  return (
    <div className="flex justify-center">
      <span
        className="select-none lowercase font-black leading-none tracking-tight"
        style={{
          // Tamaño fluido grande parecido al mock
          fontSize: "min(18vw, 220px)",
          // Gris azulado como en la imagen
          color: "hsl(var(--muted-foreground))",
          letterSpacing: "-0.04em"
        }}
      >
        utopia
      </span>
    </div>
  );
}


