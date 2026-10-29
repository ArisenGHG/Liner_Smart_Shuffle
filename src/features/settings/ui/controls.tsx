import type { ReactNode } from "react";
import { getTranslationsForAllLocales } from "@/languages";
import { cn } from "@/shared/lib/utils";

const rowSurface = "px-[16px]";

interface SearchableProps {
  title: string;
  description?: string;
  titleKey?: string;
  descKey?: string;
  searchQuery?: string;
}

function matchesSearch({
  title,
  description,
  titleKey,
  descKey,
  searchQuery,
}: SearchableProps) {
  const q = searchQuery?.toLowerCase().trim();
  if (!q) return true;
  const texts = [title, description ?? ""];
  if (titleKey) texts.push(...getTranslationsForAllLocales(titleKey));
  if (descKey) texts.push(...getTranslationsForAllLocales(descKey));
  return texts.some((text) => text.toLowerCase().includes(q));
}

function RowText({ title, description }: SearchableProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
      <span className="text-pretty text-text-primary text-[13.5px] font-[500] leading-[18px] tracking-[-0.005em]">
        {title}
      </span>
      {description ? (
        <span className="max-w-[420px] text-pretty text-text-tertiary text-[12px] leading-[17px]">
          {description}
        </span>
      ) : null}
    </div>
  );
}

interface SettingRowProps extends SearchableProps {
  control?: ReactNode;
  icon?: ReactNode;
  explained?: boolean;
}

export function SettingRow({ control, icon, ...text }: SettingRowProps) {
  if (!matchesSearch(text)) return null;

  return (
    <div
      className={cn(
        rowSurface,
        "flex min-h-[52px] items-center justify-between gap-[14px] py-[10px]",
      )}
    >
      {icon ? (
        <span className="flex shrink-0 self-start pt-[1px] text-text-tertiary [&_svg]:h-[18px] [&_svg]:w-[18px]">
          {icon}
        </span>
      ) : null}
      <RowText {...text} />
      {control ? <div className="shrink-0">{control}</div> : null}
    </div>
  );
}

interface SettingBlockProps extends SearchableProps {
  children: ReactNode;
}

export function SettingBlock({ children, ...text }: SettingBlockProps) {
  if (!matchesSearch(text)) return null;

  return (
    <div className={cn(rowSurface, "flex flex-col gap-[12px] py-[10px]")}>
      <RowText {...text} />
      {children}
    </div>
  );
}

export function SettingSection({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col [&:has(>[data-settings-card]>div:empty)]:hidden">
      {label ? (
        <h4 className="m-0 px-[2px] pb-[8px] text-text-primary text-[14px] font-[600] leading-[20px] tracking-[-0.005em]">
          {label}
        </h4>
      ) : null}
      <div
        data-settings-card
        className="rounded-[14px] bg-black/[0.05] py-[4px] dark:bg-white/[0.07]"
      >
        <div className="flex flex-col">{children}</div>
      </div>
    </section>
  );
}

export { SegmentedControl } from "./SegmentedControl";
