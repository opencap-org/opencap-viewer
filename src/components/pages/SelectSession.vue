<template>
  <div class="select-session d-flex flex-column">
    <h1 class="page-title">Sessions</h1>
    <div class="d-flex flex-wrap align-center toolbar-container">
      <v-btn
        color="grey darken-4"
        dark
        @click="$router.push({ name: 'RecordingMode' })"
        class="toolbar-button">
        <v-icon left>mdi-plus</v-icon>
        New session
      </v-btn>

      <v-menu offset-y>
        <template v-slot:activator="{ on, attrs }">
          <v-btn color="grey darken-4" dark v-bind="attrs" v-on="on" class="toolbar-button">
            <span class="dashboards-text d-none d-sm-inline mr-2">Dashboards</span>
            <span class="dashboards-text-mobile d-sm-none">Dashboards</span>
            <v-icon>mdi-menu</v-icon>
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
        color="grey darken-4"
        dark
        class="toolbar-button"
        @click="$router.push({ name: 'Subjects' })">
        <v-icon left>mdi-account-group-outline</v-icon>
        Subjects
      </v-btn>

      <v-btn
        color="grey darken-4"
        dark
        class="toolbar-button"
        @click="$router.push({ name: 'RecycleBin' })">
        <v-icon left>mdi-delete-outline</v-icon>
        Recycle Bin
      </v-btn>

      <div class="show-removed-checkbox toolbar-checkbox">
        <v-checkbox v-model="show_trashed" label="Show removed sessions" hide-details dense></v-checkbox>
      </div>

      <div class="d-flex align-center flex-grow-1 flex-md-grow-0 ml-0 ml-md-auto mt-2 mt-md-0 search-section">
        <div class="flex-grow-1 mr-2">
          <v-text-field
            v-model="searchText"
            label="Session ID/Name"
            prepend-inner-icon="mdi-magnify"
            dense
            hide-details
          ></v-text-field>
        </div>

        <div v-if="searchText">
          <v-btn
            color="grey darken-4"
            dark
            class="submit-btn"
            @click="onClearSearch()">
            Clear
          </v-btn>
        </div>
      </div>
    </div>

    <div class="sessions-table-wrapper">
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
      <template v-slot:no-data>
        <div class="table-empty-state">
          <v-icon size="48" color="grey" class="mb-3">{{ searchText.trim() ? 'mdi-magnify' : 'mdi-folder-open-outline' }}</v-icon>
          <p class="mb-0">{{ searchText.trim() ? 'No matching sessions' : 'No sessions yet' }}</p>
          <p class="text-caption mb-0 mt-1">{{ searchText.trim() ? 'Try a different search term or clear the search' : 'Create a new session to get started' }}</p>
        </div>
      </template>
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
    </div>

    <!-- Session menu bottom sheet (mobile) -->
    <v-bottom-sheet
      content-class="bottom-sheet-rounded"
      v-model="showSessionMenuSheet"
      @input="val => !val && (selectedSessionForMenu = null)">
      <v-sheet class="text-center session-menu-sheet">
        <v-list v-if="selectedSessionForMenu">
          <v-list-item link @click="closeSheetAndLoad(selectedSessionForMenu)">
            <v-list-item-content>
              <div class="d-flex flex-row align-center justify-center">
                <v-icon class="mr-3">mdi-play</v-icon>
                <span>Load</span>
              </div>
            </v-list-item-content>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item link @click="closeSheetAndDashboard(selectedSessionForMenu)">
            <v-list-item-content>
              <div class="d-flex flex-row align-center justify-center">
                <v-icon class="mr-3">mdi-chart-line</v-icon>
                <span>Dashboard kinematics</span>
              </div>
            </v-list-item-content>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item link @click="closeSheetAndRename(selectedSessionForMenu)">
            <v-list-item-content>
              <div class="d-flex flex-row align-center justify-center">
                <v-icon class="mr-3">mdi-pencil</v-icon>
                <span>Rename</span>
              </div>
            </v-list-item-content>
          </v-list-item>
          <v-divider v-if="!selectedSessionForMenu.trashed"></v-divider>
          <v-list-item link v-if="!selectedSessionForMenu.trashed" @click="closeSheetAndTrash(selectedSessionForMenu)">
            <v-list-item-content>
              <div class="d-flex flex-row align-center justify-center">
                <v-icon class="mr-3">mdi-delete-outline</v-icon>
                <span>Trash</span>
              </div>
            </v-list-item-content>
          </v-list-item>
          <v-divider v-if="selectedSessionForMenu.trashed"></v-divider>
          <v-list-item link v-if="selectedSessionForMenu.trashed" @click="closeSheetAndRestore(selectedSessionForMenu)">
            <v-list-item-content>
              <div class="d-flex flex-row align-center justify-center">
                <v-icon class="mr-3">mdi-restore</v-icon>
                <span>Restore</span>
              </div>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-sheet>
    </v-bottom-sheet>

    <!-- Rename Session Dialog -->
    <v-dialog
      v-model="rename_dialog"
      v-click-outside="clickOutsideDialogSessionHideMenu"
      content-class="compact-rename-dialog app-dialog"
      max-width="420"
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
        content-class="confirm-dialog"
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
        content-class="confirm-dialog"
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
import { apiInfo, apiError, apiSuccess, clearToastMessages } from '@/util/ErrorMessage.js'
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
      clearToastMessages()
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
          width: '120px'
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
          width: '56px'
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
          text: '# trials', 
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
    // Only use compact 3-column layout on small phones; tablets and up get full columns.
    isPhone () {
      return this.$vuetify.breakpoint.xsOnly
    },
    displayHeaders () {
      if (this.isPhone) {
        return this.headers
          .filter(({ value }) => ['sessionName', 'created_at', 'controls'].includes(value))
          .map(header => {
            const { width, ...rest } = header
            if (header.value === 'controls') {
              return { ...rest, align: 'start', sortable: false, width: 72 }
            }
            return { ...rest, align: 'start', sortable: false }
          })
      }
      // Tablet/desktop: omit width so Vuetify doesn't set inline styles;
      // our CSS media queries control column widths (%, min-width) instead.
      return this.headers.map(({ width, ...rest }) => rest)
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
      this.$router.push({ name: 'Dashboard' })
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
        apiSuccess('Session moved to trash.')
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
        apiSuccess('Session renamed successfully.')
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
  padding: 10px 8px 14px;
  gap: 8px;
  justify-content: flex-start;
  
  @media (max-width: 599px) {
    padding: 8px 6px 10px;
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

  @media (min-width: 600px) {
    min-height: 48px !important;
  }

  @media (max-width: 599px) {
    flex: 1 1 calc(50% - 3px);
    width: calc(50% - 3px);
    min-height: 44px;
  }
}

.select-session {
  position: fixed;
  top: var(--app-bar-top-offset, 64px);
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px 8px;
  box-sizing: border-box;
  z-index: 1;
  background-color: #000;

  @media (max-width: 599px) {
    padding: 8px 4px;
  }

  .sessions-table-wrapper {
    position: relative;
    margin: 0 8px 16px 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;

    @media (max-width: 599px) {
      margin: 0 4px 8px 4px;
    }
  }

  .toolbar-checkbox {
    display: flex;
    align-items: center;
    flex-shrink: 0;

    ::v-deep .v-input {
      margin-top: 0;
      padding-top: 0;
    }
    ::v-deep .v-input__control {
      align-items: center;
    }
    ::v-deep .v-messages {
      display: none;
    }
  }

  .sessions-table {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;

    ::v-deep .v-data-footer {
      flex: 0 0 auto;
    }
    
    .v-data-table__wrapper {
      overflow-x: hidden;
      overflow-y: auto;
      flex: 1 1 auto;
      min-height: 0;
      position: relative;
      -webkit-overflow-scrolling: touch;

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
        }
      }
      
      .session-controls-cell {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 4px;
        min-width: 0;
        overflow: visible;
      }

      .copy-session-id-btn {
        background-color: rgba(255, 255, 255, 0.1) !important;
        border-radius: 4px;
        margin: 0 0 0 6px;
        width: 32px !important;
        min-width: 32px !important;
        height: 32px !important;
        flex-shrink: 0;

        @media (max-width: 959px) {
          width: 28px !important;
          min-width: 28px !important;
          height: 28px !important;
        }

        @media (max-width: 599px) {
          width: 26px !important;
          min-width: 26px !important;
          height: 26px !important;
        }

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
        width: fit-content;
        max-width: 100%;
      }

      .session-id-preview {
        font-family: inherit;
        font-size: 0.8rem;
        flex: 0 0 10ch;
        width: 10ch;
        overflow: hidden;
        text-overflow: ellipsis;
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
        flex-wrap: nowrap;
        white-space: nowrap;

        .action-btn {
          background-color: rgba(255, 255, 255, 0.1) !important;
          border-radius: 4px;
          margin: 0 2px;
          flex-shrink: 0;

          &:hover {
            background-color: rgba(255, 255, 255, 0.2) !important;
          }

          .v-icon {
            color: rgba(255, 255, 255, 0.9) !important;
          }
        }
      }
      
      .session-name-column {
        padding-left: 12px !important;
      }

      .session-name-text {
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding-left: 12px;
      }
      
      .date-column {
        @media (max-width: 599px) {
          font-size: 0.75rem;
        }
      }
      
    }    
  }

  // Full table (600px+): no horizontal scroll; table fits viewport so no half-visible column.
  @media (min-width: 600px) {
    .sessions-table .v-data-table__wrapper {
      overflow-x: hidden !important;

      table {
        table-layout: fixed;
        width: 100%;
      }

      th, td {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      th:nth-child(3), td:nth-child(3) {
        overflow: visible;
      }

      // Percentage widths so columns always fit (sum 100%). Session ID wide enough for preview + copy button (no overflow).
      th:nth-child(1), td:nth-child(1) { width: 15%; } /* Session Name */
      th:nth-child(2), td:nth-child(2) { width: 13%; } /* Date */
      th:nth-child(3), td:nth-child(3) { width: 8%; }  /* Actions (burger on sm) */
      th:nth-child(4), td:nth-child(4) { width: 22%; } /* Session ID (preview + copy button) */
      th:nth-child(5), td:nth-child(5) { width: 17%; } /* Subject Name */
      th:nth-child(6), td:nth-child(6) { width: 9%; } /* # trials */
      th:nth-child(7), td:nth-child(7) { width: 12%; } /* Monocular */
    }
  }

  // Desktop (960px+): Actions enough for buttons; Session ID close to Actions; Date full; !important overrides Vuetify.
  @media (min-width: 960px) {
    .sessions-table .v-data-table__wrapper {
      th:nth-child(1), td:nth-child(1) { width: 12% !important; }
      th:nth-child(2), td:nth-child(2) { width: 11% !important; } /* Date: full "Feb. 24, 2026" */
      th:nth-child(3), td:nth-child(3) { 
        width: 26% !important; 
        min-width: 200px !important;
        overflow: visible !important;
      } /* Actions: no huge gap before Session ID */
      th:nth-child(4), td:nth-child(4) { width: 21% !important; } /* Session ID: closer to Actions */
      th:nth-child(5), td:nth-child(5) { width: 12% !important; }
      th:nth-child(6), td:nth-child(6) { width: 9% !important; }
      th:nth-child(7), td:nth-child(7) { width: 9% !important; }
    }
    
    .sessions-table .session-controls-cell {
      overflow: visible !important;
      min-width: 0;
    }
    
    .sessions-table .action-buttons-desktop {
      min-width: max-content;
    }
  }

  // Compact table layout for small phones only (< 600px).
  // Keeps 3 columns: Session Name / Date / Actions (burger only).
  @media (max-width: 599px) {
    .sessions-table .v-data-table__wrapper {
      overflow-x: hidden !important;

      table {
        min-width: 0 !important;
        width: 100% !important;
        table-layout: auto;
      }

      tbody td {
        vertical-align: middle;
      }

      tbody tr {
        height: 44px;
      }

      // Clip text overflow in all cells by default
      th,
      td {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      // Actions column: keep burger visible; header and buttons left-aligned so they line up
      th:nth-child(3),
      td:nth-child(3) {
        width: 1%;
        min-width: 48px;
        white-space: nowrap;
        overflow: visible;
        text-align: left !important;
        padding-left: 4px !important;
        padding-right: 4px !important;
      }

      // "Actions" header: left-align to match the buttons in the column
      thead th:nth-child(3) {
        ::v-deep .v-data-table-header__content {
          justify-content: flex-start;
          padding: 0;
          width: 100%;
        }
      }
    }

    .sessions-table .session-controls-cell {
      justify-content: flex-start;
      width: 100%;
    }

    .sessions-table {
      .v-data-table {
        font-size: 0.875rem;
        width: 100%;
      }

      .v-data-table__wrapper {
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.02);

        thead th {
          padding: 12px 8px !important;
          min-height: 44px !important;
          font-size: 0.75rem !important;
        }

        tbody td {
          padding: 7px 4px !important;
        }
      }

      ::v-deep .v-data-footer {
        justify-content: center;
        font-size: 0.78rem;
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
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden;
}
.session-menu-sheet .v-list-item {
  justify-content: center !important;
}
.session-menu-sheet .v-list-item__content {
  flex: 0 0 auto !important;
  flex-direction: row !important;
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
