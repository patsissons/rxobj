import { Subscription, Observable, Subject } from 'rxjs';
import { Scheduler } from 'rxjs/Scheduler';
import { ReactiveApp } from './ReactiveApp';
import { SubjectScheduler } from './SubjectScheduler';

function dedup<T>(batch: T[]) {
  const result: T[] = [];
  let last: T = undefined;

  batch
    .forEach((x, i) => {
      if (i === 0 || x !== last) {
        result.push(x);
      }

      last = x;
    });

  return result;
}

export class ReactiveState<TValue> extends Subscription {
  constructor(scheduler?: Scheduler, errorScheduler?: Scheduler) {
    super();

    this.startDelayNotificationsSubject = new Subject<any>();
    this.changingSubject = new SubjectScheduler<TValue>(scheduler);
    this.changedSubject = new SubjectScheduler<TValue>(scheduler);
    this.thrownErrorsHandler = new SubjectScheduler<Error>(errorScheduler, ReactiveApp.defaultErrorHandler);

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

  private changeNotificationsSuppressed = 0;
  private changeNotificationsDelayed = 0;
  private startDelayNotificationsSubject: Subject<any>;

  protected changingSubject: SubjectScheduler<TValue>;
  protected changedSubject: SubjectScheduler<TValue>;

  protected thrownErrorsHandler: SubjectScheduler<Error>;
  protected changingObservable: Observable<TValue>;
  protected changedObservable: Observable<TValue>;

  protected notifyPropertyChanging(changing: () => TValue) {
    if (this.areChangeNotificationsEnabled() === false) {
      return;
    }

    this.notifyObservable(changing, this.changingSubject);
  }

  protected notifyPropertyChanged(changed: () => TValue) {
    if (this.areChangeNotificationsEnabled() === false) {
      return;
    }

    this.notifyObservable(changed, this.changedSubject);
  }

  protected notifyObservable(change: () => TValue, subject: SubjectScheduler<TValue>) {
    try {
      subject.next(change.apply(this));
    } catch (err) {
      this.thrownErrorsHandler.next(err);
    }
  }

  public get isReactive() {
    return true;
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
