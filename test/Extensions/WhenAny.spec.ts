import { should } from '../setup';

import { Observable, BehaviorSubject } from 'rxjs';
import { ReactiveObject } from '../../src/ReactiveObject';
import { ReactiveEvent } from '../../src/ReactiveEvent';
import { ReactiveProperty } from '../../src/ReactiveProperty';
import '../../src/Extensions/add/WhenAny';

describe('whenAny', () => {
  class TestObject extends ReactiveObject {
    public testProp1 = this.property<string>();
    public testProp2 = this.property<string>();
    public getMembers() { return this.members; }
  }

  describe('Observable', () => {
    it('creates events when watching the object', () => {
      const obj = new TestObject();
      const events = new BehaviorSubject<TestObject>(null);
      let count = 0;

      obj
        .whenAnyObservable(obj, x => x)
        .do(() => ++count)
        .subscribe(events);

      should.exist(events.value);
      events.value.should.eql(obj);

      obj.testProp1.value = 'test';
      should.exist(events.value);
      events.value.should.eql(obj);
      count.should.eql(2);
    });

    it('creates events when watching a single observable', () => {
      const obj = new TestObject();
      type eventType = {
        testProp1: ReactiveEvent<ReactiveProperty<TestObject, string>, string>;
      };
      const events = new BehaviorSubject<eventType>(null);
      let count = 0;

      obj
        .whenAnyObservable(obj, x => x.testProp1.changed, (testProp1) => ({ testProp1 }))
        .do(() => ++count)
        .subscribe(events);

      should.not.exist(events.value);

      obj.testProp1.value = 'test';
      should.exist(events.value);
      should.exist(events.value.testProp1);
      events.value.testProp1.value.should.eql(obj.testProp1.value);
      events.value.testProp1.source.should.eql(obj.testProp1);
      events.value.testProp1.source.owner.should.eql(obj);
      count.should.eql(1);
    });

    it('creates events when watching two or more observables', () => {
      const obj = new TestObject();
      type eventType = {
        testProp1: ReactiveEvent<ReactiveProperty<TestObject, string>, string>;
        testProp2: ReactiveEvent<ReactiveProperty<TestObject, string>, string>;
      };
      const events = new BehaviorSubject<eventType>(null);
      let count = 0;

      obj
        .whenAnyObservable(obj, x => x.testProp1.changed, x => x.testProp2.changed, (testProp1, testProp2) => ({ testProp1, testProp2 }))
        .do(() => ++count)
        .subscribe(events);

      should.not.exist(events.value);

      obj.testProp1.value = 'test';
      should.not.exist(events.value);

      obj.testProp2.value = 'test';
      should.exist(events.value);
      should.exist(events.value.testProp1);
      should.exist(events.value.testProp2);
      events.value.testProp1.value.should.eql(obj.testProp1.value);
      events.value.testProp1.source.should.eql(obj.testProp1);
      events.value.testProp1.source.owner.should.eql(obj);
      events.value.testProp2.value.should.eql(obj.testProp2.value);
      events.value.testProp2.source.should.eql(obj.testProp2);
      events.value.testProp2.source.owner.should.eql(obj);
      count.should.eql(1);
    });
  });

  describe('State', () => {
    it('creates events when watching the object', () => {
      const obj = new TestObject();
      const events = new BehaviorSubject<TestObject>(null);
      let count = 0;

      obj
        .whenAnyState(obj, x => x)
        .do(() => ++count)
        .subscribe(events);

      should.exist(events.value);
      events.value.should.eql(obj);

      obj.testProp1.value = 'test';
      should.exist(events.value);
      events.value.should.eql(obj);
      count.should.eql(2);
    });

    it('creates events when watching a single reactive state', () => {
      const obj = new TestObject();
      type eventType = {
        testProp1: ReactiveProperty<TestObject, string>;
      };
      const events = new BehaviorSubject<eventType>(null);
      let count = 0;

      obj
        .whenAnyState(obj, x => x.testProp1, (testProp1) => ({ testProp1 }))
        .do(() => ++count)
        .subscribe(events);

      should.exist(events.value);
      should.exist(events.value.testProp1);
      events.value.testProp1.should.eql(obj.testProp1);

      obj.testProp1.value = 'test';
      should.exist(events.value);
      should.exist(events.value.testProp1);
      events.value.testProp1.should.eql(obj.testProp1);
      count.should.eql(2);
    });

    it('creates events when watching two or more reactive states', () => {
      const obj = new TestObject();
      type eventType = {
        testProp1: ReactiveProperty<TestObject, string>;
        testProp2: ReactiveProperty<TestObject, string>;
      };
      const events = new BehaviorSubject<eventType>(null);
      let count = 0;

      obj
        .whenAnyState(obj, x => x.testProp1, x => x.testProp2, (testProp1, testProp2) => ({ testProp1, testProp2 }))
        .do(() => ++count)
        .subscribe(events);

      should.exist(events.value);
      should.exist(events.value.testProp1);
      should.exist(events.value.testProp2);
      events.value.testProp1.should.eql(obj.testProp1);
      events.value.testProp2.should.eql(obj.testProp2);

      obj.testProp1.value = 'test';
      should.exist(events.value);
      should.exist(events.value.testProp1);
      should.exist(events.value.testProp2);
      events.value.testProp1.should.eql(obj.testProp1);
      events.value.testProp2.should.eql(obj.testProp2);

      obj.testProp2.value = 'test';
      should.exist(events.value);
      should.exist(events.value.testProp1);
      should.exist(events.value.testProp2);
      events.value.testProp1.should.eql(obj.testProp1);
      events.value.testProp2.should.eql(obj.testProp2);
      count.should.eql(3);
    });
  });

  describe('Value', () => {
    it('creates events when watching the object', () => {
      const obj = new TestObject();
      const events = new BehaviorSubject<TestObject>(null);
      let count = 0;

      obj
        .whenAnyValue(obj, x => x)
        .do(() => ++count)
        .subscribe(events);

      should.exist(events.value);
      events.value.should.eql(obj);

      obj.testProp1.value = 'test';
      should.exist(events.value);
      events.value.should.eql(obj);
      count.should.eql(2);
    });

    it('creates events when watching a single reactive state', () => {
      const obj = new TestObject();
      type eventType = {
        testProp1: string;
      };
      const events = new BehaviorSubject<eventType>(null);
      let count = 0;

      obj
        .whenAnyValue(obj, x => x.testProp1, (testProp1) => ({ testProp1 }))
        .do(() => ++count)
        .subscribe(events);

      should.exist(events.value);
      should.not.exist(events.value.testProp1);

      obj.testProp1.value = 'test';
      should.exist(events.value);
      should.exist(events.value.testProp1);
      events.value.testProp1.should.eql(obj.testProp1.value);
      count.should.eql(2);
    });

    it('creates events when watching two or more reactive states', () => {
      const obj = new TestObject();
      type eventType = {
        testProp1: string;
        testProp2: string;
      };
      const events = new BehaviorSubject<eventType>(null);
      let count = 0;

      obj
        .whenAnyValue(obj, x => x.testProp1, x => x.testProp2, (testProp1, testProp2) => ({ testProp1, testProp2 }))
        .do(() => ++count)
        .subscribe(events);

      should.exist(events.value);
      should.not.exist(events.value.testProp1);
      should.not.exist(events.value.testProp2);

      obj.testProp1.value = 'test';
      should.exist(events.value);
      should.exist(events.value.testProp1);
      should.not.exist(events.value.testProp2);
      events.value.testProp1.should.eql(obj.testProp1.value);

      obj.testProp2.value = 'test';
      should.exist(events.value);
      should.exist(events.value.testProp1);
      should.exist(events.value.testProp2);
      events.value.testProp1.should.eql(obj.testProp1.value);
      events.value.testProp2.should.eql(obj.testProp2.value);
      count.should.eql(3);
    });
  });
});
