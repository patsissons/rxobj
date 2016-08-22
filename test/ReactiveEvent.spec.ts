import './setup';

import { ReactiveEvent } from '../src/ReactiveEvent';

describe('ReactiveEvent', () => {
  describe('constructor', () => {
    it('should produce an event source and value', () => {
      const src = new Object();
      const value = 'testing';

      const event = new ReactiveEvent(src, value);

      event.source.should.eql(src);
      event.value.should.eql(value);
    });
  });
});
