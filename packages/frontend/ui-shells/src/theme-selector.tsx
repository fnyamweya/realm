'use client';

import { useThemeConfig } from './active-theme';
import { Label } from '@realtyos/ui';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@realtyos/ui';
import { Palette } from 'lucide-react';
import { THEMES } from './theme-config';

export function ThemeSelector() {
    const { activeTheme, setActiveTheme } = useThemeConfig();

    return (
        <div className="flex items-center gap-2">
            <Label htmlFor="theme-selector" className="sr-only">
                Theme
            </Label>
            <Select value={activeTheme} onValueChange={setActiveTheme}>
                <SelectTrigger id="theme-selector" className="h-8 w-auto gap-1">
                    <span className="text-muted-foreground hidden sm:block">
                        <Palette className="size-4" />
                    </span>
                    <span className="text-muted-foreground block sm:hidden">Theme</span>
                    <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent align="end">
                    {THEMES.length > 0 && (
                        <SelectGroup>
                            <SelectLabel>Themes</SelectLabel>
                            {THEMES.map((theme) => (
                                <SelectItem key={theme.name} value={theme.value}>
                                    {theme.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    )}
                </SelectContent>
            </Select>
        </div>
    );
}
