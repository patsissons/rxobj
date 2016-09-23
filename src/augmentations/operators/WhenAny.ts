import { Observable } from 'rxjs';
import { ReactiveState, AnyReactiveState } from '../../ReactiveState';
import { ReactiveObjectType } from '../../ReactiveObject';

export interface WhenAnyObservableSignature {
  <TSource, TResult>(source: TSource, selector: (source: TSource) => TResult): Observable<TResult>;
  <TSource, T1, TResult>(source: TSource, t1: (source: TSource) => Observable<T1>, selector: (t1: T1) => TResult): Observable<TResult>;
  <TSource, T1, T2, TResult>(source: TSource, t1: (source: TSource) => Observable<T1>, t2: (source: TSource) => Observable<T2>, selector: (t1: T1, t2: T2) => TResult): Observable<TResult>;
  <TSource, T1, T2, T3, TResult>(source: TSource, t1: (source: TSource) => Observable<T1>, t2: (source: TSource) => Observable<T2>, t3: (source: TSource) => Observable<T3>, selector: (t1: T1, t2: T2, t3: T3) => TResult): Observable<TResult>;
}

export interface WhenAnyStateSignature {
  <TSource extends ReactiveObjectType, TResult>(source: TSource, selector: (source: TSource) => TResult): Observable<TResult>;
  <TSource extends ReactiveObjectType, T1 extends ReactiveState<TSource, any, any>, TResult>(source: TSource, t1: (source: TSource) => T1, selector: (t1: T1) => TResult): Observable<TResult>;
  <TSource extends ReactiveObjectType, T1 extends ReactiveState<TSource, any, any>, T2 extends ReactiveState<TSource, any, any>, TResult>(source: TSource, t1: (source: TSource) => T1, t2: (source: TSource) => T2, selector: (t1: T1, t2: T2) => TResult): Observable<TResult>;
  <TSource extends ReactiveObjectType, T1 extends ReactiveState<TSource, any, any>, T2 extends ReactiveState<TSource, any, any>, T3 extends ReactiveState<TSource, any, any>, TResult>(source: TSource, t1: (source: TSource) => T1, t2: (source: TSource) => T2, t3: (source: TSource) => T3, selector: (t1: T1, t2: T2, t3: T3) => TResult): Observable<TResult>;
}

export interface WhenAnyValueSignature {
  <TSource extends ReactiveObjectType, TResult>(source: TSource, selector: (source: TSource) => TResult): Observable<TResult>;
  <TSource extends ReactiveObjectType, T1, TResult>(source: TSource, t1: (source: TSource) => ReactiveState<TSource, T1, any>, selector: (t1: T1) => TResult): Observable<TResult>;
  <TSource extends ReactiveObjectType, T1, T2, TResult>(source: TSource, t1: (source: TSource) => ReactiveState<TSource, T1, any>, t2: (source: TSource) => ReactiveState<TSource, T2, any>, selector: (t1: T1, t2: T2) => TResult): Observable<TResult>;
  <TSource extends ReactiveObjectType, T1, T2, T3, TResult>(source: TSource, t1: (source: TSource) => ReactiveState<TSource, T1, any>, t2: (source: TSource) => ReactiveState<TSource, T2, any>, t3: (source: TSource) => ReactiveState<TSource, T3, any>, selector: (t1: T1, t2: T2, t3: T3) => TResult): Observable<TResult>;
}

function whenAny(source: any, args: any[], selector: any) {
  if (args.length === 0) {
    return (<Observable<any>>source.changed).map(() => source).startWith(source).map(selector);
  }
  else if (args.length === 1) {
    return (<Observable<any>>args[0]).map(selector);
  }
  else {
    args.push(selector);

    return Observable.combineLatest.apply(this, args);
  }
}

export function whenAnyObservable(source: any, ...members: any[]) {
  const selector = members.pop();

  const args = (<((s: any) => Observable<any>)[]>members)
    .map(x => x(source));

  return whenAny(source, args, selector);
}

export function whenAnyState(source: any, ...members: any[]) {
  const selector = members.pop();

  const args = (<((s: any) => AnyReactiveState)[]>members)
    .map(x => x(source))
    .map(x => x.changed.map(y => y.source).startWith(x));

  return whenAny(source, args, selector);
}

export function whenAnyValue(source: any, ...members: any[]) {
  const selector = members.pop();

  const args = (<((s: any) => AnyReactiveState)[]>members)
    .map(x => x(source))
    .map(x => x.changed.map(y => x.value).startWith(x.value));

  return whenAny(source, args, selector);
}
