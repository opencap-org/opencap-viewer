<template>
  <div class="analysis-dashboard-wrapper">
    <div
      v-if="!leftMenuClosed && $vuetify.breakpoint.smAndDown"
      class="analysis-dashboard-overlay"
      @click="leftMenuClosed = true"
    />
    <div id="body" class="chart-page d-flex flex-column right-menu-closed" :class="{ 'left-menu-closed': leftMenuClosed }">
      <div class="dashboard-body" :class="{ 'has-metrics': hasMetricsColumn }" v-if="show_dashboard">
        <div
          v-for="(column, column_name, column_idx) in dashboard.layout"
          :key="column_idx"
          :class="[column.classes, 'dashboard-column', { 'metrics-column': isMetricsColumn(column) }]">
          <div
            v-for="(block, blockIndex) in column.widgets"
            :key="block._id || block.id || `${column_name}-${blockIndex}`"
            :class="[
              'dashboard-widget',
              block.classes,
              {
                'visualizer-widget': isVisualizerBlock(block),
                'plot-widget': isLinearChartBlock(block),
                'metric-widget': isMetricsBlock(block),
              },
            ]">
            <component :is="block.component"
                       @changeTimePosition="captureTimePosition"
                       :block="block"
                       :result="result"
                       :trialID="trial_selected.id"
                       :timePosition="time_position"
            ></component>
          </div>
        </div>
    </div>

    <div v-if="!show_dashboard" class="empty-state">
      <div class="empty-state-content">
        <v-icon size="64" color="grey lighten-1">mdi-chart-box-outline</v-icon>
        <h2 class="mt-4 mb-2">No Data Selected</h2>
        <p class="text-body-1">Please select a subject, session, and trial from the Data menu to view the analysis dashboard.</p>
      </div>
    </div>

    <div id="button-left" class="pa-2 fixed-button fixed-button-to-left" v-show="leftMenuClosed">
      <v-btn @click="leftMenu">
        Data
      </v-btn>
    </div>

    <v-card class="sidebar left-sidebar">
      <div class="menu-header">
        <span>Data</span>
        <v-btn icon @click="leftMenu" class="sidebar-close-btn" title="Close menu">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
      <v-card-text height="100%">
        <div class="left d-flex flex-column pa-2">
          <v-card>
            <v-card-text>
              <v-select v-model="subject_selected"
                        item-value="id"
                        item-text="name"
                        :items="dashboardData.subjects"
                        label="Select subject" outlined dense return-object></v-select>
              <v-select v-model="session_selected"
                        item-value="id"
                        item-text="id"
                        :items="filteredSessions"
                        :disabled="!subject_selected"
                        label="Select session" outlined dense return-object></v-select>
              <v-select v-model="trial_selected"
                        item-value="id"
                        item-text="name"
                        :items="filteredTrials"
                        :disabled="!session_selected"
                        label="Select trial" outlined dense return-object></v-select>

<!--              <hr>-->

