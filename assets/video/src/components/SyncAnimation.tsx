import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "./theme";
import { ClaudeIcon, CursorIcon, CodexIcon, CopilotIcon } from "./ToolIcons";

const outputFiles = [
  { name: "CLAUDE.md", platform: "Claude Code", Icon: ClaudeIcon, color: "#d4a574" },
  { name: ".cursor/rules/", platform: "Cursor", Icon: CursorIcon, color: "#7dd3fc" },
  { name: "AGENTS.md", platform: "Codex", Icon: CodexIcon, color: "#86efac" },
  { name: "copilot-instructions.md", platform: "Copilot", Icon: CopilotIcon, color: "#c4b5fd" },
];

export const SyncAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const codeSpring = spring({ frame, fps, config: { damping: 16, stiffness: 100 } });
  const arrowProgress = interpolate(frame, [14, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Continuous sync loop indicator
  const loopPulse = Math.sin(((frame % 30) / 30) * Math.PI * 2);
  const loopOpacity = interpolate(frame, [50, 60], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: `radial-gradient(ellipse 50% 40% at 30% 50%, ${theme.green}05, transparent)`,
      }}
    >
      {/* Section label */}
      <div
        style={{
          position: "absolute",
          top: "8%",
          fontSize: 14,
          fontFamily: theme.fontMono,
          color: theme.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          opacity: headerOpacity,
        }}
      >
        $ caliber refresh
      </div>

      {/* Headline */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          fontSize: 28,
          fontWeight: 700,
          fontFamily: theme.fontSans,
          color: theme.text,
          opacity: headerOpacity,
          letterSpacing: "-0.02em",
        }}
      >
        Configs stay fresh as your code evolves
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 32, marginTop: 16 }}>
        {/* Code diff card */}
        <div
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.surfaceBorder}`,
            borderRadius: theme.radius,
            padding: "18px 22px",
            opacity: codeSpring,
            transform: `scale(${interpolate(codeSpring, [0, 1], [0.95, 1])})`,
            minWidth: 280,
          }}
        >
          {/* macOS window dots */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: `1px solid ${theme.surfaceBorder}`,
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.red }} />
            <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.yellow }} />
            <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.green }} />
            <span style={{ color: theme.textMuted, fontSize: 11, fontFamily: theme.fontMono, marginLeft: 8 }}>
              git diff
            </span>
          </div>
          <div style={{ fontFamily: theme.fontMono, fontSize: 12, lineHeight: 1.9 }}>
            <div>
              <span style={{ color: theme.green, fontWeight: 600 }}>+</span>
              <span style={{ color: "#c4b5fd" }}> export function </span>
              <span style={{ color: theme.text }}>authenticate</span>
            </div>
            <div>
              <span style={{ color: theme.green, fontWeight: 600 }}>+</span>
              <span style={{ color: "#c4b5fd" }}> export function </span>
              <span style={{ color: theme.text }}>authorize</span>
            </div>
            <div>
              <span style={{ color: theme.green, fontWeight: 600 }}>+</span>
              <span style={{ color: "#c4b5fd" }}> export function </span>
              <span style={{ color: theme.text }}>rateLimit</span>
            </div>
            <div style={{ marginTop: 6, color: theme.textMuted, fontSize: 10 }}>
              src/lib/auth.ts — 3 new exports
            </div>
          </div>
        </div>

        {/* Sync arrow — circular refresh indicator */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: theme.surface,
              border: `1px solid ${theme.surfaceBorder}`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              opacity: arrowProgress,
              transform: `scale(${arrowProgress})`,
              boxShadow: `0 0 20px ${theme.brand3}15`,
            }}
          >
            {/* Circular arrow SVG */}
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <path
                d="M4 12C4 7.58 7.58 4 12 4C15.37 4 18.24 6.11 19.38 9"
                stroke={theme.brand2}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <path
                d="M20 12C20 16.42 16.42 20 12 20C8.63 20 5.76 17.89 4.62 15"
                stroke={theme.brand2}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <path d="M17 9H20V6" stroke={theme.brand2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 15H4V18" stroke={theme.brand2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span
            style={{
              fontSize: 11,
              fontFamily: theme.fontMono,
              color: theme.brand2,
              opacity: arrowProgress,
              fontWeight: 600,
            }}
          >
            sync
          </span>
        </div>

        {/* Output files with platform icons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {outputFiles.map((file, i) => {
            const delay = 18 + i * 5;
            const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 90 } });
            return (
              <div
                key={file.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 14px",
                  backgroundColor: theme.surface,
                  border: `1px solid ${theme.surfaceBorder}`,
                  borderRadius: theme.radiusSm,
                  opacity: s,
                  transform: `translateX(${interpolate(s, [0, 1], [16, 0])}px)`,
                }}
              >
                <file.Icon size={18} color={file.color} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ color: theme.text, fontSize: 13, fontFamily: theme.fontMono, fontWeight: 500 }}>
                    {file.name}
                  </span>
                  <span style={{ color: theme.textMuted, fontSize: 10, fontFamily: theme.fontSans }}>
                    {file.platform}
                  </span>
                </div>
                <span style={{ color: theme.green, fontSize: 12, fontWeight: 700, marginLeft: "auto" }}>✓</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Continuous sync emphasis bar */}
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 24px",
          borderRadius: 24,
          backgroundColor: `${theme.brand3}10`,
          border: `1px solid ${theme.brand3}20`,
          opacity: loopOpacity,
        }}
      >
        {/* Pulsing dot */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.green,
            boxShadow: `0 0 ${6 + loopPulse * 4}px ${theme.green}60`,
          }}
        />
        <span style={{ color: theme.textSecondary, fontSize: 13, fontFamily: theme.fontSans, fontWeight: 500 }}>
          Every push. Every branch. Always in sync.
        </span>
      </div>
    </AbsoluteFill>
  );
};
