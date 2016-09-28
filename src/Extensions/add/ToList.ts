import { toList, ToListSignature } from '../operators/ToList';

Array.prototype.toList = toList;

declare global {
  interface Array<T> {
    toList: ToListSignature<T>;
  }
}
