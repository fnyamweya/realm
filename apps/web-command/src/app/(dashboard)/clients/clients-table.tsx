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

interface Client {
  id: string;
  name: string;
  plan: string;
  status: 'active' | 'provisioning' | 'suspended';
  created: string;
  users: number;
}

const statusVariants: Record<Client['status'], 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  provisioning: 'secondary',
  suspended: 'destructive',
};

export function ClientsTable({ clients }: { clients: Client[] }) {
  const [search, setSearch] = useState('');

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Users</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-mono text-sm">
                  {client.id}
                </TableCell>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.plan}</TableCell>
                <TableCell>
                  <Badge variant={statusVariants[client.status]}>
                    {client.status}
                  </Badge>
                </TableCell>
                <TableCell>{client.created}</TableCell>
                <TableCell className="text-right">{client.users}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No clients found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
