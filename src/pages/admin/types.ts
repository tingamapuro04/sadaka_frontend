import type { Church } from '../../types/api.types';
import type {
  LoginChallengeResponse,
  LoginVerifyResponse
} from '../../types/api.types';

export type AdminStatus = 'paid' | 'failed' | 'pending' | 'awaiting_payment' | string;

export interface AdminBreakdown {
  category_id?: string;
  group_id?: string;
  name: string;
  total: number;
}

export interface AdminDashboard {
  total_income: number;
  transaction_counts: {
    today: number;
    week: number;
    month: number;
  };
  by_category: AdminBreakdown[];
  by_group: AdminBreakdown[];
  available_balance?: number;
}

export interface AdminTransaction {
  id: string;
  church_id: string;
  group_id?: string | null;
  payer_name?: string | null;
  payer_phone: string;
  gross_amount: number;
  fee: number;
  total_amount: number;
  status: AdminStatus;
  mpesa_ref?: string | null;
  created_at: string;
}

export interface TransactionFiltersState {
  page: number;
  status: string;
  phone: string;
  mpesa_ref: string;
  from: string;
  to: string;
  category_id: string;
  sort: keyof AdminTransaction;
  direction: 'asc' | 'desc';
}

export interface AdminTransactionsResponse {
  total: number;
  page: number;
  transactions: AdminTransaction[];
}

export interface AdminListItem {
  id: string;
  name: string;
  is_active: boolean;
  transaction_count?: number;
}

export type EventStatus = 'draft' | 'active' | 'closed';

export interface EventTotals {
  paid_count: number;
  paid_gross: number;
  awaiting_count: number;
}

export interface ChurchEvent {
  id: string;
  church_id: string;
  title: string;
  description?: string | null;
  slug: string;
  status: EventStatus;
  starts_at?: string | null;
  ends_at?: string | null;
  target_amount?: number | null;
  payment_url: string;
  totals?: EventTotals;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEventPayload {
  title: string;
  description?: string | null;
  slug?: string;
  status?: EventStatus;
  target_amount?: number | null;
}

export interface UpdateEventPayload {
  title?: string;
  description?: string | null;
  status?: EventStatus;
  target_amount?: number | null;
}

export interface EventsListResponse {
  total: number;
  page: number;
  events: ChurchEvent[];
}

export interface AuditLog {
  id: string;
  action: string;
  church_id: string | null;
  actor_id: string;
  actor_role: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  church_id: string;
  amount: number;
  method: 'phone' | 'till' | 'paybill';
  withdrawal_number: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  initiated_by: string;
  initiated_at: string;
  scheduled_for: string;
  completed_at: string | null;
  notes: string | null;
}

export interface ReadonlyAdminAccount {
  id: string;
  phone: string;
  role: 'readonly';
  created_at: string;
}

export type AdminChurch = Church;

export type AdminLoginChallengeResponse = LoginChallengeResponse;
export type AdminLoginVerifyResponse = LoginVerifyResponse;
