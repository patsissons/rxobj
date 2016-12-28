import { Observable } from 'rxjs/Observable';

import { pausableBuffer, PausableBufferSignature } from '../operators/PausableBuffer';

Observable.prototype.pausableBuffer = pausableBuffer;

declare module 'rxjs/Observable' {
  interface Observable<T> {
    pausableBuffer: PausableBufferSignature<T>;
  }
}
