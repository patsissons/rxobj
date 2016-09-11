import { should } from '../setup';

import { Observable, BehaviorSubject } from 'rxjs';
import { ReactiveObject } from '../../src/ReactiveObject';
import '../../src/Extensions/add/InvokeCommand';

describe('InvokeCommand', () => {
  class TestObject extends ReactiveObject {
    public cmd = this.command((x: boolean) => Observable.of(x));
  }

  it('invokes the provided command', () => {
    const obj = new TestObject();
    const source = Observable.of(true);
    const results = new BehaviorSubject<boolean>(undefined);

    obj.cmd.results.subscribe(results);
    const sub = source.invokeCommand(obj, obj.cmd);

    should.exist(sub);
    results.value.should.be.true;
  });
});
