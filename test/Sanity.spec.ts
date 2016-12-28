import { Observable, BehaviorSubject, TestScheduler, Subscription } from 'rxjs';

import { should, sinon, sandbox } from './setup';

describe('Sanity Tests', () => {
  describe('for mocha', () => {
    it('can create a test with describe and it', () => {
      // intentionally empty
    });
  });

  describe('for chai', () => {
    it('can use should.equal to assert', () => {
      should.equal(true, true);
    });

    it('can use should extensions to assert', () => {
      true.should.eql(true);
    });
  });

  describe('for sinon', () => {
    it('can create stubs', () => {
      const stub = sinon.stub();

      should.exist(stub);
      should.exist(stub.callCount);
      stub.callCount.should.eql(0);

      stub();

      stub.callCount.should.eql(1);
    });

    it('can create sandbox stubs', () => {
      const stub = sandbox.stub();

      should.exist(stub);
      should.exist(stub.callCount);
      stub.callCount.should.eql(0);

      stub();

      stub.callCount.should.eql(1);
    });
  });

  describe('for sinon-chai', () => {
    it('can use should to assert sinon properties', () => {
      const stub = sandbox.stub();

      stub();

      stub.should.have.been.calledOnce;
    });
  });

  describe('for rxjs', () => {
    it('using operator unsubscribes the subscription', () => {
      let initialized = false;
      let used = false;
      let disposed = false;

      Observable
        .using(
          () => {
            initialized = true;

            return new Subscription(() => {
              disposed = true;
            });
          },
          x => {
            used = true;

            // you must return an observable for the subscription to be automatically disposed
            return Observable.empty();
          },
        )
        .subscribe();

      should.equal(initialized, true, 'using block did not initialize the subscription');
      should.equal(used, true, 'using block not executed');
      should.equal(disposed, true, 'using resource not disposed');
    });

    it('can schedule observables', () => {
      const result = new BehaviorSubject(0);
      const scheduler = new TestScheduler(null);

      Observable.of(1).observeOn(scheduler).subscribe(result);
      result.value.should.eql(0);

      scheduler.flush();
      result.value.should.eql(1);
    });

    it('can simulate time for long running observables', (done) => {
      const timer = sandbox.useFakeTimers();

      Observable
        .interval(5000)
        .take(1)
        .subscribe(() => done());

      timer.tick(6000);
    });
  });
});