<!--              {{trial_selected}}-->

            </v-card-text>

            <div class="left d-flex flex-column pa-2">
              <div v-if="loggedIn" class="left d-flex flex-column">

                  <v-dialog v-model="dialog" content-class="app-dialog" width="500" max-width="500" :fullscreen="$vuetify.breakpoint.smAndDown">
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn
                          ref="shareDialogActivator"
                          class="mt-4 w-100 sidebar-action-btn"
                          v-bind="attrs"
                          v-on="on"
                          v-show="loggedIn && trial_selected">
                          <v-icon left small>mdi-share-variant</v-icon>
                          Share analysis
                        </v-btn>
                    </template>

                    <v-card>
                        <v-card-title class="text-h5">
                            Share analysis publicly
                        </v-card-title>

                        <v-card-text>
                          <div v-if="!session_selected?.public">
                            <v-alert color="error" icon="$error">To make your analysis public, you need to make your session public</v-alert>

                            <v-btn color="primary" text @click="setSessionPublic">Make session public</v-btn>
                          </div>

                            <v-container v-if="session_selected?.public">
                                <h3 class="mb-2">Share on</h3>
                                <ShareNetwork network="facebook" class="mr-2" style="text-decoration: none;"
                                    :url="dashboardUrl" title="OpenCap session">
                                    <v-btn><v-icon aria-hidden="false">mdi-facebook</v-icon> &nbsp;Facebook</v-btn>
                                </ShareNetwork>
                                <ShareNetwork network="twitter" class="mr-2" style="text-decoration: none;"
                                    :url="dashboardUrl" title="OpenCap session">
                                    <v-btn><v-icon aria-hidden="false">mdi-twitter</v-icon> &nbsp;Twitter</v-btn>
                                </ShareNetwork>
                                <ShareNetwork network="linkedin" :url="dashboardUrl" style="text-decoration: none;"
                                    title="OpenCap session">
                                    <v-btn><v-icon aria-hidden="false">mdi-linkedin</v-icon> &nbsp;LinkedIn</v-btn>
                                </ShareNetwork>

                                <v-text-field label="Alternatively, copy this link"
                                    v-model="dashboardUrl" class="mt-5" readonly></v-text-field>
                            </v-container>

                        </v-card-text>

                        <v-divider></v-divider>

                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn color="primary" text @click="dialog = false">
                                Close
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>


                <v-btn class="w-100 mt-4 sidebar-action-btn" :to="{ name: 'SelectSession' }">
                  <v-icon left small>mdi-arrow-left</v-icon>
                  Back to session list
                </v-btn>

                <v-btn
                  v-show="trial_selected"
                  class="w-100 mt-4 sidebar-action-btn"
                  @click="$router.push({ name: 'Session', params: { id: session_selected.id } })">
                  <v-icon left small>mdi-play-circle-outline</v-icon>
                  Go to Visualizer
                </v-btn>

              </div>
            </div>

          </v-card>
        </div>
      </v-card-text>
    </v-card>

    </div>
  </div>
</template>

<script>
import Visualizer from '@/components/ui/Visualizer';
import { mapState, mapActions } from 'vuex'
import axios from 'axios'
import {apiWarning} from "@/util/ErrorMessage";
import { Line as LineChartGenerator } from 'vue-chartjs/legacy'
import zoomPlugin from 'chartjs-plugin-zoom';

import ScalarPlot from '@/components/ui/ScalarPlot.vue'
import ScalarValue from '@/components/ui/ScalarValue.vue'
import LinearChart from '@/components/ui/LinearChart.vue'
import IconTooltip from '@/components/ui/IconTooltip.vue';

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

ChartJS.register(
  Title,
  SubTitle,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
  zoomPlugin)

