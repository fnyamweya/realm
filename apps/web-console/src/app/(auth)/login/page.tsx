import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@realtyos/ui';

export const metadata: Metadata = { title: 'Sign In' };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">RealtyOS Console</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in with your organization account to continue.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" size="lg">
            Sign in with your organization
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            <Link href="https://realtyos.com" className="hover:underline">
              ← Back to RealtyOS
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
