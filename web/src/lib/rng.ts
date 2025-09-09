export class XorShift32 {
  private state: number;

  constructor(seed: number) {
    if (seed === 0) seed = 0x9e3779b9;
    this.state = seed >>> 0;
  }

  next(): number {
    // xorshift32
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    // Normalize to [0, 1)
    return (this.state >>> 0) / 0x1_0000_0000;
  }

  nextInt(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }
}

export function shuffleInPlace<T>(arr: T[], rng: XorShift32): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function pickOne<T>(arr: T[], rng: XorShift32): T {
  return arr[rng.nextInt(arr.length)];
}
