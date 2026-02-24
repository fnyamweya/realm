'use client';

import { useTheme } from 'next-themes';
import * as React from 'react';
import { Button } from '@realtyos/ui';
import { Sun, Moon } from 'lucide-react';

export function ThemeModeToggle() {
    const { setTheme, resolvedTheme } = useTheme();

    const handleThemeToggle = React.useCallback(
        (e?: React.MouseEvent) => {
            const newMode = resolvedTheme === 'dark' ? 'light' : 'dark';
            const root = document.documentElement;

            if (
                typeof document.startViewTransition === 'undefined'
            ) {
                setTheme(newMode);
                return;
            }

            // Set coordinates from the click event
            if (e) {
                root.style.setProperty('--x', `${e.clientX}px`);
                root.style.setProperty('--y', `${e.clientY}px`);
            }

            document.startViewTransition(() => {
                setTheme(newMode);
            });
        },
        [resolvedTheme, setTheme]
    );

    return (
        <Button
            variant="secondary"
            size="icon"
            className="group/toggle size-8"
            onClick={handleThemeToggle}
        >
            <Sun className="size-4 transition-all dark:hidden" />
            <Moon className="hidden size-4 transition-all dark:block" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
