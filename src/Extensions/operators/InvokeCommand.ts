import { Observable, Subscription } from 'rxjs';
import { ReactiveCommand } from '../../ReactiveCommand';
import { ReactiveObject } from '../../ReactiveObject';

function invokeCommandFromObservable<TObj, TParam, TResult>(source: Observable<{ param: TParam, cmd: ReactiveCommand<TObj, TParam, TResult> }>) {
  return source
    // TODO: why is throttle typing so strange here???
    .throttle(x => x.cmd.canExecute.map(() => 0))
    .map(x => x.cmd.execute(x.param).catch(() => Observable.empty<TResult>()))
    .switch()
    .subscribe();
}

function invokeStaticCommand<TObj extends ReactiveObject, TParam, TResult>(source: Observable<TParam>, cmd: ReactiveCommand<TObj, TParam, TResult>) {
  return invokeCommandFromObservable(
    source
      .map(param => ({ param, cmd }))
  );
}

function invokeDynamicCommand<TObj extends ReactiveObject, TParam, TResult>(source: Observable<TParam>, owner: TObj, commandSelector: (obj: TObj, param: TParam) => ReactiveCommand<TObj, TParam, TResult>) {
  return invokeCommandFromObservable(
    source
      .map(param => ({ param, cmd: commandSelector(owner, param) }))
  );
}

export function invokeCommand<TObj extends ReactiveObject, TParam, TResult>(owner: TObj, command: ReactiveCommand<TObj, TParam, TResult> | ((obj: TObj, param: TParam) => ReactiveCommand<TObj, TParam, TResult>)) {
  const thisArg: Observable<TParam> = this;

  const sub = (command instanceof Function) ?
    invokeDynamicCommand(thisArg, owner, command) :
    invokeStaticCommand(thisArg, command);

  owner.add(sub);

  return sub;
}

export interface InvokeCommandSignature<TValue> {
  <TObj extends ReactiveObject, TResult>(owner: TObj, command: ReactiveCommand<TObj, TValue, TResult>): Subscription;
  <TObj extends ReactiveObject, TParam, TResult>(owner: TObj, commandSelector: (obj: TObj, param: TParam) => ReactiveCommand<TObj, TParam, TResult>): Subscription;
}
