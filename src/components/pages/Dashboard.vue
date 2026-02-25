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
        ref="chartBox"
        class="chart-resizable"
        :style="chartContainerStyle"
        @pointerdown="onChartBoxPointerDown"
      >
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

        <div v-if="showEmptyStateMessage" class="empty-state-message">
          No data selected. Choose a subject, session, and trial to display the chart.
        </div>
      </div>

      <v-btn
        small
        class="chart-reset-zoom-btn"
        @click="onResetZoom"
      >
        Reset Zoom
      </v-btn>
    </div>

    <!-- Floating buttons (mobile); hide when corresponding sidebar is open -->
    <div class="fixed-button fixed-button-to-left" v-show="leftMenuClosed">
      <v-btn @click="toggleLeftMenu">
        Data
      </v-btn>
    </div>

    <div class="fixed-button fixed-button-to-right" v-show="rightMenuClosed">
      <v-btn @click="toggleRightMenu">
        Settings
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
          <v-icon left small>mdi-download</v-icon>
          Download Chart
        </v-btn>
        <v-btn block class="mt-2" @click="onChartDownloadWhite">
          <v-icon left small>mdi-download</v-icon>
          Download Chart (White)
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

        <v-text-field
          v-model="chart_width_input"
          label="Chart Width (px)"
          dense
          outlined
          type="number"
          @change="onChartSizeInput"
          @keyup.enter="onChartSizeInput"
        />

        <v-text-field
          v-model="chart_height_input"
          label="Chart Height (px)"
          dense
          outlined
          type="number"
          @change="onChartSizeInput"
          @keyup.enter="onChartSizeInput"
        />

        <v-select
          v-model="chart_color_scales_selected"
          :items="chart_color_scales_options"
          label="Color Scale"
          dense outlined
          @change="drawChart"
        />

        <v-text-field
          v-model.number="chart_line_width"
          label="Line Width"
          dense
          outlined
          type="number"
          @input="drawChart"
        />

        <v-select
          v-model="chart_point_style"
          :items="chart_point_style_options"
          label="Point Style"
          dense
          outlined
          @change="drawChart"
        />

        <v-text-field
          v-model.number="chart_point_radius"
          label="Point Size"
          dense
          outlined
          type="number"
          @input="drawChart"
        />

        <v-select
          v-model="chartOptions.plugins.legend.position"
          :items="chart_legend_position"
          label="Legend Position"
          dense
          outlined
        />

        <v-select
          v-model="chartOptions.plugins.legend.align"
          :items="chart_legend_alignment"
          label="Legend Alignment"
          dense
          outlined
        />

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
      leftMenuClosed: false,
      rightMenuClosed: false,

      selected_trials: [],
      public_session_id: null,
      current_session_id: null,
      x_quantities: [],
      y_quantities: [],
      x_quantity_selected: null,
      y_quantities_selected: [],
      chart_line_width: 5,
      chart_width: 900,
      chart_height: 560,
      chart_width_input: '900',
      chart_height_input: '560',
      min_chart_width: 100,
      min_chart_height: 100,
      chart_point_style_options: ['none', 'circle', 'cross', 'crossRot', 'dash', 'line', 'rect', 'rectRounded', 'rectRot', 'star', 'triangle'],
      chart_point_style: 'none',
      chart_point_radius: 12,
      chart_legend_position: ['top', 'right', 'bottom', 'left', 'chartArea'],
      chart_legend_alignment: ['start', 'center', 'end'],
      chartResizeObserver: null,
      lastObservedChartBoxWidth: 0,
      lastObservedChartBoxHeight: 0,
      isChartManualResizeActive: false,

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
            color: '#ffffff',
            font: { size: 28 }
          },
          subtitle: {
            display: true,
            text: '',
            color: '#ffffff',
            font: { size: 14 },
            padding: {
              bottom: 20
            }
          },
          legend: {
            position: 'bottom',
            align: 'center',
            labels: {
              color: '#ffffff'
            }
          },
          zoom: {
            pan: { enabled: true, mode: 'xy' },
            zoom: { wheel: { enabled: true }, drag: { enabled: true } }
          }
        },
        scales: {
          x: {
            type: 'linear',
            border: {
              color: '#ffffff'
            },
            ticks: {
              color: '#ffffff'
            },
            title: {
              display: true,
              color: '#ffffff',
              font: {
                size: 18
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.15)'
            }
          },
          y: {
            type: 'linear',
            border: {
              color: '#ffffff'
            },
            ticks: {
              color: '#ffffff'
            },
            title: {
              display: true,
              color: '#ffffff',
              font: {
                size: 18
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.15)'
            }
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
    },

    chartContainerStyle () {
      return {
        width: `${this.chart_width}px`,
        height: `${this.chart_height}px`
      }
    },

    showEmptyStateMessage () {
      if (this.loading) {
        return false
      }
      const hasSelectedTrial = this.selected_trials.some(selection => !!selection?.trial_selected)
      return !hasSelectedTrial
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
      if (!this.leftMenuClosed && this.$vuetify.breakpoint.smAndDown) {
        this.rightMenuClosed = true
      }
    },

    toggleRightMenu () {
      this.rightMenuClosed = !this.rightMenuClosed
      if (!this.rightMenuClosed && this.$vuetify.breakpoint.smAndDown) {
        this.leftMenuClosed = true
      }
    },

    closeMenusOnMobile () {
      this.leftMenuClosed = true
      this.rightMenuClosed = true
    },

    onXQuantitySelected () {
      this.chartOptions.scales.x.title.text = this.x_quantity_selected || ''
      this.drawChart()
    },

    onYQuantitySelected () {
      this.chartOptions.scales.y.title.text = this.y_quantities_selected.join(', ')
      this.drawChart()
    },

    onResetZoom () {
      this.$refs.chartRef?.getCurrentChart()?.resetZoom()
    },

    onChartSizeInput () {
      const parsedWidth = parseInt(this.chart_width_input, 10)
      const parsedHeight = parseInt(this.chart_height_input, 10)
      this.chart_width = Math.max(this.min_chart_width, Number.isFinite(parsedWidth) ? parsedWidth : this.min_chart_width)
      this.chart_height = Math.max(this.min_chart_height, Number.isFinite(parsedHeight) ? parsedHeight : this.min_chart_height)
      this.chart_width_input = String(this.chart_width)
      this.chart_height_input = String(this.chart_height)
      this.$nextTick(() => {
        this.$refs.chartRef?.getCurrentChart()?.resize()
      })
    },

    onChartBoxPointerDown (event) {
      const chartBox = this.$refs.chartBox
      if (!chartBox || !event) {
        return
      }
      const rect = chartBox.getBoundingClientRect()
      const edgeThreshold = 24
      const nearRightEdge = (rect.right - event.clientX) <= edgeThreshold
      const nearBottomEdge = (rect.bottom - event.clientY) <= edgeThreshold
      this.isChartManualResizeActive = nearRightEdge && nearBottomEdge
    },

    onWindowPointerUp () {
      this.isChartManualResizeActive = false
    },

    async drawChart () {
      this.loading = true
      const nextChartData = {
        labels: [],
        datasets: []
      }

      try {
        if (!this.x_quantity_selected || !this.y_quantities_selected.length) {
          this.applyChartData(nextChartData)
          return
        }

        const colors = this.getSeriesColors(this.y_quantities_selected.length)

        const dashedLineStyles = [
          [], [5, 5], [10, 10], [20, 5], [15, 3, 3, 3], [20, 3, 3, 3, 3, 3, 3, 3], [12, 3, 3]
        ]

        const contextSet = new Set()
        this.selected_trials.forEach(selection => {
          const context = this.buildSelectionContext(selection)
          if (context) {
            contextSet.add(context)
          }
        })
        this.chartOptions.plugins.subtitle.text = Array.from(contextSet).join(' | ')

        for (let i = 0; i < this.selected_trials.length; i++) {
          const selection = this.selected_trials[i]
          const trial = selection?.trial_selected
          if (!trial) {
            continue
          }

          const ikResult = trial.results?.find(element => element.tag === 'ik_results')
          if (!ikResult?.media) {
            continue
          }

          const data = await this.fetchResultText(ikResult.media)
          const lines = String(data || '').split('\n')

          let nRows = 0
          let k = 0
          while (k < lines.length && lines[k].trim() !== 'endheader') {
            const headerLine = lines[k].trim()
            const nRowsMatch = headerLine.match(/^nRows\s*=?\s*(\d+)/i)
            if (nRowsMatch) {
              nRows = parseInt(nRowsMatch[1], 10) || 0
            }
            k++
          }

          while (k < lines.length && lines[k].trim() === 'endheader') {
            k++
          }
          while (k < lines.length && lines[k].trim() === '') {
            k++
          }

          if (k >= lines.length) {
            continue
          }

          const headerColumns = this.splitColumns(lines[k])
          const xIndex = headerColumns.indexOf(this.x_quantity_selected)
          if (xIndex < 0) {
            continue
          }
          const yIndexes = this.y_quantities_selected
            .map(y => ({ key: y, index: headerColumns.indexOf(y) }))
            .filter(item => item.index >= 0)

          if (!yIndexes.length) {
            continue
          }

          const startIndex = nextChartData.datasets.length
          for (let j = 0; j < yIndexes.length; j++) {
            nextChartData.datasets.push({
              label: yIndexes[j].key,
              data: [],
              backgroundColor: colors[j],
              borderColor: colors[j],
              borderWidth: this.chart_line_width,
              borderDash: dashedLineStyles[i % dashedLineStyles.length],
              pointStyle: this.chart_point_style,
              pointRadius: this.chart_point_style === 'none' ? 0 : this.chart_point_radius
            })
          }

          k++
          const dataStartIndex = k
          const effectiveRowCount = nRows > 0 ? nRows : (lines.length - dataStartIndex)
          for (let row = 0; row < effectiveRowCount && (row + dataStartIndex) < lines.length; row++) {
            const lineArray = this.splitColumns(lines[row + dataStartIndex])
            if (!lineArray.length) {
              continue
            }
            const xValue = parseFloat(lineArray[xIndex])
            if (Number.isNaN(xValue)) {
              continue
            }
            for (let m = 0; m < yIndexes.length; m++) {
              const yValue = parseFloat(lineArray[yIndexes[m].index])
              if (Number.isNaN(yValue)) {
                continue
              }
              nextChartData.datasets[startIndex + m].data.push({
                x: xValue + (selection?.offset || 0),
                y: yValue
              })
            }
          }
        }
      } catch (error) {
        console.error('drawChart error', error)
      } finally {
        this.applyChartData(nextChartData)
        this.loading = false
      }
    },

    applyChartData (nextChartData) {
      const labels = Array.isArray(nextChartData?.labels) ? nextChartData.labels : []
      const datasets = Array.isArray(nextChartData?.datasets) ? nextChartData.datasets : []
      const hasPoints = datasets.some(dataset =>
        Array.isArray(dataset?.data) && dataset.data.some(point =>
          Number.isFinite(point?.x) && Number.isFinite(point?.y)
        )
      )
      const renderDatasets = hasPoints
        ? datasets
        : [{
            label: 'No data selected',
            data: [
              { x: 0, y: 0.5 },
              { x: 1, y: 0.5 }
            ],
            borderColor: 'rgba(255,255,255,0.45)',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderWidth: 2,
            borderDash: [8, 6],
            pointRadius: 0
          }]

      this.chartData.labels = labels
      this.chartData.datasets = renderDatasets

      this.$nextTick(() => {
        const chart = this.$refs.chartRef?.getCurrentChart?.()
        if (!chart) {
          return
        }
        // Keep axes visible when there are no plottable points.
        chart.options.scales.x.min = hasPoints ? undefined : 0
        chart.options.scales.x.max = hasPoints ? undefined : 1
        chart.options.scales.y.min = hasPoints ? undefined : 0
        chart.options.scales.y.max = hasPoints ? undefined : 1
        chart.data = {
          labels,
          datasets: renderDatasets
        }
        chart.update('none')
      })
    },

    onChartDownload () {
      const canvas = document.querySelector('#chart canvas')
      const link = document.createElement('a')
      link.download = 'chart.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    },

    async onChartDownloadWhite () {
      const chart = this.$refs.chartRef?.getCurrentChart?.()
      if (!chart) {
        return
      }

      const width = chart.width || 1400
      const height = chart.height || 900
      const exportCanvas = document.createElement('canvas')
      exportCanvas.width = width
      exportCanvas.height = height
      const exportCtx = exportCanvas.getContext('2d')
      if (!exportCtx) {
        return
      }

      const exportData = JSON.parse(JSON.stringify(this.chartData || {}))
      const exportOptions = this.buildWhiteExportOptions(width, height)

      const whiteBackgroundPlugin = {
        id: 'whiteBackgroundPlugin',
        beforeDraw(chartInstance) {
          const { ctx, canvas } = chartInstance
          ctx.save()
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.restore()
        }
      }

      const exportChart = new ChartJS(exportCtx, {
        type: 'line',
        data: exportData,
        options: exportOptions,
        plugins: [whiteBackgroundPlugin]
      })

      exportChart.update('none')
      const link = document.createElement('a')
      link.download = 'chart-white.png'
      link.href = exportCanvas.toDataURL('image/png')
      link.click()
      exportChart.destroy()
    },

    buildWhiteExportOptions (width, height) {
      const clone = JSON.parse(JSON.stringify(this.chartOptions || {}))
      clone.responsive = false
      clone.maintainAspectRatio = false
      clone.animation = false
      clone.devicePixelRatio = 2
      clone.layout = clone.layout || {}
      clone.layout.padding = clone.layout.padding || { top: 12, right: 12, bottom: 12, left: 12 }

      clone.plugins = clone.plugins || {}
      clone.plugins.title = clone.plugins.title || {}
      clone.plugins.title.color = '#000000'
      clone.plugins.subtitle = clone.plugins.subtitle || {}
      clone.plugins.subtitle.color = '#000000'
      clone.plugins.legend = clone.plugins.legend || {}
      clone.plugins.legend.labels = clone.plugins.legend.labels || {}
      clone.plugins.legend.labels.color = '#000000'

      clone.scales = clone.scales || {}
      clone.scales.x = clone.scales.x || {}
      clone.scales.x.ticks = clone.scales.x.ticks || {}
      clone.scales.x.ticks.color = '#000000'
      clone.scales.x.title = clone.scales.x.title || { display: true }
      clone.scales.x.title.color = '#000000'
      clone.scales.x.grid = clone.scales.x.grid || {}
      clone.scales.x.grid.color = 'rgba(0, 0, 0, 0.12)'
      clone.scales.x.border = clone.scales.x.border || {}
      clone.scales.x.border.color = '#000000'

      clone.scales.y = clone.scales.y || {}
      clone.scales.y.ticks = clone.scales.y.ticks || {}
      clone.scales.y.ticks.color = '#000000'
      clone.scales.y.title = clone.scales.y.title || { display: true }
      clone.scales.y.title.color = '#000000'
      clone.scales.y.grid = clone.scales.y.grid || {}
      clone.scales.y.grid.color = 'rgba(0, 0, 0, 0.12)'
      clone.scales.y.border = clone.scales.y.border || {}
      clone.scales.y.border.color = '#000000'

      return clone
    },

    async fetchResultText (url) {
      if (url.startsWith(axios.defaults.baseURL)) {
        const res = await axios.get(url)
        return res.data
      }
      const axiosClean = axios.create()
      const res = await axiosClean.get(url, {
        transformRequest: [(data, headers) => {
          if (headers && headers.common && headers.common.Authorization) {
            delete headers.common.Authorization
          }
          return data
        }]
      })
      return res.data
    },

    buildSelectionContext (selection) {
      const subjectName = selection?.subject_selected?.name || ''
      let sessionName = selection?.session_selected?.meta?.sessionName
      if (!sessionName) {
        sessionName = selection?.session_selected?.id?.split('-')?.[0] || ''
      } else {
        const sessionShortId = selection?.session_selected?.id?.split('-')?.[0] || ''
        sessionName = sessionShortId ? `${sessionName} (${sessionShortId})` : sessionName
      }
      const trialName = selection?.trial_selected?.name || ''
      return [subjectName, sessionName, trialName].filter(Boolean).join(' : ')
    },

    async loadTrialResults () {
      this.loading = true
      this.x_quantities = []
      this.y_quantities = []

      for (let i = 0; i < this.selected_trials.length; i++) {
        const trial = this.selected_trials[i]?.trial_selected
        if (!trial) {
          continue
        }
        const ikResult = trial.results?.find(element => element.tag === 'ik_results')
        if (!ikResult?.media) {
          continue
        }
        const data = await this.fetchResultText(ikResult.media)
        const lines = String(data || '').split('\n')

        let k = 0
        while (k < lines.length && lines[k].trim() !== 'endheader') {
          k++
        }
        while (k < lines.length && lines[k].trim() === 'endheader') {
          k++
        }
        while (k < lines.length && lines[k].trim() === '') {
          k++
        }
        if (k >= lines.length) {
          continue
        }

        this.x_quantities = this.splitColumns(lines[k])
        this.y_quantities = this.x_quantities.slice(1)

        if (!this.x_quantity_selected || !this.x_quantities.includes(this.x_quantity_selected)) {
          this.x_quantity_selected = this.x_quantities[0] || null
          this.chartOptions.scales.x.title.text = this.x_quantity_selected || 'X axis title'
        }
        if (!this.y_quantities_selected.length) {
          this.y_quantities_selected = this.y_quantities.length ? [this.y_quantities[0]] : []
        } else {
          this.y_quantities_selected = this.y_quantities_selected.filter(y => this.y_quantities.includes(y))
          if (!this.y_quantities_selected.length && this.y_quantities.length) {
            this.y_quantities_selected = [this.y_quantities[0]]
          }
        }
        this.chartOptions.scales.y.title.text = this.y_quantities_selected.join(', ')
        break
      }

      await this.drawChart()
    },

    splitColumns (line) {
      const raw = String(line || '').trim()
      if (!raw) {
        return []
      }
      if (raw.includes('\t')) {
        return raw.split('\t').map(v => v.trim()).filter(Boolean)
      }
      return raw.split(/\s+/).map(v => v.trim()).filter(Boolean)
    },

    getSeriesColors (count) {
      if (!count || count < 1) {
        return []
      }

      // Ensure visible colors on dark canvas even if chroma scale name fails.
      const fallback = ['#4dd0e1', '#ffd166', '#06d6a0', '#ef476f', '#a78bfa']

      try {
        if (this.chart_color_scales_selected === 'Viridis') {
          return chroma
            .scale(['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'])
            .mode('lab')
            .colors(count + 2)
            .slice(1, count + 1)
        }

        if (Array.isArray(this.chart_color_scales_selected)) {
          return chroma
            .scale(this.chart_color_scales_selected)
            .mode('lab')
            .colors(count + 2)
            .slice(1, count + 1)
        }

        const generated = chroma
          .scale(this.chart_color_scales_selected)
          .correctLightness()
          .gamma(2)
          .cache(false)
          .colors(count + 2)
          .slice(1, count + 1)

        const allDark = generated.every(color => {
          try {
            const [r, g, b] = chroma(color).rgb()
            return r < 30 && g < 30 && b < 30
          } catch (e) {
            return true
          }
        })

        if (!allDark) {
          return generated
        }
      } catch (e) {
        // Fall through to visible fallback colors.
      }

      return Array.from({ length: count }, (_, i) => fallback[i % fallback.length])
    },

    createEmptyTrialSelection () {
      return {
        uuid: this.generateUUID(),
        subject_selected: null,
        session_selected: null,
        trial_selected: null,
        offset: 0
      }
    },

    async captureTrialSelection (selection) {
      const idx = this.selected_trials.findIndex(item => item.uuid === selection.uuid)
      if (idx >= 0) {
        Vue.set(this.selected_trials, idx, selection)
      } else {
        this.selected_trials.push(selection)
      }
      this.current_session_id = selection?.session_selected?.id || this.current_session_id
      await this.loadTrialResults()
    },

    async removeTrialSelection (uuid) {
      const idx = this.selected_trials.findIndex(item => item.uuid === uuid)
      if (idx >= 0) {
        this.selected_trials.splice(idx, 1)
      }
      if (!this.selected_trials.length) {
        this.selected_trials.push(this.createEmptyTrialSelection())
      }
      await this.loadTrialResults()
    },

    generateUUID () {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID()
      }
      return `trial-${Date.now()}-${Math.random().toString(16).slice(2)}`
    },

    initChartResizeObserver () {
      if (!window.ResizeObserver || !this.$refs.chartBox) {
        return
      }
      this.chartResizeObserver = new ResizeObserver((entries) => {
        const entry = entries && entries[0]
        if (!entry) {
          return
        }
        const width = Math.round(entry.contentRect.width)
        const height = Math.round(entry.contentRect.height)
        const widthChanged = Math.abs(width - this.lastObservedChartBoxWidth) > 1
        const heightChanged = Math.abs(height - this.lastObservedChartBoxHeight) > 1

        if (!widthChanged && !heightChanged) {
          return
        }

        this.lastObservedChartBoxWidth = width
        this.lastObservedChartBoxHeight = height
        if (this.isChartManualResizeActive) {
          this.chart_width = Math.max(this.min_chart_width, width)
          this.chart_height = Math.max(this.min_chart_height, height)
          this.chart_width_input = String(this.chart_width)
          this.chart_height_input = String(this.chart_height)
        }
        this.$nextTick(() => {
          this.$refs.chartRef?.getCurrentChart()?.resize()
        })
      })
      this.chartResizeObserver.observe(this.$refs.chartBox)
    }
  },

  async mounted () {
    if (this.$vuetify.breakpoint.smAndDown) {
      this.leftMenuClosed = true
      this.rightMenuClosed = true
    }
    if (!this.selected_trials.length) {
      this.selected_trials.push(this.createEmptyTrialSelection())
    }
    const sessionId = this.$route.params.id
    this.current_session_id = sessionId || null
    if (sessionId) {
      await this.loadSubjects({ session_id: sessionId })
      await this.loadSession(sessionId)
      if (this.session?.public) {
        this.public_session_id = sessionId
      }
      const subject = this.subjects.find(subjectItem => subjectItem.id === this.session.subject) || null
      const firstTrial = this.session?.trials?.find(trial => trial.status === 'done' && trial.name !== 'neutral' && trial.name !== 'calibration') || null
      if (firstTrial) {
        this.selected_trials = [{
          uuid: this.generateUUID(),
          subject_selected: subject,
          session_selected: this.session,
          trial_selected: firstTrial,
          offset: 0
        }]
      }
    } else {
      await this.loadSubjects({})
    }
    await this.loadTrialResults()
    this.initChartResizeObserver()
    window.addEventListener('pointerup', this.onWindowPointerUp)
  },

  beforeDestroy () {
    if (this.chartResizeObserver) {
      this.chartResizeObserver.disconnect()
      this.chartResizeObserver = null
    }
    window.removeEventListener('pointerup', this.onWindowPointerUp)
  }
}
</script>


