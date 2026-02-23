<template>
  <div class="select-session d-flex flex-column">
    <div class="d-flex flex-wrap align-center toolbar-container">
      <v-btn
        @click="$router.push({ name: 'RecordingMode' })"
        class="toolbar-button">
        <v-icon left>mdi-plus-circle-outline</v-icon>
        New session
      </v-btn>

      <v-menu offset-y>
        <template v-slot:activator="{ on, attrs }">
          <v-btn dark v-bind="attrs" v-on="on" class="toolbar-button">
            <span class="dashboards-text d-none d-sm-inline mr-2">Dashboards</span>
            <span class="dashboards-text-mobile d-sm-none">Dashboards</span>
            <v-icon class="d-none d-sm-inline">mdi-menu</v-icon>
          </v-btn>
        </template>
        <v-list>
            <v-list-item link
                @click="openKinematicsDashboardFromMenu">
                Kinematics
            </v-list-item>
            <v-list-item
                v-for="dashboard in analysis_dashboards"
                :key="dashboard.id"
                @click="openAnalysisDashboardFromMenu(dashboard)">
              {{ dashboard.title }}</v-list-item>
        </v-list>
      </v-menu>

      <v-btn
        class="toolbar-button"
        @click="$router.push({ name: 'Subjects' })">
        <v-icon left>mdi-account-group-outline</v-icon>
        Subjects
      </v-btn>

      <v-btn
        class="toolbar-button"
        @click="$router.push({ name: 'RecycleBin' })">
        <v-icon left>mdi-delete-outline</v-icon>
        Recycle Bin
      </v-btn>

      <div class="checkbox-wrapper toolbar-button d-flex align-center">
        <v-checkbox v-model="show_trashed" class="mt-0 mb-0" label="Show removed sessions" hide-details></v-checkbox>
      </div>

      <div class="d-flex align-center flex-grow-1 flex-md-grow-0 ml-0 ml-md-auto mt-2 mt-md-0 search-section">
        <div class="flex-grow-1 mr-2">
          <v-text-field
            v-model="searchText"
            label="Enter Session ID/Name"
            dense
            hide-details
            @keyup.enter="handleSearch"
          ></v-text-field>
        </div>

        <div>
          <v-btn
            class="submit-btn"
            @click="searchText ? onClearSearch() : handleSearch()">
            {{ searchText ? 'Clear' : 'Search' }}
          </v-btn>
        </div>
      </div>
    </div>

    <v-data-table        
      :headers="displayHeaders"
      :items="valid_sessions"
      :options.sync="options"
      :item-class="itemClasses"
      :loading="loading"
      :server-items-length="session_total"
      :mobile-breakpoint="0"
      :dense="$vuetify.breakpoint.smAndDown"
      :footer-props="{
        showFirstLastPage: false,
        disableItemsPerPage: true,
        itemsPerPageOptions: [40]
      }"
      fixed-header
      single-select
      class="sessions-table flex-grow-1"
      @item-selected="onSelect"
      @click:row="onRowClick">
      <template v-slot:item.created_at="{ item }">
        <span>{{ item.created_at|date }}</span>
      </template>
      <template v-slot:item.id="{ item }">
        <div class="session-id-cell" :title="item.id">
          <span class="session-id-preview">{{ getSessionIdPreview(item.id) }}</span>
          <v-btn
            icon
            small
            dark
            class="copy-session-id-btn"
            title="Copy session ID"
            @click.stop="copySessionId(item.id)">
            <v-icon small>mdi-content-copy</v-icon>
          </v-btn>
        </div>
      </template>
      <template v-slot:item.controls="{ item }">
        <div class="session-controls-cell">
          <!-- Desktop: Direct action buttons -->
          <div class="action-buttons-desktop d-none d-md-flex align-center">
            <v-btn
                icon
                small
                dark
                @click="$router.push({ name: 'Session', params: { id: item.id }})"
                class="action-btn"
                title="Load session">
              <v-icon small>mdi-play</v-icon>
            </v-btn>
            <v-btn
                icon
                small
                dark
                @click="$router.push({ name: 'Dashboard', params: { id: item.id } })"
                class="action-btn"
                title="Dashboard kinematics">
              <v-icon small>mdi-chart-line</v-icon>
            </v-btn>
            <v-btn
                icon
                small
                dark
                @click="openRenameDialog(item)"
                class="action-btn"
                title="Rename session">
              <v-icon small>mdi-pencil</v-icon>
            </v-btn>
            <v-btn
                v-if="!item.trashed"
                icon
                small
                dark
                @click="selectedSessionForDelete = item; remove_dialog = true"
                class="action-btn"
                title="Trash session">
              <v-icon small>mdi-delete</v-icon>
            </v-btn>
            <v-btn
                v-if="item.trashed"
                icon
                small
                dark
                @click="selectedSessionForDelete = item; restore_dialog = true"
                class="action-btn"
                title="Restore session">
              <v-icon small>mdi-restore</v-icon>
            </v-btn>
          </div>

          <!-- Mobile/Tablet: Bottom sheet on mobile, menu on larger screens -->
          <div class="d-md-none">
            <template v-if="$vuetify.breakpoint.smAndDown">
              <v-btn icon dark small class="menu-button" @click="openSessionMenuSheet(item)">
                <v-icon>mdi-menu</v-icon>
              </v-btn>
            </template>
            <template v-else>
              <v-menu v-model="item.isMenuOpen" offset-y right close-on-content-click content-class="session-context-menu">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn icon dark small v-bind="attrs" v-on="on" class="menu-button">
                    <v-icon>mdi-menu</v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item link @click="closeMenuAndLoad(item)">
                    <v-list-item-title>Load</v-list-item-title>
                  </v-list-item>
                  <v-list-item link @click="closeMenuAndDashboard(item)">
                    <v-list-item-title>Dashboard kinematics</v-list-item-title>
                  </v-list-item>
                  <v-list-item link @click="closeMenuAndRename(item)">
                    <v-list-item-title>Rename</v-list-item-title>
                  </v-list-item>
                  <v-list-item link v-show="!item.trashed" @click="closeMenuAndTrash(item)">
                    <v-list-item-title>Trash</v-list-item-title>
                  </v-list-item>
                  <v-list-item link v-show="item.trashed" @click="closeMenuAndRestore(item)">
                    <v-list-item-title>Restore</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
          </div>
        </div>
      </template>
      <template v-slot:item.sessionName="{ item }">
        <div class="session-name-text">{{ item.sessionName || 'Untitled' }}</div>
      </template>
      <template v-slot:item.isMono="{ item }">
        <span>{{ item.isMono ? 'Yes' : 'No' }}</span>
      </template>
    </v-data-table>

    <!-- Session menu bottom sheet (mobile) -->
    <v-bottom-sheet
      v-model="showSessionMenuSheet"
      @input="val => !val && (selectedSessionForMenu = null)">
      <v-sheet class="text-center session-menu-sheet">
        <v-list v-if="selectedSessionForMenu">
          <v-list-item link @click="closeSheetAndLoad(selectedSessionForMenu)">
            <v-list-item-title>Load</v-list-item-title>
          </v-list-item>
          <v-list-item link @click="closeSheetAndDashboard(selectedSessionForMenu)">
            <v-list-item-title>Dashboard kinematics</v-list-item-title>
          </v-list-item>
          <v-list-item link @click="closeSheetAndRename(selectedSessionForMenu)">
            <v-list-item-title>Rename</v-list-item-title>
          </v-list-item>
          <v-list-item link v-if="!selectedSessionForMenu.trashed" @click="closeSheetAndTrash(selectedSessionForMenu)">
            <v-list-item-title>Trash</v-list-item-title>
          </v-list-item>
          <v-list-item link v-if="selectedSessionForMenu.trashed" @click="closeSheetAndRestore(selectedSessionForMenu)">
            <v-list-item-title>Restore</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-sheet>
    </v-bottom-sheet>

    <!-- Rename Session Dialog -->
    <v-dialog
      v-model="rename_dialog"
      v-click-outside="clickOutsideDialogSessionHideMenu"
      max-width="500"
      :fullscreen="$vuetify.breakpoint.smAndDown">
      <v-card v-if="selectedSessionForRename">
        <v-card-text class="pt-4">
          <v-row class="m-0">
            <v-col cols="12" sm="2">
              <v-icon x-large color="orange">mdi-rename-box</v-icon>
            </v-col>
            <v-col cols="12" sm="10">
              <p class="mb-1">
                Insert a new name for session {{ selectedSessionForRename.sessionName }}:
              </p>
              <small class="mt-0">
                Only alphanumeric characters and underscores are allowed.
              </small>
              <ValidationObserver tag="div" class="d-flex flex-column" ref="observer" v-slot="{ invalid }">
                <ValidationProvider rules="required|alpha_dash_custom" v-slot="{ errors }" name="Session name">
                  <v-text-field v-model="sessionNewName" label="Session new name" class="flex-grow-0"
                    dark :error="errors.length > 0" :error-messages="errors[0]">
                  </v-text-field>
                </ValidationProvider>
                <v-spacer></v-spacer>
                <v-btn class="text-right" :disabled="invalid" @click="confirmRenameSession">
                  Rename Session
                </v-btn>
              </ValidationObserver>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
    
    <!-- Trash Session Dialog -->
    <v-dialog
        v-model="remove_dialog"
        max-width="500"
        :fullscreen="$vuetify.breakpoint.smAndDown"
        :retain-focus="false">
      <v-card>
        <v-card-text class="pt-4">
          <v-row class="m-0">
            <v-col cols="12" sm="2">
              <v-icon x-large color="red">mdi-close-circle</v-icon>
            </v-col>
            <v-col cols="12" sm="10">
              <p>
                Do you want to trash session <code>{{selectedSessionForDelete?.id}}</code>?
                You will be able to restore it for 30 days. After that,
                this session will be permanently removed.
              </p>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="blue darken-1"
            text
            @click="remove_dialog = false; selectedSessionForDelete = null">
            No
          </v-btn>
          <v-btn
            color="red darken-1"
            text
            @click="remove_dialog = false; trashSession(selectedSessionForDelete?.id); selectedSessionForDelete = null">
            Yes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Restore Session Dialog -->
    <v-dialog
        v-model="restore_dialog"
        max-width="500"
        :fullscreen="$vuetify.breakpoint.smAndDown"
        :retain-focus="false">
      <v-card>
        <v-card-text class="pt-4">
          <v-row class="m-0">
            <v-col cols="12" sm="2">
              <v-icon x-large color="green">mdi-undo-variant</v-icon>
            </v-col>
            <v-col cols="12" sm="10">
              <p>
                Do you want to restore session <code>{{selectedSessionForDelete?.id}}</code>?
              </p>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="blue darken-1"
            text
            @click="restore_dialog = false; selectedSessionForDelete = null">
            No
          </v-btn>
          <v-btn
            color="green darken-1"
            text
            @click="restore_dialog = false; restoreSession(selectedSessionForDelete?.id); selectedSessionForDelete = null">
            Yes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
      
