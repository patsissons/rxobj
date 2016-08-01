import { Observable } from 'rxjs/Observable';
import { pausableBuffer, PausableBufferSignature } from './PausableBuffer';

Observable.prototype.pausableBuffer = pausableBuffer;

declare module '~rxjs/Observable' {
  interface Observable<T> {
    pausableBuffer: PausableBufferSignature<T>;
  }
}

