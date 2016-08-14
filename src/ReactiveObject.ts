import { Observable } from 'rxjs';
import { Scheduler } from 'rxjs/Scheduler';

import { ReactiveState } from './ReactiveState';
import { ReactiveEvent } from './ReactiveEvent';
import { ReactiveStreamProperty, ReactiveValueProperty } from './ReactiveProperty';
import { ReactiveCommand } from './ReactiveCommand';

export type ReactiveMember = ReactiveState<ReactiveEvent<ReactiveState<any>, any>>;

export interface ReactivePropertyEventValue {
  member: ReactiveState<any>;
  memberName: string;
}

// this is an internal interface
interface NamedReactiveMember extends ReactiveMember {
  name: string;
}

export abstract class ReactiveObject extends ReactiveState<ReactiveEvent<ReactiveObject, ReactivePropertyEventValue>> {
  constructor(errorScheduler?: Scheduler) {
    super(errorScheduler);

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

  protected registerMember(member: ReactiveMember) {
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

  protected propertyFrom<T>(source: Observable<T>, initialValue?: T, errorScheduler?: Scheduler) {
    const prop = new ReactiveStreamProperty(source, this, initialValue, errorScheduler);

    this.registerMember(prop);

    return prop;
  }

  protected property<T>(initialValue?: T) {
    const prop = new ReactiveValueProperty(this, initialValue);

    this.registerMember(prop);

    return prop;
  }

  protected command<TResult>(executeAction: (param: any) => TResult, canExecute?: Observable<boolean>, errorScheduler?: Scheduler) {
    const cmd = new ReactiveCommand(this, executeAction, canExecute, errorScheduler);

    this.registerMember(cmd);

    return cmd;
  }
}