<!--    <div class="d-flex table-info-footer">-->
<!--      <v-btn-->
<!--        class="ml-2"-->
<!--        @click="onLoadAllSessions">-->
<!--        Load all sessions-->
<!--      </v-btn>-->
<!--    </div>-->
    
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import { apiInfo, apiError } from '@/util/ErrorMessage.js'
import { formatDate } from '@/util/DateFormat.js'
import axios from 'axios'
import router from '@/router'
import Vue from 'vue'

export default {
  name: 'SelectSession',
  created: function () {
      this.loadAnalysisDashboardList()
  },
  mounted() {
      this.$toasted.clear()
  },
  beforeDestroy () {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer)
    }
  },
  data () {
    return {
      loading: true,
      session_start: 0,
      session_quantity: 40,
      session_total: 0,
      session_sort: [],
      session_sort_desc: [],
      valid_sessions: [],
      options: {},
      remove_dialog: false,
      rename_dialog: false,
      restore_dialog: false,
      selectedSessionForDelete: null,
      selectedSessionForRename: null,
      sessionName: '',
      sessionNewName: '',
      showSessionMenuSheet: false,
      selectedSessionForMenu: null,
      show_trashed: false,
      searchText: '',
      searchDebounceTimer: null,
      headers: [
        { 
          text: 'Session Name', 
          value: 'sessionName',
          class: 'session-name-column',
          width: '180px'
        },
        { 
          text: 'Date', 
          value: 'created_at',
          class: 'date-column',
          width: '130px'
        },
        {
          text: 'Actions',
          value: 'controls',
          sortable: false,
          class: 'controls-column',
          width: '150px'
        },
        {
          text: 'Session ID',
          align: 'start',
          sortable: false,
          value: 'id',
          class: 'session-id-column',
          width: '90px'
        },
        {
          text: 'Subject Name', 
          value: 'name',
          width: '140px'
        },
        { 
          text: 'Number of trials', 
          value: 'trials_count',
          width: '110px'
        },
        { 
          text: 'Monocular', 
          value: 'isMono',
          width: '100px'
        },
      ],
      selected: null,
      delay: 300,
      clicks: 0,
      timer: null
    }
  },
  watch: {
    options: {
      handler () {
        this.session_start = (this.options.page - 1) * this.options.itemsPerPage
        this.session_sort = this.options.sortBy
        this.session_sort_desc = this.options.sortDesc
        console.log('options changed', this.options)
        this.refreshSessions()
      },
      deep: true
    },
    show_trashed: {
      handler () {
        this.refreshSessions()
      }
    },
    searchText: {
      handler () {
        if (this.searchDebounceTimer) {
          clearTimeout(this.searchDebounceTimer)
        }
        if (!this.searchText.trim()) {
          this.handleSearch()
          return
        }
        this.searchDebounceTimer = setTimeout(() => {
          this.handleSearch()
        }, 300)
      }
    }
  },
  computed: {
    ...mapState({
      analysis_dashboards: state => state.data.analysis_dashboards
    }),
    isPhone () {
      return this.$vuetify.breakpoint.xsOnly
    },
    displayHeaders () {
      if (!this.isPhone) {
        return this.headers
      }

      return this.headers
        .filter(({ value }) => ['sessionName', 'created_at', 'controls'].includes(value))
        .map(header => ({
          ...header,
          align: 'start',
          sortable: false
        }))
    }
  },
  methods: {
    ...mapActions('data', [
        'trashExistingSession',
        'restoreTrashedSession',
        'loadAnalysisDashboardList',
    ]),
    refreshSessions () {
      if (this.searchText.trim()) {
        this.handleSearch()
        return
      }
      this.loadValidSessions()
    },
    onClearSearch() {
      this.searchText = ""
    },
    handleSearch() {
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer)
      }
      this.loading = true;
      const query = this.searchText.trim()
      const params = new URLSearchParams({ text: query }).toString();

      let data = {
        start: this.session_start,
        quantity: this.session_quantity,
        include_trashed: this.show_trashed,
        sort: this.session_sort,
        sort_desc: this.session_sort_desc
      }
      // If empty search text, retrieve everything as normally would do.
      if(query === "") {
        axios.post('/sessions/valid/', data).then(response => {
          this.valid_sessions = response.data.sessions.map(s => ({ ...s, isMenuOpen: false }))
          this.session_total = response.data.total
          this.loading = false
          if (this.session_total === 0) {
            router.push({ name: 'Step1' })
          }
        }).catch(error => {
          apiError(error)
          this.loading = false
        })
      // If search text, filter by it.
      } else {
        axios.get(`/sessions/search_sessions/?${params}`).then(response => {
          const filteredSessions = response.data.filter(session => {
            // Count trials that are NOT calibration
            const nonCalibrationTrials = session.trials.filter(
              trial => trial.name.toLowerCase() !== 'calibration'
            );
            // Keep the session only if there's at least one non-calibration trial
            return nonCalibrationTrials.length > 0;
          });

          this.valid_sessions = filteredSessions.map(s => ({ ...s, isMenuOpen: false }));
          this.session_total = filteredSessions.length;
          this.loading = false;
        }).catch(error => {
          apiError(error)
          this.loading = false
        })
      }
    },
    loadValidSessions () {
      this.loading = true
      let data = {
        start: this.session_start,
        quantity: this.session_quantity,
        include_trashed: this.show_trashed,
        sort: this.session_sort,
        sort_desc: this.session_sort_desc
      }
      axios.post('/sessions/valid/', data).then(response => {
        this.valid_sessions = response.data.sessions.map(s => ({ ...s, isMenuOpen: false }))
        this.session_total = response.data.total
        this.loading = false
        if (this.session_total === 0) {
          router.push({ name: 'Step1' })
        }
      }).catch(error => {
        apiError(error)
        this.loading = false
      })
    },
    onSelect ({ item, value }) {
      this.selected = value ? item : null
    },
    onRowClick (item, params) {
      this.clicks++;
      if (this.clicks === 1) {
        this.timer = setTimeout( () => {
          params.select(!params.isSelected)
          this.clicks = 0
        }, this.delay);
      } else {
         clearTimeout(this.timer);
         this.$router.push({ name: 'Session', params: { id: item.id }})
         this.clicks = 0;
      }
    },
    itemClasses (item) {
      return item.trashed ? 'trashed' : '';
    },
    clickOutsideDialogSessionHideMenu(e) {
      if (e.target.className === 'v-overlay__scrim') {
        for (let t of this.valid_sessions) {
          t.isMenuOpen = false;
        }
        this.showSessionMenuSheet = false;
        this.selectedSessionForMenu = null;
      }
    },
    openSessionMenuSheet(item) {
      this.selectedSessionForMenu = item;
      this.showSessionMenuSheet = true;
    },
    openRenameDialog(item) {
      this.selectedSessionForRename = item;
      this.sessionNewName = item.sessionName;
      this.rename_dialog = true;
    },
    confirmRenameSession() {
      if (this.selectedSessionForRename) {
        this.renameSession(this.selectedSessionForRename, this.sessionNewName);
        this.rename_dialog = false;
        this.selectedSessionForRename = null;
      }
    },
    closeMenuAndLoad(item) { item.isMenuOpen = false; this.$router.push({ name: 'Session', params: { id: item.id } }); },
    closeMenuAndDashboard(item) { item.isMenuOpen = false; this.$router.push({ name: 'Dashboard', params: { id: item.id } }); },
    closeMenuAndRename(item) { item.isMenuOpen = false; this.openRenameDialog(item); },
    closeMenuAndTrash(item) { item.isMenuOpen = false; this.selectedSessionForDelete = item; this.remove_dialog = true; },
    closeMenuAndRestore(item) { item.isMenuOpen = false; this.selectedSessionForDelete = item; this.restore_dialog = true; },
    closeSheetAndLoad(item) { this.showSessionMenuSheet = false; this.selectedSessionForMenu = null; this.$router.push({ name: 'Session', params: { id: item.id } }); },
    closeSheetAndDashboard(item) { this.showSessionMenuSheet = false; this.selectedSessionForMenu = null; this.$router.push({ name: 'Dashboard', params: { id: item.id } }); },
    closeSheetAndRename(item) { this.showSessionMenuSheet = false; this.selectedSessionForMenu = null; this.openRenameDialog(item); },
    closeSheetAndTrash(item) { this.showSessionMenuSheet = false; this.selectedSessionForMenu = null; this.selectedSessionForDelete = item; this.remove_dialog = true; },
    closeSheetAndRestore(item) { this.showSessionMenuSheet = false; this.selectedSessionForMenu = null; this.selectedSessionForDelete = item; this.restore_dialog = true; },
    openKinematicsDashboardFromMenu () {
      const defaultSessionId = this.selected?.id || this.valid_sessions?.[0]?.id
      if (!defaultSessionId) {
        apiInfo('No sessions are available yet.')
        return
      }
      this.$router.push({ name: 'Dashboard', params: { id: defaultSessionId } })
    },
    openAnalysisDashboardFromMenu (dashboard) {
      const title = String(dashboard?.title || '').trim().toLowerCase()
      if (title.includes('overground')) {
        this.$router.push({ name: 'AnalysisDashboard', params: { id: '42' } })
        return
      }
      if (title.includes('squat')) {
        this.$router.push({ name: 'AnalysisDashboard', params: { id: '36' } })
        return
      }
      if (title === 'ad' || title.startsWith('ad ')) {
        this.$router.push({ name: 'AnalysisDashboard', params: { id: '43' } })
        return
      }
      this.$router.push({ name: 'AnalysisDashboard', params: { id: dashboard.id } })
    },
    // async onLoadAllSessions(){
    //   try {
    //     await this.loadExistingSessions({reroute: true, quantity:-1})
    //   } catch (error) {
    //     apiError(error)
    //     this.$router.push({ name: 'ConnectDevices' })
    //   }
    // },
    async trashSession (id) {
      try {
        await axios.post(`/sessions/${id}/trash/`)
        this.loadValidSessions()
      } catch (error) {
        apiError(error)
      }
    },
    async restoreSession (id) {
      try {
        await axios.post(`/sessions/${id}/restore/`)
        this.loadValidSessions()
      } catch (error) {
        apiError(error)
      }
    },
    async renameSession(session, sessionNewName) {
      try {
        let oldName = session.sessionName;
        console.log(oldName + " will be renamed to " + sessionNewName);
        const { data } = await axios.post(`/sessions/${session.id}/rename/`, {sessionNewName});
        await this.updateSessionWithData(session, data.data);
      } catch (error) {
        apiError(error)
      }
    },
    async updateSessionWithData(session, data) {
      const index = this.valid_sessions.findIndex(x => x.id === session.id);
      if (index >= 0) {
        Vue.set(this.valid_sessions, index, data);
        data.created_at = formatDate(data.created_at);
      }
    },
    async copySessionId(sessionId) {
      const id = String(sessionId || '');
      if (!id) {
        return
      }

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(id)
        } else {
          const textArea = document.createElement('textarea')
          textArea.value = id
          textArea.style.position = 'fixed'
          textArea.style.left = '-9999px'
          textArea.style.top = '-9999px'
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
        }
        apiInfo('Session ID copied to clipboard.', 2500)
      } catch (error) {
        apiError(error)
      }
    },
    getSessionIdPreview(sessionId) {
      const id = String(sessionId || '')
      if (!id) {
        return ''
      }
      return id.length > 8 ? `${id.slice(0, 8)}...` : id
    }

  }
}
</script>

