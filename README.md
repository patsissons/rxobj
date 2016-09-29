# Reactive Object Framework

> This project is not stable and is in development. If you'd like to contribute, please submit a Pull Request.

This project is designed to provide a very ***minimalistic*** approach to **MVVM** *style* reactive objects using [RxJS](https://github.com/ReactiveX/RxJS).

[![Build Status](https://img.shields.io/travis/patsissons/rxobj.svg?branch=develop)](https://travis-ci.org/patsissons/rxobj)
[![Coverage Status](https://coveralls.io/repos/github/patsissons/rxobj/badge.svg?branch=develop)](https://coveralls.io/github/patsissons/rxobj?branch=develop)
[![npm Version](https://img.shields.io/npm/v/rxobj.svg)](https://www.npmjs.com/package/rxobj)
[![npm Downloads](https://img.shields.io/npm/dt/rxobj.svg)](https://www.npmjs.com/package/rxobj)
[![npm License](https://img.shields.io/npm/l/rxobj.svg)](https://www.npmjs.com/package/rxobj)
[![Dependency Status](https://img.shields.io/versioneye/d/nodejs/rxobj.svg)](https://www.versioneye.com/nodejs/rxobj)
[![eslint-strict-style](https://img.shields.io/badge/code%20style-strict-117D6B.svg)](https://github.com/keithamus/eslint-config-strict)
[![Join the chat at https://gitter.im/rxobj/rxobj](https://badges.gitter.im/rxobj/rxobj.svg)](https://gitter.im/rxobj/rxobj?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Usage

This library is built using a few very basic components that are layered upon each other.

### ReactiveObject

This is the top level component. Extend this class to start using `rxobj`. In your subclass, use the following instance methods to create reactive members:

* `property(initialValue?)` creates a reactive **state** property (a property whose value is modified in code)
* `command(executeAction, canExecuteObservable?)` creates a reactive reactive command (gated function execution)
* `list(items?)` creates a reactive list (array with modification notifications)

Each of these reactive properties are strongly typed with generic parameters. `ReactiveProperty`'s and `ReactiveList`'s are generically typed by the values they store, and `ReactiveCommands`'s are generically typed by the execution result and the input parameters.

Additionally, properties that are themselves `ReactiveState`'s may be registered onto a `ReactiveObject` using the `registerMember(member)` function. This is particularly useful to chain observable events on child `ReactiveObject` instances.

### ReactiveState

This is a base level class that holds all the reactive state and controls how notifications are generated. All reactive members are `ReactiveState` instances, with `changing` and `changed` observable properties. Each observable will bubble events up to any owning `ReactiveObject` instance. You can subscribe to either observable property to receieve notifications of changes. All `ReactiveState` instances will always return true when accessing the `isReactive` property.

`ReactiveState` objects are strongly typed against their owning object (typically a `ReactiveObject`), the **value** of the state, and the event structure that is emitted for both `changing` and `changed` observables. The owning object may be omitted for top level reactive states (i.e., a top level `ReactiveObject`).

Access the `changing` or `changed` `Observable` properties to wire up event streams. `changing` events always happen before the change occurs, and `changed` events always happen after the change occurs.

subscribe to the `thrownErrors` `Observable` to see what errors have been handled within the `ReactiveState`.

Use `suppressChangeNotifications` to stop all notifications from happening, or `delayChangeNotifications` to redirect all notifications to a temporary buffer that will be flushed at your command. When delaying notifications, once the delay is disabled and the events are flushed, all events will be *de-duplicated* to prevent redundant events. For `ReactiveObjects` instances, the *de-duplication* process will remove events with duplicate state `name` values. For all other `ReactiveState` instances, *de-duplication* simply removes identical adjacent values.

`ReactiveState` instances will try to automatically detect their own property name (via their owning `ReactiveObject`) if possible. This `name` property can be accessed once any event has occurred for the `ReactiveState`. ***NOTE*** that you may only assign the `name` property once, if you must perform manual name assignment then be sure not to assign more than once.

`ReactiveState` instances will attempt to keep track of their *current* `value`, which by default is their most recent `changed` event value. The `ReactiveState` based classes in this library support providing a more meaningful `value` for the state. This `value` property is used in the `whenAnyValue` function/augumentation.

### ReactiveEvent

All notifications come in the form of a `ReactiveEvent`. Each event has a source and a value. The source is always the `ReactiveState` instance that generated the event, and the value contains some context about the change (each type of `ReactiveState` has a different type of `ReactiveEvent` value).

### ReactiveApp

This static class holds the `defaultErrorHandler` and the `mainScheduler`. Feel free to override the `defaultErrorHandler` to perform custom global error handling (default is simply `console.error`).

### Augmentations

This library augments some classes with utility functions to simplify some common development strategies.

#### Observable Augmentations

Given an `Observable<Param>` instance we can execute `invokeCommand` to chain an observable to a command execution.

* `invokeCommand(ReactiveObject, ReactiveCommand): Subscription`
* `invokeCommand(ReactiveObject, (ReactiveObject, Param) => ReactiveCommand): Subscription`

The first signature is for executing a static command, the second is for executing a dynamic command (i.e. a command that can be dependent on the value of the observable, the parameter). The result of this function is the resulting Subscription that represents the observable connection.

Given an `Observable<T>` instance we can execute `pausableBuffer` to create a *pauseable* buffered observable.

* `pausableBuffer(Observable<boolean>, (T[]) => T[]): Observable<T>`

This function accepts an observable which determines if the buffer is paused or not, and a delegate to support accumulated value translation when the buffer is *unpaused* (this is used to *de-duplicate* results in `ReactiveState`).

Given an `Observable<TValue>` instance we can execute `toProperty` to produce a read only `ReactiveProperty` instance that is driven by the observable stream.

* `toProperty(ReactiveObject, TValue?): ReactiveProperty`

This function allows you to inject an initial value before the source observable has even produced any events so that the resulting `ReactiveProperty` may contain an initial value instead of `undefined`.

#### Array Augmentations

Given an `Array<T>` instance we can execute `toList` to produce a `ReactiveList` instance.

* `toList(ReactiveObject): ReactiveList`

#### ReactiveObject Augmentations

These augmentations are available both as instance methods on any ReactiveObject as well as static methods applied to the API surface. All of these augmentations take a source state as the first parameter and then produce some observable result. All three of these augmentation variants support a special signature that simply watches the source state for changes and produces the observable result using a delegate function for that source.

* `whenAnyObservable(any, (any) => TResult): Observable<TResult>`
* `whenAnyObservable(any, (any) => Observable<T1>, (T1) => TResult): Observable<TResult>`
* `whenAnyObservable(any, (any) => Observable<T1>, (any) => Observable<T2>, (T1, T2) => TResult): Observable<TResult>`

`whenAnyObservable` functions require that each member delegate returns an observable stream. The combination of values for each stream event will then be remapped to an observable result. ***NOTE*** that due to this variant using observables directly, no results will be generated until all members have generated at least one event. This means that when using this augmentation you may want to use a `startWith` at the end of your observable member composition.

* `whenAnyState(ReactiveObject, (ReactiveObject) => TResult): Observable<TResult>`
* `whenAnyState(ReactiveObject, (ReactiveObject) => T1, (T1) => TResult): Observable<TResult>`
* `whenAnyState(ReactiveObject, (ReactiveObject) => T1, (ReactiveObject) => T2, (T1, T2) => TResult): Observable<TResult>`

`whenAnyState` functions require that each member delegate returns a `ReactiveState` value. This variant will return a result immediately and the mapping function will be passed each member `ReactiveState` for projection. This variant is useful if there is a need project internals of the `ReactiveState` as part of the result observable stream.

* `whenAnyValue(ReactiveObject, (ReactiveObject) => TResult): Observable<TResult>`
* `whenAnyValue(ReactiveObject, (ReactiveObject) => T1, (T1) => TResult): Observable<TResult>`
* `whenAnyValue(ReactiveObject, (ReactiveObject) => T1, (ReactiveObject) => T2, (T1, T2) => TResult): Observable<TResult>`

`whenAnyValue` functions require that each member delgate returns a `ReactiveState` value. This is the most common variant as it will automatically project the `ReactiveState`'s `value` property prior to the final projection delegate. This means that when generating a result observable stream, only the state values are provided. This variant also returns a result immediately, using the current value of each `ReactiveState` member as the initial value.

Currently there are only three overloads of each `whenAny` variant. This will change in the comming future and more will be added, along with an additional overload that is unbounded (but also untyped).

## Example

A simple example based on the [ReactiveUI](http://reactiveui.net/) example.

```ts
import { Observable } from 'rxjs';
import * as rxo from 'rxobj';

export interface SearchService {
  getResults(query: string): Observable<string[]>;
}

export class SearchViewModel extends rxo.ReactiveObject {
  public queryText: rxo.ReactiveProperty<this, string>;
  public search: rxo.ReactiveCommand<this, string, string[]>;
  public searchResults: rxo.ReactiveList<this, string>;

  constructor(private searchService: SearchService) {
    super();

    this.queryText = this.property('');
    this.searchResults = this.list<string>();

    const canSearch = this
      .whenAnyValue(this, (x: this) => x.queryText, x => x != null && x.trim().length > 0)
      .distinctUntilChanged()
      .startWith((this.queryText.value || '').length > 0);

    this.search = this.command((queryText: string) => this.searchService.getResults(queryText), canSearch);

    this.add(
      this.search.results
        .subscribe(x => {
          this.searchResults.reset(...x);
        })
    );

    this.search.thrownErrors
      .subscribe(this.thrownErrorsHandler.next);

    this
      .whenAnyValue(this, x => x.queryText, x => x)
      .debounceTime(1000)
      .invokeCommand(this, x => x.search);
  }
}
```

## Attribution

The library design is loosely based on the work of [ReactiveUI](https://github.com/reactiveui/ReactiveUI) and [WebRx](https://github.com/WebRxJS/WebRx).
