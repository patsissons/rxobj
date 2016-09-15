import { should } from './setup';

import { Observable, BehaviorSubject } from 'rxjs';
import { ReactiveProperty } from '../src/ReactiveProperty';

describe('ReactiveProperty', () => {
  const testOwner = new Object();
  const testValue = 'testing';

  describe('constructor', () => {
    it('stores the owner', () => {
      const prop = new ReactiveProperty(testOwner, null);

      should.exist(prop.owner);
      prop.owner.should.equal(testOwner);
    });

    it('can start with an initial value', () => {
      const prop = new ReactiveProperty(testOwner, testValue);

      should.exist(prop.value);
      prop.value.should.equal(testValue);
    });

    it('can use an observable stream', () => {
      const prop = new ReactiveProperty(testOwner, undefined, Observable.of(testValue));

      prop.value.should.eql(testValue);
    });

    it('can use an observable stream with an initial value', () => {
      const prop = new ReactiveProperty(testOwner, '', Observable.of(testValue));

      prop.value.should.eql(testValue);
    });
  });

  describe('value', () => {
    it('can act as a getter', () => {
      const prop = new ReactiveProperty(testOwner, testValue);

      should.exist(prop.value);
      prop.value.should.equal(testValue);
    });

    it('supports value changes using the setter', () => {
      const prop = new ReactiveProperty(testOwner, '');

      prop.value = testValue;

      prop.value.should.equal(testValue);
    });

    it('throws an error on set if constructed with an observable stream', () => {
      const prop = new ReactiveProperty(testOwner, undefined, Observable.of(''));
      const errors = new BehaviorSubject<Error>(undefined);

      prop.thrownErrors.subscribe(errors);

      prop.value = testValue;

      prop.value.should.not.eql(testValue);
      should.exist(errors.value);
    });
  });

  describe('changing', () => {
    it('can generate notifications with the source and incoming value', (done) => {
      const prop = new ReactiveProperty(testOwner, '');

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
      const prop = new ReactiveProperty(testOwner);

      prop.changing.take(1).mochaSubscribe(x => {
        should.not.exist(x.source.value);
        x.value.should.eqls(testValue);
      }, done);

      prop.value = testValue;
    });
  });

  describe('changed', () => {
    it('can generate notifications with the source and incoming value', (done) => {
      const prop = new ReactiveProperty(testOwner, '');

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
      const prop = new ReactiveProperty(testOwner, '');

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
      const prop = new ReactiveProperty(testOwner, '');

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
      const prop = new ReactiveProperty(testOwner, testValue);

      prop.areChangeNotificationsEnabled().should.be.true;
    });

    it('is false when suppressed and true otherwise', () => {
      const prop = new ReactiveProperty(testOwner, testValue);

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
      const prop = new ReactiveProperty(testOwner, testValue);

      prop.areChangeNotificationsDelayed().should.be.false;
    });

    it('is true when delayed and false otherwise', () => {
      const prop = new ReactiveProperty(testOwner, testValue);

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
      const prop = new ReactiveProperty(testOwner, 0);
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

    it('handles multiple calls', () => {
      const prop = new ReactiveProperty(testOwner, 0);
      const subject = new BehaviorSubject<number>(0);

      prop.changed
        .map(x => x.value)
        .subscribe(subject);

      subject.value.should.eql(0);

      prop.value = 1;
      subject.value.should.eql(1);

      Observable.using(
        () => prop.suppressChangeNotifications(),
        sub1 => {
          prop.value = 2;
          subject.value.should.eql(1);

          Observable.using(
            () => prop.suppressChangeNotifications(),
            sub2 => {
              prop.value = 3;
              subject.value.should.eql(1);

              sub2.unsubscribe();
            }
          ).subscribe();

          subject.value.should.eql(1);

          sub1.unsubscribe();
        }
      ).subscribe();

      subject.value.should.eql(1);
    });
  });

  describe('delayChangeNotifications', () => {
    it('delays change notifications until disabled', () => {
      const prop = new ReactiveProperty(testOwner, 0);
      const values = new BehaviorSubject<number>(0);

      prop.changed
        .map(x => x.value)
        .subscribe(values);

      values.value.should.eql(0);

      prop.value = 1;
      values.value.should.eql(1);

      // values
      //   .take(1)
      //   .mochaSubscribe(undefined, done);

      Observable.using(
        () => prop.delayChangeNotifications(),
        x => {
          prop.value = 2;
          values.value.should.eql(1);

          prop.value = 3;
          values.value.should.eql(1);

          x.unsubscribe();
        }
      ).subscribe();

      values.value.should.eql(3);
    });

    it('handles multiple calls', (done) => {
      const prop = new ReactiveProperty(testOwner, 0);
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
        sub1 => {
          prop.value = 2;
          subject.value.should.eql(1);

          Observable.using(
            () => prop.delayChangeNotifications(),
            sub2 => {
              prop.value = 3;
              subject.value.should.eql(1);

              sub2.unsubscribe();
            }
          ).subscribe();

          subject.value.should.eql(1);

          sub1.unsubscribe();
        }
      ).subscribe();
    });
  });
});
