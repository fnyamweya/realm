import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'RealtyOS Resident Portal',
    template: '%s | RealtyOS Resident Portal',
  },
  description:
    'RealtyOS Resident Portal - Manage your home, maintenance, and payments.',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
