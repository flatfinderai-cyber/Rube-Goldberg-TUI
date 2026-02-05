/**
 * ABOUTME: Barrel export file for all UI components.
 * Provides a single import point for Button, Card, Badge, Textarea, and Progress primitives.
 */

// Button component and types
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

// Card component and types
export { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from './Card';
export type {
  CardProps,
  CardHeaderProps,
  CardContentProps,
  CardFooterProps,
  CardTitleProps,
  CardDescriptionProps,
} from './Card';

// Badge component and types
export { Badge } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge';

// CodeBlock component and types
export { CodeBlock } from './CodeBlock';
export type { CodeBlockProps } from './CodeBlock';

// Textarea component and types
export { Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';

// Progress component and types
export { Progress } from './Progress';
export type { ProgressProps } from './Progress';
