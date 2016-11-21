import { should, sandbox } from './setup';

import { Lazy } from '../src/Lazy';

describe('Lazy', () => {
  describe('value', () => {
    it('is always null when constructed with no parameters', () => {
      const val = new Lazy();

      should.not.exist(val.value);
    });

    it('returns the same value every time', () => {
      const returnValue = { test: 'test' };
      const stub = sandbox.stub().returns(returnValue);
      const val = new Lazy(stub);

      const resultValue1 = val.value;
      const resultValue2 = val.value;

      should.exist(resultValue1);
      should.exist(resultValue2);

      resultValue1.should.equal(returnValue);
      resultValue2.should.equal(returnValue);
      resultValue1.should.equal(resultValue2);

      stub.should.have.been.calledOnce;
    });

    it('returns a new value every time when configured to be transient', () => {
      const returnValue = { test: 'test' };
      const stub = sandbox.stub().returns(returnValue);
      const val = new Lazy(stub, true);

      should.exist(val.value);
      should.exist(val.value);

      stub.should.have.callCount(2);
    });
  });
});
