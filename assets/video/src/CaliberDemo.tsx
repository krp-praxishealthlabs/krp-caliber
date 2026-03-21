import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { ScoreTransition } from "./components/ScoreTransition";
import { EcosystemHub } from "./components/EcosystemHub";
import { SkillsFlow } from "./components/SkillsFlow";
import { SyncAnimation } from "./components/SyncAnimation";
import { ROIStats } from "./components/ROIStats";
import { theme } from "./components/theme";

const CrossFade: React.FC<{ children: React.ReactNode; from: number; duration: number }> = ({
  children,
  from,
  duration,
}) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [from, from + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [from + duration - 10, from + duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// 20 seconds = 600 frames @ 30fps
// Scene breakdown (each scene gets 4 seconds = 120 frames):
//   0-4s   (0-120):   EcosystemHub — Bring your own AI
//   4-8s   (120-240): ScoreTransition — Fully runs on your setup
//   8-12s  (240-360): SkillsFlow — Best skills & MCPs
//   12-16s (360-480): SyncAnimation — Continuous sync
//   16-20s (480-600): ROI + CTA — Max velocity, min cost

export const CaliberDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, fontFamily: theme.fontSans }}>
      {/* Subtle grid texture */}
      <AbsoluteFill
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, ${theme.surfaceHeader} 39px, ${theme.surfaceHeader} 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, ${theme.surfaceHeader} 39px, ${theme.surfaceHeader} 40px)`,
          backgroundSize: "40px 40px",
          opacity: 0.4,
        }}
      />

      {/* 0-4s: Ecosystem hub — Bring your own AI */}
      <CrossFade from={0} duration={120}>
        <Sequence from={0} durationInFrames={120}>
          <EcosystemHub />
        </Sequence>
      </CrossFade>

      {/* 4-8s: Score — Fully runs on your setup */}
      <CrossFade from={120} duration={120}>
        <Sequence from={120} durationInFrames={120}>
          <ScoreTransition />
        </Sequence>
      </CrossFade>

      {/* 8-12s: Skills — Best skills & MCPs */}
      <CrossFade from={240} duration={120}>
        <Sequence from={240} durationInFrames={120}>
          <SkillsFlow />
        </Sequence>
      </CrossFade>

      {/* 12-16s: Continuous sync */}
      <CrossFade from={360} duration={120}>
        <Sequence from={360} durationInFrames={120}>
          <SyncAnimation />
        </Sequence>
      </CrossFade>

      {/* 16-20s: ROI + CTA */}
      <CrossFade from={480} duration={120}>
        <Sequence from={480} durationInFrames={120}>
          <ROIStats />
        </Sequence>
      </CrossFade>
    </AbsoluteFill>
  );
};
