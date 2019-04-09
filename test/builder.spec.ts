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
      class Root {
        test = 123;
      }
    );
    const store = new Vuex.Store(m);

    expect(store.state.test).toEqual(123);
  });

  it("Getter", () => {
    const m = createModule(
      class Root {
        test = 123;

        get testGetter() {
          return "test getter " + this.test;
        }
      }
    );
    const store = new Vuex.Store(m);

    expect(store.getters.testGetter).toEqual("test getter 123");
  });

  it("Getter (revisit)", () => {
    const m = createModule(
      class Root {
        test = 123;

        get testGetter() {
          return "test getter " + this.test;
        }

        set testSetter(value: number) {
          this.test = value;
        }
      }
    );
    const store = new Vuex.Store(m);
    expect(store.getters.testGetter).toEqual("test getter 123");
    store.commit("testSetter", 456);
    expect(store.getters.testGetter).toEqual("test getter 456");
  });

  it("Mutation (Generator, ES6+)", () => {
    class Root {
      test: number = 123;

      *testSetter(value: number): any {
        this.test = value;
      }
    }

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

    const m = createModule(Root);

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

    const m = createModule(Root);

    const store = new Vuex.Store(m);

    store.commit("testSetter", 456);
    expect(store.state.test).toEqual(456);
  });

  it("Action", async () => {
    const m = createModule(
      class Root {
        test = 123;

        async testAction({ test }: { test: number }) {
          return "test action " + this.test + ":" + test;
        }
      }
    );
    const store = new Vuex.Store(m);

    await expect(store.dispatch("testAction", { test: 456 })).resolves.toEqual(
      "test action 123:456"
    );
  });

  it("Action with commit", async () => {
    const m = createModule(
      class Root {
        test = 123;

        set testSetter(v: number) {
          this.test = v;
        }

        async testAction({ test }: { test: number }) {
          this.testSetter = 456;
          return "test action " + this.test + ":" + test;
        }
      }
    );
    const store = new Vuex.Store(m);

    await expect(store.dispatch("testAction", { test: 123 })).resolves.toEqual(
      "test action 456:123"
    );
  });

  it("Action with commit and getter", async () => {
    const m = createModule(
      class Root {
        test = 123;

        set testSetter(v: number) {
          this.test = v;
        }

        get testGetter() {
          return "Test " + this.test;
        }

        async testAction({ test }: { test: number }) {
          this.testSetter = 456;
        }
      }
    );
    const store = new Vuex.Store(m);

    await store.dispatch("testAction", { test: 123 });

    await expect(store.getters.testGetter).toEqual("Test 456");
  });

  it("Nested module getters", async () => {
    const nestedModule = createModule(
      class {
        test = 789;
      },
      "nested"
    );

    const rootModule = createModule(
      class {
        get $nested() {
          return useStore(nestedModule, this);
        }

        test = 123;

        set testSetter(v: number) {
          this.test = v;
        }

        async testAction({ test }: { test: number }) {
          this.testSetter = 456;
          return (
            "test action " + this.test + ":" + test + ":" + this.$nested.test
          );
        }
      },
      "",
      { modules: [nestedModule] }
    );

    const store = new Vuex.Store(rootModule);

    await expect(store.dispatch("testAction", { test: 123 })).resolves.toEqual(
      "test action 456:123:789"
    );
  });

  it("Nested module actions", async () => {
    const nestedModule = createModule(
      class {
        async myAction({ text }: { text: string }) {
          return text.toUpperCase();
        }
      },
      "nested"
    );

    const rootModule = createModule(
      class {
        get $nested() {
          return useStore(nestedModule, this);
        }

        async myAction({ text }: { text: string }) {
          const result = await this.$nested.myAction({ text: "world" });
          return text.toLowerCase() + " " + result;
        }
      },
      "",
      { modules: [nestedModule] }
    );

    const store = new Vuex.Store(rootModule);

    await expect(
      store.dispatch("myAction", { text: "Hello" })
    ).resolves.toEqual("hello WORLD");
  });

  it("Subsequent module actions in nested modules", async () => {
    const a = createModule(
      class {
        async test1() {
          return await this.test2();
        }

        async test2() {
          return 456;
        }
      },
      "a"
    );

    const rootModule = createModule(class {}, "", { modules: [a] });

    const store = new Vuex.Store(rootModule);

    await expect(store.dispatch("a/test1")).resolves.toEqual(456);
  });

  it("Injected helpers", async () => {
    class Helpers {
      get $hurz(this: any): { test: Function } {
        return this.$test;
      }
    }

    const rootModule = createModule(
      class extends Helpers {
        async send({}) {
          return await this.send2({});
        }

        async send2(this: any, {}) {
          return this.$hurz.test();
        }
      }
    );

    const store: any = new Vuex.Store(rootModule);
    store["$test"] = {
      test: function() {
        return 123;
      }
    };

    await expect(store.dispatch("send", {})).resolves.toEqual(123);
  });

  class BaseStore {
    protected $test!: { test(): Function };
  }

  it("Injected helpers", async () => {
    const rootModule = createModule(
      class extends BaseStore {
        async send({}) {
          return await this.send2({});
        }

        async send2({}) {
          return this.$test.test();
        }
      }
    );

    const store: any = new Vuex.Store(rootModule);
    store["$test"] = {
      test: function() {
        return 123;
      }
    };

    await expect(store.dispatch("send", {})).resolves.toEqual(123);
  });
});
