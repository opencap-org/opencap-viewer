<template>
  <div class="recycle-bin d-flex flex-column">
    <div class="d-flex flex-wrap align-center recycle-toolbar">
        <v-btn
          class="recycle-toolbar-button"
          @click="$router.push({ name: 'SelectSession' })">
          <v-icon left>mdi-arrow-left</v-icon>
          Back to Sessions
        </v-btn>
        <v-btn
          class="recycle-toolbar-button"
          @click="empty_bin_dialog = true">
          Empty Recycle Bin
        </v-btn>
    </div>

    <v-row class="recycle-content">
      <v-col cols="12" md="8">

            <v-data-table
              :headers="displayHeaders"
              :items="trashed_sessions"
              :options.sync="session_options"
              :loading="session_loading"
              :server-items-length="session_total"
              :mobile-breakpoint="0"
              :dense="$vuetify.breakpoint.smAndDown"
              :footer-props="{
                showFirstLastPage: false,
                disableItemsPerPage: true,
                itemsPerPageOptions: [40]
              }"
              fixed-header
              :height="sessionsTableHeight"
              single-select
              class="sessions-table recycle-sessions-table flex-grow-1"
              @item-selected="onSelect"
              @click:row="onRowClick">
              <template v-slot:item.controls="{ item }">
                <div class="session-controls-cell">
                  <template v-if="$vuetify.breakpoint.smAndDown && item.trashed">
                    <v-btn icon dark small class="menu-button" @click.stop="openSessionMenuSheet(item)">
                      <v-icon>mdi-menu</v-icon>
                    </v-btn>
                  </template>
                  <v-menu
                    v-else-if="item.trashed"
                    v-model="item.isMenuOpen"
                    offset-y
                    right
                    close-on-content-click
                    content-class="recycle-session-context-menu">
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn icon dark small class="menu-button" v-bind="attrs" v-on="on" @click.stop>
                        <v-icon>mdi-menu</v-icon>
                      </v-btn>
                    </template>
                    <v-list>
                      <v-list-item link @click="closeSessionMenuAndRestore(item)">
                        <v-list-item-title>Restore</v-list-item-title>
                      </v-list-item>
                      <v-list-item link @click="closeSessionMenuAndPermanentDelete(item)">
                        <v-list-item-title>Delete permanently</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </div>
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
              <template v-slot:item.sessionName="{ item }">
                <div class="session-name-text">{{ item.sessionName || 'Untitled' }}</div>
              </template>
              <template v-slot:item.created_at="{ item }">
                <span>{{ item.created_at | date }}</span>
              </template>
            </v-data-table>

      </v-col>
      <v-col cols="12" md="4">

        <v-simple-table
            v-if="selected"
            class="recycle-trials-table">
            <template v-slot:default>
              <thead>
                <tr>
                  <th class="text-left">
                    Trial name
                  </th>
                  <th class="text-left">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="trial in trialsMapped"
                  :key="trial.id"
                >
                    <td>
                    <div class="float-right">
                      <template v-if="$vuetify.breakpoint.smAndDown && trial.trashed">
                        <v-btn icon dark @click="openTrialMenuSheet(trial)">
                          <v-icon>mdi-menu</v-icon>
                        </v-btn>
                      </template>
                      <v-menu
                        v-else-if="trial.trashed"
                        v-model="trial.isMenuOpen"
                        offset-y
                        right
                        close-on-content-click
                        content-class="recycle-trial-context-menu">
                        <template v-slot:activator="{ on, attrs }">
                          <v-btn icon dark v-bind="attrs" v-on="on">
                            <v-icon>mdi-menu</v-icon>
                          </v-btn>
                        </template>
                        <v-list>
                          <v-list-item link @click="closeTrialMenuAndRestore(trial)">
                            <v-list-item-title>Restore</v-list-item-title>
                          </v-list-item>
                          <v-list-item link @click="closeTrialMenuAndPermanentDelete(trial)">
                            <v-list-item-title>Delete permanently</v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </div>

                    <div class="mt-2">{{ trial.name }}</div>
                  </td>
                  <td>{{ trial.status }}</td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>


      </v-col>
    </v-row>

    <!-- Session menu bottom sheet (mobile) -->
    <v-bottom-sheet content-class="bottom-sheet-rounded" v-model="showSessionMenuSheet" @input="val => !val && (selectedSessionForMenu = null)">
      <v-sheet class="text-center recycle-menu-sheet" color="blue-grey darken-1">
        <v-list v-if="selectedSessionForMenu">
          <v-list-item link @click="closeSheetAndRestoreSession(selectedSessionForMenu)">
            <v-list-item-content>
              <div class="d-flex flex-row align-center justify-center">
                <v-icon class="mr-3">mdi-restore</v-icon>
                <span>Restore</span>
              </div>
            </v-list-item-content>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item link @click="closeSheetAndPermanentDeleteSession(selectedSessionForMenu)">
            <v-list-item-content>
              <div class="d-flex flex-row align-center justify-center">
                <v-icon class="mr-3">mdi-delete-forever</v-icon>
                <span>Delete permanently</span>
              </div>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-sheet>
    </v-bottom-sheet>

    <!-- Trial menu bottom sheet (mobile) -->
    <v-bottom-sheet content-class="bottom-sheet-rounded" v-model="showTrialMenuSheet" @input="val => !val && (selectedTrialForMenu = null)">
      <v-sheet class="text-center recycle-menu-sheet" color="blue-grey darken-1">
        <v-list v-if="selectedTrialForMenu">
          <v-list-item link @click="closeSheetAndRestoreTrial(selectedTrialForMenu)">
            <v-list-item-content>
              <div class="d-flex flex-row align-center justify-center">
                <v-icon class="mr-3">mdi-restore</v-icon>
                <span>Restore</span>
              </div>
            </v-list-item-content>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item link @click="closeSheetAndPermanentDeleteTrial(selectedTrialForMenu)">
            <v-list-item-content>
              <div class="d-flex flex-row align-center justify-center">
                <v-icon class="mr-3">mdi-delete-forever</v-icon>
                <span>Delete permanently</span>
              </div>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-sheet>
    </v-bottom-sheet>

    <!-- Restore Session Dialog -->
    <v-dialog v-model="restore_session_dialog" v-click-outside="clickOutsideDialogSessionHideMenu" max-width="500" :fullscreen="$vuetify.breakpoint.smAndDown" persistent>
      <v-card v-if="selectedSessionForRestore">
        <v-card-text class="pt-4">
          <v-row class="m-0">
            <v-col cols="12" sm="2"><v-icon x-large color="green">mdi-undo-variant</v-icon></v-col>
            <v-col cols="12" sm="10">
              <p>Do you want to restore session <code>{{ selectedSessionForRestore.id }}</code>?</p>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="restore_session_dialog = false; selectedSessionForRestore = null">No</v-btn>
          <v-btn color="green darken-1" text @click="restore_session_dialog = false; restoreSession(selectedSessionForRestore.id); selectedSessionForRestore = null">Yes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Permanent Delete Session Dialog -->
    <v-dialog v-model="remove_permanently_session_dialog" v-click-outside="clickOutsideDialogSessionHideMenu" max-width="500" :fullscreen="$vuetify.breakpoint.smAndDown" persistent>
      <v-card v-if="selectedSessionForPermanentDelete">
        <v-card-text class="pt-4">
          <v-row class="m-0">
            <v-col cols="12" sm="2"><v-icon x-large color="red">mdi-close-circle</v-icon></v-col>
            <v-col cols="12" sm="10">
              <p>Do you want to <strong>permanently</strong> remove session <code>{{ selectedSessionForPermanentDelete.id }}</code>?</p>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="remove_permanently_session_dialog = false; selectedSessionForPermanentDelete = null">No</v-btn>
          <v-btn color="red darken-1" text @click="remove_permanently_session_dialog = false; permanentRemoveSession(selectedSessionForPermanentDelete.id); selectedSessionForPermanentDelete = null">Yes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Restore Trial Dialog -->
    <v-dialog v-model="restore_trial_dialog" v-click-outside="clickOutsideDialogTrialHideMenu" max-width="500" :fullscreen="$vuetify.breakpoint.smAndDown" persistent>
      <v-card v-if="selectedTrialForRestore">
        <v-card-text class="pt-4">
          <v-row class="m-0">
            <v-col cols="12" sm="2"><v-icon x-large color="green">mdi-undo-variant</v-icon></v-col>
            <v-col cols="12" sm="10">
              <p>Do you want to restore trial {{ selectedTrialForRestore.name }}?</p>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="restore_trial_dialog = false; selectedTrialForRestore = null">No</v-btn>
          <v-btn color="green darken-1" text @click="restore_trial_dialog = false; restoreTrial(selectedTrialForRestore); selectedTrialForRestore = null">Yes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Permanent Delete Trial Dialog -->
    <v-dialog v-model="remove_permanently_trial_dialog" v-click-outside="clickOutsideDialogTrialHideMenu" max-width="500" :fullscreen="$vuetify.breakpoint.smAndDown" persistent>
      <v-card v-if="selectedTrialForPermanentDelete">
        <v-card-text class="pt-4">
          <v-row class="m-0">
            <v-col cols="12" sm="2"><v-icon x-large color="red">mdi-close-circle</v-icon></v-col>
            <v-col cols="12" sm="10">
              <p>Do you want to <strong>permanently</strong> remove trial {{ selectedTrialForPermanentDelete.name }}?</p>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="remove_permanently_trial_dialog = false; selectedTrialForPermanentDelete = null">No</v-btn>
          <v-btn color="red darken-1" text @click="remove_permanently_trial_dialog = false; permanentRemoveTrial(selectedTrialForPermanentDelete); selectedTrialForPermanentDelete = null">Yes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="empty_bin_dialog" max-width="500" :fullscreen="$vuetify.breakpoint.smAndDown">
      <v-card>
        <v-card-text class="pt-4">
          <v-row class="m-0">
            <v-col cols="12" sm="2">
              <v-icon x-large color="red">mdi-close-circle</v-icon>
            </v-col>
            <v-col cols="12" sm="10">
              <p>
                Do you want to <strong>permanently</strong> empty the Recycle Bin?
              </p>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="blue darken-1"
            text
            @click="empty_bin_dialog = false"
          >
            No
          </v-btn>
          <v-btn
            color="red darken-1"
            text
            @click="empty_bin_dialog = false; emptyBin()"
          >
            Yes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

