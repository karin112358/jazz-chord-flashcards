/**
 * How the next key is chosen:
 * - 'R': random, keys with a low rating come up more often
 * - 'WC': weighted cycle, a key with rating r comes up in every r-th cycle
 * - '5' / '-5': up or down a perfect fourth (5 half steps), starting on C
 */
export type KeyOrder = 'R' | 'WC' | '5' | '-5';

export const KEY_ORDERS: readonly { readonly key: KeyOrder; readonly name: string; readonly description: string }[] = [
  { key: 'R', name: 'Random', description: 'Keys appear in a completely random order.' },
  {
    key: 'WC',
    name: 'Weighted Cycle',
    description: 'Keys appear in cycles; ratings determine how often a key occurs per cycle.',
  },
  { key: '5', name: 'Perfect 4th up', description: 'Keys progress by ascending perfect fourths.' },
  { key: '-5', name: 'Perfect 4th down', description: 'Keys progress by descending perfect fourths.' },
];

export function isKeyOrder(value: string): value is KeyOrder {
  return KEY_ORDERS.some((order) => order.key === value);
}
