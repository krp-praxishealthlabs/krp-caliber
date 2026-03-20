import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Logo } from "./Logo";
import { theme } from "./theme";

export const CallToAction: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const cmdSpring = spring({ frame: frame - 8, fps, config: { damping: 14, stiffness: 90 } });
  const taglineOpacity = interpolate(frame, [18, 30], [0, 1], { extrapolateRight: "clamp" });
  const linksOpacity = interpolate(frame, [28, 40], [0, 1], { extrapolateRight: "clamp" });

  // Subtle background glow
  const glowIntensity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: `radial-gradient(ellipse 50% 50% at 50% 45%, ${theme.brand3}${Math.round(glowIntensity * 8).toString(16).padStart(2, "0")}, transparent)`,
      }}
    >
      {/* Logo mark */}
      <div
        style={{
          opacity: logoSpring,
          transform: `scale(${interpolate(logoSpring, [0, 1], [0.8, 1])})`,
          marginBottom: 20,
        }}
      >
        <Logo size={0.7} animate={false} />
      </div>

      {/* Brand name */}
      <div
        style={{
          fontSize: 48,
          fontWeight: 700,
          fontFamily: theme.fontSans,
          letterSpacing: "-0.03em",
          background: `linear-gradient(135deg, ${theme.brand1}, ${theme.brand3})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          opacity: logoSpring,
          marginBottom: 20,
        }}
      >
        caliber
      </div>

      {/* Command */}
      <div
        style={{
          backgroundColor: theme.surface,
          border: `1px solid ${theme.surfaceBorder}`,
          borderRadius: 28,
          padding: "12px 32px",
          opacity: cmdSpring,
          transform: `translateY(${interpolate(cmdSpring, [0, 1], [10, 0])}px)`,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ color: theme.textMuted, fontFamily: theme.fontMono, fontSize: 16 }}>$</span>
        <span style={{ color: theme.text, fontFamily: theme.fontMono, fontSize: 16, fontWeight: 500 }}>
          npx @rely-ai/caliber init
        </span>
      </div>

      {/* Tagline */}
      <div
        style={{
          marginTop: 20,
          fontSize: 18,
          fontFamily: theme.fontSans,
          color: theme.textSecondary,
          opacity: taglineOpacity,
          fontWeight: 400,
        }}
      >
        One command. Every AI agent. Always in sync.
      </div>

      {/* Social links */}
      <div
        style={{
          position: "absolute",
          bottom: "12%",
          display: "flex",
          gap: 24,
          opacity: linksOpacity,
        }}
      >
        {["GitHub", "npm", "Discord"].map((link) => (
          <span
            key={link}
            style={{
              fontSize: 13,
              fontFamily: theme.fontSans,
              color: theme.textMuted,
              fontWeight: 500,
            }}
          >
            {link}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
