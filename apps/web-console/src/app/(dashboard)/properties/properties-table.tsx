'use client';

import Link from 'next/link';
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
import { useState } from 'react';

interface Property {
  id: string;
  name: string;
  address: string;
  units: number;
  occupancy: number;
  status: 'active' | 'maintenance' | 'inactive';
}

const statusVariants: Record<Property['status'], string> = {
  active: 'default',
  maintenance: 'secondary',
  inactive: 'destructive',
};

export function PropertiesTable({
  properties,
}: {
  properties: Property[];
}) {
  const [search, setSearch] = useState('');

  const filtered = properties.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Units</TableHead>
              <TableHead className="text-right">Occupancy</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((property) => (
              <TableRow key={property.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/properties/${property.id}`}
                    className="hover:underline"
                  >
                    {property.name}
                  </Link>
                </TableCell>
                <TableCell>{property.address}</TableCell>
                <TableCell className="text-right">
                  {property.units}
                </TableCell>
                <TableCell className="text-right">
                  {property.occupancy}%
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      statusVariants[property.status] as
                        | 'default'
                        | 'secondary'
                        | 'destructive'
                    }
                  >
                    {property.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No properties found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
