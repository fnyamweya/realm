import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@realtyos/ui';

export const metadata: Metadata = { title: 'Sign In' };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">RealtyOS Resident Portal</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to access your resident dashboard.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 000-0000"
              autoComplete="tel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>
          <Button className="w-full" size="lg">
            Sign In
          </Button>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <Link href="/login" className="hover:underline">
              Forgot password?
            </Link>
            <Link href="https://realtyos.com" className="hover:underline">
              ← Back to RealtyOS
            </Link>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            If you have trouble signing in, please contact your property manager.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
