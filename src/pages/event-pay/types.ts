import type { Church } from '../../types/api.types';
import type { PaymentResponse } from '../pay/types';

export type { Church, PaymentResponse };

export interface PublicEvent {
  id: string;
  title: string;
  description?: string | null;
  slug: string;
  status: 'draft' | 'active' | 'closed';
  target_amount?: number | null;
  paid_gross: number;
}

export interface EventPaymentPageData {
  church: Church;
  event: PublicEvent;
  platform_fee_kes?: number;
}

export interface EventPaymentSubmission {
  payer_name?: string;
  payer_phone: string;
  amount: number;
}

export interface EventPaymentFormValues {
  payer_name?: string;
  payer_phone: string;
  /** HTML number inputs bind as strings until coerce on submit */
  amount: string;
}
