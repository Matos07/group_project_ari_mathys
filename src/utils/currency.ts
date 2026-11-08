/**
 * Formats an integer amount in Thai satang (minor units) to formatted Thai Baht string.
 * Example: 5000000 -> "฿50,000.00", -70000 -> "-฿700.00", 0 -> "฿0.00"
 */
export function formatSatang(amountMinor: number): string {
  const isNegative = amountMinor < 0;
  const absVal = Math.abs(amountMinor);
  const baht = Math.floor(absVal / 100);
  const satang = absVal % 100;
  const formattedBaht = baht.toLocaleString('en-US');
  const formattedSatang = satang.toString().padStart(2, '0');
  return `${isNegative ? '-' : ''}฿${formattedBaht}.${formattedSatang}`;
}

