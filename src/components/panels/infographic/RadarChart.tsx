/** SVG radar chart untuk pro vs kon strength profile. */
export function RadarChart({
  data,
  size = 220,
  color = "#a855f7",
}: {
  data: { label: string; value: number }[]; // value 0..100
  size?: number;
  color?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const n = data.length;
  if (n < 3) return null;

  const pt = (v: number, i: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rr = (v / 100) * r;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr] as const;
  };

  const rings = [0.25, 0.5, 0.75, 1].map((k) => (
    <circle key={k} cx={cx} cy={cy} r={r * k} fill="none" stroke={`${color}22`} strokeWidth={1} />
  ));
  const spokes = data.map((_, i) => {
    const [x, y] = pt(100, i);
    return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={`${color}22`} strokeWidth={1} />;
  });
  const poly = data.map((d, i) => pt(d.value, i).join(",")).join(" ");
  const dots = data.map((d, i) => {
    const [x, y] = pt(d.value, i);
    return <circle key={i} cx={x} cy={y} r={2.4} fill={color} />;
  });
  const labels = data.map((d, i) => {
    const [x, y] = pt(118, i);
    return (
      <text
        key={i}
        x={x}
        y={y}
        fontSize={9}
        fill="#e5e7eb"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontFamily: "Space Mono", letterSpacing: "0.1em" }}
      >
        {d.label}
      </text>
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings}
      {spokes}
      <polygon points={poly} fill={`${color}33`} stroke={color} strokeWidth={1.5} />
      {dots}
      {labels}
    </svg>
  );
}

/** Horizontal probability bar (0..100) with label. */
export function HorizBar({
  value,
  color,
  label,
  height = 8,
}: { value: number; color: string; label?: string; height?: number }) {
  return (
    <div style={{ width: "100%" }}>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Space Mono", fontSize: 9, letterSpacing: "0.15em", color: "var(--au-muted)", marginBottom: 4 }}>
          <span>{label}</span>
          <span style={{ color }}>{value.toFixed(2)}%</span>
        </div>
      )}
      <div style={{ width: "100%", height, background: `${color}18`, borderRadius: 999, overflow: "hidden" }}>
        <div style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 8px ${color}88`,
          transition: "width 600ms cubic-bezier(.7,0,.2,1)",
        }} />
      </div>
    </div>
  );
}
