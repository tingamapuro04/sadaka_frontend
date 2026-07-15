const KENYAN_PHONE_REGEX = /^254\d{9}$/;

export const isValidKenyanPhone = (phone: string): boolean => {
  return KENYAN_PHONE_REGEX.test(phone.trim());
};

export const normalizePhone = (phone: string): string => {
  let cleaned = phone.trim().replace(/^\+/, ''); // remove leading +
  cleaned = cleaned.replace(/\D/g, ''); // remove non-digits
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  } else if (cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('1') || cleaned.startsWith('8') || cleaned.startsWith('9'))) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
};
