import { Scheduler } from 'rxjs/Scheduler';
import { ReactiveObject, ReactiveMemberContainer } from '../../ReactiveObject';
import { ReactiveList } from '../../ReactiveList';

export function toList<TObj extends ReactiveObject, TValue>(owner: TObj, scheduler?: Scheduler, errorScheduler?: Scheduler) {
  const thisArg: Array<TValue> = this;

  const list = new ReactiveList(owner, thisArg, scheduler, errorScheduler);

  (<ReactiveMemberContainer><any>owner).registerMember(list);

  return list;
}

export interface ToListSignature<TValue> {
  <TObj extends ReactiveObject>(owner: TObj, scheduler?: Scheduler, errorScheduler?: Scheduler): ReactiveList<TObj, TValue>;
}
