<template>
  <div class="chart-page-wrapper">
    <!-- Mobile: overlay to close sidebars when clicking outside -->
    <div
      v-if="(!leftMenuClosed || !rightMenuClosed) && $vuetify.breakpoint.smAndDown"
      class="dashboard-overlay"
      @click="closeMenusOnMobile"
    />
    <div
      id="body"
      class="chart-page"
      :class="{
        'left-menu-closed': leftMenuClosed,
        'right-menu-closed': rightMenuClosed
      }"
    >
    <!-- Chart container -->
    <div class="content-chart">
      <div
        id="spinner-layer"
        class="spinner-layer"
        v-show="loading"
      >
        <div class="spinner"></div>
        <h3>Loading Chart</h3>
      </div>

      <LineChartGenerator
        id="chart"
        ref="chartRef"
        :chart-options="chartOptions"
        :chart-data="chartData"
        class="chart-canvas"
      />
    </div>

    <!-- Floating buttons (mobile); hide when corresponding sidebar is open -->
    <div class="fixed-button fixed-button-to-left" v-show="leftMenuClosed">
      <v-btn icon @click="toggleLeftMenu">
        <v-icon>mdi-database</v-icon>
      </v-btn>
    </div>

    <div class="fixed-button fixed-button-to-right" v-show="rightMenuClosed">
      <v-btn icon @click="toggleRightMenu">
        <v-icon>mdi-tune</v-icon>
      </v-btn>
    </div>

    <!-- LEFT MENU -->
    <v-card class="sidebar left-sidebar">
      <div class="menu-header">
        <span>Data</span>
        <v-btn icon @click="toggleLeftMenu">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text>
        <div v-for="(trial, idx) in selected_trials" :key="trial.uuid">
          <TrialSelect
            :trialSelection="trial"
            :selectionIndex="idx"
            :publicSessionId="public_session_id"
            @trial-selected="captureTrialSelection"
            @trial-remove="removeTrialSelection"
          />
        </div>

        <v-select
          v-model="x_quantity_selected"
          :items="x_quantities"
          label="X Quantity"
          dense outlined
          @change="onXQuantitySelected"
        />

        <v-select
          v-model="y_quantities_selected"
          :items="y_quantities"
          label="Y Quantities"
          multiple
          dense outlined
          @change="onYQuantitySelected"
        />

        <v-btn block class="mt-4" @click="onChartDownload">
          Download Chart
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- RIGHT MENU -->
    <v-card class="sidebar right-sidebar">
      <div class="menu-header">
        <span>Options</span>
        <v-btn icon @click="toggleRightMenu">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text>
        <v-text-field
          v-model="chartOptions.plugins.title.text"
          label="Title"
          dense outlined
        />

        <v-text-field
          v-model="chartOptions.plugins.subtitle.text"
          label="Subtitle"
          dense outlined
        />

        <v-text-field
          v-model="chartOptions.scales.x.title.text"
          label="X Axis Title"
          dense outlined
        />

        <v-text-field
          v-model="chartOptions.scales.y.title.text"
          label="Y Axis Title"
          dense outlined
        />

        <v-select
          v-model="chart_color_scales_selected"
          :items="chart_color_scales_options"
          label="Color Scale"
          dense outlined
          @change="drawChart"
        />

        <v-btn block class="mt-4" @click="onResetZoom">
          Reset Zoom
        </v-btn>
      </v-card-text>
    </v-card>
    </div>
  </div>
</template>


<script>
import { mapState, mapActions } from 'vuex'
import axios from 'axios'
import chroma from 'chroma-js'
import Vue from 'vue'
import { Line as LineChartGenerator } from 'vue-chartjs/legacy'
import zoomPlugin from 'chartjs-plugin-zoom'
import TrialSelect from '@/components/ui/TrialSelect.vue'

