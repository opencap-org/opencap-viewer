<template>
    <div class="step-5 d-flex">
        <!-- Session notification banner (errors, waiting status) -->
        <v-snackbar
            v-model="sessionNotification.show"
            :color="sessionNotification.type === 'error' ? 'error' : 'info'"
            :timeout="sessionNotification.type === 'error' ? 10000 : 5000"
            app
            top
            centered
            content-class="session-notification-snackbar">
            {{ sessionNotification.text }}
            <template v-slot:action="{ attrs }">
                <v-btn
                    v-bind="attrs"
                    text
                    @click="sessionNotification.show = false">
                    Close
                </v-btn>
            </template>
        </v-snackbar>
        <!-- Mobile menu button -->
        <v-btn
            v-if="!leftMenuOpen && $vuetify.breakpoint.mdAndDown"
            class="mobile-menu-toggle ui-no-zoom"
            icon
            @click="leftMenuOpen = true">
            <v-icon>mdi-menu</v-icon>
        </v-btn>
        
        <!-- Overlay for mobile -->
        <div 
            v-if="leftMenuOpen && $vuetify.breakpoint.mdAndDown"
            class="mobile-overlay"
            @click="leftMenuOpen = false">
        </div>
        
        <div class="left-wrapper" :class="{ 'mobile-open': leftMenuOpen }">
            <div class="left ui-no-zoom d-flex flex-column pa-2">
            <div class="left-scroll d-flex flex-column">
            <!-- Open in app button for monocular sessions on mobile -->
            <v-btn
                v-if="showOpenInAppButton"
                color="primary-dark"
                class="mb-4 w-100"
                large
                @click="openInApp">
                <v-icon left>mdi-cellphone-arrow-down</v-icon>
                Open in App
            </v-btn>
            <!-- Monocular beta notification banner -->
            <v-alert
                v-if="isMonocularSession"
                type="info"
                dense
                outlined
                class="monocular-beta-alert mb-4"
                border="left">
              <div class="monocular-beta-content">
                <strong>Monocular mode is in beta.</strong>
                <a href="https://www.opencap.ai/best-practices?variant=Monocular" target="_blank" rel="noopener noreferrer">Best practices</a>
                ·
                <a href="https://www.opencap.ai/get-started?variant=monocular" target="_blank" rel="noopener noreferrer">Get started</a>.
                Jumping is not supported yet. Camera must be static at 45° angle.
              </div>
            </v-alert>
  
            <ValidationObserver tag="div" class="d-flex flex-column" ref="observer" v-slot="{ invalid }">
  
                <div class="d-flex align-center flex-wrap mb-2 trial-name-row">
                  <div class="flex-grow-1 min-width-0">
                    <ValidationProvider rules="required|alpha_dash_custom" v-slot="{ errors }" name="Trial name">
                      <v-text-field v-show="show_controls && !showOpenInAppButton" v-model="trialName" label="Trial name" class="flex-grow-0"
                          :disabled="state !== 'ready'" dark :error="errors.length > 0" :error-messages="errors[0]" />
                    </ValidationProvider>
                  </div>
                </div>
  
                  <v-btn class="mb-4 w-100" v-show="show_controls && !showOpenInAppButton" :disabled="(busy || invalid) && !(state === 'recording' && n_cameras_connected === 0)" @click="changeState">
                      {{ buttonCaption }}
                  </v-btn>
                  <p v-if="state === 'recording' && n_cameras_connected >= n_calibrated_cameras">{{ displayDeviceCount }} devices are recording, do not refresh</p>
                  <p v-if="state === 'processing'">{{ n_videos_uploaded }} of {{ displayDeviceCount }} videos uploaded, do not refresh.</p>
              </ValidationObserver>

              <div class="show-removed-trials-sidebar mb-2">
                <v-checkbox v-model="show_trashed" label="Show removed trials" hide-details dense class="toolbar-checkbox"></v-checkbox>
              </div>

              <div class="trials-wrapper flex-grow-1">
                  <div class="trials">
                  <div v-for="(t, index) in filteredTrialsWithMenu"
                      v-bind:item="t"
                      v-bind:index="index"
                      v-bind:key="t.id"
                      class="trial-row">
                      <div :ref="t.id"
                          class="my-1 trial d-flex justify-content-between"
                          :class="{ selected: isSelected(t) }">
                          <Status :value="t" :class="[trialClasses(t), 'flex-grow-1']" @click="loadTrial(t)" />
                          <div class="">
                            <!-- Mobile: bottom sheet for better touch UX -->
                            <template v-if="$vuetify.breakpoint.smAndDown">
                              <v-btn
                                icon
                                dark
                                @click="openTrialMenuSheet(t)">
                                <v-icon>mdi-menu</v-icon>
                              </v-btn>
                            </template>
                            <!-- Desktop: dropdown menu -->
                            <v-menu
                              v-else
                              v-model="t.isMenuOpen"
                              offset-y
                              right
                              close-on-content-click
                              content-class="trial-context-menu">
                              <template v-slot:activator="{ on, attrs }">
                                <v-btn
                                  icon
                                  dark
                                  v-bind="attrs"
                                  v-on="on">
                                  <v-icon>mdi-menu</v-icon>
                                </v-btn>
                              </template>
                              <v-list>
                                <v-list-item link v-if="t.name !== 'neutral'" @click="closeMenuAndRename(t)">
                                  <v-list-item-title>Rename</v-list-item-title>
                                </v-list-item>
                                <v-list-item link v-if="!t.trashed && t.name !== 'neutral'" @click="closeMenuAndAnalysis(t)">
                                  <v-list-item-title>Analysis</v-list-item-title>
                                </v-list-item>
                                <v-list-item link @click="closeMenuAndEditTags(t)">
                                  <v-list-item-title>Edit Tags</v-list-item-title>
                                </v-list-item>
                                <v-list-item link v-if="!t.trashed" @click="closeMenuAndOpenTrashDialog(t)">
                                  <v-list-item-title>Trash</v-list-item-title>
                                </v-list-item>
                                <v-list-item link v-if="t.trashed" @click="closeMenuAndOpenRestoreDialog(t)">
                                  <v-list-item-title>Restore</v-list-item-title>
                                </v-list-item>
                                <v-list-item link v-if="!t.trashed" @click="closeMenuAndOpenDeleteDialog(t)">
                                  <v-list-item-title>Delete</v-list-item-title>
                                </v-list-item>
                              </v-list>
                            </v-menu>
                          </div>
                      </div>
                      <v-divider v-if="index < filteredTrialsWithMenu.length - 1" class="mx-0 my-1" />
                  </div>
                  </div>
              </div>

              <!-- Mobile: trial options bottom sheet -->
              <v-bottom-sheet
                content-class="bottom-sheet-rounded"
                v-model="showTrialMenuSheet"
                @input="val => !val && (selectedTrialForMenu = null)">
                <v-sheet class="text-center trial-menu-sheet" color="blue-grey darken-1">
                  <v-list v-if="selectedTrialForMenu">
                    <v-list-item link v-if="selectedTrialForMenu.name !== 'neutral'" @click="closeSheetAndRename(selectedTrialForMenu)">
                      <v-list-item-content>
                        <div class="d-flex flex-row align-center justify-center">
                          <v-icon class="mr-3">mdi-pencil</v-icon>
                          <span>Rename</span>
                        </div>
                      </v-list-item-content>
                    </v-list-item>
                    <v-divider v-if="selectedTrialForMenu.name !== 'neutral'"></v-divider>
                    <v-list-item link v-if="!selectedTrialForMenu.trashed && selectedTrialForMenu.name !== 'neutral'" @click="closeSheetAndAnalysis(selectedTrialForMenu)">
                      <v-list-item-content>
                        <div class="d-flex flex-row align-center justify-center">
                          <v-icon class="mr-3">mdi-chart-box</v-icon>
                          <span>Analysis</span>
                        </div>
                      </v-list-item-content>
                    </v-list-item>
                    <v-divider></v-divider>
                    <v-list-item link @click="closeSheetAndEditTags(selectedTrialForMenu)">
                      <v-list-item-content>
                        <div class="d-flex flex-row align-center justify-center">
                          <v-icon class="mr-3">mdi-tag-multiple</v-icon>
                          <span>Edit Tags</span>
                        </div>
                      </v-list-item-content>
                    </v-list-item>
                    <v-divider v-if="!selectedTrialForMenu.trashed"></v-divider>
                    <v-list-item link v-if="!selectedTrialForMenu.trashed" @click="closeSheetAndOpenTrashDialog(selectedTrialForMenu)">
                      <v-list-item-content>
                        <div class="d-flex flex-row align-center justify-center">
                          <v-icon class="mr-3">mdi-delete-outline</v-icon>
                          <span>Trash</span>
                        </div>
                      </v-list-item-content>
                    </v-list-item>
                    <v-divider v-if="selectedTrialForMenu.trashed"></v-divider>
                    <v-list-item link v-if="selectedTrialForMenu.trashed" @click="closeSheetAndOpenRestoreDialog(selectedTrialForMenu)">
                      <v-list-item-content>
                        <div class="d-flex flex-row align-center justify-center">
                          <v-icon class="mr-3">mdi-restore</v-icon>
                          <span>Restore</span>
                        </div>
                      </v-list-item-content>
                    </v-list-item>
                    <v-divider v-if="!selectedTrialForMenu.trashed"></v-divider>
                    <v-list-item link v-if="!selectedTrialForMenu.trashed" @click="closeSheetAndOpenDeleteDialog(selectedTrialForMenu)">
                      <v-list-item-content>
                        <div class="d-flex flex-row align-center justify-center">
                          <v-icon class="mr-3">mdi-delete-forever</v-icon>
                          <span>Delete</span>
                        </div>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list>
                </v-sheet>
              </v-bottom-sheet>

            </div><!-- end left-scroll -->

            <v-btn class="session-actions-toggle w-100" @click="toggleSessionMenuButtons()">
                <v-icon v-if="showSessionMenuButtons">mdi-menu-down</v-icon>
                <v-icon v-else>mdi-menu-up</v-icon>
            </v-btn>

            <div v-if="showSessionMenuButtons" class="session-actions-panel">
                  <v-btn small class="w-100 session-action-btn" v-show="show_controls && !isMonocularSession" :disabled="busy || state !== 'ready'"
                      @click="newSessionSameSetup">
                      <v-icon left small>mdi-plus-box-multiple</v-icon>
                      New session, same setup
                  </v-btn>
  
                  <v-btn small class="mt-4 w-100 session-action-btn" v-show="show_controls" :disabled="busy || state !== 'ready'" @click="newSession">
                      <v-icon left small>mdi-plus</v-icon>
                      New session
                  </v-btn>
  
                  <v-dialog v-model="dialog" content-class="app-dialog" :width="$vuetify.breakpoint.smAndDown ? '100%' : '500'"
                      max-width="500" :fullscreen="$vuetify.breakpoint.smAndDown">
                      <template v-slot:activator="{ on, attrs }">
                          <v-btn small class="mt-4 w-100 session-action-btn" v-bind="attrs" v-on="on" v-show="show_controls">
                              <v-icon left small>mdi-share-variant</v-icon>
                              Share session publicly
                          </v-btn>
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
                  <v-btn small class="mt-4 w-100 session-action-btn" @click="showArchiveDialog = true">
                      <v-icon left small>mdi-download-outline</v-icon>
                      Download data
                  </v-btn>
                  <v-dialog
                      v-model="showArchiveDialog"
                      content-class="app-dialog"
                      max-width="500"
                      :fullscreen="$vuetify.breakpoint.smAndDown">
                      <v-card>
                          <v-card-text class="pt-4">
                              <v-row class="m-0">
                              <v-col cols="12" sm="2">
                                  <v-icon x-large color="green">mdi-download</v-icon>
                              </v-col>
                              <v-col cols="12" sm="10">
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
                      <v-icon v-if="!downloading" left small>mdi-download</v-icon>
                      <v-progress-circular v-if="downloading" indeterminate class="mr-2" color="grey" size="14" width="2" />
                      Download data (old)
                  </v-btn>
  
                  <v-btn small class="mt-4 w-100 session-action-btn" @click="$router.push({ name: 'Dashboard', params: { id: session.id, trialId: trial.name  } })">
                      <v-icon left small>mdi-view-dashboard-outline</v-icon>
                      Dashboard kinematics
                  </v-btn>
  
                  <v-btn small class="mt-4 w-100 session-action-btn" v-show="show_controls" @click="$router.push({ name: 'SelectSession'})"
                      :disabled="busy || state !== 'ready'">
                      <v-icon left small>mdi-arrow-left</v-icon>
                      Back to session list
                  </v-btn>
            </div>
          </div>

            <!-- Mobile sidebar toggle - outside, right next to sidebar -->
            <v-btn
                v-if="leftMenuOpen && $vuetify.breakpoint.mdAndDown"
                class="sidebar-toggle-btn ui-no-zoom"
                icon
                small
                @click="leftMenuOpen = false">
                <v-icon>mdi-chevron-left</v-icon>
            </v-btn>
        </div><!-- end left-wrapper -->

        <div class="main-content d-flex flex-grow-1">
        <!-- Centered Open in App prompt for monocular mobile sessions -->
        <div v-if="showOpenInAppButton && !trial" class="open-in-app-center d-flex flex-column align-center justify-center">
            <v-icon size="80" color="primary-dark" class="mb-4">mdi-cellphone-arrow-down</v-icon>
            <h2 class="white--text mb-4 text-center">Ready to Record</h2>
            <p class="white--text text-center mb-6 px-4">Click the button below to start recording from the mobile app. Make sure you have the latest version of the OpenCap app (2.0+) installed. <a class="open-in-app-store-link" href="https://apps.apple.com/us/app/opencap/id1630513242" target="_blank" rel="noopener noreferrer">Get it on the App Store</a>.</p>
            <v-btn
                color="primary-dark"
                x-large
                @click="openInApp"
                class="open-in-app-btn">
                <v-icon left>mdi-launch</v-icon>
                Open in App
            </v-btn>
            <v-alert
                type="info"
                dense
                outlined
                class="monocular-beta-alert mt-6 mx-4"
                border="left">
              <div class="monocular-beta-content">
                <strong>Monocular mode is in beta.</strong>
                Jumping is not supported yet. Camera must be static at 45° angle.
                <div class="d-flex flex-wrap mt-2">
                  <v-btn x-small outlined class="mr-2 mb-1" @click="window.open('https://www.opencap.ai/best-practices?variant=Monocular', '_blank')">Best practices</v-btn>
                  <v-btn x-small outlined class="mb-1" @click="window.open('https://www.opencap.ai/get-started?variant=monocular', '_blank')">Get started</v-btn>
                </div>
              </div>
            </v-alert>
        </div>

        <div class="viewer flex-grow-1" v-show="!showOpenInAppButton || trial">
            <div v-if="trial" class="d-flex flex-column h-100">
  
                <div id="mocap" ref="mocap" class="flex-grow-1" />
  
  
                  <div v-if="!videoControlsDisabled && !isMobileOrTablet" class="video-controls ui-no-zoom d-flex flex-wrap align-center pa-2">
                      <v-text-field label="Time (s)" type="number" :step="0.01" :value="time"
                          :disabled="state !== 'ready'" dark class="time-input" @input="onChangeTime"/>
                      <v-slider :value="frame" :min="0" :max="frames.length - 1" @input="onNavigate" hide-details
                          class="mb-2 flex-grow-1 timeline-slider" />

                      <div class="playback-controls-inline d-flex align-center">
                        <VideoNavigation
                            :playing="playing"
                            :value="frame"
                            :maxFrame="frames.length - 1"
                            :loop="loopPlayback"
                            :show-loop-toggle="true"
                            :disabled="videoControlsDisabled"
                            @play="togglePlay(true)"
                            @pause="togglePlay(false)"
                            @toggle-loop="toggleLoopPlayback"
                            @input="onNavigate"
                            class="playback-navigation" />

                        <SpeedControl v-model="playSpeed" class="playback-speed ml-2" />
                      </div>
                  </div>
              </div>
  
            <div v-else-if="trialLoading" class="flex-grow-1 d-flex align-center justify-center">
                <v-progress-circular indeterminate color="grey" size="30" width="4" />
            </div>
            <div v-else class="session-empty-state d-flex flex-column align-center justify-center text-center">
                <v-icon size="56" color="grey lighten-1" class="mb-3">mdi-chart-box-outline</v-icon>
                <h3 class="mb-2">No data selected/recorded</h3>
                <p v-if="show_controls" class="mb-0 px-4">Type a trial name on the left and click Start recording or select a trial from the list.</p>
                <p v-else class="mb-0 px-4">Select a trial from the list to view motion data.</p>
            </div>
        </div>
  
        <div class="right d-flex flex-column" :style="mobileVideoPanelStyle">
            <div class="videos d-flex flex-column">
              <video 
                  v-for="(video, index) in videos" 
                  :key="`video-${index}`" 
                  :ref="`video-${index}`" 
                  muted
                  playsinline 
                  :src="video.media" 
                  crossorigin="anonymous" 
                  @ended="onVideoEnded(index)"
                  class="video-element" />
            </div>

            <v-btn
                v-if="showCamSizeButton && !videoControlsDisabled"
                x-small
                class="cam-size-overlay ui-no-zoom"
                @click="cycleMobileVideoSize">
              Cam {{ mobileVideoSizeLabel }}
            </v-btn>

            <div v-if="isMobileOrTablet" class="right-spacer" />

            <div v-if="isMobileOrTablet && !videoControlsDisabled" class="playback-controls ui-no-zoom">
              <div class="playback-timeline-mobile d-flex align-center px-1">
                <v-text-field
                    label="Time (s)"
                    type="number"
                    :step="0.01"
                    :value="time"
                    :disabled="state !== 'ready'"
                    dark
                    class="time-input mr-2"
                    @input="onChangeTime" />
                <v-slider
                    :value="frame"
                    :min="0"
                    :max="frames.length - 1"
                    @input="onNavigate"
                    hide-details
                    class="flex-grow-1 timeline-slider" />
              </div>

              <div class="playback-controls-row">
                <VideoNavigation
                    :playing="playing"
                    :value="frame"
                    :maxFrame="frames.length - 1"
                    :loop="loopPlayback"
                    :show-loop-toggle="true"
                    :disabled="videoControlsDisabled"
                    @play="togglePlay(true)"
                    @pause="togglePlay(false)"
                    @toggle-loop="toggleLoopPlayback"
                    @input="onNavigate"
                    class="playback-navigation" />

                <SpeedControl v-model="playSpeed" class="playback-speed ml-2" />
              </div>
            </div>
          </div>
        </div>
  
        <v-dialog
              v-model="trial_rename_dialog"
              content-class="compact-rename-dialog app-dialog"
              max-width="420"
              :fullscreen="$vuetify.breakpoint.smAndDown">
          <v-card>
            <v-card-text class="pt-4">
              <v-row class="m-0">
                <v-col cols="12" sm="2">
                  <v-icon x-large color="orange">mdi-rename-box</v-icon>
                </v-col>
                <v-col cols="12" sm="10">
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
            content-class="app-dialog"
            max-width="500"
            :fullscreen="$vuetify.breakpoint.smAndDown">
        <v-card>
          <v-card-text class="pt-4">
            <v-row class="m-0">
              <v-col cols="12" sm="2">
                <v-icon x-large color="orange">mdi-rename-box</v-icon>
              </v-col>
              <v-col cols="12" sm="10">
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

      <!-- Trash trial dialog (extracted for mobile-friendly behavior) -->
      <v-dialog
        v-model="remove_dialog"
        v-click-outside="clickOutsideDialogTrialHideMenu"
        content-class="confirm-dialog"
        max-width="500"
        :fullscreen="$vuetify.breakpoint.smAndDown">
        <v-card>
          <v-card-text class="pt-4" v-if="trialForTrashDialog">
            <v-row class="m-0">
              <v-col cols="12" sm="2">
                <v-icon x-large color="red">mdi-close-circle</v-icon>
              </v-col>
              <v-col cols="12" sm="10">
                <p>
                  Do you want to trash trial {{ trialForTrashDialog.name }}?
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
              @click="closeTrashDialog">
              No
            </v-btn>
            <v-btn
              color="red darken-1"
              text
              @click="confirmTrashTrial">
              Yes
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Restore trial dialog -->
      <v-dialog
        v-model="restore_dialog"
        v-click-outside="clickOutsideDialogTrialHideMenu"
        content-class="confirm-dialog"
        max-width="500"
        :fullscreen="$vuetify.breakpoint.smAndDown">
        <v-card>
          <v-card-text class="pt-4" v-if="trialForRestoreDialog">
            <v-row class="m-0">
              <v-col cols="12" sm="2">
                <v-icon x-large color="green">mdi-undo-variant</v-icon>
              </v-col>
              <v-col cols="12" sm="10">
                <p>
                  Do you want to restore trial {{ trialForRestoreDialog.name }}?
                </p>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="blue darken-1"
              text
              @click="closeRestoreDialog">
              No
            </v-btn>
            <v-btn
              color="green darken-1"
              text
              @click="confirmRestoreTrial">
              Yes
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Permanent delete trial dialog -->
      <v-dialog
        v-model="permanent_delete_dialog"
        v-click-outside="clickOutsideDialogTrialHideMenu"
        content-class="confirm-dialog"
        max-width="500"
        :fullscreen="$vuetify.breakpoint.smAndDown">
        <v-card>
          <v-card-text class="pt-4" v-if="trialForPermanentDeleteDialog">
            <v-row class="m-0">
              <v-col cols="12" sm="2">
                <v-icon x-large color="red">mdi-close-circle</v-icon>
              </v-col>
              <v-col cols="12" sm="10">
                <p>
                  Do you want to permanently delete trial {{ trialForPermanentDeleteDialog.name }}?
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
              @click="closePermanentDeleteDialog">
              No
            </v-btn>
            <v-btn
              color="red darken-1"
              text
              @click="confirmPermanentDeleteTrial">
              Yes
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
    <v-dialog
        v-model="showAnalysisDialog"
        v-click-outside="clickOutsideDialogTrialHideMenu"
        content-class="app-dialog"
        max-width="fit-content"
        :fullscreen="$vuetify.breakpoint.smAndDown">
      <v-card>
          <v-card-title class="text-h5 font-weight-bold pb-2">
            <v-icon left>mdi-chart-box-outline</v-icon>
            Advanced Analysis
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text v-if="analysisFunctions.length > 0" class="pt-4">
                  <template v-if="session?.trials && session.trials[trial_analysis_index]">
                  <div v-for="(func, index) in analysisFunctions"
                      v-bind:item="func"
                      v-bind:index="index"
                      v-bind:key="func.id"
                      :ref="func.id">
                    
                  <v-row class="align-center mb-2">
                  <v-col cols="12" sm="3" class="py-2">
                    <div class="font-weight-bold text-subtitle-1">
                      {{ func.title }}
                    </div>
                    <v-tooltip bottom v-if="func.info.length > 0">
                      <template v-slot:activator="{ on }">
                        <v-icon v-on="on" small color="grey" class="ml-1"> mdi-help-circle-outline </v-icon>
                      </template>
                      <p v-html="func.info.replace(/\n/g, '<br>')" />
                    </v-tooltip>

                  </v-col>
                  <v-col cols="12" sm="5" class="py-2">
                    <div class="text-body-2 grey--text text--darken-2">{{ func.description }}</div>
                  </v-col>
                  <v-col cols="12" sm="4" class="py-2 text-right">
                    <v-btn small color="grey darken-4" elevation="2" v-if="func.trials.includes(session.trials[trial_analysis_index].id)" :disabled="session.trials[trial_analysis_index].id in func.trials">
                        <span >
                            <v-progress-circular  indeterminate class="mr-2" color="grey" size="14" width="2" />
                            Calculating...
                        </span>
                    </v-btn>

                    <v-btn
                        small
                        elevation="2"
                        color="grey darken-4"
                        dark
                        v-if="!func.trials.includes(session.trials[trial_analysis_index].id) && !(session.trials[trial_analysis_index].id in func.states)"
                        @click="invokeAnalysisFunction(func.id, session.trials[trial_analysis_index].id, session.trials[trial_analysis_index]?.name)"
                        >
                        <v-icon left small>mdi-play</v-icon>
                        Run
                    </v-btn>
                      <v-btn
                        small
                        elevation="2"
                        color="grey darken-4"
                        dark
                        v-if="(session.trials[trial_analysis_index].id in func.states) && !func.trials.includes(session.trials[trial_analysis_index].id)"
                        @click="func.states[session.trials[trial_analysis_index].id].state === 'successfull' && func.states[session.trials[trial_analysis_index].id].dashboard_id != null && goToAnalysisDashboard(func.states[session.trials[trial_analysis_index].id].dashboard_id, session.trials[trial_analysis_index].id)"
                      >
                          <span :style="func.states[session.trials[trial_analysis_index].id].state == 'failed'? 'color:red' : 'color:lightgreen'" class="font-weight-bold">{{ func.states[session.trials[trial_analysis_index].id].state }}</span>
                          <v-menu offset-y left close-on-content-click content-class="analysis-submenu">
                              <template v-slot:activator="{ on, attrs }">
                              <v-btn icon dark v-bind="attrs" v-on="on" class="analysis-menu-btn" @click.stop>
                                  <v-icon>mdi-menu</v-icon>
                              </v-btn>
                              </template>

                              <v-list class="analysis-submenu-list">
                                  <v-list-item link
                                      @click="invokeAnalysisFunction(func.id, session.trials[trial_analysis_index].id, session.trials[trial_analysis_index]?.name)"
                                      :disabled="trial_analysis_index in func.trials">
                                      <v-icon left small>mdi-refresh</v-icon>
                                      Re-run
                                  </v-list-item>
                                  <v-list-item
                                      @click="goToAnalysisDashboard(func.states[session.trials[trial_analysis_index].id].dashboard_id, session.trials[trial_analysis_index].id)"
                                      v-if="func.states[session.trials[trial_analysis_index].id].dashboard_id != null && func.states[session.trials[trial_analysis_index].id].state == 'successfull'"
                                      >
                                      <v-icon left small>mdi-view-dashboard</v-icon>
                                      Analysis Dashboard
                                    </v-list-item>
                                   <v-list-item
                                     v-for="menu_item in func.states[session.trials[trial_analysis_index].id].menu"
                                     @click="requestDownloadMenuItem(session.trials[trial_analysis_index], menu_item)" :key="menu_item.label"
                                      >
                                      <v-icon left small>mdi-download</v-icon>
                                      {{ menu_item.label }}
                                    </v-list-item>
                              </v-list>

                          </v-menu>
                      </v-btn>

                  </v-col>
              </v-row>
              
              <v-divider v-if="index < analysisFunctions.length - 1" class="my-3"></v-divider>
              </div>
                  </template>
                  <p v-else class="mb-0 grey--text">Select a trial to run analysis.</p>
          </v-card-text>
          <v-card-text v-else class="text-center py-8">
              <v-icon size="64" color="grey lighten-1">mdi-function-variant</v-icon>
              <p class="text-h6 grey--text mt-4">No available functions</p>
              <p class="grey--text text--lighten-1">There are no analysis functions available for this session.</p>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
          color="blue darken-1"
          text
          v-if="analysisFunctions.length > 0"
        >
          <v-icon left small>mdi-restore</v-icon>
          Reset results
        </v-btn>
        <v-btn
          color="red darken-1"
          text
          @click="showTrialMenuSheet = false; selectedTrialForMenu = null; (session.trials[trial_analysis_index] || {}).isMenuOpen = false; showAnalysisDialog = false;"
        >
          <v-icon left small>mdi-close</v-icon>
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
  import { getSessionDeepLink } from '@/util/SessionDeepLink.js'
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
              loopPlayback: true,
              playSpeed: 1,
              mobileVideoSizeIndex: 0,
  
              show_controls: 1,
  
              resizeObserver: null,
  
              recordingStarted: null,
              recordingTimePassed: 0,
              recordingTimer: null,
              recordingStatusPoll: null,

              trialsPoll: null,
              showSessionMenuButtons: true,
              leftMenuOpen: false,
  
              n_calibrated_cameras: 0,
              n_cameras_connected: 0,
              n_videos_uploaded: 0,
  
              trial_rename_dialog: false,
              trial_rename_index: 0,

              trial_modify_tags: false,
              trial_modify_tags_index: 0,

              // Mobile trial menu - trial whose options are shown in bottom sheet
              showTrialMenuSheet: false,
              selectedTrialForMenu: null,
              // Trial context for Trash/Restore/Delete dialogs (extracted from v-for for proper mobile UX)
              trialForTrashDialog: null,
              trialForRestoreDialog: null,
              trialForPermanentDeleteDialog: null,

              isAuditoryFeedbackEnabled: false,
              controlGestureGuard: null,

              sessionNotification: { show: false, text: '', type: 'error' },
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
          return location.origin + "/session/" + (this.session?.id || '');
        },
        filteredTrialsWithMenu() {
          return this.filteredTrials.map(trial => ({...trial, isMenuOpen: false}));
        },
        filteredTrials() {
          const trials = this.session?.trials || []
          return trials.filter(trial => trial && trial.name !== 'calibration' && !(trial.name === 'neutral' && trial.status === 'error')).filter(t => this.show_trashed || !t.trashed)
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
        isMobileOrTablet() {
          return this.$vuetify.breakpoint.smAndDown
        },
        showCamSizeButton() {
          return this.$vuetify.breakpoint.mdAndDown
        },
        isMonocularSession() {
          return !!(this.session?.isMono ?? this.session?.is_mono)
        },
        sessionDeepLinkUrl() {
          if (!this.session?.id) return null
          const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null
          const subjectName = this.session?.subject_name || null
          return getSessionDeepLink(this.session.id, token, subjectName)
        },
        isSameDevice() {
          if (this.$route.query.sameDevice === 'true') {
            return true
          }
          return this.isSessionMarkedSameDevice(this.session?.id)
        },
        showOpenInAppButton() {
          return this.$vuetify.breakpoint.mdAndDown && this.isMonocularSession && this.isSameDevice && this.session?.id && this.sessionDeepLinkUrl
        },
        hasRecordedTrial() {
          return this.filteredTrials.some(t => t.status && t.status !== 'ready')
        },
        // Use max of API values so monocular (n_calibrated=1) still shows actual device count when more are recording
        displayDeviceCount() {
          return Math.max(this.n_cameras_connected, this.n_videos_uploaded, 1)
        },
        mobileVideoSizeLabel() {
          return ['S', 'M', 'L'][this.mobileVideoSizeIndex] || 'S'
        },
        mobileVideoPanelStyle() {
          if (!this.showCamSizeButton) {
            return {}
          }

          const widths = [120, 150, 180]
          const minWidths = [100, 120, 140]
          const maxWidths = ['35%', '45%', '55%']
          const maxHeight = [120, 150, 180]
          const idx = this.mobileVideoSizeIndex

          return {
            width: `${widths[idx]}px`,
            minWidth: `${minWidths[idx]}px`,
            maxWidth: maxWidths[idx],
            '--mobile-video-max-height': `${maxHeight[idx]}px`
          }
        }
      },
    async mounted() {
      await this.loadSession(this.$route.params.id)
      this.persistSameDeviceSessionFlag()

      // Open sidebar by default on tablets/mobile when not in same-device flow, or when a trial has been recorded
      if (this.$vuetify.breakpoint.mdAndDown && (!this.showOpenInAppButton || this.hasRecordedTrial)) {
        this.leftMenuOpen = true
      }

      this.loadTrialTags()

      // Check if something went wrong with loading session. Usually there was a redirect to Login page.
      if (this.session.id == undefined) {
        return
      }
      // Get number of expected cameras. Skip for monocular sessions (no calibration).
      if (this.isMonocularSession) {
        this.n_calibrated_cameras = 1
      } else {
        try {
          const res = await axios.get(`/sessions/${this.session.id}/get_n_calibrated_cameras/`, {})
          this.n_calibrated_cameras = res.data.data
        } catch (e) {
          this.n_calibrated_cameras = 0
        }
      }
  
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
      this.bindControlGestureGuards()
    },
    beforeDestroy() {
      this.cancelPoll()
      this.cancelRecordTimer()
      this.cancelRecordingStatusPoll()
      this.cancelTrialsPoll()
  
      if (this.resizeObserver) {
        this.resizeObserver.unobserve(this.$refs.mocap)
      }

      // Remove keyboard event listener
      window.removeEventListener('keydown', this.handleKeyboard)
      this.unbindControlGestureGuards()
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
      showOpenInAppButton: {
        handler(val) {
          if (val && this.$vuetify.breakpoint.mdAndDown && !this.hasRecordedTrial) {
            this.leftMenuOpen = false
          }
        }
      },
      hasRecordedTrial: {
        handler(val) {
          if (val && this.$vuetify.breakpoint.mdAndDown && !this.showOpenInAppButton) {
            this.leftMenuOpen = true
          }
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
      bindControlGestureGuards() {
        this.controlGestureGuard = (event) => {
          const target = event.target
          if (!target || !target.closest || !target.closest('.ui-no-zoom')) {
            return
          }

          if (event.type === 'touchmove') {
            if (event.touches && event.touches.length > 1) {
              event.preventDefault()
            }
            return
          }

          event.preventDefault()
        }

        document.addEventListener('gesturestart', this.controlGestureGuard, { passive: false })
        document.addEventListener('gesturechange', this.controlGestureGuard, { passive: false })
        document.addEventListener('touchmove', this.controlGestureGuard, { passive: false })
      },
      unbindControlGestureGuards() {
        if (!this.controlGestureGuard) {
          return
        }

        document.removeEventListener('gesturestart', this.controlGestureGuard)
        document.removeEventListener('gesturechange', this.controlGestureGuard)
        document.removeEventListener('touchmove', this.controlGestureGuard)
        this.controlGestureGuard = null
      },
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
                if (this.n_calibrated_cameras === 0) {
                  const noCamMsg = "There are no calibrated cameras for this trial."
                  apiError(noCamMsg)
                  throw new Error(noCamMsg)
                }

                // Transition to recording state
                this.state = 'recording';

                // If too many cameras connected (e.g. monocular with multiple devices), cancel immediately
                if (this.n_cameras_connected > this.n_calibrated_cameras) {
                    const res_stop = await axios.get(`/sessions/${this.session.id}/stop/`, {})
                    const res_cancel = await axios.get(`/sessions/${this.session.id}/cancel_trial/`, {})
                    this.cancelPoll()
                    this.cancelRecordingStatusPoll()
                    this.state = 'ready'
                    this.trialInProcess.status = "error"
                    const msg = this.n_calibrated_cameras === 1
                        ? `${this.n_cameras_connected} camera${this.n_cameras_connected === 1 ? '' : 's'} connected. Monocular mode works with 1 camera. Please use only one device.`
                        : `${this.n_cameras_connected} cameras connected. Too many for this session.`
                    this.sessionNotification = { show: true, text: msg, type: 'error' }
                    apiError(msg)
                    throw new Error(msg)
                }

                // Check if the appropriate number of cameras is connected.
                const startTime = Date.now();
                while (this.n_cameras_connected !== this.n_calibrated_cameras) {
                    if (Date.now() - startTime > 5000) { // 5-second timeout
                        const res_stop = await axios.get(`/sessions/${this.session.id}/stop/`, {})
                        const res_cancel = await axios.get(`/sessions/${this.session.id}/cancel_trial/`, {})
                        this.cancelPoll()
                        this.cancelRecordingStatusPoll()
                        this.state = 'ready'
                        this.trialInProcess.status = "error"
                        const timeoutMsg = this.n_cameras_connected > this.n_calibrated_cameras
                            ? (this.n_calibrated_cameras === 1 ? `${this.n_cameras_connected} camera${this.n_cameras_connected === 1 ? '' : 's'} connected. Monocular mode works with 1 camera. Please use only one device.` : `${this.n_cameras_connected} cameras connected. Too many for this session.`)
                            : "Connected cameras do not match calibrated cameras. Timeout while waiting for cameras to connect."
                        throw new Error(timeoutMsg)
                    }

                    // Retry fetching the status
                    await new Promise(r => setTimeout(r, 500)); // Wait before retrying
                    const retryRes = await axios.get(`/sessions/${this.session.id}/status/`, {});
                    this.n_cameras_connected = retryRes.data.n_cameras_connected;
                }

                this.sessionNotification = { show: false, text: '', type: 'error' }

                // Start recording timer.
                this.recordingStarted = moment()
                this.recordingTimePassed = 0
                this.recordingTimer = window.setTimeout(this.recordTimerHandler, 500)
                this.startRecordingStatusPoll()

                // Play sound indicating the subject can start motion.
                if (this.isAuditoryFeedbackEnabled)
                  playRecordingSound()
              } catch (error) {
                const msg = error?.message || (typeof error === 'string' ? error : String(error))
                this.sessionNotification = { show: true, text: msg, type: 'error' }
                apiError(error)
              }
  
              this.busy = false
            }
  
            break
          }
          case 'recording': {
            this.cancelRecordTimer()
            this.cancelRecordingStatusPoll()

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
      startRecordingStatusPoll() {
        this.cancelRecordingStatusPoll()
        const poll = async () => {
          if (this.state !== 'recording') return
          try {
            const res = await axios.get(`/sessions/${this.session.id}/status/`)
            this.n_cameras_connected = res.data.n_cameras_connected
            this.n_videos_uploaded = res.data.n_videos_uploaded

            if (this.n_cameras_connected > this.n_calibrated_cameras) {
              await axios.get(`/sessions/${this.session.id}/stop/`, {})
              await axios.get(`/sessions/${this.session.id}/cancel_trial/`, {})
              this.cancelRecordTimer()
              this.cancelRecordingStatusPoll()
              this.cancelPoll()
              this.state = 'ready'
              this.trialInProcess.status = 'error'
              const msg = this.n_calibrated_cameras === 1
                ? `${this.n_cameras_connected} camera${this.n_cameras_connected === 1 ? '' : 's'} connected. Monocular mode works with 1 camera. Please use only one device.`
                : `${this.n_cameras_connected} cameras connected. Too many for this session.`
              this.sessionNotification = { show: true, text: msg, type: 'error' }
              apiError(msg)
              return
            }
          } catch (e) {
            // Ignore poll errors
          }
          if (this.state === 'recording') {
            this.recordingStatusPoll = window.setTimeout(poll, 2000)
          }
        }
        this.recordingStatusPoll = window.setTimeout(poll, 2000)
      },
      cancelRecordingStatusPoll() {
        if (this.recordingStatusPoll) {
          window.clearTimeout(this.recordingStatusPoll)
          this.recordingStatusPoll = null
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
        this.$router.push({name: 'RecordingMode'})
      },
      openInApp() {
        if (this.sessionDeepLinkUrl) {
          window.location.href = this.sessionDeepLinkUrl
        }
      },
      getSameDeviceSessionStore() {
        if (typeof localStorage === 'undefined') return {}
        try {
          const raw = localStorage.getItem('opencap_same_device_sessions')
          if (!raw) return {}
          const parsed = JSON.parse(raw)
          return parsed && typeof parsed === 'object' ? parsed : {}
        } catch (error) {
          return {}
        }
      },
      setSameDeviceSessionStore(store) {
        if (typeof localStorage === 'undefined') return
        localStorage.setItem('opencap_same_device_sessions', JSON.stringify(store))
      },
      isSessionMarkedSameDevice(sessionId) {
        if (!sessionId) return false
        const store = this.getSameDeviceSessionStore()
        return store[sessionId] === true
      },
      persistSameDeviceSessionFlag() {
        if (this.$route.query.sameDevice !== 'true' || !this.session?.id) return
        const store = this.getSameDeviceSessionStore()
        store[this.session.id] = true
        this.setSameDeviceSessionStore(store)
      },
      setPublic(p) {
        console.log(p)
        axios.patch(`/sessions/${this.session.id}/`, {"public": p})
      },
      async newSessionSameSetup() {
        await this.initSessionSameSetup()
        const query = this.isMonocularSession ? { isMono: 'true', fromDevice: 'true' } : {}
        this.$router.push({name: 'Neutral', params: {id: this.session.id}, query})
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
                if (this.n_cameras_connected > this.n_calibrated_cameras) {
                  apiErrorRes(res.data, this.n_calibrated_cameras === 1 ? `${this.n_cameras_connected} camera${this.n_cameras_connected === 1 ? '' : 's'} connected. Monocular mode works with 1 camera. Please use only one device.` : `${this.n_cameras_connected} cameras connected. Too many for this session.`)
                } else {
                  const num_missing_cameras = this.n_calibrated_cameras - this.n_videos_uploaded
                  apiErrorRes(res.data, this.n_calibrated_cameras + " devices expected and " + this.n_videos_uploaded + " videos were uploaded. Please reconnect the missing " + num_missing_cameras + " devices to the session using the QR code at the top of the screen.");
                }
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
          try {
            const res = await axios.get(`/sessions/${this.session.id}/status/?ret_session=true`)
            const updatedTrials = res.data.session.trials || []

            // Add new trials and update existing ones
            updatedTrials.forEach(updatedT => {
              const existingIndex = this.session.trials.findIndex(t => t.id === updatedT.id)
              if (existingIndex < 0) {
                this.addTrial(updatedT)
              } else if (this.session.trials[existingIndex].status !== updatedT.status) {
                this.updateTrial(updatedT)
              }
            })
          } catch (e) {
            // Ignore poll errors (e.g. session no longer exists)
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
          this.showTrialMenuSheet = false;
          this.selectedTrialForMenu = null;
        }
      },
      openTrialMenuSheet(trial) {
        this.selectedTrialForMenu = trial;
        this.showTrialMenuSheet = true;
      },
      closeMenuAndRename(t) { t.isMenuOpen = false; this.renameTrialDialog(t); },
      closeMenuAndAnalysis(t) { t.isMenuOpen = false; this.analysisDialog(t); },
      closeMenuAndEditTags(t) { t.isMenuOpen = false; this.addTagTrialDialog(t); },
      closeMenuAndOpenTrashDialog(t) { t.isMenuOpen = false; this.trialForTrashDialog = t; this.remove_dialog = true; },
      closeMenuAndOpenRestoreDialog(t) { t.isMenuOpen = false; this.trialForRestoreDialog = t; this.restore_dialog = true; },
      closeMenuAndOpenDeleteDialog(t) { t.isMenuOpen = false; this.trialForPermanentDeleteDialog = t; this.permanent_delete_dialog = true; },
      closeSheetAndRename(t) { this.showTrialMenuSheet = false; this.selectedTrialForMenu = null; this.renameTrialDialog(t); },
      closeSheetAndAnalysis(t) { this.showTrialMenuSheet = false; this.selectedTrialForMenu = null; this.analysisDialog(t); },
      closeSheetAndEditTags(t) { this.showTrialMenuSheet = false; this.selectedTrialForMenu = null; this.addTagTrialDialog(t); },
      closeSheetAndOpenTrashDialog(t) { this.showTrialMenuSheet = false; this.selectedTrialForMenu = null; this.trialForTrashDialog = t; this.remove_dialog = true; },
      closeSheetAndOpenRestoreDialog(t) { this.showTrialMenuSheet = false; this.selectedTrialForMenu = null; this.trialForRestoreDialog = t; this.restore_dialog = true; },
      closeSheetAndOpenDeleteDialog(t) { this.showTrialMenuSheet = false; this.selectedTrialForMenu = null; this.trialForPermanentDeleteDialog = t; this.permanent_delete_dialog = true; },
      closeTrashDialog() {
        this.trialForTrashDialog = null;
        this.remove_dialog = false;
        for (let t of this.filteredTrialsWithMenu) t.isMenuOpen = false;
      },
      closeRestoreDialog() {
        this.trialForRestoreDialog = null;
        this.restore_dialog = false;
        for (let t of this.filteredTrialsWithMenu) t.isMenuOpen = false;
      },
      closePermanentDeleteDialog() {
        this.trialForPermanentDeleteDialog = null;
        this.permanent_delete_dialog = false;
        for (let t of this.filteredTrialsWithMenu) t.isMenuOpen = false;
      },
      confirmTrashTrial() {
        if (this.trialForTrashDialog) {
          this.trashTrial(this.trialForTrashDialog);
          this.closeTrashDialog();
        }
      },
      confirmRestoreTrial() {
        if (this.trialForRestoreDialog) {
          this.restoreTrial(this.trialForRestoreDialog);
          this.closeRestoreDialog();
        }
      },
      confirmPermanentDeleteTrial() {
        if (this.trialForPermanentDeleteDialog) {
          this.permanentDeleteTrial(this.trialForPermanentDeleteDialog);
          this.closePermanentDeleteDialog();
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
          const width = container.clientWidth || container.offsetWidth
          const height = container.clientHeight || container.offsetHeight
          
          if (width > 0 && height > 0) {
            this.renderer.setSize(width, height)
            
            if (this.camera) {
              this.camera.aspect = width / height
              this.camera.updateProjectionMatrix()
            }
          }
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
          if (this.loopPlayback) {
            this.videos.forEach((video, index) => {
              const vid_element = this.videoElement(index)
              vid_element.currentTime = 0
              vid_element.play()
            })
          } else {
            this.togglePlay(false)
          }
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
      toggleLoopPlayback() {
        this.loopPlayback = !this.loopPlayback
      },
      cycleMobileVideoSize() {
        this.mobileVideoSizeIndex = (this.mobileVideoSizeIndex + 1) % 3
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

  /* Trial context menu - prevent overflow on small screens */
  .trial-context-menu {
    max-width: min(320px, calc(100vw - 24px));
  }

  /* Analysis submenu - adequate touch targets and width on mobile */
  .analysis-submenu {
    min-width: 180px;
    max-width: min(260px, calc(100vw - 32px));
  }
  .analysis-submenu-list .v-list-item {
    min-height: 48px;
  }
  .analysis-menu-btn {
    min-width: 48px !important;
    min-height: 48px !important;
  }

  /* Trial menu bottom sheet - safe area for notched phones */
  .trial-menu-sheet {
    padding-bottom: env(safe-area-inset-bottom, 0);
    background-color: #546E7A !important; /* blue-grey 700 - muted, modern */
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    overflow: hidden;
  }
  .trial-menu-sheet .v-list {
    background-color: transparent !important;
  }
  .trial-menu-sheet .v-list-item {
    justify-content: center !important;
  }
  .trial-menu-sheet .v-list-item__content {
    flex: 0 0 auto !important;
    flex-direction: row !important;
  }
  
  .text-orange {
    color: orange !important;
  }

  .ui-no-zoom {
    touch-action: pan-x pan-y;
    -webkit-user-select: none;
    user-select: none;
  }
  
  .step-5 {
    position: fixed;
    top: var(--app-bar-height, 64px);
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    z-index: 1;
    background-color: #000;
    
.main-content {
      min-width: 0;
      flex: 1 1 auto;
      display: flex;
      flex-direction: row;
      overflow: hidden;
      position: relative;
    }
  
    .mobile-menu-toggle {
      position: fixed;
      top: calc(var(--app-bar-height, 56px) + 8px);
      left: 8px;
      z-index: 100;
      background-color: #424242 !important;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
      border-radius: 8px !important;
      min-width: 48px !important;
      width: 48px !important;
      min-height: 48px !important;
      height: 48px !important;

      .v-icon {
        font-size: 28px !important;
      }

      @media (min-width: 1280px) {
        display: none !important;
      }
    }
    
    .mobile-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 98;
      
      @media (min-width: 1280px) {
        display: none !important;
      }
    }
    
    .left-wrapper {
      min-width: 0;
      flex-shrink: 0;
      position: relative;
      z-index: 99;
      display: flex;

      @media (min-width: 1280px) {
        /* Desktop: just a flex container */
      }

      @media (max-width: 1279px) {
        position: fixed;
        top: var(--app-bar-height, 56px);
        left: 0;
        bottom: 0;
        width: 280px;
        max-width: 85vw;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
        overflow: visible;

        &.mobile-open {
          transform: translateX(0);
        }
      }
    }

    .left {
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      flex: 1;
      display: flex;
      flex-direction: column;

      @media (min-width: 1280px) {
        width: 250px;
        height: 100%;
        background-color: #000000;
      }

      @media (max-width: 1279px) {
        width: 100%;
        height: 100%;
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
        padding-top: 48px;
        background-color: rgb(18, 18, 18);
      }

      .left-scroll {
        min-height: 0;
        flex: 1 1 auto;
        overflow-y: auto;
        overflow-x: hidden;
        padding-bottom: 12px;
      }

      .session-actions-toggle {
        margin-top: 8px;
        flex-shrink: 0;
        width: 100% !important;
        min-width: 0;
        box-sizing: border-box;
        height: 36px !important;
        min-height: 36px !important;

        @media (max-width: 599px) {
          height: 44px !important;
          min-height: 44px !important;
        }
      }

      .session-actions-panel {
        flex-shrink: 0;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .trials-wrapper {
        min-height: 0;
        overflow: visible;
      }

      .trial-name-row {
        gap: 8px;
      }

      .show-removed-trials-sidebar {
        flex-shrink: 0;
      }

      .toolbar-checkbox {
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

      .session-action-btn {
        width: 100%;
        height: 36px !important;
        min-height: 36px !important;
        font-size: 0.9375rem !important;

        @media (max-width: 599px) {
          height: 44px !important;
          min-height: 44px !important;
        }
      }

      .trials {
        overflow-y: visible;
        flex-grow: 0;
  
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

    .sidebar-toggle-btn {
      position: absolute;
      top: 50%;
      right: -16px;
      transform: translateY(-50%);
      z-index: 103;
      background-color: #424242 !important;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
      min-width: 34px !important;
      max-width: 34px !important;
      width: 34px !important;
      min-height: 34px !important;
      max-height: 34px !important;
      height: 34px !important;
      padding: 0 !important;
      border-radius: 50% !important;
      aspect-ratio: 1;

      .v-icon {
        font-size: 22px !important;
      }

      @media (min-width: 1280px) {
        display: none !important;
      }
    }
  
    .viewer {
      flex: 1 1 auto;
      min-height: 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
  
      #mocap {
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        flex: 1 1 auto;
        touch-action: none;
  
        canvas {
          width: 100% !important;
          height: 100% !important;
        }
      }

      .session-empty-state {
        flex: 1 1 auto;
        min-height: 0;
        color: rgba(255, 255, 255, 0.86);

        h3 {
          font-size: 1.4rem;
          font-weight: 500;
        }

        p {
          max-width: 420px;
          color: rgba(255, 255, 255, 0.72);
        }
      }
    }
  
    .right {
      flex-shrink: 0;
      min-width: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      .mobile-video-toolbar {
        padding: 0;
        margin-top: 8px;
      }

      .cam-size-overlay {
        position: absolute;
        bottom: 8px;
        right: 8px;
        z-index: 10;
        text-transform: none;
        min-width: unset !important;
        width: auto !important;
        height: auto !important;
        min-height: unset !important;
        font-size: 0.7rem;
        white-space: nowrap;
        background-color: rgba(0, 0, 0, 0.7) !important;
        backdrop-filter: blur(4px);
        padding: 4px 10px !important;

        @media (max-width: 959px) {
          bottom: calc(142px + env(safe-area-inset-bottom, 0px));
          padding-bottom: max(4px, env(safe-area-inset-bottom, 0px));
        }
      }
  
      @media (max-width: 959px) {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 120px;
        min-width: 100px;
        max-width: 35%;
        height: auto;
        z-index: 1;
      }
  
      @media (min-width: 960px) {
        position: absolute;
        right: 0;
        top: 0;
        bottom: var(--video-controls-height, 90px);
        flex: none;
        width: 200px;
        max-height: none;
        height: auto;
        z-index: 1;
      }
  
      .videos {
        overflow-y: auto;
        overflow-x: hidden;
        width: 100%;
        display: flex;
        flex-direction: column;
        padding: 0;
        margin: 0;
        min-height: 0;
        flex: 1 1 0;
        
        @media (min-width: 960px) {
          width: 100%;
          padding: 0;
          margin: 0;
        }

        @media (max-width: 959px) {
          align-items: flex-end;
          padding-bottom: 120px;
        }
      }

      .right-spacer {
        flex: 1 1 auto;
        min-height: 0;
        pointer-events: none;

        @media (max-width: 959px) {
          flex: 0 0 0;
          min-height: 0;
          overflow: hidden;
        }

        @media (min-width: 960px) {
          flex: 0 0 0;
          background: transparent;
        }
      }
      
      .video-element {
        width: 100%;
        height: auto;
        object-fit: contain;
        background-color: transparent;
        margin: 0;
        padding: 0;
        display: block;
        
        @media (max-width: 959px) {
          width: 100%;
          object-position: right center;
          max-height: var(--mobile-video-max-height, 120px);
        }
        
        @media (min-width: 960px) {
          max-height: none;
        }
      }
      
      .playback-controls {
        flex-shrink: 0;
        padding: 8px;
        background-color: rgba(0, 0, 0, 0.3);
        border-top: 1px solid rgba(255, 255, 255, 0.1);

        .playback-controls-row {
          display: flex;
          align-items: center;
        }

        .playback-navigation {
          flex: 1 1 auto;
          min-width: 0;
        }

      .playback-speed {
        flex: 0 0 auto;
      }

      .playback-timeline-mobile {
        margin-top: 4px;

        .time-input {
          flex: 0 0 70px !important;
          width: 70px !important;
          max-width: 70px !important;
          min-width: 70px !important;
        }

        .timeline-slider {
          flex: 1 1 auto;
          min-width: 0;
        }
      }

        .playback-video-size {
          flex: 0 0 auto;
          text-transform: none;
          min-width: 70px;
          margin-right: 4px;
        }
        
        @media (max-width: 959px) {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 50;
          background-color: var(--bottom-toolbar-bg);
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          padding: 6px 8px;
          padding-bottom: calc(6px + env(safe-area-inset-bottom, 0px));
        }
      }
    }

    .video-controls {
      width: 100%;
      gap: 8px;
      position: relative;
      z-index: 2;
      flex-shrink: 0;
      min-height: 86px;

      @media (max-width: 959px) {
        /* Hide desktop controls on mobile - they duplicate the mobile fixed bar */
        display: none !important;
      }

      @media (min-width: 960px) {
        gap: 12px;
      }

      @media (max-width: 599px) {
        flex-wrap: nowrap;
      }

      .timeline-slider {
        min-width: 140px;
      }
      
      .time-input {
        min-width: 100px;
        max-width: 150px;
        margin-right: 8px;
        
        @media (max-width: 599px) {
          min-width: 0;
          width: 48px;
          max-width: 48px;
          margin-right: 8px;
          margin-bottom: 0;
        }
      }

      .playback-controls-inline {
        flex: 0 0 auto;
        min-width: max-content;
      }

      @media (min-width: 960px) {
        .timeline-slider {
          margin-bottom: 0 !important;
        }

        .time-input {
          margin-right: 0;
          min-width: 108px;
          max-width: 130px;
        }
      }
    }

    .open-in-app-center {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10;
      padding: 24px;
      /* Let clicks pass through the overlay except for the explicit button */
      pointer-events: none;

      h2 {
        font-size: 1.75rem;
        font-weight: 500;
      }

      p {
        font-size: 1rem;
        opacity: 0.9;
        max-width: 400px;
      }

      .open-in-app-btn {
        font-size: 1.1rem;
        padding: 16px 32px;
        height: auto;
        /* Make only the button clickable */
        pointer-events: auto;
      }

      .open-in-app-store-link {
        color: #ffcc80;
        text-decoration: underline;
        text-underline-offset: 2px;
        pointer-events: auto;
      }
    }
  }

  .monocular-beta-alert {
    font-size: 0.85rem;
  }
  .monocular-beta-alert a {
    color: #64b5f6;
    text-decoration: underline;
  }
  .monocular-beta-alert a:hover {
    color: #90caf9;
  }
  </style>
  
  
