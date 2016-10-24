import { Subject, AnonymousSubject, Subscription, Subscriber } from 'rxjs';
import { Scheduler } from 'rxjs/Scheduler';
import { PartialObserver } from 'rxjs/Observer';

import { ReactiveApp } from './ReactiveApp';

export class ScheduledSubject<TValue> extends AnonymousSubject<TValue> {
  protected defaultObserverSub: Subscription;
  protected observerRefCount = 0;

  constructor(protected scheduler: Scheduler, protected defaultObserverOrNext?: PartialObserver<TValue> | ((value: TValue) => void), protected subject = new Subject<TValue>()) {
    super(subject);

    if (defaultObserverOrNext != null) {
      this.defaultObserverSub = this
        .observeOnScheduler()
        .subscribe(this.getSubscriber(this.defaultObserverOrNext));
    }
  }

  private observeOnScheduler() {
    let obs = this.subject.asObservable();

    if (this.scheduler != null) {
      obs = obs.observeOn(this.scheduler);
    }

    return obs;
  }

  private getSubscriber(observerOrNext?: PartialObserver<TValue> | ((value: TValue) => void)) {
    const subscriber = new Subscriber(observerOrNext);

    if (subscriber.error == null) {
      subscriber.error = ReactiveApp.defaultErrorHandler.next;
    }

    return subscriber;
  }

  unsubscribe() {
    super.unsubscribe();

    this.subject.unsubscribe();
  }

  _subscribe(subscriber: Subscriber<TValue>) {
    if (this.defaultObserverSub != null) {
      this.defaultObserverSub.unsubscribe();
      this.defaultObserverSub = undefined;
    }

    ++this.observerRefCount;

    const sub = this
      .observeOnScheduler()
      .subscribe(subscriber);

    sub.add(
      new Subscription(() => {
        if (--this.observerRefCount <= 0 && this.defaultObserverOrNext != null) {
          this.observerRefCount = 0;

          this.defaultObserverSub = this
            .observeOnScheduler()
            .subscribe(this.getSubscriber(this.defaultObserverOrNext));
        }
      })
    );

    return sub;
  }
}
