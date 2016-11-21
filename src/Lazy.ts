export class Lazy<T> {
  private initializedValue: T;

  constructor(private initializer: () => T = () => null, private transient = false) {
  }

  public get value() {
    return this.transient ? this.initializer() :
      this.initializedValue || (this.initializedValue = this.initializer());
  }
}
