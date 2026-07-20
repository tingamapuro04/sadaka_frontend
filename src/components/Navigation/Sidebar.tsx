import type { ComponentType, SVGProps } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSadakaAuth } from '../../hooks/useSadakaAuth';
import {
  BrandMark,
  IconBuilding,
  IconCalendar,
  IconCard,
  IconChart,
  IconClipboard,
  IconClose,
  IconFolder,
  IconHome,
  IconLock,
  IconLogout,
  IconMail,
  IconPen,
  IconSearch,
  IconSettings,
  IconUser,
  IconUsers,
  IconWallet
} from '../icons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { title?: string }>;

type NavLink =
  | { label: string; to: string; icon: IconComponent; href?: never; action?: never }
  | { label: string; href: string; icon: IconComponent; to?: never; action?: never }
  | { label: string; action: () => void; icon: IconComponent; to?: never; href?: never };

type NavSection = { title: string; links: NavLink[] };

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { isAuthenticated: isChurchAuthenticated, role, logout: logoutChurch } = useAuth();
  const { isAuthenticated: isSadakaAuthenticated, role: sadakaRole, logout: logoutSadaka } = useSadakaAuth();
  const location = useLocation();

  const isAuthenticated = isChurchAuthenticated || isSadakaAuthenticated;
  const isChurchAdmin = role === 'church_super_admin' || role === 'readonly';
  const isSadakaRole = (currentRole: string | null) =>
    currentRole === 'sadaka_admin' || currentRole === 'sadaka_super_admin';
  const isSadakaPortalUser = isSadakaRole(role) || isSadakaRole(sadakaRole);
  // Public discovery is for guests only — never for church or platform consoles.
  const showPublicDiscoveryLinks = !isChurchAdmin && !isSadakaPortalUser;

  // Church and platform share one cookie; if both local sessions ever exist, show only
  // the console matching the current route (and prefer church outside /sadaka).
  const onPlatformRoute = location.pathname.startsWith('/sadaka');
  const showChurchAdminNav = isChurchAdmin && !(isSadakaPortalUser && onPlatformRoute);
  const showPlatformNav = isSadakaPortalUser && !(isChurchAdmin && !onPlatformRoute);

  const isActivePath = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const publicSections: NavSection[] = [
    {
      title: 'Main',
      links: [
        { label: 'Home', to: '/', icon: IconHome },
        { label: 'Find a Church', to: '/', icon: IconSearch }
      ]
    },
    {
      title: 'Getting started',
      links: [{ label: 'Register Church', to: '/register', icon: IconPen }]
    },
    {
      title: 'Access',
      links: [
        { label: 'Church Admin Login', to: '/admin/login', icon: IconLock }
      ]
    },
    {
      title: 'Support',
      links: [{ label: 'Email Support', href: 'mailto:support@sadaka.co.ke', icon: IconMail }]
    }
  ];

  const authenticatedSections: NavSection[] = [
    ...(showPublicDiscoveryLinks
      ? [
          {
            title: 'Main',
            links: [
              { label: 'Home', to: '/', icon: IconHome },
              { label: 'Find a Church', to: '/', icon: IconSearch }
            ]
          } satisfies NavSection
        ]
      : []),
    ...(showChurchAdminNav
      ? [
          {
            title: 'Church admin',
            links: [
              { label: 'Dashboard', to: '/admin/dashboard', icon: IconChart },
              { label: 'Transactions', to: '/admin/transactions', icon: IconCard },
              { label: 'Events', to: '/admin/events', icon: IconCalendar },
              { label: 'Categories', to: '/admin/categories', icon: IconFolder },
              { label: 'Groups', to: '/admin/groups', icon: IconUsers },
              { label: 'Settings', to: '/admin/church', icon: IconSettings },
              ...(role === 'church_super_admin'
                ? [
                    { label: 'Withdrawals', to: '/admin/withdrawals', icon: IconWallet },
                    { label: 'Accounts', to: '/admin/accounts', icon: IconUser },
                    { label: 'Audit logs', to: '/admin/audit-logs', icon: IconClipboard }
                  ]
                : [])
            ]
          } satisfies NavSection
        ]
      : []),
    ...(showPlatformNav
      ? [
          {
            title: 'Platform',
            links: [
              { label: 'Dashboard', to: '/sadaka/dashboard', icon: IconChart },
              { label: 'Churches', to: '/sadaka/churches', icon: IconBuilding },
              { label: 'Transactions', to: '/sadaka/transactions', icon: IconCard },
              { label: 'Withdrawals', to: '/sadaka/withdrawals', icon: IconWallet },
              { label: 'Logs', to: '/sadaka/audit-logs', icon: IconClipboard }
            ]
          } satisfies NavSection
        ]
      : []),
    {
      title: 'Support',
      links: [{ label: 'Email Support', href: 'mailto:support@sadaka.co.ke', icon: IconMail }]
    },
    {
      title: 'Account',
      links: [
        {
          label: 'Logout',
          icon: IconLogout,
          action: () => {
            logoutChurch();
            logoutSadaka();
            onClose();
          }
        }
      ]
    }
  ];

  const sections = isAuthenticated ? authenticatedSections : publicSections;
  const brandHomeTo = showChurchAdminNav
    ? '/admin/dashboard'
    : showPlatformNav
      ? '/sadaka/dashboard'
      : '/';

  const linkClass = (active: boolean) =>
    `group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      active
        ? 'bg-brand-600 text-white shadow-soft'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white active:bg-slate-800'
    }`;

  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-[1px] md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        id="app-sidebar"
        aria-label="Primary"
        className={`fixed left-0 top-0 z-40 flex h-[100dvh] w-[min(18rem,88vw)] transform flex-col bg-slate-950 text-white transition-transform duration-200 ease-out safe-pt md:relative md:z-10 md:h-auto md:w-64 md:translate-x-0 md:transform-none md:safe-pt-0 ${
          isOpen ? 'translate-x-0 shadow-overlay' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 p-4">
          <Link
            to={brandHomeTo}
            onClick={onClose}
            className="inline-flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
          >
            <BrandMark className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight">Sadaka</p>
              <p className="truncate text-2xs text-slate-400">
                {showPlatformNav ? 'Platform console' : isAuthenticated ? 'Church console' : 'Giving platform'}
              </p>
            </div>
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white md:hidden"
            aria-label="Close menu"
            onClick={onClose}
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto overscroll-y-contain p-3 safe-pb" aria-label="Sidebar">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-1.5 px-3 text-2xs font-semibold uppercase tracking-wider text-slate-500">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  if (link.to) {
                    const active = isActivePath(link.to);
                    return (
                      <li key={`${section.title}-${link.label}`}>
                        <Link
                          to={link.to}
                          onClick={onClose}
                          aria-current={active ? 'page' : undefined}
                          className={linkClass(active)}
                        >
                          <Icon className="h-5 w-5 shrink-0 opacity-90" />
                          <span>{link.label}</span>
                        </Link>
                      </li>
                    );
                  }
                  if (link.href) {
                    return (
                      <li key={`${section.title}-${link.label}`}>
                        <a href={link.href} className={linkClass(false)} onClick={onClose}>
                          <Icon className="h-5 w-5 shrink-0 opacity-90" />
                          <span>{link.label}</span>
                        </a>
                      </li>
                    );
                  }
                  return (
                    <li key={`${section.title}-${link.label}`}>
                      <button type="button" onClick={link.action} className={`${linkClass(false)} w-full text-left`}>
                        <Icon className="h-5 w-5 shrink-0 opacity-90" />
                        <span>{link.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-800/80 p-4 safe-pb">
          <p className="text-2xs leading-relaxed text-slate-500">
            Secure M-Pesa collections for churches across Kenya.
          </p>
        </div>
      </aside>
    </>
  );
};
