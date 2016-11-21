import { Observable } from 'rxjs/Observable';
import { invokeCommand, InvokeCommandSignature } from '../operators/InvokeCommand';

Observable.prototype.invokeCommand = invokeCommand;

declare module 'rxjs/Observable' {
  interface Observable<T> {
    invokeCommand: InvokeCommandSignature<T>;
  }
}