export default {
    name: 'AnalysisDashboard',
    components: {
        Visualizer,
        ScalarPlot,
        ScalarValue,
        LinearChart,
        IconTooltip,
    },
    data() {
      return {
        leftMenuClosed: false,
        subject_selected: null,
        session_selected: null,
        trial_selected: null,
        y_values: [],
        selected_y_values: [],
        time_position: 0,
        result: {},
        show_dashboard: false,
        dialog: null,

        share_subject_id: null,
        share_token: null,
      }
    },
    computed: {
      ...mapState({
        dashboard: state => state.data.analysis_dashboard,
        sessions: state => state.data.sessions,
        session: state => state.data.session,
        subjects: state => state.data.subjects,
        loggedIn: state => state.auth.verified
      }),
      dashboardData() {
        return this.dashboard?.data || { sessions: [], subjects: [], trials: [], results: [] }
      },
      filteredSessions() {
        return this.dashboardData.sessions.filter(session => this.subject_selected && session.subject_id === this.subject_selected.id )
      },
      filteredTrials() {
        return this.dashboardData.trials.filter(trial => this.session_selected && trial.session_id === this.session_selected.id)
      },
      hasMetricsColumn() {
        const columns = Object.values(this.dashboard?.layout || {})
        return columns.some(column => this.isMetricsColumn(column))
      },
      dashboardUrl() {
        return location.origin + "/analysis-dashboard/" + this.dashboard.id +
            '?trialId=' + this.trial_selected?.id +
            '&subjectId=' + this.subject_selected?.id +
            '&shareToken=' + this.subject_selected?.share_token;
      },

    },
    watch: {
      dialog(isOpen) {
        if (!isOpen) {
          this.$nextTick(() => {
            const el = this.$refs.shareDialogActivator?.$el
            if (el && typeof el.blur === 'function') el.blur()
          })
        }
      },
      trial_selected: function (val) {
        this.show_dashboard = false
        this.y_values = []
        this.selected_y_values = []
        this.time_position = 0
        this.result = {}

        this.loadResult()
        if (this.share_subject_id && this.share_token) {
          history.pushState("", "", location.origin + location.pathname + `?trialId=${val.id}&subjectId=${this.share_subject_id}&shareToken=${this.share_token}`);
        } else {
          history.pushState("", "", location.origin + location.pathname + '?trialId=' + val.id);
        }
      },
    },
    async mounted() {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString)
        this.share_subject_id = urlParams.get('subjectId')
        this.share_token = urlParams.get('shareToken')
        this.leftMenuClosed = !!(this.$vuetify.breakpoint.smAndDown)

        try {
          await this.loadAnalysisDashboard({id:this.$route.params.id, subject_id:this.share_subject_id, share_token:this.share_token})
        } catch (error) {
          apiWarning('Unable to load analysis dashboard data.')
          console.error(error)
        }
        let given_trial_id = this.$route.query.trialId
        if (given_trial_id) {
          let trial_selected = this.dashboardData.trials.filter(trial => trial.id === given_trial_id)[0]
          if (trial_selected) {
            let session_selected = this.dashboardData.sessions.filter(session => session.id === trial_selected.session_id)[0]
            let subject_selected = this.dashboardData.subjects.filter(subject => subject.id === session_selected?.subject_id)[0]
            this.subject_selected = subject_selected || null
            this.session_selected = session_selected || null
            this.trial_selected = trial_selected
          }
        }
    },
    methods: {
        ...mapActions('data', ['loadSession', 'loadAnalysisDashboard']),
        leftMenu() {
          this.leftMenuClosed = !this.leftMenuClosed;
        },
        captureTimePosition(time) {
          this.time_position = time;
        },
        isMetricsColumn(column) {
          const widgets = column?.widgets || []
          const columnClass = String(column?.classes || '').toLowerCase()
          if (columnClass.includes('scalar')) {
            return true
          }
          return widgets.some(block => {
            const blockClass = String(block?.classes || '').toLowerCase()
            if (blockClass.includes('scalar')) {
              return true
            }

            const component = block?.component
            if (typeof component === 'string') {
              const name = component.toLowerCase()
              return name.includes('scalar')
            }

            if (component && typeof component === 'object') {
              const name = String(component.name || component.__name || '').toLowerCase()
              return name.includes('scalar') || name.includes('value')
            }

            return false
          })
        },
        componentName(block) {
          const component = block?.component
          if (typeof component === 'string') {
            return component.toLowerCase()
          }
          return String(component?.name || component?.__name || '').toLowerCase()
        },
        isVisualizerBlock(block) {
          return this.componentName(block).includes('visualizer')
        },
        isLinearChartBlock(block) {
          const name = this.componentName(block)
          return name.includes('linearchart') || name.includes('linear-chart')
        },
        isMetricsBlock(block) {
          const name = this.componentName(block)
          const blockClass = String(block?.classes || '').toLowerCase()
          return name.includes('scalar') || blockClass.includes('scalar')
        },
        getResultUrl(trial_id) {
          for(let i=0; i<this.dashboardData.results.length; i++) {
            if (this.dashboardData.results[i].trial_id === trial_id) {
              return this.dashboardData.results[i].media
            }
          }
        },
        loadResult() {
          console.log("loadResult")
          console.log(this.trial_selected)
          this.result = {}
          if (this.trial_selected) {
            let url = this.getResultUrl(this.trial_selected.id)
            console.log(url)
            if (url) {
              const axiosWithoutToken = axios.create();
              delete axiosWithoutToken.defaults.headers.common['Authorization'];
              axiosWithoutToken.get(url)
                .then(response => {
                  this.result = response.data
                  this.show_dashboard = true
                })
                .catch(error => {
                  console.error(error);
                });
            }
          }
        },
       setSessionPublic() {
          axios.patch(`/sessions/${this.session_selected.id}/`, {"public": true}).then(response => {
            this.session_selected.public = true
          }).catch(error => {
            console.error(error);
          });
       },

        // onSessionSelected(sessionName) {
        //   console.log(sessionName)
        //   var sessionIdSelected = sessionName.match(/\((.*)\)/);
        //   if (sessionIdSelected !== null) {
        //     sessionIdSelected = sessionIdSelected.pop();
        //
        //     this.current_session_id = sessionIdSelected;
        //     var session = this.sessions.filter(function (obj) {
        //       if (obj.id === sessionIdSelected) {
        //         return obj.name;
        //       }
        //     });
        //
        //     var trials = session[0]['trials'];
        //     // Filter trials by name.
        //     trials = trials.filter(trial => trial.status === 'done' && trial.name !== 'neutral' && trial.name !== 'calibration')
        //
        //     if (trials.length > 0) {
        //       this.trial_ids = []
        //       this.trial_names = [];
        //       trials.forEach(element => {
        //         this.trial_names.push(element.name);
        //         this.trial_ids.push(element.id)
        //       });
        //       this.trial_selected = this.trial_names[0];
        //
        //       // Load data from this trial.
        //       this.onTrialSelected(this.trial_selected);
        //     } else {
        //       this.trial_names = []
        //       apiWarning("There are no dynamic trials associated with this session, thereby nothing to plot.")
        //     }
        //   }
        // },
        // onTrialSelected(trialName) {
        //   this.trial_selected = trialName;
        // }

    },
}
</script>
<style lang="scss">
#body {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  min-height: 100%;
  max-height: none;
  overflow: visible;
  background-color: var(--app-background);
  box-sizing: border-box;
}