import {
  Chart as ChartJS,
  Title,
  SubTitle,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement
} from 'chart.js'

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
  name: 'ChartPage',
  components: {
    LineChartGenerator,
    TrialSelect
  },

  data () {
    return {
      loading: false,
      leftMenuClosed: true,
      rightMenuClosed: true,

      selected_trials: [],
      x_quantities: [],
      y_quantities: [],
      x_quantity_selected: null,
      y_quantities_selected: [],

      chart_color_scales_selected: 'Viridis',
      chart_color_scales_options: [
        { text: 'Viridis', value: 'Viridis' },
        { text: 'Hot', value: ['black', 'red', 'yellow'] },
        { text: 'Yellow-Blue', value: ['yellow', 'blue'] }
      ],

      chartData: {
        datasets: []
      },

      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Chart',
            font: { size: 28 }
          },
          subtitle: {
            display: true,
            text: '',
            font: { size: 14 }
          },
          legend: {
            position: 'bottom'
          },
          zoom: {
            pan: { enabled: true, mode: 'xy' },
            zoom: { wheel: { enabled: true }, drag: { enabled: true } }
          }
        },
        scales: {
          x: {
            type: 'linear',
            title: { display: true }
          },
          y: {
            type: 'linear',
            title: { display: true }
          }
        }
      }
    }
  },

  computed: {
    ...mapState({
      session: state => state.data.session,
      subjects: state => state.data.subjects,
      loggedIn: state => state.auth.verified
    }),

    isMobile () {
      return window.innerWidth < 600
    }
  },

  watch: {
    isMobile (val) {
      this.chartOptions.plugins.legend.display = !val
      this.chartOptions.plugins.title.font.size = val ? 18 : 28
    }
  },

  methods: {
    ...mapActions('data', ['loadSession', 'loadSubjects']),

    toggleLeftMenu () {
      this.leftMenuClosed = !this.leftMenuClosed
    },

    toggleRightMenu () {
      this.rightMenuClosed = !this.rightMenuClosed
    },

    closeMenusOnMobile () {
      this.leftMenuClosed = true
      this.rightMenuClosed = true
    },

    onXQuantitySelected () {
      this.drawChart()
    },

    onYQuantitySelected () {
      this.drawChart()
    },

    onResetZoom () {
      this.$refs.chartRef?.getCurrentChart()?.resetZoom()
    },

    async drawChart () {
      this.loading = true
      this.chartData.datasets = []

      const colors = chroma
        .scale(this.chart_color_scales_selected)
        .colors(this.y_quantities_selected.length)

      this.y_quantities_selected.forEach((y, i) => {
        this.chartData.datasets.push({
          label: y,
          data: [],
          borderColor: colors[i],
          borderWidth: 3,
          pointRadius: this.isMobile ? 0 : 4
        })
      })

      this.loading = false
    },

    onChartDownload () {
      const canvas = document.querySelector('#chart canvas')
      const link = document.createElement('a')
      link.download = 'chart.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    },

    generateUUID () {
      return crypto.randomUUID()
    }
  },

  async mounted () {
    await this.loadSubjects({ session_id: this.$route.params.id })
    await this.loadSession(this.$route.params.id)
  }
}
</script>


<style lang="scss">
#body {
  position: relative;
  min-height: 100%;
  width: 100%;
  overflow: visible;
  background-color: black;
}

/* ===== CHART ===== */
.content-chart {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 8px;
  box-sizing: border-box;
}

.chart-canvas {
  width: 100%;
  height: 100%;
}

/* ===== SPINNER ===== */
.spinner-layer {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: black;
  z-index: 50;
}

/* ===== MOBILE OVERLAY (click outside to close sidebars) ===== */
.dashboard-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 90;
  cursor: pointer;
}

/* ===== SIDEBARS ===== */
.sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 300px;
  max-width: 85vw;
  background: #111;
  z-index: 100;
  overflow-y: auto;
  transition: transform 0.3s ease;
  will-change: transform;
}

.left-sidebar {
  left: 0;
}

.right-sidebar {
  right: 0;
}

/* closed states */
.left-menu-closed .left-sidebar {
  transform: translateX(-100%);
}

.right-menu-closed .right-sidebar {
  transform: translateX(100%);
}

/* ===== MOBILE ===== */
@media (max-width: 600px) {
  .left-sidebar,
  .right-sidebar {
    width: 100%;
  }

  .left-menu-closed .left-sidebar {
    transform: translateY(-100%);
  }

  .right-menu-closed .right-sidebar {
    transform: translateY(100%);
  }
}

/* ===== FLOATING BUTTONS ===== */
.fixed-button {
  position: fixed;
  bottom: 16px;
  z-index: 120;
  width: auto;
  max-width: fit-content;
  height: auto;
  min-height: 0;
}

.fixed-button .v-btn {
  width: auto;
  min-width: 44px;
  min-height: 44px;
  flex-shrink: 0;
}

.fixed-button-to-left {
  left: 16px;
  right: auto;
}

.fixed-button-to-right {
  right: 16px;
  left: auto;
}

/* ===== MENU HEADER ===== */
.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  font-weight: bold;
  border-bottom: 1px solid #333;
  color: white;
}

/* ===== SPINNER ===== */
.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255,255,255,0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

</style>

<!-- Route-scoped: zero v-main padding when Dashboard is shown so chart uses full width; page scrollable -->
<style lang="scss">
.chart-page-wrapper {
  width: 100%;
  min-height: calc(100vh - var(--app-bar-height, 64px));
  max-height: calc(100vh - var(--app-bar-height, 64px));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Override Vuetify layout padding that reserves left/right space (v-main is parent of this page) */
.v-main:has(.chart-page-wrapper) {
  padding-left: 0 !important;
  padding-right: 0 !important;
  overflow: visible;
}
</style>
