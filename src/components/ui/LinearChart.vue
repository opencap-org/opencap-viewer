<template>
  <div class="linear-chart">
      <div class="linear-chart-toolbar">
        <v-btn class="toolbar-btn" @click="onResetZoom">Reset Zoom</v-btn>
        <icon-tooltip
          class="toolbar-item"
          tooltip-text="
              Zoom instructions:</br>
              - <b>Zoom</b>: Click and Drag over a zone.</br>
              - <b>Move</b>: CTRL + Click and move mouse.</br>
              - <b>Zoom on X</b>: Mouse wheel on X axis.</br>
              - <b>Zoom on Y</b>: Mouse wheel on Y axis.</br>
          "
          iconClass="fas fa-question-circle"
        />
        <div class="toolbar-y-select">
          <v-select
            v-model="y_selected"
            @change="drawChart"
            :items="result.y_axis"
            label="Y Quantities"
            multiple outlined dense
          >
            <template v-slot:selection="{ item, index }">
              <span v-if="index === 0">{{ y_selected.length }} items selected</span>
            </template>
          </v-select>
        </div>
      </div>

    <div class="content-chart" style="width: 100%;background-color: black;position: relative;top: 0px;">
      <LineChartGenerator
        id="chart"
        :chart-options="chartOptions"
        :chart-data="chartData"
        style="position: relative; width: 100%; height: 100%; background-color: black;"
        ref="chartRef"
      />
    </div>

    <div>

    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import axios from 'axios'
import { apiError, apiInfo, apiWarning, clearToastMessages } from '@/util/ErrorMessage.js'
import Vue from 'vue'
import store from '@/store/store.js'
import chroma from 'chroma-js';
import { Line as LineChartGenerator } from 'vue-chartjs/legacy'
import zoomPlugin from 'chartjs-plugin-zoom';
import {
  Chart as ChartJS,
  Title,
  SubTitle,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement} from 'chart.js'
import IconTooltip from "@/components/ui/IconTooltip.vue";


ChartJS.register(
  Title,
  SubTitle,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
  zoomPlugin
)

