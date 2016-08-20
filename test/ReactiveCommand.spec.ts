import { should } from './setup';

import { Observable, BehaviorSubject } from 'rxjs';
import { ReactiveCommand } from '../src/ReactiveCommand';

describe('ReactiveCommand', () => {
  const testOwner = new Object();

  describe('constructor', () => {
    it('stores the owner', () => {
      const cmd = new ReactiveCommand(testOwner, x => true);

      should.exist(cmd.owner);
      cmd.owner.should.equal(testOwner);
    });

    it('configures isExecuting to start with false', (done) => {
      const cmd = new ReactiveCommand(testOwner, x => true);

      should.exist(cmd.isExecuting);

      cmd.isExecuting
        .subscribe(x => {
          should.exist(x);
          x.should.be.false;

          done();
        });
    });

    it('configures canExecute to always be true if not provided', (done) => {
      const cmd = new ReactiveCommand(testOwner, x => true);

      should.exist(cmd.canExecute);

      cmd.canExecute
        .subscribe(x => {
          should.exist(x);
          x.should.be.true;

          done();
        });
    });

    it('can be configured with a custom canExecute observable', (done) => {
      const cmd = new ReactiveCommand(testOwner, x => true, Observable.of(false));

      cmd.canExecute
        .subscribe(x => {
          x.should.be.false;

          done();
        });
    });

    it('configures the changing and changed observables', () => {
      const cmd = new ReactiveCommand(testOwner, x => true);

      should.exist(cmd.changing);
      should.exist(cmd.changed);
    });

    it('configures the results observable', () => {
      const cmd = new ReactiveCommand(testOwner, x => true);

      should.exist(cmd.results);
    });
  });

  describe('isExecuting', () => {
    it('is true while executing', (done) => {
      const isExecuting = new BehaviorSubject(false);
      const cmd = new ReactiveCommand(testOwner, x => {
        isExecuting.value.should.be.true;

        done();

        return true;
      });

      cmd.isExecuting.subscribe(isExecuting);

      cmd.execute();
    });

    it('resets to false after executing', (done) => {
      const isExecuting = new BehaviorSubject(false);
      const cmd = new ReactiveCommand(testOwner, x => true);
      let count = 0;

      cmd.isExecuting.subscribe(isExecuting);
      isExecuting.subscribe(x => {
        ++count;

        if (count === 1) {
          // initial result
          x.should.eql(false);
        }
        else if (count === 2) {
          // executing
          x.should.eql(true);
        }
        else if (count === 3) {
          // reset after execution
          x.should.eql(false);

          done();
        }
      });

      cmd.execute();
    });
  });

  describe('results', () => {
    it('contains the execution results', () => {
      const cmd = new ReactiveCommand(testOwner, x => true);
      const results = new BehaviorSubject(false);

      cmd.results.subscribe(results);

      results.value.should.be.false;

      cmd.execute();

      results.value.should.be.true;
    });
  });

  describe('canExecute', () => {
    it('depends on both isExecuting and canExecute', (done) => {
      const canExecuteInput = new BehaviorSubject(true);
      const canExecute = new BehaviorSubject(false);
      const cmd = new ReactiveCommand(testOwner, x => {
        canExecute.value.should.be.false;

        return true;
      }, canExecuteInput);


      cmd.canExecute.subscribe(canExecute);

      canExecute.value.should.be.true;

      canExecuteInput.next(false);
      canExecute.value.should.be.false;

      canExecuteInput.next(true);
      canExecute.value.should.be.true;

      cmd.results.subscribe(x => {
        canExecute.value.should.be.true;

        done();
      });

      cmd.execute();
    });
  });

  describe('execute', () => {
    it('sends the parameter to the execution action', (done) => {
      const param = 'testing';
      const cmd = new ReactiveCommand(testOwner, x => {
        should.exist(x);
        x.should.eql(param);

        done();
      });

      cmd.execute(param);
    });

    it('uses a null parameter if none is provided', (done) => {
      const cmd = new ReactiveCommand(testOwner, x => {
        should.not.exist(x);

        done();
      });

      cmd.execute();
    });

    it('generates a changing event that contains the execution parameter', (done) => {
      const param = 'testing';
      const cmd = new ReactiveCommand(testOwner, x => true);

      cmd.changing.subscribe(x => {
        should.exist(x);
        should.exist(x.source);
        should.exist(x.value);
        should.exist(x.value.param);
        should.not.exist(x.value.result);

        x.source.should.eql(cmd);
        x.value.param.should.eql(param);

        done();
      });

      cmd.execute(param);
    });

    it('generates a changed event that contains the execution results', (done) => {
      const param = 'testing';
      const cmd = new ReactiveCommand(testOwner, x => true);

      cmd.changed.subscribe(x => {
        should.exist(x);
        should.exist(x.source);
        should.exist(x.value);
        should.exist(x.value.param);
        should.exist(x.value.result);

        x.source.should.eql(cmd);
        x.value.param.should.eql(param);
        x.value.result.should.eql(true);

        done();
      });

      cmd.execute(param);
    });

    it('delays execution when delayed', () => {
      const cmd = new ReactiveCommand(testOwner, x => true);
      const results = new BehaviorSubject(false);

      cmd.results.subscribe(results);

      Observable.using(
        () => cmd.delayChangeNotifications(),
        x => {
          cmd.execute();

          results.value.should.be.false;

          x.unsubscribe();

          results.value.should.be.true;
        }
      ).subscribe();
    });

    it('suppresses execution when suppressed', () => {
      const cmd = new ReactiveCommand(testOwner, x => true);
      const results = new BehaviorSubject(false);

      cmd.results.subscribe(results);

      Observable.using(
        () => cmd.suppressChangeNotifications(),
        x => {
          cmd.execute();

          results.value.should.be.false;

          x.unsubscribe();

          results.value.should.be.false;
        }
      ).subscribe();
    });

    it('prevents concurrent execution', (done) => {
      const cmd = new ReactiveCommand(testOwner, x => {
        should.throw(() => cmd.execute());

        done();

        return true;
      });

      cmd.execute();
    });
  });
});
