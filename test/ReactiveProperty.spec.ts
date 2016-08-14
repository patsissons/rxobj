import * as chai from 'chai';
// import * as sinon from 'sinon';
import setup from './setup';
const should = setup(chai);

import { Observable, BehaviorSubject } from 'rxjs';
import { ReactiveStreamProperty, ReactiveValueProperty } from '../src/ReactiveProperty';

describe('ReactiveProperty', () => {
  const testOwner = new Object();
  const testValue = 'testing';

  describe('constructor', () => {
    it('stores the owner', () => {
      const prop = new ReactiveValueProperty(testOwner);

      should.exist(prop.owner);
      prop.owner.should.equal(testOwner);
    });

    it('can start with an initial value', () => {
      const prop = new ReactiveValueProperty(testOwner, testValue);

      should.exist(prop.value);
      prop.value.should.equal(testValue);
    });
  });

  describe('value', () => {
    it('can act as a getter', () => {
      const prop = new ReactiveValueProperty(testOwner, testValue);

      should.exist(prop.value);
      prop.value.should.equal(testValue);
    });
  });

  describe('changing', () => {
    it('can generate notifications with the source and incoming value', (done) => {
      const prop = new ReactiveValueProperty(testOwner, '');

      prop.changing.subscribe(x => {
        should.exist(x);
        should.exist(x.source);
        should.exist(x.value);

        x.source.should.equal(prop);
        x.value.should.eql(testValue);

        done();
      });

      prop.value = testValue;
    });

    it('can generate notifications before a value change', (done) => {
      const prop = new ReactiveValueProperty(testOwner, '');

      prop.changing.subscribe(x => {
        x.source.value.should.eql('');
        x.value.should.eql(testValue);

        done();
      });

      prop.value = testValue;
    });
  });

  describe('changed', () => {
    it('can generate notifications with the source and incoming value', (done) => {
      const prop = new ReactiveValueProperty(testOwner, '');

      prop.changed.subscribe(x => {
        should.exist(x);
        should.exist(x.source);
        should.exist(x.value);

        x.source.should.equal(prop);
        x.value.should.eql(testValue);

        done();
      });

      prop.value = testValue;
    });

    it('can generate notifications after a value change', (done) => {
      const prop = new ReactiveValueProperty(testOwner, '');

      prop.changed.subscribe(x => {
        x.source.value.should.eql(testValue);
        x.value.should.eql(testValue);

        done();
      });

      prop.value = testValue;
    });
  });

  describe('thrownErrors', () => {
    it('can catch errors in notification handlers', (done) => {
      const prop = new ReactiveValueProperty(testOwner, '');

      prop.changed.subscribe(x => {
        throw 'testError';
      });

      prop.thrownErrors.subscribe(x => {
        should.exist(x);
        x.should.eql('testError');

        done();
      });

      prop.value = testValue;
    });
  });

  describe('areChangeNotificationsEnabled', () => {
    it('defaults to true', () => {
      const prop = new ReactiveValueProperty(testOwner, testValue);

      prop.areChangeNotificationsEnabled().should.be.true;
    });

    it('is false when suppressed and true otherwise', () => {
      const prop = new ReactiveValueProperty(testOwner, testValue);

      Observable.using(
        () => prop.suppressChangeNotifications(),
        x => {
          prop.areChangeNotificationsEnabled().should.be.false;

          x.unsubscribe();
        }
      ).subscribe();

      prop.areChangeNotificationsEnabled().should.be.true;
    });
  });

  describe('areChangeNotificationsDelayed', () => {
    it('defaults to false', () => {
      const prop = new ReactiveValueProperty(testOwner, testValue);

      prop.areChangeNotificationsDelayed().should.be.false;
    });

    it('is true when delayed and false otherwise', () => {
      const prop = new ReactiveValueProperty(testOwner, testValue);

      Observable.using(
        () => prop.delayChangeNotifications(),
        x => {
          prop.areChangeNotificationsDelayed().should.be.true;

          x.unsubscribe();
        }
      ).subscribe();

      prop.areChangeNotificationsDelayed().should.be.false;
    });
  });

  describe('suppressChangeNotifications', () => {
    it('prevents change notifications completely when suppressed', () => {
      const prop = new ReactiveValueProperty(testOwner, 0);
      const subject = new BehaviorSubject<number>(0);

      prop.changed
        .map(x => x.value)
        .subscribe(subject);

      subject.value.should.eql(0);

      prop.value = 1;
      subject.value.should.eql(1);

      Observable.using(
        () => prop.suppressChangeNotifications(),
        x => {
          prop.value = 2;
          subject.value.should.eql(1);

          prop.value = 3;
          subject.value.should.eql(1);

          x.unsubscribe();
        }
      ).subscribe();

      subject.value.should.eql(1);
    });
  });

  describe('delayChangeNotifications', () => {
    it('delays change notifications until disabled', (done) => {
      const prop = new ReactiveValueProperty(testOwner, 0);
      const subject = new BehaviorSubject<number>(0);

      prop.changed
        .map(x => x.value)
        .subscribe(subject);

      subject.value.should.eql(0);

      prop.value = 1;
      subject.value.should.eql(1);

      subject
        .subscribe(x => {
          if (x === 3) {
            done();
          }
        });

      Observable.using(
        () => prop.delayChangeNotifications(),
        x => {
          prop.value = 2;
          subject.value.should.eql(1);

          prop.value = 3;
          subject.value.should.eql(1);

          x.unsubscribe();
        }
      ).subscribe();
    });
  });

  describe('ReactiveStreamProperty', () => {
    describe('constructor', () => {
      it('initializes with an observable source', () => {
        const source = Observable.of(testValue);
        const prop = new ReactiveStreamProperty(source, testOwner);

        should.exist(prop.source);
        prop.source.should.equal(source);
        should.exist(prop.value);
        prop.value.should.eql(testValue);
      });
    });
  });

  describe('ReactiveValueProperty', () => {
    describe('constructor', () => {
      it('initializes with a value handler source', () => {
        const prop = new ReactiveValueProperty(testOwner);

        should.exist(prop.source);
      });
    });

    describe('value', () => {
      it('can act as a setter', () => {
        const prop = new ReactiveValueProperty(testOwner);

        prop.value = testValue;

        should.exist(prop.value);
        prop.value.should.equal(testValue);
      });
    });
  });
});
