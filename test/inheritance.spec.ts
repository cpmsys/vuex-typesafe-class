import "jest";
import Vue from "vue";
import Vuex from "vuex";

interface IAmbient {
  $test: { test(): any };
}

import {
  createModule,
  MutationKeys,
  Mutation,
  StateMap,
  StateFactory,
  useStore
} from "../src/index";

Vue.config.productionTip = false;
Vue.config.devtools = false;

describe("Builder", () => {
  Vue.use(Vuex);

  it("State", () => {
    const m = createModule(
      class Root extends class BaseStore {
        test = 123;
      } {}
    );
    const store = new Vuex.Store(m);

    expect(store.state.test).toEqual(123);
  });

  it("Getter", () => {
    const m = createModule(
      class Root extends class {
        test = 123;

        get testGetter() {
          return "test getter " + this.test;
        }
      } {}
    );
    const store = new Vuex.Store(m);

    expect(store.getters.testGetter).toEqual("test getter 123");
  });

  it("Mutation (Generator, ES6+)", () => {
    class Root extends class {
      test: number = 123;

      *testSetter(value: number): any {
        this.test = value;
      }
    } {}

    const m = createModule(Root);
    const store = new Vuex.Store(m);

    store.commit("testSetter", 456);
    expect(store.state.test).toEqual(456);
  });

  it("Mutation (Decorator)", () => {
    class Root {
      public test: number = 123;

      @Mutation
      testSetter(v: number) {
        this.test = v;
      }
    }

    const m = createModule(class extends Root {});

    const store = new Vuex.Store(m);

    store.commit("testSetter", 456);
    expect(store.state.test).toEqual(456);
  });

  it("Mutation (Setter)", () => {
    class Root {
      public test: number = 123;

      set testSetter(v: number) {
        this.test = v;
      }
    }

    const m = createModule(class extends Root {});

    const store = new Vuex.Store(m);

    store.commit("testSetter", 456);
    expect(store.state.test).toEqual(456);
  });

  it("Action", async () => {
    const m = createModule(
      class Root extends class {
        test = 123;

        async testAction({ test }: { test: number }) {
          return "test action " + this.test + ":" + test;
        }
      } {}
    );
    const store = new Vuex.Store(m);

    await expect(store.dispatch("testAction", { test: 456 })).resolves.toEqual(
      "test action 123:456"
    );
  });

  it("Action with commit", async () => {
    const m = createModule(
      class Root extends class {
        test = 123;

        set testSetter(v: number) {
          this.test = v;
        }

        async testAction({ test }: { test: number }) {
          this.testSetter = 456;
          return "test action " + this.test + ":" + test;
        }
      } {}
    );
    const store = new Vuex.Store(m);

    await expect(store.dispatch("testAction", { test: 123 })).resolves.toEqual(
      "test action 456:123"
    );
  });

  it("Action with commit", async () => {
    class Base {
      test = 123;

      set testSetter(v: number) {
        this.test = v;
      }

      async parentTest({ test }: { test: number }) {
        this.testSetter = 456;
        return "test action " + this.test + ":" + test;
      }
    }

    const m = createModule(
      class Root extends Base {
        async testAction({ test }: { test: number }) {
          return "parent " + (await super.parentTest({ test }));
        }
      }
    );
    const store = new Vuex.Store(m);

    await expect(store.dispatch("testAction", { test: 123 })).resolves.toEqual(
      "parent test action 456:123"
    );
  });
});
