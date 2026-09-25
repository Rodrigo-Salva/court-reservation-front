// Gráficos SVG/CSS sin dependencias externas; se renderizan en el servidor.

const PALETTE = ["#16a34a", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6", "#ec4899", "#64748b"];

export function TrendChart({
  data,
  format = (value) => String(value),
  ariaLabel,
}: {
  data: { label: string; value: number }[];
  format?: (value: number) => string;
  ariaLabel: string;
}) {
  const width = 640;
  const height = 200;
  const pad = { top: 16, right: 12, bottom: 28, left: 44 };
  const max = Math.max(1, ...data.map((point) => point.value));
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const x = (index: number) => pad.left + (data.length <= 1 ? innerW / 2 : (index / (data.length - 1)) * innerW);
  const y = (value: number) => pad.top + innerH - (value / max) * innerH;
  const line = data.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(point.value).toFixed(1)}`).join(" ");
  const area = data.length > 0 ? `${line} L${x(data.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z` : "";
  const ticks = [0, 0.5, 1];
  const labelIndexes = data.length <= 3 ? data.map((_, index) => index) : [0, Math.floor((data.length - 1) / 2), data.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel} className="h-auto w-full text-primary">
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={pad.left} x2={width - pad.right} y1={y(max * tick)} y2={y(max * tick)} stroke="currentColor" strokeOpacity={0.12} />
          <text x={pad.left - 6} y={y(max * tick) + 3} textAnchor="end" fontSize={10} fill="currentColor" fillOpacity={0.6}>{format(Math.round(max * tick))}</text>
        </g>
      ))}
      {area && <path d={area} fill="currentColor" fillOpacity={0.12} />}
      {line && <path d={line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />}
      {data.length <= 60 && data.map((point, index) => (
        <circle key={point.label} cx={x(index)} cy={y(point.value)} r={3} fill="currentColor">
          <title>{`${point.label}: ${format(point.value)}`}</title>
        </circle>
      ))}
      {labelIndexes.map((index) => (
        <text key={index} x={x(index)} y={height - 8} textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"} fontSize={10} fill="currentColor" fillOpacity={0.6}>
          {data[index]?.label.slice(5)}
        </text>
      ))}
    </svg>
  );
}

export function BarList({ items }: { items: { label: string; sublabel?: string; value: number; display: string }[] }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium">{item.label}{item.sublabel && <span className="ml-2 text-xs font-normal text-muted-foreground">{item.sublabel}</span>}</span>
            <span className="shrink-0 font-semibold tabular-nums">{item.display}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary" role="presentation">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ColumnChart({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div className="flex h-44 items-end gap-3" role="img" aria-label="Reservas por hora">
      {items.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center justify-end gap-1">
          <span className="text-xs font-semibold tabular-nums">{item.value}</span>
          <div className="w-full max-w-14 rounded-t-md bg-primary" style={{ height: `${Math.max(4, (item.value / max) * 100)}%` }} title={`${item.label}: ${item.value}`} />
          <span className="text-[11px] text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Donut({ items, centerLabel }: { items: { label: string; value: number }[]; centerLabel: string }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 120 120" role="img" aria-label="Distribución por deporte" className="h-40 w-40 shrink-0">
        <circle cx={60} cy={60} r={radius} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={16} />
        {total > 0 && items.map((item, index) => {
          const length = (item.value / total) * circumference;
          const segment = (
            <circle key={item.label} cx={60} cy={60} r={radius} fill="none" stroke={PALETTE[index % PALETTE.length]} strokeWidth={16}
              strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} transform="rotate(-90 60 60)">
              <title>{`${item.label}: ${item.value}`}</title>
            </circle>
          );
          offset += length;
          return segment;
        })}
        <text x={60} y={58} textAnchor="middle" fontSize={16} fontWeight={700} fill="currentColor">{total}</text>
        <text x={60} y={72} textAnchor="middle" fontSize={7} fill="currentColor" fillOpacity={0.6}>{centerLabel}</text>
      </svg>
      <ul className="flex min-w-40 flex-1 flex-col gap-2 text-sm">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: PALETTE[index % PALETTE.length] }} />{item.label}</span>
            <span className="font-semibold tabular-nums">{item.value}{total > 0 && <span className="ml-1 text-xs font-normal text-muted-foreground">({Math.round((item.value / total) * 100)}%)</span>}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
