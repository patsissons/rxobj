import { Observable } from 'rxjs';
import { Scheduler } from 'rxjs/Scheduler';
import { ReactiveObject, ReactiveObjectType, registerMember } from '../../ReactiveObject';
import { ReactiveProperty } from '../../ReactiveProperty';

export function toProperty<TObj extends ReactiveObject, TValue>(owner: TObj, initialValue?: TValue, scheduler?: Scheduler, errorScheduler?: Scheduler) {
  const thisArg: Observable<TValue> = this;

  const prop =  new ReactiveProperty(owner, initialValue, thisArg, scheduler, errorScheduler);

  registerMember(owner, prop);

  return prop;
}

export interface ToPropertySignature<TValue> {
  <TObj extends ReactiveObjectType>(owner: TObj, initialValue?: TValue, scheduler?: Scheduler, errorScheduler?: Scheduler): ReactiveProperty<TObj, TValue>;
}
