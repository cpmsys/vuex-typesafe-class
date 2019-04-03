<template>
  <div>
    <label for="prename_input">Vorname</label>
    <input
      id="prename_input"
      v-model="prename"
    >
    <label for="lastname_input">Vorname</label>
    <input
      id="lastname_input"
      v-model="lastname"
    >

    <button @click="submit"></button>
    <p class="simpleText">{{simpleText}}</p>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Simple from "./simple";
import { mapGetters, mapActions, mapMutations } from "../src";

export default Vue.extend({
  data() {
    return {
      prename: "Erika",
      lastname: "Musterfrau"
    };
  },
  computed: {
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
</script>
