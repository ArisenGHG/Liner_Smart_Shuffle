import {
  useRef,
  useState,
  useLayoutEffect,
  useCallback,
  useEffect,
  useMemo,
  type CSSProperties,
} from "react";
import {
  MARQUEE_GAP_PX,
  OVERFLOW_MASK,
  marqueeStyles,
} from "@/shared/lib/marquee";

export interface ScrollableTextProps {
  text: string;
  className?: string;
  style?: CSSProperties;
  isParentHovered?: boolean;
  fadeColorClass?: string;
  /** scroll right to left in a loop while the text overflows, not only on hover */
  marquee?: boolean;
  /** with `marquee`: only loop while this is true (e.g. while the song plays) */
  marqueeRunning?: boolean;
}

// scrolls horizontally on hover when text overflows container with adaptive alpha mask fading
export default function ScrollableText({
  text,
  className = "",
  style,
  isParentHovered = false,
  marquee = false,
  marqueeRunning = true,
}: ScrollableTextProps) {
  const outerRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [delta, setDelta] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [selfHovered, setSelfHovered] = useState(false);

  const measure = useCallback(() => {
    if (!outerRef.current || !innerRef.current) return;
    const diff = innerRef.current.scrollWidth - outerRef.current.clientWidth;
    setDelta(Math.max(0, diff));
    setContentWidth(innerRef.current.offsetWidth);
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [text, measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    if (!marquee || !outerRef.current) return;
    const observer = new ResizeObserver(measure);
    observer.observe(outerRef.current);
    return () => observer.disconnect();
  }, [marquee, measure]);

  const isHovered = isParentHovered || selfHovered;
  const isLooping = marquee && marqueeRunning && delta > 0;
  const loopStyle = isLooping ? marqueeStyles(contentWidth) : null;

  const maskStyle = useMemo<CSSProperties>(() => {
    if (delta <= 0) return {};
    if (isHovered) {
      return {
        maskImage:
          "linear-gradient(to right, transparent 0px, black 14px, black calc(100% - 14px), transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0px, black 14px, black calc(100% - 14px), transparent 100%)",
        transition: "mask-image 200ms ease, -webkit-mask-image 200ms ease",
      };
    }
    return {
      ...OVERFLOW_MASK,
      transition: "mask-image 200ms ease, -webkit-mask-image 200ms ease",
    };
  }, [delta, isHovered]);

  return (
    <span
      ref={outerRef}
      className={`relative block min-w-0 overflow-hidden text-left ${isLooping ? "marquee-host" : ""} ${className}`}
      style={{ ...style, ...(loopStyle?.host ?? maskStyle) }}
      onMouseEnter={() => {
        measure();
        setSelfHovered(true);
      }}
      onMouseLeave={() => setSelfHovered(false)}
    >
      <span
        key={isLooping ? `marquee-${text}` : "static"}
        className={`inline-flex whitespace-nowrap ${isLooping ? "marquee-track" : ""}`}
        style={
          loopStyle?.track ?? {
            transform:
              isHovered && delta > 0
                ? `translateX(-${delta + 4}px)`
                : "translateX(0)",
            transition: isHovered
              ? `transform ${Math.max(1000, delta * 18)}ms linear`
              : "transform 300ms ease",
          }
        }
      >
        <span ref={innerRef} className="inline-block">
          {text}
        </span>
        {isLooping && (
          <span
            aria-hidden="true"
            className="inline-block"
            style={{ paddingLeft: MARQUEE_GAP_PX }}
          >
            {text}
          </span>
        )}
      </span>
    </span>
  );
}

export { ScrollableText };
