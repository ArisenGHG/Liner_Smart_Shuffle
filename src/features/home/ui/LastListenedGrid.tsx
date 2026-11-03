import { memo, useCallback, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { HistoryAnticlockwiseFill, PauseFill, PlayFill } from "@mingcute/react";
import { playerEngine } from "@/features/player";
import { useSongMenuItems } from "@/features/player/hooks/useSongMenuItems";
import { usePlayerStore } from "@/features/player/store/playerStore";
import { usePlaylistsList } from "@/features/library/hooks/usePlaylists";
import CoverImage from "@/features/covers/ui/CoverImage";
import DropdownMenu from "@/shared/ui/DropdownMenu";
import { api, toClientTrack } from "@/shared/api";
import { queryCache } from "@/shared/cache/queryCache";
import type { Track } from "@/shared/types";
import type { LastListenedItem } from "../lib/lastListened";
import SectionHeading from "./SectionHeading";

export interface LastListenedGridProps {
  title: string;
  icon?: ReactNode;
  items: LastListenedItem[];
  headingMarginTop?: string;
}

type CollectionItem = Exclude<LastListenedItem, { kind: "track" }>;

/** heading icon: rewind-clock on a small violet gradient tile */
export function LastListenedIcon() {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-gradient-to-br from-violet-400 via-fuchsia-500 to-pink-500 text-white shadow-[0_2px_8px_rgba(192,38,211,0.35)]">
      <HistoryAnticlockwiseFill size={15} />
    </span>
  );
}

function useTileMenu(menuItemCount: number) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (menuItemCount === 0) return;
      e.preventDefault();
      e.stopPropagation();
      setMenuPosition({ x: e.clientX, y: e.clientY });
      setMenuOpen(true);
    },
    [menuItemCount],
  );

  const handleMenuOpenChange = useCallback((isOpen: boolean) => {
    setMenuOpen(isOpen);
    if (!isOpen) setMenuPosition(null);
  }, []);

  return { menuOpen, menuPosition, handleContextMenu, handleMenuOpenChange };
}