.analysis-dashboard-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 190;
  cursor: pointer;
}

.sidebar {
  position: fixed;
  top: var(--app-bar-top-offset, 64px);
  bottom: 0;
  width: 300px;
  transition: transform 0.2s;
  overflow-y: hidden;
  z-index: 110;
  background: var(--app-surface-opaque);
  border-right: 1px solid var(--app-border);
}

.left-sidebar {
  left: 0;
}

.right-sidebar {
  right: 0;
}

.left-menu-closed > .left-sidebar {
  transform: translateX(-100%);
  visibility: hidden;
  pointer-events: none;
}

.right-menu-closed > .right-sidebar {
  transform: translateX(100%);
  visibility: hidden;
  pointer-events: none;
}

/* When left menu is closed, main content uses full width – no black gap */
.left-menu-closed .dashboard-body {
  margin-left: 0 !important;
}

/* Main content container */
.dashboard-body {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* Keep metrics on the right in both sidebar states on desktop; use all available width */
.dashboard-body.has-metrics {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  column-gap: 8px;
  align-items: start;
  width: 100%;
  max-width: 100%;
}

/* Keep metrics on the right but in normal flow so page scroll handles overflow; fill grid cell */
.dashboard-body .metrics-column {
  position: static;
  width: 100%;
  min-width: 0;
  flex: initial;
  max-width: none;
  overflow: visible;
  background: var(--app-surface-opaque);
  z-index: 10;
  margin-left: 0;
}

/* Fallback: API layouts sometimes do not expose a reliable component marker.
   Pin the last column to the metrics rail so it stays on the right. */
.dashboard-body > div:last-child {
  position: static;
  width: 100%;
  min-width: 0;
  flex: initial;
  max-width: none;
  overflow: visible;
  background: var(--app-surface-opaque);
  z-index: 10;
  margin-left: 0;
}

.dashboard-body.has-metrics > div:not(.metrics-column):not(:last-child) {
  grid-column: 1;
}

.dashboard-body.has-metrics .metrics-column,
.dashboard-body.has-metrics > div:last-child {
  grid-column: 2;
}

/* Safety fallback: if class tagging fails, place scalar column on the right rail. */
.dashboard-body.has-metrics > div:has(.scalar-value-wrapper) {
  grid-column: 2 !important;
}

.dashboard-body .metrics-column .scalar-value-wrapper,
.dashboard-body > div:last-child .scalar-value-wrapper {
  padding-top: 0.25rem;
  min-height: 100%;
  box-sizing: border-box;
}

.dashboard-body .metrics-column .scalar-wrapper,
.dashboard-body > div:last-child .scalar-wrapper {
  padding-left: 0.8rem;
  padding-right: 0.8rem;
  padding-top: 0.6rem;
}

/* Ensure metrics rail does not create an inner scrollbar. */
.dashboard-body .metrics-column .scalar-value,
.dashboard-body > div:last-child .scalar-value {
  height: auto;
  max-height: none;
  overflow-y: visible;
}

.dashboard-body .metrics-column .scalar-plot,
.dashboard-body > div:last-child .scalar-plot {
  height: auto;
  max-height: none;
  overflow-y: visible;
}

/* Reduce metric value size in the right metrics rail. */
.dashboard-body .metrics-column .scalar-text,
.dashboard-body > div:last-child .scalar-text {
  font-size: 26px;
}

.dashboard-body .metrics-column .info-text,
.dashboard-body > div:last-child .info-text {
  font-size: 24px;
}

/* Metric cards/dividers in right rail */
.dashboard-body .metrics-column .scalar-value-wrapper > div,
.dashboard-body > div:last-child .scalar-value-wrapper > div,
.dashboard-body .metrics-column .scalar-wrapper > div,
.dashboard-body > div:last-child .scalar-wrapper > div {
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border-strong);
  border-radius: 8px;
  padding: 0.6rem 0.4rem;
  margin-bottom: 0.75rem;
}

