import { should } from './setup';
import { ScheduledSubject } from '../src/ScheduledSubject';
import { BehaviorSubject, TestScheduler } from 'rxjs';

describe('ScheduledSubject', () => {
  it('is a Subject', () => {
    const subject = new ScheduledSubject<number>();
    const result = new BehaviorSubject(0);

    const sub = subject.subscribe(result);
    should.exist(sub);
    result.value.should.eql(0);

    subject.next(1);
    result.value.should.eql(1);

    sub.unsubscribe();
    subject.next(2);
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

  it('supports overriding the default function observer', () => {
    const result1 = new BehaviorSubject(0);
    const result2 = new BehaviorSubject(0);
    const subject = new ScheduledSubject<number>(undefined, x => result1.next(x));

    subject.subscribe(result2);
    subject.next(1);

    result1.value.should.eql(0);
    result2.value.should.eql(1);
  });

  it('supports restoring the default function observer', () => {
    const result1 = new BehaviorSubject(0);
    const result2 = new BehaviorSubject(0);
    const subject = new ScheduledSubject<number>(undefined, x => result1.next(x));

    const sub = subject.subscribe(result2);
    sub.unsubscribe();
    subject.next(1);

    result1.value.should.eql(1);
    result2.value.should.eql(0);
  });

  it('can be scheduled', () => {
    const result = new BehaviorSubject(0);
    const scheduler = new TestScheduler(null);
    const subject = new ScheduledSubject<number>(scheduler);

    subject.subscribe(result);
    result.value.should.eql(0);

    subject.next(1);
    result.value.should.eql(0);

    scheduler.flush();
    result.value.should.eql(1);
  });
});
