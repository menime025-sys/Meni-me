interface TrendPoint {
  label: string;
  value: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  currency?: string;
}

const TrendChart = ({ data, currency = "USD" }: TrendChartProps) => {
  const safeData = data ?? [];
  const maxValue = Math.max(...safeData.map((item) => item.value), 1);
  const totalValue = safeData.reduce((sum, item) => sum + item.value, 0);
  const averageValue = safeData.length ? totalValue / safeData.length : 0;
  const peak = safeData.reduce((best, current) => (current.value > best.value ? current : best), safeData[0] ?? { label: "-", value: 0 });
  const low = safeData.reduce((worst, current) => (current.value < worst.value ? current : worst), safeData[0] ?? { label: "-", value: 0 });

  const formatCash = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Trend overview</p>
          <h3 className="text-xl font-semibold text-slate-900">Monthly revenue bars</h3>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          <span className="rounded-full border border-slate-200 px-3 py-1">
            Avg {formatCash(averageValue)}
          </span>
          <span className="rounded-full border border-slate-200 px-3 py-1">
            Peak {peak.label}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-600 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Total</p>
          <p className="text-2xl font-semibold text-slate-900">{formatCash(totalValue)}</p>
          <p className="text-xs text-slate-500">Across {safeData.length} months</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Peak</p>
          <p className="text-2xl font-semibold text-slate-900">{formatCash(peak.value)}</p>
          <p className="text-xs text-slate-500">{peak.label}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Slowest</p>
          <p className="text-2xl font-semibold text-slate-900">{formatCash(low.value)}</p>
          <p className="text-xs text-slate-500">{low.label}</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
          <span>Range</span>
          <span>Value</span>
        </div>
        <div className="relative mt-3 flex h-56 items-end gap-3 overflow-hidden rounded-2xl border border-slate-100 bg-linear-to-t from-white via-white to-slate-50 p-4">
          <div className="pointer-events-none absolute inset-4 flex flex-col justify-between text-slate-200">
            {[0, 25, 50, 75, 100].map((mark) => (
              <div key={mark} className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em]">
                <span className="text-slate-300">{Math.round((mark / 100) * maxValue)}</span>
                <div className="h-px w-full bg-slate-100" />
              </div>
            ))}
          </div>
          {safeData.map((item) => {
            const height = Math.max((item.value / maxValue) * 100, 6);
            return (
              <div key={item.label} className="relative z-10 flex flex-1 flex-col items-center gap-2">
                <div
                  className="flex w-full flex-1 items-end rounded-full bg-slate-100"
                  style={{ minHeight: "1rem" }}
                >
                  <div
                    className="mx-auto w-10 rounded-full bg-linear-to-t from-slate-900 via-slate-800 to-slate-600 shadow-lg shadow-slate-900/20 transition-all duration-500"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{item.label}</span>
                <span className="text-[11px] font-medium text-slate-700">{formatCash(item.value)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrendChart;
