export class Wrapper<T> {
  // either remove the public (storage) decoration to allow proper generic typing
  constructor(public source: T) {
  }
}

export class BaseClass {
  // or comment this line out to allow proper generic typing
  public failMember: Wrapper<this>;
}
