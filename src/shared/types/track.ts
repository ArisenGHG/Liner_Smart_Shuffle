import type {
  TrackArtist as ContractTrackArtist,
  TrackAudioVariant,
} from "../contracts";

export interface TrackArtist {
  id?: string;
  name: string;
}

export interface Track {
  id: string;
  playlistItemId?: string;
  title: string;
  artists: string;
  artistId?: string;
  artistList?: (ContractTrackArtist | TrackArtist)[];
  coverUrl: string;
  durationMs: number;
  playCount: number;
  explicit?: boolean;
  audioVariant?: TrackAudioVariant;
  releaseDate?: string;
  addedAt?: string;
  /** mixed in by smart shuffle; dropped again when it is turned off */
  smartShuffle?: boolean;
  album?: {
    id: string;
    title: string;
  };
}
