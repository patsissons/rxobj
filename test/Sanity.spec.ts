import { should, sandbox } from './setup';

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

      stub();

      should.equal(1, stub.callCount);
    });
  });

  describe('for sinon-chai', () => {
    it('can use should to assert sinon properties', () => {
      const stub = sandbox.stub();

      stub();

      stub.should.have.been.calledOnce;
    });
  });
});
