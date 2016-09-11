import { Observable } from 'rxjs';
import { PartialObserver } from 'rxjs/Observer';
import { Scheduler } from 'rxjs/Scheduler';
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

class ExecutionInfo<TParam, TResult> {
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

export class ReactiveCommand<TObj, TParam, TResult> extends ReactiveState<ReactiveEvent<ReactiveCommand<TObj, TParam, TResult>, ReactiveCommandEventValue<TParam, TResult>>> {
  constructor(public owner: TObj, protected executeAction: (param: TParam) => Observable<TResult>, canExecute: Observable<boolean> = Observable.of(true), scheduler?: Scheduler, errorScheduler?: Scheduler) {
    super(scheduler, errorScheduler);

    this.executionInfoSubject = new SubjectScheduler<ExecutionInfo<TParam, TResult>>(scheduler);

    this.isExecutingObservable = this.executionInfoSubject
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

    this.add(this.executionInfoSubject);
    this.add(this.canExecuteObservable.subscribe());

    this.add(
      this.executionInfoSubject
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
      this.executionInfoSubject
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

  private executionInfoSubject: SubjectScheduler<ExecutionInfo<TParam, TResult>>;
  private isExecutingObservable: Observable<boolean>;
  private canExecuteObservable: Observable<boolean>;

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
    try {
      return Observable
        .defer<TResult>(() => {
          this.executionInfoSubject.next(new ExecutionInfo<TParam, TResult>(ExecutionDemarcation.Begin, param));
          return Observable.empty<TResult>();
        })
        .concat<TResult>(Observable.defer(() => this.executeAction(param)))
        .do(
          x => {
            this.executionInfoSubject.next(new ExecutionInfo<TParam, TResult>(ExecutionDemarcation.EndWithResult, param, x));
          },
          undefined,
          () => {
            this.executionInfoSubject.next(new ExecutionInfo<TParam, TResult>(ExecutionDemarcation.Ended, param));
          }
        )
        .catch(err => {
          this.executionInfoSubject.next(new ExecutionInfo<TParam, TResult>(ExecutionDemarcation.EndWithError, param));
          this.thrownErrorsHandler.next(err);
          return Observable.throw<TResult>(err);
        })
        .publishLast()
        .refCount();
    }
    catch (err) {
      this.thrownErrorsHandler.next(err);
      return <Observable<TResult>>Observable.throw<TResult>(err);
    }
  }

  public executeNow(param?: TParam, observerOrNext?: PartialObserver<TResult> | ((value: TResult) => void), error?: (error: any) => void, complete?: () => void) {
    return this.execute(param)
      .subscribe(observerOrNext, error, complete);
  }
}
