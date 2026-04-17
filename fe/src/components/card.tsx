import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Card({ children, className, style }: CardProps) {
  return (
    <div
      className={cn('p-4 rounded shadow-sm border bg-[#fbfbfb] border-gray-200/50', className)}
      style={{ ...style }}
    >
      {children}
    </div>
  );
}