export default {
  props: ["trialID", 'timePosition', 'result', 'block'],
  name: "linear-chart",
  components: {
    LineChartGenerator,
    IconTooltip,
  },
  data() {
    return {
      timeStart: 0,
      timeEnd: 0,
      y_selected: [],
      chartOptions: {
        animation: {
            duration: 0
        },
        plugins: {
          legend: {
            position: 'right',
            align: 'center',
            labels: {
              color: 'white',
              font: {
                size: 15
              },
            }
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'xy',
              modifierKey: 'ctrl',
            },
            zoom: {
              mode: 'xy',
              overScaleMode: 'xy',
              drag: {
                enabled: true,
              },
              wheel: {
                enabled: true,
              }
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time (s)',
              font: {
                size: 20,
                color: 'white',
              },
            },
            ticks: {
              color: 'white',
            },
            color: 'white',
            grid: {
              color: 'grey',
            },
            type: 'linear',
            min: this.result.indices.start,
            max: this.result.indices.end,
          },
          y: {
            title: {
              display: true,
              text: 'Values',
              font: {
                size: 20,
                color: 'white',
              },
            },
            ticks: {
              color: 'white',
            },
            color: 'white',
            grid: {
              color: 'grey',
            },
            type: 'linear',
          },
        },
      },
      chartData: {
        datasets: [{
          label: 'Empty',
          data: [],
        }]
      },
      chart_color_scales_selected: "Viridis",
      chart_color_scales_options: [
        { text: 'Viridis (recommended)', value: 'Viridis' },
        { text: 'Hot', value: ['black', 'red', 'yellow'] },
        { text: 'Yellow-Blue', value: ['yellow', 'blue'] },
        { text: 'Yellow-Green', value: ['yellow', 'green'] },
        { text: 'Grays', value: ['lightgrey', 'black'] },
        { text: 'Blues', value: ['#add8e6', '#191970'] },
      ],
      chart_legend_position: ["top", "right", "bottom", "left", "chartArea"],
      chart_legend_alignment: ["start", "center", "end"],
      chart_line_width: 5,
      chart_point_style_options: ["none", "circle", "cross", "crossRot", "dash", "line", "rect", "rectRounded", "rectRot", "star", "triangle"],
      chart_point_style: 'none',
      chart_point_radius: 12,
    }
  },
  watch: {
    timePosition: function () {
      this.drawChart();
    }
  },
  mounted() {
    this.drawChart();
  },
  methods: {
    drawChart() {
      // Show spinner and hide chart until finished.
      // document.getElementById("spinner-layer").style.display = "block";
      // document.getElementById("chart").style.display = "None";

      this.chartData.labels = []
      this.chartData.datasets = []

      this.timeStart = this.result.indices.start;
      this.timeEnd = this.result.indices.end;

      let timeStart = this.timeStart;
      let timeEnd = this.timeEnd;

      // Add y quantities.
      // console.log(this.y_selected)
      var dataset = {};

      // const selectedOption = this.chart_color_scales_options.find(option => {
      //   return option.value === this.chart_color_scales_selected;
      // });
      // const selectedText = selectedOption ? selectedOption.text : "";
      // console.log(chroma)
      // var colors = chroma.scale("Viridis").correctLightness().gamma(2).cache(false).colors(this.y_selected.length);      
      // Viridis palette: Viridis: ['#440154', '#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825']
      // Let's remove the first color, which is too dark
      // var colors = chroma.scale(['#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825']).correctLightness().gamma(2).cache(false).colors(this.y_selected.length);
      // Let's make the first color a bit lighter
      var colors = chroma.scale(['#562f8f', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825']).correctLightness().gamma(2).cache(false).colors(this.y_selected.length);
      // console.log(colors)
      // if (selectedText == "Spectral" || selectedText == "Rainbow" || selectedText == "Red-Yellow-Blue" || selectedText == "Yellow-Green-Blue")
      //     colors = chroma.scale(this.chart_color_scales_selected).colors(this.y_quantities_selected.length);
      // else if (selectedText == "Yellow-Green")
      //     colors = chroma.scale(this.chart_color_scales_selected).correctLightness().colors(this.y_quantities_selected.length);
      // else if (selectedText == "Red-Green" || selectedText == "Red-Blue" || selectedText == "Green-Blue")
      //     colors = chroma.scale(this.chart_color_scales_selected).gamma(0.75).cache(false).colors(this.y_quantities_selected.length);
      // else
      //     colors = chroma.scale(this.chart_color_scales_selected).correctLightness().gamma(2).cache(false).colors(this.y_quantities_selected.length);

      var $this = this;
      for(let i=0; i < this.y_selected.length; i++) {
        // console.log(this.y_selected[i])
        dataset = {};
        dataset["label"] = this.y_selected[i];
        dataset["data"] = [];
        dataset["backgroundColor"] = colors[i];
        dataset["borderColor"] = colors[i];
        dataset["borderWidth"] = this.chart_line_width;
        // Handle "none" option to remove points
        dataset["pointStyle"] = this.chart_point_style;
        if (this.chart_point_style === "none") {
          dataset["pointRadius"] = 0;
        } else {
          dataset["pointRadius"] = this.chart_point_radius;
        }
        dataset['segment'] = {
          borderColor: function(ctx) {
            return ctx.p0.parsed.x < $this.timePosition ? colors[i] : '#e4e4e4';
          }
        }

        this.chartData.datasets.push(dataset);
      }

      var labels = [];
      for(let j=0; j < this.result.datasets.length; j++) {
        if(this.result.datasets[j][this.result.x_axis] >= timeStart && this.result.datasets[j][this.result.x_axis] <= timeEnd) {
          labels.push(this.result.datasets[j][this.result.x_axis]);
          for(let i=0; i < this.y_selected.length; i++) {
              this.chartData.datasets[i].data.push(this.result.datasets[j][this.y_selected[i]]);
          }
        }
      }
      this.chartData["labels"] = labels;
      // this.chartOptions['plugins']['annotation']['annotations']['v_time'] = {
      //   // drawTime: 'afterDraw',
      //   type: 'line',
      //   value: this.timePosition,
      //   mode: 'vertical',
      //   // xMax: this.timePosition,
      //   // borderColor: 'rgb(255, 99, 132)',
      //   // borderWidth: 2,
      //   // label: {
      //   //   borderWidth: 2,
      //   //   borderCapStyle: 'butt',
      //   // }
      // }

      // console.log(this.chartData)
      // Show spinner and hide chart until finished.
      // document.getElementById("spinner-layer").style.display = "None";
      // document.getElementById("chart").style.display = "block";


    },
    onResetZoom() {
        const chart = this.$refs.chartRef.getCurrentChart();
        if (chart) {
          chart.resetZoom();
        }
    },
  }
};
</script>

<style>
.linear-chart {
  height: 100%;
}

.linear-chart-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  margin-bottom: 4px;
  z-index: 1;
  background: black;
}

.linear-chart-toolbar .toolbar-btn {
  flex-shrink: 0;
}

.linear-chart-toolbar .toolbar-item {
  flex-shrink: 0;
}

.linear-chart-toolbar .toolbar-y-select {
  min-width: 0;
  flex: 1;
  max-width: 320px;
}

@media (max-width: 600px) {
  .linear-chart-toolbar {
    align-items: stretch;
    padding-left: 12px;
    padding-right: 12px;
  }

  .linear-chart-toolbar .toolbar-btn {
    width: auto;
    min-width: 0;
    padding-left: 12px;
    padding-right: 12px;
  }

  /* Y Quantities on its own row below when not enough space */
  .linear-chart-toolbar .toolbar-y-select {
    flex-basis: 100%;
    width: 100%;
    max-width: 100%;
    order: 10;
  }
}
</style>
