export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T;
}

export interface Church {
  id: string;
  name: string;
  username: string;
  phone: string;
  email?: string;
  logo_url?: string;
  groups_enabled: boolean;
  withdrawal_method: 'phone' | 'till' | 'paybill';
  withdrawal_number: string;
  payment_url: string;
}

export interface RegisterChurchResponse {
  token: string;
  church: Church;
}

export interface LoginResponse {
  token: string;
  role: 'church_super_admin' | 'readonly';
  church?: Church;
}

export interface LoginChallengeResponse {
  challenge_required: true;
  challenge_id: string;
  expires_at: string;
  delivery_channel: 'sms';
  masked_phone: string;
  role: 'church_super_admin' | 'readonly' | 'sadaka_super_admin';
}

export interface LoginVerifyResponse {
  token: string;
  role: 'church_super_admin' | 'readonly' | 'sadaka_super_admin';
  church?: Church;
  account?: {
    id: string;
    church_id: string;
    phone: string;
    role: 'readonly';
    created_at: string;
  };
}

export interface AuthMeResponse {
  token: string;
  role: 'church_super_admin' | 'readonly';
  church_id: string;
  actor_id: string;
  church?: Church;
  account?: {
    id: string;
    church_id: string;
    phone: string;
    role: 'readonly';
    created_at: string;
  };
}
