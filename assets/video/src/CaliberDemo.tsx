import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { ScoreTransition } from "./components/ScoreTransition";
import { EcosystemHub } from "./components/EcosystemHub";
import { SkillsFlow } from "./components/SkillsFlow";
import { SyncAnimation } from "./components/SyncAnimation";
import { ROIStats } from "./components/ROIStats";
import { CallToAction } from "./components/CallToAction";
import { theme } from "./components/theme";

const CrossFade: React.FC<{ children: React.ReactNode; from: number; duration: number }> = ({
  children,
  from,
  duration,
}) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [from, from + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [from + duration - 8, from + duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// 15 seconds = 450 frames @ 30fps
// Scene breakdown:
//   0-3s   (0-90):   EcosystemHub — logo + editors with real icons
//   3-5.5s (90-165):  ScoreTransition — 47 → 94
//   5.5-8s (165-240): SkillsFlow — registries + skills
//   8-11s  (240-330): SyncAnimation — continuous sync (enhanced)
//  11-13s  (330-390): ROI Stats — the payoff numbers
//  13-15s  (390-450): CTA — install + tagline

export const CaliberDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, fontFamily: theme.fontSans }}>
      {/* Subtle grid texture */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${theme.surfaceBorder}40 1px, transparent 1px), linear-gradient(90deg, ${theme.surfaceBorder}40 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          opacity: 0.3,
        }}
      />

      {/* 0-3s: Ecosystem hub */}
      <CrossFade from={0} duration={90}>
        <Sequence from={0} durationInFrames={90}>
          <EcosystemHub />
        </Sequence>
      </CrossFade>

      {/* 3-5.5s: Score transformation */}
      <CrossFade from={90} duration={75}>
        <Sequence from={90} durationInFrames={75}>
          <ScoreTransition />
        </Sequence>
      </CrossFade>

      {/* 5.5-8s: Community skills */}
      <CrossFade from={165} duration={75}>
        <Sequence from={165} durationInFrames={75}>
          <SkillsFlow />
        </Sequence>
      </CrossFade>

      {/* 8-11s: Continuous sync (enhanced) */}
      <CrossFade from={240} duration={90}>
        <Sequence from={240} durationInFrames={90}>
          <SyncAnimation />
        </Sequence>
      </CrossFade>

      {/* 11-13s: ROI stats */}
      <CrossFade from={330} duration={60}>
        <Sequence from={330} durationInFrames={60}>
          <ROIStats />
        </Sequence>
      </CrossFade>

      {/* 13-15s: CTA */}
      <CrossFade from={390} duration={60}>
        <Sequence from={390} durationInFrames={60}>
          <CallToAction />
        </Sequence>
      </CrossFade>
    </AbsoluteFill>
  );
};
