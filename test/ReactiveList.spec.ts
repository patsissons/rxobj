import { should, subscribeNotCalledError } from './setup';

import { Observable, BehaviorSubject } from 'rxjs';
import { ReactiveList, ReactiveListChangeAction } from '../src/ReactiveList';

describe('ReactiveList', () => {
  const testOwner = new Object();
  const testValue = 'testing';

  describe('constructor', () => {
    it('stores the owner', () => {
      const list = new ReactiveList(testOwner);

      should.exist(list.owner);
      list.owner.should.equal(testOwner);
    });

    it('can start with an initial value', () => {
      const testArray = [ testValue ];
      const list = new ReactiveList(testOwner, testArray);

      should.exist(list.length);
      list.asArray().should.eql(testArray);
    });
  });

  describe('value', () => {
    it('returns the inner array', () => {
      const testArray = [ testValue ];
      const list = new ReactiveList(testOwner, testArray);

      should.exist(list.value);
      list.value.should.eql(testArray);
    });
  });

  describe('get', () => {
    it('mirrors the array indexer implementation', () => {
      const testArray = [ testValue ];
      const list = new ReactiveList(testOwner, testArray);

      list.get(0).should.eql(testArray[0]);
    });
  });

  describe('set', () => {
    it('mirrors the array indexer implementation', () => {
      const testArray = [ testValue ];
      const list = new ReactiveList(testOwner, testArray);

      list.set(0, 'asdf');
      testArray[0] = 'asdf';
      list.asArray().should.eql(testArray);
    });
  });

  describe('asArray', () => {
    it('returns the internal array', () => {
      const testArray = [ testValue ];
      const list = new ReactiveList(testOwner, testArray);

      should.exist(list.asArray());
      list.asArray().should.eql(testArray);
    });
  });

  describe('toArray', () => {
    it('returns a copy of the internal array', () => {
      const firstArray = [ 'test1' ];
      const list = new ReactiveList(testOwner, firstArray);

      should.exist(list.toArray());
      list.toArray().should.eql(firstArray);

      const secondArray = list.toArray();

      secondArray.push('test2');

      firstArray.length.should.not.eql(secondArray.length);
      firstArray.should.not.eql(secondArray);
    });
  });

  describe('clear', () => {
    it('empties the array', () => {
      const testArray = [ testValue ];
      const list = new ReactiveList(testOwner, testArray);

      list.clear();
      list.asArray().length.should.eql(0);
    });

    it('generates a reset notification', (done) => {
      const testArray = [ testValue ];
      const list = new ReactiveList(testOwner, testArray);
      let error = subscribeNotCalledError;

      const sub = list.changed
        .finally(() => done(error))
        .subscribe(x => {
          error = null;
          x.value.action.should.eql(ReactiveListChangeAction.Reset);
        });

      list.clear();
      sub.unsubscribe();
    });
  });

  describe('reset', () => {
    it('replaces the array', () => {
      const array1 = [ 1 ];
      const array2 = [ 2 ];
      const list = new ReactiveList(testOwner, array1);

      list.reset(...array2);
      list.asArray().should.eql(array2);
    });

    it('generates a reset notification', (done) => {
      const array1 = [ 1 ];
      const array2 = [ 2 ];
      const list = new ReactiveList(testOwner, array1);
      let error = subscribeNotCalledError;

      const sub = list.changed
        .finally(() => done(error))
        .subscribe(x => {
          error = null;
          x.value.action.should.eql(ReactiveListChangeAction.Reset);
        });

      list.reset(...array2);
      sub.unsubscribe();
    });
  });

  describe('changing', () => {
    it('can generate notifications with the source and action', (done) => {
      const emptyArray = <string[]>[];
      const list = new ReactiveList(testOwner, emptyArray);

      list.changing.subscribe(x => {
        should.exist(x);
        should.exist(x.source);
        should.exist(x.value);
        should.exist(x.value.action);

        x.source.should.equal(list);
        x.value.action.should.eql(ReactiveListChangeAction.Add);

        done();
      });

      list.push(testValue);
    });

    it('can generate notifications before a value change', (done) => {
      const emptyArray = <string[]>[];
      const list = new ReactiveList(testOwner, emptyArray);
      let error = subscribeNotCalledError;

      const sub = list.changing
        .finally(() => done(error))
        .subscribe(x => {
          error = null;
          x.source.length.should.eql(0);
          x.value.newItems.length.should.eql(1);
          x.value.newItems[0].should.eql(testValue);
          x.source.asArray().length.should.eql(0);
        });

      list.push(testValue);
      sub.unsubscribe();
    });
  });

  describe('changed', () => {
    it('can generate notifications with the source and action', (done) => {
      const emptyArray = <string[]>[];
      const list = new ReactiveList(testOwner, emptyArray);

      list.changed.subscribe(x => {
        should.exist(x);
        should.exist(x.source);
        should.exist(x.value);
        should.exist(x.value.action);

        x.source.should.equal(list);
        x.value.action.should.eql(ReactiveListChangeAction.Add);

        done();
      });

      list.push(testValue);
    });

    it('can generate notifications after a value change', (done) => {
      const emptyArray = <string[]>[];
      const list = new ReactiveList(testOwner, emptyArray);
      let error = subscribeNotCalledError;

      const sub = list.changed
        .finally(() => done(error))
        .subscribe(x => {
          error = null;
          x.source.length.should.eql(1);
          x.value.newItems.length.should.eql(1);
          x.value.newItems[0].should.eql(testValue);
          x.source.asArray().length.should.eql(1);
        });

      list.push(testValue);
      sub.unsubscribe();
    });
  });

  describe('thrownErrors', () => {
    it('can catch errors in notification handlers', (done) => {
      const emptyArray = <string[]>[];
      const list = new ReactiveList(testOwner, emptyArray);

      list.changed.subscribe(x => {
        throw 'testError';
      });

      list.thrownErrors.subscribe(x => {
        should.exist(x);
        x.should.eql('testError');

        done();
      });

      list.push(testValue);
    });
  });

  describe('suppressChangeNotifications', () => {
    it('prevents list modifications when suppressed', () => {
      const emptyArray = <string[]>[];
      const list = new ReactiveList(testOwner, emptyArray);
      const subject = new BehaviorSubject<number>(0);

      list.changed
        .map(x => x.source.length)
        .subscribe(subject);

      subject.value.should.eql(0);

      list.push(testValue);
      subject.value.should.eql(1);

      Observable.using(
        () => list.suppressChangeNotifications(),
        x => {
          list.push(testValue);
          subject.value.should.eql(1);

          list.push(testValue);
          subject.value.should.eql(1);

          x.unsubscribe();
        }
      ).subscribe();

      subject.value.should.eql(1);
    });
  });

  describe('delayChangeNotifications', () => {
    it('delays list modifications until disabled', (done) => {
      const emptyArray = <string[]>[];
      const list = new ReactiveList(testOwner, emptyArray);
      const subject = new BehaviorSubject<number>(0);
      let error = subscribeNotCalledError;

      list.changed
        .map(x => x.source.length)
        .subscribe(subject);

      subject.value.should.eql(0);

      list.push(testValue);
      subject.value.should.eql(1);

      const sub = subject
        .map((length, i) => ({ length, i }))
        .filter(x => x.i === 2)
        .finally(() => done(error))
        .subscribe(x => {
          error = null;
          x.length.should.eql(3);
        });

      Observable.using(
        () => list.delayChangeNotifications(),
        x => {
          list.push(testValue);
          subject.value.should.eql(1);

          list.push(testValue);
          subject.value.should.eql(1);

          x.unsubscribe();
        }
      ).subscribe();

      sub.unsubscribe();
    });
  });

  describe('Array<T> Facade', () => {
    describe('length', () => {
      it('returns the length of the internal array', () => {
        const testArray = [ testValue ];
        const list = new ReactiveList(testOwner, testArray);

        should.exist(list.length);
        list.length.should.eql(testArray.length);
      });
    });

    describe('push', () => {
      it('mirrors array implementation', () => {
        const testArray = [ testValue ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.asArray().should.eql(copyArray);

        list.push(testValue);
        copyArray.push(testValue);

        list.asArray().should.eql(copyArray);
      });

      it('generates notificaitons', () => {
        const testArray = [ testValue ];
        const list = new ReactiveList(testOwner, testArray);
        const changingEvents = new BehaviorSubject<ReactiveListChangeAction>(null);
        const changedEvents = new BehaviorSubject<ReactiveListChangeAction>(null);

        list.changing
          .map(x => x.value.action)
          .subscribe(changingEvents);

        list.changed
          .map(x => x.value.action)
          .subscribe(changedEvents);

        list.push(testValue);

        changingEvents.value.should.eql(ReactiveListChangeAction.Add);
        changedEvents.value.should.eql(ReactiveListChangeAction.Add);
      });
    });

    describe('pop', () => {
      it('mirrors array implementation', () => {
        const testArray = [ testValue ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.asArray().should.eql(copyArray);

        list.pop();
        copyArray.pop();

        list.asArray().should.eql(copyArray);
      });

      it('generates notificaitons', () => {
        const testArray = [ testValue ];
        const list = new ReactiveList(testOwner, testArray);
        const changingEvents = new BehaviorSubject<ReactiveListChangeAction>(null);
        const changedEvents = new BehaviorSubject<ReactiveListChangeAction>(null);

        list.changing
          .map(x => x.value.action)
          .subscribe(changingEvents);

        list.changed
          .map(x => x.value.action)
          .subscribe(changedEvents);

        list.pop();

        changingEvents.value.should.eql(ReactiveListChangeAction.Remove);
        changedEvents.value.should.eql(ReactiveListChangeAction.Remove);
      });
    });

    describe('concat', () => {
      it('mirrors array implementation', () => {
        const testArray = [ testValue ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.concat(testArray).should.eql(copyArray.concat(testArray));
      });
    });

    describe('join', () => {
      it('mirrors array implementation', () => {
        const testArray = [ testValue, testValue ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.join(',').should.eql(copyArray.join(','));
      });
    });

    describe('reverse', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 1, 2, 3 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.asArray().should.eql(copyArray);

        list.reverse();
        copyArray.reverse();

        list.asArray().should.eql(copyArray);
      });

      it('generates notificaitons', () => {
        const testArray = [ 1, 2, 3 ];
        const list = new ReactiveList(testOwner, testArray);
        const changingEvents = new BehaviorSubject<ReactiveListChangeAction>(null);
        const changedEvents = new BehaviorSubject<ReactiveListChangeAction>(null);

        list.changing
          .map(x => x.value.action)
          .subscribe(changingEvents);

        list.changed
          .map(x => x.value.action)
          .subscribe(changedEvents);

        list.reverse();

        changingEvents.value.should.eql(ReactiveListChangeAction.Reset);
        changedEvents.value.should.eql(ReactiveListChangeAction.Reset);
      });
    });

    describe('shift', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 1, 2, 3 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.asArray().should.eql(copyArray);

        list.shift();
        copyArray.shift();

        list.asArray().should.eql(copyArray);
      });

      it('generates notificaitons', () => {
        const testArray = [ 1, 2 , 3 ];
        const list = new ReactiveList(testOwner, testArray);
        const changingEvents = new BehaviorSubject<ReactiveListChangeAction>(null);
        const changedEvents = new BehaviorSubject<ReactiveListChangeAction>(null);

        list.changing
          .map(x => x.value.action)
          .subscribe(changingEvents);

        list.changed
          .map(x => x.value.action)
          .subscribe(changedEvents);

        list.shift();

        changingEvents.value.should.eql(ReactiveListChangeAction.Remove);
        changedEvents.value.should.eql(ReactiveListChangeAction.Remove);
      });
    });

    describe('slice', () => {
      it('mirrors array implementation', () => {
        const testArray = [ testValue, testValue ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.slice().should.eql(copyArray.slice());
        list.slice(1, 2).should.eql(copyArray.slice(1, 2));
      });
    });

    describe('sort', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 3, 2, 1 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.asArray().should.eql(copyArray);

        list.sort();
        copyArray.sort();

        list.asArray().should.eql(copyArray);
      });

      it('generates notificaitons', () => {
        const testArray = [ 3, 2, 1 ];
        const list = new ReactiveList(testOwner, testArray);
        const changingEvents = new BehaviorSubject<ReactiveListChangeAction>(null);
        const changedEvents = new BehaviorSubject<ReactiveListChangeAction>(null);

        list.changing
          .map(x => x.value.action)
          .subscribe(changingEvents);

        list.changed
          .map(x => x.value.action)
          .subscribe(changedEvents);

        list.sort();

        changingEvents.value.should.eql(ReactiveListChangeAction.Reset);
        changedEvents.value.should.eql(ReactiveListChangeAction.Reset);
      });
    });

    describe('splice', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 5, 4, 3, 2, 1 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.asArray().should.eql(copyArray);

        list.splice(4);
        copyArray.splice(4);

        list.asArray().should.eql(copyArray);

        list.splice(1, 1);
        copyArray.splice(1, 1);

        list.asArray().should.eql(copyArray);

        list.splice(1, 0, 4);
        copyArray.splice(1, 0, 4);

        list.asArray().should.eql(copyArray);

        list.splice(1);
        copyArray.splice(1);

        list.asArray().should.eql(copyArray);
      });

      it('generates notificaitons', () => {
        const testArray = [ 3, 2, 1 ];
        const list = new ReactiveList(testOwner, testArray);
        const changingEvents = new BehaviorSubject<ReactiveListChangeAction>(null);
        const changedEvents = new BehaviorSubject<ReactiveListChangeAction>(null);

        list.changing
          .map(x => x.value.action)
          .subscribe(changingEvents);

        list.changed
          .map(x => x.value.action)
          .subscribe(changedEvents);

        list.splice(1);

        changingEvents.value.should.eql(ReactiveListChangeAction.Reset);
        changedEvents.value.should.eql(ReactiveListChangeAction.Reset);
      });
    });

    describe('unshift', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 1, 2, 3 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.asArray().should.eql(copyArray);

        list.unshift(0);
        copyArray.unshift(0);

        list.asArray().should.eql(copyArray);
      });

      it('generates notificaitons', () => {
        const testArray = [ 1, 2 , 3 ];
        const list = new ReactiveList(testOwner, testArray);
        const changingEvents = new BehaviorSubject<ReactiveListChangeAction>(null);
        const changedEvents = new BehaviorSubject<ReactiveListChangeAction>(null);

        list.changing
          .map(x => x.value.action)
          .subscribe(changingEvents);

        list.changed
          .map(x => x.value.action)
          .subscribe(changedEvents);

        list.unshift(0);

        changingEvents.value.should.eql(ReactiveListChangeAction.Add);
        changedEvents.value.should.eql(ReactiveListChangeAction.Add);
      });
    });

    describe('indexOf', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 1, 2, 1 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.indexOf(1).should.eql(copyArray.indexOf(1));
      });
    });

    describe('lastIndexOf', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 1, 2, 1 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.lastIndexOf(1).should.eql(copyArray.lastIndexOf(1));
      });
    });

    describe('every', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 1, 2, 1 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.every(x => x === 1).should.eql(copyArray.every(x => x === 1));
      });
    });

    describe('some', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 1, 2, 1 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.some(x => x === 1).should.eql(copyArray.some(x => x === 1));
      });
    });

    describe('forEach', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 1, 2, 1 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.forEach((x, i, a) => { a[i] = x * 2; });
        copyArray.forEach((x, i, a) => { a[i] = x * 2; });

        list.asArray().should.eql(copyArray);
      });
    });

    describe('map', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 1, 2, 1 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.map(x => x * 2).should.eql(copyArray.map(x => x * 2));
      });
    });

    describe('filter', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 1, 2, 1 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.filter(x => x > 1).should.eql(copyArray.filter(x => x > 1));
      });
    });

    describe('reduce', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 1, 2, 1 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.reduce((c, x) => c + x, 0).should.eql(copyArray.reduce((c, x) => c + x, 0));
      });
    });

    describe('reduceRight', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 1, 2, 1 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.reduceRight((c, x) => c + x, 0).should.eql(copyArray.reduceRight((c, x) => c + x, 0));
      });
    });

    describe('find', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 1, 2, 1 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.find(x => x === 2).should.eql(copyArray.find(x => x === 2));
      });
    });

    describe('findIndex', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 1, 2, 1 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.findIndex(x => x === 2).should.eql(copyArray.findIndex(x => x === 2));
      });
    });

    describe('fill', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 1, 3 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.asArray().should.eql(copyArray);

        list.fill(2, 1, 2);
        copyArray.fill(2, 1, 2);

        list.asArray().should.eql(copyArray);
      });

      it('generates notificaitons', () => {
        const testArray = [ 1, 3 ];
        const list = new ReactiveList(testOwner, testArray);
        const changingEvents = new BehaviorSubject<ReactiveListChangeAction>(null);
        const changedEvents = new BehaviorSubject<ReactiveListChangeAction>(null);

        list.changing
          .map(x => x.value.action)
          .subscribe(changingEvents);

        list.changed
          .map(x => x.value.action)
          .subscribe(changedEvents);

        list.fill(2, 1, 2);

        changingEvents.value.should.eql(ReactiveListChangeAction.Reset);
        changedEvents.value.should.eql(ReactiveListChangeAction.Reset);
      });
    });

    describe('copyWithin', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 1, 2, 3 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.asArray().should.eql(copyArray);

        list.copyWithin(3, 1, 2);
        copyArray.copyWithin(3, 1, 2);

        list.asArray().should.eql(copyArray);
      });

      it('generates notificaitons', () => {
        const testArray = [ 1, 2, 3 ];
        const list = new ReactiveList(testOwner, testArray);
        const changingEvents = new BehaviorSubject<ReactiveListChangeAction>(null);
        const changedEvents = new BehaviorSubject<ReactiveListChangeAction>(null);

        list.changing
          .map(x => x.value.action)
          .subscribe(changingEvents);

        list.changed
          .map(x => x.value.action)
          .subscribe(changedEvents);

        list.copyWithin(3, 1, 2);

        changingEvents.value.should.eql(ReactiveListChangeAction.Reset);
        changedEvents.value.should.eql(ReactiveListChangeAction.Reset);
      });
    });

    describe('entries', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 1, 2, 1 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.entries().should.eql(copyArray.entries());
      });
    });

    describe('keys', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 1, 2, 1 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.keys().should.eql(copyArray.keys());
      });
    });

    describe('values', () => {
      it('mirrors array implementation', () => {
        const testArray = [ 1, 2, 1 ];
        const copyArray = testArray.slice();
        const list = new ReactiveList(testOwner, testArray);

        list.values().should.eql(copyArray.values());
      });
    });
  });
});
