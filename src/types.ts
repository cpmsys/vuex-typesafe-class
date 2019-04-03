import * as vuex from "vuex";

type Constructor<T = any> = {
  new (...args: any[]): T;
};

type RequiredKeys<T> = {
  [K in keyof T]-?: ({} extends { [P in K]: T[K] } ? never : K)
}[keyof T];

type OptionalKeys<T> = {
  [K in keyof T]-?: ({} extends { [P in K]: T[K] } ? K : never)
}[keyof T];

type StringKeys<T> = Extract<T, string>;

type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X
  ? 1
  : 2) extends (<T>() => T extends Y ? 1 : 2)
  ? A
  : B;

type WritableKeys<T> = {
  [P in keyof T]-?: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    P
  >
}[keyof T];

type ReadonlyKeys<T> = {
  [P in keyof T]-?: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    never,
    P
  >
}[keyof T];

type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never
}[keyof T];

type AsyncFunction = (...args: any) => Promise<any>;

type AsyncFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends AsyncFunction ? K : never
}[keyof T];

type NonAsyncFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function
    ? (T[K] extends AsyncFunction ? never : K)
    : never
}[keyof T];

type GeneratorFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends GeneratorFunction ? K : never
}[keyof T];

type StateKeys<T> = Exclude<WritableKeys<T>, FunctionPropertyNames<T>>;
type GetterKeys<T> = ReadonlyKeys<T>;
type ActionKeys<T> = AsyncFunctionPropertyNames<T>;

type MutationKeys<T> =
  | GeneratorFunctionPropertyNames<T>
  | NonAsyncFunctionPropertyNames<T>;

type StateMap<I> = { [P in StateKeys<I>]: I[P] };
type StateFactory<I> = () => StateMap<I>;

type GetterMap<I> = { [P in GetterKeys<I>]: () => I[P] };

type MutationMap<I> = {
  [P in MutationKeys<I>]: I[P] extends ((value: infer U, ...args: any[]) => any)
    ? (state: StateMap<I>, value: U) => void
    : never
};
type ActionMap<I> = { [P in ActionKeys<I>]: () => I[P] };

interface IVuexModule<
  T extends Constructor,
  I = InstanceType<T>,
  S = StateFactory<I> //() => Pick<I, StringKeys<StateKeys<I>>>
> {
  readonly $namespace: string;
  readonly namespaced: boolean;
  getInstance(context?: IStoreContext): I;
  state: S;
  getters: GetterMap<I>;
  mutations: MutationMap<I>;
  actions: ActionMap<I>;
  plugins?: any[];
  modules?: Record<string, IVuexModule<any>>;
}

interface IStoreLike {
  commit: vuex.Commit;
  dispatch: vuex.Dispatch;
  readonly getters: any;
  readonly state: any;
  readonly rootGetters?: any;
}

type IStoreContext = { $store: IStoreLike } | IStoreLike | any;

export {
  IStoreLike,
  IStoreContext,
  IVuexModule,
  Constructor,
  StringKeys,
  StateKeys,
  GetterKeys,
  ActionKeys,
  MutationKeys,
  StateFactory,
  StateMap,
  GetterMap,
  MutationMap,
  ActionMap
};
