import { PageHeader, PageContainer } from '@realtyos/ui-shells';
import {
    Badge,
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@realtyos/ui';
import { TrendingDown, TrendingUp } from 'lucide-react';

export const metadata = { title: 'Dashboard' };

function OverviewCards() {
    return (
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4">
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Total Revenue</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        $1,250.00
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            <TrendingUp className="size-3" />
                            +12.5%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        Trending up this month <TrendingUp className="size-4" />
                    </div>
                    <div className="text-muted-foreground">Visitors for the last 6 months</div>
                </CardFooter>
            </Card>

            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>New Customers</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        1,234
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            <TrendingDown className="size-3" />
                            -20%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        Down 20% this period <TrendingDown className="size-4" />
                    </div>
                    <div className="text-muted-foreground">Acquisition needs attention</div>
                </CardFooter>
            </Card>

            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Active Accounts</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        45,678
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            <TrendingUp className="size-3" />
                            +12.5%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        Strong user retention <TrendingUp className="size-4" />
                    </div>
                    <div className="text-muted-foreground">Engagement exceed targets</div>
                </CardFooter>
            </Card>

            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Growth Rate</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        4.5%
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            <TrendingUp className="size-3" />
                            +4.5%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        Steady performance increase <TrendingUp className="size-4" />
                    </div>
                    <div className="text-muted-foreground">Meets growth projections</div>
                </CardFooter>
            </Card>
        </div>
    );
}

function OverviewGrid() {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
                    <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                        <CardTitle>Bar Chart - Interactive</CardTitle>
                        <CardDescription>Total for the last 3 months</CardDescription>
                    </div>
                    <div className="flex">
                        {[
                            { label: 'Desktop', value: '24,828' },
                            { label: 'Mobile', value: '25,010' },
                        ].map((item, index) => (
                            <div
                                key={item.label}
                                className={`relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left sm:border-t-0 sm:px-8 sm:py-6 ${index === 1 ? 'sm:border-l' : ''}`}
                            >
                                <span className="text-muted-foreground text-xs">{item.label}</span>
                                <span className="text-lg leading-none font-bold sm:text-3xl">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </CardHeader>
                <div className="px-6 py-4">
                    <div className="grid h-[220px] grid-cols-24 items-end gap-1">
                        {Array.from({ length: 96 }).map((_, index) => (
                            <div
                                key={index}
                                className="bg-primary/40 rounded-sm"
                                style={{ height: `${18 + ((index * 19) % 82)}%` }}
                            />
                        ))}
                    </div>
                </div>
            </Card>

            <Card className="col-span-4 md:col-span-3">
                <CardHeader>
                    <CardTitle>Recent Sales</CardTitle>
                    <CardDescription>You made 265 sales this month.</CardDescription>
                </CardHeader>
                <div className="space-y-4 px-6 pb-6">
                    {[
                        { name: 'Olivia Martin', email: 'olivia.martin@email.com', amount: '+$1,999.00' },
                        { name: 'Jackson Lee', email: 'jackson.lee@email.com', amount: '+$39.00' },
                        { name: 'Isabella Nguyen', email: 'isabella.nguyen@email.com', amount: '+$299.00' },
                        { name: 'William Kim', email: 'will@email.com', amount: '+$99.00' },
                        { name: 'Sofia Davis', email: 'sofia.davis@email.com', amount: '+$39.00' },
                    ].map((sale) => (
                        <div key={sale.email} className="flex items-center justify-between text-sm">
                            <div>
                                <p className="font-medium">{sale.name}</p>
                                <p className="text-muted-foreground text-xs">{sale.email}</p>
                            </div>
                            <p className="font-semibold">{sale.amount}</p>
                        </div>
                    ))}
                </div>
            </Card>

            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Area Chart - Stacked</CardTitle>
                    <CardDescription>Showing total visitors for the last 6 months</CardDescription>
                </CardHeader>
                <div className="h-[220px] px-6 pb-6">
                    <div className="bg-primary/15 h-full w-full rounded-md" />
                </div>
            </Card>

            <Card className="col-span-4 md:col-span-3">
                <CardHeader>
                    <CardTitle>Pie Chart - Donut with Text</CardTitle>
                    <CardDescription>Total visitors by browser for the last 6 months</CardDescription>
                </CardHeader>
                <div className="h-[220px] px-6 pb-6">
                    <div className="bg-primary/15 h-full w-full rounded-md" />
                </div>
            </Card>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <PageContainer>
            <div className="flex flex-1 flex-col space-y-2">
                <PageHeader title="Hi, Welcome back 👋" className="mb-2" />
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="analytics" disabled>
                            Analytics
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="space-y-4">
                        <OverviewCards />
                        <OverviewGrid />
                    </TabsContent>
                </Tabs>
            </div>
        </PageContainer>
    );
}