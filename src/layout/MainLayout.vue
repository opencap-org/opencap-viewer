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

      <div class="slot slot-right">
        <p
          v-if="showRightDisabledHint"
          class="right-disabled-hint">
          {{ rightDisabledHint }}
        </p>

        <v-tooltip
          v-if="rightButton"
          bottom
          :disabled="!showRightDisabledHint">
          <template v-slot:activator="{ on, attrs }">
            <div
              class="right-button-wrap"
              v-bind="attrs"
              v-on="on">
              <v-btn
                class="primary-action"
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
            </div>
          </template>
          <span>{{ rightDisabledHint }}</span>
        </v-tooltip>

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
    rightDisabledHint: {
      type: String,
      default: ''
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
    showRightDisabledHint () {
      return Boolean(
        this.rightDisabledHint &&
        this.rightDisabled &&
        !this.rightSpinner
      )
    },
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
  // v-main already reserves the app-bar offset, so fill its content box rather
  // than subtracting the header a second time. The previous calculation left
  // the navigation row one app-bar height above the mobile viewport bottom.
  min-height: 100%;
  box-sizing: border-box;
  padding-bottom: max(8px, env(safe-area-inset-bottom, 0px)) !important;

  &.fixed-height {
    height: 100%;
    max-height: 100%;
  }

  @media (min-width: 600px) {
    padding-bottom: max(16px, env(safe-area-inset-bottom, 0px)) !important;
  }

  .content-wrapper {
    overflow-x: hidden;
    flex: 1 1 auto;
    min-height: 0;
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

      &.slot-right {
        display: flex;
        flex-direction: column;
        align-items: stretch;

        @media (min-width: 600px) {
          align-items: flex-end;
        }
      }

      .right-disabled-hint {
        margin: 0 0 6px;
        font-size: 0.75rem;
        line-height: 1.3;
        color: var(--app-text-subtle);
        text-align: center;
        max-width: 220px;

        @media (min-width: 600px) {
          text-align: right;
          align-self: flex-end;
        }
      }

      .right-button-wrap {
        width: 100%;
        display: inline-block;

        @media (min-width: 600px) {
          width: auto;
        }
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

      .primary-action:not(.v-btn--disabled) {
        background: var(--app-action-bg) !important;
        color: var(--app-action-text) !important;
      }

      .primary-action.v-btn--disabled {
        background: var(--app-hover) !important;
        color: var(--app-text-subtle) !important;
        opacity: 1;
      }
    }
  }
}
</style>
