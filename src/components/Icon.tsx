import type { SVGProps } from 'react';

export type IconName =
  | 'sparkle' | 'arrow' | 'arrow-up-right' | 'search' | 'close' | 'share'
  | 'copy' | 'check' | 'gift' | 'market' | 'hand' | 'globe' | 'bag'
  | 'sun' | 'heart' | 'arrow-left' | 'lightbulb' | 'external' | 'refresh'
  | 'compass' | 'link' | 'whatsapp' | 'lock' | 'info';

const paths: Record<IconName, React.ReactNode> = {
  sparkle: <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/><path d="m5 3 .7 1.8L7.5 5.5l-1.8.7L5 8l-.7-1.8-1.8-.7 1.8-.7L5 3Z"/></>,
  arrow: <><path d="M4.5 12h14"/><path d="m13 6.5 5.5 5.5-5.5 5.5"/></>,
  'arrow-up-right': <><path d="M7 17 17 7"/><path d="M8 7h9v9"/></>,
  search: <><circle cx="10.8" cy="10.8" r="6.7"/><path d="m16 16 4.5 4.5"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  share: <><path d="M12 15V3"/><path d="m7.5 7.5 4.5-4.5 4.5 4.5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
  check: <path d="m5 12 4.5 4.5L19 7"/>,
  gift: <><rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 13h18M12 9H7.5a2.5 2.5 0 1 1 2.5-2.5C10 8 12 9 12 9Zm0 0h4.5A2.5 2.5 0 1 0 14 6.5C14 8 12 9 12 9Z"/></>,
  market: <><path d="M3 10h18l-1.5-6h-15L3 10Z"/><path d="M5 10v10h14V10M9 20v-6h6v6"/><path d="M3 10a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0"/></>,
  hand: <><path d="M8 11V5a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v6-3a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7-6.5 7h-1C9 22 7 20 5.5 17.5l-2-3a1.5 1.5 0 0 1 2.5-1.7L8 15v-4Z"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
  bag: <><path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m17.1-7.1-1.4 1.4M6.3 17.7l-1.4 1.4m14.2 0-1.4-1.4M6.3 6.3 4.9 4.9"/></>,
  heart: <path d="M20.8 8.7c0 5.4-8.8 11-8.8 11s-8.8-5.6-8.8-11A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.8 2.2Z"/>,
  'arrow-left': <><path d="M19.5 12h-14"/><path d="M11 17.5 5.5 12 11 6.5"/></>,
  lightbulb: <><path d="M9 18h6M10 22h4M8.2 14.8A6 6 0 1 1 15.8 15C15 15.7 15 17 15 18H9c0-1 0-2.2-.8-3.2Z"/></>,
  external: <><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/></>,
  refresh: <><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M5.5 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.5-3"/></>,
  compass: <><circle cx="12" cy="12" r="9"/><path d="m15.7 8.3-2.4 5-5 2.4 2.4-5 5-2.4Z"/></>,
  link: <><path d="M10 13a5 5 0 0 0 7.1 0l3-3A5 5 0 0 0 13 2.9l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21.1l1.7-1.7"/></>,
  whatsapp: <><path d="M20 11.5a8 8 0 0 1-11.9 7l-4.1 1 1-4A8 8 0 1 1 20 11.5Z"/><path d="M8.5 8.5c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.6 1.4c.1.3 0 .5-.2.7l-.5.6c-.2.2-.2.4 0 .7.4.7 1.1 1.3 1.8 1.7.3.2.5.2.7-.1l.7-.8c.2-.2.4-.3.7-.2l1.4.7c.3.1.4.3.4.5 0 .3-.2 1-.6 1.3-.4.4-1 .6-1.6.6s-1.4-.2-2.4-.7c-1.1-.5-2-1.4-2.7-2.4-.7-.9-1-1.8-1-2.5 0-.6.3-1.2.6-1.5Z"/></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></>,
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
