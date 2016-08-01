import { Subscriber, Scheduler } from 'rxjs';

// we need to import these to satify the compiler
// tslint:disable no-unused-variable
import { AsapScheduler } from 'rxjs/scheduler/AsapScheduler';
import { QueueScheduler } from 'rxjs/scheduler/QueueScheduler';
// tslint:enable no-unused-variable

// null scheduler is the old immediate scheduler
// queue scheduler is the old currentThread scheduler
// asap scheduler is the old default scheduler

// this is a really hacky way of detecting if we're running in the
// context of a unit test runner
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
  public static isUnitTestRunner = isInTestRunner();

  public static defaultErrorHandler = Subscriber.create<Error>(err => {
    // console.error is a reasonable default here
    // tslint:disable-next-line no-console
    console.error(err);
  });

  public static mainScheduler = ReactiveApp.createMainScheduler();

  private static createMainScheduler() {
    // NOTE: The queue scheduler is the currentThread scheduler
    // NOTE: The asap scheduler is the default scheduler
    return ReactiveApp.isUnitTestRunner ? Scheduler.queue : Scheduler.asap;
  }
}
