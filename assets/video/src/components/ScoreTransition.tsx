import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "./theme";

function getScoreColor(score: number): string {
  if (score < 50) return theme.red;
  if (score < 70) return theme.yellow;
  return theme.green;
}

function getGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

const checks = [
  { label: "CLAUDE.md exists", before: "✗", after: "✓" },
  { label: "Skills configured", before: "✗", after: "✓" },
  { label: "MCP servers synced", before: "✗", after: "✓" },
  { label: "Rules grounded", before: "—", after: "✓" },
];

export const ScoreTransition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  // Phase 1: show "before" (frames 0-20)
  // Phase 2: animate to "after" (frames 20-50)
  const transitionProgress = spring({ frame: frame - 18, fps, config: { damping: 22, mass: 0.6 } });
  const score = Math.round(interpolate(transitionProgress, [0, 1], [47, 94]));
  const barWidth = interpolate(transitionProgress, [0, 1], [47, 94]);
  const scoreColor = getScoreColor(score);
  const grade = getGrade(score);

  // Glow pulse on completion
  const glowIntensity = score >= 90 ? interpolate(frame, [45, 55], [0, 1], { extrapolateRight: "clamp" }) : 0;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: containerOpacity,
        background: `radial-gradient(ellipse 40% 40% at 50% 50%, ${scoreColor}06, transparent)`,
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
        }}
      >
        $ caliber score
      </div>

      {/* Score card */}
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: theme.radiusLg,
          padding: "44px 56px",
          border: `1px solid ${theme.surfaceBorder}`,
          minWidth: 640,
          boxShadow: `0 0 ${40 * glowIntensity}px ${theme.green}20`,
        }}
      >
        {/* Score row */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 20 }}>
          <span
            style={{
              color: theme.text,
              fontSize: 64,
              fontWeight: 700,
              fontFamily: theme.fontSans,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
            }}
          >
            {score}
          </span>
          <span style={{ color: theme.textMuted, fontSize: 20, fontFamily: theme.fontSans }}>/100</span>
          <div
            style={{
              marginLeft: "auto",
              padding: "6px 20px",
              borderRadius: 24,
              backgroundColor: `${scoreColor}15`,
              border: `1px solid ${scoreColor}30`,
              color: scoreColor,
              fontSize: 22,
              fontWeight: 700,
              fontFamily: theme.fontSans,
            }}
          >
            Grade {grade}
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: "100%",
            height: 8,
            backgroundColor: `${theme.textMuted}20`,
            borderRadius: 4,
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: `${barWidth}%`,
              height: "100%",
              backgroundColor: scoreColor,
              borderRadius: 4,
              boxShadow: `0 0 12px ${scoreColor}40`,
            }}
          />
        </div>

        {/* Check items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {checks.map((check, i) => {
            const checkProgress = spring({
              frame: frame - 22 - i * 3,
              fps,
              config: { damping: 14 },
            });
            const isAfter = checkProgress > 0.5;
            const symbol = isAfter ? check.after : check.before;
            const symbolColor = symbol === "✓" ? theme.green : symbol === "✗" ? theme.red : theme.textMuted;

            return (
              <div key={check.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 20,
                    textAlign: "center",
                    color: symbolColor,
                    fontSize: 14,
                    fontFamily: theme.fontMono,
                    fontWeight: 600,
                  }}
                >
                  {symbol}
                </span>
                <span style={{ color: theme.textSecondary, fontSize: 14, fontFamily: theme.fontSans }}>
                  {check.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: "absolute",
          bottom: "12%",
          fontSize: 16,
          fontFamily: theme.fontSans,
          color: theme.textMuted,
          opacity: interpolate(frame, [48, 58], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        Bad setup = bad agent
      </div>
    </AbsoluteFill>
  );
};
