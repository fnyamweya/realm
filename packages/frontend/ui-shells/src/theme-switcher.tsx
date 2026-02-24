'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@realtyos/ui';

type AppTheme = 'supabase' | 'vercel';

const THEME_STORAGE_KEY = 'realtyos-app-theme';

function isAppTheme(value: string | null): value is AppTheme {
    return value === 'supabase' || value === 'vercel';
}

function applyTheme(theme: AppTheme) {
    document.documentElement.setAttribute('data-theme', theme);
}

export function ThemeSwitcher() {
    const [activeTheme, setActiveTheme] = useState<AppTheme>('supabase');

    useEffect(() => {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (isAppTheme(storedTheme)) {
            setActiveTheme(storedTheme);
            applyTheme(storedTheme);
            return;
        }

        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (isAppTheme(currentTheme)) {
            setActiveTheme(currentTheme);
        }
    }, []);

    const toggleTheme = () => {
        const nextTheme: AppTheme = activeTheme === 'supabase' ? 'vercel' : 'supabase';
        setActiveTheme(nextTheme);
        applyTheme(nextTheme);
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="h-8 gap-2"
            aria-label={`Switch app theme. Current theme: ${activeTheme}`}
            title={`Current theme: ${activeTheme}`}
        >
            <ArrowLeftRight className="size-3.5" />
            Theme: {activeTheme === 'supabase' ? 'Supabase' : 'Vercel'}
        </Button>
    );
}
