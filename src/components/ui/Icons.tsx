type IconProps = { className?: string };

export function IconX({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 6L18 18M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 5V19M5 12H19" strokeLinecap="round" />
    </svg>
  );
}

export function IconMinus({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 12H19" strokeLinecap="round" />
    </svg>
  );
}

export function IconChevronDown({ className }: IconProps) {
  return (
    <svg className={className} width="10" height="6" viewBox="0 0 10 6" fill="none">
      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSearch({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20L16 16" strokeLinecap="round" />
    </svg>
  );
}

export function IconUser({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20C5 16.134 8.134 13 12 13C15.866 13 19 16.134 19 20" strokeLinecap="round" />
    </svg>
  );
}

export function IconBag({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35">
      <path d="M6 8H18L19 21H5L6 8Z" strokeLinejoin="round" />
      <path d="M9 8V6C9 4.343 10.343 3 12 3C13.657 3 15 4.343 15 6V8" strokeLinecap="round" />
    </svg>
  );
}

export function IconArrowRight({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconLock({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8C8 5.791 9.791 4 12 4C14.209 4 16 5.791 16 8V11" strokeLinecap="round" />
    </svg>
  );
}

export function IconUpload({ className }: IconProps) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 16V4M12 4L8 8M12 4L16 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16V18C4 19.105 4.895 20 6 20H18C19.105 20 20 19.105 20 18V16" strokeLinecap="round" />
    </svg>
  );
}

export function IconInfo({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11V16M12 8H12.01" strokeLinecap="round" />
    </svg>
  );
}

export function IconSparkle({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8 1L9.2 5.8L14 7L9.2 8.2L8 13L6.8 8.2L2 7L6.8 5.8L8 1Z" fill="currentColor" stroke="none" />
      <path d="M13 2L13.5 3.5L15 4L13.5 4.5L13 6L12.5 4.5L11 4L12.5 3.5L13 2Z" fill="currentColor" />
    </svg>
  );
}

export function IconHeart({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 20.25C12 20.25 3 14.5 3 8.75C3 6.678 4.678 5 6.75 5C8.5 5 10 6 12 7.75C14 6 15.5 5 17.25 5C19.322 5 21 6.678 21 8.75C21 14.5 12 20.25 12 20.25Z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCompare({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 4H5C3.895 4 3 4.895 3 6V18C3 19.105 3.895 20 5 20H8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 4H19C20.105 4 21 4.895 21 6V18C21 19.105 20.105 20 19 20H16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 12H14" strokeLinecap="round" />
      <path d="M12 10V14" strokeLinecap="round" />
    </svg>
  );
}

export function IconTruck({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M3 6H15V16H3V6Z" strokeLinejoin="round" />
      <path d="M15 10H18L21 13V16H15V10Z" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

export function IconPackage({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M12 2L3 7L12 12L21 7L12 2Z" strokeLinejoin="round" />
      <path d="M3 7V17L12 22L21 17V7" strokeLinejoin="round" />
      <path d="M12 12V22" />
    </svg>
  );
}

export function IconShield({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M12 3L4 7V12C4 17 7.5 20.5 12 21C16.5 20.5 20 17 20 12V7L12 3Z" strokeLinejoin="round" />
      <path d="M9 12L11 14L15 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconRefresh({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M4 12C4 7.582 7.582 4 12 4C15 4 17.5 5.5 19 8" strokeLinecap="round" />
      <path d="M20 12C20 16.418 16.418 20 12 20C9 20 6.5 18.5 5 16" strokeLinecap="round" />
      <path d="M16 8H19V5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 16H5V19" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconHandbag({ className }: IconProps) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M6 8H18L19 20H5L6 8Z" strokeLinejoin="round" />
      <path d="M9 8V6C9 4.343 10.343 3 12 3C13.657 3 15 4.343 15 6V8" />
      <path d="M8 12H16" strokeLinecap="round" />
    </svg>
  );
}

export function IconWatch({ className }: IconProps) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="12" cy="12" r="7" />
      <path d="M12 9V12L14 14" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 2H15M9 22H15" strokeLinecap="round" />
    </svg>
  );
}

export function IconParents({ className }: IconProps) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="9" cy="7" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20C3 16.134 5.686 13 9 13C12.314 13 15 16.134 15 20" strokeLinecap="round" />
      <path d="M15 17C15 14.791 16.343 13 18 13C19.657 13 21 14.791 21 17" strokeLinecap="round" />
    </svg>
  );
}

export function IconGift({ className }: IconProps) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="3" y="10" width="18" height="11" rx="1" strokeLinejoin="round" />
      <path d="M12 10V21" />
      <path d="M3 14H21" />
      <path d="M12 10C12 10 12 6 9 6C6.5 6 6 8.5 8 9.5C10 10.5 12 10 12 10Z" />
      <path d="M12 10C12 10 12 6 15 6C17.5 6 18 8.5 16 9.5C14 10.5 12 10 12 10Z" />
    </svg>
  );
}

