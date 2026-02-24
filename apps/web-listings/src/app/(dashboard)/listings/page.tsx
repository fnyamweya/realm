import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@realtyos/ui';
import { Plus } from 'lucide-react';

export const metadata = { title: 'Listings' };

const listings = [
  {
    id: 'LST-1001',
    title: 'Modern 2 Bedroom Apartment',
    location: 'Westlands, Nairobi',
    status: 'Published',
    price: 'KES 95,000/mo',
  },
  {
    id: 'LST-1002',
    title: '3 Bedroom Townhouse',
    location: 'Kilimani, Nairobi',
    status: 'Draft',
    price: 'KES 135,000/mo',
  },
  {
    id: 'LST-1003',
    title: 'Studio Unit Near CBD',
    location: 'Ngara, Nairobi',
    status: 'Published',
    price: 'KES 42,000/mo',
  },
];

export default function ListingsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Listings"
        description="Create and manage your rental inventory."
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Listing
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {listings.map((listing) => (
            <div key={listing.id} className="rounded-md border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{listing.title}</p>
                  <p className="text-sm text-muted-foreground">{listing.location}</p>
                </div>
                <Badge variant={listing.status === 'Published' ? 'default' : 'secondary'}>
                  {listing.status}
                </Badge>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {listing.id} • {listing.price}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
