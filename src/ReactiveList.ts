import { Scheduler } from 'rxjs/Scheduler';
import { ReactiveEvent } from './ReactiveEvent';
import { ReactiveState } from './ReactiveState';

declare global {
  interface Array<T> {
    toReactiveList<TObject>(owner: TObject, errorScheduler?: Scheduler): ReactiveList<TObject, T>;
  }
}

function toReactiveList<TObject, TValue>(owner: TObject, errorScheduler?: Scheduler) {
  const thisArg: Array<TValue> = this;

  return new ReactiveList(owner, thisArg, errorScheduler);
}

Array.prototype.toReactiveList = toReactiveList;

export enum ReactiveListChangeAction {
  Add,
  Remove,
  Replace,
  Move,
  Reset,
}

export interface ReactiveListEventValue<TValue> {
  action: ReactiveListChangeAction;
  newItems?: TValue[];
  oldItems?: TValue[];
  newStartingIndex?: number;
  oldStartingIndex?: number;
}

export class ReactiveList<TObject, TValue> extends ReactiveState<ReactiveEvent<ReactiveList<TObject, TValue>, ReactiveListEventValue<TValue>>> {
  constructor(public owner: TObject, items: TValue[] = [], errorScheduler?: Scheduler) {
    super(errorScheduler);

    this.items = items;
  }

  private items: TValue[];

  private wrapArrayFunction<TResult>(func: Function, args: IArguments, eventArgs: ReactiveListEventValue<TValue>) {
    const sub = this.changing.subscribe(x => {
      if (x.value === eventArgs) {
        func.apply(x.source.items, args);

        x.source.notifyPropertyChanged(() => new ReactiveEvent(x.source, x.value));

        sub.unsubscribe();
      }
    });

    this.notifyPropertyChanging(() => new ReactiveEvent(this, eventArgs));
  }

  public get(index: number) {
    return this.items[index];
  }

  public set(index: number, value: TValue) {
    const eventArgs = <ReactiveListEventValue<TValue>> {
      action: ReactiveListChangeAction.Replace,
      newItems: [ value ],
      newStartingIndex: index,
      oldItems: this.items.slice(index, index + 1),
      oldStartingIndex: index,
    };

    this.wrapArrayFunction(() => { this.items[index] = value; }, null, eventArgs);
  }

  public asArray() {
    return this.items;
  }

  public toArray() {
    return this.items.slice();
  }

  public clear() {
    this.reset();
  }

  public reset(...items: TValue[]) {
    this.splice(0, this.items.length, ...items);
  }

  // Array<TValue> Implementation

  get length() {
    return this.items.length;
  }

  push(...items: TValue[]) {
    this.wrapArrayFunction<number>(this.items.push, arguments, {
      action: ReactiveListChangeAction.Add,
      newItems: items,
      newStartingIndex: this.items.length,
    });
  }

  pop() {
    this.wrapArrayFunction<TValue>(this.items.pop, arguments, {
      action: ReactiveListChangeAction.Remove,
      oldItems: this.items.slice(-1),
      oldStartingIndex: this.items.length - 1,
    });
  }

  concat<T extends TValue[]>(...items: T[]): TValue[];
  concat(...items: TValue[]): TValue[] {
    return this.items.concat.apply(this.items, arguments);
  }

  join(separator?: string): string {
    return this.items.join.apply(this.items, arguments);
  }

  reverse() {
    this.wrapArrayFunction<TValue[]>(this.items.reverse, arguments, {
      action: ReactiveListChangeAction.Reset,
    });
  }

  shift() {
    this.wrapArrayFunction<TValue>(this.items.shift, arguments, {
      action: ReactiveListChangeAction.Remove,
      oldItems: this.items.slice(0, 1),
      oldStartingIndex: 0,
    });
  }

  slice(start?: number, end?: number): TValue[] {
    return this.items.slice.apply(this.items, arguments);
  }

