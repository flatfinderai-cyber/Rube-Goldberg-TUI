/**
 * ABOUTME: Textarea component with terminal-inspired styling.
 * Provides a styled textarea input matching the design system.
 */

'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Whether the textarea has an error state */
  error?: boolean;
}

const baseStyles = [
  'w-full',
  'rounded-sm',
  'border border-border',
  'bg-bg-primary',
  'text-fg-primary',
  'font-mono text-sm',
  'px-3 py-2',
  'placeholder:text-fg-muted',
  'transition-all duration-200 ease-out',
  'focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ');

const errorStyles = 'border-red-500 focus:ring-red-500/50 focus:border-red-500';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error = false, ...props }, ref) => {
    const classes = [baseStyles, error ? errorStyles : '', className]
      .filter(Boolean)
      .join(' ');

    return <textarea ref={ref} className={classes} {...props} />;
  }
);

Textarea.displayName = 'Textarea';

export type { TextareaProps };
