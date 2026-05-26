import { describe, expect, it } from "vitest";
import { groupAssetsByFrameSize, sortFrameSizeGroups } from "./orderAssetLabels";
import type { OrderAssetRow } from "./orderAssetLabels";

function asset(frameSize: string, id: string): OrderAssetRow {
  return {
    id,
    orderId: "O-1",
    frameSize,
    r2Key: `k/${id}.png`,
    assetType: "DESIGN_PREVIEW",
    isFinal: false,
  };
}

describe("groupAssetsByFrameSize", () => {
  it("groups by frameSize and sorts labels", () => {
    const groups = groupAssetsByFrameSize([
      asset("8x5", "a2"),
      asset("5x7", "a1"),
      asset("5x7", "a3"),
    ]);
    expect(groups.map(([label]) => label)).toEqual(["5x7", "8x5"]);
    expect(groups[0][1]).toHaveLength(2);
  });
});

describe("sortFrameSizeGroups", () => {
  it("orders groups by line sortOrder", () => {
    const groups = groupAssetsByFrameSize([asset("8x5", "a2"), asset("5x7", "a1")]);
    const sorted = sortFrameSizeGroups(groups, [
      { frameSize: "8x5", sortOrder: 1 },
      { frameSize: "5x7", sortOrder: 0 },
    ]);
    expect(sorted.map(([label]) => label)).toEqual(["5x7", "8x5"]);
  });
});
