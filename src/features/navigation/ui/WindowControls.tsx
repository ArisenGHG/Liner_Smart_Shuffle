import { useTranslation } from "@/languages";
import { cn } from "@/shared/lib";
import { useWindowAnimationStore } from "@/shared/ui";
import { useWindowState } from "../hooks/useWindowState";
import { CloseIcon, MaximizeIcon, MinimizeIcon } from "./WindowControlIcons";

export interface WindowControlsProps {
  className?: string;
  variant?: "default" | "glass" | "island";
  style?: React.CSSProperties;
  isFullscreen?: boolean;
  embedded?: boolean;
  bare?: boolean;
}

export default function WindowControls({
  className = "",
  style,
  embedded = false,
  bare = false,
  isFullscreen = false,
}: WindowControlsProps) {
  const { t } = useTranslation();
  const { isWindowFullScreen, isWindowMaximized } = useWindowState();

  const isHyprland = window.linerElectron?.isHyprland ?? false;
  const isMinimizeDisabled = isWindowFullScreen || isHyprland;

  const handleMinimize = () => {
    // macos fullscreen spaces and hyprland tiling wm prohibit/ignore minimizing
    if (isWindowFullScreen || isHyprland) return;
    useWindowAnimationStore.getState().triggerMinimize();
  };

  const handleMaximize = () => {
    window.linerElectron?.toggleMaximize();
  };

  const handleClose = () => {
    useWindowAnimationStore.getState().triggerClose();
  };

  const onDarkGlass = isFullscreen || !bare;

  const buttonClass = cn(
    "flex items-center justify-center rounded-md border-0 bg-transparent p-0 cursor-pointer select-none pointer-events-auto transition-[background-color,color,opacity] duration-150 active:scale-95",
    isFullscreen ? "w-[26px] h-[26px]" : bare ? "w-[30px] h-[30px]" : "w-[34px] h-[34px]",
    onDarkGlass
      ? "text-white opacity-70 hover:opacity-100 hover:bg-white/12"
      : "text-text-primary opacity-55 hover:opacity-100 hover:bg-border-alpha-14",
  );

  const buttons = (
    <>
      <button
        type="button"
        onClick={isMinimizeDisabled ? undefined : handleMinimize}
        disabled={isMinimizeDisabled}
        aria-disabled={isMinimizeDisabled}
        data-no-tooltip="true"
        className={cn(
          buttonClass,
          isMinimizeDisabled &&
            "!opacity-25 cursor-not-allowed pointer-events-none",
        )}
        aria-label="Minimize"
      >
        <MinimizeIcon />
      </button>

      <button
        type="button"
        onClick={handleMaximize}
        data-no-tooltip="true"
        className={buttonClass}
        aria-label={
          isWindowFullScreen
            ? t("common.exitFullscreen")
            : isWindowMaximized
              ? t("common.restore")
              : t("common.maximize")
        }
      >
        <MaximizeIcon isMaximized={isWindowMaximized || isWindowFullScreen} />
      </button>

      <button
        type="button"
        onClick={handleClose}
        data-no-tooltip="true"
        className={cn(buttonClass, "hover:!bg-[#E81123] hover:!text-white")}
        aria-label="Close"
      >
        <CloseIcon />
      </button>
    </>
  );

  if (bare) {
    return buttons;
  }

  const capsule = (
    <div
      data-no-window-drag
      data-no-tooltip="true"
      className={cn(
        "flex items-center gap-[2px] select-none pointer-events-auto",
        isFullscreen
          ? "h-[32px] px-[3px] rounded-lg bg-black/50 backdrop-blur-xl"
          : "h-[46px] px-[6px] rounded-xl apple-glass-pill",
      )}
    >
      {buttons}
    </div>
  );

  if (embedded) {
    return capsule;
  }

  return (
    <div
      style={style}
      className={cn(
        "absolute top-[6px] right-[6px] z-[62] flex items-center justify-end pointer-events-none select-none",
        className,
      )}
    >
      {capsule}
    </div>
  );
}