.dashboard-body .metrics-column .info-label,
.dashboard-body > div:last-child .info-label,
.dashboard-body .metrics-column .label-text,
.dashboard-body > div:last-child .label-text,
.dashboard-body .metrics-column .plot-caption,
.dashboard-body > div:last-child .plot-caption {
  padding-bottom: 0.28rem;
  margin-bottom: 0.38rem;
  border-bottom: 1px solid var(--app-border-strong);
}

.dashboard-body .metrics-column .info-text,
.dashboard-body > div:last-child .info-text,
.dashboard-body .metrics-column .scalar-text,
.dashboard-body > div:last-child .scalar-text {
  margin-bottom: 0;
}

.dashboard-body > div {
  min-width: 0;
}

.fixed-button {
  position: fixed;
  bottom: auto;
  top: calc(var(--app-bar-top-offset, 64px) + 10px);
  display: block;
  width: auto;
  max-width: fit-content;
  height: fit-content;
  min-height: 0;
  z-index: 120;
}

.fixed-button .v-btn {
  width: auto;
  min-width: 44px;
  min-height: 44px;
  flex-shrink: 0;
}

@media (max-width: 960px) {
  .fixed-button {
    top: calc(var(--app-bar-top-offset, 64px) + 8px);
  }
}

.fixed-button-to-left {
  left: 10px;
  right: auto;
}

.fixed-button-to-right {
  right: 10px;
  left: auto;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  font-weight: bold;
  border-bottom: 1px solid var(--app-border);
  color: var(--app-text-primary);
  flex: 0 0 auto;
}

.sidebar .v-card__text {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.sidebar-close-btn {
  min-width: 40px;
  min-height: 40px;
}

.sidebar-action-btn {
  height: 44px;
  min-height: 44px;
  max-height: 44px;
  font-size: 0.82rem !important;
  letter-spacing: 0.04em !important;
  text-transform: uppercase;
}

.right-menu-close-button {
  float: left;
}

.content-chart {
  margin: 12px auto 0;
  width: 60%;
  height: 80%;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #767676;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spinner 0.8s linear infinite;
}

@keyframes spinner {
  to {transform: rotate(360deg);}
}

.height-50vh {
  height: 50vh;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - var(--app-bar-top-offset, 64px));
  width: 100%;
  padding: 2rem;
}

.empty-state-content {
  text-align: center;
  max-width: 500px;
  color: var(--app-text-primary);
}

.empty-state-content h2 {
  font-size: 1.75rem;
  font-weight: 500;
  color: var(--app-text-primary);
}

.empty-state-content p {
  color: var(--app-text-muted);
}

.dashboard-body {
  margin-left: 0;
  margin-right: 0;
  min-width: 0;
  flex: 1;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 24px;
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

/* Re-assert desktop metrics rail after base dashboard-body flex styles; use full width. */
@media (min-width: 961px) {
  .dashboard-body.has-metrics {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
    column-gap: 8px;
    align-items: start;
    width: 100%;
    max-width: 100%;
  }
}

#body {
  padding-left: 320px;
  padding-right: 0;
}

.left-menu-closed#body {
  padding-left: 0;
}

