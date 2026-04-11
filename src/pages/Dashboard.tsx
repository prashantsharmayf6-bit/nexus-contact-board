import { useLeads } from '@/hooks/useLeads';
import { LEAD_STATUSES } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const { data: leads = [] } = useLeads();

  const totalLeads = leads.length;
  const totalValue = leads.reduce((sum, l) => sum + (l.value || 0), 0);
  const wonDeals = leads.filter(l => l.status === 'won').length;
  const conversionRate = totalLeads ? ((wonDeals / totalLeads) * 100).toFixed(1) : '0';

  const statusCounts = LEAD_STATUSES.map(s => ({
    ...s,
    count: leads.filter(l => l.status === s.value).length,
  }));

  const stats = [
    { label: 'Total Leads', value: totalLeads, icon: Users, color: 'text-primary' },
    { label: 'Pipeline Value', value: `$${totalValue.toLocaleString()}`, icon: DollarSign, color: 'text-green-500' },
    { label: 'Won Deals', value: wonDeals, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Conversion', value: `${conversionRate}%`, icon: TrendingUp, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <s.icon className={`w-8 h-8 ${s.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Pipeline Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statusCounts.map(s => (
              <div key={s.value} className="flex items-center gap-4">
                <span className="text-sm w-28">{s.label}</span>
                <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all flex items-center justify-end pr-2"
                    style={{ width: `${totalLeads ? (s.count / totalLeads) * 100 : 0}%`, minWidth: s.count > 0 ? '2rem' : 0 }}
                  >
                    {s.count > 0 && <span className="text-xs text-primary-foreground font-medium">{s.count}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
