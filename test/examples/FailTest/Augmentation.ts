import { BaseClass } from './BaseClass';

declare module './BaseClass' {
  interface BaseClass {
    testFunc: <T extends BaseClass, U>(thisArg: T, selector: (x: T) => U) => U;
  }
}

BaseClass.prototype.testFunc = <T, U>(thisArg: T, selector: (x: T) => U) => selector(thisArg);

class Test extends BaseClass {
  public testValue = 'test';

  constructor() {
    super();

    // this fails due to generic typing thinking x is a BaseClass
    // this.testFunc(this, x => x.testValue);

    // we can force the typing of x back to this to work around the issue
    this.testFunc(this, (x: this) => x.testValue);
  }
}
