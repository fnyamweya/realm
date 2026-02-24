import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@realtyos/ui';

export const metadata = { title: 'Inquiries' };

const inquiries = [
  {
    lead: 'Aisha K.',
    listing: 'Modern 2 Bedroom Apartment',
    source: 'Website',
    status: 'New',
    receivedAt: '2h ago',
  },
  {
    lead: 'Brian M.',
    listing: '3 Bedroom Townhouse',
    source: 'Property portal',
    status: 'In Review',
    receivedAt: '5h ago',
  },
  {
    lead: 'Cynthia N.',
    listing: 'Studio Unit Near CBD',
    source: 'Website',
    status: 'Qualified',
    receivedAt: '1d ago',
  },
];

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  New: 'default',
  'In Review': 'secondary',
  Qualified: 'outline',
};

export default function InquiriesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Inquiries"
        description="Track incoming leads and qualification status."
      />
      <Card>
        <CardHeader>
          <CardTitle>Lead Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {inquiries.map((inquiry) => (
            <div key={`${inquiry.lead}-${inquiry.listing}`} className="flex items-center justify-between rounded-md border p-4">
              <div>
                <p className="font-medium">{inquiry.lead}</p>
                <p className="text-sm text-muted-foreground">{inquiry.listing}</p>
                <p className="text-xs text-muted-foreground">
                  {inquiry.source} • {inquiry.receivedAt}
                </p>
              </div>
              <Badge variant={statusVariant[inquiry.status]}>{inquiry.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
