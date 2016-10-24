import './setup';
import { ScheduledSubject } from '../src/ScheduledSubject';
import { ReactiveApp } from '../src/ReactiveApp';
import { Observable, BehaviorSubject } from 'rxjs';

describe('ScheduledSubject', () => {
  describe('next', () => {
    it('passes calls to internal subject', () => {
      const subject = new BehaviorSubject(0);
      const ss = new ScheduledSubject(ReactiveApp.mainScheduler, null, subject);

      ss.next(1);
      subject.value.should.eql(1);
    });
  });

  describe('error', () => {
    it('passes calls to internal subject', (done) => {
      const subject = new BehaviorSubject(0);
      const ss = new ScheduledSubject(ReactiveApp.mainScheduler, null, subject);

      ss.subscribe(() => null, x => {
        x.should.eql(1);

        subject.hasError.should.be.true;

        done();
      });

      ss.error(1);
    });
  });

  describe('complete', () => {
    it('passes calls to internal subject', (done) => {
      const subject = new BehaviorSubject(0);
      const ss = new ScheduledSubject(ReactiveApp.mainScheduler, null, subject);

      ss.subscribe(() => null, () => null, () => {
        done();
      });

      ss.complete();
    });
  });

  describe('subscribe', () => {
    it('unsubscribes the default observer', () => {
      const subject1 = new BehaviorSubject(0);
      const subject2 = new BehaviorSubject(0);
      const ss = new ScheduledSubject(ReactiveApp.mainScheduler, subject1);

      ss.next(1);
      subject1.value.should.eql(1);

      ss.subscribe(subject2);

      ss.next(2);
      subject1.value.should.eql(1);
      subject2.value.should.eql(2);
    });

    it('re-subscribes the default observer', () => {
      const subject1 = new BehaviorSubject(0);
      const subject2 = new BehaviorSubject(0);
      const ss = new ScheduledSubject(ReactiveApp.mainScheduler, subject1);

      ss.next(1);
      subject1.value.should.eql(1);

      Observable.using(
        () => ss.subscribe(subject2),
        x => {
          ss.next(2);
          subject1.value.should.eql(1);
          subject2.value.should.eql(2);

          x.unsubscribe();
        }
      ).subscribe();

      ss.next(3);
      subject1.value.should.eql(3);
      subject2.value.should.eql(2);
    });
  });
});
