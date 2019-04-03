import "jest";
import Vue from "vue";
import Vuex from "vuex";

import { shallowMount, createLocalVue } from "@vue/test-utils";
import SimpleExample from "../examples/simple";
import NestedExample from "../examples/nested";
import SampleComponent from "../examples/sample.vue";

Vue.config.productionTip = false;
Vue.config.devtools = false;

describe("Examples", () => {
  Vue.use(Vuex);

  it("Store", async () => {
    const store = new Vuex.Store(SimpleExample);
    store.commit("setName", { prename: "John", lastname: "Smith" });
    await expect(store.dispatch("action", { hello: "Heyho" })).resolves.toEqual(
      "Heyho Mr. John Smith!\n"
    );
  });

  it("Nested Store", async () => {
    const store = new Vuex.Store(NestedExample);

    expect(store.getters.salutation).toEqual("Hello Mrs. Jane Doe");
  });

  it("Component", async () => {
    Vue.config.productionTip = false;
    Vue.config.devtools = false;

    const localVue = createLocalVue();
    localVue.use(Vuex);

    const store = new Vuex.Store(SimpleExample);
    const wrapper = shallowMount(SampleComponent, { store, localVue });
    const p = wrapper.find("p.simpleText");
    expect(p.text()).toBe("Hello Jane Doe");

    const button = wrapper.find("button");
    button.trigger("click");

    expect(p.text()).toBe("Hello Erika Musterfrau");
  });
});
