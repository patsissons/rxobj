import * as chai from 'chai';
import * as sinon from 'sinon';
import setup from './setup';
const should = setup(chai);

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

      stub();

      should.equal(1, stub.callCount);
    });
  });

  describe('for sinon-chai', () => {
    it('can use should to assert sinon properties', () => {
      const stub = sinon.stub();

      stub();

      stub.should.have.been.calledOnce;
    });
  });
});
