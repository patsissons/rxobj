import { should } from './setup';

import { Observable } from 'rxjs';
import { ReactiveObject, registerMember } from '../src/ReactiveObject';

describe('ReactiveObject', () => {
  class BasicReactiveObject extends ReactiveObject {
    public getMembers() { return this.members; }
  }

  describe('isReactive', () => {
    it('should be true for a reactive object instance', () => {
      const obj = new BasicReactiveObject();

      should.exist(obj.isReactive);
      obj.isReactive.should.be.true;
    });

    it('should not be true for a non-reactive object instance', () => {
      const obj: any = new Object();

      should.not.exist(obj.isReactive);
    });
  });

  describe('property', () => {
    class TestObject extends BasicReactiveObject {
      public valueProp = this.property<number>();
    }

    it('registers a member', () => {
      const obj = new TestObject();

      should.exist(obj.valueProp);
      obj.getMembers().length.should.eql(1);
      obj.getMembers()[0].should.eql(obj.valueProp);
    });

    it('can generate notifications from changing value properties', (done) => {
      const obj = new TestObject();

      obj.changing.subscribe(x => {
        should.exist(x);
        should.exist(x.source);
        should.exist(x.value);

        x.source.should.equal(obj);
        x.value.should.eql(obj.valueProp);
        x.value.name.should.eql('valueProp');

        done();
      });

      obj.valueProp.value = 1;
    });

    it('can generate notifications from changed value properties', (done) => {
      const obj = new TestObject();

      obj.changed.subscribe(x => {
        should.exist(x);
        should.exist(x.source);
        should.exist(x.value);

        x.source.should.equal(obj);
        x.value.should.eql(obj.valueProp);
        x.value.name.should.eql('valueProp');

        done();
      });

      obj.valueProp.value = 1;
    });
  });

  describe('command', () => {
    class TestObject extends BasicReactiveObject {
      public cmd = this.command((x: any) => Observable.of(true));
    }

    it('registers a member', () => {
      const obj = new TestObject();

      should.exist(obj.cmd);
      obj.getMembers().length.should.eql(1);
      obj.getMembers()[0].should.eql(obj.cmd);
    });

    it('can generate notifications from changing command properties', (done) => {
      const obj = new TestObject();

      obj.changing.subscribe(x => {
        should.exist(x);
        should.exist(x.source);
        should.exist(x.value);

        x.source.should.equal(obj);
        x.value.should.eql(obj.cmd);
        x.value.name.should.eql('cmd');

        done();
      });

      obj.cmd.executeNow();
    });

    it('can generate notifications from changed command properties', (done) => {
      const obj = new TestObject();

      obj.changed.subscribe(x => {
        should.exist(x);
        should.exist(x.source);
        should.exist(x.value);

        x.source.should.equal(obj);
        x.value.should.eql(obj.cmd);
        x.value.name.should.eql('cmd');

        done();
      });

      obj.cmd.executeNow();
    });
  });

  describe('list', () => {
    class TestObject extends BasicReactiveObject {
      public items = this.list<number>();
    }

    it('registers a member', () => {
      const obj = new TestObject();

      should.exist(obj.items);
      obj.getMembers().length.should.eql(1);
      obj.getMembers()[0].should.eql(obj.items);
    });

    it('can generate notifications from changing list properties', (done) => {
      const obj = new TestObject();

      obj.changing.subscribe(x => {
        should.exist(x);
        should.exist(x.source);
        should.exist(x.value);

        x.source.should.equal(obj);
        x.value.should.eql(obj.items);
        x.value.name.should.eql('items');

        done();
      });

      obj.items.push(1);
    });

    it('can generate notifications from changed list properties', (done) => {
      const obj = new TestObject();

      obj.changed.subscribe(x => {
        should.exist(x);
        should.exist(x.source);
        should.exist(x.value);

        x.source.should.equal(obj);
        x.value.should.eql(obj.items);
        x.value.name.should.eql('items');

        done();
      });

      obj.items.push(1);
    });
  });

  describe('thrownErrors', () => {
    it('emits thrown errors from registered members');
  });

  describe('value', () => {
    it('returns itself', () => {
      const obj = new BasicReactiveObject();

      should.exist(obj.value);
      obj.value.should.eql(obj);
    });
  });

  describe('registerMember', () => {
    it('assigns the member owner', () => {
      const obj = new BasicReactiveObject();
      const child = new BasicReactiveObject();

      should.not.exist(child.owner);
      registerMember(obj, child);

      should.exist(child.owner);
      child.owner.should.eql(obj);
    });
  });
});
