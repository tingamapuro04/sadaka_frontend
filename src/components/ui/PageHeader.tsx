import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
};

export const PageHeader = ({ title, description, actions, eyebrow }: PageHeaderProps) => (
  <header className="page-header">
    <div className="min-w-0">
      {eyebrow ? (
        <p className="mb-1 text-2xs font-semibold uppercase tracking-wider text-brand-700">{eyebrow}</p>
      ) : null}
      <h1 className="page-title">{title}</h1>
      {description ? <p className="page-subtitle">{description}</p> : null}
    </div>
    {actions ? (
      <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">{actions}</div>
    ) : null}
  </header>
);
