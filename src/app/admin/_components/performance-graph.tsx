"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

interface TrendPoint {
  label: string;
  value: number;
}

interface PerformanceGraphProps {
  data: TrendPoint[];
  currency?: string;
  defaultRange?: number;
  title?: string;
  subtitle?: string;
  className?: string;
}

const QUICK_RANGES = [3, 6, 9, 12];

const formatCurrency = (value: number, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const PerformanceGraph = ({
  data,
  currency = "USD",
  defaultRange = 6,
  title = "Revenue momentum",
  subtitle = "Month-over-month net sales",
  className,
}: PerformanceGraphProps) => {
  const safeData = useMemo(() => data ?? [], [data]);
  const [fromState, setFromState] = useState(() => Math.max(safeData.length - defaultRange, 0));
  const [toState, setToState] = useState(() => Math.max(safeData.length - 1, 0));
  const [selectedState, setSelectedState] = useState(() => Math.max(safeData.length - 1, 0));

  const maxIndex = Math.max(safeData.length - 1, 0);
  const fromIndex = clamp(Math.min(fromState, toState), 0, maxIndex);
  const toIndex = clamp(Math.max(fromState, toState), 0, maxIndex);
  const rangeStart = fromIndex;
  const rangeEnd = toIndex;
  const selectedIndex = clamp(
    selectedState < rangeStart || selectedState > rangeEnd ? rangeEnd : selectedState,
    0,
    maxIndex,
  );

  const filteredData = useMemo(() => safeData.slice(rangeStart, rangeEnd + 1), [safeData, rangeStart, rangeEnd]);

  if (!safeData.length || !filteredData.length) {
    return (
      <div className={cn("rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm", className)}>
        <h2 className="text-lg.font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        <p className="mt-6 text-sm text-slate-500">
          We need at least one month of sales data to plot this trend. Keep selling and check back soon.
        </p>
      </div>
    );
  }

  const handleFromChange = (value: number) => {
    setFromState(value);
  };

  const handleToChange = (value: number) => {
    setToState(value);
  };

  const handleQuickRange = (months: number) => {
    const end = maxIndex;
    const start = clamp(end - months + 1, 0, end);
    setFromState(start);
    setToState(end);
    setSelectedState(end);
  };

  const visibleSelectedIndex = Math.max(0, selectedIndex - rangeStart);
  const selectedPoint = filteredData[visibleSelectedIndex];
  const previousPoint = filteredData[Math.max(visibleSelectedIndex - 1, 0)];

  const peak = filteredData.reduce(
    (best, current) => (current.value > best.value ? current : best),
    filteredData[0],
  );
  const trough = filteredData.reduce(
    (worst, current) => (current.value < worst.value ? current : worst),
    filteredData[0],
  );

  const firstValue = filteredData[0]?.value ?? 0;
  const lastValue = filteredData[filteredData.length - 1]?.value ?? 0;
  const netChange = lastValue - firstValue;
  const netChangePercent = firstValue === 0 ? 0 : (netChange / firstValue) * 100;
  const deltaValue = selectedPoint && previousPoint ? selectedPoint.value - previousPoint.value : 0;
  const deltaPercent = previousPoint?.value ? (deltaValue / previousPoint.value) * 100 : 0;

  const maxValue = Math.max(...filteredData.map((point) => point.value), 1);
  const minValue = Math.min(...filteredData.map((point) => point.value), 0);
  const valueRange = Math.max(maxValue - minValue, 1);
  const normalizedPoints = filteredData.map((point, index) => {
    const steps = Math.max(filteredData.length - 1, 1);
    const x = steps === 0 ? 0 : (index / steps) * 100;
    const y = 90 - ((point.value - minValue) / valueRange) * 70;
    return { x, y, label: point.label, value: point.value };
  });

  const polylinePoints = normalizedPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPath = `M 0 100 L ${normalizedPoints.map((point) => `${point.x},${point.y}`).join(" L ")} L 100 100 Z`;

  return (
    <div className={cn("rounded-3xl border border-slate-100 bg-white p-6 shadow-sm", className)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{subtitle}</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">
            Compare any time range and hover points to inspect precise values.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3 text-right text-sm text-slate-500">
          <div className="flex flex-wrap justify-end gap-2">
            {QUICK_RANGES.map((months) => (
              <button
                key={months}
                type="button"
                onClick={() => handleQuickRange(months)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] transition",
                  rangeStart === clamp(maxIndex - months + 1, 0, maxIndex) && rangeEnd === maxIndex
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 text-slate-600 hover:border-slate-900",
                )}
              >
                Last {months}m
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            <label className="flex flex-col">
              From
              <select
                className="mt-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
                value={fromIndex}
                onChange={(event) => handleFromChange(Number(event.target.value))}
              >
                {safeData.map((point, index) => (
                  <option key={`${point.label}-${index}`} value={index}>
                    {point.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col">
              To
              <select
                className="mt-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
                value={toIndex}
                onChange={(event) => handleToChange(Number(event.target.value))}
              >
                {safeData.map((point, index) => (
                  <option key={`${point.label}-${index}`} value={index}>
                    {point.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 rounded-2xl bg-slate-50/80 p-4 text-sm text-slate-600 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Latest month</p>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(lastValue, currency)}</p>
          <p className="text-xs text-slate-500">{filteredData[filteredData.length - 1]?.label}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Range change</p>
          <p className="text-2xl font-semibold text-slate-900">
            {netChange >= 0 ? "+" : "-"}
            {formatCurrency(Math.abs(netChange), currency)}
          </p>
          <p className="text-xs text-slate-500">{netChangePercent.toFixed(1)}% vs first month</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Selected delta</p>
          <p className="text-2xl font-semibold text-slate-900">
            {deltaValue >= 0 ? "+" : "-"}
            {formatCurrency(Math.abs(deltaValue), currency)}
          </p>
          <p className="text-xs text-slate-500">{deltaPercent.toFixed(1)}% vs prior month</p>
        </div>
      </div>

      <div className="relative mt-6 h-64">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#111827" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#111827" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="#f8fafc" rx="12" />
          {[20, 40, 60, 80].map((y) => (
            <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#e2e8f0" strokeWidth="0.4" />
          ))}
          <path d={areaPath} fill="url(#performanceGradient)" stroke="none" />
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#111827"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex items-end justify-between px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
          {normalizedPoints.map((point) => (
            <span key={point.label}>{point.label.split(" ")[0]}</span>
          ))}
        </div>
        <div className="absolute inset-x-0 top-0 flex h-full items-end justify-between px-2">
          {normalizedPoints.map((point, index) => (
            <button
              key={`${point.label}-marker`}
              type="button"
              className={cn(
                "flex h-full flex-col items-center justify-end gap-2 rounded-full px-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 focus:outline-none",
                index === visibleSelectedIndex && "text-slate-900",
              )}
              onMouseEnter={() => setSelectedState(rangeStart + index)}
              onFocus={() => setSelectedState(rangeStart + index)}
              aria-label={`${point.label} revenue ${formatCurrency(point.value, currency)}`}
            >
              <span
                className={cn(
                  "block h-8 w-px rounded-full",
                  index === visibleSelectedIndex ? "bg-slate-900" : "bg-slate-300",
                )}
              />
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border",
                  index === visibleSelectedIndex
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white",
                )}
              >
                {Math.round(point.value / 1000)}k
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 border-t border-slate-100 pt-4 text-sm text-slate-600 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Peak month</p>
          <p className="mt-1 text-base font-semibold text-slate-900">{peak.label}</p>
          <p>{formatCurrency(peak.value, currency)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Slowest month</p>
          <p className="mt-1 text-base font-semibold text-slate-900">{trough.label}</p>
          <p>{formatCurrency(trough.value, currency)}</p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceGraph;
