export function formatMoney(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (Math.abs(amount) >= 1_000) return `$${Math.round(amount / 1_000)}K`
  return `$${amount}`
}
