import { Suspense } from 'react';
import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@realtyos/ui';
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export const metadata = { title: 'Finance' };

const summaryStats = [
  {
    title: 'Total Revenue',
    value: '$148,250',
    change: '+12.5% from last month',
    icon: DollarSign,
  },
  {
    title: 'Net Income',
    value: '$92,400',
    change: '+8.2% from last month',
    icon: TrendingUp,
  },
  {
    title: 'Expenses',
    value: '$55,850',
    change: '+3.1% from last month',
    icon: TrendingDown,
  },
  {
    title: 'Outstanding',
    value: '$12,300',
    change: '5 overdue invoices',
    icon: Wallet,
  },
];

const transactions = [
  {
    id: '1',
    description: 'Rent - John Smith, Unit 4B',
    amount: '+$1,250',
    date: '2024-12-01',
    type: 'income' as const,
  },
  {
    id: '2',
    description: 'Maintenance - Plumbing repair',
    amount: '-$450',
    date: '2024-11-30',
    type: 'expense' as const,
  },
  {
    id: '3',
    description: 'Rent - Jane Doe, Unit 12A',
    amount: '+$1,800',
    date: '2024-12-01',
    type: 'income' as const,
  },
  {
    id: '4',
    description: 'Insurance premium - Q4',
    amount: '-$2,200',
    date: '2024-11-28',
    type: 'expense' as const,
  },
  {
    id: '5',
    description: 'Rent - Robert Johnson, Unit 7C',
    amount: '+$950',
    date: '2024-12-01',
    type: 'income' as const,
  },
];

function SummaryCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {summaryStats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="mt-1 h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RecentTransactions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{tx.description}</p>
                <p className="text-xs text-muted-foreground">{tx.date}</p>
              </div>
              <span
                className={`text-sm font-semibold ${
                  tx.type === 'income'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {tx.amount}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ChartPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
          <p className="text-sm text-muted-foreground">
            Chart visualization coming soon
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FinancePage() {
  return (
    <PageContainer>
      <PageHeader
        title="Finance"
        description="Financial overview and transaction management."
      />
      <div className="space-y-4">
        <Suspense fallback={<SummarySkeleton />}>
          <SummaryCards />
        </Suspense>
        <div className="grid gap-4 lg:grid-cols-2">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <RecentTransactions />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <ChartPlaceholder />
          </Suspense>
        </div>
      </div>
    </PageContainer>
  );
}
