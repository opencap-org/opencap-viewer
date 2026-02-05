<template>
  <div
    class="icon-button"
    :class="{ inline }"
    role="button"
    :style="getStyle"
    @click="$emit('click')">
    <v-icon>{{ roles[role].icon }}</v-icon>
  </div>  
</template>

<script>
export default {
  name: 'IconButton',
  props: {
    role: String,
    inline: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      roles: {
        check: {
          icon: 'mdi-check',
          color: 'rgb(141, 199, 63)'
        },
        cross: {
          icon: 'mdi-close',
          color: 'rgb(237, 27, 36)'
        }
      }
    }
  },
  computed: {
    getStyle () {
      return {
        'background-color': this.roles[this.role].color
      }
    }
  }
}
</script>

<style lang="scss">
$size: 24px;

.icon-button {
  width: $size;
  height: $size;
  color: white;
  border-radius: 3px;
  cursor: pointer;

  &.inline {
    display: inline-block;
  }
}
</style>