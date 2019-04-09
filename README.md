<p align="center">
    <a href="https://github.com/cpmsys/vuex-typesafe-class" rel="noopener noreferrer" target="_blank">
        <img src="https://git.cpmsys.de/npm/vuex-typesafe-class/raw/master/logo.svg" height="130">
    </a>
</p>
<p align="center">
    <a href="https://git.cpmsys.de/npm/vuex-typesafe-class" rel="noopener noreferrer" target="_blank">
        <img alt="Project badge" aria-hidden="true" src="https://git.cpmsys.de/npm/vuex-typesafe-class/badges/master/pipeline.svg">
    </a>
    <a class="append-right-8" href="https://www.npmjs.com/package/vuex-typesafe-class" rel="noopener noreferrer" target="_blank">
        <img alt="Project badge" aria-hidden="true" src="https://img.shields.io/david/cpmsys/vuex-typesafe-class.svg">
    </a>
    <a class="append-right-8" href="https://www.npmjs.com/package/vuex-typesafe-class" rel="noopener noreferrer" target="_blank">
        <img alt="Project badge" aria-hidden="true" src="https://img.shields.io/bundlephobia/min/vuex-typesafe-class.svg">
    </a>
    <a class="append-right-8" href="https://www.npmjs.com/package/vuex-typesafe-class" rel="noopener noreferrer" target="_blank">
        <img alt="Project badge" aria-hidden="true" src="https://img.shields.io/npm/v/vuex-typesafe-class/latest.svg">
    </a>
</p>

ES2015 Helpers for using classes as Vuex modules

## Goals

- Ensure your codebase is type safe when writing and using Vuex modules
- Generate Vuex compatible store options, which can be used in Vue and Nuxt projects
- Omit usage of decorators

## Dependencies

This module has no external dependencies.

## Installation

`$ npm install --save vuex-typesafe-class`

## Getting started

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

## Core concepts

### State

To define the module [state](https://vuex.vuejs.org/api/#state) simply declare properties on your module class:

```typescript
class RootModule {
  stateA: boolean = true;
  stateB: number = 123;
  stateC: string = "abc";
}

export default createModule(RootModule);
```

... will result in a state factory:

```javascript
export default {
  namespaced: true,
  state() {
    return {
      stateA: true,
      stateB: 123,
      stateC: "abc"
    };
  }
};
```

All properties that are declared public will be available for autocompletion when using mapState().
Please note that vuex-typesafe-class always produces state factories to allow [Module Reuse](https://vuex.vuejs.org/guide/modules.html#module-reuse).

### Mutations

[Mutations](https://vuex.vuejs.org/api/#mutations) are defined as ES6 setter methods:

```typescript
class RootModule {
  stateB: number = 123;

  set setterB(value: number) {
    this.stateB = value;
  }
}

export default createModule(RootModule);
```

... will result in :

```javascript
export default {
  namespaced: true,
  state() {
    return {
      stateB: 123
    };
  },
  mutations: {
    setterB(state, value) {
      state.stateB = value;
    }
  }
};
```

### Actions

[Actions](https://vuex.vuejs.org/api/#actions) are defined as class methods:

```typescript
class RootModule {
  stateB: number = 123;

  get getterB() {
    return "Getter: " + this.stateB;
  }

  set setterB(value: number) {
    this.stateB = value;
  }

  async actionA({ paramA }: { paramA: number }) {
    return "actionA: " + paramA;
  }

  async actionB({ paramB }: { paramB: number }) {
    this.setterB = paramB;
    const result = await this.actionA({ paramA: 123 });
    return result + this.getterB + " State: " + this.stateB;
  }
}

export default createModule(RootModule);
```

... will result in :

```javascript
export default {
  namespaced: true,
  state() {
    return {
      stateB: 123
    };
  },
  getters: {
    getterB(state) {
      return "Getter: " + state.stateB;
    }
  },
  mutations: {
    setterB(state, value) {
      state.stateB = value;
    }
  },
  actions: {
    async actionA({ paramA }) {
      return "actionA: " + paramA;
    },
    async actionB({ state, getters, commit, dispatch }, { paramB }) {
      commit("setterB", paramB);
      const result = await dispatch("actionA", { paramA: 123 });
      return getters.getterB + " State: " + state.stateB;
    }
  }
};
```

You can access state variables, getters, mutations and other actions from your class modules by simply referencing them with `this`.
Because actions are asynchronous you should always define your actions as [async function](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Statements/async_function).

Please note that [GeneratorFunctions](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/GeneratorFunction) can not be used.

### Getters

Module [getters](https://vuex.vuejs.org/api/#getters) are defined as ES6 getter methods:

```typescript
class RootModule {
  stateB: number = 123;

  get getterB() {
    return "Getter: " + this.stateB;
  }
}

export default createModule(RootModule);
```

... will result in :

```javascript
export default {
  namespaced: true,
  state() {
    return {
      stateB: 123
    };
  },
  getters: {
    getterB(state) {
      return "Getter: " + state.stateB;
    }
  }
};
```

## Can I use...

### ...it in Vue components?

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
import {
  mapState,
  mapGetters,
  mapActions,
  mapMutations
} from "vuex-typesafe-class";

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

### ... it with Nuxt.js?

**Yes!** This library was designed with [Nuxt.js](https://nuxtjs.org) in mind.

Simply install the module and add it to the list of modules that have to be transpiled in your nuxt.config.(js/ts):

```javascript
//nuxt.config.js
//...
build: {
  transpile: [/^vuex-typesafe-class/];
}
//...
```

As Nuxt.js uses [modules mode](https://nuxtjs.org/guide/vuex-store/#modules-mode) by default, you can simply put your modules in the stores directory.

```typescript
/// ~/store/index.ts
import { createModule } from "vuex-typesafe-class";

class RootStore {
  async nuxtServerInit() {
    await this.init({});
  }

  async init({}) {}
}

export default createModule(RootStore);
```

Because Nuxt.js will automatically attach nested modules to your root module you do not have to define child modules in your RootStore.
Simply put your module inside the store directory:

```typescript
/// ~/store/nested.ts
import { createModule } from "vuex-typesafe-class";

class NestedStore {
  async test({}) {}
}

export default createModule(NestedStore, "nested");
```

Note: You can omit the module name (second parameter of createModule) for your root module. For all other modules use the module namespace (delimited by **/**).
It is also possible to simply use `__filename` or `module.id` **in development** as vuex-typesafe-class can handle pathnames. **Module filenames will be lost after building with nuxt build/generate**.

### ...it with nested modules / submodules?

First of all `createModule` accepts two more parameters: `createModule(ModuleClass: Constructor, namespace?: string, options?: {modules?: Array})`.

Consider this example:

```typescript
import { createModule, useStore } from "vuex-typesafe-class";

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

### ...it programmatically e.g. for usage in [Nuxt.js](https://nuxtjs.org) fetch method?

You can use `useStore` outside of Vuex module classes.

```typescript
const $nested = useStore(salutationModule, this);
assert($nested.salutation, "Mrs.");
```

### ...Inheritance

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

### ... injected variables (like \$axios) that are available in store context?

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
