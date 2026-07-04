import { useState } from "react";
import simeone from "@/assets/eggs/simeone.png.asset.json";

/**
 * Easter egg HARAMDEBATE: frame foto besar Diego Simeone (El Cholo).
 * Bukan sticker kecil — tampil sebagai potret jelas dengan kaption.
 */
export function SimeoneEgg() {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        width: 168,
        zIndex: 4,
        transform: `rotate(${hover ? -1 : -4}deg) scale(${hover ? 1.04 : 1})`,
        transition: "transform 260ms cubic-bezier(.7,0,.2,1)",
        filter: "drop-shadow(0 12px 28px rgba(255,45,138,0.45))",
        pointerEvents: "auto",
      }}
      title="El Cholo approves — Park the bus."
    >
      <div style={{
        background: "linear-gradient(180deg, #f6f3ec 0%, #e8e2d2 100%)",
        padding: "10px 10px 8px",
        borderRadius: 4,
        boxShadow: "0 2px 0 rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.6)",
      }}>
        <div style={{
          width: "100%",
          aspectRatio: "3 / 4",
          overflow: "hidden",
          background: "#111",
          border: "1px solid rgba(0,0,0,0.55)",
          position: "relative",
        }}>
          <img
            src={simeone.url}
            alt="Diego Pablo Simeone — El Cholo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
              display: "block",
              filter: hover ? "contrast(1.05) saturate(1.08)" : "contrast(1.02)",
              transition: "filter 220ms",
            }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.45) 100%)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", left: 6, bottom: 4,
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: 10, letterSpacing: "0.22em",
            color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.8)",
          }}>EL CHOLO</div>
        </div>
        <div style={{
          marginTop: 8,
          fontFamily: "DM Sans, sans-serif",
          fontSize: 10,
          color: "#222",
          textAlign: "center",
          lineHeight: 1.3,
        }}>
          <div style={{ fontWeight: 700, letterSpacing: "0.06em" }}>Diego P. Simeone</div>
          <div style={{ fontSize: 8.5, color: "#7a6a4a", letterSpacing: "0.18em", marginTop: 2 }}>
            HARAMDEBATE · ICON
          </div>
        </div>
      </div>
      {hover && (
        <div style={{
          position: "absolute",
          bottom: -22, left: "50%", transform: "translateX(-50%)",
          fontFamily: "Space Mono",
          fontSize: 9,
          letterSpacing: "0.2em",
          color: "#ff2d8a",
          background: "rgba(5,8,15,0.94)",
          border: "1px solid rgba(255,45,138,0.6)",
          padding: "3px 9px",
          borderRadius: 3,
          whiteSpace: "nowrap",
        }}>"PARK THE BUS"</div>
      )}
    </div>
  );
}
