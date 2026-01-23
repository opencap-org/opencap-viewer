<template>
    <div class="step-5 d-flex">
        <div class="left d-flex flex-column pa-2">
  
            <ValidationObserver tag="div" class="d-flex flex-column" ref="observer" v-slot="{ invalid }">
  
                <ValidationProvider rules="required|alpha_dash_custom" v-slot="{ errors }" name="Trial name">
  
                    <v-text-field v-show="show_controls" v-model="trialName" label="Trial name" class="flex-grow-0"
                        :disabled="state !== 'ready'" dark :error="errors.length > 0" :error-messages="errors[0]" />
                </ValidationProvider>
  
                  <v-btn class="mb-4 w-100" v-show="show_controls" :disabled="busy || invalid" @click="changeState">
                      {{ buttonCaption }}
                  </v-btn>
                  <p v-if="state === 'recording'">{{ n_cameras_connected }} devices are recording, do not refresh</p>
                  <p v-if="state === 'processing'">{{ n_videos_uploaded  }} of {{ n_cameras_connected }} videos uploaded, do not refresh.</p>
              </ValidationObserver>
  
              <div class="trials flex-grow-1">
                  <div v-for="(t, index) in filteredTrialsWithMenu"
                      v-bind:item="t"
                      v-bind:index="index"
                      v-bind:key="t.id"
                      :ref="t.id"
                      class="my-1 trial d-flex justify-content-between"
                      :class="{ selected: isSelected(t) }">
                      <Status :value="t" :class="trialClasses(t)" @click="loadTrial(t)" />
                      <div class="">
                        <v-menu
                            v-model="t.isMenuOpen"
                            offset-y
                          >
                          <template v-slot:activator="{ on, attrs }">
                            <v-btn
                                icon
                              dark
                              v-bind="attrs"
                              v-on="on"
                            >
                              <v-icon>mdi-menu</v-icon>
                            </v-btn>
                          </template>
                          <v-list>
                            <v-list-item link v-if="t.name !== 'neutral'" @click="renameTrialDialog(t)">
                              <v-list-item-title>Rename</v-list-item-title>
                            </v-list-item>
                            <v-list-item link v-if="!t.trashed && t.name !== 'neutral'" @click="analysisDialog(t)">
                              <v-list-item-title>Analysis</v-list-item-title>
                            </v-list-item>
  
                            <v-list-item link @click="addTagTrialDialog(t)">
                              <v-list-item-title>Edit Tags</v-list-item-title>
                            </v-list-item>

                              <v-dialog
                                      v-model="remove_dialog"
                                      v-click-outside="clickOutsideDialogTrialHideMenu"
                                      max-width="500">
                                <template v-slot:activator="{ on }">
                                  <v-list-item link v-show="!t.trashed" v-on="on">
                                    <v-list-item-title>Trash</v-list-item-title>
                                  </v-list-item>
                                </template>
                                <v-card>
                                  <v-card-text class="pt-4">
                                    <v-row class="m-0">
                                      <v-col cols="2">
                                        <v-icon x-large color="red">mdi-close-circle</v-icon>
                                      </v-col>
                                      <v-col cols="10">
                                        <p>
                                          Do you want to trash trial {{t.name}}?
                                          You will be able to restore it for 30 days. After that,
                                          this trial will be permanently removed.
                                        </p>
                                      </v-col>
                                    </v-row>
                                  </v-card-text>
                                  <v-card-actions>
                                    <v-spacer></v-spacer>
                                    <v-btn
                                      color="blue darken-1"
                                      text
                                      @click="t.isMenuOpen = false; remove_dialog = false"
                                    >
                                      No
                                    </v-btn>
                                    <v-btn
                                      color="red darken-1"
                                      text
                                      @click="t.isMenuOpen = false; remove_dialog = false; trashTrial(t)"
                                    >
                                      Yes
                                    </v-btn>
                                  </v-card-actions>
                                </v-card>
                              </v-dialog>
  
                              <v-dialog
                                      v-model="restore_dialog"
                                      v-click-outside="clickOutsideDialogTrialHideMenu"
                                      max-width="500">
                                <template v-slot:activator="{ on }">
                                  <v-list-item link v-show="t.trashed" v-on="on">
                                    <v-list-item-title>Restore</v-list-item-title>
                                  </v-list-item>
                                </template>
                                <v-card>
                                  <v-card-text class="pt-4">
                                    <v-row class="m-0">
                                      <v-col cols="2">
                                        <v-icon x-large color="green">mdi-undo-variant</v-icon>
                                      </v-col>
                                      <v-col cols="10">
                                        <p>
                                          Do you want to restore trial {{t.name}}?
                                        </p>
                                      </v-col>
                                    </v-row>
                                  </v-card-text>
                                  <v-card-actions>
                                    <v-spacer></v-spacer>
                                    <v-btn
                                      color="blue darken-1"
                                      text
                                      @click="t.isMenuOpen = false; restore_dialog = false"
                                    >
                                      No
                                    </v-btn>
                                    <v-btn
                                      color="green darken-1"
                                      text
                                      @click="t.isMenuOpen = false; restore_dialog = false; restoreTrial(t)"
                                    >
                                      Yes
                                    </v-btn>
                                  </v-card-actions>
                                </v-card>
                              </v-dialog>
  
                              <v-dialog
                                      v-model="permanent_delete_dialog"
                                      v-click-outside="clickOutsideDialogTrialHideMenu"
                                      max-width="500">
                                <template v-slot:activator="{ on }">
                                  <v-list-item link v-show="!t.trashed" v-on="on">
                                    <v-list-item-title >Delete</v-list-item-title>
                                  </v-list-item>
                                </template>
                                <v-card>
                                  <v-card-text class="pt-4">
                                    <v-row class="m-0">
                                      <v-col cols="2">
                                        <v-icon x-large color="red">mdi-close-circle</v-icon>
                                      </v-col>
                                      <v-col cols="10">
                                        <p>
                                          Do you want to permanently delete trial {{t.name}}?
                                          This action cannot be undone. Use Trash to keep the ability to restore the trial.
                                        </p>
                                      </v-col>
                                    </v-row>
                                  </v-card-text>
                                  <v-card-actions>
                                    <v-spacer></v-spacer>
                                    <v-btn
                                      color="blue darken-1"
                                      text
                                      @click="t.isMenuOpen = false; permanent_delete_dialog = false"
                                    >
                                      No
                                    </v-btn>
                                    <v-btn
                                      color="red darken-1"
                                      text
                                      @click="t.isMenuOpen = false; permanent_delete_dialog = false; permanentDeleteTrial(t)"
                                    >
                                      Yes
                                    </v-btn>
                                  </v-card-actions>
                                </v-card>
                              </v-dialog>
  
                          </v-list>
                        </v-menu>
                      </div>
  
  
                  </div>
              </div>
  
              <v-btn class="mt-4 w-100" @click="toggleSessionMenuButtons()">
                  <v-icon v-if="showSessionMenuButtons">mdi-menu-down</v-icon>
                  <v-icon v-else>mdi-menu-up</v-icon>
              </v-btn>
              <div v-if="showSessionMenuButtons">
                  <div>
                      <v-checkbox v-model="show_trashed" class="ml-2 m-2" label="Show removed trials"></v-checkbox>
                  </div>
  
                  <v-btn small class="w-100" v-show="show_controls" :disabled="busy || state !== 'ready'"
                      @click="newSessionSameSetup">New session, same setup
                  </v-btn>
  
                  <v-btn small class="mt-4 w-100" v-show="show_controls" :disabled="busy || state !== 'ready'" @click="newSession">New
                      session
                  </v-btn>
  
                  <v-dialog v-model="dialog" width="500">
                      <template v-slot:activator="{ on, attrs }">
                          <v-btn small class="mt-4 w-100" v-bind="attrs" v-on="on" v-show="show_controls">Share session publicly</v-btn>
                      </template>
  
                      <v-card>
                          <v-card-title class="text-h5">
                              Share session publicly
                          </v-card-title>
  
                          <v-card-text>
                              <v-checkbox id="session-public" v-model="session.public" name="session-public"
                                  label="Make session public" @change="setPublic($event)" />
  
                              <p>Making your session public will make your analyses public too.</p>
  
  
                              <v-container v-show="session.public">
                                  <h3 class="mb-2">Share on</h3>
                                  <ShareNetwork network="facebook" class="mr-2" style="text-decoration: none;"
                                      :url="sessionUrl" title="OpenCap session">
                                      <v-btn><v-icon aria-hidden="false">mdi-facebook</v-icon> &nbsp;Facebook</v-btn>
                                  </ShareNetwork>
                                  <ShareNetwork network="twitter" class="mr-2" style="text-decoration: none;"
                                      :url="sessionUrl" title="OpenCap session">
                                      <v-btn><v-icon aria-hidden="false">mdi-twitter</v-icon> &nbsp;Twitter</v-btn>
                                  </ShareNetwork>
                                  <ShareNetwork network="linkedin" :url="sessionUrl" style="text-decoration: none;"
                                      title="OpenCap session">
                                      <v-btn><v-icon aria-hidden="false">mdi-linkedin</v-icon> &nbsp;LinkedIn</v-btn>
                                  </ShareNetwork>
  
                                  <v-text-field label="Alternatively, copy this link"
                                      v-model="sessionUrl" class="mt-5" readonly></v-text-field>
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
  
  
                  <!-- Archive session -->
                  <v-btn small class="mt-4 w-100" @click="showArchiveDialog = true">
                      Download data
                  </v-btn>
                  <v-dialog
                      v-model="showArchiveDialog"
                      max-width="500">
                      <v-card>
                          <v-card-text class="pt-4">
                              <v-row class="m-0">
                              <v-col cols="2">
                                  <v-icon x-large color="green">mdi-download</v-icon>
                              </v-col>
                              <v-col cols="10">
                                  <p v-if="isArchiveInProgress & !isArchiveDone">
                                      <v-progress-circular  indeterminate class="mr-2" color="grey" size="14" width="2" />
                                      Download in progress
                                  </p>
                                  <p v-if="!(isArchiveInProgress || isArchiveDone)">
                                      Do you want to download all the data from session <code>{{session.id}}</code>?
                                      (This can take several minutes).
                                  </p>
                                  <p v-if="isArchiveDone">
                                      The archive has been successfully generated. Click on data.zip to download.
                                  </p>
                              </v-col>
                              </v-row>
                          </v-card-text>
                          <v-card-actions>
                              <v-spacer></v-spacer>
                              <v-btn
                                  color="blue darken-1"
                                  text
                                  @click="showArchiveDialog = false;"
                              >
                                  Cancel
                              </v-btn>
                              <v-btn
                                  v-if="isArchiveDone"
                                  :href="archiveUrl"
                                  download="data.zip"
                              >
                                  data.zip
                              </v-btn>
                              <v-btn
                                  v-else
                                  color="green darken-1"
                                  text
                                  :disabled="isArchiveInProgress"
                                  @click="downloadSessionArchive(session.id)"
                              >
                                  Download
                              </v-btn>
                          </v-card-actions>
                      </v-card>
                  </v-dialog>
                  <!-- End archive session -->
  
                  <v-btn small v-if="isSyncDownloadAllowed" class="mt-4 w-100" :disabled="downloading" @click="onDownloadData">
                      <v-progress-circular v-if="downloading" indeterminate class="mr-2" color="grey" size="14" width="2" />
                      Download data (old)
                  </v-btn>
  
                  <v-btn small class="mt-4 w-100" @click="$router.push({ name: 'Dashboard', params: { id: session.id, trialId: trial.name  } })">
                      Dashboard kinematics
                  </v-btn>
  
                  <v-btn small class="mt-4 w-100" v-show="show_controls" @click="$router.push({ name: 'SelectSession'})"
                      :disabled="busy || state !== 'ready'">
                      Back to session list
                  </v-btn>
              </div>
          </div>
  
        <div class="viewer flex-grow-1">
            <div v-if="trial" class="d-flex flex-column h-100">
  
                <div id="mocap" ref="mocap" class="flex-grow-1" />
  
  
                  <div v-if="!videoControlsDisabled" style="display: flex; flex-wrap: wrap; align-items: center;">
                      <v-text-field label="Time (s)" type="number" :step="0.01" :value="time"
                          :disabled="state !== 'ready'" dark style="flex: 0.1; margin-right: 5px;" @input="onChangeTime"/>
                      <v-slider :value="frame" :min="0" :max="frames.length - 1" @input="onNavigate" hide-details
                          class="mb-2" style="flex: 1;" />
                  </div>
              </div>
  
            <div v-else-if="trialLoading" class="flex-grow-1 d-flex align-center justify-center">
                <v-progress-circular indeterminate color="grey" size="30" width="4" />
            </div>
        </div>
  
        <div class="right d-flex flex-column">
            <div class="videos flex-grow-1 d-flex flex-column">
              <video v-for="(video, index) in videos" :key="`video-${index}`" :ref="`video-${index}`" muted
                  playsinline :src="video.media" crossorigin="anonymous" @ended="onVideoEnded(index)" />
            </div>
  
            <SpeedControl v-model="playSpeed" />
  
              <VideoNavigation :playing="playing" :value="frame" :maxFrame="frames.length - 1"
                  :disabled="videoControlsDisabled" @play="togglePlay(true)" @pause="togglePlay(false)"
                  @input="onNavigate" class="mb-2" />
          </div>
  
        <v-dialog
              v-model="trial_rename_dialog"
              max-width="500">
          <v-card>
            <v-card-text class="pt-4">
              <v-row class="m-0">
                <v-col cols="2">
                  <v-icon x-large color="orange">mdi-rename-box</v-icon>
                </v-col>
                <v-col cols="10">
                  <p v-if="session.trials[trial_rename_index]?.status === 'processing' || session.trials[trial_rename_index]?.status === 'uploading'" class="text-orange">
                      You can't rename a trial while it's being uploaded or processed. Please wait before attempting to rename the trial.
                  </p>
                  <p v-else>
                    Insert a new name for trial {{session.trials[trial_rename_index]?.name}}:
                  </p>
                  <ValidationObserver tag="div" class="d-flex flex-column" ref="observer_tr" v-slot="{ invalid }">
                    <ValidationProvider :rules="{required:true, alpha_dash_custom:true, unique_trial_name:[session.trials, session.trials[trial_rename_index]?.name]}" v-slot="{ errors }" name="Trial name">
  
                        <v-text-field v-model="trialNewName" label="Trial new name" class="flex-grow-0"
                            :disabled="state !== 'ready' || session.trials[trial_rename_index]?.status === 'processing' || session.trials[trial_rename_index]?.status === 'uploading'"
                                      dark
                                      :error="errors.length > 0" :error-messages="errors[0]" />
                    </ValidationProvider>
  
                    <v-spacer></v-spacer>
  
                    <v-btn class="text-right" :disabled="invalid || session.trials[trial_rename_index]?.status === 'processing' || session.trials[trial_rename_index]?.status === 'uploading'"
                           @click="trial_rename_dialog = false; renameTrial(session.trials[trial_rename_index], trial_rename_index, trialNewName);">
                        Rename Trial
                    </v-btn>
                  </ValidationObserver>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-dialog>

              <v-dialog
            v-model="trial_modify_tags"
            max-width="500">
        <v-card>
          <v-card-text class="pt-4">
            <v-row class="m-0">
              <v-col cols="2">
                <v-icon x-large color="orange">mdi-rename-box</v-icon>
              </v-col>
              <v-col cols="10">
                <p v-if="session.trials[trial_modify_tags_index]?.status === 'processing' || session.trials[trial_modify_tags_index]?.status === 'uploading'" class="text-orange">
                    You can't modify trial tags while it's being uploaded or processed. Please wait before attempting to modify the tags.
                </p>
                <p v-else>
                  Insert the tags for trial {{session.trials[trial_modify_tags_index]?.name}}:
                </p>
                <ValidationObserver tag="div" class="d-flex flex-column" ref="observer_tr_tag">
                  <ValidationProvider v-slot="{ errors }" name="Trial tags">
                  <v-autocomplete
                      ref="trialTagsSelect"
                      clearable
                      multiple
                      v-model="trialNewTags"
                      item-title="text"
                      item-value="value"
                      label="Trial Tags"
                      :items="tagsOptions"
                      :error="errors.length > 0"
                      :error-messages="errors[0]"
                      :search-input.sync="tag_search_input"
                      @change="tag_search_input = ''"
                  ></v-autocomplete>
                  </ValidationProvider>
                  <v-spacer></v-spacer>
                  <v-btn class="text-right" :disabled="trialNewTags.length === 0"
                         @click="trial_modify_tags = false; modifyTagsTrial(session.trials[trial_modify_tags_index], trial_modify_tags_index, trialNewTags);">
                      Apply Tags
                  </v-btn>
                </ValidationObserver>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-dialog>
  
    <v-dialog
        v-model="showAnalysisDialog"
        v-click-outside="clickOutsideDialogTrialHideMenu"
        max-width="800">
      <v-card>
          <v-card-title>Advanced Analysis</v-card-title>
          <v-card-text v-if="analysisFunctions.length > 0">
  
              <v-row v-for="(func, index) in analysisFunctionsWithMenu"
                      v-bind:item="func"
                      v-bind:index="index"
                      v-bind:key="func.id"
                      :ref="func.id">
                  <v-col cols="3">
                    {{ func.title }}
  
                    <v-tooltip bottom v-if="func.info.length > 0">
                      <template v-slot:activator="{ on }">
                        <v-icon v-on="on"> mdi-help-circle-outline </v-icon>
                      </template>
                      <p v-html="func.info.replace(/\n/g, '<br>')" />
                    </v-tooltip>
  
                  </v-col>
                  <v-col cols="5">{{ func.description }}</v-col>
                  <v-col cols="4">
                    <v-btn small v-if="func.trials.includes(session.trials[trial_analysis_index].id)" :disabled="session.trials[trial_analysis_index].id in func.trials">
                        <span >
                            <v-progress-circular  indeterminate class="mr-2" color="grey" size="14" width="2" />
                            Calculating...
                        </span>
                    </v-btn>
  
                    <v-btn
                        small
                        v-if="!func.trials.includes(session.trials[trial_analysis_index].id) && !(session.trials[trial_analysis_index].id in func.states)"
                        @click="invokeAnalysisFunction(func.id, session.trials[trial_analysis_index].id, session.trials[trial_analysis_index]?.name)"
                        >
                        Run
                    </v-btn>
                      <v-btn small v-if="(session.trials[trial_analysis_index].id in func.states) && !func.trials.includes(session.trials[trial_analysis_index].id)">
                          <span :style="func.states[session.trials[trial_analysis_index].id].state == 'failed'? 'color:red' : 'color:green'">{{ func.states[session.trials[trial_analysis_index].id].state }}</span>
                          <v-menu offset-y>
                              <template v-slot:activator="{ on, attrs }">
                              <v-btn icon dark v-bind="attrs" v-on="on" >
                                  <v-icon>mdi-menu</v-icon>
                              </v-btn>
                              </template>
  
                              <v-list>
                                  <v-list-item link
                                      @click="invokeAnalysisFunction(func.id, session.trials[trial_analysis_index].id, session.trials[trial_analysis_index]?.name)"
                                      :disabled="trial_analysis_index in func.trials">
                                      Re-run
                                  </v-list-item>
                                  <v-list-item
                                      @click="goToAnalysisDashboard(func.states[session.trials[trial_analysis_index].id].dashboard_id, session.trials[trial_analysis_index].id)"
                                      v-if="func.states[session.trials[trial_analysis_index].id].dashboard_id != null && func.states[session.trials[trial_analysis_index].id].state == 'successfull'"
                                      >Analysis Dashboard</v-list-item>
                                   <v-list-item
                                     v-for="menu_item in func.states[session.trials[trial_analysis_index].id].menu"
                                     @click="requestDownloadMenuItem(session.trials[trial_analysis_index], menu_item)" :key="menu_item.label"
                                      >{{ menu_item.label }}</v-list-item>
                              </v-list>
  
                          </v-menu>
                      </v-btn>
  
                  </v-col>
              </v-row>
          </v-card-text>
          <v-card-text v-else>
              <p>Sorry, there are no available functions.</p>
          </v-card-text>
          <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
          color="blue darken-1"
          text
          v-if="analysisFunctions.length > 0"
        >
          Reset results
        </v-btn>
        <v-btn
          color="red darken-1"
          text
          @click="session.trials[trial_analysis_index].isMenuOpen = false; showAnalysisDialog = false;"
        >
          Close
        </v-btn>
          </v-card-actions>
      </v-card>
      </v-dialog>
      </div>
  </template>
  
  <script>
  import moment from 'moment'
  import Vue from 'vue'
  import momentDurationFormatSetup from 'moment-duration-format'
  import axios from 'axios'
  import { mapState, mapMutations, mapActions } from 'vuex'
  import { apiError, apiErrorRes, apiSuccess } from '@/util/ErrorMessage.js'
  import { playRecordingSound, playRecordingFinishedSound } from "@/util/SoundMessage.js";
  import Status from '@/components/ui/Status'
  import * as THREE from 'three'
  import * as THREE_OC from '@/orbitControls'
  import VideoNavigation from '@/components/ui/VideoNavigation'
  import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
  import SpeedControl from '@/components/ui/SpeedControl'
  
  let openpose_bones = [
    [20, 21],
    [20, 22],
    [21, 43],
    [22, 44],
    [43, 47],
    [44, 48],
    [20, 25],
    [20, 26],
  
    //    [25, 23],
    //    [26, 24],
  
    [25, 29],
    [26, 30],
    [29, 33],
    [30, 34],
    [33, 37],
    [34, 38],
  ]
  
  var a0 = 0;
  var a1 = 1;
  var a2 = 2;
  
  const objLoader = new OBJLoader();
  
  export default {
      name: 'Session',
      components: {
          Status,
          VideoNavigation,
          SpeedControl
      },
      data() {
          return {
              startButtonCaptions: {
                  ready: 'Start recording',
                  recording: 'Stop recording',
                  processing: 'Cancel Upload'
              },
  
              rename_dialog: false,
              remove_dialog: false,
              restore_dialog: false,
              permanent_delete_dialog: false,
              show_trashed: false,
              menu: [],
              busy: false,
              state: 'ready',
              submitted: false,
              trialName: '',
              trialNewName: '',
              trialTags: [],
              trialNewTags: [],
              statusPoll: null,
              downloading: false,
              dialog: null,

              tag_search_input: '',
  
              showArchiveDialog: false,
              isArchiveInProgress: false,
              isArchiveDone: false,
              archiveUrl: "#",
  
              showAnalysisDialog: false,
              showAnalysisResultDialog: false,
              trial_analysis_index: 0,
              // isInvokeInProgress: false,
              // isInvokeDone: false,
              // analysisResult: {analysis_function: {}, result: { meta: {}}},
              // invokedFunctionId: null,
              // invokedAnalysisFunctionTrialName: null,
              // shownAnalysisDialogTrialName: null,
  
              trialInProcess: null,
              trial: null,
              videos: [],
              frames: [],
              trialLoading: false,
  
              // objects & arrays
              synced: false,
              camera: null,
              scene: null,
              renderer: null,
              controls: null,
              pose_spheres: [],
              pose_bones: [],
              meshes: {},
              frame: 0,
              time: 0,
              playing: false,
              playSpeed: 1,
  
              show_controls: 1,
  
              resizeObserver: null,
  
              recordingStarted: null,
              recordingTimePassed: 0,
              recordingTimer: null,
  
              trialsPoll: null,
              showSessionMenuButtons: true,
  
              n_calibrated_cameras: 0,
              n_cameras_connected: 0,
              n_videos_uploaded: 0,
  
              trial_rename_dialog: false,
              trial_rename_index: 0,

              trial_modify_tags: false,
              trial_modify_tags_index: 0,

              isAuditoryFeedbackEnabled: false,
          }
      },
      filters: {
          nl2br: function (value) {
              return value.replace(/\n/g, '<br>')
          }
      },
      computed: {
          ...mapState({
            session: state => state.data.session,
            sessions: state => state.data.sessions,
            analysisFunctions: state => state.data.analysisFunctions,

            trialTagsList: state => state.data.trialTags,

            user_id: state => state.auth.user_id,
  
            // step Calibration data
            rows: state => state.data.rows,
            cols: state => state.data.cols,
            squareSize: state => state.data.squareSize,
            placement: state => state.data.placement,
  
            // step Neutral data
            identifier: state => state.data.identifier,
            weight: state => state.data.weight,
            height: state => state.data.height,
            gender: state => state.data.gender,
            isSyncDownloadAllowed: state => state.data.isSyncDownloadAllowed
          }),
        sessionUrl() {
          return location.origin + "/session/" + this.session.id;
        },
        analysisFunctionsWithMenu() {
          return this.analysisFunctions.map((func) => ({...func, isMenuOpen: false}))
        },
        filteredTrialsWithMenu() {
          return this.filteredTrials.map(trial => ({...trial, isMenuOpen: false}));
        },
        filteredTrials() {
          return this.session.trials.filter(trial => trial.name !== 'calibration' && !(trial.name === 'neutral' && trial.status === 'error')).filter(t => this.show_trashed || !t.trashed)
        },
        videoControlsDisabled() {
          return !this.trial || this.frames.length === 0
        },
        buttonCaption() {
          switch (this.state) {
            case 'recording': {
              const time = moment
                  .duration(this.recordingTimePassed, 'seconds')
                  .format('*mm:ss')
              return `${this.startButtonCaptions[this.state]} ${time}`
            }
            default: {
              return this.startButtonCaptions[this.state]
            }
          }
        },
        tagsOptions () {
            return Object.entries(this.trialTagsList).map((s) => ({ text: s[1], value: s[0] }))
        },
      },
    async mounted() {
      await this.loadSession(this.$route.params.id)

      this.loadTrialTags()

      // Check if something went wrong with loading session. Usually there was a redirect to Login page.
      if (this.session.id == undefined) {
        return
      }
      // Get number of expected cameras.
      const res = await axios.get(`/sessions/${this.session.id}/get_n_calibrated_cameras/`, {})
      this.n_calibrated_cameras = res.data.data
  
      if (this.user_id == this.session.user) {
        this.show_controls = true
        this.showSessionMenuButtons = true
  
        await this.loadAnalysisFunctions()
        await this.loadAnalysisFunctionsPending()
        await this.loadAnalysisFunctionsStates()
        await this.analysisFunctionsPolls()
      } else {
        this.show_controls = false
        this.showSessionMenuButtons = false
      }
  
      console.log(this.user_id)
      console.log(this.session.user)
  
      this.startTrialsPoll()
  
      const doneTrials = this.filteredTrials.filter(trial => trial.status === 'done')
  
      if (doneTrials.length > 0) {
        console.log("Done trials:")
        console.log(doneTrials[0])
        this.loadTrial(doneTrials[0])
      }

      // Add keyboard event listener
      window.addEventListener('keydown', this.handleKeyboard)
    },
    beforeDestroy() {
      this.cancelPoll()
      this.cancelRecordTimer()
      this.cancelTrialsPoll()
  
      if (this.resizeObserver) {
        this.resizeObserver.unobserve(this.$refs.mocap)
      }

      // Remove keyboard event listener
      window.removeEventListener('keydown', this.handleKeyboard)
    },
    watch: {
      trial() {
        if (this.trial) {
          this.$nextTick(() => {
            this.resizeObserver = new ResizeObserver(this.onResize)
            this.resizeObserver.observe(this.$refs.mocap)
          })
        } else {
          this.resizeObserver.unobserve(this.$refs.mocap)
        }
      },
      playSpeed() {
        this.eachVideo(videoElement => {
          videoElement.playbackRate = this.playSpeed
        })
      },
      showArchiveDialog(newShowArchiveDialog, oldShowArchiveDialog) {
        if (!newShowArchiveDialog) {
          this.isArchiveDone = false;
          this.isArchiveInProgress = false;
          this.archiveUrl = "#";
        }
      },
      // showAnalysisDialog(newShowAnalysisDialog, oldShowAnalysisDialog){
      //     console.log(newShowAnalysisDialog);
      //     // if(!newShowAnalysisDialog){
      //     //     this.shownAnalysisDialogTrialName = null;
      //     //     if(!this.isInvokeInProgress){
      //     //         this.isInvokeDone = false;
      //     //         this.analysisResult = {analysis_function: {}, response: {}};
      //     //         this.invokedFunctionId = null;
      //     //     }
      //     // }
      // }
    },
    created() {
      // Load the initial value from localStorage
      const storedValue = localStorage.getItem("auditory_feedback");
      this.isAuditoryFeedbackEnabled = storedValue === "true";
    },
    methods: {
      ...mapMutations('data', [
        'setSessionStep5',
        'clearAll',
        'setSessionId',
        'addTrial',
        'updateTrial',
        'setAnalysisFunctionTrial',
        'setAnalysisFunctionResult',
        'setAnalysisFunctionState',
        'removeAnalysisFunctionTrial',
        'resetAnalysisFunctionResult'
      ]),
      ...mapActions('data', [
        'loadSession',
        'initSessionSameSetup',
        'loadAnalysisFunctions', 'loadAnalysisFunctionsPending', 'loadAnalysisFunctionsStates', 'loadTrialTags']),
      async changeState() {
        switch (this.state) {
          case 'ready': {
            this.submitted = true
  
            if (await this.$refs.observer.validate()) {
              this.busy = true
  
              try {
                // store in vuex
                this.setSessionStep5(this.trialName)
  
                // api
                const res = await axios.get(`/sessions/${this.session.id}/record/`, {
                  params: {
                    name: this.trialName
                  }
                })
  
                // add to the list
                this.trialInProcess = res.data
                this.addTrial(this.trialInProcess)

                // Get n_cameras_connected.
                const res_status = await axios.get(`/sessions/${this.session.id}/status/`, {})
                this.n_videos_uploaded = res_status.data.n_videos_uploaded
                this.n_cameras_connected = res_status.data.n_cameras_connected

                // If no calibrated cameras...
                if (this.n_calibrated_cameras === 0)
                  throw new Error("There are no calibrated cameras for this trial.");

                // Transition to recording state
                this.state = 'recording';

                // Check if the appropriate number of cameras is connected.
                const startTime = Date.now();
                while (this.n_cameras_connected !== this.n_calibrated_cameras) {
                    console.log("WAITING CAMERA CONNECTION...")
                    if (Date.now() - startTime > 5000) { // 5-second timeout
                        const res_stop = await axios.get(`/sessions/${this.session.id}/stop/`, {})
                        const res_cancel = await axios.get(`/sessions/${this.session.id}/cancel_trial/`, {})
                        this.cancelPoll()
                        this.state = 'ready'
                        this.trialInProcess.status = "error"
                        throw new Error("Connected cameras do not match calibrated cameras. Timeout while waiting for cameras to connect.");
                    }

                    // Retry fetching the status
                    await new Promise(r => setTimeout(r, 500)); // Wait before retrying
                    const retryRes = await axios.get(`/sessions/${this.session.id}/status/`, {});
                    this.n_cameras_connected = retryRes.data.n_cameras_connected;
                }

                // Start recording timer.
                this.recordingStarted = moment()
                this.recordingTimePassed = 0
                this.recordingTimer = window.setTimeout(this.recordTimerHandler, 500)

                // Play sound indicating the subject can start motion.
                if (this.isAuditoryFeedbackEnabled)
                  playRecordingSound()
              } catch (error) {
                apiError(error)
              }
  
              this.busy = false
            }
  
            break
          }
          case 'recording': {
            this.cancelRecordTimer()
  
            try {
              const res = await axios.get(`/sessions/${this.session.id}/stop/`, {})

              // Play sound indicating the subject can stop motion.
              if (this.isAuditoryFeedbackEnabled)
                playRecordingFinishedSound();

              this.trialInProcess.status = res.data.status
              this.state = 'processing'
  
              this.startPoll()
            } catch (error) {
              apiError(error)
            }
  
            break
          }
          case 'processing': {
            const res = await axios.get(`/sessions/${this.session.id}/cancel_trial/`, {})
            this.cancelPoll()
            this.state = 'ready'
            break
          }
        }
        await new Promise(r => setTimeout(r, 500));
      },
      recordTimerHandler() {
        this.recordingTimePassed = moment().diff(this.recordingStarted, 'seconds')
  
        if (this.recordingTimeLimit() < 0 || this.recordingTimePassed < this.recordingTimeLimit()) {
          this.recordingTimer = window.setTimeout(this.recordTimerHandler, 500)
        } else {
          apiSuccess('Recording finished upon reaching time limit')
          this.changeState()
        }
      },
      cancelRecordTimer() {
        if (this.recordingTimer) {
          window.clearTimeout(this.recordingTimer)
          this.recordingTimer = null
        }
      },
      async onDownloadData() {
        this.downloading = true
  
        try {
          //console.log(`${axios.defaults.baseURL}sessions/${this.session.id}/download/`)
          let link = document.createElement('a')
          link.setAttribute('href', `${axios.defaults.baseURL}sessions/${this.session.id}/download/`)
          link.setAttribute('download', 'mobilecap_result.zip')
          // This method works in all browsers including FireFox
          link.dispatchEvent(new MouseEvent('click'))
  
          window.setTimeout(() => {
            this.downloading = false
          }, 5000)
        } catch (error) {
          apiError(error)
          this.downloading = false
        }
      },
      async downloadSessionArchive(id) {
        this.isArchiveInProgress = true;
        this.isArchiveDone = false;
        let state = this;
        const startArchiveDownloadUrl = new URL(`/sessions/${id}/async-download/`, axios.defaults.baseURL);
        await axios.get(startArchiveDownloadUrl).then(
            async function pollArchiveOnReady(data) {
              const taskID = data.data.task_id;
              const downloadArchiveOnReadyURL = new URL(`/logs/${taskID}/on-ready/`, axios.defaults.baseURL);
              const response = await axios.get(downloadArchiveOnReadyURL);
              if (response.status === 202) {
                setTimeout(function () {
                  pollArchiveOnReady(data);
                }, 1000);
              }
              if (response.status === 200) {
                clearTimeout(pollArchiveOnReady);
                state.archiveUrl = response.data.url;
                state.isArchiveInProgress = false;
                state.isArchiveDone = true;
              }
            });
      },
      async analysisFunctionsPolls() {
        console.log(this.analysisFunctions);
        for (let func of this.analysisFunctions) {
          for (let trial_id of func.trials) {
            this.checkAnalysisFunction(func.id, trial_id);
          }
        }
      },
      async checkAnalysisFunction(functionId, trial_id) {
        const checkAnalysisFunctionUrl =
            new URL(`/analysis-functions/${functionId}/task-for-trial/${trial_id}/`, axios.defaults.baseURL);
        const state = this;
        await axios.get(checkAnalysisFunctionUrl).then(
            async function pollResultOnReady(data) {
              const taskID = data.data.task_id;
              const getResultOnReadyURL = new URL(`/analysis-result/${taskID}/`, axios.defaults.baseURL);
              const response = await axios.get(getResultOnReadyURL);
              if (response.status === 202) {
                setTimeout(function () {
                  pollResultOnReady(data);
                }, 1000);
              }
              if (response.status === 200) {
                console.log("Analysis result:", response.data)
                clearTimeout(pollResultOnReady);
                state.removeAnalysisFunctionTrial({functionId, trialId: trial_id});
                state.setAnalysisFunctionResult(functionId, response.data);
                state.setAnalysisFunctionState(
                    {functionId, trialId: trial_id, data: {"state": response.data.state, "task_id": taskID}});
              }
            }
        )
      },
      async invokeAnalysisFunction(functionId, trial_id, trial_name) {
        console.log(['invokeAnalysisFunction', functionId, trial_id, trial_name])
        this.setAnalysisFunctionTrial({functionId, trialId: trial_id});
        this.analysisFunctionsWithMenu.forEach(func => {
          func.isMenuOpen = false
        });
        const state = this;
        const invokeAnalysisFunctionUrl = new URL(`/analysis-functions/${functionId}/invoke/`, axios.defaults.baseURL);
        const invokeData = {session_id: this.session.id, specific_trial_names: [trial_name]};
        await axios.post(invokeAnalysisFunctionUrl, invokeData).then(
            async function pollResultOnReady(data) {
              const taskID = data.data.task_id;
              const getResultOnReadyURL = new URL(`/analysis-result/${taskID}/`, axios.defaults.baseURL);
              const response = await axios.get(getResultOnReadyURL);
              if (response.status === 202) {
                setTimeout(function () {
                  pollResultOnReady(data);
                }, 1000);
              }
              if (response.status === 200) {
                console.log("Analysis result:", response.data)
                clearTimeout(pollResultOnReady);
                state.removeAnalysisFunctionTrial({functionId, trialId: trial_id});
                state.setAnalysisFunctionResult(functionId, response.data);
                state.setAnalysisFunctionState(
                    {
                      functionId, trialId: trial_id,
                      data: {
                        "state": response.data.state,
                        "menu": response.data.menu,
                        "task_id": taskID,
                        "dashboard_id": response.data.dashboard_id
                      }
                    });
                state.loadTrialResults(trial_id);
              }
            });
      },
      newSession() {
        this.clearAll()
        this.$router.push({name: 'ConnectDevices'})
      },
      setPublic(p) {
        console.log(p)
        axios.patch(`/sessions/${this.session.id}/`, {"public": p})
      },
      async newSessionSameSetup() {
        await this.initSessionSameSetup()
        this.$router.push({name: 'Neutral', params: {id: this.session.id}})
      },
      startPoll() {
        this.statusPoll = window.setTimeout(async () => {
          const res = await axios.get(`/sessions/${this.session.id}/status/`)
          this.n_cameras_connected = res.data.n_cameras_connected
          this.n_videos_uploaded = res.data.n_videos_uploaded
  
          if (res.data.status !== 'uploading') {
            // Show error if any
            if (res.data.status === 'error') {
              apiErrorRes(res.data, 'Finished with error')
            }
            if (res.data.status === 'processing' || res.data.status === 'ready') {
              if (this.n_cameras_connected !== this.n_calibrated_cameras) {
                const num_missing_cameras = this.n_calibrated_cameras - this.n_videos_uploaded
                apiErrorRes(res.data, this.n_calibrated_cameras + " devices expected and " + this.n_videos_uploaded + " videos were uploaded. Please reconnect the missing " + num_missing_cameras + " devices to the session using the QR code at the top of the screen.");
              }
            }
            this.state = 'ready'
          } else {
            this.startPoll()
          }
        }, 2000)
      },
      cancelPoll() {
        if (this.statusPoll) {
          window.clearTimeout(this.statusPoll)
        }
      },
      async startTrialsPoll() {
        this.trialsPoll = window.setTimeout(async () => {
          const trials = this.filteredTrials.filter(trial => trial.status === 'stopped' || trial.status === 'processing' || trial.status === 'reprocess')
  
          if (trials.length > 0) {
            const res = await axios.get(`/sessions/${this.session.id}/status/?ret_session=true`)
  
            const updatedTrials = res.data.session.trials
  
            trials.forEach(t => {
              const updatedT = updatedTrials.find(x => x.id === t.id)
  
              // Trial found and its status changed
              if (updatedT && updatedT.status !== t.status) {
                this.updateTrial(updatedT)
              }
            })
          }
  
          this.startTrialsPoll()
        }, 5000)
      },
      cancelTrialsPoll() {
        if (this.trialsPoll) {
          window.clearTimeout(this.trialsPoll)
          this.trialsPoll = null
        }
      },
      trialClasses(trial) {
        return trial.trashed ? 'trashed' : 'cursor-pointer';
      },
      clickOutsideDialogTrialHideMenu(e) {
        if (e.target.className === 'v-overlay__scrim') {
          for (let t of this.filteredTrialsWithMenu) {
            t.isMenuOpen = false;
          }
        }
      },
  
      async analysisDialog(trial) {
        const index = this.session.trials.findIndex(x => x.id === trial.id)
        this.trial_analysis_index = index;
        this.showAnalysisDialog = true;
      },
  
      async renameTrialDialog(trial) {
        const index = this.session.trials.findIndex(x => x.id === trial.id)
        this.trial_rename_index = index;
        this.trialNewName = trial.name;
        this.trial_rename_dialog = true;
      },
      async addTagTrialDialog(trial) {
        const index = this.session.trials.findIndex(x => x.id === trial.id)
        this.trial_modify_tags_index = index;
        this.trial_modify_tags = true;
        // Load trial tags
        const res = await axios.get(`/trial-tags/${trial.id}/get_tags_trial/`)
        this.trialNewTags = []
        res.data.forEach((tag) => {
            this.trialNewTags.push(tag.tag)
        });
        console.log(res.data)
        console.log(trial.id)
      },
      async renameTrial(trial, index, trialNewName) {
        try {
          let oldName = trial.name
          console.log(trial.name + " will be renamed to " + trialNewName);
          const {data} = await axios.post(`/trials/${trial.id}/rename/`, {trialNewName});
          await this.updateTrialWithData(trial, data.data);
        } catch (error) {
          apiError(error)
        }
      },
      async modifyTagsTrial(trial, index, trialNewTags) {
        try {
          let oldTags = trial.tags
          console.log(trial.tags + " will be replaced by " + trialNewTags)
          const {data} = await axios.post(`/trials/${trial.id}/modifyTags/`, {trialNewTags});
          await this.updateTrialWithData(trial, data.data);
        } catch (error) {
          apiError(error)
        }
      },
      async updateTrialWithData(trial, data) {
        const index = this.session.trials.findIndex(x => x.id === trial.id)
        if (index >= 0) {
          if (Object.keys(data).length === 0) {
            // if permanent remove was done
            Vue.delete(this.session.trials, index);
          } else {
            Vue.set(this.session.trials, index, data);
          }
        }
      },
      async trashTrial(trial) {
        try {
          const {data} = await axios.post(`/trials/${trial.id}/trash/`);
          await this.updateTrialWithData(trial, data);
        } catch (error) {
          apiError(error)
        }
      },
      async permanentDeleteTrial(trial) {
        try {
          await axios.post(`/trials/${trial.id}/permanent_remove/`);
        } catch (error) {
          apiError(error);
        }
        await this.updateTrialWithData(trial, {});
      },
      async restoreTrial(trial) {
        try {
          const {data} = await axios.post(`/trials/${trial.id}/restore/`);
          await this.updateTrialWithData(trial, data);
        } catch (error) {
          apiError(error)
        }
      },
      async loadTrialResults(trial_id) {
        const {data} = await axios.get(`/trials/${trial_id}/`)
        for (let i = 0; i < this.session.trials.length; i++) {
          if (this.session.trials[i].id === trial_id) {
            Vue.set(this.session.trials[i], 'results', data.results)
          }
        }
      },
      async loadTrial(trial) {
        console.log('loadTrial')
        this.time = 0

        if (!this.trialLoading) {
          this.frame = 0
          this.trial = null
          this.synced = false
          this.trialLoading = true

          try {
            const {data} = await axios.get(`/trials/${trial.id}/`)
  
            this.trial = data
            console.log("Trial:", data)
  
            // load JSON
            const json = data.results.filter(element => element.tag == "visualizerTransforms-json")
            if (json && json.length > 0) {
              let data
              const url = json[0].media
  
              if (url.startsWith(axios.defaults.baseURL)) {
                const res = await axios.get(url)
                data = res.data
              } else {
                let axiosClean = axios.create()
  
                const res = await axiosClean.get(url, {
                  // Deleting Authorization header, because we have one as global Axios
                  // Do not pass out user token to 3rd party sites
                  transformRequest: [(data, headers) => {
                    delete headers.common.Authorization
                    return data
                  }]
                })
  
                data = res.data
              }
  
              this.frames = data.time
              this.animation_json = data
            } else {
              this.frames = [] //null
            }
  
            this.videos = data.results.filter(element => element.tag == "video-sync")

            let render_skeleton = true

            if (this.videos.length === 0) {
              this.frame = 0
              this.time = 0
              this.videos = data.videos
              this.videos.forEach(videoObj => {
                videoObj.media = videoObj.video;
                delete videoObj.video;
              });
              render_skeleton = false
            }

            if (this.frames.length > 0 || this.videos.length > 0) {
              this.$nextTick(() => {
                try {
                  while (this.$refs.mocap.lastChild) {
                    this.$refs.mocap.removeChild(this.$refs.mocap.lastChild)
                  }

                  // setup3d
                  const container = this.$refs.mocap
  
                  let ratio = container.clientWidth / container.clientHeight
                  this.camera = new THREE.PerspectiveCamera(45, ratio, 0.1, 125)
                  this.camera.position.x = 4.5
                  this.camera.position.z = -3
                  this.camera.position.y = 3
  
                  this.scene = new THREE.Scene()
                  this.renderer = new THREE.WebGLRenderer({antialias: true})
                  this.renderer.shadowMap.enabled = true;
                  this.onResize()
                  container.appendChild(this.renderer.domElement)
                  this.controls = new THREE_OC.OrbitControls(this.camera, this.renderer.domElement)
  
                  // show3d
                  // add the plane
                  {
                    const planeSize = 5;
  
                    const loader = new THREE.TextureLoader();
                    const texture = loader.load('https://threejsfundamentals.org/threejs/resources/images/checker.png');
                    //                  const texture = loader.load('https://www.the3rdsequence.com/texturedb/download/32/texture/jpg/1024/smooth+white+tile-1024x1024.jpg')
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.magFilter = THREE.NearestFilter;
                    const repeats = planeSize * 2;
                    texture.repeat.set(repeats, repeats);
  
                    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
                    const planeMat = new THREE.MeshPhongMaterial({
                      map: texture,
                      side: THREE.DoubleSide,
                    });
                    const mesh = new THREE.Mesh(planeGeo, planeMat);
                    mesh.rotation.x = Math.PI * -.5;
                    mesh.position.y = .0
                    mesh.receiveShadow = true;
                    this.scene.add(mesh);
                  }
  
                  // add sun
                  {
                    const skyColor = 0xB1E1FF;  // light blue
                    const groundColor = 0xB97A20;  // brownish orange
                    const intensity = 0.5
                    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
                    this.scene.add(light);
                  }
  
                  // add directional light
                  {
                    const color = 0xFFFFFF;
                    const intensity = 0.8;
                    const light = new THREE.DirectionalLight(color, intensity);
                    light.position.set(2, 3, 1.5);
                    light.target.position.set(0, 0, 0);
                    light.castShadow = true;
                    light.shadow.camera.left = -50;
                    light.shadow.camera.right = 50;
                    light.shadow.camera.top = 50;
                    light.shadow.camera.bottom = -50;
                    light.shadow.camera.near = 0.1;
                    light.shadow.camera.far = 200;
                    light.shadow.camera.zoom = 16
                    light.shadow.mapSize.width = 2048;
                    light.shadow.mapSize.height = 2048;
                    this.scene.add(light);
                    this.scene.add(light.target);
  
                    // const helper = new THREE.DirectionalLightHelper(light);
                    // this.scene.add(helper);
  
                    // const cameraHelper = new THREE.CameraHelper(light.shadow.camera);
                    // this.scene.add(cameraHelper);
                  }

                  if (render_skeleton) {
                    // add bones
                    for (let body in this.animation_json.bodies) {
                      let bd = this.animation_json.bodies[body]
                      bd.attachedGeometries.forEach((geom) => {
                        let path = 'https://mc-opencap-public.s3.us-west-2.amazonaws.com/geometries/' + geom.substr(0, geom.length - 4) + ".obj";
                        objLoader.load(path, (root) => {
                          root.castShadow = true;
                          root.receiveShadow = true;
                          root.traverse(function (child) {
                            if (child instanceof THREE.Mesh) {
                              //                               child.receiveShadow = true;
                              child.castShadow = true;
                            }
                          });
                          this.meshes[body + geom] = root;
                          this.meshes[body + geom].scale.set(bd.scaleFactors[0], bd.scaleFactors[1], bd.scaleFactors[2])
                          this.scene.add(root);
                        })
                      })
                    }
                  } else {
                    apiErrorRes(null, 'Showing uploaded videos (not synchronized).')
                  }
                } finally {
                  this.trialLoading = false
                }
  
                this.onResize()

                // animate
  
                function delay(time) {
                  return new Promise(resolve => setTimeout(resolve, time));
                }

                let timeout = 2000
                if (navigator.connection) {
                  console.log('supported: connection', navigator.connection.downlink)
                  timeout = Math.trunc(10000 / navigator.connection.downlink)
                }

                delay(timeout).then(() => {
                  // The fixed number 5 is here as a warkaround for Safari
                  this.togglePlay(true)
                });
              })
            }

            this.trialLoading = false  // Fix to unstuck trial loading in case of an issue
          } catch (error) {
            apiError(error)
            this.trialLoading = false
          }
        }
      },
      onResize() {
        const container = this.$refs.mocap
        if (container && this.renderer) {
          this.renderer.setSize(container.clientWidth, container.clientHeight)
        }
  
        if (this.renderer) {
          const canvas = this.renderer.domElement;
          this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
          this.camera.updateProjectionMatrix();
        }
      },
      animate() {
        // cancel display cycle if loading of new trial started
        if (!this.trialLoading) {
          requestAnimationFrame(this.animate)
          this.animateOneFrame()
        }
      },
      animateOneFrame() {
        let cframe
  
        let frames = this.frames.length
        let duration = 0
        if (this.vid0()) duration = this.vid0().duration
        if (this.vid0() && !isNaN(this.vid0().duration)) {
          let framerate = frames / duration
  
          if (this.videos.length > 0) {
            let t = 0
            if (this.vid0()) t = this.vid0().currentTime;
            cframe = (Math.round(t * framerate)) > this.frames.length ? this.frames.length - 1 : (Math.round(t * framerate))
            this.frame = cframe
            if (this.vid0()) this.time = this.frame == 0 ? 0 : parseFloat(this.vid0().currentTime.toFixed(2))
          } else {
            cframe = this.frame++
  
            if (this.frame >= this.frames.length) {
              this.frame = this.frames.length - 1
              this.time = this.vid0().duration
            }
          }
  
          if (cframe < this.frames.length) {
            // display the frame
            let json = this.animation_json;
            for (let body in json.bodies) {
              json.bodies[body].attachedGeometries.forEach((geom) => {
                if (this.meshes[body + geom]) {
                  this.meshes[body + geom].position.set(
                      json.bodies[body].translation[cframe][0],
                      json.bodies[body].translation[cframe][1],
                      json.bodies[body].translation[cframe][2])
                  var euler = new THREE.Euler(
                      json.bodies[body].rotation[cframe][0],
                      json.bodies[body].rotation[cframe][1],
                      json.bodies[body].rotation[cframe][2]);
                  this.meshes[body + geom].quaternion.setFromEuler(euler)
                }
              })
            }
          }
  
          this.renderer.render(this.scene, this.camera)
          this.syncVideos()
        }
      },
      syncVideos() {
        if (this.synced || this.trial == null || this.videos.length == 0)
          return
  
        // will also reset all videos
        this.playSpeed = 1
  
        /*
        this.videos.forEach((video, index) => {
          const vid_element = this.videoElement(index)
          vid_element.playbackRate = 1
        })
        */
  
        this.synced = true
      },
      onVideoEnded(index) {
        if (index === 0) {
          this.videos.forEach((video, index) => {
            const vid_element = this.videoElement(index)
            vid_element.currentTime = 0
            vid_element.play()
          })
        }
      },
      videoElement(index) {
        const vid = this.$refs[`video-${index}`]
  
        return vid
            ? vid[0]
            : null
      },
      vid0() {
        return this.videoElement(0)
      },
      isSelected(trial) {
        return this.trial && this.trial.id === trial.id
      },
      eachVideo(func) {
        this.videos.forEach((video, index) => {
          func(this.videoElement(index))
        })
      },
      togglePlay(value) {
        this.playing = value
  
        if (this.playing) {
          this.animate()
  
          this.videos.forEach((video, index) => {
            const vid_element = this.videoElement(index)
            vid_element.play()
          })
  
        } else {
          this.videos.forEach((video, index) => {
            const vid_element = this.videoElement(index)
            vid_element.pause()
          })
        }
      },
      onNavigate(frame) {
        const step = this.vid0().duration / this.frames.length
        const newPosition = frame * step
  
        this.eachVideo(videoElement => {
          videoElement.currentTime = newPosition
        })
  
        this.animateOneFrame()
      },
      onChangeTime(time) {
        this.eachVideo(videoElement => {
          videoElement.currentTime = time
        })
  
        this.animateOneFrame()
      },
      maxVideoDuration() {
        return this.vid0() ? (this.vid0().duration - 1) : 0
      },
      recordingTimeLimit() {
        // Default value is 60.
        // Set -1 for no limit.
        var timelimit = 60
  
        // If we know the framerate, we change time limit accordingly.
        if ('meta' in this.session && 'settings' in this.session.meta && 'framerate' in this.session.meta.settings) {
          var framerate = this.session.meta.settings.framerate
          if (framerate == 60 || framerate == 120 || framerate == 240)
            timelimit = 60 / (framerate / 60)
        }
  
        return timelimit
      },
      toggleSessionMenuButtons() {
        this.showSessionMenuButtons = !this.showSessionMenuButtons;
      },
      goToAnalysisDashboard(dashboardId, trialId) {
        if (trialId) {
          this.$router.push({
            name: 'AnalysisDashboard',
            params: {id: dashboardId},
            query: {trialId: trialId}
          })
        } else {
          this.$router.push({
            name: 'AnalysisDashboard',
            params: {id: dashboardId}
          })
        }
      },
      requestDownloadMenuItem(trial, menu_item) {
        let tag = menu_item.result_tag;
        for (let i = 0; i < trial.results.length; i++) {
          console.log(trial.results[i].tag);
          if (trial.results[i].tag === tag) {
            let url = trial.results[i].media;
            let link = document.createElement('a')
            link.setAttribute('href', url)
            link.setAttribute('download', tag)
            link.setAttribute('target', '_blank')
            // This method works in all browsers including FireFox
            link.dispatchEvent(new MouseEvent('click'))
            return;
          }
        }
        window.alert(`Result with tag "${tag}" not found`);
      },
      handleKeyboard(event) {
        // Only handle keyboard events when trial is loaded and video controls are enabled
        if (this.videoControlsDisabled) {
          return
        }

        // Ignore if user is typing in an input field
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
          return
        }

        switch (event.key) {
          case ' ': // Space bar - toggle play/pause
            event.preventDefault()
            this.togglePlay(!this.playing)
            break
          case 'ArrowLeft': // Left arrow - previous frame
            event.preventDefault()
            if (this.frame > 0) {
              this.onNavigate(this.frame - 1)
            }
            break
          case 'ArrowRight': // Right arrow - next frame
            event.preventDefault()
            if (this.frame < this.frames.length - 1) {
              this.onNavigate(this.frame + 1)
            }
            break
        }
      }
    }
  }
  </script>
  
  <style lang="scss">
  .trashed {
    color: gray !important;
  }
  
  .text-orange {
    color: orange !important;
  }
  
  .step-5 {
    height: calc(100vh - 64px);
  
    .left {
      width: 250px;
  
      .trials {
        overflow-y: auto;
  
        .trial {
          border-radius: 4px;
          padding: 2px 6px;
  
          &.selected {
            background-color: #272727;
            cursor: default;
          }
        }
      }
    }
  
    .viewer {
      height: 100%;
  
      #mocap {
        width: 100%;
        overflow: hidden;
  
        canvas {
          width: 100% !important;
        }
      }
    }
  
    .right {
      flex: 0 0 200px;
      height: 100%;
  
      .videos {
        overflow-y: auto;
        width: 200px;
      }
    }
  }
  </style>
  
  