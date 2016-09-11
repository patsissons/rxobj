import { Subject, Subscription, Observable } from 'rxjs';
import { Subscribable } from 'rxjs/Observable';
import { Scheduler } from 'rxjs/Scheduler';
import { PartialObserver } from 'rxjs/Observer';
import { ReactiveApp } from './ReactiveApp';

export class SubjectScheduler<TValue> extends Subscription implements Subscribable<TValue> {
  constructor(protected scheduler: Scheduler, protected defaultObserverOrNext?: PartialObserver<TValue> | ((value: TValue) => void), protected subject = new Subject<TValue>()) {
    super();

    this.add(this.subject);

    if (this.defaultObserverOrNext != null) {
      this.defaultObserverSub = this.asObservable()
        .subscribe(defaultObserverOrNext, ReactiveApp.defaultErrorHandler.next);
    }
  }

  protected defaultObserverSub: Subscription;
  protected observerRefCount = 0;

  public next(value?: TValue) {
    this.subject.next(value);
  }

  public error(err: any) {
    this.subject.error(err);
  }

  public complete() {
    this.subject.complete();
  }

  public asObservable(): Observable<TValue> {
    return this.scheduler == null ?
      this.subject.asObservable() :
      this.subject.observeOn(this.scheduler);
  }

  public subscribe(observerOrNext?: PartialObserver<TValue> | ((value: TValue) => void), error: (error: any) => void = ReactiveApp.defaultErrorHandler.next, complete?: () => void) {
    if (this.defaultObserverSub != null) {
      this.defaultObserverSub.unsubscribe();
      this.defaultObserverSub = undefined;
    }

    ++this.observerRefCount;

    const sub = this.asObservable()
      .subscribe(observerOrNext, error, complete);

    sub.add(new Subscription(() => {
      if (--this.observerRefCount <= 0 && this.defaultObserverOrNext != null) {
        this.observerRefCount = 0;

        this.defaultObserverSub = this.asObservable()
          .subscribe(this.defaultObserverOrNext, ReactiveApp.defaultErrorHandler.next);
      }
    }));

    return sub;
  }
}
