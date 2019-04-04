import * as vuex from "vuex";

import { getNamespace } from "./helpers";

import {
  Constructor,
  GetterKeys,
  ActionKeys,
  MutationKeys,
  GetterMap,
  MutationMap,
  ActionMap,
  IStoreLike,
  IVuexModule,
  IStoreContext
} from "./types";

function _get(obj: any, path: string[], def: any = undefined) {
  return path.reduce((out, key) => out && out[key], obj) || def;
}

function _each<T extends Record<any, any>, K extends Extract<keyof T, string>>(
  obj: T,
  callback: (key: K, value: T[K]) => any
) {
  return Object.keys(obj).reduce(
    (out, key) => {
      out[key] = callback(key as K, obj[key]);
      return out;
    },
    {} as Record<keyof T, any>
  );
}

const NAMESPACE_SEPARATOR = "/";

/**
 * Mutation decorator
 * Converts the mutation function to a setter, which is internally supported
 */
export function Mutation(target: any, propertyKey: string): PropertyDescriptor {
  const fn = target[propertyKey];
  return {
    set: fn
  };
}

function createInstance<T extends Constructor>(
  m: IVuexModule<T>
): (context?: IStoreContext) => InstanceType<T> {
  return context => {
    const namespace = getNamespace(m);

    const store: IStoreLike = context
      ? "$store" in context
        ? context.$store
        : context
      : null;

    const namespacePath = (...path: string[]) =>
      namespace.concat(path).join(NAMESPACE_SEPARATOR);

    const state = _each(_get(store.state, namespace, {}), k => ({
      get: () => _get(store.state, namespace.concat(k))
    }));

    const getters = _each(m.getters || {}, k => ({
      get: () => {
        return store.rootGetters
          ? store.rootGetters[namespacePath(k)]
          : store.getters[namespacePath(k)];
      }
    }));

    const mutations = _each(m.mutations || {}, k => ({
      get() {
        return (v: any, args: vuex.CommitOptions) => {
          return store.commit(namespacePath(k), v, { ...args, root: true });
        };
      },
      set(v: any) {
        return store.commit(namespacePath(k), v, { root: true });
      }
    }));

    const actions = _each(m.actions || {}, k => ({
      get() {
        return (v: any, args: vuex.DispatchOptions) => {
          return store.dispatch(namespacePath(k), v, { ...args, root: true });
        };
      }
    }));

    return Object.defineProperties(
      {},
      { ...state, ...getters, ...mutations, ...actions }
    );
  };
}

