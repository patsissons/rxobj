import * as sinon from 'sinon';
import { should, sandbox } from './setup';

import { Subscriber, Scheduler } from 'rxjs';
import { ReactiveApp } from '../src/ReactiveApp';

describe('ReactiveApp', () => {
  describe('isUnitTestRunner', () => {
    it('is true', () => {
      ReactiveApp.isUnitTestRunner.value.should.be.true;
    });
  });

  describe('defaultErrorHandler', () => {
    it('is non-null', () => {
      should.exist(ReactiveApp.defaultErrorHandler);
    });

    it('emits errors to console.error', () => {
      const stub = sandbox.stub(console, 'error');
      const err = new Error('testing');

      ReactiveApp.defaultErrorHandler.next(err);

      stub.callCount.should.eql(1);
      stub.calledWith(err);
    });

    it('is replaceable with a new subscriber', () => {
      const stub = sinon.stub();

      ReactiveApp.defaultErrorHandler = Subscriber.create(stub);

      const err = new Error('testing');
      ReactiveApp.defaultErrorHandler.next(err);

      stub.should.have.been.calledOnce;
      stub.should.have.been.calledWith(err);
    });
  });

  describe('mainScheduler', () => {
    it('is the null scheduler', () => {
      should.not.exist(ReactiveApp.mainScheduler.value);
    });

    it('is the queue scheduler outside of a unit test context', () => {
      sandbox.stub(ReactiveApp, 'isUnitTestRunner', false);
      ReactiveApp.mainScheduler.value.should.equal(Scheduler.queue);
    });
  });
});
