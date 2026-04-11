import { useMemo } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { LEAD_STATUSES } from '@/lib/constants';
import { Users, IndianRupee, TrendingUp, CheckCircle, ArrowUpRight, Activity, Target } from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval, eachMonthOfInterval, startOfMonth, subMonths } from 'date-fns';

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#6366F1', '#22C55E', '#EF4444'];

const formatINR = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const Dashboard = () => {
  const { data: leads = [] } = useLeads();

  const totalLeads = leads.length;
  const totalValue = leads.reduce((sum, l) => sum + (l.value || 0), 0);
  const wonDeals = leads.filter(l => l.status === 'won').length;
  const conversionRate = totalLeads ? ((wonDeals / totalLeads) * 100).toFixed(1) : '0';
  const activeDeals = leads.filter(l => !['won', 'lost'].includes(l.status)).length;

  const statusCounts = LEAD_STATUSES.map(s => ({
    ...s,
    count: leads.filter(l => l.status === s.value).length,
  }));

  const stats = [
    {
      label: 'Total Leads',
      value: totalLeads,
      icon: Users,
      gradient: 'from-blue-500 via-blue-600 to-indigo-600',
      shadow: 'shadow-blue-500/30',
      change: '+12%',
    },
    {
      label: 'Pipeline Value',
      value: formatINR(totalValue),
      icon: IndianRupee,
      gradient: 'from-violet-500 via-purple-600 to-fuchsia-600',
      shadow: 'shadow-purple-500/30',
      change: '+8%',
    },
    {
      label: 'Won Deals',
      value: wonDeals,
      icon: CheckCircle,
      gradient: 'from-emerald-500 via-green-500 to-teal-500',
      shadow: 'shadow-emerald-500/30',
      change: '+5%',
    },
    {
      label: 'Conversion',
      value: `${conversionRate}%`,
      icon: TrendingUp,
      gradient: 'from-pink-500 via-rose-500 to-orange-500',
      shadow: 'shadow-pink-500/30',
      change: '+2.3%',
    },
  ];

  const leadTrends = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    return days.map(day => {
      const dayStart = startOfDay(day);
      const count = leads.filter(l => startOfDay(new Date(l.created_at)).getTime() === dayStart.getTime()).length;
      return { date: format(day, 'MMM d'), leads: count };
    });
  }, [leads]);

  const funnelData = useMemo(() => {
    const order = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won'];
    return order.map((status, i) => {
      const s = LEAD_STATUSES.find(st => st.value === status);
      const count = leads.filter(l => l.status === status).length;
      return { name: s?.label || status, value: count, fill: COLORS[i % COLORS.length] };
    }).filter(d => d.value > 0);
  }, [leads]);

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
        <div className="rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl p-3 shadow-2xl">
          <p className="text-xs font-semibold text-foreground mb-1.5">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="text-xs flex items-center gap-1.5" style={{ color: p.color }}>
              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              {p.name}: {typeof p.value === 'number' && p.name !== 'leads' ? formatINR(p.value) : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Your sales performance at a glance</p>
      </div>

      {/* Stats Cards — 3D Glassmorphic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => (
          <div
            key={s.label}
            className="group relative overflow-hidden rounded-2xl p-5 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default"
            style={{
              animationDelay: `${idx * 80}ms`,
              animationFillMode: 'backwards',
            }}
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient}`} />
            {/* Glass overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/10" />
            {/* Floating orb */}
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all duration-500" />
            <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5 blur-xl" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                  <s.icon className="w-5 h-5" />
                </div>
                <span className="flex items-center gap-0.5 text-xs font-semibold bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  {s.change}
                </span>
              </div>
              <p className="text-2xl font-bold tracking-tight">{s.value}</p>
              <p className="text-xs font-medium opacity-80 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lead Trends + Source Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Lead Trends */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-border/40 bg-card p-5"
          style={{
            boxShadow: '0 8px 32px -8px rgba(0,0,0,0.08), 0 4px 16px -4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand-gradient opacity-60" />
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Lead Trends</h3>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={leadTrends}>
              <defs>
                <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" fill="url(#leadGrad)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: 'hsl(var(--primary))', stroke: 'white', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Source Distribution */}
        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card p-5"
          style={{
            boxShadow: '0 8px 32px -8px rgba(0,0,0,0.08), 0 4px 16px -4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 opacity-60" />
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Target className="w-4 h-4 text-accent-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Lead Sources</h3>
          </div>
          {sourceDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={sourceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    cornerRadius={6}
                    stroke="none"
                  >
                    {sourceDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {sourceDistribution.map((s, i) => (
                  <span key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    {s.name} ({s.value})
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Conversion Funnel + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Conversion Funnel */}
        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card p-5"
          style={{
            boxShadow: '0 8px 32px -8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-60" />
          <h3 className="text-sm font-semibold text-foreground mb-4">Conversion Funnel</h3>
          {funnelData.length > 0 ? (
            <div className="space-y-2.5">
              {(() => {
                const maxVal = Math.max(...funnelData.map(d => d.value));
                return funnelData.map((d) => {
                  const pct = maxVal ? (d.value / maxVal) * 100 : 0;
                  return (
                    <div key={d.name} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-24 text-right text-muted-foreground">{d.name}</span>
                      <div className="flex-1 relative h-9">
                        <div className="absolute inset-0 bg-muted/50 rounded-lg" />
                        <div
                          className="absolute left-0 top-0 h-full rounded-lg flex items-center px-3 transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            minWidth: '2.5rem',
                            background: `linear-gradient(135deg, ${d.fill}, ${d.fill}cc)`,
                            boxShadow: `0 4px 12px -2px ${d.fill}40`,
                          }}
                        >
                          <span className="text-white text-xs font-bold">{d.value}</span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
          )}
        </div>

        {/* Pipeline Overview */}
        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card p-5"
          style={{
            boxShadow: '0 8px 32px -8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-60" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Pipeline Overview</h3>
            <span className="text-xs font-medium text-muted-foreground">{activeDeals} active</span>
          </div>
          <div className="space-y-3">
            {statusCounts.map((s, i) => {
              const pct = totalLeads ? (s.count / totalLeads) * 100 : 0;
              const color = COLORS[i % COLORS.length];
              return (
                <div key={s.value} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground">{s.label}</span>
                    <span className="text-xs text-muted-foreground">{s.count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                        boxShadow: `0 2px 8px -2px ${color}50`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Revenue & Forecast */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card p-5"
        style={{
          boxShadow: '0 8px 32px -8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand-gradient opacity-60" />
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <IndianRupee className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Revenue & Forecast</h3>
            <p className="text-xs text-muted-foreground">6-month history with 3-month projection</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueForecast} barGap={4}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C55E" stopOpacity={1} />
                <stop offset="100%" stopColor="#22C55E" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="revenue" name="Won Revenue" fill="url(#revenueGrad)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="pipeline" name="Pipeline" fill="hsl(var(--primary) / 0.2)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="forecast" name="Forecast" fill="url(#forecastGrad)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