/* Small screens: bottom-sheet popup for sidebar, stacked dashboard content. */
@media (max-width: 960px) {
  #body {
    padding-left: 0;
  }

  .left-menu-closed#body {
    padding-left: 0;
  }

  /* Bottom-sheet popup for sidebar */
  .sidebar {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    border-right: none;
    border-left: none;
    border-top: 1px solid var(--app-border-strong);
    border-radius: 16px 16px 0 0;
    z-index: 200;
    transform: translateY(0);
    visibility: visible !important;
    pointer-events: auto;
    transition: transform 0.3s ease;
  }

  .sidebar::before {
    content: '';
    display: block;
    width: 40px;
    height: 4px;
    border-radius: 2px;
    background: var(--app-text-subtle);
    margin: 8px auto 0;
    flex-shrink: 0;
  }

  .left-sidebar,
  .right-sidebar {
    left: 0;
    right: 0;
  }

  .left-menu-closed > .left-sidebar,
  .right-menu-closed > .right-sidebar {
    transform: translateY(100%);
    pointer-events: none;
  }

  .sidebar .v-card__text {
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
  }

  .dashboard-body {
    margin-left: 0;
    margin-right: 0;
    padding-left: 1rem;
    padding-right: 1rem;
    padding-bottom: 72px;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    row-gap: 0.75rem;
  }

  .dashboard-body.has-metrics {
    display: flex !important;
    flex-direction: column !important;
    flex-wrap: nowrap !important;
    width: 100%;
    max-width: 100%;
    align-items: stretch;
  }

  .dashboard-body > div {
    position: relative !important;
    float: none !important;
    clear: both;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    flex: 0 0 auto !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  .dashboard-body .metrics-column {
    position: static;
    right: auto;
    top: auto;
    bottom: auto;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    overflow-y: visible;
    background: transparent;
    box-shadow: none;
    order: 10;
    flex-basis: 100%;
  }

  .dashboard-body > div:last-child {
    position: static;
    right: auto;
    top: auto;
    bottom: auto;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    overflow-y: visible;
    background: transparent;
    box-shadow: none;
    order: 10;
    flex-basis: 100%;
  }

  .dashboard-body.has-metrics > div:has(.scalar-value-wrapper) {
    grid-column: auto !important;
    order: 10;
  }

  .dashboard-body.has-metrics > div {
    grid-column: auto !important;
  }

  /* Floating button fixed at bottom */
  .fixed-button {
    position: fixed !important;
    top: auto !important;
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

  .dashboard-body .scalar-value-wrapper {
    font-size: 0.875rem;
    padding: 0.75rem 1rem;
  }

  .dashboard-body .scalar-value-wrapper .info-text,
  .dashboard-body .scalar-value-wrapper .scalar-text {
    font-size: 1rem;
  }

  .dashboard-body .scalar-value-wrapper .info-label,
  .dashboard-body .scalar-value-wrapper .label-text {
    font-size: 0.8125rem;
  }

  /* Mobile optimizations for Visualizer component */
  .video-player {
    flex-direction: column !important;

    .right {
      flex: 0 0 auto !important;
      width: 100% !important;
      max-width: 100% !important;
      position: static !important;
      right: auto !important;
      top: auto !important;
      height: auto !important;
      margin-top: 8px;
      gap: 8px;

      .videos {
        width: 100%;
        max-height: 88px;
        flex: 0 0 auto !important;
        
        video {
          width: auto;
          max-width: 100%;
          max-height: 88px !important;
          object-fit: contain;
        }
      }

      .speed-control-button {
        min-width: 64px !important;
        font-size: 0.7rem !important;
        padding: 0 6px !important;

        .v-icon {
          font-size: 14px !important;
        }
      }
    }

    .viewer {
      min-width: 0;

      .video-controls-row {
        flex-wrap: nowrap !important;
        gap: 4px !important;
        padding: 4px 0 !important;
      }

      .video-controls-row .time-input-wrap {
        width: 60px !important;
        min-width: 60px !important;
        max-width: 60px !important;
        flex: 0 0 60px !important;
      }

      .video-controls-row .slider-wrap {
        flex: 1 1 auto !important;
        min-width: 0 !important;
      }
    }
  }
}
</style>

<!-- Route-scoped layout overrides. The API can split widgets into arbitrary
     columns, so semantic widget classes define the visual order. -->
<style lang="scss">
.analysis-dashboard-wrapper {
  position: relative;
  width: 100%;
  min-height: calc(100vh - var(--app-bar-top-offset, 64px));
  min-height: calc(100dvh - var(--app-bar-top-offset, 64px));
  overflow: visible;
  box-sizing: border-box;
}

.analysis-dashboard-wrapper #body.chart-page {
  height: auto;
  min-height: calc(100vh - var(--app-bar-top-offset, 64px));
  min-height: calc(100dvh - var(--app-bar-top-offset, 64px));
  overflow: visible;
  background: var(--app-background);
}

.analysis-dashboard-wrapper .dashboard-body,
.analysis-dashboard-wrapper .dashboard-body.has-metrics {
  display: flex !important;
  flex-flow: column nowrap !important;
  align-items: stretch !important;
  width: 100%;
  min-height: 100%;
  padding: 12px 20px calc(48px + env(safe-area-inset-bottom, 0px));
  gap: 20px;
  overflow-x: hidden;
  overflow-y: visible;
}

