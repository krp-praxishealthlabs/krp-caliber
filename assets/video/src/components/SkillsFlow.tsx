import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "./theme";
import { SkillsShIcon, AwesomeIcon, OpenSkillsIcon } from "./ToolIcons";

const registries = [
  { name: "Skills.sh", desc: "Official registry", Icon: SkillsShIcon, color: theme.brand1 },
  { name: "Awesome Claude Code", desc: "Community curated", Icon: AwesomeIcon, color: theme.brand2 },
  { name: "SkillsBench", desc: "agentskills.io", Icon: OpenSkillsIcon, color: theme.green },
];

const skills = [
  { name: "add-api-route", icon: "⚡" },
  { name: "drizzle-migrate", icon: "🔄" },
  { name: "react-component", icon: "◻" },
  { name: "test-patterns", icon: "✦" },
  { name: "auth-middleware", icon: "🔒" },
  { name: "deploy-preview", icon: "🚀" },
];

export const SkillsFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [75, 95], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: 48,
        background: `radial-gradient(ellipse 50% 40% at 50% 60%, ${theme.accent}06, transparent)`,
      }}
    >
      {/* Section label */}
      <div
        style={{
          fontSize: 22,
          fontFamily: theme.fontMono,
          color: theme.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          opacity: headerOpacity,
          marginBottom: 10,
        }}
      >
        Best Skills & MCPs
      </div>

      {/* Headline */}
      <div
        style={{
          fontSize: 48,
          fontWeight: 700,
          fontFamily: theme.fontSans,
          color: theme.text,
          opacity: headerOpacity,
          marginBottom: 36,
          letterSpacing: "-0.02em",
        }}
      >
        Best playbooks, generated for your codebase
      </div>

      {/* Registry sources — LP "solution" card style */}
      <div style={{ display: "flex", gap: 20, marginBottom: 36 }}>
        {registries.map((reg, i) => {
          const s = spring({ frame: frame - 6 - i * 5, fps, config: { damping: 14, stiffness: 80 } });
          return (
            <div
              key={reg.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 28px",
                borderRadius: theme.radius,
                backgroundColor: theme.surface,
                border: `1px solid ${theme.surfaceBorder}`,
                opacity: s,
                transform: `translateY(${interpolate(s, [0, 1], [16, 0])}px)`,
                boxShadow: theme.cardGlow,
              }}
            >
              <reg.Icon size={30} color={reg.color} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    fontFamily: theme.fontSans,
                    color: reg.color,
                  }}
                >
                  {reg.name}
                </span>
                <span style={{ fontSize: 16, color: theme.textMuted, fontFamily: theme.fontSans }}>
                  {reg.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Flow dots */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, alignItems: "center" }}>
        {[0, 1, 2].map((dot) => {
          const dotOpacity = interpolate(
            (frame + dot * 6) % 24,
            [0, 12, 24],
            [0.2, 0.8, 0.2],
            { extrapolateRight: "clamp" }
          );
          return (
            <div
              key={dot}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.brand2,
                opacity: dotOpacity,
              }}
            />
          );
        })}
        <span style={{ color: theme.textMuted, fontSize: 22, marginLeft: 4 }}>↓</span>
      </div>

      {/* Skill cards */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", maxWidth: 1000 }}>
        {skills.map((skill, i) => {
          const delay = 26 + i * 4;
          const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 75 } });
          return (
            <div
              key={skill.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                backgroundColor: theme.surface,
                border: `1px solid ${theme.surfaceBorder}`,
                borderRadius: theme.radiusSm,
                padding: "14px 22px",
                opacity: s,
                transform: `translateY(${interpolate(s, [0, 1], [16, 0])}px) scale(${interpolate(s, [0, 1], [0.95, 1])})`,
              }}
            >
              <span style={{ fontSize: 22, opacity: 0.6 }}>{skill.icon}</span>
              <span
                style={{
                  color: theme.text,
                  fontSize: 22,
                  fontWeight: 500,
                  fontFamily: theme.fontMono,
                }}
              >
                {skill.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom tagline */}
      <div
        style={{
          position: "absolute",
          bottom: "7%",
          fontSize: 22,
          fontFamily: theme.fontSans,
          color: theme.textSecondary,
          opacity: subtitleOpacity,
        }}
      >
        Auto-installed from SkillsBench, Skills.sh & Awesome Claude Code
      </div>
    </AbsoluteFill>
  );
};
