import './setup';

import { Observable, Subject, BehaviorSubject } from 'rxjs';
import '../src/Extensions';

describe('PausableBuffer', () => {
  it('can buffer stream events while paused', () => {
    const source = new Subject();
    const sink = new BehaviorSubject(0);
    let count = 0;
    const pauser = new BehaviorSubject(false);
    source
      .pausableBuffer(pauser)
      .do(() => { ++count; })
      .subscribe(sink);

    sink.value.should.eql(0);

    source.next(1);
    sink.value.should.eql(1);
    count.should.eql(1);

    pauser.next(true);

    source.next(2);
    sink.value.should.eql(1);
    count.should.eql(1);

    source.next(3);
    sink.value.should.eql(1);
    count.should.eql(1);

    pauser.next(false);
    sink.value.should.eql(3);

    count.should.eql(3);
  });

  it('will flush the buffer when the source completes', () => {
    const source = new Subject();
    let count = 0;
    source
      .pausableBuffer(Observable.of(true))
      .do(() => { ++count; })
      .subscribe();

    source.next(1);
    source.next(2);
    source.next(3);
    count.should.eql(0);

    source.complete();
    count.should.eql(3);
  });
});
