import { queryCache } from "@/shared/cache/queryCache";
import type { PlaybackContext } from "@/shared/api";
import type { Track } from "@/shared/types";

export const LAST_LISTENED_LIMIT = 8;

export type LastListenedCollectionKind = "playlist" | "album";

/**
 * one tile in "Last listened": songs played from a playlist or album collapse
 * into a single tile for that playlist/album, everything else is the song itself
 */
export type LastListenedItem =
  | { kind: "track"; key: string; track: Track }
  | {
      kind: LastListenedCollectionKind;
      key: string;
      id: string;
      /** empty until it can be looked up (see resolveLastListened) */
      title: string;
      coverUrl: string;
      /** the song that was playing, used when the title cannot be found */
      track: Track;
    };

interface CachedCollection {
  title?: string;
  coverUrl?: string;
}

/** "playlist:abc" -> { type: "playlist", id: "abc" }; plain labels have no id */
export function parseContextString(
  context: string | null | undefined,
): PlaybackContext | undefined {
  if (!context) return undefined;
  const separator = context.indexOf(":");
  if (separator < 0) return { type: context };
  return {
    type: context.slice(0, separator),
    id: context.slice(separator + 1),
  };
}

function cachedCollection(
  kind: LastListenedCollectionKind,
  id: string,
): CachedCollection | undefined {
  if (kind === "playlist") {
    return (
      queryCache.get<CachedCollection>(`playlist:detail:${id}`) ??
      queryCache.get<CachedCollection>(`collection:playlist:${id}`)
    );
  }
  return queryCache.get<CachedCollection>(`collection:album:${id}`);
}

export function toLastListenedItem(
  track: Track,
  context?: PlaybackContext,
  contextCover?: string | null,
): LastListenedItem {
  const kind = context?.type;
  const id = context?.id || (kind === "album" ? track.album?.id : undefined);
  if ((kind === "playlist" || kind === "album") && id) {
    const cached = cachedCollection(kind, id);
    return {
      kind,
      key: `${kind}:${id}`,
      id,
      title:
        cached?.title ||
        (kind === "album" ? track.album?.title : undefined) ||
        "",
      coverUrl: contextCover || cached?.coverUrl || track.coverUrl,
      track,
    };
  }
  return { kind: "track", key: `track:${track.id}`, track };
}

/** newest first, one tile per key, capped */
export function dedupeLastListened(
  items: LastListenedItem[],
  limit = LAST_LISTENED_LIMIT,
): LastListenedItem[] {
  const seen = new Set<string>();
  const result: LastListenedItem[] = [];
  for (const item of items) {
    if (seen.has(item.key)) continue;
    seen.add(item.key);
    result.push(item);
    if (result.length >= limit) break;
  }
  return result;
}

/**
 * fills in playlist titles from the user's own playlists; a playlist that still
 * has no title falls back to showing the song that was played from it
 */
export function resolveLastListened(
  items: LastListenedItem[],
  ownPlaylists: { id: string; title: string; coverUrl: string }[],
): LastListenedItem[] {
  const byId = new Map(ownPlaylists.map((p) => [p.id, p]));
  return dedupeLastListened(
    items.map((item): LastListenedItem => {
      if (item.kind === "track" || item.title) return item;
      const own = item.kind === "playlist" ? byId.get(item.id) : undefined;
      if (own) {
        return {
          ...item,
          title: own.title,
          coverUrl: own.coverUrl || item.coverUrl,
        };
      }
      return {
        kind: "track",
        key: `track:${item.track.id}`,
        track: item.track,
      };
    }),
  );
}
