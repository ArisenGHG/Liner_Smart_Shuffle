import { useEffect, useState } from "react";

export function useWindowState() {
  const [isWindowFullScreen, setIsWindowFullScreen] = useState(false);
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);

  useEffect(() => {
    if (!window.linerElectron) return;

    window.linerElectron.isFullScreen?.().then((fs) => {
      if (typeof fs === "boolean") setIsWindowFullScreen(fs);
    });
    window.linerElectron.isMaximized?.().then((max) => {
      if (typeof max === "boolean") setIsWindowMaximized(max);
    });

    const unsubscribe = window.linerElectron.onWindowStateChange?.((state) => {
      setIsWindowFullScreen(state.isFullScreen);
      setIsWindowMaximized(state.isMaximized);
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  return { isWindowFullScreen, isWindowMaximized };
}