.analysis-dashboard-wrapper .dashboard-column {
  display: contents;
}

.analysis-dashboard-wrapper .dashboard-widget {
  position: relative;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden;
  resize: none;
  box-sizing: border-box;
}

.analysis-dashboard-wrapper .visualizer-widget {
  order: 1;
  height: clamp(480px, 62vh, 720px) !important;
  min-height: 480px !important;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-opaque);
  box-shadow: var(--app-shadow);
}

.analysis-dashboard-wrapper .visualizer-widget > .video-player {
  display: flex !important;
  flex-direction: row !important;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.analysis-dashboard-wrapper .visualizer-widget .viewer {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.analysis-dashboard-wrapper .visualizer-widget .right {
  flex: 0 0 clamp(260px, 20vw, 380px) !important;
  width: clamp(260px, 20vw, 380px) !important;
  max-width: 36% !important;
  height: 100% !important;
  min-height: 0;
  margin: 0 !important;
  overflow: hidden;
  border-left: 1px solid var(--app-border);
  background: var(--app-surface-muted);
}

.analysis-dashboard-wrapper .visualizer-widget .right .videos {
  flex: 1 1 auto !important;
  width: 100% !important;
  min-height: 0;
  overflow: auto;
}

.analysis-dashboard-wrapper .visualizer-widget .right video {
  display: block;
  width: 100%;
  height: auto;
  max-height: 100%;
  object-fit: contain;
}

.analysis-dashboard-wrapper .plot-widget {
  order: 2;
  height: clamp(440px, 56vh, 680px) !important;
  min-height: 420px !important;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-opaque);
  box-shadow: var(--app-shadow);
}

.analysis-dashboard-wrapper .plot-widget > .linear-chart {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.analysis-dashboard-wrapper .linear-chart-toolbar {
  flex: 0 0 auto;
  min-height: 56px;
  padding: 8px 12px;
  gap: 10px;
  border-bottom: 1px solid var(--app-border);
}

.analysis-dashboard-wrapper .linear-chart .content-chart {
  flex: 1 1 auto;
  width: 100%;
  height: auto;
  min-height: 0;
  margin: 0;
}

.analysis-dashboard-wrapper .metrics-column {
  order: 3;
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  align-items: start;
  align-content: start;
  grid-auto-rows: auto;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  min-height: 0;
  height: auto !important;
  max-height: none !important;
  padding: 0 !important;
  gap: 20px;
  overflow: visible !important;
  position: static !important;
  z-index: auto !important;
  resize: none;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.analysis-dashboard-wrapper .metrics-column .metric-widget {
  display: block;
  grid-column: 1 / -1;
  width: 100%;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  overflow: visible !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.analysis-dashboard-wrapper .metrics-column .scalar-wrapper,
.analysis-dashboard-wrapper .metrics-column .scalar-value-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  align-items: start;
  width: 100%;
  padding: 0 !important;
  gap: 20px;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  overflow: visible !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.analysis-dashboard-wrapper .metrics-column .metric-row,
.analysis-dashboard-wrapper .metrics-column .scalar-value-wrapper > div {
  width: 100%;
  min-width: 0;
  min-height: 160px;
  height: auto !important;
  max-height: none !important;
  align-self: start;
  margin: 0 !important;
  padding: 16px !important;
  overflow: visible;
  box-sizing: border-box;
  border: 1px solid var(--app-border-strong);
  border-radius: 12px;
  background: var(--app-surface-muted);
}

.analysis-dashboard-wrapper .metrics-column .scalar-plot-container {
  width: 100%;
  min-width: 0;
  margin: 40px 0 28px !important;
}

.analysis-dashboard-wrapper .metrics-column .scalar-plot-bar {
  min-width: 0;
}

.analysis-dashboard-wrapper .metrics-column .info-text,
.analysis-dashboard-wrapper .metrics-column .scalar-text {
  margin-bottom: 0;
  overflow-wrap: anywhere;
}

.analysis-dashboard-wrapper .sidebar .v-card__text {
  scrollbar-gutter: stable;
  overscroll-behavior: contain;
}

@media (min-width: 961px) {
  .analysis-dashboard-wrapper .sidebar {
    top: calc(var(--app-bar-top-offset, 64px) + 12px);
    bottom: 12px;
    border-radius: 0 12px 12px 0;
  }
}

.analysis-dashboard-wrapper .fixed-button {
  position: absolute !important;
  top: 24px !important;
  left: 32px !important;
  right: auto !important;
  z-index: 30;
  margin: 0 !important;
  padding: 0 !important;
}

.analysis-dashboard-wrapper .fixed-button .v-btn {
  min-width: 72px;
  background: var(--app-surface-opaque) !important;
  box-shadow: var(--app-shadow);
}

.metric-tooltip.v-tooltip__content {
  width: max-content;
  max-width: min(320px, calc(100vw - 32px)) !important;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

@media (max-width: 1200px) and (min-width: 961px) {
  .analysis-dashboard-wrapper .dashboard-body,
  .analysis-dashboard-wrapper .dashboard-body.has-metrics,
  .analysis-dashboard-wrapper .metrics-column {
    gap: 16px;
  }

  .analysis-dashboard-wrapper .dashboard-body,
  .analysis-dashboard-wrapper .dashboard-body.has-metrics {
    padding: 12px 16px calc(44px + env(safe-area-inset-bottom, 0px));
  }

  .analysis-dashboard-wrapper .metrics-column .scalar-wrapper,
  .analysis-dashboard-wrapper .metrics-column .scalar-value-wrapper {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
}

@media (max-width: 960px) {
  .analysis-dashboard-wrapper {
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 72px);
  }

  .analysis-dashboard-wrapper #body.chart-page {
    height: auto;
    min-height: calc(100dvh - var(--app-bar-top-offset, 64px));
    overflow: visible;
  }

  .analysis-dashboard-wrapper .dashboard-body,
  .analysis-dashboard-wrapper .dashboard-body.has-metrics {
    padding: 8px 12px calc(40px + env(safe-area-inset-bottom, 0px));
    gap: 12px;
    overflow: visible;
    scrollbar-gutter: auto;
  }

  .analysis-dashboard-wrapper .visualizer-widget {
    height: auto !important;
    min-height: 0 !important;
  }

  .analysis-dashboard-wrapper .visualizer-widget > .video-player {
    flex-direction: column !important;
    min-height: 0;
  }

  .analysis-dashboard-wrapper .visualizer-widget .viewer {
    flex: 0 0 auto;
    width: 100%;
    height: clamp(320px, 52vh, 480px);
    min-height: 320px;
  }

  .analysis-dashboard-wrapper .visualizer-widget .right {
    flex: 0 0 auto !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    min-height: 0;
    border-top: 1px solid var(--app-border);
    border-left: 0;
  }

  .analysis-dashboard-wrapper .visualizer-widget .right .videos {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
    width: 100%;
    max-height: none;
    overflow: visible;
  }

  .analysis-dashboard-wrapper .visualizer-widget .right video {
    width: 100%;
    height: auto;
    max-width: 100%;
    max-height: min(60vh, 520px) !important;
    object-fit: contain;
    margin: 0 auto;
  }

  .analysis-dashboard-wrapper .plot-widget {
    height: 440px !important;
    min-height: 440px !important;
  }

  .analysis-dashboard-wrapper .metrics-column {
    display: block !important;
    gap: 12px;
  }

  .analysis-dashboard-wrapper .metrics-column .metric-widget + .metric-widget {
    margin-top: 12px !important;
  }

  .analysis-dashboard-wrapper .metrics-column .scalar-wrapper,
  .analysis-dashboard-wrapper .metrics-column .scalar-value-wrapper {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .analysis-dashboard-wrapper .fixed-button {
    position: absolute !important;
    top: 16px !important;
    left: 20px !important;
    bottom: auto !important;
  }
}

@media (max-width: 599px) {
  .analysis-dashboard-wrapper .visualizer-widget .viewer {
    height: clamp(280px, 46vh, 400px);
    min-height: 280px;
  }

  .analysis-dashboard-wrapper .metrics-column .scalar-wrapper,
  .analysis-dashboard-wrapper .metrics-column .scalar-value-wrapper {
    grid-template-columns: minmax(0, 1fr);
  }
}

.v-main:has(.analysis-dashboard-wrapper) {
  padding-top: var(--app-bar-top-offset, 64px) !important;
  padding-right: 0 !important;
  padding-bottom: 0 !important;
  padding-left: 0 !important;
  height: 100vh;
  height: 100dvh;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.v-main:has(.analysis-dashboard-wrapper) > .v-main__wrap {
  height: auto !important;
  min-height: 100%;
  overflow: visible;
}
</style>
