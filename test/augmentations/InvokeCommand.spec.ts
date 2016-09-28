import { should } from '../setup';

import { Observable, BehaviorSubject } from 'rxjs';
import { ReactiveObject } from '../../src/ReactiveObject';
import '../../src/augmentations/add/InvokeCommand';

describe('InvokeCommand', () => {
  class TestObject extends ReactiveObject {
    public cmd1 = this.command((x: boolean) => Observable.of(x));
    public cmd2 = this.command((x: boolean) => Observable.of(x));
  }

  it('invokes the provided command', () => {
    const obj = new TestObject();
    const source = Observable.of(true);
    const results = new BehaviorSubject<boolean>(undefined);

    obj.cmd1.results.subscribe(results);
    const sub = source.invokeCommand(obj, obj.cmd1);

    should.exist(sub);
    results.value.should.be.true;
  });

  it('catches errors from execution', () => {
    const error = new Error('testing');

    class ErrorObject extends ReactiveObject {
      public cmd = this.command((x: boolean) => {
        if (x === true) {
          throw error;
        }

        return Observable.of(true);
      });
    }

    const obj = new ErrorObject();
    const source = Observable.of(true);
    const results = new BehaviorSubject<boolean>(undefined);
    const errors = new BehaviorSubject<Error>(undefined);

    obj.cmd.results.subscribe(results);
    obj.cmd.thrownErrors.subscribe(errors);

    source.invokeCommand(obj, obj.cmd);

    should.not.exist(results.value);
    should.exist(errors.value);
    errors.value.should.eql(error);
  });

  it('can invoke a dynamic command', () => {
    const obj = new TestObject();
    const source = Observable.of(true);
    const results = new BehaviorSubject<boolean>(undefined);

    obj.cmd1.results.subscribe(results);
    const sub = source.invokeCommand(obj, x => x.cmd1);

    should.exist(sub);
    results.value.should.be.true;
  });

  it('can invoke a dynamic command based on the execution parameter', () => {
    const obj = new TestObject();
    const source = Observable.of(true, false);
    const results1 = new BehaviorSubject<boolean>(undefined);
    const results2 = new BehaviorSubject<boolean>(undefined);

    obj.cmd1.results.subscribe(results1);
    obj.cmd2.results.subscribe(results2);
    const sub = source.invokeCommand(obj, (x, p) => p ? x.cmd1 : x.cmd2);

    should.exist(sub);
    results1.value.should.be.true;
    results2.value.should.be.false;
  });
});
