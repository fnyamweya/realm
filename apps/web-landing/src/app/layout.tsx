import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'RealtyOS - Modern Property Management Platform',
    template: '%s | RealtyOS',
  },
  description:
    'RealtyOS is the modern, secure property management platform for owners, managers, and residents.',
  keywords: [
    'property management',
    'real estate',
    'tenant portal',
    'lease management',
  ],
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
