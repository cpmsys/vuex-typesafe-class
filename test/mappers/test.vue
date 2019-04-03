<template>
  <div>
    <p class="stateTest">{{stateTest}}</p>
    <p class="getterTest">{{getterTest}}</p>
    <p class="nestedTest">{{nestedTest}}</p>
    <button
      class="mutationTest"
      @click="mutationTest('mutated')"
    >Click</button>
    <button
      class="actionTest"
      @click="actionTest({text: 'test'})"
    >Click</button>
    <button
      class="nestedActionTest"
      @click="nestedActionTest('nested')"
    >Click</button>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import rootModule from "./store/index";
import nestedModule from "./store/nested";
import { mapState, mapGetters, mapMutations, mapActions } from "../../src";

export default Vue.extend({
  computed: {
    ...mapState(rootModule, {
      stateTest: "name"
    }),
    ...mapGetters(rootModule, {
      getterTest: "test"
    }),
    ...mapGetters(nestedModule, {
      nestedTest: "test"
    })
  },
  methods: {
    ...mapMutations(rootModule, {
      mutationTest: "setTest"
    }),
    ...mapActions(rootModule, {
      actionTest: "myAction"
    }),
    ...mapActions(nestedModule, {
      nestedActionTest: "nestedAction"
    })
  }
});
</script>
