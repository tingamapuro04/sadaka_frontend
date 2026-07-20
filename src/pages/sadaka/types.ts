export interface SadakaLoginResponse {
  token: string;
  role: 'sadaka_super_admin';
}

export interface SadakaLoginChallengeResponse {
  challenge_required: true;
  challenge_id: string;
  expires_at: string;
  delivery_channel: 'sms';
  masked_phone: string;
  role: 'sadaka_super_admin';
}

export interface SadakaLoginVerifyResponse {
  token: string;
  role: 'sadaka_super_admin';
}

export interface SadakaDashboard {
  total_churches: number;
  total_volume: number;
  total_fees: number;
  failed_withdrawals_pending_retry: number;
  awaiting_payments?: number;
  failed_payments_24h?: number;
  paid_volume_7d?: number;
  paid_volume_30d?: number;
  top_churches?: Array<{
    id: string;
    name: string;
    username: string;
    total_volume: number;
    available_balance: number;
  }>;
  failed_withdrawals?: Array<{
    id: string;
    church_id: string;
    church_name: string;
    amount: number;
    status: string;
  }>;
}

export interface SadakaPageMeta {
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface SadakaChurchesPage extends SadakaPageMeta {
  churches: SadakaChurchSummary[];
}

export interface SadakaWithdrawalsPage extends SadakaPageMeta {
  withdrawals: SadakaWithdrawal[];
}

export interface SadakaAuditLogsPage extends SadakaPageMeta {
  logs: SadakaAuditLog[];
}

export interface SadakaTransaction {
  id: string;
  church_id: string;
  church_name: string;
  status: 'awaiting_payment' | 'paid' | 'failed';
  gross_amount: number;
  fee: number;
  total_amount: number;
  payer_phone: string;
  mpesa_ref: string | null;
  source: 'offering' | 'event' | string;
  event_id: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface SadakaTransactionsPage extends SadakaPageMeta {
  transactions: SadakaTransaction[];
}

export interface SadakaChurchSummary {
  id: string;
  name: string;
  username: string;
  available_balance: number;
  total_volume: number;
  suspended?: boolean;
  suspended_at?: string | null;
}

export interface SadakaTransactionSummary {
  total_transactions: number;
  paid_transactions: number;
  failed_transactions: number;
}

export interface SadakaWithdrawalSummary {
  total_withdrawals: number;
  completed_withdrawals: number;
  failed_withdrawals: number;
  pending_withdrawals: number;
}

export interface SadakaChurchDetail {
  id: string;
  name: string;
  username: string;
  phone: string;
  email?: string | null;
  logo_url?: string | null;
  groups_enabled: boolean;
  withdrawal_method: 'phone' | 'till' | 'paybill';
  withdrawal_number: string;
  payment_url: string;
  available_balance: number;
  total_volume: number;
  total_fees_collected: number;
  transaction_summary?: SadakaTransactionSummary;
  withdrawal_summary?: SadakaWithdrawalSummary;
  suspended?: boolean;
  suspended_at?: string | null;
}

export interface SadakaWithdrawal {
  id: string;
  church_id: string;
  church_name: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduled_for: string;
  created_at: string;
}

export interface SadakaAuditLog {
  id: string;
  church_id: string | null;
  church_name: string | null;
  action: string;
  actor: string;
  details: Record<string, unknown> | null;
  created_at: string;
}
