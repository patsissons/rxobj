import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import 'es6-shim';

const subscribeNotCalledError = new Error('Subscribe not called');
const should = chai.should();
let sandbox: sinon.SinonSandbox;

chai.use(sinonChai);

beforeEach(() => {
  sandbox = sinon.sandbox.create();
});

afterEach(() => {
  sandbox.restore();
});

export { should, sinon, sandbox, subscribeNotCalledError };