</div>
</template>

<script>
import Vue from 'vue'
import { mapActions } from 'vuex'
import axios from 'axios'
import { apiInfo, apiError } from '@/util/ErrorMessage.js'

export default {
  name: 'RecycleBin',
  data () {
    return {
      session_loading: true,
      session_start: 0,
      session_quantity: 40,
      session_total: 0,
      trashed_sessions: [],
      session_options: {},

      trial_loading: true,
      trial_start: 0,
      trial_quantity: 40,
      trial_total: 0,
      trashed_trials: [],
      trial_options: {},

      restore_session_dialog: false,
      remove_session_dialog: false,
      remove_permanently_session_dialog: false,
      restore_trial_dialog: false,
      remove_trial_dialog: false,
      remove_permanently_trial_dialog: false,
      empty_bin_dialog: false,
      showSessionMenuSheet: false,
      selectedSessionForMenu: null,
      showTrialMenuSheet: false,
      selectedTrialForMenu: null,
      selectedSessionForRestore: null,
      selectedSessionForPermanentDelete: null,
      selectedTrialForRestore: null,
      selectedTrialForPermanentDelete: null,
      headers: [
        { text: 'Session Name', value: 'sessionName' },
        { text: 'Date', value: 'created_at' },
        {
          text: 'Actions',
          value: 'controls',
          sortable: false,
          width: '100px'
        },
        {
          text: 'Session ID',
          align: 'start',
          sortable: false,
          value: 'id',
        },
        { text: 'Subject Name', value: 'name' },
        { text: '# trials', align: 'center', value: 'trials_count' }
      ],
      selected: null,
    }
  },
  watch: {
    session_options: {
      handler: function (val) {
        this.session_start = (this.session_options.page - 1) * 40;
        this.loadTrashedSessions()
      },
      deep: true
    }
  },
  computed: {
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
    },
    sessionsTableHeight () {
      return this.$vuetify.breakpoint.smAndDown ? '44vh' : '72vh'
    },
    trialsMapped () {
        if (!this.selected || !this.selected.trials) {
          return []
        }
        return this.selected.trials.filter(t => t.trashed || this.selected.trashed).map(t => ({...t, isMenuOpen: false}))
    }
  },
  methods: {
    ...mapActions('data', [
      'loadSession',
      'permanentRemoveExistingSession',
      'trashExistingSession', 'restoreTrashedSession']),

    loadTrashedSessions() {
      this.session_loading = true
      let data = {
        start: this.session_start,
        quantity: 40,
        only_trashed: true
      }
      let res = axios.post('/sessions/valid/', data).then(response => {
        this.trashed_sessions = response.data.sessions.map(s => ({ ...s, isMenuOpen: false }))
        this.session_total = response.data.total
        this.session_loading = false
      }).catch(error => {
        apiError(error)
        this.session_loading = false
      })
    },
    onSelect({item, value}) {
      if (value) {
        axios.get(`/sessions/${item.id}/`).then((res) => {
          console.log(res)
          this.selected = res.data
        })
      } else {
        this.selected = null
      }
    },
    onRowClick(item, params) {
      params.select(!params.isSelected);
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
    },
    clickOutsideDialogSessionHideMenu(e) {
      if (e.target.className === 'v-overlay__scrim') {
        for (let t of this.trashed_sessions) {
          t.isMenuOpen = false;
        }
        this.showSessionMenuSheet = false;
        this.selectedSessionForMenu = null;
      }
    },
    clickOutsideDialogTrialHideMenu(e) {
      if (e.target.className === 'v-overlay__scrim') {
        for (let t of this.trialsMapped) {
          t.isMenuOpen = false;
        }
        this.showTrialMenuSheet = false;
        this.selectedTrialForMenu = null;
      }
    },
    openSessionMenuSheet(item) {
      this.selectedSessionForMenu = item;
      this.showSessionMenuSheet = true;
    },
    openTrialMenuSheet(item) {
      this.selectedTrialForMenu = item;
      this.showTrialMenuSheet = true;
    },
    closeSessionMenuAndRestore(item) { item.isMenuOpen = false; this.selectedSessionForRestore = item; this.restore_session_dialog = true; },
    closeSessionMenuAndPermanentDelete(item) { item.isMenuOpen = false; this.selectedSessionForPermanentDelete = item; this.remove_permanently_session_dialog = true; },
    closeTrialMenuAndRestore(item) { item.isMenuOpen = false; this.selectedTrialForRestore = item; this.restore_trial_dialog = true; },
    closeTrialMenuAndPermanentDelete(item) { item.isMenuOpen = false; this.selectedTrialForPermanentDelete = item; this.remove_permanently_trial_dialog = true; },
    closeSheetAndRestoreSession(item) { this.showSessionMenuSheet = false; this.selectedSessionForMenu = null; this.selectedSessionForRestore = item; this.restore_session_dialog = true; },
    closeSheetAndPermanentDeleteSession(item) { this.showSessionMenuSheet = false; this.selectedSessionForMenu = null; this.selectedSessionForPermanentDelete = item; this.remove_permanently_session_dialog = true; },
    closeSheetAndRestoreTrial(item) { this.showTrialMenuSheet = false; this.selectedTrialForMenu = null; this.selectedTrialForRestore = item; this.restore_trial_dialog = true; },
    closeSheetAndPermanentDeleteTrial(item) { this.showTrialMenuSheet = false; this.selectedTrialForMenu = null; this.selectedTrialForPermanentDelete = item; this.remove_permanently_trial_dialog = true; },
    async permanentRemoveSession(id) {
      try {
        await this.permanentRemoveExistingSession(id);
        if (this.selected && this.selected.id === id) {
          this.selected = null;
        }
        this.loadTrashedSessions();
      } catch (error) {
        apiError(error)
      }
    },
    async restoreSession(id) {
      try {
        await this.restoreTrashedSession(id);
        this.loadTrashedSessions();
      } catch (error) {
        apiError(error)
      }
    },
    async updateTrialWithData(trial, data) {
        if (!this.selected || !this.selected.trials) return;
        const index = this.selected.trials.findIndex(x => x.id === trial.id)
        if (index >= 0) {
            Vue.set(this.selected.trials, index, data);
        }
    },
    async permanentRemoveTrial(trial) {
      try {
        if (this.selected && this.selected.trials) {
          const index = this.selected.trials.findIndex(x => x.id === trial.id);
          await axios.post(`/trials/${trial.id}/permanent_remove/`);
          this.selected.trials.splice(index, 1);
        }
      } catch (error) {
        apiError(error)
      }
    },
    async restoreTrial(trial) {
      try {
        const { data } = await axios.post(`/trials/${trial.id}/restore/`);
        await this.updateTrialWithData(trial, data);
      } catch (error) {
        apiError(error)
      }
    },
    async emptyBin() {
      let trials = [];
      let sessions_ids = [];

      this.trashed_sessions.forEach(s => {
        if (s.trashed) {
          sessions_ids.push(s.id)
        } else if (s.trials) {
          s.trials.forEach(t => {
            if (t.trashed) {
              trials.push(t)
            }
          })
        }
      })

      for await (const t of trials) {
        await this.permanentRemoveTrial(t)
      }
      for await (const id of sessions_ids) {
        await this.permanentRemoveSession(id)
      }

    }
  }
}
</script>

