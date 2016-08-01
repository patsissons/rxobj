import * as chai from 'chai';
// import * as sinon from 'sinon';
import setup from './setup';
const should = setup(chai);

import { Observable } from 'rxjs';
import { ReactiveStreamProperty, ReactiveValueProperty } from '../src/ReactiveProperty';

describe('ReactiveProperty', () => {
  const testOwner = new Object();
  const testValue = 'testing';

  describe('constructor', () => {
    it('stores the owner', () => {
      const prop = new ReactiveValueProperty(testOwner);

      should.exist(prop.owner);
      prop.owner.should.equal(testOwner);
    });

    it('can start with an initial value', () => {
      const prop = new ReactiveValueProperty(testOwner, testValue);

      should.exist(prop.value);
      prop.value.should.equal(testValue);
    });
  });

  describe('value', () => {
    it('can act as a getter', () => {
      const prop = new ReactiveValueProperty(testOwner, testValue);

      should.exist(prop.value);
      prop.value.should.equal(testValue);
    });
  });

  describe('changing', () => {
    it('can generate notifications with the source and incoming value', (done) => {
      const prop = new ReactiveValueProperty(testOwner, '');

      prop.changing.subscribe(x => {
        should.exist(x);
        should.exist(x.source);
        should.exist(x.value);

        x.source.should.equal(prop);
        x.value.should.eql(testValue);

        done();
      });

      prop.value = testValue;
    });

    it('can generate notifications before a value change', (done) => {
      const prop = new ReactiveValueProperty(testOwner, '');

      prop.changing.subscribe(x => {
        x.source.value.should.eql('');
        x.value.should.eql(testValue);

        done();
      });

      prop.value = testValue;
    });
  });

  describe('changed', () => {
    it('can generate notifications with the source and incoming value', (done) => {
      const prop = new ReactiveValueProperty(testOwner, '');

      prop.changed.subscribe(x => {
        should.exist(x);
        should.exist(x.source);
        should.exist(x.value);

        x.source.should.equal(prop);
        x.value.should.eql(testValue);

        done();
      });

      prop.value = testValue;
    });

    it('can generate notifications after a value change', (done) => {
      const prop = new ReactiveValueProperty(testOwner, '');

      prop.changed.subscribe(x => {
        x.source.value.should.eql(testValue);
        x.value.should.eql(testValue);

        done();
      });

      prop.value = testValue;
    });
  });

  describe('thrownErrors', () => {
    it('can catch errors in notification handlers', (done) => {
      const prop = new ReactiveValueProperty(testOwner, '');

      prop.changed.subscribe(x => {
        throw 'testError';
      });

      prop.thrownErrors.subscribe(x => {
        should.exist(x);
        x.should.eql('testError');

        done();
      });

      prop.value = testValue;
    });
  });

  describe('ReactiveStreamProperty', () => {
    describe('constructor', () => {
      it('initializes with an observable source', () => {
        const source = Observable.of(testValue);
        const prop = new ReactiveStreamProperty(source, testOwner);

        should.exist(prop.source);
        prop.source.should.equal(source);
        should.exist(prop.value);
        prop.value.should.eql(testValue);
      });
    });
  });

  describe('ReactiveValueProperty', () => {
    describe('constructor', () => {
      it('initializes with a value handler source', () => {
        const prop = new ReactiveValueProperty(testOwner);

        should.exist(prop.source);
      });
    });

    describe('value', () => {
      it('can act as a setter', () => {
        const prop = new ReactiveValueProperty(testOwner);

        prop.value = testValue;

        should.exist(prop.value);
        prop.value.should.equal(testValue);
      });
    });
  });
});
