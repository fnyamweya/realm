/**
 * Default theme that loads when no user preference is set.
 */
export const DEFAULT_THEME = 'supabase';

export const THEMES = [
    {
        name: 'Supabase',
        value: 'supabase',
    },
    {
        name: 'Vercel',
        value: 'vercel',
    },
] as const;

export type ThemeValue = (typeof THEMES)[number]['value'];
