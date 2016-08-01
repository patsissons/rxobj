import * as chai from 'chai';
import * as sinon from 'sinon';
import setup from './setup';
const should = setup(chai);

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
