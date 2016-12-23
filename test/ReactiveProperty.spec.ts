import { should, subscribeNotCalledError } from './setup';

import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { ReactiveProperty, ReactivePropertyEventValue } from '../src/ReactiveProperty';

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
        x.value.oldValue.should.eql('');
        x.value.newValue.should.eql(testValue);

        done();
      });

      prop.value = testValue;
    });

    it('can generate notifications before a value change', (done) => {
      const prop = new ReactiveProperty(testOwner, '');
      let error = subscribeNotCalledError;

      prop.changing
        .take(1)
        .finally(() => done(error))
        .subscribe(x => {
          error = null;
          should.exist(x.value);
          prop.value.should.eql('');
          x.value.oldValue.should.eql(prop.value);
          x.value.newValue.should.eql(testValue);
        });

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
        x.value.oldValue.should.eql('');
        x.value.newValue.should.eql(testValue);

        done();
      });

      prop.value = testValue;
    });

    it('can generate notifications after a value change', (done) => {
      const prop = new ReactiveProperty(testOwner, '');

      prop.changed.subscribe(x => {
        should.exist(x.value);
        prop.value.should.eql(testValue);
        x.value.oldValue.should.eql('');
        x.value.newValue.should.eql(prop.value);

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

          return Observable.empty();
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

          return Observable.empty();
        }
      ).subscribe();

      prop.areChangeNotificationsDelayed().should.be.false;
    });
  });

  describe('suppressChangeNotifications', () => {
    it('prevents change notifications completely when suppressed', () => {
      const prop = new ReactiveProperty(testOwner, 0);
      const subject = new BehaviorSubject<ReactivePropertyEventValue<number>>(null);

      prop.changed
        .map(x => x.value)
        .subscribe(subject);

      should.not.exist(subject.value);

      prop.value = 1;
      subject.value.oldValue.should.eql(0);
      subject.value.newValue.should.eql(1);

      Observable.using(
        () => prop.suppressChangeNotifications(),
        x => {
          prop.value = 2;
          subject.value.oldValue.should.eql(0);
          subject.value.newValue.should.eql(1);

          prop.value = 3;
          subject.value.oldValue.should.eql(0);
          subject.value.newValue.should.eql(1);

          return Observable.empty();
        }
      ).subscribe();

      subject.value.oldValue.should.eql(0);
      subject.value.newValue.should.eql(1);
    });

    it('handles multiple calls', () => {
      const prop = new ReactiveProperty(testOwner, 0);
      const subject = new BehaviorSubject<ReactivePropertyEventValue<number>>(null);

      prop.changed
        .map(x => x.value)
        .subscribe(subject);

      should.not.exist(subject.value);

      prop.value = 1;
      subject.value.oldValue.should.eql(0);
      subject.value.newValue.should.eql(1);

      Observable.using(
        () => prop.suppressChangeNotifications(),
        sub1 => {
          prop.value = 2;
          subject.value.oldValue.should.eql(0);
          subject.value.newValue.should.eql(1);

          Observable.using(
            () => prop.suppressChangeNotifications(),
            sub2 => {
              prop.value = 3;
              subject.value.oldValue.should.eql(0);
              subject.value.newValue.should.eql(1);

              return Observable.empty();
            }
          ).subscribe();

          subject.value.oldValue.should.eql(0);
          subject.value.newValue.should.eql(1);

          return Observable.empty();
        }
      ).subscribe();

      subject.value.oldValue.should.eql(0);
      subject.value.newValue.should.eql(1);
    });
  });

  describe('delayChangeNotifications', () => {
    it('delays change notifications until disabled', () => {
      const prop = new ReactiveProperty(testOwner, 0);
      const subject = new BehaviorSubject<ReactivePropertyEventValue<number>>(null);

      prop.changed
        .map(x => x.value)
        .subscribe(subject);

      should.not.exist(subject.value);

      prop.value = 1;
      subject.value.oldValue.should.eql(0);
      subject.value.newValue.should.eql(1);

      Observable.using(
        () => prop.delayChangeNotifications(),
        x => {
          prop.value = 2;
          subject.value.oldValue.should.eql(0);
          subject.value.newValue.should.eql(1);

          prop.value = 3;
          subject.value.oldValue.should.eql(0);
          subject.value.newValue.should.eql(1);

          return Observable.empty();
        }
      ).subscribe();

      subject.value.oldValue.should.eql(2);
      subject.value.newValue.should.eql(3);
    });

    it('de-duplicates consecutive identical values', () => {
      const prop = new ReactiveProperty(testOwner, 0);
      const subject = new BehaviorSubject<number[]>(null);
      const end = new Subject();

      prop.changed
        .map(x => x.value.newValue)
        .takeUntil(end)
        .toArray()
        .subscribe(subject);

      Observable.using(
        () => prop.delayChangeNotifications(),
        x => {
          prop.value = 1;
          prop.value = 1;
          prop.value = 2;
          prop.value = 2;
          prop.value = 2;
          prop.value = 1;

          return Observable.empty();
        }
      ).subscribe();

      end.next();
      subject.value.should.eql([ 1, 2, 1 ]);
    });

    it('handles multiple calls', (done) => {
      const prop = new ReactiveProperty(testOwner, 0);
      const subject = new BehaviorSubject<ReactivePropertyEventValue<number>>(null);

      prop.changed
        .map(x => x.value)
        .subscribe(subject);

      should.not.exist(subject.value);

      prop.value = 1;
      subject.value.oldValue.should.eql(0);
      subject.value.newValue.should.eql(1);

      subject
        .subscribe(x => {
          if (x.newValue === 3) {
            subject.value.oldValue.should.eql(2);

            done();
          }
        });

      Observable.using(
        () => prop.delayChangeNotifications(),
        sub1 => {
          prop.value = 2;
          subject.value.oldValue.should.eql(0);
          subject.value.newValue.should.eql(1);

          Observable.using(
            () => prop.delayChangeNotifications(),
            sub2 => {
              prop.value = 3;
              subject.value.oldValue.should.eql(0);
              subject.value.newValue.should.eql(1);

              return Observable.empty();
            }
          ).subscribe();

          subject.value.oldValue.should.eql(0);
          subject.value.newValue.should.eql(1);

          return Observable.empty();
        }
      ).subscribe();
    });
  });
});
