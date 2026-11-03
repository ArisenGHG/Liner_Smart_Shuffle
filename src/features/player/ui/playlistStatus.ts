import type { TFunction } from "@/languages";

/** tooltip for the add-to-playlist button: lists the playlists the song is already in */
export function playlistStatusLabel(
  t: TFunction,
  playlists: { title: string }[],
): string {
  if (playlists.length === 0) return t("common.add_to_playlist");
  return t("player.in_playlists", {
    playlists: playlists.map((p) => p.title).join(", "),
  });
}
