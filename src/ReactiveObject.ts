import { Observable } from 'rxjs';
import { Scheduler } from 'rxjs/Scheduler';

import { ReactiveState } from './ReactiveState';
import { ReactiveEvent } from './ReactiveEvent';
import { ReactiveProperty } from './ReactiveProperty';
import { ReactiveCommand } from './ReactiveCommand';
import { ReactiveList } from './ReactiveList';

export type ReactiveMember = ReactiveState<ReactiveEvent<ReactiveState<any>, any>>;

export interface ReactiveMemberEventValue {
  member: ReactiveState<any>;
  memberName: string;
}

// this interface is exported internally but not to the surface API
// we use this interface to define how extensions can internally register members
export interface ReactiveMemberContainer {
  registerMember(member: ReactiveMember): void;
}

// this is an internal interface
interface NamedReactiveMember extends ReactiveMember {
  name: string;
}

export abstract class ReactiveObject extends ReactiveState<ReactiveEvent<ReactiveObject, ReactiveMemberEventValue>> {
  constructor(scheduler?: Scheduler, errorScheduler?: Scheduler) {
    super(scheduler, errorScheduler);

    this.members = [];
  }

  protected members: ReactiveMember[];

  private getMemberName(member: NamedReactiveMember) {
    if (member.name == null) {
      this.resolvePropertyNames();
    }

    return member.name;
  }

  private resolvePropertyNames() {
    Object
      .getOwnPropertyNames(this)
      .map(name => ({ name, member: <NamedReactiveMember>(<any>this)[name] }))
      .filter(x => x.member != null && x.member.isReactive === true && x.member.name == null)
      .forEach(x => {
        x.member.name = x.name;
      });
  }

  private registerMember(member: ReactiveMember) {
    this.add(
      member.changing
        .subscribe(x => {
          this.notifyPropertyChanging(() => new ReactiveEvent(this, {
            member: x.source,
            memberName: this.getMemberName(<NamedReactiveMember>x.source),
          }));
        }, this.thrownErrorsHandler.next)
    );

    this.add(
      member.changed
        .subscribe(x => {
          this.notifyPropertyChanged(() => new ReactiveEvent(this, {
            member: x.source,
            memberName: this.getMemberName(<NamedReactiveMember>x.source),
          }));
        }, this.thrownErrorsHandler.next)
    );

    this.members.push(member);
  }

  protected property<TValue>(initialValue?: TValue, scheduler?: Scheduler, errorScheduler?: Scheduler) {
    const prop = new ReactiveProperty(this, initialValue, undefined, scheduler, errorScheduler);

    this.registerMember(prop);

    return prop;
  }

  protected command<TParam, TResult>(executeAction: (param: TParam) => Observable<TResult>, canExecute?: Observable<boolean>, scheduler?: Scheduler, errorScheduler?: Scheduler) {
    const cmd = new ReactiveCommand(this, executeAction, canExecute, scheduler, errorScheduler);

    this.registerMember(cmd);

    return cmd;
  }

  protected list<TValue>(items?: TValue[], scheduler?: Scheduler, errorScheduler?: Scheduler) {
    const list = new ReactiveList(this, items, scheduler, errorScheduler);

    this.registerMember(list);

    return list;
  }
}
