import { Subscriber, Scheduler as Schedulers } from 'rxjs';
import { Scheduler } from 'rxjs/Scheduler';

import { Lazy } from './Lazy';

// this is a really hacky way of detecting if we're running in the
// context of a unit test runner
// istanbul ignore next
function isInTestRunner(g: any = global, w?: any) {
  if (w == null) {
    w = g.window;
  }

  return (
    (
      g != null && (
        g.isUnitTestRunner === true ||
        typeof g.it === 'function' ||
        typeof g.chai === 'function' ||
        typeof g.sinon === 'function'
      )
    ) || (
      w != null && (
        w.isUnitTestRunner === true ||
        typeof w.jasmine !== 'undefined' ||
        typeof w.getJasmineRequireObj === 'function'
      )
    )
  );
}

export class ReactiveApp {
  // if you're running a unit test, set this to true
  public static isUnitTestRunner = new Lazy(() => isInTestRunner(), true);

  public static defaultErrorHandler = Subscriber.create<Error>(err => {
    // console.error is a reasonable default here
    // tslint:disable-next-line no-console
    console.error(err);
  });

  public static mainScheduler = new Lazy(() => ReactiveApp.createMainScheduler(), true);

  private static createMainScheduler(): Scheduler {
    // null scheduler is the old immediate scheduler
    // queue scheduler is the old currentThread scheduler
    return ReactiveApp.isUnitTestRunner.value === true ? null : Schedulers.queue;
  }
}
