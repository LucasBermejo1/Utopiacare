import { DonutData } from "@/types/product";
import { Badge } from "./ui/badge";

interface IngredientDonutProps {
  donut: DonutData;
}

export function IngredientDonut({ donut }: IngredientDonutProps) {
  const total = Object.values(donut).reduce((a, b) => a + b, 0) || 1;
  const pct = (key: keyof DonutData) => Math.round((donut[key] / total) * 100);

  const colors = {
    LOW: "#22c55e",
    MODERATE: "#f59e0b",
    HIGH: "#ef4444",
    UNKNOWN: "#9ca3af"
  };

  return (
    <div className="flex gap-6 items-center flex-wrap">
      <svg width="160" height="160" viewBox="0 0 42 42">
        {(["LOW", "MODERATE", "HIGH", "UNKNOWN"] as const).map((key, i) => (
          <circle
            key={key}
            r="15.915"
            cx="21"
            cy="21"
            fill="transparent"
            stroke={colors[key]}
            strokeWidth="6"
            strokeDasharray={`${pct(key)} ${100 - pct(key)}`}
            transform={`rotate(${i * 90} 21 21)`}
          />
        ))}
        <text
          x="21"
          y="22"
          textAnchor="middle"
          fontSize="8"
          fill="hsl(var(--deep))"
        >
          {total} ing.
        </text>
      </svg>
      <div className="space-y-2">
        <Badge style={{ borderColor: colors.LOW }} variant="outline">
          LOW {pct("LOW")}%
        </Badge>
        <br />
        <Badge style={{ borderColor: colors.MODERATE }} variant="outline">
          MODERATE {pct("MODERATE")}%
        </Badge>
        <br />
        <Badge style={{ borderColor: colors.HIGH }} variant="outline">
          HIGH {pct("HIGH")}%
        </Badge>
        <br />
        <Badge style={{ borderColor: colors.UNKNOWN }} variant="outline">
          UNKNOWN {pct("UNKNOWN")}%
        </Badge>
      </div>
    </div>
  );
}
