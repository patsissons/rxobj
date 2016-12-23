import { Observable, Subscription } from 'rxjs';
import { Scheduler } from 'rxjs/Scheduler';

import { ReactiveState, AnyReactiveState, AnyReactiveEvent } from './ReactiveState';
import { ReactiveEvent } from './ReactiveEvent';
import { ReactiveProperty } from './ReactiveProperty';
import { ReactiveCommand } from './ReactiveCommand';
import { ReactiveList } from './ReactiveList';

// this export is used internally to handle registering members via augmentations
export function registerMember(owner: ReactiveObject, member: AnyReactiveState) {
  (<any>owner).registerMember(member);
}

// this export is used internally to solve a typescript generic typing issue
export interface ReactiveObjectType {
}

export class ReactiveObject extends ReactiveState<ReactiveObject, ReactiveObject, AnyReactiveState> implements ReactiveObjectType {
  constructor(owner?: ReactiveObject, scheduler?: Scheduler, errorScheduler?: Scheduler) {
    super(owner, scheduler, errorScheduler);

    this.objectMembers = [];
  }

  private objectMembers: AnyReactiveState[];

  private getMember(event: AnyReactiveEvent) {
    if (event.source.name == null) {
      this.resolveMemberNames();
    }

    return event.source;
  }

  protected get areMemberNamesResolved() {
    return this.objectMembers.length === 0 || (this.objectMembers[0].name || '').length > 0;
  }

  protected resolveMemberNames() {
    Object
      .getOwnPropertyNames(this)
      .map(name => ({ name, value: <AnyReactiveState>(<any>this)[name] }))
      .filter(x => x.value != null && x.value.isReactive === true && x.value.name == null)
      .forEach(x => {
        x.value.name = x.name;
      });
  }

  protected registerMember<T extends AnyReactiveState>(member: T) {
    if (member.owner == null) {
      member.owner = this;
    }

    this.add(
      member.changing
        .subscribe(x => {
          this.notifyPropertyChanging(() => new ReactiveEvent(this, this.getMember(x)));
        }, err => this.thrownErrorsHandler.next(err))
    );

    this.add(
      member.changed
        .subscribe(x => {
          this.notifyPropertyChanged(() => new ReactiveEvent(this, this.getMember(x)));
        }, err => this.thrownErrorsHandler.next(err))
    );

    this.add(member);
    this.objectMembers.push(member);

    return member;
  }

  protected property<TValue>(initialValue?: TValue, scheduler?: Scheduler, errorScheduler?: Scheduler) {
    return this.registerMember(new ReactiveProperty(this, initialValue, undefined, scheduler, errorScheduler));
  }

  protected command<TParam, TResult>(executeAction: (param: TParam) => Observable<TResult>, canExecute?: Observable<boolean>, scheduler?: Scheduler, errorScheduler?: Scheduler) {
    return this.registerMember(new ReactiveCommand(this, executeAction, canExecute, scheduler, errorScheduler));
  }

  protected list<TValue>(items?: TValue[], scheduler?: Scheduler, errorScheduler?: Scheduler) {
    return this.registerMember(new ReactiveList(this, items, scheduler, errorScheduler));
  }

  protected getCurrentValue() {
    return this;
  }

  public get members() {
    return this.objectMembers.slice();
  }

  delayChangeNotifications(): Subscription {
    // it's possible to unsub from this delay before any notifications
    // are emitted, which means we need to explicitly check for member
    // name resolution.
    if (this.areMemberNamesResolved === false) {
      this.resolveMemberNames();
    }

    return super.delayChangeNotifications();
  }
}
