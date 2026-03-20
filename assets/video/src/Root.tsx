import { Composition } from "remotion";
import { CaliberDemo } from "./CaliberDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CaliberDemo"
      component={CaliberDemo}
      durationInFrames={450}
      fps={30}
      width={1280}
      height={720}
    />
  );
};
