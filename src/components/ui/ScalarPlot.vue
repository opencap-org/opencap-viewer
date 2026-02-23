<template>
  <div class="scalar-wrapper">
    <div v-for="(row, row_idx) in sortedMetrics"
         :key="row_idx"
         :class="['metric-row', row.classes]">
      <h2 class="h5 plot-caption">
        <span class="plot-title">{{ row.label }}</span>
        <v-tooltip bottom max-width="320" content-class="metric-tooltip" v-if="row.info">
          <template v-slot:activator="{ on }">
            <v-icon class="metric-help-icon" v-on="on"> mdi-help-circle-outline </v-icon>
          </template>
          <p class="metric-tooltip-text" v-html="row.info.replace(/\n/g, '<br>')" />
        </v-tooltip>
      </h2>

      <div class="scalar-plot-container d-flex" style="margin-top: 40px;margin-bottom: 30px;">
        <div class="scalar-plot-bar scalar-plot-bar-left text-right" :style="buildBarStyles(row, 'left')">
          <div style="position: relative;margin-top: 20px;">{{row.min_limit}}</div>
        </div>
        <div class="scalar-plot-bar scalar-plot-bar-middle" :style="buildBarStyles(row, 'middle')">
          <div :style="buildValueStyles(row.value, row.min_limit, row.max_limit)">
            <div style="width:100px;text-align: center;margin-left: -50px;">{{row.value}}</div>
            <div style="border: 1px solid #ffffff;width:4px;height: 30px;background: #ffffff;"></div>
          </div>
        </div>
        <div class="scalar-plot-bar scalar-plot-bar-right" :style="buildBarStyles(row, 'right')">
          <div style="position: relative;margin-top: 20px;">{{row.max_limit}}</div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ["trialID", 'timePosition', 'result', 'block'],
  name: "scalar-plot",
  computed: {
    sortedMetrics() {
      return Object.keys(this.result.metrics).sort().map((x) => this.result.metrics[x]);
    }
  },
  methods: {
    buildBarStyles(row, bar_name) {
      let bar_color = 'grey';
      let text_color = 'white';

      let leftBound = Math.min(
          row.min_limit-Math.abs(row.min_limit*0.05),
          row.value-Math.abs(row.value*0.05)
      )
      let rightBound = Math.max(
          row.max_limit+Math.abs(row.max_limit*0.05),
          row.value+Math.abs(row.value*0.05)
      )
      let width = rightBound - leftBound

      // All width has to be translated to percentage
      let bar_width = 0

      if (bar_name === 'left') {
        bar_color = row.colors[0]
        bar_width = (row.min_limit - leftBound) / width * 100
      } else if (bar_name === 'middle') {
        bar_color = row.colors[1]
        bar_width = (row.max_limit - row.min_limit) / width * 100
      } else if (bar_name === 'right') {
        bar_color = row.colors[2]
        bar_width = (rightBound - row.max_limit) / width * 100
      }

      if ((row.max_limit - row.min_limit) / width * 100 < 20) {
        // Hide the label that is far from the value
        if (row.value > row.max_limit && bar_name === 'left') {
          text_color = 'transparent'
        } else if (row.value < row.min_limit && bar_name === 'right') {
          text_color = 'transparent'
        }
      }

      // console.log(row.value, row.min_limit, row.max_limit, leftBound, rightBound, width, bar_width)

      return `background: ${bar_color} ;width: ${bar_width}%; color: ${text_color};`;
    },
    buildValueStyles(value, min, max) {
      let percent = (value - min) / (max - min) * 100;
      return `position: relative;margin-top: -33px;margin-left:${percent}%;`
    }
  }
};
</script>

<style>
.plot-caption {
  font-size: 16px;
}

.scalar-wrapper {
  padding-left: 2rem;
  padding-right: 2rem;
  padding-top: 4rem;
  padding-bottom: 4rem;
}

.scalar-plot {
  width: 300px;
  height: 100vh;
  background: black;
  color: white;
  margin-bottom: 1rem;
  overflow-y: auto;
}

.plot-caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0;
  padding: 0;
  text-align: left;
}

.plot-title {
  flex: 1;
  text-align: center;
}
.scalar-plot-bar {
  height: 10px;
}

.metric-row {
  position: relative;
}

.metric-help-icon {
  font-size: 20px !important;
  line-height: 1;
  margin-left: 8px;
}

.metric-tooltip-text {
  margin: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.35;
}
</style>
