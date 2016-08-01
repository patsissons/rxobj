import { Observable, Operator, Subscriber, BehaviorSubject } from 'rxjs';

export function pausableBuffer<T>(isPausedObservable: Observable<boolean>, closeBuffer?: (buffer: T[]) => T[]) {
  const source = <Observable<T>>this;

  return source.lift(new PausableBufferOperator(isPausedObservable, closeBuffer));
}

export interface PausableBufferSignature<T> {
  (isPausedObservable: Observable<boolean>, closeBuffer?: (buffer: T[]) => T[]): Observable<T>;
}

class PausableBufferOperator<T> implements Operator<T, T> {
  constructor(private isPausedObservable: Observable<boolean>, private closeBuffer?: (buffer: T[]) => T[]) {
  }

  call(subscriber: Subscriber<T>, source: any) {
    return source._subscribe(new PausableBufferSubscriber(subscriber, this.isPausedObservable, this.closeBuffer));
  }
}

class PausableBufferSubscriber<T> extends Subscriber<T> {
  constructor(destination: Subscriber<T>, isPausedObservable: Observable<boolean>, protected closeBuffer?: (buffer: T[]) => T[]) {
    super(destination);

    if (this.closeBuffer == null) {
      this.closeBuffer = (x => x);
    }

    this.isPausedSubject = new BehaviorSubject(false);
    this.buffer = [];

    this.add(
      isPausedObservable
        // map null/undefined to false
        .map(x => x === true)
        .distinctUntilChanged()
        .subscribe(this.isPausedSubject)
    );

    this.add(
      this.isPausedSubject
        .subscribe(x => this.onPauseChanged())
    );
  }

  protected isPausedSubject: BehaviorSubject<boolean>;
  protected buffer: T[];

  protected onPauseChanged() {
    if (this.isPausedSubject.value === false) {
      this.flushBuffer();
    }
  }

  protected flushBuffer() {
    if (this.buffer.length > 0) {
      const buffer = this.buffer;
      this.buffer = [];

      this
        .closeBuffer(buffer)
        .forEach(x => super._next(x));
    }
  }

  _next(value: T) {
    if (this.isPausedSubject.value === true) {
      this.buffer.push(value);
    } else {
      super._next(value);
    }
  }

  _complete() {
    this.flushBuffer();

    super._complete();
  }
}
