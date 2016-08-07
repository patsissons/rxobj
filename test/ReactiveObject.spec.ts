import * as chai from 'chai';
// import * as sinon from 'sinon';
import setup from './setup';
const should = setup(chai);

import { Subject } from 'rxjs';
import { ReactiveObject } from '../src/ReactiveObject';

describe('ReactiveObject', () => {
  class TestObject extends ReactiveObject {
    public valueProp = this.property<number>();
    public subject = new Subject<number>();
    public streamProp = this.propertyFrom(this.subject);
  }

  describe('changing', () => {
    it('can generate notifications from changing value properties', (done) => {
      const obj = new TestObject();

      obj.changing.subscribe(x => {
        should.exist(x);
        should.exist(x.source);
        should.exist(x.value);
        should.exist(x.value.member);
        should.exist(x.value.memberName);

        x.source.should.equal(obj);
        x.value.member.should.eql(obj.valueProp);
        x.value.memberName.should.eql('valueProp');

        done();
      });

      obj.valueProp.value = 1;
    });

    it('can generate notifications from changed value properties', (done) => {
      const obj = new TestObject();

      obj.changed.subscribe(x => {
        should.exist(x);
        should.exist(x.source);
        should.exist(x.value);
        should.exist(x.value.member);
        should.exist(x.value.memberName);

        x.source.should.equal(obj);
        x.value.member.should.eql(obj.valueProp);
        x.value.memberName.should.eql('valueProp');

        done();
      });

      obj.valueProp.value = 1;
    });

    it('can generate notifications from changing stream properties', (done) => {
      const obj = new TestObject();

      obj.changing.subscribe(x => {
        should.exist(x);
        should.exist(x.source);
        should.exist(x.value);
        should.exist(x.value.member);
        should.exist(x.value.memberName);

        x.source.should.equal(obj);
        x.value.member.should.eql(obj.streamProp);
        x.value.memberName.should.eql('streamProp');

        done();
      });

      obj.subject.next(1);
    });

    it('can generate notifications from changed stream properties', (done) => {
      const obj = new TestObject();

      obj.changed.subscribe(x => {
        should.exist(x);
        should.exist(x.source);
        should.exist(x.value);
        should.exist(x.value.member);
        should.exist(x.value.memberName);

        x.source.should.equal(obj);
        x.value.member.should.eql(obj.streamProp);
        x.value.memberName.should.eql('streamProp');

        done();
      });

      obj.subject.next(1);
    });
  });
});
