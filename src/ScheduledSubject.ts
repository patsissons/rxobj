import { Subject, Subscription, Subscriber, Observable } from 'rxjs';
import { Scheduler } from 'rxjs/Scheduler';
import { PartialObserver } from 'rxjs/Observer';
import { ObserveOnSubscriber } from 'rxjs/operator/observeOn';

export class ScheduledSubject<TValue> extends Subject<TValue> {
  protected defaultObserverSub = Subscription.EMPTY;
  protected observerRefCount = 0;

  constructor(protected scheduler?: Scheduler, protected defaultObserverOrNext?: PartialObserver<TValue> | ((value: TValue) => void)) {
    super();

    if (defaultObserverOrNext != null) {
      this.defaultObserverSub = this.subscribeOnScheduler(new Subscriber(this.defaultObserverOrNext));
    }
  }

  // private observeOnScheduler() {
  //   let obs = <Observable<TValue>>this;

  //   if (this.scheduler != null) {
  //     obs = obs.observeOn(this.scheduler);
  //   }

  //   return obs;
  // }

  private subscribeOnScheduler(subscriber: Subscriber<TValue>) {
    // const observable = this
    //   .observeOnScheduler();

    // if (observable === this) {
    //   return super._subscribe(subscriber);
    // }
    // else {
    //   return observable.subscribe(subscriber);
    // }

    return this.scheduler == null ?
      super._subscribe(subscriber) :
      // super.observeOn(this.scheduler).subscribe(subscriber);
      super._subscribe(new ObserveOnSubscriber(subscriber, this.scheduler, 0));
  }

  _subscribe(subscriber?: Subscriber<TValue>) {
    debugger;
    if (this.defaultObserverSub != null) {
      this.defaultObserverSub.unsubscribe();

      this.defaultObserverSub = Subscriber.EMPTY;
    }

    ++this.observerRefCount;

    return this
      .subscribeOnScheduler(subscriber)
      .add(() => {
        debugger;
        if (--this.observerRefCount <= 0) {
          this.observerRefCount = 0;

          if (this.defaultObserverOrNext != null) {
            this.defaultObserverSub = this.subscribeOnScheduler(new Subscriber(this.defaultObserverOrNext));
          }
        }
      });
  }

  // _subscribe(subscriber: Subscriber<TValue>) {
  //   debugger;
  //   if ((<any>subscriber).destination === this) {
  //     return super._subscribe(subscriber);
  //   }

  //   if (this.defaultObserverSub != null) {
  //     this.defaultObserverSub.unsubscribe();

  //     this.defaultObserverSub = Subscriber.EMPTY;
  //   }

  //   ++this.observerRefCount;

  //   return this
  //     .subscribeOnScheduler(subscriber)
  //     .add(() => {
  //       if (--this.observerRefCount <= 0) {
  //         this.observerRefCount = 0;

  //         if (this.defaultObserverOrNext != null) {
  //           this.defaultObserverSub = this.subscribeOnScheduler(new Subscriber(this.defaultObserverOrNext));
  //         }
  //       }
  //     });
  // }
}
