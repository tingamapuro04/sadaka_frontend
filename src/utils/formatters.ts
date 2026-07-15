export const formatKesCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0
  }).format(value);
};

export const formatPhoneDisplay = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length === 12) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
};

export const formatDate = (value: Date | string | null | undefined): string => {
  if (value === null || value === undefined) {
    return '—';
  }

  const normalized = typeof value === 'string' ? value.trim() : value;
  if (!normalized) {
    return '—';
  }

  const date = normalized instanceof Date ? normalized : new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};
