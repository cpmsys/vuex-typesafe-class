import "jest";
import Vue from "vue";
import Vuex from "vuex";

import {
  createModule,
  MutationKeys,
  Mutation,
  StateMap,
  StateFactory,
  useStore,
  getNamespace,
  getNamespacePath
} from "../src/index";

Vue.config.productionTip = false;
Vue.config.devtools = false;

describe("Helpers", () => {
  Vue.use(Vuex);

  describe("getNamespace", () => {
    it("Handles module paths", async () => {
      const m = createModule(class {}, "./store/elements/active/index.ts");

      expect(getNamespace(m)).toEqual(["elements", "active"]);
    });
  });

  describe("useStore", () => {
    it("State", () => {
      const m = createModule(
        class Root {
          test = 123;
        }
      );
      const store = new Vuex.Store(m);

      expect(useStore(m, store).test).toEqual(123);
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

      expect(useStore(m, store).testGetter).toEqual("test getter 123");
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
      const $store = useStore(m, store);
      expect($store.testGetter).toEqual("test getter 123");
      $store.testSetter = 456;
      expect($store.testGetter).toEqual("test getter 456");
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

      const used = useStore(m, store);
      used.testSetter(456);
      expect(used.test).toEqual(456);
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

      const used = useStore(m, store);
      used.testSetter(456);
      expect(used.test).toEqual(456);
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

      const used = useStore(m, store);
      used.testSetter = 456;
      expect(used.test).toEqual(456);
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

      await expect(
        useStore(m, store).testAction({ test: 456 })
      ).resolves.toEqual("test action 123:456");
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

      await expect(
        useStore(m, store).testAction({ test: 123 })
      ).resolves.toEqual("test action 456:123");
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

      await expect(
        useStore(rootModule, store).testAction({ test: 123 })
      ).resolves.toEqual("test action 456:123:789");
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
        useStore(rootModule, store).myAction({ text: "Hello" })
      ).resolves.toEqual("hello WORLD");
    });
  });
});
