import * as vuex from "vuex";
import Vue from "vue";

import {
  Constructor,
  StringKeys,
  StateKeys,
  GetterKeys,
  ActionKeys,
  MutationKeys,
  IVuexModule,
  IStoreContext
} from "./types";

const NAMESPACE_SEPARATOR = "/";

export function mapState<
  T extends Constructor,
  C extends InstanceType<T>,
  K extends StringKeys<StateKeys<C>>,
  M extends vuex.Dictionary<K>
>(m: IVuexModule<T>, mappings: M): { [P in keyof M]: () => C[M[P]] } {
  const path = getNamespacePath(m);
  return path
    ? vuex.mapState(path, mappings)
    : (vuex.mapState(mappings) as any);
}
export function mapGetters<
  T extends Constructor,
  C extends InstanceType<T>,
  K extends StringKeys<GetterKeys<C>>,
  M extends vuex.Dictionary<K>
>(m: IVuexModule<T>, mappings: M): { [P in keyof M]: () => C[M[P]] } {
  const path = getNamespacePath(m);
  return path
    ? vuex.mapGetters(path, mappings)
    : (vuex.mapGetters(mappings) as any);
}

export function mapMutations<
  T extends Constructor,
  C extends InstanceType<T>,
  K extends StringKeys<MutationKeys<C>>,
  M extends vuex.Dictionary<K>
>(m: IVuexModule<T>, mappings: M): { [P in keyof M]: C[M[P]] } {
  const path = getNamespacePath(m);
  return path
    ? vuex.mapMutations(path, mappings)
    : (vuex.mapMutations(mappings) as any);
}

export function mapActions<
  T extends Constructor,
  C extends InstanceType<T>,
  K extends StringKeys<ActionKeys<C>>,
  M extends vuex.Dictionary<K>
>(m: IVuexModule<T>, mappings: M): { [P in keyof M]: C[M[P]] } {
  const path = getNamespacePath(m);
  return path
    ? vuex.mapActions(path, mappings)
    : (vuex.mapActions(mappings) as any);
}

export function getNamespace<T extends Constructor>(
  m: IVuexModule<T>
): string[] {
  return getNamespacePath(m)
    .split(NAMESPACE_SEPARATOR)
    .filter(n => n);
}

export function getNamespacePath<T extends Constructor>(
  m: IVuexModule<T>
): string {
  if ("default" in m) m = m["default"];
  const namespace = String(m.$namespace || "").replace(
    /^.*?\/store\/|\.(ts|js)$|index$/g,
    ""
  );
  return namespace;
}

export function useStore<T extends Constructor, C = InstanceType<T>>(
  m: IVuexModule<T>,
  c?: IStoreContext
): InstanceType<T> & { [P in MutationKeys<C>]: (v: C[P]) => void } {
  return m.getInstance(c);
}

export function getStore(): vuex.Store<any> {
  console.warn("Using global store");
  return Vue.prototype.$nuxt.$store;
}
