import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { playerEngine, usePlayerStore } from "./playerEngine";
import { api } from "@/shared/api";
import type { Track } from "@/shared/types";

const mk = (id: string): Track => ({
  id,
  title: `Track ${id}`,
  artists: `Artist ${id}`,
  durationMs: 180000,
  coverUrl: "",
  playCount: 0,
});

const radioItems = (ids: string[]) =>
  ({
    items: ids.map((id) => ({
      id,
      title: `Track ${id}`,
      artists: `Artist ${id}`,
      durationMs: 180000,
    })),
  }) as any;

describe("smart shuffle", () => {
  let getRadio: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    usePlayerStore.setState({
      status: "idle",
      queue: [],
      currentIndex: -1,
      currentTrack: null,
      positionMs: 0,
      durationMs: 0,
      repeat: "off",
      shuffle: false,
      smartShuffle: false,
      error: null,
      autoplaySimilar: false,
      playbackContext: null,
    });
    getRadio = vi.spyOn(api, "getRadio");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  it("cycles off -> shuffle -> smart shuffle -> off", async () => {
    getRadio.mockResolvedValue(radioItems([]));
    playerEngine.cycleShuffleMode();
    expect(usePlayerStore.getState()).toMatchObject({
      shuffle: true,
      smartShuffle: false,
    });
    playerEngine.cycleShuffleMode();
    expect(usePlayerStore.getState()).toMatchObject({
      shuffle: true,
      smartShuffle: true,
    });
    playerEngine.cycleShuffleMode();
    expect(usePlayerStore.getState()).toMatchObject({
      shuffle: false,
      smartShuffle: false,
    });
  });

  it("mixes recommendations into the upcoming queue and drops them when turned off", async () => {
    const tracks = ["1", "2", "3", "4", "5", "6", "7"].map(mk);
    await playerEngine.playTrack(tracks[0], tracks, "playlist:p");

    getRadio.mockResolvedValue(radioItems(["r1", "r2", "r3", "1"]));
    playerEngine.setSmartShuffle(true);
    await flush();

    const queue = usePlayerStore.getState().queue;
    expect(queue[0].id).toBe("1");
    const picks = queue.filter((t) => t.smartShuffle);
    // "1" is already queued, so only the three new tracks are mixed in
    expect(picks.map((t) => t.id).sort()).toEqual(["r1", "r2", "r3"]);
    expect(queue.filter((t) => !t.smartShuffle)).toHaveLength(7);
    // the first pick lands after the first few original tracks, not up front
    expect(queue[1].smartShuffle).toBeFalsy();

    playerEngine.setShuffle(false);
    const after = usePlayerStore.getState();
    expect(after.smartShuffle).toBe(false);
    expect(after.queue.map((t) => t.id)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
    ]);
  });
});
