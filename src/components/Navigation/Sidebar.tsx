import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSadakaAuth } from '../../hooks/useSadakaAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { isAuthenticated: isChurchAuthenticated, role, logout: logoutChurch } = useAuth();
  const { isAuthenticated: isSadakaAuthenticated, role: sadakaRole, logout: logoutSadaka } = useSadakaAuth();
  const location = useLocation();

  const isAuthenticated = isChurchAuthenticated || isSadakaAuthenticated;
  const isSadakaRole = (currentRole: string | null) => currentRole === 'sadaka_admin' || currentRole === 'sadaka_super_admin';
  const isSadakaPortalUser = isSadakaRole(role) || isSadakaRole(sadakaRole);

  const isActivePath = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const publicSections = [
    {
      title: 'Main',
      links: [
        { label: 'Home', to: '/', icon: '🏠' },
        { label: 'Find a Church', to: '/', icon: '🔍' },
      ]
    },
    {
      title: 'Getting Started',
      links: [
        { label: 'Register Church', to: '/register', icon: '✍️' },
      ]
    },
    {
      title: 'Access',
      links: [
        { label: 'Church Admin Login', to: '/admin/login', icon: '🔐' },
        { label: 'Sadaka Portal Login', to: '/sadaka/login', icon: '🔑' },
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'Email Support', href: 'mailto:support@sadaka.co.ke', icon: '📧' },
      ]
    }
  ];

  const authenticatedSections = [
    {
      title: 'Main',
      links: [
        { label: 'Home', to: '/', icon: '🏠' },
        { label: 'Find a Church', to: '/', icon: '🔍' },
      ]
    },
    ...(role === 'church_super_admin' || role === 'readonly'
      ? [
          {
            title: 'Church Admin',
            links: [
              { label: 'Dashboard', to: '/admin/dashboard', icon: '📊' },
              { label: 'Transactions', to: '/admin/transactions', icon: '💳' },
              { label: 'Events', to: '/admin/events', icon: '📅' },
              { label: 'Categories', to: '/admin/categories', icon: '📁' },
              { label: 'Groups', to: '/admin/groups', icon: '👥' },
              { label: 'Settings', to: '/admin/church', icon: '⚙️' },
              ...(role === 'church_super_admin'
                ? [
                    { label: 'Withdrawals', to: '/admin/withdrawals', icon: '💰' },
                    { label: 'Accounts', to: '/admin/accounts', icon: '👤' },
                    { label: 'Audit logs', to: '/admin/audit-logs', icon: '📋' }
                  ]
                : [])
            ]
          }
        ]
      : []),
    ...(isSadakaPortalUser
      ? [
          {
            title: 'Sadaka Portal',
            links: [
              { label: 'Dashboard', to: '/sadaka/dashboard', icon: '📊' },
              { label: 'Churches', to: '/sadaka/churches', icon: '🏛️' },
              { label: 'Withdrawals', to: '/sadaka/withdrawals', icon: '💸' },
              { label: 'Logs', to: '/sadaka/audit-logs', icon: '📋' },
            ]
          }
        ]
      : []),
    {
      title: 'Support',
      links: [
        { label: 'Email Support', href: 'mailto:support@sadaka.co.ke', icon: '📧' },
      ]
    },
    {
      title: 'Account',
      links: [
        {
          label: 'Logout',
          icon: '🚪',
          action: () => {
            logoutChurch();
            logoutSadaka();
            onClose();
          }
        },
      ]
    }
  ];

  const sections = isAuthenticated ? authenticatedSections : publicSections;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="app-sidebar"
        aria-label="Primary"
        className={`fixed left-0 top-0 z-40 h-screen w-64 transform bg-slate-900 text-white transition-transform md:relative md:z-10 md:translate-x-0 md:transform-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b border-slate-800 p-4">
            <Link
              to="/"
              onClick={onClose}
              className="inline-flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 font-bold">
                S
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold">Sadaka</p>
                <p className="text-xs text-slate-400">Giving</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main">
            <div className="space-y-6">
              {sections.map((section) => (
                <div key={section.title}>
                  <p className="px-3 text-xs font-semibold uppercase text-slate-400 mb-2">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {section.links.map((link) =>
                      'href' in link ? (
                        <a
                          key={link.label}
                          href={link.href}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="text-base">{link.icon}</span>
                          {link.label}
                        </a>
                      ) : 'action' in link ? (
                        <button
                          key={link.label}
                          type="button"
                          onClick={link.action}
                          className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                        >
                          <span className="text-base">{link.icon}</span>
                          {link.label}
                        </button>
                      ) : (
                        <Link
                          key={link.label}
                          to={link.to}
                          onClick={onClose}
                          aria-current={isActivePath(link.to) ? 'page' : undefined}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
                            isActivePath(link.to)
                              ? 'bg-slate-800 font-semibold text-white'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span className="text-base" aria-hidden>
                            {link.icon}
                          </span>
                          {link.label}
                        </Link>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-800 p-4 text-xs text-slate-400">
            <p>© 2024 Sadaka</p>
          </div>
        </div>
      </aside>
    </>
  );
};
