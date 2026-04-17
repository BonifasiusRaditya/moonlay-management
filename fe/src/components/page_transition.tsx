import { cn } from '@/utils/cn';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <div className={cn('animate-fade-in animate-slide-in', className)}>
      {children}
    </div>
  );
}

