<template>
  <div>
    <div class="d-flex flex-column">
      <div class="pa-2 d-flex justify-content-between">
        <v-btn
          width="16em"
          @click="$router.push({ name: 'SelectSession' })">
          Go back to sessions list
        </v-btn>
        <v-btn
          @click="empty_bin_dialog = true">
          Empty Recycle Bin
        </v-btn>
      </div>
    </div>

    <v-row>
      <v-col cols="8">

            <v-data-table
              :headers="headers"
              :items="trashed_sessions"
              :options.sync="session_options"
              :loading="session_loading"
              :server-items-length="session_total"
              :footer-props="{
                showFirstLastPage: false,
                disableItemsPerPage: true,
                itemsPerPageOptions: [40]
              }"
              height="80vh"
              single-select
              class="sessions-table mx-2 mb-4 flex-grow-1"
              @item-selected="onSelect"
              @click:row="onRowClick">
              <template v-slot:item.id="{ item }">
                <div class="float-right">
                  <template v-if="$vuetify.breakpoint.smAndDown && item.trashed">
                    <v-btn icon dark @click="openSessionMenuSheet(item)">
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
                      <v-btn icon dark v-bind="attrs" v-on="on">
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
                <div class="cursor-pointer mt-2">{{ item.id }}</div>
              </template>
            </v-data-table>

      </v-col>
      <v-col cols="4">

        <v-simple-table
            v-if="selected"
            class="mx-2">
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
    <v-bottom-sheet v-model="showSessionMenuSheet" @input="val => !val && (selectedSessionForMenu = null)">
      <v-sheet class="text-center recycle-menu-sheet">
        <v-list v-if="selectedSessionForMenu">
          <v-list-item link @click="closeSheetAndRestoreSession(selectedSessionForMenu)">
            <v-list-item-title>Restore</v-list-item-title>
          </v-list-item>
          <v-list-item link @click="closeSheetAndPermanentDeleteSession(selectedSessionForMenu)">
            <v-list-item-title>Delete permanently</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-sheet>
    </v-bottom-sheet>

    <!-- Trial menu bottom sheet (mobile) -->
    <v-bottom-sheet v-model="showTrialMenuSheet" @input="val => !val && (selectedTrialForMenu = null)">
      <v-sheet class="text-center recycle-menu-sheet">
        <v-list v-if="selectedTrialForMenu">
          <v-list-item link @click="closeSheetAndRestoreTrial(selectedTrialForMenu)">
            <v-list-item-title>Restore</v-list-item-title>
          </v-list-item>
          <v-list-item link @click="closeSheetAndPermanentDeleteTrial(selectedTrialForMenu)">
            <v-list-item-title>Delete permanently</v-list-item-title>
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
import { mapActions, mapState } from 'vuex'
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
        {
          text: 'ID',
          align: 'start',
          sortable: false,
          value: 'id',
        },
        { text: 'Session Name', value: 'sessionName' },
        { text: 'Subject Name', value: 'name' },
        { text: 'Number of trials', align: 'center', value: 'trials_count' },
        { text: 'Date', value: 'created_at' }
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
    trialsMapped () {
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
.recycle-session-context-menu,
.recycle-trial-context-menu {
  max-width: min(320px, calc(100vw - 24px));
}

.recycle-menu-sheet {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>
