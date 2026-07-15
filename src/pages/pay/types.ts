import type { Church } from '../../types/api.types';

export type { Church } from '../../types/api.types';

export interface Category {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
}

export interface PaymentPageData {
  church: Church;
  categories: Category[];
  groups: Group[];
  platform_fee_kes?: number;
}

export interface PaymentItem {
  category_id: string;
  amount: number;
}

export interface PaymentSubmission {
  payer_name?: string;
  payer_phone: string;
  group_id?: string | null;
  items: PaymentItem[];
}

export type PaymentStatusValue = 'awaiting_payment' | 'paid' | 'failed';

export interface PaymentResponse {
  transaction_id: string;
  status: PaymentStatusValue;
  gross_amount: number;
  fee: number;
  total_amount: number;
  status_url?: string;
  poll_interval_seconds?: number;
  max_poll_seconds?: number;
  mpesa_ref?: string | null;
  paid_at?: string | null;
  failure_reason?: string | null;
}

export interface PaymentFormValues {
  payer_name?: string;
  payer_phone: string;
  group_id?: string | null;
  items: PaymentItem[];
  selected_categories?: Record<string, boolean>;
}
