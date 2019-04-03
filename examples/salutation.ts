import { createModule } from "../src";

type Gender = "male" | "female" | "other";

class SalutationModule {
  maleSalutation = "Mr.";
  femaleSalutation = "Mrs.";

  async salute({ gender }: { gender: Gender }) {
    switch (gender) {
      case "male":
        return this.maleSalutation;
      case "female":
        return this.femaleSalutation;
      default:
        return "dear";
    }
  }
}

export default createModule(SalutationModule, "salutation");
