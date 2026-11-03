import { useMemo, useSyncExternalStore } from "react";
import { api, toClientTrack } from "@/shared/api";
import { usePlayerStore } from "@/features/player/store/playerStore";
import { usePlaylistsList } from "@/features/library/hooks/usePlaylists";
import type { PopularItem } from "./usePopularTracks";
import { loadWithRetry, useSessionOwner } from "./sessionAwareLoad";
import { freshFor, useCachedResource } from "@/shared/cache/useCachedResource";
import {
  LAST_LISTENED_LIMIT,
  dedupeLastListened,
  parseContextString,
  resolveLastListened,
  toLastListenedItem,
  type LastListenedItem,
} from "../lib/lastListened";

export const recentlyPlayedKeys = {
  all: ["recently_played"] as const,
};

interface RecentlyPlayed {
  items: PopularItem[];
  /** most recent first; one tile per song, or per playlist/album it was played from */
  lastListened: LastListenedItem[];
}

const EMPTY_ITEMS: PopularItem[] = [];
const EMPTY_LAST_LISTENED: LastListenedItem[] = [];
const RECENT_POLICY = { isFresh: freshFor(60_000), revalidateOnFocus: true };
// keep a few spare tiles: playlists whose title cannot be found later fall
// back to their song, which may collapse into another tile
const LAST_LISTENED_SPARE = LAST_LISTENED_LIMIT * 2;

async function loadRecentlyPlayed(limit: number): Promise<RecentlyPlayed> {
  const fetchLimit = Math.min(100, Math.max(limit * 3, 60));
  const res = await loadWithRetry(
    () => api.getHistory(undefined, fetchLimit),
    () => true,
  );
  const lastListened = dedupeLastListened(
    (res.items || [])
      .filter((entry) => entry.track?.id)
      .map((entry) =>
        toLastListenedItem(toClientTrack(entry.track), entry.context),
      ),
    LAST_LISTENED_SPARE,
  );
  const seen = new Set<string>();
  const items: PopularItem[] = [];
  for (const entry of res.items || []) {
    if (!entry.track?.id) continue;

    const isAlbum = entry.context?.type === "album";
    const albumId = isAlbum
      ? entry.context?.id || entry.track.album?.id
      : undefined;

    if (albumId) {
      const albumKey = `album:${albumId}`;
      if (seen.has(albumKey)) continue;
      seen.add(albumKey);
      seen.add(`track:${entry.track.id}`);

      const clientTrack = toClientTrack(entry.track);
      items.push({
        type: "album",
        item: {
          id: albumId,
          title: entry.track.album?.title || clientTrack.title,
          artist: clientTrack.artists,
          coverUrl: clientTrack.coverUrl,
          totalTracks: 0,
          albumType: "album",
        },
        playCount: 1,
      });
    } else {
      const trackKey = `track:${entry.track.id}`;
      if (seen.has(trackKey)) continue;
      seen.add(trackKey);

      items.push({
        type: "track",
        item: toClientTrack(entry.track),
        playCount: 1,
      });
    }

    if (items.length >= limit) {
      break;
    }
  }
  return { items, lastListened };
}

// songs started in this app session, newest first. merged over the server
// history so "Last listened" updates the moment a song starts playing instead
// of waiting for the next history fetch (which may not have it yet)
let localPlays: LastListenedItem[] = [];
let lastRecordedId: string | null = null;
const localPlayListeners = new Set<() => void>();

function setLocalPlays(next: LastListenedItem[]) {
  localPlays = next;
  localPlayListeners.forEach((listener) => listener());
}

function subscribeLocalPlays(listener: () => void) {
  localPlayListeners.add(listener);
  return () => {
    localPlayListeners.delete(listener);
  };
}

usePlayerStore.subscribe((state) => {
  const track = state.currentTrack;
  if (state.status !== "playing" || !track || track.id === lastRecordedId) {
    return;
  }
  lastRecordedId = track.id;
  const item = toLastListenedItem(
    track,
    parseContextString(state.playbackContext),
    state.playbackContextCover,
  );
  setLocalPlays(dedupeLastListened([item, ...localPlays], LAST_LISTENED_SPARE));
});

if (typeof window !== "undefined") {
  window.addEventListener("auth:changed", () => {
    lastRecordedId = null;
    setLocalPlays([]);
  });
}

export function useRecentlyPlayed(limit = 20) {
  const owner = useSessionOwner();
  // v2: the cached value now also holds the "Last listened" tiles
  const { data, isLoading } = useCachedResource(
    `home:recent:v2:${owner}:${limit}`,
    () => loadRecentlyPlayed(limit),
    RECENT_POLICY,
  );
  const local = useSyncExternalStore(
    subscribeLocalPlays,
    () => localPlays,
    () => localPlays,
  );
  const { data: playlistData } = usePlaylistsList();
  const serverItems = data?.lastListened ?? EMPTY_LAST_LISTENED;
  // this session's plays go first: the server history may not have them yet
  const lastListened = useMemo(
    () =>
      resolveLastListened([...local, ...serverItems], playlistData.playlists),
    [local, serverItems, playlistData.playlists],
  );
  return { data: data?.items ?? EMPTY_ITEMS, lastListened, isLoading };
}
