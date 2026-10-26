import { useCallback, useEffect, useRef, useState } from "react";
import { cachedAmbientScript, loadAmbientScript } from "@/shared/media/ambient";
import {
  useAmbientWorker,
  type AmbientOptions,
} from "../hooks/useAmbientWorker";

interface AmbientLayerProps {
  trackId: string | undefined;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

interface AmbientCanvasProps {
  script: string;
}

function AmbientCanvas({ script }: AmbientCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [options, setOptions] = useState<AmbientOptions>({ pixelated: false });
  const fail = useCallback(() => setFailed(true), []);
  useAmbientWorker(
    hostRef,
    options.pixelated,
    failed ? null : script,
    fail,
    setOptions,
  );
  if (failed) return null;
  return (
    <div
      ref={hostRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-80 blur-[1.5px]"
    />
  );
}

export default function AmbientLayer({ trackId }: AmbientLayerProps) {
  const [loaded, setLoaded] = useState<{
    trackId: string;
    script: string | null;
  }>();

  useEffect(() => {
    if (!trackId || prefersReducedMotion()) return;
    let active = true;
    void loadAmbientScript(trackId).then((script) => {
      if (active) setLoaded({ trackId, script });
    });
    return () => {
      active = false;
    };
  }, [trackId]);

  if (!trackId || prefersReducedMotion()) return null;
  const script =
    loaded?.trackId === trackId ? loaded.script : cachedAmbientScript(trackId);
  if (!script) return null;
  return <AmbientCanvas key={`${trackId}:${script.length}`} script={script} />;
}
