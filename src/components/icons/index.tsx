import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

const base = (props: IconProps) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': props.title ? undefined : true,
  role: props.title ? ('img' as const) : undefined,
  ...props
});

export const IconHome = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
  </svg>
);

export const IconSearch = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const IconChart = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <path d="M4 19V5M4 19h16" />
    <path d="M8 16v-5M12 16V8M16 16v-3" />
  </svg>
);

export const IconCard = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18" />
  </svg>
);

export const IconCalendar = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 11h18" />
  </svg>
);

export const IconFolder = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
  </svg>
);

export const IconUsers = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <circle cx="9" cy="8" r="3" />
    <path d="M3 19a6 6 0 0 1 12 0" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M17 19a5 5 0 0 0-3-4.5" />
  </svg>
);

export const IconSettings = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const IconWallet = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
    <path d="M16 12h4v4h-4a2 2 0 0 1 0-4Z" />
    <path d="M3 10h12" />
  </svg>
);

export const IconUser = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);

export const IconClipboard = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4.5h6V6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V4.5Z" />
  </svg>
);

export const IconBuilding = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <path d="M4 20h16M6 20V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14" />
    <path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" />
  </svg>
);

export const IconLogout = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <path d="M10 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5" />
    <path d="M14 15l4-3-4-3M18 12H9" />
  </svg>
);

export const IconLock = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <rect x="5" y="10" width="14" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

export const IconKey = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <circle cx="8" cy="15" r="3.5" />
    <path d="M11 13.5 20 5l-2.5 1.5L19 9l-2 .5" />
  </svg>
);

export const IconPen = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />
  </svg>
);

export const IconMail = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 7 9-7" />
  </svg>
);

export const IconMenu = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const IconClose = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconInbox = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <path d="M4 13h4l2 3h4l2-3h4" />
    <path d="M4 13V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6l-3 7H7l-3-7Z" />
  </svg>
);

export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <path d="m5 12 5 5L20 7" />
  </svg>
);

export const IconShield = (p: IconProps) => (
  <svg {...base(p)}>
    {p.title ? <title>{p.title}</title> : null}
    <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" />
  </svg>
);

export const BrandMark = ({ className = 'h-9 w-9' }: { className?: string }) => (
  <div
    className={`inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-white shadow-soft ${className}`}
    aria-hidden
  >
    <span className="text-sm tracking-tight">S</span>
  </div>
);
