import { createModule } from "../../../src/index";

export default createModule(
  class {
    v: string = "test";

    get test() {
      return this.v;
    }

    set testValue(v: string) {
      this.v = v;
    }

    async myAction({ text }: { text: string }) {
      return text.toUpperCase();
    }

    async nestedAction(text: string) {
      this.testValue = text;
    }
  },
  "nested"
);