export function IconTeddy({ className }: IconProps) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="12" cy="14" r="6" />
      <circle cx="8" cy="8" r="2.5" />
      <circle cx="16" cy="8" r="2.5" />
      <circle cx="10" cy="13" r="0.8" fill="currentColor" />
      <circle cx="14" cy="13" r="0.8" fill="currentColor" />
      <path d="M11 16C11.5 16.5 12.5 16.5 13 16" strokeLinecap="round" />
    </svg>
  );
}

export function IconBriefcase({ className }: IconProps) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="3" y="8" width="18" height="12" rx="1" strokeLinejoin="round" />
      <path d="M9 8V6C9 4.343 10.343 3 12 3H12C13.657 3 15 4.343 15 6V8" />
      <path d="M3 13H21" />
    </svg>
  );
}

export function IconDiamond({ className }: IconProps) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M12 3L3 9L12 21L21 9L12 3Z" strokeLinejoin="round" />
      <path d="M3 9H21" />
      <path d="M8 9L12 21L16 9" />
    </svg>
  );
}

export function IconRibbon({ className }: IconProps) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="4" y="6" width="16" height="12" rx="1" />
      <path d="M4 12H20" />
      <path d="M8 6V4M16 6V4" strokeLinecap="round" />
    </svg>
  );
}

export function IconGiftWrap({ className }: IconProps) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="4" y="8" width="16" height="13" rx="1" />
      <path d="M12 8V21" />
      <path d="M4 13H20" />
      <path d="M12 8C12 8 12 4 9 4C7 4 6.5 6.5 8 7.5C10 8.5 12 8 12 8Z" />
      <path d="M12 8C12 8 12 4 15 4C17 4 17.5 6.5 16 7.5C14 8.5 12 8 12 8Z" />
    </svg>
  );
}

export function IconSun({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2V4M12 20V22M4 12H2M22 12H20M5.6 5.6L7 7M17 17L18.4 18.4M5.6 18.4L7 17M17 7L18.4 5.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconMoon({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 14.5A8.5 8.5 0 1111.5 3A7 7 0 0021 14.5Z" strokeLinejoin="round" />
    </svg>
  );
}

/** Moon + star — Kay After Dark entry (not the light/dark theme toggle). */
export function IconAfterDark({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        d="M20 14.5A7.5 7.5 0 1112.5 4.5A6.5 6.5 0 0020 14.5Z"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 3.5L17.8 4.6L18.9 4.9L17.8 5.2L17.5 6.3L17.2 5.2L16.1 4.9L17.2 4.6Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export function IconInstagram({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconFacebook({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 2H15C12.239 2 10 4.239 10 7V10H7V14H10V22H14V14H17L18 10H14V7.5C14 6.672 14.672 6 15.5 6H18V2Z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPinterest({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8C10.5 8 9 9.2 9 11.5C9 13 9.8 14 11 14C11.5 14 12 13.5 12 13C12 12.2 11.5 11.5 11.5 10.5C11.5 9.5 12.2 8.8 13.5 8.8C14.5 8.8 15.2 9.5 15.2 10.8C15.2 12 14.5 13.2 13.5 14.5L12.8 17C14.5 16.5 17 15 17 11.5C17 9 15 8 12 8Z" strokeLinejoin="round" />
    </svg>
  );
}

const CATEGORY_ICONS = {
  handbag: IconHandbag,
  watch: IconWatch,
  parents: IconParents,
  gift: IconGift,
  teddy: IconTeddy,
  briefcase: IconBriefcase,
} as const;

const TRUST_ICONS = {
  truck: IconTruck,
  package: IconPackage,
  shield: IconShield,
  refresh: IconRefresh,
} as const;

const VALUE_ICONS = {
  diamond: IconDiamond,
  ribbon: IconRibbon,
  truck: IconTruck,
  "gift-wrap": IconGiftWrap,
} as const;

export function CategoryIcon({ name, className }: { name: keyof typeof CATEGORY_ICONS; className?: string }) {
  const Icon = CATEGORY_ICONS[name];
  return <Icon className={className} />;
}

export function TrustIcon({ name, className }: { name: keyof typeof TRUST_ICONS; className?: string }) {
  const Icon = TRUST_ICONS[name];
  return <Icon className={className} />;
}

export function ValueIcon({ name, className }: { name: keyof typeof VALUE_ICONS; className?: string }) {
  const Icon = VALUE_ICONS[name];
  return <Icon className={className} />;
}
