type SkeletonProps = {
  className?: string;
};

export const Skeleton = ({ className = 'h-4 w-full' }: SkeletonProps) => {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
};
