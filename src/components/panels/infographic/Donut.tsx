/**
 * Donut chart & bar list SVG ringan (tanpa dependensi chart).
 * Dipakai di lobby untuk komposisi jenis mosi.
 */

export interface Slice {
  label: string;
  value: number;
  color: string;
}

export function Donut({
  data,
  size = 190,
  thickness = 20,
  centerTop,
  centerSub,
}: {
  data: Slice[];
  size?: number;
  thickness?: number;
  centerTop?: string;
  centerSub?: string;
}) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Komposisi jenis mosi">
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
      {data.map((d) => {
        const frac = d.value / total;
        const dash = frac * circ;
        const el = (
          <circle
            key={d.label}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={thickness}
            strokeDasharray={`${Math.max(0, dash - 1.5)} ${circ - dash + 1.5}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${c} ${c})`}
            style={{ transition: "stroke-dasharray 700ms ease" }}
          />
        );
        offset += dash;
        return el;
      })}
      {centerTop && (
        <text x={c} y={c - 2} textAnchor="middle" fill="#ECEFF4" fontSize={26} fontFamily="Space Mono, monospace">
          {centerTop}
        </text>
      )}
      {centerSub && (
        <text x={c} y={c + 16} textAnchor="middle" fill="#606776" fontSize={9} letterSpacing="0.2em" fontFamily="Space Mono, monospace">
          {centerSub}
        </text>
      )}
    </svg>
  );
}

export function BarList({ data, total }: { data: Slice[]; total: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {data.map((d) => {
        const pct = (d.value / (total || 1)) * 100;
        return (
          <div key={d.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "Space Mono, monospace",
                fontSize: 10,
                letterSpacing: "0.14em",
                color: "#9AA1B1",
                textTransform: "uppercase",
                marginBottom: 5,
              }}
            >
              <span>{d.label}</span>
              <span style={{ color: d.color }}>{pct.toFixed(1)}% · {d.value}</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
              <div
                style={{
                  width: `${(d.value / max) * 100}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${d.color}, ${d.color}55)`,
                  transition: "width 800ms ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
