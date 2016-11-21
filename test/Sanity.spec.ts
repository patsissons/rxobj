import { should, sandbox } from './setup';
import { Observable } from 'rxjs';

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
