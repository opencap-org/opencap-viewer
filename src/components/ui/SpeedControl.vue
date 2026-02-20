<template>
  <v-menu offset-y>
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        v-bind="attrs"
        v-on="on"
        small
        class="speed-control-button">
        <v-icon small left>mdi-speedometer</v-icon>
        {{ selectedSpeedLabel }}
        <v-icon small right>mdi-menu-down</v-icon>
      </v-btn>
    </template>

    <v-list dense class="speed-control-menu">
      <v-list-item
        v-for="(s, index) in speeds"
        :key="index"
        @click="$emit('input', s.value)">
        <v-list-item-title
          class="speed-option"
          :class="{ selected: s.value === value }">
          {{ s.name }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
export default {
  name: 'SpeedControl',
  props: {
    value: {
      type: Number,
      default: 1
    }
  },
  data () {
    return {
      speeds: [
        { name: '0.1x', value: .1 },
        { name: '0.25x', value: .25 },
        { name: '0.5x', value: .5 },
        { name: '0.75x', value: .75 },
        { name: '1x', value: 1 },
        { name: '2x', value: 2 }
      ]
    }
  },
  computed: {
    selectedSpeedLabel () {
      const selected = this.speeds.find(s => s.value === this.value)
      return selected ? selected.name : `${this.value}x`
    }
  }
}
</script>

<style lang="scss">
.speed-control-button {
  min-width: 80px;
  text-transform: none;
}

.speed-option {
  font-size: 14px;

  &.selected {
    font-weight: 600;
  }
}
</style>
