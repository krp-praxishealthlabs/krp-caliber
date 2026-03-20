import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "./theme";
import { SkillsShIcon, AwesomeIcon, OpenSkillsIcon } from "./ToolIcons";

const registries = [
  { name: "Skills.sh", desc: "Official registry", Icon: SkillsShIcon, color: theme.brand1 },
  { name: "Awesome Claude Code", desc: "Community curated", Icon: AwesomeIcon, color: theme.brand2 },
  { name: "OpenSkills", desc: "agentskills.io", Icon: OpenSkillsIcon, color: theme.green },
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

  const headerOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: 55,
        background: `radial-gradient(ellipse 50% 40% at 50% 60%, ${theme.accent}05, transparent)`,
      }}
    >
      {/* Section label */}
      <div
        style={{
          fontSize: 14,
          fontFamily: theme.fontMono,
          color: theme.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          opacity: headerOpacity,
          marginBottom: 6,
        }}
      >
        Community Skills
      </div>

      {/* Headline */}
      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          fontFamily: theme.fontSans,
          color: theme.text,
          opacity: headerOpacity,
          marginBottom: 32,
          letterSpacing: "-0.02em",
        }}
      >
        Auto-installed from registries
      </div>

      {/* Registry sources with real icons */}
      <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
        {registries.map((reg, i) => {
          const s = spring({ frame: frame - 4 - i * 4, fps, config: { damping: 14, stiffness: 100 } });
          return (
            <div
              key={reg.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 20px",
                borderRadius: theme.radius,
                backgroundColor: theme.surface,
                border: `1px solid ${theme.surfaceBorder}`,
                opacity: s,
                transform: `translateY(${interpolate(s, [0, 1], [12, 0])}px)`,
              }}
            >
              <reg.Icon size={22} color={reg.color} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: theme.fontSans,
                    color: reg.color,
                  }}
                >
                  {reg.name}
                </span>
                <span style={{ fontSize: 10, color: theme.textMuted, fontFamily: theme.fontSans }}>
                  {reg.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Flow arrow dots */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, alignItems: "center" }}>
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
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: theme.brand2,
                opacity: dotOpacity,
              }}
            />
          );
        })}
        <span style={{ color: theme.textMuted, fontSize: 14, marginLeft: 4 }}>↓</span>
      </div>

      {/* Skill cards */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", maxWidth: 860 }}>
        {skills.map((skill, i) => {
          const delay = 18 + i * 3;
          const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 90 } });
          return (
            <div
              key={skill.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: theme.surface,
                border: `1px solid ${theme.surfaceBorder}`,
                borderRadius: theme.radiusSm,
                padding: "10px 16px",
                opacity: s,
                transform: `translateY(${interpolate(s, [0, 1], [14, 0])}px) scale(${interpolate(s, [0, 1], [0.95, 1])})`,
              }}
            >
              <span style={{ fontSize: 13, opacity: 0.6 }}>{skill.icon}</span>
              <span
                style={{
                  color: theme.text,
                  fontSize: 13,
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
    </AbsoluteFill>
  );
};
