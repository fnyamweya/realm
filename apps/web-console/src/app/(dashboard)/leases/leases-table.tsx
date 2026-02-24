'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Input,
} from '@realtyos/ui';
import { Search } from 'lucide-react';

interface Lease {
  id: string;
  tenant: string;
  property: string;
  unit: string;
  start: string;
  end: string;
  status: 'active' | 'expired' | 'pending';
}

const statusVariants: Record<
  Lease['status'],
  'default' | 'secondary' | 'destructive'
> = {
  active: 'default',
  expired: 'destructive',
  pending: 'secondary',
};

export function LeasesTable({ leases }: { leases: Lease[] }) {
  const [search, setSearch] = useState('');

  const filtered = leases.filter(
    (l) =>
      l.tenant.toLowerCase().includes(search.toLowerCase()) ||
      l.property.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((lease) => (
              <TableRow key={lease.id}>
                <TableCell className="font-medium">
                  {lease.tenant}
                </TableCell>
                <TableCell>{lease.property}</TableCell>
                <TableCell>{lease.unit}</TableCell>
                <TableCell>{lease.start}</TableCell>
                <TableCell>{lease.end}</TableCell>
                <TableCell>
                  <Badge variant={statusVariants[lease.status]}>
                    {lease.status}
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
                  No leases found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
