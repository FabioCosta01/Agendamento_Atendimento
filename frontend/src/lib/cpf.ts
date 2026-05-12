export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

export function getCPFCheckDigits(base9: string): string | null {
  const base = base9.replace(/\D/g, '');

  if (base.length !== 9) return null;
  if (/^(\d)\1{8}$/.test(base)) return null;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(base[i]) * (10 - i);
  }

  let firstDigit = (sum * 10) % 11;
  if (firstDigit === 10) firstDigit = 0;

  const base10 = base + String(firstDigit);

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(base10[i]) * (11 - i);
  }

  let secondDigit = (sum * 10) % 11;
  if (secondDigit === 10) secondDigit = 0;

  return `${firstDigit}${secondDigit}`;
}

export function validateCPFProgress(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 0) return '';

  if (/^(\d)\1+$/.test(digits) && digits.length >= 3) {
    return 'CPF inválido. Digite um CPF válido.';
  }

  if (digits.length < 10) return '';

  const base9 = digits.slice(0, 9);
  const expectedDigits = getCPFCheckDigits(base9);

  if (!expectedDigits) {
    return 'CPF inválido. Digite um CPF válido.';
  }

  if (digits.length >= 10 && digits[9] !== expectedDigits[0]) {
    return 'CPF inválido. Digite um CPF válido.';
  }

  if (digits.length >= 11 && digits[10] !== expectedDigits[1]) {
    return 'CPF inválido. Digite um CPF válido.';
  }

  return '';
}

export function isValidCPF(value: string): boolean {
  const digits = value.replace(/\D/g, '');

  return digits.length === 11 && validateCPFProgress(value) === '';
}
