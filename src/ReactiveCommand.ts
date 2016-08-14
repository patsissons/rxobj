import { Observable, BehaviorSubject } from 'rxjs';
import { Scheduler } from 'rxjs/Scheduler';
import { ReactiveEvent } from './ReactiveEvent';
import { ReactiveState } from './ReactiveState';

export interface ReactiveCommandEventValue<T> {
  param: any;
  result: T;
}

// NOTE: we don't type the parameter because it would mean that you would have
//       to always provide that type information when declaring a command, which
//       is undesirable.

export class ReactiveCommand<TObj, TResult> extends ReactiveState<ReactiveEvent<ReactiveCommand<TObj, TResult>, ReactiveCommandEventValue<TResult>>> {
  constructor(public owner: TObj, protected executeAction: (param: any) => TResult, canExecute?: Observable<boolean>, errorScheduler?: Scheduler) {
    super(errorScheduler);

    this.isExecutingSubject = new BehaviorSubject(false);

    this.add(this.isExecutingSubject);

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
          this.isExecutingSubject.next(false);
        }, this.thrownErrorsHandler.next)
    );
  }

  private isExecutingSubject: BehaviorSubject<boolean>;
  private canExecuteObservable: Observable<boolean>;

  public get isExecuting() {
    return this.isExecutingSubject
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

    this.isExecutingSubject.next(true);

    this.notifyPropertyChanging(() => new ReactiveEvent(this, { param, result: null }));
  }
}
