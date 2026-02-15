export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function randomChance(probability: number): boolean {
  return Math.random() < probability
}
