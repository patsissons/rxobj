import { Scheduler } from 'rxjs/Scheduler';

import { should } from './setup';
import { ReactiveState } from '../src/ReactiveState';
import { ReactiveEvent } from '../src/ReactiveEvent';

export interface TestEventValue {
  oldValue: number;
  newValue: number;
}

class TestReactiveState extends ReactiveState<any, number, TestEventValue> {
  constructor(public testValue?: number, owner?: any, scheduler?: Scheduler, errorScheduler?: Scheduler) {
    super(owner, scheduler, scheduler);
  }

  getCurrentValue() {
    return this.testValue;
  }

  // this public method acts as our injection into the protected parts of ReactiveState
  public setTestValue(newValue: number) {
    const oldValue = this.value;

    this.notifyPropertyChanging(() => new ReactiveEvent(this, <TestEventValue>{
      oldValue,
      newValue,
    }));

    this.testValue = newValue;

    this.notifyPropertyChanged(() => new ReactiveEvent(this, <TestEventValue>{
      oldValue,
      newValue,
    }));
  }
}

describe.only('ReactiveState', () => {
  describe('TestReactiveState',  () => {
    it('defaults to a null value', () => {
      const state = new TestReactiveState();

      should.not.exist(state.testValue);
    });

    it('can get the current value', () => {
      const state = new TestReactiveState(1);

      should.exist(state.testValue);
      state.testValue.should.eql(1);
    });

    it('can set the test value', () => {
      const state = new TestReactiveState();

      state.setTestValue(1);
      should.exist(state.testValue);
      state.testValue.should.eql(1);
    });
  });

  describe('isReactive', () => {
    it('always returns true', () => {
      const state = new TestReactiveState();

      should.exist(state.isReactive);
      state.isReactive.should.be.true;
    });
  });

  describe('value', () => {
    it('tracks the current value', () => {
      const state = new TestReactiveState(1);

      should.exist(state.value);
      state.value.should.eql(1);

      state.setTestValue(2);
      should.exist(state.value);
      state.value.should.eql(2);
    });
  });

  describe('changing', () => {
    it('tracks changing events', () => {
      let event: ReactiveEvent<TestReactiveState, TestEventValue>;
      const state = new TestReactiveState(1);

      state.changing.subscribe(x => {
        event = x;
      });

      state.setTestValue(2);
      should.exist(event);
      should.exist(event.source);
      should.exist(event.value);
      should.exist(event.value.oldValue);
      should.exist(event.value.newValue);
      event.source.should.equal(state);
      event.value.oldValue.should.eql(1);
      event.value.newValue.should.eql(2);
    });

    it('contains the state that generated the event');
  });

  describe('changed', () => {
    it('tracks changed events');
  });
});
