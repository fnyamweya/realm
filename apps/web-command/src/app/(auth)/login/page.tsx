import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@realtyos/ui';
import { ShieldAlert } from 'lucide-react';

export const metadata: Metadata = { title: 'Sign In' };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <Card className="w-full max-w-md border-amber-900/50 bg-gray-900">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <ShieldAlert className="h-6 w-6 text-amber-500" />
          </div>
          <CardTitle className="text-2xl text-white">
            RealtyOS Command
          </CardTitle>
          <p className="text-sm text-gray-400">
            Internal platform administration
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-amber-800/50 bg-amber-950/30 px-4 py-3 text-center text-sm text-amber-200">
            This is an internal administration tool. Unauthorized access is
            prohibited.
          </div>
          <Button className="w-full bg-white text-gray-900 hover:bg-gray-200" size="lg">
            Sign in with SSO
          </Button>
          <p className="text-center text-xs text-gray-500">
            Multi-factor authentication is required for all sessions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
