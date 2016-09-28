import { should } from '../setup';

import { ReactiveObject } from '../../src/ReactiveObject';
import '../../src/augmentations/add/ToList';

describe('ToList', () => {
  class TestObject extends ReactiveObject {
    public getMembers() { return this.members; }
  }

  it('registers a list member on the owning object', () => {
    const obj = new TestObject();
    const source = <boolean[]>[];
    const list = source.toList(obj);

    should.exist(list);
    obj.getMembers().length.should.eql(1);
    obj.getMembers()[0].should.eql(list);
  });
});
