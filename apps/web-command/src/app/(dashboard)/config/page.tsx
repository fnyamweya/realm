'use client';

import { useState } from 'react';
import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@realtyos/ui';

const featureFlags = [
  { key: 'maintenance_mode', value: 'false', scope: 'global' },
  { key: 'enable_new_billing', value: 'true', scope: 'global' },
  { key: 'beta_document_gen', value: 'true', scope: 'enterprise' },
  { key: 'advanced_analytics', value: 'false', scope: 'global' },
  { key: 'multi_currency', value: 'true', scope: 'enterprise' },
];

const baselineConfig = [
  { key: 'session.timeout', value: '900', unit: 'seconds' },
  { key: 'mfa.required', value: 'true', unit: '' },
  { key: 'password.min_length', value: '12', unit: 'characters' },
  { key: 'api.pagination.max', value: '100', unit: 'items' },
  { key: 'upload.max_size', value: '10', unit: 'MB' },
  { key: 'audit.retention', value: '2555', unit: 'days' },
];

const rateLimits = [
  { endpoint: '/api/v1/*', limit: '1000', window: '1 minute', burst: '50' },
  { endpoint: '/api/v1/auth/login', limit: '10', window: '1 minute', burst: '3' },
  { endpoint: '/api/v1/export', limit: '5', window: '1 hour', burst: '1' },
  { endpoint: '/api/v1/webhooks', limit: '500', window: '1 minute', burst: '25' },
];

export default function ConfigPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Platform Configuration"
        description="View baseline platform configuration. Changes require maker-checker approval."
      />
      <Tabs defaultValue="flags" className="space-y-4">
        <TabsList>
          <TabsTrigger value="flags">Feature Flags</TabsTrigger>
          <TabsTrigger value="baseline">Baseline Config</TabsTrigger>
          <TabsTrigger value="ratelimits">Rate Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="flags">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flag</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Scope</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featureFlags.map((flag) => (
                    <TableRow key={flag.key}>
                      <TableCell className="font-mono text-sm">
                        {flag.key}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            flag.value === 'true' ? 'default' : 'secondary'
                          }
                        >
                          {flag.value}
                        </Badge>
                      </TableCell>
                      <TableCell>{flag.scope}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="baseline">
          <Card>
            <CardHeader>
              <CardTitle>Baseline Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {baselineConfig.map((item) => (
                    <TableRow key={item.key}>
                      <TableCell className="font-mono text-sm">
                        {item.key}
                      </TableCell>
                      <TableCell className="font-mono">{item.value}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratelimits">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Limit</TableHead>
                    <TableHead>Window</TableHead>
                    <TableHead>Burst</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rateLimits.map((rule) => (
                    <TableRow key={rule.endpoint}>
                      <TableCell className="font-mono text-sm">
                        {rule.endpoint}
                      </TableCell>
                      <TableCell>{rule.limit}</TableCell>
                      <TableCell>{rule.window}</TableCell>
                      <TableCell>{rule.burst}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