export function createModule<T extends Constructor>(
  cls: T,
  namespace: string = "",
  options?: { modules?: IVuexModule<any>[] }
): IVuexModule<T> {
  const EXCLUDE_PATTERN = /^(\$|\_)/;
  const isFunction = (p: PropertyDescriptor) => typeof p.value == "function";
  const isGenerator = (p: PropertyDescriptor) =>
    isFunction(p) && p.value.constructor.name == "GeneratorFunction";

  const isGetter = (p: PropertyDescriptor) => !!(p.get && !p.set);
  const isSetter = (p: PropertyDescriptor) =>
    !!(p.set && !p.get) || isGenerator(p);
  const isAction = (p: PropertyDescriptor, k: string) =>
    k !== "constructor" && isFunction(p) && !isGenerator(p);

  function getAllPropertyDescriptors(instance: any): PropertyDescriptorMap {
    if (instance == Object.prototype) return {};
    const proto = Object.getPrototypeOf(instance);
    const descriptors = Object.getOwnPropertyDescriptors(proto);
    return { ...getAllPropertyDescriptors(proto), ...descriptors };
  }

  const instance = new cls();
  const props: PropertyDescriptorMap = getAllPropertyDescriptors(instance);

  const filter = (
    f: (prop: PropertyDescriptor, key: string) => boolean,
    v: (prop: PropertyDescriptor, key: string) => any,
    exclude: RegExp | null = EXCLUDE_PATTERN
  ) => {
    const out = {} as { [P in keyof InstanceType<T>]: any };
    for (let key in props) {
      if (exclude && exclude.test(key)) continue;
      if (f(props[key], key)) {
        out[key] = v(props[key], key);
      }
    }
    return out;
  };

  //Getters:
  const getters: GetterMap<InstanceType<T>> = filter(
    isGetter,
    p => (state: any, getters: any, rootState: any, rootGetters: any) => {
      const _helpers: Record<
        keyof InstanceType<T>,
        PropertyDescriptor
      > = filter(
        (prop, key) => EXCLUDE_PATTERN.test(key),
        (p, k) => ({
          get() {
            return (p.get || p.value).call({
              state,
              getters,
              rootState,
              rootGetters
            });
          }
        }),
        null
      );

      const otherGetters = Object.keys(getters).reduce(
        (out, key) => {
          out[key] = {
            get() {
              return getters[key];
            }
          };
          return out;
        },
        {} as any
      );

      const context = {};
      Object.defineProperties(context, Object.getOwnPropertyDescriptors(state));
      Object.defineProperties(context, otherGetters);
      Object.defineProperties(context, _helpers);

      return p.get && p.get.call(context);
    }
  );
  const mutations: MutationMap<InstanceType<T>> = filter(
    isSetter,
    (p, k) => (state: any, value: any) => {
      if (p.set) {
        return p.set.call(state, value);
      } else {
        return p.value.call(state, value).next();
      }
    }
  );
  //Actions:
  const actions: ActionMap<InstanceType<T>> = filter(
    isAction,
    (p, k) =>
      function(
        this: vuex.Store<any>,
        context: IStoreLike,
        args: vuex.DispatchOptions
      ) {
        const ctx = this;
        const { state, commit, dispatch, getters } = context;
        const action = p.value;

        //Create Getters:
        const _getters: Record<
          GetterKeys<InstanceType<T>>,
          PropertyDescriptor
        > = filter(isGetter, (p, key) => ({
          get() {
            return getters[key];
          }
        }));

        const _state: Record<
          MutationKeys<InstanceType<T>>,
          PropertyDescriptor
        > = Object.keys(state).reduce(
          (out, key) => {
            out[key] = {
              get() {
                return state[key];
              }
            };
            return out;
          },
          {} as any
        );

        //Create Mutations:
        const _mutations: Record<
          MutationKeys<InstanceType<T>>,
          PropertyDescriptor
        > = filter(isSetter, (p, key) => ({
          get() {
            return (value: any) => {
              commit(key, value);
            };
          },
          set(value: any) {
            commit(key, value);
          }
        }));
        //Create actions

        const _actions: Record<
          ActionKeys<InstanceType<T>>,
          PropertyDescriptor
        > = filter(isAction, (p, k) => ({
          get() {
            return (value: any, args: vuex.DispatchOptions) => {
              return dispatch(k, value, { ...args });
            };
          }
        }));

        const _helpers: Record<
          keyof InstanceType<T>,
          PropertyDescriptor
        > = filter(
          (prop, key) => EXCLUDE_PATTERN.test(key),
          (p, k) => ({
            get() {
              return (p.get || p.value).call(ctx);
            }
          }),
          null
        );

        const caller = {};

        Object.defineProperties(caller, Object.getOwnPropertyDescriptors(ctx));
        Object.defineProperties(caller, _helpers);
        Object.defineProperties(caller, _state);
        Object.defineProperties(caller, _getters);
        Object.defineProperties(caller, _mutations);
        Object.defineProperties(caller, _actions);

        return action.call(caller, args);
      }
  );

  const modules = ((options && options.modules) || []).reduce(
    (out, item) => {
      const name = item.$namespace;
      out[name] = item;
      return out;
    },
    {} as Record<string, IVuexModule<any>>
  );

  let _created: (context?: IStoreContext) => InstanceType<T>;
  const out = {
    namespaced: true,
    get $namespace() {
      return namespace;
    },
    getInstance(context?: IStoreContext) {
      if (_created) return _created(context);
      _created = createInstance(out);
      return _created(context);
    },
    state: () => JSON.parse(JSON.stringify(instance)),
    getters,
    mutations,
    actions,
    modules
  };

  return out;
}
