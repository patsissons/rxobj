import * as sinon from 'sinon';
import { should, sandbox } from './setup';

import { Subscriber, Scheduler } from 'rxjs';
import { ReactiveApp } from '../src/ReactiveApp';

describe('ReactiveApp', () => {
  it('isUnitTestRunner should be true', () => {
    ReactiveApp.isUnitTestRunner.should.be.true;
  });

  describe('defaultErrorHandler', () => {
    it('should be initialized by default', () => {
      should.exist(ReactiveApp.defaultErrorHandler);
    });

    it('should use console.error by default', () => {
      // const sandbox = sinon.sandbox.create();
      const stub = sandbox.stub(console, 'error');
      const err = new Error('testing');

      ReactiveApp.defaultErrorHandler.next(err);

      stub.callCount.should.eql(1);
      stub.calledWith(err);
      sandbox.restore();
    });

    it('should be extensible with a new subscriber', () => {
      const stub = sinon.stub();

      ReactiveApp.defaultErrorHandler = Subscriber.create(stub);

      const err = new Error('testing');
      ReactiveApp.defaultErrorHandler.next(err);

      stub.should.have.been.calledOnce;
      stub.should.have.been.calledWith(err);
    });
  });

  describe('mainScheduler', () => {
    it('should be initialize by default', () => {
      should.exist(ReactiveApp.mainScheduler);
    });

    it('should be the queue scheduler for a unit test context', () => {
      ReactiveApp.mainScheduler.should.equal(Scheduler.queue);
    });
  });
});
