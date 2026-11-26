import { clsx } from 'clsx';
import { twMerge } from 'tailwind-variants';

/**
 * @param {...import('clsx').ClassValue} inputs
 */
export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export * from './utils/index.js';
