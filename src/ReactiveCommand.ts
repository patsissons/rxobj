import { Observable, BehaviorSubject } from 'rxjs';
import { Scheduler } from 'rxjs/Scheduler';
import { ReactiveEvent } from './ReactiveEvent';
import { ReactiveState } from './ReactiveState';
import { SubjectScheduler } from './SubjectScheduler';

export interface ReactiveCommandEventValue<T> {
  param: any;
  result: T;
}

// NOTE: we don't type the parameter because it would mean that you would have
//       to always provide that type information when declaring a command, which
//       is undesirable.

export class ReactiveCommand<TObj, TResult> extends ReactiveState<ReactiveEvent<ReactiveCommand<TObj, TResult>, ReactiveCommandEventValue<TResult>>> {
  constructor(public owner: TObj, protected executeAction: (param: any) => TResult, canExecute?: Observable<boolean>, scheduler?: Scheduler, errorScheduler?: Scheduler) {
    super(errorScheduler);

    this.isExecutingSubject = new BehaviorSubject(false);
    this.isExecutingScheduledSubject = new SubjectScheduler(scheduler, undefined, this.isExecutingSubject);

    this.add(this.isExecutingScheduledSubject);

    if (canExecute == null) {
      canExecute = Observable.of(true);
    }

    this.canExecuteObservable = Observable
      .combineLatest(this.isExecuting, canExecute, (ie, ce) => ie === false && ce);

    this.add(
      this.changing
        .subscribe(x => {
          this.notifyPropertyChanged(() => new ReactiveEvent(this, {
            param: x.value.param,
            result: this.executeAction.apply(this, [ x.value.param ]),
          }));
        }, this.thrownErrorsHandler.next)
    );

    this.add(
      this.changed
        .subscribe(x => {
          this.isExecutingScheduledSubject.next(false);
        }, this.thrownErrorsHandler.next)
    );
  }

  private isExecutingSubject: BehaviorSubject<boolean>;
  private isExecutingScheduledSubject: SubjectScheduler<boolean>;
  private canExecuteObservable: Observable<boolean>;

  public get isExecuting() {
    return this.isExecutingScheduledSubject
      .asObservable();
  }

  public get results() {
    return this.changed
      .filter(x => x != null && x.value != null)
      .map(x => x.value.result);
  }

  public get canExecute() {
    return this.canExecuteObservable;
  }

  public execute(param?: any) {
    if (this.isExecutingSubject.value === true) {
      throw 'Command Execution is Already in Progress';
    }

    this.isExecutingScheduledSubject.next(true);

    this.notifyPropertyChanging(() => new ReactiveEvent(this, { param, result: null }));
  }
}
