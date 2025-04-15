export const CURRENCIES = [
  { code: 'USD', name: 'Dólar estadounidense', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'Libra esterlina', symbol: '£' },
  { code: 'JPY', name: 'Yen japonés', symbol: '¥' },
  { code: 'CNY', name: 'Yuan chino', symbol: '¥' },
  { code: 'AUD', name: 'Dólar australiano', symbol: 'A$' },
  { code: 'CAD', name: 'Dólar canadiense', symbol: 'C$' },
  { code: 'CHF', name: 'Franco suizo', symbol: 'CHF' },
  { code: 'MXN', name: 'Peso mexicano', symbol: '$' },
  { code: 'BRL', name: 'Real brasileño', symbol: 'R$' },
  { code: 'ARS', name: 'Peso argentino', symbol: '$' },
  { code: 'CLP', name: 'Peso chileno', symbol: '$' },
  { code: 'COP', name: 'Peso colombiano', symbol: '$' },
  { code: 'PEN', name: 'Sol peruano', symbol: 'S/' },
  { code: 'UYU', name: 'Peso uruguayo', symbol: '$' }
] as const;

export type CurrencyCode = typeof CURRENCIES[number]['code']; 