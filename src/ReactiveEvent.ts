export class ReactiveEvent<TSource, TValue> {
  constructor(public source: TSource, public value: TValue) {
  }
}
