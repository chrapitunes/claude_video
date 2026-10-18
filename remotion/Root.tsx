import React from "react";
import { Composition } from "remotion";
import { Reel } from "./Reel";
import { SCHEDULE, T, Version } from "./theme";

// A and B differ only in the opening voice line (01A / 01B), which also sets
// how long the hook scene runs.
export const Root: React.FC = () => (
  <>
    {(["A", "B"] as Version[]).map((v) => (
      <React.Fragment key={v}>
        <Composition
          id={`ReelShowreel${v}`}
          component={Reel}
          durationInFrames={SCHEDULE[v].frames}
          fps={T.fps}
          width={T.width}
          height={T.height}
          defaultProps={{ version: v }}
        />
      </React.Fragment>
    ))}
  </>
);
