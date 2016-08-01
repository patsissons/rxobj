import { Subscription, Observable, Subject } from 'rxjs';
import { Scheduler } from 'rxjs/Scheduler';
import { ReactiveApp } from './ReactiveApp';
import { SubjectScheduler } from './SubjectScheduler';

function dedup<T>(batch: T[]) {
  // TODO: implement
  return batch;
}

export class ReactiveState<T> extends Subscription {
  constructor(errorScheduler?: Scheduler) {
    super();

    this.startDelayNotificationsSubject = new Subject<any>();
    this.changingSubject = new Subject<T>();
    this.changedSubject = new Subject<T>();
    this.thrownErrorsHandler = new SubjectScheduler<Error>(errorScheduler, ReactiveApp.defaultErrorHandler);

    this.add(this.startDelayNotificationsSubject);
    this.add(this.changingSubject);
    this.add(this.changedSubject);
    this.add(this.thrownErrorsHandler);

    this.changingObservable = this.changingSubject
      .pausableBuffer(
        this.startDelayNotificationsSubject
          .map(() => this.areChangeNotificationsDelayed() === true),
        x => dedup(x)
      )
      .publish()
      .refCount();

    this.changedObservable = this.changedSubject
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

  protected changingSubject: Subject<T>;
  protected changedSubject: Subject<T>;

  protected thrownErrorsHandler: SubjectScheduler<Error>;
  protected changingObservable: Observable<T>;
  protected changedObservable: Observable<T>;

  protected notifyPropertyChanging(changing: () => T) {
    if (this.areChangeNotificationsEnabled() === false) {
      return;
    }

    this.notifyObservable(changing(), this.changingSubject);
  }

  protected notifyPropertyChanged(changed: () => T) {
    if (this.areChangeNotificationsEnabled() === false) {
      return;
    }

    this.notifyObservable(changed(), this.changedSubject);
  }

  protected notifyObservable(change: T, subject: Subject<T>) {
    try {
      subject.next(change);
    } catch (err) {
      this.thrownErrorsHandler.next(err);
    }
  }

  public get changing() {
    return this.changingObservable;
  }

  public get changed() {
    return this.changedObservable;
  }

  public get thrownErrors() {
    return this.thrownErrorsHandler
      .getScheduledObservable();
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
