import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface LogoProps {
  size?: number;
  animate?: boolean;
  delay?: number;
}

export const Logo: React.FC<LogoProps> = ({ size = 1, animate = true, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bars = [
    { width: 56, y: 0, color: "#fdba74", barDelay: 2 },
    { width: 100, y: 28, color: "#fb923c", barDelay: 0 },
    { width: 154, y: 56, color: "#f97316", barDelay: 0 },
  ];

  return (
    <div style={{ position: "relative", width: 154 * size, height: 76 * size }}>
      {bars.map((bar, i) => {
        const s = animate
          ? spring({ frame: frame - delay - i * 4, fps, config: { damping: 12, stiffness: 120 } })
          : 1;
        const scaleX = interpolate(s, [0, 1], [0, 1]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: bar.y * size,
              width: bar.width * size,
              height: 20 * size,
              borderRadius: 5 * size,
              backgroundColor: bar.color,
              transform: `translateX(-50%) scaleX(${scaleX})`,
              boxShadow: `0 0 ${20 * size}px ${bar.color}40`,
            }}
          />
        );
      })}
    </div>
  );
};
