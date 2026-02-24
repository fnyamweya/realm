import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Geist, Geist_Mono } from 'next/font/google';
import { Outfit } from 'next/font/google';
import { ThemeProvider, ActiveThemeProvider, DEFAULT_THEME } from '@realtyos/ui-shells';
import './globals.css';

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

const fontOutfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: {
    default: 'RealtyOS Resident Portal',
    template: '%s | RealtyOS Resident Portal',
  },
  description:
    'RealtyOS Resident Portal - Manage your home, maintenance, and payments.',
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get('active_theme')?.value;
  const themeToApply = activeThemeValue || DEFAULT_THEME;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme={themeToApply}
      className={`${fontSans.variable} ${fontMono.variable} ${fontOutfit.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-background overflow-x-hidden overscroll-none font-sans antialiased"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <ActiveThemeProvider initialTheme={themeToApply}>
            {children}
          </ActiveThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
