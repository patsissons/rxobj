import { Observable, Subscription } from 'rxjs';
import { ReactiveCommand } from '../../ReactiveCommand';
import { ReactiveObject } from '../../ReactiveObject';

export function invokeCommand<TObj extends ReactiveObject, TValue, TResult>(owner: TObj, command: ReactiveCommand<TObj, TValue, TResult>) {
  const thisArg: Observable<TValue> = this;

  const sub = thisArg
    // TODO: why is throttle typing so strange here???
    .throttle(x => command.canExecute.map(() => 0))
    .map(x => command.execute(x).catch(() => Observable.empty<TResult>()))
    .switch()
    .subscribe();

  owner.add(sub);

  return sub;
}

export interface InvokeCommandSignature<TValue> {
  <TObj extends ReactiveObject, TResult>(owner: TObj, command: ReactiveCommand<TObj, TValue, TResult>): Subscription;
}
