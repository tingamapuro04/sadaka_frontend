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
}

export interface SadakaChurchSummary {
  id: string;
  name: string;
  username: string;
  available_balance: number;
  total_volume: number;
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
}

export interface SadakaWithdrawal {
  id: string;
  church_id: string;
  church_name: string;
  amount: number;
  status: 'pending' | 'processing' | 'scheduled' | 'completed' | 'failed';
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
