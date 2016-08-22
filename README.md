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
* `propertyFrom(source, initialValue?)` creates a reactive **stream** property (a property whose value is modified by an observable source)
* `command(executeAction, canExecuteObservable?)` creates a reactive reactive command (gated function execution)
* `list(items?)` creates a reactive list (array with modification notifications)

All reactive members (and the `ReactiveObject` itself) are `ReactiveState` instances, with `changing` and `changed` observable properties. Each observable will bubble events up to the owning `ReactiveObject` instance. You can subscribe to either observable property to receieve notifications of changes.

### ReactiveState

This is a base level class that holds all the reactive state and controls how notifications are generated. Both `ReactiveObject` and `ReactiveProperty` extend this class.

Access `changing` or `changed` `Observable` properties to wire up event streams. `changing` events always happen before the change occurs, and `changed` events always happen after the change occurs.

subscribe to the `thrownErrors` `Observable` to see what errors have been handled within the `ReactiveState`.

Use `suppressChangeNotifications` to stop all notifications from happening, or `delayChangeNotifications` to redirect all notifications to a temporary buffer that will be flushed at your command.

### ReactiveEvent

All notifications come in the form of a `ReactiveEvent`. Each event has a source and a value. The source is always the `ReactiveState` instance that generated the event, and the value contains some context about the change (each type of `ReactiveState` has a different type of `ReactiveEvent` value).

### ReactiveApp

This static class holds the `defaultErrorHandler` and the `mainScheduler`. Feel free to override the `defaultErrorHandler` to perform custom global error handling (default is simply `console.error`).

## Example

A simple example based on the [ReactiveUI](http://reactiveui.net/) example.

```ts
interface SearchService {
  getResults(query: string): string[];
}

interface ErrorHandler {
  handleError(error: Error): void;
}

class SearchViewModel extends ReactiveObject {
  public queryText: ReactiveValueProperty<this, string>;
  public search: ReactiveCommand<this, string[]>;
  public searchResults: ReactiveList<this, string>;

  constructor(private searchService: SearchService, private errorHandler: ErrorHandler) {
    super();

    this.queryText = this.property('');

    const canSearch = this.queryText.changed
      .map(x => x.value)
      .map(x => x != null && x.trim().length > 0)
      .distinctUntilChanged()
      .startWith((this.queryText.value || '').length > 0);

    this.search = this.command(() => {
      return this.searchService.getResults(this.queryText.value);
    }, canSearch);

    this.searchResults = this.list<string>();

    this.search.results
      .subscribe(x => {
        this.searchResults.clear();
        this.searchResults.push(...x);
      });

    this.search.thrownErrors
      .subscribe(x => {
        this.errorHandler.handleError(x);
      });

    this.queryText.changed
      .map(x => x.value)
      .debounceTime(1000)
      .subscribe(() => {
        this.search.execute();
      });
  }
}
```

## Attribution

The library design is loosely based on the work of [ReactiveUI](https://github.com/reactiveui/ReactiveUI) and [WebRx](https://github.com/WebRxJS/WebRx).
