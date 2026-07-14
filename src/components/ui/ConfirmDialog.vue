<template>
  <v-dialog
    :value="value"
    v-click-outside="clickOutside"
    :content-class="contentClass"
    :max-width="maxWidth"
    :retain-focus="retainFocus"
    :fullscreen="fullscreen"
    @input="$emit('input', $event)">
    <v-card>
      <v-card-text class="pt-4">
        <v-row class="m-0">
          <v-col v-if="icon" cols="12" sm="2">
            <v-icon x-large :color="iconColor">{{ icon }}</v-icon>
          </v-col>
          <v-col cols="12" :sm="icon ? 10 : 12">
            <slot></slot>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          :color="cancelColor"
          text
          @click="$emit('cancel')">
          {{ cancelText }}
        </v-btn>
        <v-btn
          :color="confirmColor"
          text
          :disabled="confirmDisabled"
          @click="$emit('confirm')">
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'ConfirmDialog',
  props: {
    value: {
      type: Boolean,
      required: true
    },
    icon: {
      type: String,
      default: ''
    },
    iconColor: {
      type: String,
      default: 'green'
    },
    cancelText: {
      type: String,
      default: 'No'
    },
    cancelColor: {
      type: String,
      default: 'blue darken-1'
    },
    confirmText: {
      type: String,
      default: 'Yes'
    },
    confirmColor: {
      type: String,
      default: 'green darken-1'
    },
    confirmDisabled: {
      type: Boolean,
      default: false
    },
    contentClass: {
      type: String,
      default: 'confirm-dialog'
    },
    maxWidth: {
      type: [Number, String],
      default: 500
    },
    retainFocus: {
      type: Boolean,
      default: true
    },
    fullscreen: {
      type: Boolean,
      default: false
    },
    clickOutside: {
      type: Function,
      default: () => {}
    }
  },
  data() {
    return {
      enterKeyHandler: null
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(isOpen) {
        if (isOpen) {
          this.bindEnterKeyHandler()
        } else {
          this.unbindEnterKeyHandler()
        }
      }
    }
  },
  beforeDestroy() {
    this.unbindEnterKeyHandler()
  },
  methods: {
    isTypingInEditableField(event) {
      const target = event.target
      if (!target) return false
      const tagName = target.tagName
      return tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable
    },
    bindEnterKeyHandler() {
      if (typeof window === 'undefined') return
      if (this.enterKeyHandler) return

      this.enterKeyHandler = event => {
        if (!this.value || event.key !== 'Enter' || this.confirmDisabled || this.isTypingInEditableField(event)) {
          return
        }

        event.preventDefault()
        event.stopPropagation()
        this.$emit('confirm')
      }

      window.addEventListener('keydown', this.enterKeyHandler, true)
    },
    unbindEnterKeyHandler() {
      if (typeof window === 'undefined') return
      if (!this.enterKeyHandler) return

      window.removeEventListener('keydown', this.enterKeyHandler, true)
      this.enterKeyHandler = null
    }
  }
}
</script>