<style lang="scss">

.submit-btn {
  width: 120px;
  min-width: 120px;
  padding-left: 14px;
  padding-right: 14px;
  white-space: nowrap;
  
  @media (max-width: 599px) {
    width: 100%;
    margin-top: 8px;
  }
}

.toolbar-container {
  padding: 0 8px 8px;
  gap: 8px;
  justify-content: flex-start;
  
  @media (max-width: 599px) {
    padding: 0 6px 6px;
    gap: 6px;
    justify-content: flex-start;
    align-items: stretch;
    
    .search-section {
      width: 100%;
      margin-top: 4px;
    }
  }
}

.toolbar-button {
  margin: 0 !important;
  flex-shrink: 0;

  @media (max-width: 599px) {
    flex: 1 1 calc(50% - 3px);
    width: calc(50% - 3px);
    min-height: 44px;
  }
}

.checkbox-wrapper {
  height: 36px; /* Match button height */
  display: flex;
  align-items: center;
  
  ::v-deep .v-input {
    margin-top: 0;
    padding-top: 0;
  }
  
  ::v-deep .v-input__control {
    align-items: center;
  }
  
  ::v-deep .v-input__slot {
    margin-bottom: 0;
  }

  @media (max-width: 599px) {
    flex: 1 1 100%;
    width: 100%;
    height: auto;
    min-height: 44px;
  }
}

