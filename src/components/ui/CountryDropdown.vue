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
      <span v-if="enabledFlags" class="country-flag">{{ item.flag }}</span>
      <span class="country-name">{{ item.name }}</span>
      <span v-if="enabledCountryCode && item.dialCode" class="country-dial">+{{ item.dialCode }}</span>
    </template>
    <template #item="{ item }">
      <span v-if="enabledFlags" class="country-flag">{{ item.flag }}</span>
      <span class="country-name">{{ item.name }}</span>
      <span v-if="enabledCountryCode && item.dialCode" class="country-dial">+{{ item.dialCode }}</span>
    </template>
  </v-autocomplete>
</template>

<script>
import allCountries from "@/util/allCountries.js";

// Convert an ISO 3166-1 alpha-2 code into a flag emoji using regional
// indicator symbols. Returns an empty string for invalid/empty codes.
function isoToFlag(iso2) {
  if (!iso2 || iso2.length !== 2) return "";
  const code = iso2.toUpperCase();
  return String.fromCodePoint(
    ...[...code].map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65))
  );
}

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
          flag: isoToFlag(c.iso2),
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
    emitSelect({ name, iso2, dialCode }) {
      this.$emit("onSelect", { name, iso2, dialCode });
    },
  },
};
</script>

<style scoped>
.country-flag {
  margin-right: 8px;
  font-size: 1.1rem;
  line-height: 1;
}
.country-name {
  color: hsla(0, 0%, 100%, 0.85);
}
.country-dial {
  margin-left: 8px;
  color: hsla(0, 0%, 100%, 0.55);
}
</style>
