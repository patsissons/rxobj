import { Subscription, Observable, Subject } from 'rxjs';
import { Scheduler } from 'rxjs/Scheduler';
import { SubjectScheduler } from './SubjectScheduler';
import { ReactiveApp } from './ReactiveApp';
import { ReactiveEvent } from './ReactiveEvent';

export type AnyReactiveState = ReactiveState<any, any>;
export type AnyReactiveEvent = ReactiveEvent<AnyReactiveState, any>;

function dedup<T extends AnyReactiveEvent>(batch: T[] = []) {
  if (batch.length <= 1) {
    return batch;
  }

  const result: T[] = [];

  // we dedup ReactiveObject events different than other events
  if ((<AnyReactiveState>batch[0].value).isReactive) {
    const seen = <{ [ key: string ]: any }>{};

    // dedup based on the member name
    batch
      .forEach(x => {
        if (seen[x.source.name] == null) {
          seen[x.source.name] = x;
          result.push(x);
        }
      });
  }
  else {
    // result = batch;
    let last: T;

    // dedup based on the member value
    batch
      .forEach((x, i) => {
        if (i === 0) {
          result.push(x);
        }
        else if (x !== last) {
          result.push(x);
        }

        last = x;
      });
  }

  return result;
}

export class ReactiveState<TObject, TValue> extends Subscription {
  constructor(public owner?: TObject, scheduler?: Scheduler, errorScheduler?: Scheduler) {
    super();

    this.startDelayNotificationsSubject = new Subject<any>();
    this.changingSubject = new SubjectScheduler<ReactiveEvent<this, TValue>>(scheduler);
    this.changedSubject = new SubjectScheduler<ReactiveEvent<this, TValue>>(scheduler);
    this.thrownErrorsHandler = new SubjectScheduler<Error>(errorScheduler, ReactiveApp.defaultErrorHandler.next);

    this.add(this.startDelayNotificationsSubject);
    this.add(this.changingSubject);
    this.add(this.changedSubject);
    this.add(this.thrownErrorsHandler);

    this.changingObservable = this.changingSubject
      .asObservable()
      .pausableBuffer(
        this.startDelayNotificationsSubject
          .map(() => this.areChangeNotificationsDelayed() === true),
        x => dedup(x)
      )
      .publish()
      .refCount();

    this.changedObservable = this.changedSubject
      .asObservable()
      .pausableBuffer(
        this.startDelayNotificationsSubject
          .map(() => this.areChangeNotificationsDelayed() === true),
        x => dedup(x)
      )
      .publish()
      .refCount();
  }

  private objectName: string;

  private changeNotificationsSuppressed = 0;
  private changeNotificationsDelayed = 0;
  private startDelayNotificationsSubject: Subject<any>;

  protected changingSubject: SubjectScheduler<ReactiveEvent<this, TValue>>;
  protected changedSubject: SubjectScheduler<ReactiveEvent<this, TValue>>;

  protected thrownErrorsHandler: SubjectScheduler<Error>;
  protected changingObservable: Observable<ReactiveEvent<this, TValue>>;
  protected changedObservable: Observable<ReactiveEvent<this, TValue>>;

  protected notifyPropertyChanging(changing: () => ReactiveEvent<this, TValue>) {
    if (this.areChangeNotificationsEnabled() === false) {
      return;
    }

    this.notifyObservable(changing, this.changingSubject);
  }

  protected notifyPropertyChanged(changed: () => ReactiveEvent<this, TValue>) {
    if (this.areChangeNotificationsEnabled() === false) {
      return;
    }

    this.notifyObservable(changed, this.changedSubject);
  }

  protected notifyObservable(change: () => ReactiveEvent<this, TValue>, subject: SubjectScheduler<ReactiveEvent<this, TValue>>) {
    try {
      subject.next(change.apply(this));
    } catch (err) {
      this.thrownErrorsHandler.next(err);
    }
  }

  public get isReactive() {
    return true;
  }

  public get name() {
    return this.objectName;
  }

  public set name(value: string) {
    if (this.objectName == null) {
      this.objectName = value;
    }
    else {
      throw new Error(`ReactiveState Member Name already set: ${ this.objectName }`);
    }
  }

  public get changing() {
    return this.changingObservable;
  }

  public get changed() {
    return this.changedObservable;
  }

  public get thrownErrors() {
    return this.thrownErrorsHandler;
  }

  public areChangeNotificationsEnabled() {
    return this.changeNotificationsSuppressed === 0;
  }

  public areChangeNotificationsDelayed() {
    return this.changeNotificationsDelayed > 0;
  }

  // this function stops notifications from being queued until it is
  // unsubscribed
  public suppressChangeNotifications() {
    ++this.changeNotificationsSuppressed;

    return new Subscription(() => {
      --this.changeNotificationsSuppressed;
    });
  }

  // this function stops queued notifications from being processed until
  // it is unsubscribed (but new notifications can still be queued)
  public delayChangeNotifications() {
    ++this.changeNotificationsDelayed;

    if (this.changeNotificationsDelayed === 1) {
      this.startDelayNotificationsSubject.next(null);
    }

    return new Subscription(() => {
      --this.changeNotificationsDelayed;

      if (this.changeNotificationsDelayed === 0) {
        this.startDelayNotificationsSubject.next(null);
      }
    });
  }
}
