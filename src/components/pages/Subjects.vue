<template>
  <div class="subjects-page d-flex flex-column">
    <h1 class="page-title">Subjects</h1>
    <div class="d-flex flex-column">
    <div class="d-flex flex-wrap align-center subjects-toolbar">
      <v-btn
        class="subjects-toolbar__btn"
        text
        @click="$router.push({ name: 'SelectSession' })">
        <v-icon left>mdi-arrow-left</v-icon>
        Back to Sessions
      </v-btn>
      <v-btn
        class="subjects-toolbar__btn"
        @click="$refs.dialogRef.addSubject()">
        <v-icon left>mdi-plus</v-icon>
        New Subject
      </v-btn>
      <v-checkbox
        v-model="show_trashed"
        class="subjects-toolbar__checkbox"
        label="Show removed subjects"
        hide-details></v-checkbox>

      <div class="d-flex align-center flex-grow-1 flex-md-grow-0 ml-0 ml-md-auto mt-2 mt-md-0 subjects-search-section">
        <div class="flex-grow-1 mr-2">
          <v-text-field
            v-model="searchText"
            label="Subject ID/Name"
            prepend-inner-icon="mdi-magnify"
            dense
            hide-details
          ></v-text-field>
        </div>
        <div v-if="searchText">
          <v-btn
            class="subjects-submit-btn"
            @click="onClearSearch()">
            Clear
          </v-btn>
        </div>
      </div>
    </div>
    </div>

    <v-row class="subjects-page-row" no-gutters>
      <v-col cols="12" :md="selected ? 7 : 12" class="subjects-table-col">

            <v-data-table
              :headers="displayHeaders"
              :items="valid_subjects"
              :options.sync="options"
              :item-class="itemClasses"
              :loading="loading"
              :server-items-length="subject_total"
              :mobile-breakpoint="0"
              :dense="$vuetify.breakpoint.smAndDown"
              :footer-props="{
                showFirstLastPage: false,
                disableItemsPerPage: true,
                itemsPerPageOptions: [40]
              }"
              :height="$vuetify.breakpoint.smAndDown ? '50vh' : '70vh'"
              fixed-header
              single-select
              class="subjects-table flex-grow-1"
              @item-selected="onSelect"
              @click:row="onRowClick">
              <template v-slot:item.name="{ item }">
                <div class="subject-name-cell">
                  <div class="subject-name-text cursor-pointer">{{ item.name }}</div>
                  <div class="subject-name-actions">
                    <template v-if="$vuetify.breakpoint.smAndDown">
                      <v-btn icon dark @click="openSubjectMenuSheet(item)">
                        <v-icon>mdi-menu</v-icon>
                      </v-btn>
                    </template>
                    <div v-else class="subject-action-buttons">
                      <v-btn
                        v-if="!item.trashed"
                        icon
                        small
                        dark
                        class="subject-action-btn"
                        title="Edit subject"
                        @click.stop="editSubject(item)">
                        <v-icon small>mdi-pencil</v-icon>
                      </v-btn>
                      <v-btn
                        v-if="!item.trashed"
                        icon
                        small
                        dark
                        class="subject-action-btn"
                        title="Trash subject"
                        @click.stop="selectedSubjectForTrash = item; remove_dialog = true">
                        <v-icon small>mdi-delete</v-icon>
                      </v-btn>
                      <v-btn
                        v-if="item.trashed"
                        icon
                        small
                        dark
                        class="subject-action-btn"
                        title="Restore subject"
                        @click.stop="selectedSubjectForRestore = item; restore_dialog = true">
                        <v-icon small>mdi-restore</v-icon>
                      </v-btn>
                      <v-btn
                        v-if="item.trashed"
                        icon
                        small
                        dark
                        class="subject-action-btn"
                        title="Delete permanently"
                        @click.stop="selectedSubjectForPermanentDelete = item; remove_permanently_dialog = true">
                        <v-icon small>mdi-delete-forever</v-icon>
                      </v-btn>
                    </div>
                  </div>
                </div>
              </template>
            </v-data-table>


      </v-col>
      <v-col v-if="selected" cols="12" md="5" class="sessions-table-col">

            <v-data-table
              v-if="selected"
              :headers="sessionDisplayHeaders"
              :items="valid_sessions"
              :options.sync="session_options"
              :item-class="itemClasses"
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
              :height="$vuetify.breakpoint.smAndDown ? '50vh' : '80vh'"
              single-select
              class="sessions-table flex-grow-1"
              @click:row="onRowSessionClick">
              <template v-slot:item.sessionName="{ item }">
                <div class="session-name-cell">
                  <div class="session-name-text">{{ item.sessionName || 'Untitled' }}</div>
                  <div v-if="isPhone" class="session-meta-row">
                    <span class="session-id-preview session-id-preview--mobile" :title="item.id">
                      {{ getSessionIdPreview(item.id) }}
                    </span>
                    <span class="session-trials-preview">{{ item.trials_count || 0 }} trials</span>
                    <v-btn
                      icon
                      x-small
                      dark
                      class="copy-session-id-btn copy-session-id-btn--mobile"
                      title="Copy session ID"
                      @click.stop="copySessionId(item.id)">
                      <v-icon x-small>mdi-content-copy</v-icon>
                    </v-btn>
                  </div>
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
              <template v-slot:item.created_at="{ item }">
                <span>{{ item.created_at | date }}</span>
              </template>
              <template v-slot:item.controls="{ item }">
                <div class="session-controls-cell">
                  <v-btn
                    icon
                    small
                    dark
                    class="action-btn"
                    title="Load session"
                    @click.stop="loadSession(item)">
                    <v-icon small>mdi-play</v-icon>
                  </v-btn>
                </div>
              </template>
        </v-data-table>
      </v-col>
    </v-row>

    <!-- Subject menu bottom sheet (mobile) -->
    <v-bottom-sheet
      content-class="bottom-sheet-rounded"
      v-model="showSubjectMenuSheet"
      @input="val => !val && (selectedSubjectForMenu = null)">
      <v-sheet class="text-center subject-menu-sheet" color="blue-grey darken-1">
        <v-list v-if="selectedSubjectForMenu">
          <v-list-item link v-if="!selectedSubjectForMenu.trashed" @click="closeSheetAndEdit(selectedSubjectForMenu)">
            <v-list-item-content>
              <div class="d-flex flex-row align-center justify-center">
                <v-icon class="mr-3">mdi-pencil</v-icon>
                <span>Edit</span>
              </div>
            </v-list-item-content>
          </v-list-item>
          <v-divider v-if="!selectedSubjectForMenu.trashed"></v-divider>
          <v-list-item link v-show="!selectedSubjectForMenu.trashed" @click="closeSheetAndTrash(selectedSubjectForMenu)">
            <v-list-item-content>
              <div class="d-flex flex-row align-center justify-center">
                <v-icon class="mr-3">mdi-delete-outline</v-icon>
                <span>Trash</span>
              </div>
            </v-list-item-content>
          </v-list-item>
          <v-divider v-if="selectedSubjectForMenu.trashed"></v-divider>
          <v-list-item link v-show="selectedSubjectForMenu.trashed" @click="closeSheetAndRestore(selectedSubjectForMenu)">
            <v-list-item-content>
              <div class="d-flex flex-row align-center justify-center">
                <v-icon class="mr-3">mdi-restore</v-icon>
                <span>Restore</span>
              </div>
            </v-list-item-content>
          </v-list-item>
          <v-divider v-if="selectedSubjectForMenu.trashed"></v-divider>
          <v-list-item link v-show="selectedSubjectForMenu.trashed" @click="closeSheetAndPermanentDelete(selectedSubjectForMenu)">
            <v-list-item-content>
              <div class="d-flex flex-row align-center justify-center">
                <v-icon class="mr-3">mdi-delete-forever</v-icon>
                <span>Delete permanently</span>
              </div>
            </v-list-item-content>
          </v-list-item>
          <v-divider v-if="!selectedSubjectForMenu.trashed && isSyncDownloadAllowed"></v-divider>
          <v-list-item link v-show="!selectedSubjectForMenu.trashed && isSyncDownloadAllowed" @click="closeSheetAndDownload(selectedSubjectForMenu)">
            <v-list-item-content>
              <div class="d-flex flex-row align-center justify-center">
                <v-icon class="mr-3">mdi-download</v-icon>
                <span>Download data (old)</span>
              </div>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-sheet>
    </v-bottom-sheet>

    <!-- Trash Subject Dialog -->
    <v-dialog v-model="remove_dialog" v-click-outside="clickOutsideDialogSubjectHideMenu" content-class="confirm-dialog" max-width="500" :fullscreen="$vuetify.breakpoint.smAndDown">
      <v-card v-if="selectedSubjectForTrash">
        <v-card-text class="pt-4">
          <v-row class="m-0">
            <v-col cols="12" sm="2"><v-icon x-large color="red">mdi-close-circle</v-icon></v-col>
            <v-col cols="12" sm="10">
              <p>Do you want to trash subject <code>{{ selectedSubjectForTrash.name }}</code>?
                You will be able to restore it for 30 days. After that, this subject will be permanently removed.</p>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="remove_dialog = false; selectedSubjectForTrash = null">No</v-btn>
          <v-btn color="red darken-1" text @click="remove_dialog = false; trashSubject(selectedSubjectForTrash.id); selectedSubjectForTrash = null">Yes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Restore Subject Dialog -->
    <v-dialog v-model="restore_dialog" v-click-outside="clickOutsideDialogSubjectHideMenu" content-class="confirm-dialog" max-width="500" :fullscreen="$vuetify.breakpoint.smAndDown">
      <v-card v-if="selectedSubjectForRestore">
        <v-card-text class="pt-4">
          <v-row class="m-0">
            <v-col cols="12" sm="2"><v-icon x-large color="green">mdi-undo-variant</v-icon></v-col>
            <v-col cols="12" sm="10">
              <p>Do you want to restore subject <code>{{ selectedSubjectForRestore.name }}</code>?</p>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="restore_dialog = false; selectedSubjectForRestore = null">No</v-btn>
          <v-btn color="green darken-1" text @click="restore_dialog = false; restoreSubject(selectedSubjectForRestore.id); selectedSubjectForRestore = null">Yes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Permanent Delete Subject Dialog -->
    <v-dialog v-model="remove_permanently_dialog" v-click-outside="clickOutsideDialogSubjectHideMenu" content-class="confirm-dialog" max-width="500" :fullscreen="$vuetify.breakpoint.smAndDown">
      <v-card v-if="selectedSubjectForPermanentDelete">
        <v-card-text class="pt-4">
          <v-row class="m-0">
            <v-col cols="12" sm="2"><v-icon x-large color="red">mdi-close-circle</v-icon></v-col>
            <v-col cols="12" sm="10">
              <p>Do you want to <strong>permanently</strong> remove subject <code>{{ selectedSubjectForPermanentDelete.name }}</code>?</p>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="remove_permanently_dialog = false; selectedSubjectForPermanentDelete = null">No</v-btn>
          <v-btn color="red darken-1" text @click="remove_permanently_dialog = false; permanentRemoveSubject(selectedSubjectForPermanentDelete.id); selectedSubjectForPermanentDelete = null">Yes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Download Subject Dialog -->
    <v-dialog v-model="download_dialog" v-click-outside="clickOutsideDialogSubjectHideMenu" content-class="confirm-dialog" max-width="500" :fullscreen="$vuetify.breakpoint.smAndDown">
      <v-card v-if="selectedSubjectForDownload">
        <v-card-text class="pt-4">
          <v-row class="m-0">
            <v-col cols="12" sm="2"><v-icon x-large color="green">mdi-download</v-icon></v-col>
            <v-col cols="12" sm="10">
              <p>Do you want to download all data associated to the subject <code>{{ selectedSubjectForDownload.name }}</code>?
                (This includes every session and trial associated to it, and can take several minutes).</p>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="download_dialog = false; selectedSubjectForDownload = null">Cancel</v-btn>
          <v-btn color="green darken-1" text :disabled="downloading"
            @click="download_dialog = false; downloadSubjectData(selectedSubjectForDownload.id); selectedSubjectForDownload = null">Download</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <DialogComponent
      ref="dialogRef"
      @subject-updated="submitEditSubject"
      @subject-added="loadValidSubjects"
    />

  </div>
