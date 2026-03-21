import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Logo } from "./Logo";
import { theme } from "./theme";

const stats = [
  {
    value: "20x",
    label: "Fewer tokens",
    desc: "Grounded configs = focused agents",
    color: theme.brand3,
  },
  {
    value: "10x",
    label: "Faster velocity",
    desc: "Best practices built in from day one",
    color: theme.accent,
  },
  {
    value: "4",
    label: "Platforms",
    desc: "Claude · Cursor · Codex · Copilot",
    color: theme.green,
  },
  {
    value: "0",
    label: "Config drift",
    desc: "Continuous sync keeps it all aligned",
    color: theme.brand1,
  },
];

export const ROIStats: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const ctaOpacity = interpolate(frame, [68, 88], [0, 1], { extrapolateRight: "clamp" });

  // Blinking cursor for CTA
  const cursorVisible = Math.floor(frame / 15) % 2 === 0;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: `radial-gradient(ellipse 60% 50% at 50% 45%, ${theme.brand3}08, transparent)`,
      }}
    >
      {/* Section label */}
      <div
        style={{
          position: "absolute",
          top: "6%",
          fontSize: 22,
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
          top: "13%",
          fontSize: 48,
          fontWeight: 700,
          fontFamily: theme.fontSans,
          color: theme.text,
          opacity: headerOpacity,
          letterSpacing: "-0.02em",
        }}
      >
        Maximum velocity. Minimum cost.
      </div>

      {/* Stats grid */}
      <div style={{ display: "flex", gap: 24, marginTop: 10 }}>
        {stats.map((stat, i) => {
          const delay = 10 + i * 6;
          const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 65 } });

          const counterProgress = spring({
            frame: frame - delay - 4,
            fps,
            config: { damping: 20, mass: 0.6 },
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
                padding: "34px 30px",
                backgroundColor: theme.surface,
                border: `1px solid ${theme.surfaceBorder}`,
                borderRadius: theme.radiusLg,
                minWidth: 230,
                opacity: s,
                transform: `translateY(${interpolate(s, [0, 1], [22, 0])}px)`,
                boxShadow: theme.cardGlow,
              }}
            >
              {/* Accent line */}
              <div
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: stat.color,
                  marginBottom: 20,
                  boxShadow: `0 0 16px ${stat.color}40`,
                }}
              />

              {/* Big number */}
              <div
                style={{
                  fontSize: 68,
                  fontWeight: 800,
                  fontFamily: theme.fontSans,
                  color: stat.color,
                  letterSpacing: "-0.03em",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                  marginBottom: 12,
                }}
              >
                {displayValue}
              </div>

              {/* Label */}
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  fontFamily: theme.fontSans,
                  color: theme.text,
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                {stat.label}
              </div>

              {/* Description */}
              <div
                style={{
                  fontSize: 16,
                  fontFamily: theme.fontSans,
                  color: theme.textMuted,
                  textAlign: "center",
                  maxWidth: 200,
                  lineHeight: 1.4,
                }}
              >
                {stat.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA section — terminal-style install command */}
      <div
        style={{
          position: "absolute",
          bottom: "5%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          opacity: ctaOpacity,
        }}
      >
        <Logo size={0.55} animate={false} />

        {/* Terminal-style command */}
        <div
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.surfaceBorder}`,
            borderRadius: 32,
            padding: "16px 40px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: theme.terminalGlow,
          }}
        >
          <span style={{ color: theme.textMuted, fontFamily: theme.fontMono, fontSize: 26 }}>$</span>
          <span style={{ color: theme.text, fontFamily: theme.fontMono, fontSize: 26, fontWeight: 500 }}>
            npx @rely-ai/caliber init
          </span>
          {/* Blinking cursor */}
          <div
            style={{
              width: 3,
              height: 26,
              backgroundColor: theme.brand3,
              opacity: cursorVisible ? 1 : 0,
              marginLeft: 4,
            }}
          />
        </div>

        <div
          style={{
            fontSize: 22,
            fontFamily: theme.fontSans,
            color: theme.textSecondary,
            fontWeight: 400,
          }}
        >
          One command. Every AI agent. Always in sync.
        </div>
      </div>
    </AbsoluteFill>
  );
};
