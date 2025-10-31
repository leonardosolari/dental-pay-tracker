import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "warning" | "destructive" | "success";
}

export default function StatCard({ title, value, icon: Icon, variant = "default" }: StatCardProps) {
  const colorClasses = {
    default: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-success/10 text-success",
  };

  return (
    <Card className="p-6 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className={cn("rounded-lg p-3", colorClasses[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
