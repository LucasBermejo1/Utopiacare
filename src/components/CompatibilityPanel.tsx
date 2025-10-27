import { CompatibilityData } from "@/types/product";
import { Badge } from "./ui/badge";

interface CompatibilityPanelProps {
  data: CompatibilityData;
}

export function CompatibilityPanel({ data }: CompatibilityPanelProps) {
  const skinTypes = ["Normal", "Oily", "Dry", "Combination", "Sensitive"] as const;

  return (
    <div className="mt-6">
      <h4 className="font-semibold mb-3">Ingredient Compatibility</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {skinTypes.map((type) => (
          <div key={type} className="flex items-center gap-2">
            <strong className="w-28 text-sm">{type}</strong>
            <Badge
              variant="outline"
              style={{ borderColor: "#22c55e" }}
              className="text-xs"
            >
              Good {data[type].good}
            </Badge>
            <Badge
              variant="outline"
              style={{ borderColor: "#ef4444" }}
              className="text-xs"
            >
              Bad {data[type].bad}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
