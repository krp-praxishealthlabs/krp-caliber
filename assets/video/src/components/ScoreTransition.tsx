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

// LP-style 6-category breakdown
const categories = [
  { label: "Files & Setup", before: 6, after: 24, max: 25 },
  { label: "Quality", before: 12, after: 22, max: 25 },
  { label: "Grounding", before: 7, after: 19, max: 20 },
  { label: "Accuracy", before: 5, after: 13, max: 15 },
  { label: "Freshness", before: 5, after: 10, max: 10 },
  { label: "Bonus", before: 2, after: 5, max: 5 },
];

export const ScoreTransition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const transitionProgress = spring({ frame: frame - 30, fps, config: { damping: 22, mass: 0.8 } });
  const score = Math.round(interpolate(transitionProgress, [0, 1], [47, 94]));
  const barWidth = interpolate(transitionProgress, [0, 1], [47, 94]);
  const scoreColor = getScoreColor(score);
  const grade = getGrade(score);

  const glowIntensity = score >= 90 ? interpolate(frame, [65, 80], [0, 1], { extrapolateRight: "clamp" }) : 0;
  const subtitleOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });

  // Blinking cursor
  const cursorVisible = Math.floor(frame / 15) % 2 === 0;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: containerOpacity,
        background: `radial-gradient(ellipse 40% 40% at 50% 50%, ${scoreColor}08, transparent)`,
      }}
    >
      {/* Terminal-style frame matching LP */}
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: theme.radiusLg,
          border: `1px solid ${theme.surfaceBorder}`,
          minWidth: 780,
          boxShadow: glowIntensity > 0
            ? `0 0 80px -20px ${theme.green}25`
            : theme.terminalGlow,
          overflow: "hidden",
        }}
      >
        {/* Terminal header bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 18px",
            backgroundColor: theme.surfaceHeader,
            borderBottom: `1px solid ${theme.surfaceBorder}`,
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: theme.red }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: theme.yellow }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: theme.green }} />
          <span style={{ color: theme.textMuted, fontSize: 16, fontFamily: theme.fontMono, marginLeft: 12 }}>
            $ caliber score
          </span>
          {/* Blinking cursor */}
          <div
            style={{
              width: 10,
              height: 20,
              backgroundColor: theme.brand3,
              opacity: cursorVisible ? 1 : 0,
            }}
          />
        </div>

        {/* Terminal body */}
        <div style={{ padding: "36px 48px" }}>
          {/* Score row */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginBottom: 20 }}>
            <span
              style={{
                color: theme.text,
                fontSize: 96,
                fontWeight: 700,
                fontFamily: theme.fontSans,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.03em",
              }}
            >
              {score}
            </span>
            <span style={{ color: theme.textMuted, fontSize: 34, fontFamily: theme.fontSans }}>/100</span>
            <div
              style={{
                marginLeft: "auto",
                padding: "8px 28px",
                borderRadius: 28,
                backgroundColor: `${scoreColor}15`,
                border: `1px solid ${scoreColor}30`,
                color: scoreColor,
                fontSize: 34,
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
                boxShadow: `0 0 14px ${scoreColor}40`,
              }}
            />
          </div>

          {/* 6-category breakdown — LP style */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 32px" }}>
            {categories.map((cat, i) => {
              const catValue = Math.round(
                interpolate(transitionProgress, [0, 1], [cat.before, cat.after])
              );
              const catProgress = catValue / cat.max;
              const catColor = catProgress >= 0.8 ? theme.green : catProgress >= 0.5 ? theme.yellow : theme.red;
              const catSpring = spring({ frame: frame - 34 - i * 3, fps, config: { damping: 14 } });

              return (
                <div
                  key={cat.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    opacity: catSpring,
                  }}
                >
                  <span style={{ color: theme.textSecondary, fontSize: 20, fontFamily: theme.fontSans, minWidth: 140 }}>
                    {cat.label}
                  </span>
                  {/* Mini bar */}
                  <div style={{ flex: 1, height: 6, backgroundColor: `${theme.textMuted}15`, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${catProgress * 100}%`, height: "100%", backgroundColor: catColor, borderRadius: 3 }} />
                  </div>
                  <span
                    style={{
                      color: catColor,
                      fontSize: 20,
                      fontWeight: 600,
                      fontFamily: theme.fontMono,
                      fontVariantNumeric: "tabular-nums",
                      minWidth: 64,
                      textAlign: "right",
                    }}
                  >
                    {catValue}/{cat.max}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Key message */}
      <div
        style={{
          position: "absolute",
          bottom: "7%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          opacity: subtitleOpacity,
        }}
      >
        <div style={{ fontSize: 28, fontFamily: theme.fontSans, color: theme.text, fontWeight: 600 }}>
          Fully runs on your setup
        </div>
        <div style={{ fontSize: 20, fontFamily: theme.fontSans, color: theme.textMuted }}>
          No code sent anywhere. 100% local scoring. No API key needed.
        </div>
      </div>
    </AbsoluteFill>
  );
};
