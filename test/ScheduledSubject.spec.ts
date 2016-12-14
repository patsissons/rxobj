import { should } from './setup';
import { ScheduledSubject } from '../src/ScheduledSubject';
import { Scheduler, BehaviorSubject, TestScheduler } from 'rxjs';

describe.only('ScheduledSubject', () => {
  it('is a Subject', () => {
    const subject = new ScheduledSubject<number>();
    const result = new BehaviorSubject(0);

    subject.subscribe(result);
    result.value.should.eql(0);

    subject.next(1);
    result.value.should.eql(1);
  });

  it('supports a default subject observer', () => {
    const result = new BehaviorSubject(0);
    const subject = new ScheduledSubject<number>(undefined, result);

    result.value.should.eql(0);

    subject.next(1);
    result.value.should.eql(1);
  });

  it('supports a default function observer', () => {
    const result = new BehaviorSubject(0);
    const subject = new ScheduledSubject<number>(undefined, x => result.next(x));

    result.value.should.eql(0);

    subject.next(1);
    result.value.should.eql(1);
  });

  it('supports overriding the default function observer');
  it('supports restoring the default function observer');

  it('can be scheduled');

  it.only('test', (done) => {
    // const scheduler = new TestScheduler((a, b) => {
    //   debugger;
    //   a.should.eql(b);
    // });
    const scheduler = Scheduler.asap;
    const subject = new ScheduledSubject<number>(scheduler);
    const result = new BehaviorSubject(0);

    subject.subscribe(result);
    result.value.should.eql(0);

    subject.next(1);
    result.value.should.eql(0);

    result
      .skip(1)
      .take(1)
      .subscribe(x => {
        debugger;
        x.should.eql(1);
        done();
      });
  });
});