  sort(compareFn?: (a: TValue, b: TValue) => number) {
    this.wrapArrayFunction<TValue[]>(this.items.sort, arguments, {
      action: ReactiveListChangeAction.Reset,
    });
  }

  splice(start: number): void;
  splice(start: number, deleteCount: number, ...items: TValue[]): void;
  splice() {
    // we have to reset here because this could be an add, a remove, a replace, or some combination
    this.wrapArrayFunction<TValue[]>(this.items.splice, arguments, {
      action: ReactiveListChangeAction.Reset,
    });
  }

  unshift(...items: TValue[]) {
    this.wrapArrayFunction<number>(this.items.unshift, arguments, {
      action: ReactiveListChangeAction.Add,
      newItems: items,
      newStartingIndex: 0,
    });
  }

  indexOf(searchElement: TValue, fromIndex?: number): number {
    return this.items.indexOf.apply(this.items, arguments);
  }

  lastIndexOf(searchElement: TValue, fromIndex?: number): number {
    return this.items.lastIndexOf.apply(this.items, arguments);
  }

  every(callbackfn: (value: TValue, index: number, array: TValue[]) => boolean, thisArg?: any): boolean {
    return this.items.every.apply(this.items, arguments);
  }

  some(callbackfn: (value: TValue, index: number, array: TValue[]) => boolean, thisArg?: any): boolean {
    return this.items.some.apply(this.items, arguments);
  }

  forEach(callbackfn: (value: TValue, index: number, array: TValue[]) => void, thisArg?: any): void {
    return this.items.forEach.apply(this.items, arguments);
  }

  map<T>(callbackfn: (value: TValue, index: number, array: TValue[]) => T, thisArg?: any): T[] {
    return this.items.map.apply(this.items, arguments);
  }

  filter(callbackfn: (value: TValue, index: number, array: TValue[]) => boolean, thisArg?: any): TValue[] {
    return this.items.filter.apply(this.items, arguments);
  }

  reduce<T>(callbackfn: (previousValue: T, currentValue: TValue, currentIndex: number, array: TValue[]) => T, initialValue: T): T;
  reduce(callbackfn: (previousValue: TValue, currentValue: TValue, currentIndex: number, array: TValue[]) => TValue, initialValue?: TValue): TValue {
    return this.items.reduce.apply(this.items, arguments);
  }

  reduceRight<T>(callbackfn: (previousValue: T, currentValue: TValue, currentIndex: number, array: TValue[]) => T, initialValue: T): T;
  reduceRight(callbackfn: (previousValue: TValue, currentValue: TValue, currentIndex: number, array: TValue[]) => TValue, initialValue?: TValue): TValue {
    return this.items.reduceRight.apply(this.items, arguments);
  }

  // Array<T> ES6 Shims

  find(predicate: (value: TValue, index: number, obj: Array<TValue>) => boolean, thisArg?: any): TValue {
    return this.items.find.apply(this.items, arguments);
  }

  findIndex(predicate: (value: TValue) => boolean, thisArg?: any): number {
    return this.items.findIndex.apply(this.items, arguments);
  }

  fill(value: TValue, start?: number, end?: number) {
    // we have to reset here because this could be an add, a replace, or both
    this.wrapArrayFunction<TValue[]>(this.items.fill, arguments, {
      action: ReactiveListChangeAction.Reset,
    });
  }

  copyWithin(target: number, start: number, end?: number) {
    // we have to reset here because this could be an add, a replace, or both
    this.wrapArrayFunction<TValue[]>(this.items.copyWithin, arguments, {
      action: ReactiveListChangeAction.Reset,
    });
  }

  entries(): Iterator<[number, TValue]> {
    return this.items.entries.apply(this.items, arguments);
  }

  keys(): Iterator<number> {
    return this.items.keys.apply(this.items, arguments);
  }

  values(): Iterator<TValue> {
    return this.items.values.apply(this.items, arguments);
  }
}
