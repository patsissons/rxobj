import { should, sandbox } from './setup';
import { Observable, BehaviorSubject, TestScheduler, Subscription } from 'rxjs';

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
      const stub = sandbox.stub();

      should.exist(stub);
      should.exist(stub.callCount);

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
      let disposed = false;
      let used = false;
      Observable
        .using(
          () => new Subscription(() => disposed = true),
          x => {
            used = true;

            // you must return an observable for the subscription to be automatically disposed
            return Observable.empty();
          },
        )
        .subscribe();

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
