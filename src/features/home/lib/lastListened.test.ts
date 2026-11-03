import { describe, expect, it } from "vitest";
import type { Track } from "@/shared/types";
import {
  dedupeLastListened,
  parseContextString,
  resolveLastListened,
  toLastListenedItem,
} from "./lastListened";

const mk = (id: string, album?: { id: string; title: string }): Track => ({
  id,
  title: `Track ${id}`,
  artists: `Artist ${id}`,
  durationMs: 180000,
  coverUrl: `cover-${id}`,
  playCount: 0,
  album,
});

describe("last listened", () => {
  it("parses playlist and album contexts", () => {
    expect(parseContextString("playlist:abc")).toEqual({
      type: "playlist",
      id: "abc",
    });
    expect(parseContextString("Your Mix 1")).toEqual({ type: "Your Mix 1" });
    expect(parseContextString(null)).toBeUndefined();
  });

  it("collapses songs played from one playlist into a single tile", () => {
    const items = dedupeLastListened([
      toLastListenedItem(mk("1"), { type: "playlist", id: "p" }, "pcover"),
      toLastListenedItem(mk("2"), { type: "playlist", id: "p" }),
      toLastListenedItem(mk("3"), { type: "search" }),
      toLastListenedItem(mk("4"), { type: "playlist", id: "p" }),
    ]);
    expect(items.map((i) => i.key)).toEqual(["playlist:p", "track:3"]);
    expect(items[0]).toMatchObject({ coverUrl: "pcover" });
  });

  it("uses the album title of the song for albums", () => {
    const item = toLastListenedItem(mk("1", { id: "a", title: "Abbey Road" }), {
      type: "album",
      id: "a",
    });
    expect(item).toMatchObject({ kind: "album", title: "Abbey Road" });
  });

  it("names own playlists and falls back to the song when a title is unknown", () => {
    const items = resolveLastListened(
      [
        toLastListenedItem(mk("1"), { type: "playlist", id: "mine" }),
        toLastListenedItem(mk("2"), { type: "playlist", id: "unknown" }),
      ],
      [{ id: "mine", title: "Gym", coverUrl: "gym-cover" }],
    );
    expect(items[0]).toMatchObject({
      kind: "playlist",
      title: "Gym",
      coverUrl: "gym-cover",
    });
    expect(items[1]).toMatchObject({ kind: "track", key: "track:2" });
  });
});
