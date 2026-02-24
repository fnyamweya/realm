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

interface MaintenanceRequest {
  id: string;
  property: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'completed';
  created: string;
}

const priorityVariants: Record<
  MaintenanceRequest['priority'],
  'default' | 'secondary' | 'destructive'
> = {
  low: 'secondary',
  medium: 'default',
  high: 'destructive',
};

const statusVariants: Record<
  MaintenanceRequest['status'],
  'default' | 'secondary' | 'destructive'
> = {
  open: 'destructive',
  'in-progress': 'default',
  completed: 'secondary',
};

export function MaintenanceTable({
  requests,
}: {
  requests: MaintenanceRequest[];
}) {
  const [search, setSearch] = useState('');

  const filtered = requests.filter(
    (r) =>
      r.property.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-mono text-sm">
                  {request.id}
                </TableCell>
                <TableCell>{request.property}</TableCell>
                <TableCell>{request.description}</TableCell>
                <TableCell>
                  <Badge variant={priorityVariants[request.priority]}>
                    {request.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariants[request.status]}>
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell>{request.created}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No maintenance requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
