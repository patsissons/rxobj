// import * as chai from 'chai';
// import * as sinon from 'sinon';
// import * as sinonChai from 'sinon-chai';



export default function setup(chai: Chai.ChaiStatic) {
  chai.use(require('sinon-chai'));

  return chai.should();
}
