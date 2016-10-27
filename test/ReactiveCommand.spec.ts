import { should } from './setup';

import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { ReactiveCommand } from '../src/ReactiveCommand';

describe('ReactiveCommand', () => {
  const testOwner = new Object();

  describe('value', () => {
    it('returns null if never executed', () => {
      const cmd = new ReactiveCommand(testOwner, x => Observable.of(true));

      should.not.exist(cmd.value);
    });

    it('returns the most recent result', () => {
      const cmd = new ReactiveCommand(testOwner, x => Observable.of(true));
      cmd.executeNow();

      should.exist(cmd.value);
      cmd.value.should.be.true;
    });
  });

  describe('canExecute', () => {
    it('is always true if not provided at construction', (done) => {
      const cmd = new ReactiveCommand(testOwner, x => Observable.of(true));

      should.exist(cmd.canExecute);

      cmd.canExecute
        .take(1)
        .subscribe(x => {
          should.exist(x);
          x.should.be.true;
        }, undefined, done);
    });

    it('can be configured at construction', (done) => {
      const canExecute = new Subject<boolean>();
      const cmd = new ReactiveCommand(testOwner, x => Observable.of(true), canExecute);

      cmd.canExecute
        .take(2)
        .map((x, i) => ({ x, i }))
        .subscribe(x => {
          if (x.i === 0) {
            x.x.should.be.false;
          }
          else if (x.i === 1) {
            x.x.should.be.true;
          }
        }, undefined, done);

      canExecute.next(true);
    });

    it('only publishes distinct changed values', (done) => {
      const canExecute = new Subject<boolean>();
      const cmd = new ReactiveCommand(testOwner, x => Observable.of(true), canExecute);

      cmd.canExecute
        .take(4)
        .map((x, i) => ({ x, i }))
        .subscribe(x => {
          if (x.i === 0 || x.i === 2) {
            x.x.should.be.false;
          }
          else if (x.i === 1 || x.i === 3) {
            x.x.should.be.true;
          }
        }, undefined, done);

      canExecute.next(false);
      canExecute.next(false);
      canExecute.next(false);
      canExecute.next(true);
      canExecute.next(true);
      canExecute.next(true);
      canExecute.next(false);
      canExecute.next(true);
    });

    it('is always false while executing', (done) => {
      const canExecute = new BehaviorSubject(false);
      const cmd = new ReactiveCommand(testOwner, x => {
        canExecute.value.should.be.false;

        return Observable.of(true);
      });

      cmd.canExecute.subscribe(canExecute);

      cmd.execute().subscribe(undefined, undefined, done);
    });

    it('always starts with the most recent value', (done) => {
      const canExecute = new BehaviorSubject(false);
      const cmd = new ReactiveCommand(testOwner, x => {
        canExecute.value.should.be.false;

        const canExecute2 = new BehaviorSubject<boolean>(undefined);
        cmd.canExecute.subscribe(canExecute2);

        canExecute.value.should.eql(canExecute2.value);

        return Observable.of(true);
      });

      cmd.canExecute.subscribe(canExecute);

      cmd.execute().subscribe(undefined, undefined, done);
    });

    it('handles errors', () => {
      const errors = new BehaviorSubject<Error>(null);
      const canExecute = Observable.throw<boolean>('test').publish();
      const cmd = new ReactiveCommand(testOwner, x => {
        return Observable.of(true);
      }, canExecute);

      cmd.thrownErrors.asObservable().subscribe(errors);

      canExecute.connect();

      should.exist(errors.value);
      errors.value.should.eql('test');
    });
  });

  describe('isExecuting', () => {
    it('is normally false', (done) => {
      const isExecuting = new BehaviorSubject<boolean>(undefined);
      const cmd = new ReactiveCommand(testOwner, x => {
        return Observable.of(true);
      });

      cmd.isExecuting.subscribe(isExecuting);

      isExecuting.value.should.be.false;

      cmd.execute().subscribe(undefined, undefined, () => {
        isExecuting.value.should.be.false;

        done();
      });
    });

    it('is true while executing', (done) => {
      const isExecuting = new BehaviorSubject(false);
      const cmd = new ReactiveCommand(testOwner, x => {
        isExecuting.value.should.be.true;

        return Observable.of(true);
      });

      cmd.isExecuting.subscribe(isExecuting);

      cmd.execute().subscribe(undefined, undefined, done);
    });
  });

  describe('results', () => {
    it('contains the execution results', (done) => {
      const cmd = new ReactiveCommand(testOwner, x => Observable.of(true));
      const results = new BehaviorSubject(false);

      cmd.results.subscribe(results);

      cmd.execute().subscribe(undefined, undefined, () => {
        results.value.should.be.true;

        done();
      });
    });

    it('excludes errors', (done) => {
      const err = new Error('test');
      const cmd = new ReactiveCommand(testOwner, x => <Observable<boolean>>Observable.throw(err));
      const results = new BehaviorSubject(false);

      cmd.results.subscribe(results);

      cmd.thrownErrors.subscribe();

      cmd.execute().subscribe(undefined, e => {
        results.value.should.be.false;

        done();
      });
    });
  });

  describe('execute', () => {
    it('sends the parameter to the execution action', (done) => {
      const param = 'testing';
      const cmd = new ReactiveCommand(testOwner, x => {
        should.exist(x);
        x.should.eql(param);

        return Observable.of(true);
      });

      cmd.execute(param).subscribe(undefined, undefined, done);
    });

    it('uses a null parameter if none is provided', (done) => {
      const cmd = new ReactiveCommand(testOwner, x => {
        should.not.exist(x);

        return Observable.of(true);
      });

      cmd.execute().subscribe(undefined, undefined, done);
    });

    it('should not call the execution action before emitting a changing value', (done) => {
      let executed = false;
      const cmd = new ReactiveCommand(testOwner, x => {
        executed = true;
        return Observable.of(true);
      });

      cmd.changing
        .subscribe(x => {
          executed.should.be.false;
        });

      cmd.execute().subscribe(undefined, undefined, done);
    });

    it('should call the execution action before emitting a changed value', (done) => {
      let executed = false;

      const cmd = new ReactiveCommand(testOwner, x => {
        executed = true;
        return Observable.of(true);
      });

      cmd.changed
        .subscribe(x => {
          executed.should.be.true;
        });

      cmd.execute().subscribe(undefined, undefined, done);
    });
  });

  describe('executeNow', () => {
    it('subscribes automatically to the command execution', (done) => {
      let executed = false;

      const cmd = new ReactiveCommand(testOwner, x => {
        executed = true;
        return Observable.of(true);
      });

      cmd.executeNow(undefined, undefined, undefined, () => {
        executed.should.be.true;

        done();
      });
    });

    it('supports a subscription result function', (done) => {
      const param = 'testing';

      const cmd = new ReactiveCommand(testOwner, x => {
        return Observable.of(true);
      });

      cmd.executeNow(param, x => {
        should.exist(x);
        x.should.be.true;
      }, undefined, done);
    });
  });

  describe('changing', () => {
    it('contains the parameter value', (done) => {
      const param = 'testing';

      const cmd = new ReactiveCommand(testOwner, x => {
        return Observable.of(true);
      });

      cmd.changing
        .subscribe(x => {
          should.exist(x.value.param);
          x.value.param.should.eql(param);
        });

      cmd.execute(param).subscribe(undefined, undefined, done);
    });
  });

  describe('changed', () => {
    it('contains the parameter and result values', (done) => {
      const param = 'testing';

      const cmd = new ReactiveCommand(testOwner, x => {
        return Observable.of(true);
      });

      cmd.changed
        .subscribe(x => {
          should.exist(x.value.param);
          should.exist(x.value.result);
          x.value.param.should.eql(param);
          x.value.result.should.be.true;
        });

      cmd.execute(param).subscribe(undefined, undefined, done);
    });
  });

  describe('delayChangeNotifications', () => {
    it.only('de-duplicates consecutive identical values', () => {
      const cmd = new ReactiveCommand(testOwner, (x: number) => {
        return Observable.of(x);
      });
      const subject = new BehaviorSubject<number[]>(null);
      const end = new Subject();

      cmd.changed
        .map(x => x.value.result)
        .takeUntil(end)
        .toArray()
        .subscribe(subject);

      Observable.using(
        () => cmd.delayChangeNotifications(),
        x => {
          cmd.executeNow(1);
          cmd.executeNow(1);
          cmd.executeNow(2);
          cmd.executeNow(2);
          cmd.executeNow(2);
          cmd.executeNow(1);

          x.unsubscribe();
        }
      ).subscribe();

      end.next();
      subject.value.should.eql([ 1, 2, 1 ]);
    });
  });
});
