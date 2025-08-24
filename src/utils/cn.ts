import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to combine and merge Tailwind CSS classes
 * Uses clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utility function to conditionally apply classes
 */
export function conditionalClass(
  baseClasses: string,
  conditionalClasses: Record<string, boolean>
): string {
  const classes = [baseClasses];
  
  Object.entries(conditionalClasses).forEach(([className, condition]) => {
    if (condition) {
      classes.push(className);
    }
  });
  
  return classes.join(' ');
}

/**
 * Utility function to create responsive classes
 */
export function responsiveClass(
  baseClasses: string,
  responsiveClasses: Record<string, string>
): string {
  const classes = [baseClasses];
  
  Object.entries(responsiveClasses).forEach(([breakpoint, className]) => {
    if (className) {
      classes.push(`${breakpoint}:${className}`);
    }
  });
  
  return classes.join(' ');
}

/**
 * Utility function to create hover classes
 */
export function hoverClass(
  baseClasses: string,
  hoverClasses: string
): string {
  return `${baseClasses} hover:${hoverClasses}`;
}

/**
 * Utility function to create focus classes
 */
export function focusClass(
  baseClasses: string,
  focusClasses: string
): string {
  return `${baseClasses} focus:${focusClasses}`;
}

/**
 * Utility function to create active classes
 */
export function activeClass(
  baseClasses: string,
  activeClasses: string
): string {
  return `${baseClasses} active:${activeClasses}`;
}

/**
 * Utility function to create disabled classes
 */
export function disabledClass(
  baseClasses: string,
  disabledClasses: string
): string {
  return `${baseClasses} disabled:${disabledClasses}`;
}
