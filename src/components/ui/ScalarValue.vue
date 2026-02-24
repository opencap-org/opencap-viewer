<template>
  <div class="scalar-value-wrapper">
    <div v-for="(row, row_idx) in sortedInfoText"
         :key="row_idx"
         :class="row.classes">
      <div class="info-label">{{ row.label }}</div>
      <div class="info-text">{{ row.text }}</div>
    </div>
    <div v-for="(row, row_idx) in sortedMetrics"
         :key="row_idx"
         :class="row.classes">
      <div class="label-text">{{ row.label }}</div>
      <div class="scalar-text">{{ row.value }} &plusmn; {{ row.std }}</div>
    </div>
  </div>
</template>

<script>
export default {
  props: ["trialID", 'timePosition', 'result', 'block'],
  name: "squat-analysis",
  computed: {
    sortedMetrics() {
      return Object.keys(this.result.metrics).sort().map((x) => this.result.metrics[x]);
    },
    sortedInfoText() {
      return Object.keys(this.result.info_text).sort().map((x) => this.result.info_text[x]);
    }
  }
};
</script>

<style>
.info-label {
  font-size: 16px;
  text-align: center;
  font-weight: bold;
}

.info-text {
  font-size: 28px;
  text-align: center;
  margin-bottom: 3rem;
}

.label-text {
  font-size: 16px;
  text-align: center;
  font-weight: bold;
}

.scalar-text {
  font-size: 32px;
  text-align: center;
  margin-bottom: 3rem;
}

.scalar-value-wrapper {
  padding-left: 2rem;
  padding-right: 2rem;
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.scalar-value {
  width: 250px;
  height: 100vh;
  background: black;
  color: white;
  margin-bottom: 1rem;
  overflow-y: auto;
}

@media (max-width: 960px) {
  .scalar-value-wrapper {
    padding: 0.75rem 1rem;
  }

  .scalar-value {
    width: 100%;
    height: auto;
    max-height: none;
  }

  .info-text {
    font-size: 1rem !important;
    margin-bottom: 1rem !important;
  }

  .scalar-text {
    font-size: 1rem !important;
    margin-bottom: 1rem !important;
  }

  .info-label,
  .label-text {
    font-size: 0.8125rem !important;
  }
}

</style>
