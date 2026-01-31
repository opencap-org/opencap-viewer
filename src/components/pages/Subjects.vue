<template>
  <div>
    <div class="d-flex flex-column">
    <div class="pa-2 d-flex flex-wrap align-center subjects-toolbar">
      <v-btn
        width="16em"
        class="subjects-toolbar__btn"
        @click="$router.push({ name: 'SelectSession' })">
        Go back to sessions list
      </v-btn>
      <v-btn
        class="ml-2 mt-1 mt-sm-0 subjects-toolbar__btn"
        @click="$refs.dialogRef.addSubject()">
        New Subject
      </v-btn>
      <v-checkbox
        v-model="show_trashed"
        class="ml-2 mt-0 mb-0 subjects-toolbar__checkbox"
        label="Show removed subjects"
        hide-details></v-checkbox>
    </div>
    </div>

    <v-row class="subjects-page-row">
      <v-col cols="12" md="8" class="subjects-table-col">

            <v-data-table
              :headers="headers"
              :items="valid_subjects"
              :options.sync="options"
              :item-class="itemClasses"
              :loading="loading"
              :server-items-length="subject_total"
              :footer-props="{
                showFirstLastPage: false,
                disableItemsPerPage: true,
                itemsPerPageOptions: [40]
              }"
              :height="$vuetify.breakpoint.smAndDown ? '50vh' : '70vh'"
              fixed-header
              single-select
              class="subjects-table mx-2 mb-4 flex-grow-1"
              @item-selected="onSelect"
              @click:row="onRowClick">
              <template v-slot:item.name="{ item }">
                <div class="float-right">
                  <template v-if="$vuetify.breakpoint.smAndDown">
                    <v-btn icon dark @click="openSubjectMenuSheet(item)">
                      <v-icon>mdi-menu</v-icon>
                    </v-btn>
                  </template>
                  <v-menu
                    v-else
                    v-model="item.isMenuOpen"
                    offset-y
                    right
                    close-on-content-click
                    content-class="subject-context-menu">
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn icon dark v-bind="attrs" v-on="on">
                        <v-icon>mdi-menu</v-icon>
                      </v-btn>
                    </template>
                    <v-list>
                      <v-list-item link v-if="!item.trashed" @click="closeMenuAndEdit(item)">
                        <v-list-item-title>Edit</v-list-item-title>
                      </v-list-item>
                      <v-list-item link v-show="!item.trashed" @click="closeMenuAndTrash(item)">
                        <v-list-item-title>Trash</v-list-item-title>
                      </v-list-item>
                      <v-list-item link v-show="item.trashed" @click="closeMenuAndRestore(item)">
                        <v-list-item-title>Restore</v-list-item-title>
                      </v-list-item>
                      <v-list-item link v-show="item.trashed" @click="closeMenuAndPermanentDelete(item)">
                        <v-list-item-title>Delete permanently</v-list-item-title>
                      </v-list-item>
                      <v-list-item link v-show="!item.trashed && isSyncDownloadAllowed" @click="closeMenuAndDownload(item)">
                        <v-list-item-title>Download data (old)</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </div>
                <div class="cursor-pointer mt-2">{{ item.name }}</div>
              </template>
            </v-data-table>


      </v-col>
      <v-col cols="12" md="4" class="sessions-table-col">

            <v-data-table
              v-if="selected"
              :headers="sessionHeaders"
              :items="valid_sessions"
              :options.sync="session_options"
              :item-class="itemClasses"
              :loading="session_loading"
              :server-items-length="session_total"
              :footer-props="{
                showFirstLastPage: false,
                disableItemsPerPage: true,
                itemsPerPageOptions: [40]
              }"
              fixed-header
              :height="$vuetify.breakpoint.smAndDown ? '50vh' : '80vh'"
              single-select
              class="sessions-table mx-2"
              @click:row="onRowSessionClick">
            <template v-slot:default>
                <tr>
                  <th class="text-left">
                    Session ID
                  </th>
                  <th class="text-left">
                    Session Name
                  </th>
                  <th class="text-left">
                    Trials
                  </th>
                  <th class="text-left">
                    Date
                  </th>
                </tr>
            </template>
        </v-data-table>
      </v-col>
    </v-row>

    <!-- Subject menu bottom sheet (mobile) -->
    <v-bottom-sheet
      v-model="showSubjectMenuSheet"
      @input="val => !val && (selectedSubjectForMenu = null)">
      <v-sheet class="text-center subject-menu-sheet">
        <v-list v-if="selectedSubjectForMenu">
          <v-list-item link v-if="!selectedSubjectForMenu.trashed" @click="closeSheetAndEdit(selectedSubjectForMenu)">
            <v-list-item-title>Edit</v-list-item-title>
          </v-list-item>
          <v-list-item link v-show="!selectedSubjectForMenu.trashed" @click="closeSheetAndTrash(selectedSubjectForMenu)">
            <v-list-item-title>Trash</v-list-item-title>
          </v-list-item>
          <v-list-item link v-show="selectedSubjectForMenu.trashed" @click="closeSheetAndRestore(selectedSubjectForMenu)">
            <v-list-item-title>Restore</v-list-item-title>
          </v-list-item>
          <v-list-item link v-show="selectedSubjectForMenu.trashed" @click="closeSheetAndPermanentDelete(selectedSubjectForMenu)">
            <v-list-item-title>Delete permanently</v-list-item-title>
          </v-list-item>
          <v-list-item link v-show="!selectedSubjectForMenu.trashed && isSyncDownloadAllowed" @click="closeSheetAndDownload(selectedSubjectForMenu)">
            <v-list-item-title>Download data (old)</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-sheet>
    </v-bottom-sheet>

    <!-- Trash Subject Dialog -->
    <v-dialog v-model="remove_dialog" v-click-outside="clickOutsideDialogSubjectHideMenu" max-width="500" :fullscreen="$vuetify.breakpoint.smAndDown" persistent>
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
    <v-dialog v-model="restore_dialog" v-click-outside="clickOutsideDialogSubjectHideMenu" max-width="500" :fullscreen="$vuetify.breakpoint.smAndDown" persistent>
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
    <v-dialog v-model="remove_permanently_dialog" v-click-outside="clickOutsideDialogSubjectHideMenu" max-width="500" :fullscreen="$vuetify.breakpoint.smAndDown" persistent>
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
    <v-dialog v-model="download_dialog" v-click-outside="clickOutsideDialogSubjectHideMenu" max-width="500" :fullscreen="$vuetify.breakpoint.smAndDown" persistent>
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
        { text: 'Sex', value: 'sex_display' },
        { text: 'Gender', value: 'gender_display' },
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
        { text: 'Session ID', value: 'id' },
        { text: 'Session Name', value: 'sessionName' },
        { text: 'Trials', value: 'trials_count' },
        { text: 'Date', value: 'created_at' },
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
        this.subject_start = (this.options.page - 1) * this.options.itemsPerPage
        this.subject_sort = this.options.sortBy
        this.subject_sort_desc = this.options.sortDesc
        this.loadValidSubjects()
        console.log("OPTIONS", this.options)
      },
      deep: true
    },
    show_trashed: {
      handler () {
        this.loadValidSubjects()
      },
      deep: true
    },
  },
  methods: {
    ...mapActions('data', ['trashExistingSubject', 'restoreTrashedSubject']),
    loadSubjectSessions (subject_id) {
      this.sessions_loading = true
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
        sort_desc: this.subject_sort_desc
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
    onRowClick (item, params) {
      params.select(!params.isSelected)
    },
    itemClasses (item) {
      return item.trashed ? 'trashed' : '';
    },
    clickOutsideDialogSubjectHideMenu(e) {
      if (e.target.className === 'v-overlay__scrim') {
        for (let t of this.valid_subjects) {
          t.isMenuOpen = false;
        }
        this.showSubjectMenuSheet = false;
        this.selectedSubjectForMenu = null;
      }
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
.subjects-toolbar {
  min-width: 0;

  @media (max-width: 959px) {
    justify-content: center;
  }
}
.subjects-toolbar__checkbox {
  flex-shrink: 0;
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

.subjects-page-row {
  min-width: 0;
}
.subjects-table-col,
.sessions-table-col {
  min-width: 0;
}

.subjects-table,
.sessions-table {
  max-width: 100%;
  min-width: 0;

  ::v-deep .v-data-table__wrapper {
    overflow-x: auto;
    max-width: 100%;
    -webkit-overflow-scrolling: touch;
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
    }

    ::v-deep .v-data-table__wrapper {
      -webkit-overflow-scrolling: touch;
    }
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
}
</style>