</template>
<script>
import Vue from 'vue'
import { mapActions, mapState } from 'vuex'
import axios from 'axios'
import { apiInfo, apiError } from '@/util/ErrorMessage.js'
import DialogComponent from '@/components/ui/SubjectDialog.vue'

export default {
  components: {
    DialogComponent
  },
  name: 'Subjects',
  created: function () {},
  beforeDestroy () {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer)
    }
  },
  data () {
    return {
      loading: true,
      subject_start: 0,
      subject_quantity: 40,
      subject_total: 0,
      valid_subjects: [],
      options: {},
      subject_sort: [],
      subject_sort_desc: [],


      remove_dialog: false,
      remove_permanently_dialog: false,
      restore_dialog: false,
      download_dialog: false,
      showSubjectMenuSheet: false,
      selectedSubjectForMenu: null,
      selectedSubjectForTrash: null,
      selectedSubjectForRestore: null,
      selectedSubjectForPermanentDelete: null,
      selectedSubjectForDownload: null,
      show_trashed: false,
      searchText: '',
      searchDebounceTimer: null,
      downloading: false,
      isArchiveInProgress: false,
      isArchiveDone: false,
      showArchiveDialog: false,
      archiveUrl: "#",
      delay: 300,
      clicks: 0,
      timer: null,
      headers: [
        { text: 'Name', value: 'name' },
        { text: 'Weight', value: 'weight' },
        { text: 'Height', value: 'height' },
        { text: 'Birth year', value: 'birth_year' },
        { text: 'Sex', value: 'sex_display', width: '90px' },
        { text: 'Gender', value: 'gender_display', width: '90px' },
        { text: 'Subject Tags', value: 'subject_tags', sortable: false},
        { text: 'Characteristics', value: 'characteristics', sortable: false}
      ],

      session_loading: true,
      session_start: 0,
      session_quantity: 40,
      session_total: 0,
      valid_sessions: [],
      session_options: {},

      sessionHeaders: [
        { text: 'Session Name', value: 'sessionName' },
        { text: 'Session ID', value: 'id', sortable: false },
        { text: 'Trials', value: 'trials_count' },
        { text: 'Date', value: 'created_at' },
        { text: 'Actions', value: 'controls', sortable: false },
      ],
      selected: null,
    }
  },
  computed: {
    ...mapState({
      genders: state => state.data.genders,
      sexes: state => state.data.sexes,
      isSyncDownloadAllowed: state => state.data.isSyncDownloadAllowed
    }),
    isPhone () {
      return this.$vuetify.breakpoint.xsOnly
    },
    displayHeaders () {
      if (!this.isPhone) {
        return this.headers
      }

      return this.headers
        .filter(({ value }) => ['name', 'weight', 'height', 'birth_year'].includes(value))
        .map(header => ({
          ...header,
          align: 'start',
          sortable: false
        }))
    },
    sessionDisplayHeaders () {
      if (!this.isPhone) {
        return this.sessionHeaders
      }

      return this.sessionHeaders
        .filter(({ value }) => ['sessionName', 'created_at', 'controls'].includes(value))
        .map(header => ({
          ...header,
          align: 'start',
          sortable: false
        }))
    }
  },
  watch:{
    showArchiveDialog(newShowArchiveDialog, oldShowArchiveDialog){
      if(!newShowArchiveDialog){
        this.isArchiveDone = false;
        this.isArchiveInProgress = false;
        this.archiveUrl = "#";
      }
    },
    options: {
      handler () {
        const page = this.options.page || 1
        const itemsPerPage = this.options.itemsPerPage || this.subject_quantity
        this.subject_start = (page - 1) * itemsPerPage
        this.subject_sort = this.options.sortBy || []
        this.subject_sort_desc = this.options.sortDesc || []
        this.refreshSubjects()
        console.log("OPTIONS", this.options)
      },
      deep: true
    },
    show_trashed: {
      handler () {
        this.refreshSubjects()
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
  methods: {
    ...mapActions('data', ['trashExistingSubject', 'restoreTrashedSubject']),
    refreshSubjects () {
      this.loadValidSubjects()
    },
    onClearSearch () {
      this.searchText = ''
    },
    handleSearch () {
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer)
      }
      this.subject_start = 0
      if ((this.options.page || 1) !== 1) {
        this.options = { ...this.options, page: 1 }
        return
      }
      this.loadValidSubjects()
    },
    loadSubjectSessions (subject_id) {
      this.session_loading = true
      let data = {
        start: this.session_start,
        quantity: this.session_quantity,
        subject_id: subject_id
      }
      let res = axios.post('/sessions/valid/', data).then(response => {
        this.valid_sessions = response.data.sessions
        this.session_total = response.data.total
        this.session_loading = false
      }).catch(error => {
        apiError(error)
        this.session_loading = false
      })

    },
    loadValidSubjects() {
      this.loading = true
      let data = {
        start: this.subject_start,
        quantity: this.subject_quantity,
        include_trashed: this.show_trashed,
        sort: this.subject_sort,
        sort_desc: this.subject_sort_desc,
        search: this.searchText.trim()
      }
      let res = axios.get('/subjects/', {
        params: data
      }).then(response => {
        this.valid_subjects = response.data.subjects.map(s => ({ ...s, isMenuOpen: false }))
        this.subject_total = response.data.total
        this.loading = false
      }).catch(error => {
        apiError(error)
        this.loading = false
      })
    },
    onSelect ({ item, value }) {
      if (item && value) {
        this.loadSubjectSessions(item.id)
          // this.loadExistingSessions({reroute: false, quantity: -1, subject_id: item.id})
      }
      this.selected = value ? item : null
    },
    onRowSessionClick (item, params) {
      console.log("LOG: " + item.id)
      this.clicks++;
      if (this.clicks === 1) {
        this.timer = setTimeout( () => {
          this.clicks = 0
        }, this.delay);
      } else {
         clearTimeout(this.timer);
         this.$router.push({ name: 'Session', params: { id: item.id }})
         this.clicks = 0;
      }
    },
    loadSession (item) {
      this.$router.push({ name: 'Session', params: { id: item.id } })
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
    onRowClick (item, params) {
      params.select(!params.isSelected)
    },
    itemClasses (item) {
      return item.trashed ? 'trashed' : '';
    },
    clickOutsideDialogSubjectHideMenu() {
      for (let t of this.valid_subjects) {
        t.isMenuOpen = false;
      }
      this.showSubjectMenuSheet = false;
      this.selectedSubjectForMenu = null;
      // Close dialogs when clicking outside
      this.remove_dialog = false;
      this.selectedSubjectForTrash = null;
      this.restore_dialog = false;
      this.selectedSubjectForRestore = null;
      this.remove_permanently_dialog = false;
      this.selectedSubjectForPermanentDelete = null;
      this.download_dialog = false;
      this.selectedSubjectForDownload = null;
    },
    openSubjectMenuSheet(item) {
      this.selectedSubjectForMenu = item;
      this.showSubjectMenuSheet = true;
    },
    closeMenuAndEdit(item) { item.isMenuOpen = false; this.editSubject(item); },
    closeMenuAndTrash(item) { item.isMenuOpen = false; this.selectedSubjectForTrash = item; this.remove_dialog = true; },
    closeMenuAndRestore(item) { item.isMenuOpen = false; this.selectedSubjectForRestore = item; this.restore_dialog = true; },
    closeMenuAndPermanentDelete(item) { item.isMenuOpen = false; this.selectedSubjectForPermanentDelete = item; this.remove_permanently_dialog = true; },
    closeMenuAndDownload(item) { item.isMenuOpen = false; this.selectedSubjectForDownload = item; this.download_dialog = true; },
    closeSheetAndEdit(item) { this.showSubjectMenuSheet = false; this.selectedSubjectForMenu = null; this.editSubject(item); },
    closeSheetAndTrash(item) { this.showSubjectMenuSheet = false; this.selectedSubjectForMenu = null; this.selectedSubjectForTrash = item; this.remove_dialog = true; },
    closeSheetAndRestore(item) { this.showSubjectMenuSheet = false; this.selectedSubjectForMenu = null; this.selectedSubjectForRestore = item; this.restore_dialog = true; },
    closeSheetAndPermanentDelete(item) { this.showSubjectMenuSheet = false; this.selectedSubjectForMenu = null; this.selectedSubjectForPermanentDelete = item; this.remove_permanently_dialog = true; },
    closeSheetAndDownload(item) { this.showSubjectMenuSheet = false; this.selectedSubjectForMenu = null; this.selectedSubjectForDownload = item; this.download_dialog = true; },
    async editSubject(subject) {
      this.$refs.dialogRef.edit_dialog = true;
      this.$refs.dialogRef.edited_subject = JSON.parse(JSON.stringify(subject));  // A trick to deep copy
      this.$refs.dialogRef.formErrors = {
          name: null,
          weight: null,
          height: null,
          birth_year: null,
          subject_tags: null,
      }
      console.log('edit subject', subject)
    },
    submitEditSubject (data) {
      console.log('submitEditSubject', data)
      this.loadValidSubjects()
    },
    async trashSubject (id) {
      try {
        await this.trashExistingSubject(id)
        this.loadValidSubjects()
      } catch (error) {
        apiError(error)
      }
    },
    async restoreSubject (id) {
      try {
        await this.restoreTrashedSubject(id)
        this.loadValidSubjects()
      } catch (error) {
        apiError(error)
      }
    },
    async downloadSubjectData (id) {
        this.downloading = true
        try {
            let link = document.createElement('a')
            link.setAttribute('href', `${axios.defaults.baseURL}/subjects/${id}/download/`)
            link.setAttribute('download', `subject_results_${id}.zip`)
            // This method works in all browsers including FireFox
            // console.log(link)
            link.dispatchEvent(new MouseEvent('click'))

            window.setTimeout(() => {
                this.downloading = false
            }, 5000)
        } catch (error) {
            apiError(error)
            this.downloading = false
        }
    },
    async downloadSubjectArchive(id){
      this.downloading = true;
      this.isArchiveInProgress = true;
      this.isArchiveDone = false;
      let state = this;
      const startArchiveDownloadUrl = new URL(`/subjects/${id}/async-download/`, axios.defaults.baseURL);
      await axios.get(startArchiveDownloadUrl).then(
        async function pollArchiveOnReady(data){
            const taskID = data.data.task_id;
            const downloadArchiveOnReadyURL = new URL(`/logs/${taskID}/on-ready/`, axios.defaults.baseURL);
            const response = await axios.get(downloadArchiveOnReadyURL);
            if(response.status === 202){
                setTimeout(function(){pollArchiveOnReady(data);}, 1000);
            }
            if(response.status === 200){
                clearTimeout(pollArchiveOnReady);
                state.archiveUrl = response.data.url;
                state.isArchiveInProgress = false;
                state.isArchiveDone = true;
            }
      });
    },
    async permanentRemoveSubject (id) {
      try {
        await axios.post('/subjects/' + id + '/permanent_remove/')
        this.loadValidSubjects()
      } catch (error) {
        apiError(error)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.subjects-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--app-bar-top-offset, 64px));
  height: calc(100dvh - var(--app-bar-top-offset, 64px));
  overflow: hidden;
  padding: 16px 8px;
  box-sizing: border-box;

  @media (max-width: 599px) {
    padding: 8px 4px;
  }

  @media (max-width: 959px) {
    overflow-y: auto;
  }
}

.subjects-toolbar {
  padding: 10px 8px 14px;
  gap: 8px;
  min-width: 0;
  flex: 0 0 auto;

  @media (max-width: 959px) {
    justify-content: center;
  }

  @media (max-width: 599px) {
    padding: 8px 6px 10px;
    gap: 6px;
    justify-content: flex-start;
    align-items: stretch;
  }
}

.subjects-toolbar__btn {
  margin: 0 !important;
  flex-shrink: 0;

  @media (max-width: 599px) {
    flex: 1 1 calc(50% - 3px);
    width: calc(50% - 3px);
    min-height: 44px;
  }
}

.subjects-toolbar__checkbox {
  height: 36px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin: 0 !important;

  @media (max-width: 599px) {
    flex: 1 1 100%;
    width: 100%;
    height: auto;
    min-height: 44px;
  }
}
.subjects-toolbar__checkbox ::v-deep .v-input {
  margin-top: 0;
  padding-top: 0;
}
.subjects-toolbar__checkbox ::v-deep .v-input__control {
  align-items: center;
}
.subjects-toolbar__checkbox ::v-deep .v-input__slot {
  margin-bottom: 0;
}

.subjects-search-section {
  ::v-deep .v-text-field input,
  ::v-deep .v-text-field .v-label {
    font-size: 0.8rem;
  }

  @media (max-width: 599px) {
    flex: 1 1 100% !important;
    max-width: 100%;
    margin-left: 0 !important;
    margin-top: 4px;
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
    }
  }
}

.subjects-submit-btn {
  width: 120px;
  min-width: 120px;
  padding-left: 14px;
  padding-right: 14px;
  white-space: nowrap;
}

.subjects-page-row {
  min-width: 0;
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 0;

  @media (max-width: 959px) {
    flex: 0 0 auto;
    min-height: auto;
  }
}
.subjects-table-col,
.sessions-table-col {
  min-width: 0;
  min-height: 0;
  display: flex;
}

.subjects-table,
.sessions-table {
  margin: 0 8px 16px 8px;
  max-width: 100%;
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;

  @media (max-width: 599px) {
    margin: 0 4px 8px 4px;
  }

  ::v-deep .v-data-table {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
  }

  ::v-deep .v-data-footer {
    flex: 0 0 auto;
    padding-bottom: max(8px, env(safe-area-inset-bottom, 0px));
  }

  ::v-deep .v-data-table__wrapper {
    flex: 1 1 auto;
    min-height: 0;
    overflow-x: auto;
    overflow-y: auto;
    max-width: 100%;
    -webkit-overflow-scrolling: touch;
  }

  ::v-deep .v-data-table__wrapper thead th {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  ::v-deep .v-data-table__wrapper thead th .v-data-table-header__content {
    white-space: nowrap;
  }

  // Style mobile table rows
  ::v-deep .v-data-table__mobile-table-row {
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);

    .v-data-table__mobile-row {
      padding: 12px 16px;

      &:first-child {
        font-weight: 600;
        padding-bottom: 4px;
      }

      &:not(:first-child) {
        padding-top: 4px;
        color: rgba(255, 255, 255, 0.87);
      }
    }
  }

  // Make table more compact on mobile
  @media (max-width: 599px) {
    ::v-deep .v-data-table {
      font-size: 0.875rem;
      width: 100%;
    }

    ::v-deep .v-data-footer {
      padding-bottom: max(8px, env(safe-area-inset-bottom, 0px));
      justify-content: center;
      padding-top: 8px;
      font-size: 0.78rem;
    }

    ::v-deep .v-data-table__wrapper {
      overflow-x: hidden !important;
      -webkit-overflow-scrolling: touch;
    }

    ::v-deep .v-data-table__wrapper table {
      min-width: 0 !important;
      width: 100% !important;
      table-layout: fixed;
    }

    ::v-deep .v-data-table__wrapper thead th {
      padding: 6px 4px !important;
      font-size: 0.72rem !important;
    }

    ::v-deep .v-data-table__wrapper tbody td {
      padding: 7px 4px !important;
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
  }
}

.subjects-table {
  ::v-deep .v-data-table__wrapper th:nth-child(1),
  ::v-deep .v-data-table__wrapper td:nth-child(1) {
    min-width: 300px;
    width: 300px;
  }

  ::v-deep .v-data-table__wrapper th:nth-child(5),
  ::v-deep .v-data-table__wrapper td:nth-child(5),
  ::v-deep .v-data-table__wrapper th:nth-child(6),
  ::v-deep .v-data-table__wrapper td:nth-child(6) {
    min-width: 90px;
    width: 90px;
    max-width: 90px;
  }

  @media (max-width: 599px) {
    ::v-deep .v-data-table__wrapper th:nth-child(1),
    ::v-deep .v-data-table__wrapper td:nth-child(1) {
      width: 38%;
      min-width: 0;
    }

    ::v-deep .v-data-table__wrapper th:nth-child(2),
    ::v-deep .v-data-table__wrapper td:nth-child(2) {
      width: 20%;
      min-width: 0;
    }

    ::v-deep .v-data-table__wrapper th:nth-child(3),
    ::v-deep .v-data-table__wrapper td:nth-child(3) {
      width: 20%;
      min-width: 0;
    }

    ::v-deep .v-data-table__wrapper th:nth-child(4),
    ::v-deep .v-data-table__wrapper td:nth-child(4) {
      width: 22%;
      min-width: 0;
    }
  }
}

.subject-name-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.subject-name-text {
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subject-name-actions {
  flex: 0 0 auto;
}

.subject-action-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.subject-action-btn {
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-name-cell {
  min-width: 0;
}

.session-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  min-width: 0;
}

.session-trials-preview {
  font-size: 0.72rem;
  opacity: 0.8;
  white-space: nowrap;
}

.copy-session-id-btn,
.action-btn {
  background-color: rgba(255, 255, 255, 0.1) !important;
  border-radius: 4px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2) !important;
  }
}

.session-controls-cell {
  display: flex;
  align-items: center;
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

.sessions-table {
  ::v-deep .v-data-table__wrapper th:nth-child(1),
  ::v-deep .v-data-table__wrapper td:nth-child(1) {
    min-width: 100px;
    width: 120px;
  }

  ::v-deep .v-data-table__wrapper th:nth-child(2),
  ::v-deep .v-data-table__wrapper td:nth-child(2) {
    min-width: 130px;
    width: 130px;
  }

  ::v-deep .v-data-table__wrapper th:nth-child(3),
  ::v-deep .v-data-table__wrapper td:nth-child(3) {
    min-width: 72px;
    width: 72px;
  }

  ::v-deep .v-data-table__wrapper th:nth-child(4),
  ::v-deep .v-data-table__wrapper td:nth-child(4) {
    min-width: 130px;
    width: 130px;
  }

  ::v-deep .v-data-table__wrapper th:nth-child(5),
  ::v-deep .v-data-table__wrapper td:nth-child(5) {
    min-width: 66px;
    width: 66px;
  }

  @media (max-width: 599px) {
    ::v-deep .v-data-table__wrapper th:nth-child(1),
    ::v-deep .v-data-table__wrapper td:nth-child(1) {
      width: 54%;
      min-width: 0;
    }

    ::v-deep .v-data-table__wrapper th:nth-child(2),
    ::v-deep .v-data-table__wrapper td:nth-child(2) {
      width: 31%;
      min-width: 0;
      white-space: nowrap;
    }

    ::v-deep .v-data-table__wrapper th:nth-child(3),
    ::v-deep .v-data-table__wrapper td:nth-child(3) {
      width: 15%;
      min-width: 0;
    }
  }
}

@media (max-width: 599px) {
  .session-id-preview--mobile {
    font-size: 0.72rem;
    max-width: 84px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .copy-session-id-btn--mobile {
    width: 24px;
    min-width: 24px;
    height: 24px;
  }
}
</style>

<style lang="scss">
.trashed {
  color: gray;
}

.subject-context-menu {
  max-width: min(320px, calc(100vw - 24px));
}

.subject-menu-sheet {
  padding-bottom: env(safe-area-inset-bottom, 0);
  background-color: #546E7A !important; /* blue-grey 700 - muted, modern */
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden;
}
.subject-menu-sheet .v-list {
  background-color: transparent !important;
}
.subject-menu-sheet .v-list-item {
  justify-content: center !important;
}
.subject-menu-sheet .v-list-item__content {
  flex: 0 0 auto !important;
  flex-direction: row !important;
}
</style>
