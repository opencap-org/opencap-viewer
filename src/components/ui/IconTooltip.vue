<template>
  <div class="tooltip-container mt-2 mb-2">
    <span class="tooltip-icon" @mouseover="showTooltip = true" @mouseleave="showTooltip = false">
      <i :class="iconClass"></i>
    </span>
    <div v-if="showTooltip" class="tooltip" v-html="tooltipText"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showTooltip: false,
    };
  },
  props: {
    tooltipText: {
      type: String,
      default: "This is a tooltip",
    },
    iconClass: {
      type: String,
      default: "fas fa-question-circle", // Default icon class if none is provided
    },
  },
};
</script>

<style>
.tooltip-container {
  position: relative;
  display: flex;
  justify-content: center; /* Horizontally centers the items */
  align-items: center; /* Vertically centers the items */
  overflow: visible;
}
.tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  right: auto;
  background-color: #555;
  color: #fff;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.35;
  white-space: normal;
  width: max-content;
  max-width: min(360px, calc(100vw - 24px));
  z-index: 9999;
}

.tooltip-icon {
  cursor: pointer;
}

/* Hide tooltip on mobile */
@media (max-width: 960px) {
  .tooltip-container {
    display: none;
  }
}
</style>
