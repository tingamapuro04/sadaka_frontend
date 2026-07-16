import type { HTMLAttributes, ReactNode } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  padded?: boolean;
  hover?: boolean;
};

export const Card = ({
  children,
  padded = true,
  hover = false,
  className = '',
  ...rest
}: CardProps) => (
  <div
    className={`card ${padded ? 'card-pad' : ''} ${hover ? 'transition-shadow hover:shadow-card-hover' : ''} ${className}`}
    {...rest}
  >
    {children}
  </div>
);
