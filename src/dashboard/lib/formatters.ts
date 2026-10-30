/**
 * Indian Number Formatting and Utility Functions
 * e.g., 1248500 -> ₹ 12,48,500
 */

export function formatINR(amount: number, showDecimals: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹ 0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formatted = '';
  if (showDecimals) {
    formatted = absAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    formatted = Math.round(absAmount).toLocaleString('en-IN');
  }

  return `${isNegative ? '-' : ''}₹ ${formatted}`;
}

export function formatNumberIN(num: number): string {
  if (isNaN(num) || num === null || num === undefined) {
    return '0';
  }
  return Math.round(num).toLocaleString('en-IN');
}

/**
 * Escape formula injection vulnerabilities for CSV export
 * Prevents Excel/Sheets execution of formulas starting with =, +, -, @
 */
export function sanitizeForCSV(value: any): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Escape internal double quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const headerLine = headers.map(h => sanitizeForCSV(h)).join(',');
  const rowLines = rows.map(row => row.map(cell => sanitizeForCSV(cell)).join(',')).join('\n');
  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + headerLine + '\n' + rowLines;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
