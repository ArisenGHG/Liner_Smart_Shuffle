import { Shuffle } from "@solar-icons/react";
import { useTranslation, type TFunction } from "@/languages";

interface ShuffleModeIconProps {
  smart: boolean;
  size?: number;
}

export function SparkleIcon({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0Z" />
    </svg>
  );
}

// shuffle glyph with a small sparkle when smart shuffle is mixing in picks
export function ShuffleModeIcon({ smart, size = 18 }: ShuffleModeIconProps) {
  return (
    <span className="relative inline-flex items-center justify-center">
      <Shuffle size={size} weight="Outline" />
      {smart && (
        <SparkleIcon
          size={Math.round(size * 0.5)}
          className="absolute -right-[3px] -top-[3px] text-accent-primary"
        />
      )}
    </span>
  );
}

/** marks a song that smart shuffle added, next to its title */
export function SmartShuffleBadge({
  size = 12,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const { t } = useTranslation();
  const label = t("player.smart_shuffle_pick");
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center text-accent-primary ${className}`}
    >
      <SparkleIcon size={size} />
    </span>
  );
}

export function shuffleModeLabel(
  t: TFunction,
  shuffle: boolean,
  smartShuffle: boolean,
): string {
  if (smartShuffle) return t("player.smart_shuffle_on");
  return shuffle ? t("player.shuffle_on") : t("player.shuffle_off");
}
