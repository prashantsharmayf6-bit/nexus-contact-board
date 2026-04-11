import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LEAD_STATUSES, LEAD_SOURCES } from '@/lib/constants';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Filters {
  search: string;
  status: string;
  source: string;
  dateFrom: string;
  dateTo: string;
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const LeadFilters = ({ filters, onChange }: Props) => {
  const update = (key: keyof Filters, value: string) => onChange({ ...filters, [key]: value });
  const hasFilters = filters.status !== 'all' || filters.source !== 'all' || filters.dateFrom || filters.dateTo;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, company, or email..."
          value={filters.search}
          onChange={e => update('search', e.target.value)}
          className="pl-9 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-colors"
        />
      </div>
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-muted-foreground hidden sm:block" />
        <Select value={filters.status} onValueChange={v => update('status', v)}>
          <SelectTrigger className="w-[140px] rounded-xl border-border/50"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {LEAD_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.source} onValueChange={v => update('source', v)}>
          <SelectTrigger className="w-[140px] rounded-xl border-border/50"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {LEAD_SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={e => update('dateFrom', e.target.value)}
          className="w-[145px] rounded-xl border-border/50"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input
          type="date"
          value={filters.dateTo}
          onChange={e => update('dateTo', e.target.value)}
          className="w-[145px] rounded-xl border-border/50"
        />
      </div>
      {hasFilters && (
        <Button variant="ghost" size="sm" className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onChange({ search: filters.search, status: 'all', source: 'all', dateFrom: '', dateTo: '' })}>
          <X className="w-4 h-4 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
};

export default LeadFilters;
