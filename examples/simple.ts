import { createModule, useStore, Mutation } from "../src";
import SalutationModule from "./salutation";

class RootModule {
  lineEnding = "\n";
  prename: string = "Jane";
  lastname: string = "Doe";

  get $salutation() {
    return useStore(SalutationModule, this);
  }

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

export default createModule(RootModule, "", {
  modules: [SalutationModule]
});
