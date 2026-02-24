import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@realtyos/ui';
import { Building2, Users, Wrench, DollarSign } from 'lucide-react';
import { PropertyTabs } from './property-tabs';

export const metadata = { title: 'Property Details' };

// Placeholder property data
const property = {
  id: '1',
  name: 'Maple Heights',
  address: '123 Maple Ave, Springfield',
  units: 24,
  occupancy: 92,
  revenue: '$12,400',
  openRequests: 3,
  status: 'active' as const,
};

const overviewStats = [
  { title: 'Total Units', value: String(property.units), icon: Building2 },
  { title: 'Occupancy', value: `${property.occupancy}%`, icon: Users },
  {
    title: 'Monthly Revenue',
    value: property.revenue,
    icon: DollarSign,
  },
  {
    title: 'Open Requests',
    value: String(property.openRequests),
    icon: Wrench,
  },
];

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  return (
    <PageContainer>
      <PageHeader
        title={property.name}
        description={property.address}
        actions={
          <Badge variant="default">{property.status}</Badge>
        }
      />
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {overviewStats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <PropertyTabs />
      </div>
    </PageContainer>
  );
}
