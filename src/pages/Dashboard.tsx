import { useMemo } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { LEAD_STATUSES } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, IndianRupee, TrendingUp, CheckCircle } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Funnel, FunnelChart,
  LabelList,
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval, eachMonthOfInterval, startOfMonth, subMonths } from 'date-fns';

const COLORS = ['#3B82F6', '#F59E0B', '#8B5CF6', '#F97316', '#6366F1', '#22C55E', '#EF4444'];

const formatINR = (value: number) => `₹${value.toLocaleString('en-IN')}`;

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
    { label: 'Pipeline Value', value: formatINR(totalValue), icon: IndianRupee, color: 'text-green-500' },
    { label: 'Won Deals', value: wonDeals, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Conversion', value: `${conversionRate}%`, icon: TrendingUp, color: 'text-primary' },
  ];

  // Lead trends over last 30 days
  const leadTrends = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    return days.map(day => {
      const dayStart = startOfDay(day);
      const count = leads.filter(l => {
        const created = startOfDay(new Date(l.created_at));
        return created.getTime() === dayStart.getTime();
      }).length;
      return { date: format(day, 'MMM d'), leads: count };
    });
  }, [leads]);

  // Conversion funnel data
  const funnelData = useMemo(() => {
    const order = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won'];
    return order.map((status, i) => {
      const s = LEAD_STATUSES.find(st => st.value === status);
      const count = leads.filter(l => l.status === status).length;
      return { name: s?.label || status, value: count, fill: COLORS[i % COLORS.length] };
    }).filter(d => d.value > 0);
  }, [leads]);

  // Revenue by month (last 6 months)
  const revenueByMonth = useMemo(() => {
    const months = eachMonthOfInterval({ start: subMonths(startOfMonth(new Date()), 5), end: new Date() });
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const nextMonth = new Date(monthStart);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const wonInMonth = leads.filter(l => {
        const updated = new Date(l.updated_at);
        return l.status === 'won' && updated >= monthStart && updated < nextMonth;
      });
      const revenue = wonInMonth.reduce((sum, l) => sum + (l.value || 0), 0);
      const pipeline = leads.filter(l => {
        const created = new Date(l.created_at);
        return created >= monthStart && created < nextMonth;
      }).reduce((sum, l) => sum + (l.value || 0), 0);

      return { month: format(month, 'MMM yy'), revenue, pipeline };
    });
  }, [leads]);

  // Source distribution pie chart
  const sourceDistribution = useMemo(() => {
    const sourceCounts: Record<string, number> = {};
    leads.forEach(l => {
      const src = l.source || 'manual';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });
    return Object.entries(sourceCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [leads]);

  // Revenue forecast (simple linear projection)
  const revenueForecast = useMemo(() => {
    const pastMonths = revenueByMonth.filter(m => m.revenue > 0);
    const avgRevenue = pastMonths.length > 0
      ? pastMonths.reduce((sum, m) => sum + m.revenue, 0) / pastMonths.length
      : 0;

    const futureMonths = [1, 2, 3].map(offset => {
      const d = new Date();
      d.setMonth(d.getMonth() + offset);
      return {
        month: format(d, 'MMM yy'),
        revenue: 0,
        forecast: Math.round(avgRevenue * (1 + offset * 0.05)),
        pipeline: 0,
      };
    });

    return [
      ...revenueByMonth.map(m => ({ ...m, forecast: 0 })),
      ...futureMonths,
    ];
  }, [revenueByMonth]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="text-xs" style={{ color: p.color }}>
              {p.name}: {typeof p.value === 'number' && p.name !== 'leads' ? formatINR(p.value) : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats Cards */}
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

      {/* Lead Trends + Source Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Lead Trends (Last 30 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={leadTrends}>
                <defs>
                  <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" fill="url(#leadGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Lead Sources</CardTitle></CardHeader>
          <CardContent>
            {sourceDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={sourceDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {sourceDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel + Pipeline Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-lg">Conversion Funnel</CardTitle></CardHeader>
          <CardContent>
            {funnelData.length > 0 ? (
              <div className="space-y-2">
                {(() => {
                  const maxVal = Math.max(...funnelData.map(d => d.value));
                  return funnelData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-3">
                      <span className="text-sm w-28 text-right">{d.name}</span>
                      <div className="flex-1 relative">
                        <div
                          className="h-10 rounded-md flex items-center px-3 transition-all"
                          style={{
                            width: `${maxVal ? (d.value / maxVal) * 100 : 0}%`,
                            minWidth: '3rem',
                            backgroundColor: d.fill,
                          }}
                        >
                          <span className="text-white text-sm font-semibold">{d.value}</span>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Pipeline Overview</CardTitle></CardHeader>
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

      {/* Revenue & Forecast */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Revenue & Forecast</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={revenueForecast}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="revenue" name="Won Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pipeline" name="Pipeline Value" fill="hsl(var(--primary) / 0.3)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="forecast" name="Forecast" fill="#22C55E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
