import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: "neutral" | "warning" | "success" | "plum";
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
}) => {
  const badgeStyles = {
    neutral: "bg-white/10 text-gray-300 border-white/10",
    warning: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    plum: "bg-plum-500/20 text-plum-300 border-plum-500/30",
  };

  return (
    <div className="bg-white/5 border border-white/10 hover:border-plum-500/40 rounded-2xl p-6 backdrop-blur-sm transition-all duration-200 group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium tracking-wider uppercase text-gray-400 group-hover:text-gray-300 transition-colors">
          {title}
        </span>
        <div className="w-10 h-10 rounded-xl bg-plum-500/10 border border-plum-500/20 flex items-center justify-center text-plum-300 group-hover:scale-105 group-hover:bg-plum-500/20 transition-all">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl lg:text-3xl font-bold font-serif text-white tracking-tight">
          {value}
        </div>
        {badge && (
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${badgeStyles[badge.variant]}`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-gray-400 font-sans">{subtitle}</p>
      )}
    </div>
  );
};

export default MetricCard;
