import "jest";
import Vue from "vue";
import Vuex from "vuex";
import { shallowMount, createLocalVue } from "@vue/test-utils";
import TestComponent from "./mappers/test.vue";

import rootModule from "./mappers/store/index";

Vue.config.productionTip = false;
Vue.config.devtools = false;

const localVue = createLocalVue();

describe("Mappers", () => {
  localVue.use(Vuex);

  const store = new Vuex.Store(rootModule);

  describe("test.vue", () => {
    it("Renders store.state.test", async () => {
      const wrapper = shallowMount(TestComponent, { store, localVue });
      const p = wrapper.find("p.stateTest");
      expect(p.text()).toBe("Hallo");
    });

    it("Renders store.getters.test", async () => {
      const wrapper = shallowMount(TestComponent, { store, localVue });
      const p = wrapper.find("p.getterTest");
      expect(p.text()).toBe("Hallo Welt");
    });

    it("Performs mutation", async () => {
      const wrapper = shallowMount(TestComponent, { store, localVue });
      const button = wrapper.find("button.mutationTest");
      button.trigger("click");
      const p = wrapper.find("p.stateTest");
      expect(p.text()).toBe("mutated");
    });

    it("Performs action", async () => {
      const wrapper = shallowMount(TestComponent, { store, localVue });
      const button = wrapper.find("button.actionTest");
      button.trigger("click");
      const p = wrapper.find("p.stateTest");
      expect(p.text()).toBe("dispatched");
    });

    it("Performs nested action", async () => {
      const wrapper = shallowMount(TestComponent, { store, localVue });
      const button = wrapper.find("button.nestedActionTest");
      button.trigger("click");
      const p = wrapper.find("p.nestedTest");
      expect(p.text()).toBe("nested");
    });
  });
});
