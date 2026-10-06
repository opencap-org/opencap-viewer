<template>
  <div class="camera-view-controls d-flex align-center">
    <v-menu offset-y :disabled="disabled">
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          v-on="on"
          icon
          :disabled="disabled"
          class="camera-view-button"
          :title="`Camera view: ${selectedViewLabel}`">
          <v-icon>mdi-rotate-3d-variant</v-icon>
        </v-btn>
      </template>

      <v-list dense class="camera-view-menu">
        <v-list-item
          v-for="view in views"
          :key="view.value"
          @click="$emit('change-view', view.value)">
          <v-list-item-icon class="mr-2">
            <v-icon small>{{ view.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-title
            class="camera-view-option"
            :class="{ selected: view.value === value }">
            {{ view.name }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-btn
      icon
      :disabled="disabled"
      class="follow-subject-button"
      :title="follow ? 'Follow on' : 'Follow off'"
      @click="$emit('update:follow', !follow)">
      <v-icon>{{ follow ? 'mdi-crosshairs-gps' : 'mdi-crosshairs' }}</v-icon>
    </v-btn>
  </div>
</template>

<script>
export default {
  name: 'CameraViewControls',
  props: {
    value: {
      type: String,
      default: 'default'
    },
    follow: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      views: [
        { name: 'Default', value: 'default', icon: 'mdi-arrow-top-right' },
        { name: 'Frontal', value: 'frontal', icon: 'mdi-arrow-up' },
        { name: 'Sagittal', value: 'sagittal', icon: 'mdi-arrow-right' },
        { name: 'Posterior', value: 'posterior', icon: 'mdi-arrow-down' },
        { name: 'Top', value: 'top', icon: 'mdi-arrow-collapse-down' }
      ]
    }
  },
  computed: {
    selectedViewLabel() {
      const selected = this.views.find(v => v.value === this.value)
      return selected ? selected.name : 'View'
    }
  }
}
</script>

<style lang="scss">
.camera-view-controls {
  flex: 0 0 auto;
  min-width: max-content;
}

.camera-view-option {
  font-size: 14px;

  &.selected {
    font-weight: 600;
  }
}

.camera-view-menu .v-list-item__icon {
  margin: 8px 0;
  min-width: 28px;
}
</style>
