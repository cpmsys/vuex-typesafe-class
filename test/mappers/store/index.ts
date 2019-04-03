import { createModule, useStore, Mutation } from "../../../src/index";
import nestedModule from "./nested";

class RootModule {
  name: string = "Hallo";

  get test() {
    return this.name + " Welt";
  }

  get $nested() {
    return useStore(nestedModule, this);
  }

  @Mutation
  setTest(value: string) {
    this.name = value;
  }

  async myAction({ text }: { text: string }) {
    this.setTest("dispatched");
    const result = await this.$nested.myAction({ text: "world" });
    return this.test + text.toLowerCase() + " " + result;
  }
}

export default createModule(RootModule, "", { modules: [nestedModule] });
