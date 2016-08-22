import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import 'es6-shim';

import { Observable } from 'rxjs/Observable';
import { PartialObserver } from 'rxjs/Observer';
import { Subscription } from 'rxjs/Subscription';

declare module '~rxjs/Observable' {
  interface Observable<T> {
    mochaSubscribe(observerOrNext?: PartialObserver<T> | ((value: T) => void), done?: (error?: any) => any, error?: (error: any) => void, complete?: () => void): Subscription;
  }
}

function mochaSubscribe<T>(observerOrNext?: (value: T) => void, done?: (error?: any) => any, error?: (error: any) => void, complete?: () => void): Subscription {
  return (done == null) ?
    (this as Observable<T>).subscribe(observerOrNext, error, complete) :
    (this as Observable<T>).subscribe(x => {
      try {
        observerOrNext.apply(this, [ x ]);
      } catch (e) {
        done(e);
      }
    }, error, complete);
}

Observable.prototype.mochaSubscribe = mochaSubscribe;

chai.use(sinonChai);

beforeEach(() => {
  sandbox = sinon.sandbox.create();
});

afterEach(() => {
  sandbox.restore();
});

export const should = chai.should();

export let sandbox: Sinon.SinonSandbox;

export default should;
