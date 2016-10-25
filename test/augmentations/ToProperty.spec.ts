import { should } from '../setup';

import { Observable } from 'rxjs';
import { ReactiveObject } from '../../src/ReactiveObject';
import '../../src/augmentations/add/ToProperty';

describe('ToProperty', () => {
  class TestObject extends ReactiveObject {
    public getMembers() { return this.members; }
  }

  it('registers a property member on the owning object', () => {
    const obj = new TestObject();
    const source = Observable.of(true);
    const prop = source.toProperty(obj);

    should.exist(prop);
    obj.getMembers().length.should.eql(1);
    obj.getMembers()[0].should.eql(prop);
  });

  it('sets the owner of the property member', () => {
    const obj = new TestObject();
    const source = Observable.of(true);
    const prop = source.toProperty(obj);

    should.exist(prop.owner);
    prop.owner.should.eql(obj);
  });
});
