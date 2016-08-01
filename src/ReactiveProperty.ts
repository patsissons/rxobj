import { Observable, Scheduler as Schedulers } from 'rxjs';
import { Scheduler } from 'rxjs/Scheduler';
import { SubjectScheduler } from './SubjectScheduler';
import { ReactiveEvent } from './ReactiveEvent';
import { ReactiveState } from './ReactiveState';

// we need to import this to satify the compiler
// tslint:disable-next-line no-unused-variable
import { QueueScheduler } from 'rxjs/scheduler/QueueScheduler';

export abstract class ReactiveProperty<TObj, T> extends ReactiveState<ReactiveEvent<ReactiveProperty<TObj, T>, T>> {
  constructor(public owner: TObj, initialValue?: T, errorScheduler?: Scheduler) {
    super(errorScheduler);

    this.currentValue = initialValue;
  }

  protected currentValue: T;

  protected initialize(source: Observable<T>) {
    const sourceSubscription = source
      .distinctUntilChanged()
      .subscribe(x => {
        this.notifyPropertyChanging(() => new ReactiveEvent(this, x));

        this.currentValue = x;

        this.notifyPropertyChanged(() => new ReactiveEvent(this, this.currentValue));
      }, this.thrownErrorsHandler.next);

    this.add(sourceSubscription);
  }

  public get value() {
    return this.currentValue;
  }
}

export class ReactiveStreamProperty<TObj, T> extends ReactiveProperty<TObj, T> {
  constructor(public source: Observable<T>, owner: TObj, initialValue?: T, errorScheduler?: Scheduler) {
    super(owner, initialValue, errorScheduler);

    this.initialize(source);
  }
}

export class ReactiveValueProperty<TObj, T> extends ReactiveProperty<TObj, T> {
  constructor(owner: TObj, initialValue?: T, scheduler = Schedulers.queue, errorScheduler?: Scheduler) {
    super(owner, initialValue, errorScheduler);

    this.valueHandler = new SubjectScheduler<T>(scheduler);

    this.add(this.valueHandler);

    this.initialize(this.valueHandler.getScheduledObservable());
  }

  protected valueHandler: SubjectScheduler<T>;

  public get source() {
    return this.valueHandler.getScheduledObservable();
  }

  public get value() {
    return this.currentValue;
  }

  public set value(value: T) {
    this.valueHandler.next(value);
  }
}
