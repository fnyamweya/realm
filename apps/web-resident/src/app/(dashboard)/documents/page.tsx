import { Suspense } from 'react';
import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import {
  Card,
  CardContent,
  Skeleton,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@realtyos/ui';

export const metadata = { title: 'Documents' };

const documents = [
  {
    id: '1',
    name: 'Lease Agreement',
    type: 'PDF',
    date: '2024-06-01',
    size: '245 KB',
  },
  {
    id: '2',
    name: 'Move-In Checklist',
    type: 'PDF',
    date: '2024-06-01',
    size: '128 KB',
  },
  {
    id: '3',
    name: 'Community Guidelines',
    type: 'PDF',
    date: '2024-01-15',
    size: '89 KB',
  },
  {
    id: '4',
    name: 'Parking Permit',
    type: 'PDF',
    date: '2024-06-15',
    size: '52 KB',
  },
];

function DocumentsTable() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{doc.type}</Badge>
                </TableCell>
                <TableCell>{doc.date}</TableCell>
                <TableCell>{doc.size}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function DocumentsSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DocumentsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Documents"
        description="View and download your documents."
      />
      <Suspense fallback={<DocumentsSkeleton />}>
        <DocumentsTable />
      </Suspense>
    </PageContainer>
  );
}
