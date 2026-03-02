<template>
  <div
    class="main-layout d-flex flex-column pa-2 pa-sm-4"
    :class="{ 'fixed-height': fixedHeight }">

    <div
      class="content-wrapper d-flex"
      :class="{ 'flex-column': column }">
      <slot/>
    </div>

    <div class="navigation page-navigation d-flex justify-space-between align-center w-100" v-show="showNavigation">
      <div class="slot">
        <v-btn
          v-if="leftButton"
          text
          @click="$emit('left')">
          {{ leftButton}}
        </v-btn>

        <slot
          v-else
          name="left"/>
      </div>

      <div class="slot">
        <v-btn
          v-if="rightButton"
          color="grey darken-4"
          dark
          :disabled="rightDisabled || rightSpinner"
          @click="$emit('right')">

          <v-progress-circular
            v-if="rightSpinner"
            indeterminate
            class="mr-2" 
            color="grey" 
            size="14" 
            width="2"/>
          {{ rightButton }}
        </v-btn>

        <slot
          v-else
          name="right"/>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MainLayout',
  data () {
    return {
      routes: [
        { title: 'Connect Devices', path: '/connect-devices' },
        { title: 'Calibration', path: '/calibration' },
        { title: 'Neutral', path: '/neutral' },
        { title: 'Session', path: '/session' }
      ]
    }
  },
  props: {
    leftButton: {
      type: String,
      default: ''
    },
    rightButton: {
      type: String,
      default: ''
    },
    rightDisabled: {
      type: Boolean,
      default: false
    },
    rightSpinner: {
      type: Boolean,
      default: false
    },
    column: {
      type: Boolean,
      default: false
    },
    step: Number,
    fixedHeight: {
      type: Boolean,
      default: true
    },
    showNavigation: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    page: {
      get () {
        return this.step
      },
      set (value) {
        if (this.step !== value) {
          this.$router.push({ name: `Step${value}` })
        }
      }
    }
  },
  methods: {
    current (index) {
      return this.routes[index] === this.$route.path
    }
  }
}
</script>

<style lang="scss" scoped>
.main-layout {
  min-height: calc(100vh - var(--app-bar-top-offset, 64px));
  min-height: calc(100dvh - var(--app-bar-top-offset, 64px));

  &.fixed-height {
    height: calc(100vh - var(--app-bar-top-offset, 64px));
    height: calc(100dvh - var(--app-bar-top-offset, 64px));
    max-height: calc(100vh - var(--app-bar-top-offset, 64px));
    max-height: calc(100dvh - var(--app-bar-top-offset, 64px));
  }

  .content-wrapper {
    overflow-x: hidden;
    flex: 0 1 auto;
  }

  .navigation {
    flex-wrap: wrap;
    gap: 8px;
    
    .slot {
      flex: 1 1 calc(50% - 4px);
      margin-bottom: 0;
      
      @media (min-width: 600px) {
        flex: none;
      }

      button {
        width: 100%;
        height: 48px;

        @media (min-width: 600px) {
          width: auto;
          height: 48px;
          min-width: 120px;
        }
      }
    }
  }
}
</style>