// spotify-style tile: cover on the left, title, round play button on hover
function Tile({
  title,
  subtitle,
  coverUrl,
  isCurrent,
  isPlaying,
  onOpen,
  onPlay,
  onContextMenu,
  children,
}: {
  title: string;
  subtitle?: string;
  coverUrl: string;
  isCurrent: boolean;
  isPlaying: boolean;
  onOpen: () => void;
  onPlay: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  children?: ReactNode;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      className="group relative flex h-[56px] min-w-0 cursor-pointer select-none items-center overflow-hidden rounded-[6px] bg-black/[0.05] transition-colors duration-150 hover:bg-black/[0.09] dark:bg-white/[0.07] dark:hover:bg-white/[0.13]"
      onClick={onOpen}
      onContextMenu={onContextMenu}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="relative h-[56px] w-[56px] shrink-0 bg-border-alpha-14 shadow-[2px_0_8px_rgba(0,0,0,0.18)]">
        {coverUrl && (
          <CoverImage
            src={coverUrl}
            alt={title}
            fill
            sizes="56px"
            className={`object-cover transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
          />
        )}
      </div>

      <span
        className="flex min-w-0 flex-1 flex-col px-[12px]"
        title={subtitle ? `${title} — ${subtitle}` : title}
      >
        <span
          className={`truncate text-label font-[600] ${
            isCurrent ? "text-accent-primary" : "text-text-primary"
          }`}
        >
          {title}
        </span>
        {subtitle && (
          <span className="truncate text-caption text-text-tertiary">
            {subtitle}
          </span>
        )}
      </span>

      <button
        type="button"
        aria-label={isPlaying ? "Pause" : "Play"}
        className={`mr-[10px] flex h-[32px] w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-accent-primary text-white shadow-[0_4px_10px_rgba(0,0,0,0.3)] transition-all duration-200 hover:scale-[1.06] active:scale-[0.94] ${
          isPlaying
            ? "translate-y-0 opacity-100"
            : "translate-y-[2px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:opacity-100"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
      >
        {isPlaying ? <PauseFill size={16} /> : <PlayFill size={16} />}
      </button>

      {children}
    </div>
  );
}

function TrackTile({
  track,
  queue,
  context,
}: {
  track: Track;
  queue: Track[];
  context: string;
}) {
  const isCurrent = usePlayerStore(
    (state) => state.currentTrack?.id === track.id,
  );
  const isPlaying = usePlayerStore(
    (state) =>
      state.currentTrack?.id === track.id &&
      (state.status === "playing" || state.status === "loading"),
  );
  const menuItems = useSongMenuItems({
    id: track.id,
    title: track.title,
    artists: track.artists,
    coverUrl: track.coverUrl,
    durationMs: track.durationMs,
    searchType: "track",
  });
  const menu = useTileMenu(menuItems.length);

  const handlePlay = useCallback(() => {
    if (isCurrent) {
      playerEngine.togglePlayPause();
      return;
    }
    void playerEngine.playTrack(track, queue, context, track.coverUrl);
  }, [isCurrent, track, queue, context]);

  return (
    <Tile
      title={track.title}
      subtitle={track.artists}
      coverUrl={track.coverUrl}
      isCurrent={isCurrent}
      isPlaying={isPlaying}
      onOpen={handlePlay}
      onPlay={handlePlay}
      onContextMenu={menu.handleContextMenu}
    >
      {menuItems.length > 0 && (
        <DropdownMenu
          trigger={<span />}
          items={menuItems}
          open={menu.menuOpen}
          onOpenChange={menu.handleMenuOpenChange}
          position={menu.menuPosition}
        />
      )}
    </Tile>
  );
}

async function loadCollectionTracks(
  item: CollectionItem,
  owned: boolean,
): Promise<Track[] | null> {
  if (owned) {
    const detail = await api.getUserPlaylist(item.id);
    return detail.items.map((entry) => toClientTrack(entry.track));
  }
  const cached = queryCache.get<{ tracks: Track[] }>(
    `collection:${item.kind}:${item.id}`,
  );
  return cached?.tracks ?? null;
}

function CollectionTile({ item }: { item: CollectionItem }) {
  const navigate = useNavigate();
  const { data: playlistData } = usePlaylistsList();
  const owned =
    item.kind === "playlist" &&
    playlistData.playlists.some((p) => p.id === item.id);
  const isCurrent = usePlayerStore(
    (state) => state.playbackContext === item.key,
  );
  const isPlaying = usePlayerStore(
    (state) =>
      state.playbackContext === item.key &&
      (state.status === "playing" || state.status === "loading"),
  );
  const menuItems = useSongMenuItems({
    id: item.id,
    title: item.title,
    artists: item.kind === "album" ? item.track.artists : "",
    coverUrl: item.coverUrl,
    searchType: item.kind,
  });
  const menu = useTileMenu(menuItems.length);

  const open = useCallback(() => {
    navigate(
      owned
        ? `/library/playlist?id=${encodeURIComponent(item.id)}`
        : `/collection?type=${item.kind}&id=${encodeURIComponent(item.id)}`,
    );
  }, [navigate, owned, item.id, item.kind]);

  const handlePlay = useCallback(async () => {
    if (isCurrent) {
      playerEngine.togglePlayPause();
      return;
    }
    const tracks = await loadCollectionTracks(item, owned).catch(() => null);
    if (!tracks || tracks.length === 0) {
      // not loaded yet: open the page, which can play it
      open();
      return;
    }
    void playerEngine.playTrack(tracks[0], tracks, item.key, item.coverUrl);
  }, [isCurrent, item, owned, open]);

  return (
    <Tile
      title={item.title}
      subtitle={item.kind === "album" ? item.track.artists : undefined}
      coverUrl={item.coverUrl}
      isCurrent={isCurrent}
      isPlaying={isPlaying}
      onOpen={open}
      onPlay={() => void handlePlay()}
      onContextMenu={menu.handleContextMenu}
    >
      {menuItems.length > 0 && (
        <DropdownMenu
          trigger={<span />}
          items={menuItems}
          open={menu.menuOpen}
          onOpenChange={menu.handleMenuOpenChange}
          position={menu.menuPosition}
        />
      )}
    </Tile>
  );
}

// songs played from a playlist or album show up as that playlist/album
function LastListenedGrid({
  title,
  icon,
  items,
  headingMarginTop,
}: LastListenedGridProps) {
  const looseTracks = useMemo(
    () => items.flatMap((item) => (item.kind === "track" ? [item.track] : [])),
    [items],
  );

  return (
    <section className="flex flex-col">
      <SectionHeading title={title} icon={icon} marginTop={headingMarginTop} />
      <div className="mx-3 mt-[12px] grid grid-cols-2 gap-[8px] xl:grid-cols-4">
        {items.map((item) =>
          item.kind === "track" ? (
            <TrackTile
              key={item.key}
              track={item.track}
              queue={looseTracks}
              context={title}
            />
          ) : (
            <CollectionTile key={item.key} item={item} />
          ),
        )}
      </div>
    </section>
  );
}

export default memo(LastListenedGrid);
