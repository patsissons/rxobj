import { Observable } from 'rxjs';
import { PartialObserver } from 'rxjs/Observer';
import { Scheduler } from 'rxjs/Scheduler';
import { Subscription } from 'rxjs/Subscription';
import { ReactiveEvent } from './ReactiveEvent';
import { ReactiveState } from './ReactiveState';
import { SubjectScheduler } from './SubjectScheduler';

export interface ReactiveCommandEventValue<TParam, TResult> {
  param: TParam;
  result: TResult;
}

enum ExecutionDemarcation {
  Begin,
  EndWithResult,
  EndWithError,
  Ended,
}

class ExecutionState<TParam, TResult> {
  constructor(private demarcationValue: ExecutionDemarcation, private paramValue?: TParam, private resultValue?: TResult) {
  }

  public get demarcation() {
    return this.demarcationValue;
  }

  public get param() {
    return this.paramValue;
  }

  public get result() {
    return this.resultValue;
  }
}

export class ReactiveCommand<TObject, TParam, TResult> extends ReactiveState<TObject, TResult, ReactiveCommandEventValue<TParam, TResult>> {
  constructor(owner: TObject, protected executeAction: (param: TParam) => Observable<TResult>, canExecute: Observable<boolean> = Observable.of(true), scheduler?: Scheduler, errorScheduler?: Scheduler) {
    super(owner, scheduler, errorScheduler);

    this.executionStateSubject = new SubjectScheduler<ExecutionState<TParam, TResult>>(scheduler);

    this.isExecutingObservable = this.executionStateSubject
      .asObservable()
      .map(x => x.demarcation === ExecutionDemarcation.Begin)
      .startWith(false)
      .distinctUntilChanged()
      .publishReplay(1)
      .refCount();

    this.canExecuteObservable = canExecute
      .catch(e => {
        this.thrownErrorsHandler.next(e);
        return Observable.of(false);
      })
      .startWith(false)
      .combineLatest(this.isExecutingObservable, (canEx, isEx) => canEx === true && isEx === false)
      .distinctUntilChanged()
      .publishReplay(1)
      .refCount();

    this.add(this.executionStateSubject);
    this.add(this.canExecuteObservable.subscribe());

    this.add(
      this.executionStateSubject
        .asObservable()
        .filter(x => x.demarcation === ExecutionDemarcation.Begin)
        .map(x => new ReactiveEvent(this, <ReactiveCommandEventValue<TParam, TResult>>{
          param: x.param,
        }))
        .subscribe(x => {
          this.notifyPropertyChanging(() => x);
        }, this.thrownErrorsHandler.next)
    );

    this.add(
      this.executionStateSubject
        .asObservable()
        .filter(x => x.demarcation === ExecutionDemarcation.EndWithResult)
        .map(x => new ReactiveEvent(this, <ReactiveCommandEventValue<TParam, TResult>>{
          param: x.param,
          result: x.result,
        }))
        .subscribe(x => {
          this.notifyPropertyChanged(() => x);
        }, this.thrownErrorsHandler.next)
    );
  }

  private executionStateSubject: SubjectScheduler<ExecutionState<TParam, TResult>>;
  private isExecutingObservable: Observable<boolean>;
  private canExecuteObservable: Observable<boolean>;

  protected getCurrentValue() {
    return this.lastEvent == null ? null : this.lastEvent.result;
  }

  public get canExecute() {
    return this.canExecuteObservable;
  }

  public get isExecuting() {
    return this.isExecutingObservable;
  }

  public get results() {
    return this.changed
      .filter(x => x != null && x.value != null)
      .map(x => x.value.result);
  }

  public execute(param?: TParam) {
    return Observable
      .defer<TResult>(() => {
        this.executionStateSubject.next(new ExecutionState<TParam, TResult>(ExecutionDemarcation.Begin, param));
        return Observable.empty<TResult>();
      })
      .concat<TResult>(Observable.defer(() => this.executeAction(param)))
      .do(
        (x: TResult) => {
          this.executionStateSubject.next(new ExecutionState<TParam, TResult>(ExecutionDemarcation.EndWithResult, param, x));
        },
        undefined,
        () => {
          this.executionStateSubject.next(new ExecutionState<TParam, TResult>(ExecutionDemarcation.Ended, param));
        }
      )
      .catch(err => {
        this.executionStateSubject.next(new ExecutionState<TParam, TResult>(ExecutionDemarcation.EndWithError, param));
        this.thrownErrorsHandler.next(err);
        return Observable.throw<TResult>(err);
      })
      .publishLast()
      .refCount();
  }

  public executeNow(param?: TParam, observerOrNext?: PartialObserver<TResult> | ((value: TResult) => void), error?: (error: any) => void, complete?: () => void): Subscription {
    const obs = this.execute(param);

    return <Subscription>obs
      .subscribe
      .apply(obs, [ observerOrNext, error, complete ]);
  }
}
