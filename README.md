# Reactive Object Framework

> This project is not stable and is in development. If you'd like to contribute, please submit a Pull Request.

This project is designed to provide a ***minimalistic*** approach to reactive objects using [RxJS](https://github.com/ReactiveX/RxJS).

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

This is the top level component. Extend this class to start using `rxobj`. In your extension, use the `property` and `propertyFor` functions to create new reactive properties.

All created reactive properties will bubble events up to the owning object. You can subscribe to either `changing` or `changed`.

### ReactiveProperty

This component serves to configure the reactivity of your objects.

Create a `ReactiveValueProperty` to manually change the value and generate notificatoins.

Create a `ReactiveStreamProperty` to connect an external `Observable` source to generate notifications.

### ReactiveState

This is a base level class that holds all the reactive state and controls how notifications are generated. Both `ReactiveObject` and `ReactiveProperty` extend this class.

Access `changing` or `changed` `Observable` properties to wire up event streams. Connect to `thrownErrors` to see what errors have been handled.

Use `suppressChangeNotifications` to stop all notifications from happening, or `delayChangeNotifications` to redirect all notifications to a temporary buffer that will be flushed at your command.

### ReactiveEvent

All notifications come in the form of a `ReactiveEvent`. Each event has a source (`ReactiveProperty` for properties, `ReactiveObject` for objects) and a value.

`ReactiveProperty` values are simply the value of the property (either incoming for `changing` or current for `changed`).

`ReactiveObject` values are a compount structure containing the `ReactiveProperty` that generated the event, and the name of that property on the source object.

### ReactiveApp

This static class holds the `defaultErrorHandler` and the `mainScheduler`. Feel free to override the `defaultErrorHandler` to perform custom global error handling (default is simply `console.error`).

## Attribution

The library design is loosely based on the work of [ReactiveUI](https://github.com/reactiveui/ReactiveUI) and [WebRx](https://github.com/WebRxJS/WebRx).
