import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "./theme";

const stats = [
  {
    value: "20x",
    label: "Fewer tokens wasted",
    desc: "Grounded configs = focused agents",
    color: theme.brand3,
  },
  {
    value: "10x",
    label: "Faster onboarding",
    desc: "New devs get full AI setup instantly",
    color: theme.accent,
  },
  {
    value: "4",
    label: "Platforms synced",
    desc: "Claude · Cursor · Codex · Copilot",
    color: theme.green,
  },
  {
    value: "0",
    label: "Config drift",
    desc: "Continuous sync keeps everything aligned",
    color: theme.brand1,
  },
];

export const ROIStats: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${theme.brand3}06, transparent)`,
      }}
    >
      {/* Section label */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          fontSize: 14,
          fontFamily: theme.fontMono,
          color: theme.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          opacity: headerOpacity,
        }}
      >
        The Impact
      </div>

      {/* Headline */}
      <div
        style={{
          position: "absolute",
          top: "17%",
          fontSize: 30,
          fontWeight: 700,
          fontFamily: theme.fontSans,
          color: theme.text,
          opacity: headerOpacity,
          letterSpacing: "-0.02em",
        }}
      >
        Why teams use Caliber
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginTop: 40,
        }}
      >
        {stats.map((stat, i) => {
          const delay = 6 + i * 5;
          const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 80 } });

          // Counter animation for the number
          const counterProgress = spring({
            frame: frame - delay - 2,
            fps,
            config: { damping: 20, mass: 0.5 },
          });

          const numericValue = parseInt(stat.value, 10);
          const isMultiplier = stat.value.includes("x");
          const displayNum = isNaN(numericValue) ? stat.value : Math.round(numericValue * counterProgress);
          const displayValue = isMultiplier ? `${displayNum}x` : `${displayNum}`;

          return (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "28px 24px",
                backgroundColor: theme.surface,
                border: `1px solid ${theme.surfaceBorder}`,
                borderRadius: theme.radiusLg,
                minWidth: 200,
                opacity: s,
                transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
              }}
            >
              {/* Accent line */}
              <div
                style={{
                  width: 32,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: stat.color,
                  marginBottom: 16,
                  boxShadow: `0 0 12px ${stat.color}40`,
                }}
              />

              {/* Big number */}
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  fontFamily: theme.fontSans,
                  color: stat.color,
                  letterSpacing: "-0.03em",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                  marginBottom: 8,
                }}
              >
                {displayValue}
              </div>

              {/* Label */}
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: theme.fontSans,
                  color: theme.text,
                  marginBottom: 6,
                  textAlign: "center",
                }}
              >
                {stat.label}
              </div>

              {/* Description */}
              <div
                style={{
                  fontSize: 12,
                  fontFamily: theme.fontSans,
                  color: theme.textMuted,
                  textAlign: "center",
                  maxWidth: 170,
                  lineHeight: 1.4,
                }}
              >
                {stat.desc}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
