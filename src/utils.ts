/**
 * Formats a number into Indonesian Rupiah currency format.
 */
export const formatRupiah = (num: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Formats a YYYY-MM-DD date string into Indonesian readable format.
 * e.g., "2026-06-10" -> "10 Jun 2026"
 */
export const formatReadableDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  } catch {
    return dateStr;
  }
};

/**
 * Lists the last 12 months for select filter options.
 * e.g., Array of { value: "2026-06", label: "Juni 2026" }
 */
export const getLast12Months = () => {
  const months = [];
  const currentDate = new Date();
  const indonesianMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  for (let i = 0; i < 12; i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthVal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = `${indonesianMonths[d.getMonth()]} ${d.getFullYear()}`;
    months.push({ value: monthVal, label: monthLabel });
  }

  return months;
};
