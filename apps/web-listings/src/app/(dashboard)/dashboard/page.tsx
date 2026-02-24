import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@realtyos/ui';
import { Building2, Eye, MessageSquare, TrendingUp } from 'lucide-react';

export const metadata = { title: 'Dashboard' };

const stats = [
  {
    label: 'Active Listings',
    value: '148',
    trend: '+9 this week',
    icon: Building2,
  },
  {
    label: 'Views (7 days)',
    value: '24,306',
    trend: '+12.8%',
    icon: Eye,
  },
  {
    label: 'New Inquiries',
    value: '312',
    trend: '+6.1%',
    icon: MessageSquare,
  },
  {
    label: 'Conversion Rate',
    value: '3.9%',
    trend: '+0.4%',
    icon: TrendingUp,
  },
];

export default function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Listings Dashboard"
        description="Monitor listing performance and lead activity."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Cities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { city: 'Nairobi', listings: 57, change: '+11%' },
              { city: 'Mombasa', listings: 29, change: '+4%' },
              { city: 'Kisumu', listings: 18, change: '+9%' },
              { city: 'Nakuru', listings: 13, change: '+2%' },
            ].map((item) => (
              <div key={item.city} className="flex items-center justify-between">
                <span>{item.city}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{item.listings} listings</span>
                  <Badge variant="outline">{item.change}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              'Listing #A-204 was published to all channels.',
              'Price update approved for listing #B-110.',
              '7 new inquiries received for Westlands listings.',
              'Photo sync completed for 12 listings.',
            ].map((event) => (
              <div key={event} className="rounded-md border p-3">
                {event}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
