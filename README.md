# vuex-typesafe-class

ES2015 Helpers for using classes as Vuex modules

## Goals

- Ensure your codebase is type safe when writing and using Vuex modules
- Generate Vuex compatible store options, which can be used in Vue and Nuxt projects
- Omit usage of decorators

## Dependencies

This module has no external dependencies.

## Installation

`$ npm install --save vuex-typesafe-class`

## How to use

Consider this example:

```javascript
new Vuex.Store({
  namespace: true,
  state: {
    lineEnding: "\n",
    prename: "Jane",
    lastname: "Doe"
  },
  getters: {
    fullname(state, value) {
      return state.prename + " " + state.lastname;
    }
  },
  mutations: {
    name(state, value) {
      state.prename = value.prename;
      state.lastname = value.lastname;
    }
  },
  actions: {
    async action({ state, commit, getters }, { hello }) {
      commit("name", { prename: "John", lastname: "Smith" });
      return hello + " " + getters.fullname + "!" + state.lineEnding;
    }
  }
});
```

You can now easily write modules using the `createModule` helper:

```typescript
import { createModule } from "vuex-typesafe-class";

class RootModule {
  lineEnding = "\n";
  prename: string = "Jane";
  lastname: string = "Doe";

  get fullname() {
    return this.prename + " " + this.lastname;
  }

  set name(value: { prename: string; lastname: string }) {
    this.prename = value.prename;
    this.lastname = value.lastname;
  }

  async action({ hello }: { hello: string }) {
    this.name = { prename: "John", lastname: "Smith" };
    return hello + " " + this.fullname + "!" + this.lineEnding;
  }
}

new Vuex.Store(createModule(RootModule));
```

### What about Vue components?

Consider a simple store like this:

```typescript
//store/simple.ts
import { createModule, Mutation } from "vuex-typesafe-class";

class RootModule {
  lineEnding = "\n";
  prename: string = "Jane";
  lastname: string = "Doe";

  get text() {
    return "Hello " + this.fullname;
  }

  get fullname() {
    return this.prename + " " + this.lastname;
  }

  @Mutation
  setName(value: { prename: string; lastname: string }) {
    this.prename = value.prename;
    this.lastname = value.lastname;
  }

  async action({ hello }: { hello: string }) {
    const salute = await this.$salutation.salute({ gender: "male" });
    return hello + " " + salute + " " + this.fullname + "!" + this.lineEnding;
  }
}

export default createModule(RootModule);
```

You can now use these state variables, getters, mutations and actions in your components:

```typescript
import Vue from "vue";
import Simple from "./store/simple";
import { mapState, mapGetters, mapActions, mapMutations } from "vuex-typesafe-class";

export default Vue.extend({
  data() {
    return {
      prename: "Erika",
      lastname: "Musterfrau"
    };
  },
  computed: {
    ...mapState(Simple, {
      lineEnding: "lineEnding"
    }),
    ...mapGetters(Simple, {
      simpleText: "text"
    })
  },
  methods: {
    ...mapMutations(Simple, {
      setName: "setName"
    }),
    ...mapActions(Simple, {
      greet: "action"
    }),
    async submit() {
      this.setName({ prename: this.prename, lastname: this.lastname });
      await this.greet({ hello: "Hi" });
    }
  }
});
```

As in Vuex you can use the helper methods `mapState`, `mapGetters`, `mapMutations`, `mapActions`.
All of these are called like their Vuex counterparts:
The first parameter is the namespace (which accepts modules created by `createModule`), the second is the map you already know from Vuex.
The map is type checked and the result also contains all type informations you provided in the store.

**Note:**
In the example we used the decorator function `@Mutation`. This is only necessary if you plan to use mutations inside your modules (with the help of `mapMutations`),
which I understand as an anti-pattern. You can always use mutations you defined as setters inside actions and expose these to your components.

# What about nested modules / submodules?

First of all `createModule` accepts two more parameters: `createModule(ModuleClass: Constructor, namespace?: string, options?: {modules?: Array})`.

Consider this example:

```typescript
import { createModule, useStore } from "../src";

const salutationModule = createModule(
  class {
    salutation: string = "Mrs.";
  },
  "salutations"
);

class RootModule {
  private get $nested() {
    return useStore(salutationModule, this);
  }

  prename: string = "Jane";
  lastname: string = "Doe";

  get salutation() {
    return (
      "Hello " +
      this.$nested.salutation +
      " " +
      this.prename +
      " " +
      this.lastname
    );
  }
}

export default createModule(RootModule, "", { modules: [salutationModule] });
```

As you see you can use the options.modules parameter to attach further stores to your root store.
To access external modules in your modules define a getter that executes `useStore(module, this)`.
`module` is the result of `createModule`.
**Note: Please define this getter as private and prefix it with `_` or `$` to prevent creating Vuex getter.**

# What about using the store directly e.g. for usage in [Nuxt.js](https://nuxtjs.org) fetch method?

You can use `useStore` outside of Vuex module classes.

```typescript
const $nested = useStore(salutationModule, this);
assert($nested.salutation, "Mrs.");
```

# Inheritance

Modules created with `createModule` can make use of inheritance:

```typescript
class BaseStore {
  async submit({ username, password }) {
    return await this.$axios.post("/login", { username, password });
  }
}

const rootModule = createModule(
  class extends BaseStore {
    async submit({ username, password }) {
      const response = await super.submit({ username, password });
      if (response.status == 401) {
        throw new Error("Authorization failed");
      }
      return response.data;
    }
  }
);
```

# How can I use injected variables (like \$axios) that are available in store context?

When using [Nuxt.js](https://nuxtjs.org) in conjunction with [Axios Module](https://axios.nuxtjs.org) \$axios is [injected](https://nuxtjs.org/guide/plugins#combined-inject) to store context.
You can access the context via `this` as you would do in standard Vuex modules.

```typescript
const rootModule = createModule(
  class {
    protected $axios!: Axios;

    async submit({ username, password }) {
      return await this.$axios.post("/login", { username, password });
    }
  }
);
```

To use injected variables easily you can make use of inheritance:

```typescript
class BaseStore {
  protected $axios!: Axios;
}

const rootModule = createModule(
  class extends BaseStore {
    async submit({ username, password }) {
      return await this.$axios.post("/login", { username, password });
    }
  }
);
```
