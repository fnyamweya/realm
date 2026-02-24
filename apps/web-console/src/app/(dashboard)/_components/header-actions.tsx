'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, Button, Input } from '@realtyos/ui';
import { Github, Search } from 'lucide-react';

export function HeaderActions({ userName }: { userName: string }) {
    const initials = userName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-8" asChild>
                <Link
                    href="https://github.com/Kiranism/next-shadcn-dashboard-starter"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="GitHub repository"
                >
                    <Github className="size-4" />
                </Link>
            </Button>

            <div className="relative hidden md:flex">
                <Search className="text-muted-foreground pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2" />
                <Input
                    type="search"
                    placeholder="Search..."
                    className="h-8 w-52 pr-12 pl-8"
                    aria-label="Search"
                />
                <kbd className="bg-muted text-muted-foreground pointer-events-none absolute right-1.5 top-1/2 inline-flex h-5 -translate-y-1/2 items-center rounded border px-1.5 text-[10px] font-medium">
                    ⌘ K
                </kbd>
            </div>

            <Avatar className="size-8 rounded-full border">
                <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
        </div>
    );
}