.select-session {
  --sessions-top-gap: clamp(10px, calc(var(--app-bar-height, 64px) * 0.2), 18px);
  padding-top: var(--sessions-top-gap);
  height: calc(98vh - var(--app-bar-height, 64px));
  height: calc(98dvh - var(--app-bar-height, 64px));
  overflow: hidden;
  box-sizing: border-box;

  @media (max-width: 599px) {
    height: calc(100vh - var(--app-bar-height, 64px) - 24px - env(safe-area-inset-bottom, 0px));
    height: calc(100dvh - var(--app-bar-height, 64px) - 24px - env(safe-area-inset-bottom, 0px));
    --sessions-top-gap: clamp(8px, 2vh, 12px);
  }

  .sessions-table {
    margin: 0 8px 16px 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;

    ::v-deep .v-data-footer {
      padding-bottom: clamp(8px, 1.8vh, 14px);
      flex: 0 0 auto;
    }
    
    @media (max-width: 599px) {
      margin: 0 4px 8px 4px;
      
      ::v-deep .v-data-footer {
        padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
      }
    }
    
    .v-data-table__wrapper {
      overflow-x: hidden;
      overflow-y: auto;
      flex: 1 1 auto;
      min-height: 0;
      position: relative;
      -webkit-overflow-scrolling: touch;
      
      @media (max-width: 599px) {
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.02);
      }

      table {
        width: 100%;
        min-width: 0;
        
        thead th {
          position: sticky;
          top: 0;
          z-index: 2;
          background-color: rgb(39, 39, 39);
          white-space: nowrap;
          padding-left: 6px !important;
          padding-right: 6px !important;
        }

        ::v-deep thead th .v-data-table-header__content {
          justify-content: flex-start;
        }
        
        tbody td {
          padding-left: 6px !important;
          padding-right: 6px !important;

          @media (max-width: 599px) {
            padding: 8px 4px !important;
          }
        }
      }
      
      .session-controls-cell {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 8px;
        min-width: 0;
      }

      .copy-session-id-btn {
        background-color: rgba(255, 255, 255, 0.1) !important;
        border-radius: 4px;
        margin: 0 2px;
        width: 32px !important;
        height: 32px !important;

        &:hover {
          background-color: rgba(255, 255, 255, 0.2) !important;
        }

        .v-icon {
          color: rgba(255, 255, 255, 0.9) !important;
        }
      }

      .session-id-cell {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
      }

      .session-id-preview {
        font-family: inherit;
        font-size: 0.8rem;
        white-space: nowrap;
      }

      .menu-button {
        flex-shrink: 0;
        background-color: rgba(255, 255, 255, 0.1) !important;
        border-radius: 4px;

        &:hover {
          background-color: rgba(255, 255, 255, 0.2) !important;
        }

        .v-icon {
          color: rgba(255, 255, 255, 0.9) !important;
        }
      }

      .action-buttons-desktop {
        gap: 4px;
        flex-shrink: 0;

        .action-btn {
          background-color: rgba(255, 255, 255, 0.1) !important;
          border-radius: 4px;
          margin: 0 2px;

          &:hover {
            background-color: rgba(255, 255, 255, 0.2) !important;
          }

          .v-icon {
            color: rgba(255, 255, 255, 0.9) !important;
          }
        }
      }
      
      .session-name-text {
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .date-column {
        @media (max-width: 599px) {
          font-size: 0.75rem;
        }
      }
      
      // Compact phone table with consistent desktop-style columns.
      @media (max-width: 599px) {
        ::v-deep .v-data-table {
          font-size: 0.875rem;
          width: 100%;
        }

        ::v-deep .v-data-table__wrapper {
          overflow-x: hidden !important;
        }

        ::v-deep .v-data-table__wrapper table {
          min-width: 0 !important;
          width: 100% !important;
          table-layout: fixed;
        }

        ::v-deep .v-data-table__wrapper thead th {
          padding: 6px 6px !important;
          font-size: 0.72rem !important;
        }

        ::v-deep .v-data-table__wrapper tbody td {
          padding: 7px 6px !important;
          vertical-align: middle;
        }

        ::v-deep .v-data-table__wrapper tbody tr {
          height: 44px;
        }

        ::v-deep .v-data-table__wrapper th,
        ::v-deep .v-data-table__wrapper td {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: left !important;
        }

        ::v-deep .v-data-table__wrapper th:nth-child(1),
        ::v-deep .v-data-table__wrapper td:nth-child(1) {
          width: 36%;
        }

        ::v-deep .v-data-table__wrapper th:nth-child(2),
        ::v-deep .v-data-table__wrapper td:nth-child(2) {
          width: 28%;
        }

        ::v-deep .v-data-table__wrapper th:nth-child(3),
        ::v-deep .v-data-table__wrapper td:nth-child(3) {
          width: 36%;
        }

        ::v-deep .v-data-footer {
          justify-content: center;
          padding-top: 8px;
          font-size: 0.78rem;
        }
      }
    }    
  }
  .table-info-footer {
    margin-left: auto;
  }
}

.trashed {
  color: gray;
}

.session-context-menu {
  max-width: min(320px, calc(100vw - 24px));
}

.session-menu-sheet {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.search-section {
  @media (max-width: 599px) {
    flex: 1 1 100% !important;
    max-width: 100%;
    margin-left: 0 !important;
    flex-direction: row;
    align-items: center !important;
    gap: 6px;

    > div:first-child {
      flex: 1 1 auto;
      min-width: 0;
      margin-right: 0 !important;
    }

    > div:last-child {
      flex: 0 0 auto;

      .submit-btn {
        width: auto;
        min-width: 132px;
        margin-top: 0;
      }
    }
  }
}
</style>
