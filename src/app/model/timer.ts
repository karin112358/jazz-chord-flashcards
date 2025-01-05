export class Timer {
  private totalTicks = 0;
  private startTime: number | null = null;
  private currentTime: number | null = null;
  private timer: any | null = null;

  constructor(private interval: number, private callback: () => void) {
    this.interval = interval;
  }

  setInterval(interval: number): void {
    this.interval = interval;
  }

  getInterval(): number {
    return this.interval;
  }

  run(): void {
    this.currentTime = Date.now();
    if (!this.startTime) {
      this.startTime = this.currentTime;
    }

    this.callback();

    const nextTick =
      this.interval -
      (this.currentTime - (this.startTime + this.totalTicks * this.interval));

    this.totalTicks++;

    (function (i) {
      i.timer = setTimeout(function () {
        i.run();
      }, nextTick);
    })(this);
  }

  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
      this.currentTime = null;
      this.startTime = null;
      this.totalTicks = 0;
    }
  }
}
