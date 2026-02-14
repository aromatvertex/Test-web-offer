export const formatDate = (isoDate: string | undefined, locale: 'PL' | 'EN' = 'PL'): string => {
  if (!isoDate) return '';
  
  // Handle ISO string
  const dateStr = isoDate.includes('T') ? isoDate.substring(0, 10) : isoDate;
  
  if (dateStr.length === 10) {
    const [y, m, d] = dateStr.split('-');
    
    if (locale === 'PL') {
      return `${d}.${m}.${y}`;
    } else {
      return `${m}/${d}/${y}`;
    }
  }
  
  return isoDate;
};

export const formatCurrency = (
  value: number, 
  currency: string = 'EUR', 
  locale: 'PL' | 'EN' = 'PL'
): string => {
  const formatter = new Intl.NumberFormat(locale === 'PL' ? 'pl-PL' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return `${formatter.format(value)} ${currency}`;
};

export const formatWeight = (value: number, unit: string = 'kg'): string => {
  return `${value} ${unit}`;
};

export const parseBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const upper = value.toUpperCase();
    return upper !== 'FALSE' && upper !== '0' && upper !== '';
  }
  return Boolean(value);
};

export const generateTempId = (): string => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
