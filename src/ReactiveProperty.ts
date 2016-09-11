import { Observable, Subject } from 'rxjs';
import { Scheduler } from 'rxjs/Scheduler';
import { ReactiveEvent } from './ReactiveEvent';
import { ReactiveState } from './ReactiveState';

export class ReactiveProperty<TObj, TValue> extends ReactiveState<ReactiveEvent<ReactiveProperty<TObj, TValue>, TValue>> {
  constructor(public owner: TObj, initialValue?: TValue, protected source: Observable<TValue> = new Subject<TValue>(), scheduler?: Scheduler, errorScheduler?: Scheduler) {
    super(scheduler, errorScheduler);

    if (source instanceof Subject) {
      this.add(<Subject<TValue>>source);

      this.canWrite = true;
    } else {
      this.canWrite = false;
    }

    this.add(source
      .distinctUntilChanged()
      .subscribe(x => {
        this.notifyPropertyChanging(() => new ReactiveEvent(this, x));

        this.currentValue = x;

        this.notifyPropertyChanged(() => new ReactiveEvent(this, this.currentValue));
      }, this.thrownErrorsHandler.next)
    );

    this.currentValue = initialValue;
  }

  protected currentValue: TValue;
  protected canWrite: boolean;

  public get value() {
    return this.currentValue;
  }

  public set value(value: TValue) {
    if (this.canWrite) {
      (<Subject<TValue>>this.source).next(value);
    } else {
      this.thrownErrorsHandler.next(new Error('Cannot Modify Read Only Property'));
    }
  }
}
