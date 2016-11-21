import { Observable } from 'rxjs/Observable';
import { toProperty, ToPropertySignature } from '../operators/ToProperty';

Observable.prototype.toProperty = toProperty;

declare module 'rxjs/Observable' {
  interface Observable<T> {
    toProperty: ToPropertySignature<T>;
  }
}
