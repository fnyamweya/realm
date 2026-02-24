import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@realtyos/ui';

export const metadata = { title: 'Analytics' };

export default function AnalyticsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Analytics"
        description="Understand listing reach, inquiry velocity, and conversion trends."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Traffic Trend (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid h-56 grid-cols-30 items-end gap-1">
              {Array.from({ length: 30 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-primary/40 rounded-sm"
                  style={{ height: `${20 + ((idx * 17) % 75)}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Channel Mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Website</span>
              <span className="font-medium">58%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Portals</span>
              <span className="font-medium">31%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Direct</span>
              <span className="font-medium">11%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
