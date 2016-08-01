import { Observable } from 'rxjs';
import { Scheduler } from 'rxjs/Scheduler';

import { ReactiveState } from './ReactiveState';
import { ReactiveEvent } from './ReactiveEvent';
import { ReactiveProperty, ReactiveStreamProperty, ReactiveValueProperty } from './ReactiveProperty';

export interface ReactivePropertyEventValue {
  property: ReactiveProperty<ReactiveObject, any>;
  propertyName: string;
}

export abstract class ReactiveObject extends ReactiveState<ReactiveEvent<ReactiveObject, ReactivePropertyEventValue>> {
  constructor(errorScheduler?: Scheduler) {
    super(errorScheduler);

    this.properties = [];
  }

  protected properties: ReactiveProperty<ReactiveObject, any>[];

  private getPropertyName(prop: ReactiveProperty<ReactiveObject, any>) {
    if (prop.name == null) {
      Object
        .getOwnPropertyNames(this)
        .map(name => ({ name, prop: <ReactiveProperty<ReactiveObject, any>>(<any>this)[name] }))
        .filter(x => x.prop != null && x.prop.owner === this && x.prop.name == null)
        .forEach(x => {
          x.prop.name = x.name;
        });
    }

    return prop.name;
  }

  protected registerProperty(prop: ReactiveProperty<ReactiveObject, any>) {
    this.add(
      prop.changing
        .subscribe(x => {
          this.notifyPropertyChanging(() => new ReactiveEvent(this, {
            property: x.source,
            propertyName: this.getPropertyName(x.source),
          }));
        }, this.thrownErrorsHandler.next)
    );

    this.add(
      prop.changed
        .subscribe(x => {
          this.notifyPropertyChanged(() => new ReactiveEvent(this, {
            property: x.source,
            propertyName: this.getPropertyName(x.source),
          }));
        }, this.thrownErrorsHandler.next)
    );

    this.properties.push(prop);
  }

  protected propertyFrom<T>(source: Observable<T>, initialValue?: T, errorScheduler?: Scheduler) {
    const prop = new ReactiveStreamProperty(source, this, initialValue, errorScheduler);

    this.registerProperty(prop);

    return prop;
  }

  protected property<T>(initialValue?: T) {
    const prop = new ReactiveValueProperty(this, initialValue);

    this.registerProperty(prop);

    return prop;
  }
}
