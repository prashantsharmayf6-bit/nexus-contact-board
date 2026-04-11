export const LEAD_STATUSES = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700', solidBg: '#3B82F6', solidText: '#ffffff' },
  { value: 'contacted', label: 'Contacted', color: 'bg-amber-100 text-amber-700', solidBg: '#F59E0B', solidText: '#ffffff' },
  { value: 'qualified', label: 'Qualified', color: 'bg-purple-100 text-purple-700', solidBg: '#8B5CF6', solidText: '#ffffff' },
  { value: 'proposal', label: 'Proposal', color: 'bg-orange-100 text-orange-700', solidBg: '#F97316', solidText: '#ffffff' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-indigo-100 text-indigo-700', solidBg: '#6366F1', solidText: '#ffffff' },
  { value: 'won', label: 'Won', color: 'bg-emerald-100 text-emerald-700', solidBg: '#10B981', solidText: '#ffffff' },
  { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-700', solidBg: '#EF4444', solidText: '#ffffff' },
] as const;

export const LEAD_SOURCES = [
  { value: 'manual', label: 'Manual' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'social', label: 'Social Media' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'other', label: 'Other' },
] as const;

export type LeadStatus = typeof LEAD_STATUSES[number]['value'];
export type LeadSource = typeof LEAD_SOURCES[number]['value'];
