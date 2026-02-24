'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  Label,
  Button,
  Skeleton,
} from '@realtyos/ui';

export function SettingsTabs() {
  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
        <TabsTrigger value="policies">Policies</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                placeholder="Your organization"
                defaultValue="Acme Properties"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="org-email">Contact Email</Label>
              <Input
                id="org-email"
                type="email"
                placeholder="admin@example.com"
                defaultValue="admin@acmeproperties.com"
              />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="integrations" className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Connected Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Accounting System', 'Payment Gateway', 'Email Service'].map(
                (service) => (
                  <div
                    key={service}
                    className="flex items-center justify-between rounded-md border p-4"
                  >
                    <div>
                      <p className="text-sm font-medium">{service}</p>
                      <p className="text-xs text-muted-foreground">
                        Not connected
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Connect
                    </Button>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="policies" className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Access Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Policy management will be available through the policy
              editor.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
