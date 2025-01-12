import { keys } from './configuration';

export class KeysConfiguration {
  keys: {
    key: string;
    rating: 1 | 2 | 3 | 4 | 5;
  }[] = [];

  constructor() {
    for (let i = 0; i < keys.length; i++) {
      this.keys.push({
        key: keys[i],
        rating: 1,
      });
    }
  }
}
