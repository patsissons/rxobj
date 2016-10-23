import { ReactiveObject } from '../../ReactiveObject';
import { whenAnyObservable, whenAnyState, whenAnyValue, WhenAnyObservableSignature, WhenAnyStateSignature, WhenAnyValueSignature } from '../operators/WhenAny';

ReactiveObject.prototype.whenAnyObservable = <any>whenAnyObservable;
ReactiveObject.prototype.whenAnyState = <any>whenAnyState;
ReactiveObject.prototype.whenAnyValue = <any>whenAnyValue;

declare module '../../ReactiveObject' {
  interface ReactiveObject {
    whenAnyObservable: WhenAnyObservableSignature<this>;
    whenAnyState: WhenAnyStateSignature<this>;
    whenAnyValue: WhenAnyValueSignature<this>;
  }
}
