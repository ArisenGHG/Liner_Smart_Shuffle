import { motion } from "framer-motion";

interface PlaylistAddIconProps {
  /** song is already in one of the user's playlists */
  added: boolean;
  size?: number;
}

// thin outlined plus-circle; turns into a filled check-circle with a small pop once the song is saved
export function PlaylistAddIcon({ added, size = 20 }: PlaylistAddIconProps) {
  return (
    <motion.svg
      key={added ? "added" : "add"}
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      initial={{ scale: added ? 0.6 : 0.85, opacity: 0.6 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 520, damping: 22 }}
    >
      {added ? (
        <>
          <circle cx="12" cy="12" r="10" fill="currentColor" />
          <path
            d="M7.6 12.3l2.9 2.9 5.9-6.2"
            fill="none"
            stroke="white"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <circle
            cx="12"
            cy="12"
            r="9.25"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M12 7.75v8.5M7.75 12h8.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </>
      )}
    </motion.svg>
  );
}
