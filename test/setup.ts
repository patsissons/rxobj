import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import 'es6-shim';

chai.use(sinonChai);

beforeEach(() => {
  sandbox = sinon.sandbox.create();
});

afterEach(() => {
  sandbox.restore();
});

export const subscribeNotCalledError = new Error('Subscribe not called');

export const should = chai.should();

export let sandbox: sinon.SinonSandbox;
