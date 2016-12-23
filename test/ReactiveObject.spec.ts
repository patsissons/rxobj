import { should } from './setup';

import { Observable, Subject, BehaviorSubject } from 'rxjs';
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
    class TestObject extends BasicReactiveObject {
      public valueProp = this.property<number>();
    }

    it.only('emits thrown errors from registered members', () => {
      const obj = new TestObject();
      const result = new BehaviorSubject<any>(null);
      obj.changed.subscribe(x => {
        if (x.value.value === 1) {
          throw 'testing';
        }
      });

      obj.thrownErrors.subscribe(result);

      should.not.exist(result.value);

      obj.valueProp.value = 0;
      should.not.exist(result.value);

      obj.valueProp.value = 1;
      should.exist(result.value);
      result.value.should.eql('testing');
    });
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

  describe('name', () => {
    it('can only be set once', () => {
      const obj = new BasicReactiveObject();

      obj.name = 'asdf';
      should.throw(() => { obj.name = 'asdf2'; });
    });
  });

  describe('delayChangeNotifications', () => {
    class TestObject extends BasicReactiveObject {
      public prop1 = this.property<number>();
      public prop2 = this.property<number>();
    }

    it('de-duplicates member changing events by name', () => {
      const obj = new TestObject();
      const subject = new BehaviorSubject<string[]>(null);
      const end = new Subject();

      obj.changing
        .map(x => x.value.name)
        .takeUntil(end)
        .toArray()
        .subscribe(subject);

      Observable.using(
        () => obj.delayChangeNotifications(),
        x => {
          obj.prop1.value = 1;
          obj.prop1.value = 2;
          obj.prop2.value = 3;
          obj.prop2.value = 4;
          obj.prop2.value = 5;
          obj.prop1.value = 6;

          return Observable.empty();
        }
      ).subscribe();

      end.next();
      should.exist(subject.value);
      subject.value.should.eql([ 'prop1', 'prop2' ]);
    });

    it('de-duplicates member changed events by name', () => {
      const obj = new TestObject();
      const subject = new BehaviorSubject<string[]>(null);
      const end = new Subject();

      obj.changed
        .map(x => x.value.name)
        .takeUntil(end)
        .toArray()
        .subscribe(subject);

      Observable.using(
        () => obj.delayChangeNotifications(),
        x => {
          obj.prop1.value = 1;
          obj.prop1.value = 2;
          obj.prop2.value = 3;
          obj.prop2.value = 4;
          obj.prop2.value = 5;
          obj.prop1.value = 6;

          return Observable.empty();
        }
      ).subscribe();

      end.next();
      should.exist(subject.value);
      subject.value.should.eql([ 'prop1', 'prop2' ]);
    });

    it('de-duplicates a single event', () => {
      const obj = new TestObject();
      const subject = new BehaviorSubject<string[]>(null);
      const end = new Subject();

      obj.changed
        .map(x => x.value.name)
        .takeUntil(end)
        .toArray()
        .subscribe(subject);

      Observable.using(
        () => obj.delayChangeNotifications(),
        x => {
          obj.prop1.value = 1;

          return Observable.empty();
        }
      ).subscribe();

      end.next();
      should.exist(subject.value);
      subject.value.should.eql([ 'prop1' ]);
    });

    it('de-duplicates a single event with an initial event before the delay', () => {
      const obj = new TestObject();
      const subject = new BehaviorSubject<string[]>(null);
      const end = new Subject();

      obj.prop1.value = 123;

      obj.changed
        .map(x => x.value.name)
        .takeUntil(end)
        .toArray()
        .subscribe(subject);

      Observable.using(
        () => obj.delayChangeNotifications(),
        x => {
          obj.prop1.value = 1;

          return Observable.empty();
        }
      ).subscribe();

      end.next();
      should.exist(subject.value);
      subject.value.should.eql([ 'prop1' ]);
    });

    it('de-duplicates no events', () => {
      const obj = new TestObject();
      const subject = new BehaviorSubject<string[]>(null);
      const end = new Subject();

      obj.changed
        .map(x => x.value.name)
        .takeUntil(end)
        .toArray()
        .subscribe(subject);

      Observable.using(
        () => obj.delayChangeNotifications(),
        x => {
          return Observable.empty();
        }
      ).subscribe();

      end.next();
      should.exist(subject.value);
      subject.value.should.eql([]);
    });
  });
});
