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
