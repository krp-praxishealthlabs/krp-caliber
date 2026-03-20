// Minimal recognizable SVG icons for each tool/platform
// Each renders at the given size (default 24px)

interface IconProps {
  size?: number;
  color?: string;
}

// Anthropic Claude — the sparkle/starburst mark
export const ClaudeIcon: React.FC<IconProps> = ({ size = 24, color = "#d4a574" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
      fill={color}
    />
  </svg>
);

// Cursor — angular bracket/cursor shape
export const CursorIcon: React.FC<IconProps> = ({ size = 24, color = "#7dd3fc" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M5 3L19 12L5 21V3Z"
      fill={color}
      opacity={0.9}
    />
    <path
      d="M12 12L19 19"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
    />
  </svg>
);

// OpenAI / Codex — hexagonal shape
export const CodexIcon: React.FC<IconProps> = ({ size = 24, color = "#86efac" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2L21.5 7.5V16.5L12 22L2.5 16.5V7.5L12 2Z"
      stroke={color}
      strokeWidth={1.8}
      fill={`${color}15`}
    />
    <circle cx={12} cy={12} r={3.5} fill={color} opacity={0.7} />
  </svg>
);

// GitHub Copilot — pilot goggles silhouette
export const CopilotIcon: React.FC<IconProps> = ({ size = 24, color = "#c4b5fd" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M4 11C4 8.5 6.5 6 9.5 6H14.5C17.5 6 20 8.5 20 11V13C20 15.5 17.5 18 14.5 18H9.5C6.5 18 4 15.5 4 13V11Z"
      stroke={color}
      strokeWidth={1.8}
      fill={`${color}10`}
    />
    <circle cx={9} cy={12} r={2.5} fill={color} opacity={0.6} />
    <circle cx={15} cy={12} r={2.5} fill={color} opacity={0.6} />
    <path d="M11.5 12H12.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </svg>
);

// Skills.sh — terminal prompt icon
export const SkillsShIcon: React.FC<IconProps> = ({ size = 24, color = "#fdba74" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x={2} y={4} width={20} height={16} rx={3} stroke={color} strokeWidth={1.5} fill={`${color}10`} />
    <path d="M6 10L10 13L6 16" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13 16H18" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </svg>
);

// Awesome Claude Code — star icon (community curated)
export const AwesomeIcon: React.FC<IconProps> = ({ size = 24, color = "#fb923c" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      fill={color}
      opacity={0.85}
    />
  </svg>
);

// OpenSkills / agentskills.io — connected nodes
export const OpenSkillsIcon: React.FC<IconProps> = ({ size = 24, color = "#22c55e" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx={12} cy={6} r={3} fill={color} opacity={0.7} />
    <circle cx={6} cy={18} r={3} fill={color} opacity={0.7} />
    <circle cx={18} cy={18} r={3} fill={color} opacity={0.7} />
    <path d="M12 9V12M9 15L12 12M15 15L12 12" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </svg>
);
