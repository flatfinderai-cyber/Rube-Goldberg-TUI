/**
 * ABOUTME: Progress bar component with terminal-inspired styling.
 * Provides a styled progress bar matching the design system.
 */

'use client';

import { forwardRef, type HTMLAttributes } from 'react';

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  /** Progress value from 0 to 100 */
  value?: number;
  /** Maximum value (default 100) */
  max?: number;
}

const containerStyles = [
  'w-full',
  'h-2',
  'rounded-full',
  'bg-bg-tertiary',
  'overflow-hidden',
].join(' ');

const barStyles = [
  'h-full',
  'rounded-full',
  'bg-accent-primary',
  'transition-all duration-300 ease-out',
].join(' ');

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className = '', value = 0, max = 100, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={`${containerStyles} ${className}`}
        {...props}
      >
        <div className={barStyles} style={{ width: `${percentage}%` }} />
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export type { ProgressProps };
