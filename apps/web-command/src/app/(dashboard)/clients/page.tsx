import { Suspense } from 'react';
import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Skeleton,
} from '@realtyos/ui';
import { Plus } from 'lucide-react';
import { ClientsTable } from './clients-table';

export const metadata = { title: 'Clients' };

const clients = [
  {
    id: 'cli_01H8X3K',
    name: 'Acme Properties',
    plan: 'Enterprise',
    status: 'active' as const,
    created: '2024-01-15',
    users: 48,
  },
  {
    id: 'cli_01H9Y4M',
    name: 'Sunrise Realty',
    plan: 'Professional',
    status: 'active' as const,
    created: '2024-02-03',
    users: 22,
  },
  {
    id: 'cli_01HAZ5N',
    name: 'Metro Living',
    plan: 'Enterprise',
    status: 'active' as const,
    created: '2024-03-10',
    users: 65,
  },
  {
    id: 'cli_01HB06P',
    name: 'Coastal Homes Group',
    plan: 'Starter',
    status: 'provisioning' as const,
    created: '2024-06-21',
    users: 3,
  },
  {
    id: 'cli_01HC17Q',
    name: 'Highland Management',
    plan: 'Professional',
    status: 'suspended' as const,
    created: '2024-04-08',
    users: 15,
  },
  {
    id: 'cli_01HD28R',
    name: 'Urban Nest Inc.',
    plan: 'Enterprise',
    status: 'active' as const,
    created: '2024-05-19',
    users: 37,
  },
];

function ClientsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClientsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Clients"
        description="Provision and manage platform clients."
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Provision New Client
          </Button>
        }
      />
      <Suspense fallback={<ClientsSkeleton />}>
        <ClientsTable clients={clients} />
      </Suspense>
    </PageContainer>
  );
}
