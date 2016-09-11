import { Observable } from 'rxjs';
import { Scheduler } from 'rxjs/Scheduler';
import { ReactiveObject, ReactiveMemberContainer } from '../../ReactiveObject';
import { ReactiveProperty } from '../../ReactiveProperty';

export function toProperty<TObj extends ReactiveObject, TValue>(owner: TObj, initialValue?: TValue, scheduler?: Scheduler, errorScheduler?: Scheduler) {
  const thisArg: Observable<TValue> = this;

  const prop =  new ReactiveProperty(owner, initialValue, thisArg, scheduler, errorScheduler);

  (<ReactiveMemberContainer><any>owner).registerMember(prop);

  return prop;
}

export interface ToPropertySignature<TValue> {
  <TObj extends ReactiveObject>(owner: TObj, initialValue?: TValue, scheduler?: Scheduler, errorScheduler?: Scheduler): ReactiveProperty<TObj, TValue>;
}
