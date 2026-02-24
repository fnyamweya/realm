import { Suspense } from 'react';
import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { DollarSign } from 'lucide-react';

export const metadata = { title: 'Payments' };

const payments = [
  {
    id: '1',
    date: '2024-12-01',
    description: 'Rent - December 2024',
    amount: '$1,250.00',
    status: 'paid' as const,
  },
  {
    id: '2',
    date: '2024-11-01',
    description: 'Rent - November 2024',
    amount: '$1,250.00',
    status: 'paid' as const,
  },
  {
    id: '3',
    date: '2024-10-01',
    description: 'Rent - October 2024',
    amount: '$1,250.00',
    status: 'paid' as const,
  },
  {
    id: '4',
    date: '2025-01-01',
    description: 'Rent - January 2025',
    amount: '$1,250.00',
    status: 'upcoming' as const,
  },
];

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  paid: 'secondary',
  upcoming: 'outline',
  overdue: 'destructive',
};

function BalanceCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">$0.00</div>
        <p className="text-xs text-muted-foreground">No balance due</p>
        <div className="mt-4">
          <Button>Make Payment</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentHistory() {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.date}</TableCell>
                <TableCell>{payment.description}</TableCell>
                <TableCell className="font-medium">{payment.amount}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[payment.status]}>
                    {payment.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PaymentsSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="mt-1 h-3 w-32" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Payments"
        description="View your balance and payment history."
      />
      <Suspense fallback={<PaymentsSkeleton />}>
        <div className="space-y-4">
          <BalanceCard />
          <PaymentHistory />
        </div>
      </Suspense>
    </PageContainer>
  );
}
