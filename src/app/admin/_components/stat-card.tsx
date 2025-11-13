import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  caption?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "danger" | "warning";
}

const toneMap: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-slate-900 text-white",
  success: "bg-emerald-600 text-emerald-50",
  danger: "bg-rose-600 text-rose-50",
  warning: "bg-amber-500 text-amber-50",
};

export const StatCard = ({ title, value, change, caption, icon: Icon, tone = "default" }: StatCardProps) => {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm", tone === "default" ? "" : "")}>
      <div className="absolute inset-x-0 -top-6 flex justify-end px-6 opacity-20">
        {Icon ? <Icon className="h-16 w-16" /> : null}
      </div>
      <div className="relative flex flex-col gap-3 p-6">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{title}</span>
        <div className="text-3xl font-bold text-slate-900">{value}</div>
        {change ? <span className="text-xs font-medium uppercase text-emerald-600">{change}</span> : null}
        {caption ? <p className="text-sm text-slate-500">{caption}</p> : null}
      </div>
      {tone !== "default" ? <div className={cn("absolute inset-0 opacity-[0.08]", toneMap[tone])} /> : null}
    </div>
  );
};

export default StatCard;
