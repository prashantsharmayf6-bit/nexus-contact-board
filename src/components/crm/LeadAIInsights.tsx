import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, TrendingDown, Minus, Calendar, AlertTriangle, Sparkles, Loader2, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface LeadInsights {
  health_score: number;
  health_label: string;
  health_reason: string;
  touchbase_recommendation: string;
  followup_date: string;
  followup_action: string;
  risk_factors: string[];
  opportunities: string[];
  engagement_trend: string;
}

const LeadAIInsights = ({ leadId }: { leadId: string }) => {
  const [insights, setInsights] = useState<LeadInsights | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lead-insights`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ lead_id: leadId }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to get insights');
      }

      setInsights(await res.json());
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 70) return 'text-emerald-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const getHealthBg = (score: number) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'Increasing') return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (trend === 'Declining') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  if (!insights) {
    return (
      <Button
        onClick={fetchInsights}
        disabled={loading}
        variant="outline"
        className="w-full gap-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing lead...</>
        ) : (
          <><Brain className="w-4 h-4 text-primary" /> Generate AI Insights</>
        )}
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary" /> AI Insights
        </h4>
        <Button variant="ghost" size="sm" onClick={fetchInsights} disabled={loading} className="h-7 text-xs">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      {/* Health Score */}
      <Card className="border-none shadow-sm bg-gradient-to-br from-background to-muted/30">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lead Health</span>
            <span className={`text-2xl font-bold ${getHealthColor(insights.health_score)}`}>
              {insights.health_score}%
            </span>
          </div>
          <Progress value={insights.health_score} className={`h-2 [&>div]:${getHealthBg(insights.health_score)}`} />
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              insights.health_label === 'Hot' ? 'bg-emerald-100 text-emerald-700' :
              insights.health_label === 'Warm' ? 'bg-amber-100 text-amber-700' :
              insights.health_label === 'Cold' ? 'bg-blue-100 text-blue-700' :
              'bg-red-100 text-red-700'
            }`}>{insights.health_label}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon(insights.engagement_trend)} {insights.engagement_trend}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{insights.health_reason}</p>
        </CardContent>
      </Card>

      {/* Touchbase */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Touchbase</span>
          </div>
          <p className="text-sm">{insights.touchbase_recommendation}</p>
        </CardContent>
      </Card>

      {/* Follow-up */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Follow-up</span>
            </div>
            <span className="text-xs font-medium text-primary">
              {format(new Date(insights.followup_date), 'MMM d, yyyy')}
            </span>
          </div>
          <p className="text-sm">{insights.followup_action}</p>
        </CardContent>
      </Card>

      {/* Risks & Opportunities */}
      {insights.risk_factors.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-400" /> Risks
          </span>
          {insights.risk_factors.map((r, i) => (
            <p key={i} className="text-xs text-muted-foreground pl-4">• {r}</p>
          ))}
        </div>
      )}
      {insights.opportunities.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" /> Opportunities
          </span>
          {insights.opportunities.map((o, i) => (
            <p key={i} className="text-xs text-muted-foreground pl-4">• {o}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadAIInsights;
