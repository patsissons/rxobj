import { Observable, Subject } from 'rxjs';
import { Scheduler } from 'rxjs/Scheduler';

import { ReactiveEvent } from './ReactiveEvent';
import { ReactiveState } from './ReactiveState';

export interface ReactivePropertyEventValue<TValue> {
  oldValue: TValue;
  newValue: TValue;
}

export class ReactiveProperty<TObject, TValue> extends ReactiveState<TObject, TValue, ReactivePropertyEventValue<TValue>> {
  constructor(owner: TObject, initialValue?: TValue, protected source: Observable<TValue> = new Subject<TValue>(), scheduler?: Scheduler, errorScheduler?: Scheduler) {
    super(owner, scheduler, errorScheduler);

    if (source instanceof Subject) {
      this.add(<Subject<TValue>>source);

      this.canWrite = true;
    } else {
      this.canWrite = false;
    }

    if (initialValue != null) {
      source = source.startWith(initialValue);
    }

    this.add(source
      .distinctUntilChanged()
      .subscribe(newValue => {
        const oldValue = this.value;
        this.notifyPropertyChanging(() => new ReactiveEvent(this, <ReactivePropertyEventValue<TValue>>{
          oldValue,
          newValue,
        }));

        this.notifyPropertyChanged(() => new ReactiveEvent(this, <ReactivePropertyEventValue<TValue>>{
          oldValue,
          newValue,
        }));
      }, err => this.thrownErrorsHandler.next(err))
    );
  }

  protected canWrite: boolean;

  protected getCurrentValue() {
    return this.lastEvent == null ? null : this.lastEvent.newValue;
  }

  public get value() {
    return this.getCurrentValue();
  }

  public set value(value: TValue) {
    if (this.canWrite) {
      (<Subject<TValue>>this.source).next(value);
    } else {
      this.thrownErrorsHandler.next(new Error('Cannot Modify Read Only Property'));
    }
  }
}