<style lang="scss">
#body {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: auto;
  min-height: 100%;
  width: 100%;
  overflow: visible;
  background-color: black;
  transition: padding 0.3s ease;
}

/* Desktop: adjust padding when sidebars are open to prevent occlusion */
@media (min-width: 961px) {
  #body.chart-page:not(.left-menu-closed) {
    padding-left: 300px;
  }

  #body.chart-page:not(.right-menu-closed) {
    padding-right: 300px;
  }
}

/* ===== CHART ===== */
.content-chart {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.chart-resizable {
  position: relative;
  resize: both;
  overflow: hidden;
  background-color: #000;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.chart-canvas {
  width: 100%;
  height: 100%;
}

.chart-reset-zoom-btn {
  margin-top: 8px;
  align-self: flex-end;
}

.empty-state-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 30;
  color: #ffffff;
  text-align: center;
  font-size: 18px;
  line-height: 1.4;
  max-width: min(80%, 640px);
  pointer-events: none;
  background: rgba(0, 0, 0, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  padding: 12px 16px;
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
  top: var(--app-bar-top-offset, 64px);
  bottom: 0;
  width: 300px;
  max-width: 85vw;
  background: #111;
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
@media (max-width: 960px) {
  .content-chart {
    width: 100%;
    height: auto;
    min-height: auto;
    padding: 8px 0 0;
    align-items: flex-start;
    justify-content: flex-start;
  }

  .chart-resizable {
    width: 100vw !important;
    max-width: 100%;
    min-width: 0;
    height: calc(100vh - var(--app-bar-top-offset, 64px) - 120px) !important;
    max-height: calc(100dvh - var(--app-bar-top-offset, 64px) - 120px) !important;
    min-height: 280px !important;
    resize: vertical;
  }

  .sidebar {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-width: 100%;
    max-height: 80vh;
    border-radius: 16px 16px 0 0;
    border-right: none;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.18);
    z-index: 200;
    transform: translateY(0);
    visibility: visible !important;
  }

  .sidebar::before {
    content: '';
    display: block;
    width: 40px;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.3);
    margin: 8px auto 0;
    flex-shrink: 0;
  }

  .left-sidebar,
  .right-sidebar {
    left: 0;
    right: 0;
  }

  .left-menu-closed .left-sidebar,
  .right-menu-closed .right-sidebar {
    transform: translateY(100%);
    pointer-events: none;
  }

  .sidebar .v-card__text {
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
  }

  .dashboard-overlay {
    z-index: 190;
  }

  .fixed-button {
    position: fixed !important;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 16px) !important;
    z-index: 120;
    margin: 0 !important;
  }

  .fixed-button .v-btn {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    background: #333 !important;
  }

  .fixed-button-to-left {
    left: 16px !important;
    right: auto !important;
  }

  .fixed-button-to-right {
    right: 16px !important;
    left: auto !important;
  }
}

/* ===== FLOATING BUTTONS ===== */
.fixed-button {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
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
  flex: 0 0 auto;
}

.sidebar .v-card__text {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
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
  min-height: calc(100dvh - var(--app-bar-height, 64px));
  max-height: none;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
  padding-top: var(--app-bar-top-offset, 64px);
}

/* Override Vuetify layout padding that reserves left/right space (v-main is parent of this page) */
.v-main:has(.chart-page-wrapper) {
  padding-top: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  padding-bottom: 0 !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
}
</style>
