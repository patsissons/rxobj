import { Subject, Subscription } from 'rxjs';
import { Subscribable } from 'rxjs/Observable';
import { Scheduler } from 'rxjs/Scheduler';
import { PartialObserver } from 'rxjs/Observer';
import { ReactiveApp } from './ReactiveApp';

export class SubjectScheduler<T> extends Subscription implements Subscribable<T> {
  constructor(protected scheduler: Scheduler, protected defaultObserverOrNext?: PartialObserver<T> | ((value: T) => void), protected subject = new Subject<T>()) {
    super();

    this.add(this.subject);

    if (this.defaultObserverOrNext != null) {
      this.defaultObserverSub = this.getScheduledObservable()
        .subscribe(defaultObserverOrNext, ReactiveApp.defaultErrorHandler.next);
    }
  }

  protected defaultObserverSub: Subscription;
  protected observerRefCount = 0;

  public next(value?: T) {
    this.subject.next(value);
  }

  public error(err: any) {
    this.subject.error(err);
  }

  public complete() {
    this.subject.complete();
  }

  public getScheduledObservable() {
    return this.scheduler == null ?
      this.subject.asObservable() :
      this.subject.observeOn(this.scheduler);
  }

  public subscribe(observerOrNext: PartialObserver<T> | ((value: T) => void), error: (error: any) => void = ReactiveApp.defaultErrorHandler.next, complete?: () => void) {
    if (this.defaultObserverSub) {
      this.defaultObserverSub.unsubscribe();
      this.defaultObserverSub = undefined;
    }

    ++this.observerRefCount;

    const sub = this.getScheduledObservable()
      .subscribe(observerOrNext, error, complete);

    sub.add(new Subscription(() => {
      if (--this.observerRefCount <= 0 && this.defaultObserverOrNext != null) {
        this.observerRefCount = 0;

        this.defaultObserverSub = this.getScheduledObservable()
          .subscribe(this.defaultObserverOrNext, ReactiveApp.defaultErrorHandler.next);
      }
    }));

    return sub;
  }
}
