interface TrendPoint {
  label: string;
  value: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  currency?: string;
}

const TrendChart = ({ data, currency = "USD" }: TrendChartProps) => {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="flex h-56 w-full items-end gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {data.map((item) => {
        const height = Math.max((item.value / maxValue) * 100, 6);
        return (
          <div key={item.label} className="flex flex-1 flex-col justify-end gap-2 text-center">
            <div className="flex h-44 w-full items-end justify-center">
              <div className="w-full rounded-full bg-linear-to-t from-slate-200 via-slate-200 to-slate-100">
                <div
                  className="mx-auto w-8 rounded-full bg-slate-900 transition-all duration-700"
                  style={{ height: `${height}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              {item.label}
            </span>
            <span className="text-xs font-medium text-slate-700">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency,
                maximumFractionDigits: 0,
              }).format(item.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default TrendChart;
