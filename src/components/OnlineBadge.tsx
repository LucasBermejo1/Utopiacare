import { OnlineStatus } from "@/types/product";
import { Badge } from "./ui/badge";

interface OnlineBadgeProps {
  status: OnlineStatus;
  creditMax: number;
  creditLeft: number;
  requestsMade: number;
}

export function OnlineBadge({
  status,
  creditMax,
  creditLeft,
  requestsMade
}: OnlineBadgeProps) {
  const statusConfig = {
    live: { icon: "🟢", label: "Live", variant: "default" as const },
    cache: { icon: "🟡", label: "Cache", variant: "secondary" as const },
    offline: { icon: "🔴", label: "Offline", variant: "destructive" as const }
  };

  const config = statusConfig[status] || statusConfig.live;

  return (
    <Badge
      variant={config.variant}
      className="gap-1"
      title={`Requests: ${requestsMade}/${creditMax}, Credits left: ${creditLeft}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </Badge>
  );
}
