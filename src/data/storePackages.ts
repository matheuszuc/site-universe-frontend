export function formatApAmount(amount: number) {
  return new Intl.NumberFormat('pt-BR').format(amount)
}

export function formatCurrencyFromCents(amountCents: number, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    currency,
    style: 'currency',
  }).format(amountCents / 100)
}
