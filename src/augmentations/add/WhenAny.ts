import { ReactiveObject } from '../../ReactiveObject';
import { whenAnyObservable, whenAnyState, whenAnyValue, WhenAnyObservableSignature, WhenAnyStateSignature, WhenAnyValueSignature } from '../operators/WhenAny';

ReactiveObject.prototype.whenAnyObservable = whenAnyObservable;
ReactiveObject.prototype.whenAnyState = whenAnyState;
ReactiveObject.prototype.whenAnyValue = whenAnyValue;

declare module '../../ReactiveObject' {
  interface ReactiveObject {
    whenAnyObservable: WhenAnyObservableSignature;
    whenAnyState: WhenAnyStateSignature;
    whenAnyValue: WhenAnyValueSignature;
  }
}

const whenAnyObservableFunction: WhenAnyObservableSignature = whenAnyObservable;
const whenAnyEventFunction: WhenAnyStateSignature = whenAnyState;
const whenAnyValueFunction: WhenAnyValueSignature = whenAnyValue;

export {
  whenAnyObservableFunction as whenAnyObservable,
  whenAnyEventFunction as whenAnyState,
  whenAnyValueFunction as whenAnyValue,
};
