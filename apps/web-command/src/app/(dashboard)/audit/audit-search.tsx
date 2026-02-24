'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  Input,
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@realtyos/ui';
import { Search } from 'lucide-react';

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  ipHash: string;
  status: 'success' | 'failure' | 'denied';
}

const statusVariants: Record<AuditEntry['status'], 'default' | 'secondary' | 'destructive'> = {
  success: 'default',
  failure: 'destructive',
  denied: 'secondary',
};

const auditData: AuditEntry[] = [
  {
    id: 'aud_001',
    timestamp: '2024-06-21 14:32:01',
    actor: 'admin@realtyos.com',
    action: 'client.create',
    resource: 'cli_01HB06P',
    ipHash: 'a3f8..c912',
    status: 'success',
  },
  {
    id: 'aud_002',
    timestamp: '2024-06-21 13:15:44',
    actor: 'ops@realtyos.com',
    action: 'config.update',
    resource: 'feature_flags',
    ipHash: 'b7e2..d481',
    status: 'success',
  },
  {
    id: 'aud_003',
    timestamp: '2024-06-21 12:08:19',
    actor: 'unknown@external.com',
    action: 'auth.login',
    resource: 'command_panel',
    ipHash: 'c1d3..e590',
    status: 'denied',
  },
  {
    id: 'aud_004',
    timestamp: '2024-06-21 10:45:33',
    actor: 'admin@realtyos.com',
    action: 'client.suspend',
    resource: 'cli_01HC17Q',
    ipHash: 'a3f8..c912',
    status: 'success',
  },
  {
    id: 'aud_005',
    timestamp: '2024-06-20 22:11:07',
    actor: 'ops@realtyos.com',
    action: 'job.retry',
    resource: 'job_88291',
    ipHash: 'b7e2..d481',
    status: 'failure',
  },
  {
    id: 'aud_006',
    timestamp: '2024-06-20 18:30:55',
    actor: 'admin@realtyos.com',
    action: 'config.update',
    resource: 'rate_limits',
    ipHash: 'a3f8..c912',
    status: 'success',
  },
];

export function AuditSearch() {
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = auditData.filter((entry) => {
    if (actor && !entry.actor.toLowerCase().includes(actor.toLowerCase()))
      return false;
    if (action !== 'all' && entry.action !== action) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Actor</label>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by actor..."
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Action</label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="client.create">client.create</SelectItem>
                  <SelectItem value="client.suspend">client.suspend</SelectItem>
                  <SelectItem value="config.update">config.update</SelectItem>
                  <SelectItem value="auth.login">auth.login</SelectItem>
                  <SelectItem value="job.retry">job.retry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Date From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Date To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>IP Hash</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-sm">
                    {entry.timestamp}
                  </TableCell>
                  <TableCell>{entry.actor}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                      {entry.action}
                    </code>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {entry.resource}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {entry.ipHash}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[entry.status]}>
                      {entry.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No audit entries found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
