<template>
  <v-autocomplete
    class="country-dropdown"
    :items="items"
    :value="selectedIso2"
    item-text="name"
    item-value="iso2"
    label="Country"
    dark
    outlined
    dense
    hide-details
    auto-select-first
    :menu-props="{ dark: true, offsetY: true }"
    @change="onChange">
    <template #selection="{ item }">
      <span class="country-selection">
        <span v-if="enabledFlags" class="country-flag fi" :class="flagClass(item.iso2)"></span>
        <span class="country-name">{{ item.name }}</span>
        <span v-if="enabledCountryCode && item.dialCode" class="country-dial">+{{ item.dialCode }}</span>
      </span>
    </template>
    <template #item="{ item }">
      <span v-if="enabledFlags" class="country-flag fi" :class="flagClass(item.iso2)"></span>
      <span class="country-name">{{ item.name }}</span>
      <span v-if="enabledCountryCode && item.dialCode" class="country-dial">+{{ item.dialCode }}</span>
    </template>
  </v-autocomplete>
</template>

<script>
import allCountries from "@/util/allCountries.js";
// Bundled SVG flags (rendered consistently on every OS, unlike emoji flags
// which don't exist on Windows).
import "flag-icons/css/flag-icons.min.css";

export default {
  name: "CountryDropdown",
  props: {
    preferredCountries: {
      type: Array,
      default: () => [],
    },
    defaultCountry: {
      type: String,
      default: "",
    },
    immediateCallSelectEvent: {
      type: Boolean,
      default: false,
    },
    enabledFlags: {
      type: Boolean,
      default: true,
    },
    enabledCountryCode: {
      type: Boolean,
      default: false,
    },
    // Kept for API parity with the previous vue-country-dropdown component.
    showNameInput: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      selectedIso2: "",
    };
  },
  computed: {
    countries() {
      return allCountries
        .filter((c) => c.iso2)
        .map((c) => ({
          name: c.name,
          iso2: c.iso2,
          dialCode: c.dialCode,
        }));
    },
    items() {
      const preferred = this.preferredCountries.map((c) => c.toUpperCase());
      if (!preferred.length) return this.countries;
      const top = [];
      preferred.forEach((iso2) => {
        const match = this.countries.find((c) => c.iso2 === iso2);
        if (match) top.push(match);
      });
      const rest = this.countries.filter((c) => !preferred.includes(c.iso2));
      return [...top, ...rest];
    },
  },
  watch: {
    defaultCountry(iso2) {
      this.applyDefault(iso2, false);
    },
  },
  mounted() {
    this.applyDefault(this.defaultCountry, this.immediateCallSelectEvent);
  },
  methods: {
    applyDefault(iso2, emitEvent) {
      const code = (iso2 || "").toUpperCase();
      const match = this.countries.find((c) => c.iso2 === code);
      if (!match) return;
      this.selectedIso2 = match.iso2;
      if (emitEvent) this.emitSelect(match);
    },
    onChange(iso2) {
      this.selectedIso2 = iso2;
      const match = this.countries.find((c) => c.iso2 === iso2);
      if (match) this.emitSelect(match);
    },
    flagClass(iso2) {
      return iso2 ? `fi-${iso2.toLowerCase()}` : "";
    },
    emitSelect({ name, iso2, dialCode }) {
      this.$emit("onSelect", { name, iso2, dialCode });
    },
  },
};
</script>

<style scoped>
.country-selection {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap;
  min-width: 0;
  max-width: 100%;
}
.country-flag {
  margin-right: 8px;
  flex-shrink: 0;
  width: 1.33em;
  height: 1em;
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
}
.country-name {
  color: hsla(0, 0%, 100%, 0.85);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.country-dial {
  margin-left: 8px;
  color: hsla(0, 0%, 100%, 0.55);
  flex-shrink: 0;
}

/* Clip the selected name at the field's edge instead of letting a long
   country name stretch the input (and the whole card) wider. */
.country-dropdown ::v-deep .v-select__selections {
  flex-wrap: nowrap;
  overflow: hidden;
}
.country-dropdown ::v-deep .v-select__selections input {
  min-width: 0;
}
</style>