<style lang="scss" scoped>
.recycle-bin {
  position: fixed;
  top: var(--app-bar-top-offset, 64px);
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  padding: 16px 8px;
  box-sizing: border-box;
  z-index: 1;
  background-color: #000;

  @media (max-width: 599px) {
    padding: 8px 4px;
  }
}

.recycle-toolbar {
  padding: 10px 8px 14px;
  gap: 8px;

  @media (max-width: 599px) {
    padding: 8px 6px 10px;
    gap: 6px;
  }
}

.recycle-toolbar-button {
  margin: 0 !important;
  flex-shrink: 0;

  @media (max-width: 599px) {
    flex: 1 1 calc(50% - 3px);
    width: calc(50% - 3px);
    min-height: 44px;
  }
}

.recycle-content {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding-bottom: max(8px, env(safe-area-inset-bottom, 0px));
}

.recycle-sessions-table {
  margin: 0 8px 8px 8px;
  overflow: hidden;

  @media (max-width: 599px) {
    margin: 0 4px 8px 4px;
  }

  ::v-deep .v-data-table__wrapper {
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
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

  .session-name-text {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 599px) {
    ::v-deep .v-data-table__wrapper table {
      table-layout: fixed;
      width: 100% !important;
      min-width: 0 !important;
    }

    ::v-deep .v-data-table__wrapper thead th {
      padding: 6px 6px !important;
      font-size: 0.72rem !important;
      white-space: nowrap;
    }

    ::v-deep .v-data-table__wrapper tbody td {
      padding: 7px 6px !important;
      vertical-align: middle;
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
      width: 40%;
    }

    ::v-deep .v-data-table__wrapper th:nth-child(2),
    ::v-deep .v-data-table__wrapper td:nth-child(2) {
      width: 34%;
    }

    ::v-deep .v-data-table__wrapper th:nth-child(3),
    ::v-deep .v-data-table__wrapper td:nth-child(3) {
      width: 26%;
    }
  }
}

.recycle-trials-table {
  margin: 0 8px 8px 8px;
  max-height: 100%;
  overflow: auto;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 599px) {
    margin: 0 4px 8px 4px;
  }
}

.recycle-session-context-menu,
.recycle-trial-context-menu {
  max-width: min(320px, calc(100vw - 24px));
}

.recycle-menu-sheet {
  padding-bottom: env(safe-area-inset-bottom, 0);
  background-color: #546E7A !important; /* blue-grey 700 - muted, modern */
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden;
}
.recycle-menu-sheet .v-list {
  background-color: transparent !important;
}
.recycle-menu-sheet .v-list-item {
  justify-content: center !important;
}
.recycle-menu-sheet .v-list-item__content {
  flex: 0 0 auto !important;
  flex-direction: row !important;
}
</style>
