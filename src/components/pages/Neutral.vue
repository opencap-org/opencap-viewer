\<template>
  <MainLayout
    :step="4"
    :fixedHeight="false"
    :rightDisabled="busy || disabledNextButton"
    @left="$router.push(`/${session.id}/calibration`)">

    <!-- Ensure MainLayout's own slots are effectively empty or hidden -->
    <template v-slot:left><div class="d-none"></div></template>
    <template v-slot:right><div class="d-none"></div></template>

    <div class="neutral-wrapper">
      <div class="neutral-content">
        <v-card v-if="imgs" class="step-4-1 pa-2 d-flex flex-column">
          <v-card-title class="justify-center"> Verify neutral pose </v-card-title>

          <v-card-text class="d-flex flex-grow-1 scroll-y">
            <div
              v-for="(imgCol, colIndex) in imgCols"
              :key="colIndex"
              class="d-flex flex-column"
            >
              <img
                v-for="(img, imgIndex) in imgCol"
                :key="imgIndex"
                :src="img"
                width="150"
                class="ma-1"
              />
            </div>
          </v-card-text>
        </v-card>

        <div v-else class="neutral-layout">
          <div class="left-column" :class="{ 'full-width': isMonocularMode }">
            <div class="cards-row d-flex flex-column">
              <v-card class="mb-4 session-info-card">
                <v-card-title class="justify-center subject-title">
                  Session Info
                </v-card-title>
                  <v-card-text>
                    <v-row align="center">
                      <v-col cols="10">
                        <v-autocomplete
                          ref="selectSubjectsRef"
                          required
                          v-model="subject"
                          item-text="display_name"
                          item-value="id"
                          label="Subject"
                          :items="loaded_subjects"
                          :loading="subject_loading"
                          :search-input.sync="subject_search"
                          return-object
                          dense
                        >
                          <template v-slot:append-item>
                            <div v-intersect="loadNextSubjectsListPage" />
                          </template>
                          <template v-slot:selection>{{ subject.display_name }}</template>
                        </v-autocomplete>
                      </v-col>
                      <v-col cols="1">
                        <v-btn
                          icon
                          small
                          @click="openNewSubjectPopup">
                          <v-icon>mdi-plus</v-icon>
                        </v-btn>
                      </v-col>
                    </v-row>
                    <v-text-field
                      v-model="sessionName"
                      label="Session Name (optional)"
                      type="text"
                      required
                      :error="formErrors.name != null"
                      :error-messages="formErrors.name"
                      dense
                    ></v-text-field>
                  </v-card-text>
              </v-card>

              <v-card class="mb-4 data-sharing-card">
                <div class="d-flex justify-center">
                  <v-card-title class="justify-center data-title">
                    Data sharing agreement
                  </v-card-title>
                  <v-tooltip bottom="">
                    <template v-slot:activator="{ on }">
                      <v-icon v-on="on"> mdi-help-circle-outline </v-icon>
                    </template>
                    The information on this page as well as videos of your movement are
                    uploaded to a secure cloud server for processing. Please have the
                    subject select their data sharing preferences below. Identified
                    videos do not have the face blurred, de-identified videos have faces
                    blurred, and processed data (e.g., joint angles) is de-identified.
                    Please read our privacy terms for details.
                  </v-tooltip>
                </div>

                <v-card-text class="d-flex flex-column align-center checkbox-wrapper">
                  <ValidationObserver
                    tag="div"
                    class="d-flex flex-column checkbox-box"
                    ref="observer"
                  >
                    <v-checkbox
                      v-model="data_sharing_0"
                      @click="isAllInputsValid"
                      label="The subject understands that the recorded identified videos and processed data are stored in secure PHI-compliant storage and agrees to share them with the OpenCap development team for algorithm development. We may use this data in scientific publications, but will only publicly share the data that the subject agrees to share below."
                      :rules="[checkboxRule]"
                      required=""
                      dense
                    ></v-checkbox>

                    <ValidationProvider
                      rules="required"
                      v-slot="{ errors }"
                      name="Data sharing agreement"
                    >
                      <v-select
                        v-model="data_sharing"
                        label="Please select which data the subject is willing to share publicly; we encourage the subject to share as much as they feel comfortable."
                        @change="isAllInputsValid"
                        :items="data_sharing_choices"
                        :error="errors.length > 0"
                        :error-messages="errors[0]"
                        dense
                      />
                    </ValidationProvider>
                  </ValidationObserver>
                </v-card-text>
              </v-card>
            </div>
      
            <div class="advanced-settings-row d-flex justify-center" v-if="!isMonocularMode">
                <v-btn
                  color="primary-dark"
                  class="mt-4 mb-4"
                  x-large
                  @click="openAdvancedSettings"
                >
                  Advanced Settings
                </v-btn>

                  <v-dialog
                    v-model="advancedSettingsDialog"
                    scrollable
                    :width="$vuetify.breakpoint.smAndDown ? '95%' : '700px'"
                    :max-height="$vuetify.breakpoint.smAndDown ? '90vh' : '90vh'"
                    content-class="advanced-settings-dialog"
                  >
                    <v-card class="advanced-settings-card">
                      <v-card-actions class="justify-end">
                        <v-btn color="primary-dark" @click="advancedSettingsDialog = false">✖</v-btn>
                      </v-card-actions>

                      <v-card-title class="justify-center data-title">
                        <span class="mr-2">Scaling setup</span>
                        <v-tooltip bottom="" max-width="500px">
                          <template v-slot:activator="{ on }">
                            <v-icon v-on="on"> mdi-help-circle-outline </v-icon>
                          </template>
                          OpenCap uses data from the neutral pose to scale the musculoskeletal model to the anthropometry of the subject.
                          By default, OpenCap assumes that the subject is standing with an upright posture and the feet pointing forward (i.e., straight back and no bending or rotation at the hips, knees, or ankles) as shown in the example neutral pose. These assumptions are modeled in the OpenSim scaling setup.
                          If the subject cannot adopt this pose, you can select the "Any pose" scaling setup, which does not assume any specific posture but still requires all body segments to be visible by at least two cameras.
                          We recommend using the default scaling setup unless the subject cannot adopt the upright standing neutral pose.
                        </v-tooltip>
                      </v-card-title>
                      <v-card-text class="d-flex flex-column align-center checkbox-wrapper">
                        <v-select
                            v-model="scaling_setup"
                            label="Select scaling setup"
                            :items="scaling_setups"
                            item-text="text"
                            item-value="value"
                          />
                      </v-card-text>

                      <v-card-title class="justify-center data-title">
                        <span class="mr-2">Human pose estimation model</span>
                        <v-tooltip bottom="" max-width="500px">
                          <template v-slot:activator="{ on }">
                            <v-icon v-on="on"> mdi-help-circle-outline </v-icon>
                          </template>
                          OpenCap supports two human pose estimation models: OpenPose and HRNet. We recommend using OpenPose for computation speed, but both models provide similar accuracy.
                          OpenPose is restricted to academic or non-profit organization non-commercial research use (consult the license at https://github.com/CMU-Perceptual-Computing-Lab/openpose/blob/master/LICENSE).
                          HRNet, as implemented by Open-MMLab, has a permissive Apache 2.0 license (consult the license at https://github.com/open-mmlab/mmpose/blob/master/LICENSE).
                          Please ensure that you have the rights to use the model you select. The OpenCap authors deny any responsibility regarding license infringement.
                        </v-tooltip>
                      </v-card-title>
                      <v-card-text class="d-flex flex-column align-center checkbox-wrapper">
                        <v-select
                            v-model="pose_model"
                            label="Select human pose estimation model"
                            :items="pose_models"
                            item-text="text"
                            item-value="value"
                          />
                      </v-card-text>
  
                      <v-card-title class="justify-center data-title">
                        <span class="mr-2">Framerate</span>
                        <v-tooltip bottom="" max-width="500px">
                          <template v-slot:activator="{ on }">
                            <v-icon v-on="on"> mdi-help-circle-outline </v-icon>
                          </template>
                          The framerate determines the number of frames per second at which the videos are recorded. Higher framerates provide more temporal resolution but reduce the maximum recording time.
                        </v-tooltip>
                      </v-card-title>
                      <v-card-text class="d-flex flex-column align-center checkbox-wrapper">
                        <v-select
                            v-model="framerate"
                            label="Select framerate"
                            :items="framerates_available"
                            item-text="text"
                            item-value="value"
                            @change="updateFrequency"
                          />
                      </v-card-text>

                      <v-card-title class="justify-center data-title">
                        <span class="mr-2">Musculoskeletal model</span>
                        <v-tooltip bottom="" max-width="500px">
                          <template v-slot:activator="{ on }">
                            <v-icon v-on="on"> mdi-help-circle-outline </v-icon>
                          </template>
                          Full body model: Musculoskeletal model with 33 degrees of freedom from Lai et al. 2017 (https://pubmed.ncbi.nlm.nih.gov/28900782/) with modified hip abductor muscle paths from Uhlrich et al. 2022 (https://pubmed.ncbi.nlm.nih.gov/35798755/). Recommended for primarily lower extremity tasks (e.g., gait).
                          <br><br>
                          Full body model with ISB shoulder: Incorporates a 6 degree-of-freedom shoulder complex joint. It incorporates a scapulothoracic body with 3 translational degrees of freedom relative to the torso. The glenohumoral joint uses the Y-X-Y rotation sequence (elevation plane, elevation, rotation) recommended by the ISB (https://pubmed.ncbi.nlm.nih.gov/15844264/). Recommended for upper extremity tasks (e.g., pitching).
                        </v-tooltip>
                      </v-card-title>
                      <v-card-text class="d-flex flex-column align-center checkbox-wrapper">
                        <v-select
                            v-model="openSimModel"
                            label="Select musculoskeletal model"
                            :items="openSimModels"
                            item-text="text"
                            item-value="value"
                          />
                      </v-card-text>

                      <v-card-title class="justify-center data-title">
                        <span class="mr-2">Marker augmenter model</span>
                        <v-tooltip bottom="" max-width="500px">
                          <template v-slot:activator="{ on }">
                            <v-icon v-on="on"> mdi-help-circle-outline </v-icon>
                          </template>
                          OpenCap uses an LSTM model, also called marker augmenter model, to predict the 3D position of 43 anatomical markers from the 3D position of 20 video keypoints (https://www.biorxiv.org/content/10.1101/2022.07.07.499061v1). 
                          The anatomical markers are used as input to OpenSim to compute joint angles using inverse kinematics.
                          <br><br>
                          The latest model (v0.3, default) is more accurate and more robust to different activities than v0.2. We recommend using it for new studies. 
                          It was trained on 1475 hours of motion capture data and resulted in an RMSE of 4.4 +/- 0.3 deg (OpenPose) and 4.1 +/- 0.3 deg (HRnet) for joint angles across 18 degrees of freedom.
                          <br><br>                  
                          The original model (v0.2) underwent training using 708 hours of motion capture data, yielding an RMSE of 4.8 +/- 0.2 deg (OpenPose and HRNet) for joint angles across 18 degrees of freedom. 
                          <br><br>
                          The performance evaluation was conducted in comparison to marker-based motion capture using data from 10 subjects performing 4 different types of activities (walking, squatting, sit-to-stand, and drop jumps). 
                          The dataset used for training the latest model (v0.3) contains data from more subjects and from a more diverse set of tasks; model v0.3 is therefore expected to be more accurate for a wider variety of tasks and to yield more accurate results.
                          We recommend using v0.3 for new studies but warn users that we might still adjust the model in the future. 
                          If you would like to use the model that was default prior to 07-30-2023, select v0.2.
                        </v-tooltip>
                      </v-card-title>
                      <v-card-text class="d-flex flex-column align-center checkbox-wrapper">
                        <v-select
                            v-model="augmenter_model"
                            label="Select marker augmenter model"
                            :items="augmenter_models"
                            item-text="text"
                            item-value="value"
                          />
                      </v-card-text>

                      <v-card-title class="justify-center data-title">
                        <span class="mr-2">Filter frequency</span>
                        <v-tooltip bottom="" max-width="500px">
                          <template v-slot:activator="{ on }">
                            <v-icon v-on="on"> mdi-help-circle-outline </v-icon>
                          </template>
                          OpenCap uses a low-pass Butterworth filter to smooth the 2D video keypoints. The filter frequency is the cutoff frequency of the filter.
                          <br><br>                  
                          By default, OpenCap uses a filter frequency of half the framerate (if the framerate is 60fps, the filter frequency is 30Hz), except for gait activities, for which the filter frequency is 12Hz.
                          <br><br>
                          You can here enter a different filter frequency. WARNING: this filter frequency will be applied to ALL motion trials of your session. As per the Nyquist Theorem, the filter frequency should be less than half the framerate.
                          If you enter a filter frequency higher than half the framerate, we will use half the framerate as the filter frequency instead.
                          <br><br>
                          We recommend consulting the literature to find a suitable filter frequency for your specific tasks. If you are unsure, we recommend using the default filter frequency.
                        </v-tooltip>
                      </v-card-title>
                      <v-card-text class="d-flex flex-column align-center checkbox-wrapper">
                        <v-combobox
                        :key="componentKey"
                        v-model="tempFilterFrequency"
                        label="Enter frequency (Hz) or choose default"
                        :items="filter_frequencies"
                        :allow-custom="true"
                        :return-object="false"
                        @change="validateAndSetFrequency"
                        item-text="text"
                        item-value="value"
                        ></v-combobox>
                      </v-card-text>
                    </v-card>
                  </v-dialog>
            </div>
          </div>

          <v-card v-if="!isMonocularMode" class="step-4-2 ml-4 d-flex images-box right-column">
            <v-card class="mb-0">
              <v-card-text style="padding-top: 5px; padding-bottom: 0; font-size: 16px;">
              <p>{{ n_videos_uploaded }} of {{ n_calibrated_cameras }} videos uploaded</p>
              </v-card-text>
            </v-card>

            <v-card-title class="justify-center">
              Record neutral pose
            </v-card-title>
            
            <v-card-text class="d-flex justify-center align-center record-pose-content">
              <div class="d-flex flex-column mr-4 record-pose-instructions">
                <ul>
                  <li>
                    The subject should adopt the example neutral pose
                    <ul>
                      <li class="space-above-small">Upright standing posture with feet pointing forward</li>
                      <li class="space-above-small">Straight back and no bending or rotation at the hips, knees, or ankles</li>
                    </ul>
                  </li>
                  <li class="space-above-small">The subject should stand still</li>
                  <li class="space-above-small">
                    The subject should be visible by all cameras 
                    <ul>
                      <li class="space-above-small">Nothing in the way
                        of cameras view when hitting Record</li>
                    </ul>
                  </li>
                </ul>
              </div>
              <div class="d-flex flex-column align-center ">
                <span class="sub-header" style="font-size: 18px;">Example neutral pose</span>
                <ExampleImage
                  image="/images/step-4/big_good_triangle.jpg"
                  :width="256"
                  :height="341"
                  good
                />
              </div>
            </v-card-text>
            <v-card-title class="justify-center record-pose-footer-title">
              If the subject cannot adopt the example neutral pose, select "Any pose" scaling setup under Advanced Settings
            </v-card-title>
          </v-card>
        </div>
      </div>

      <!-- Custom navigation bar for Neutral page -->
      <div class="custom-navigation d-flex justify-space-between align-center mt-3 w-100 flex-nowrap">
            <v-btn class="same-width" @click="navigateBack">
              Back
            </v-btn>
            <v-btn class="same-width"
              :disabled="busy || disabledNextButton"
              :loading="busy && !imgs"
              @click="isMonocularMode ? skipProcessingToMonocular() : onNext()">
              Next
            </v-btn>
          </div>
    </div>
  
    <DialogComponent
      ref="dialogRef"
      @subject-added="submitAddSubject"
    />

  </MainLayout>
</template>

<script>
import axios from "axios";
import { mapMutations, mapActions, mapState } from "vuex";
import { apiError, apiSuccess, apiErrorRes, apiWarning, apiInfo, clearToastMessages } from "@/util/ErrorMessage.js";
import { playNeutralFinishedSound } from "@/util/SoundMessage.js";
import MainLayout from "@/layout/MainLayout";
import ExampleImage from "@/components/ui/ExampleImage";
import DialogComponent from '@/components/ui/SubjectDialog.vue'

export default {
  name: "Neutral",
  components: {
    MainLayout,
    ExampleImage,
    DialogComponent
  },
  data() {
    return {
      isMonocularMode: false,
      formErrors: {
        name: null,
        weight: null,
        height: null,
        birth_year: null,
        data_sharing_agreement: null,
        subject_tags: null,
      },
      advancedSettingsDialog: false,
      selected: null,
      subject_query: "",
      subject_loading: false,
      subject_start: 0,
      loaded_subjects: [],
      sessionName: "",
      subject: null,
      identifier: "",
      weight: 70,
      height: 1.8,
      data_sharing_0: false,
      birth_year: "",
      data_sharing: "",
      sex: "",
      gender: "",
      data_sharing_choices: [
        "Share processed data and identified videos",
        "Share processed data and de-identified videos",
        "Share processed data",
        "Share no data",
      ],
      scaling_setup: 'upright_standing_pose',
      scaling_setups: [
        {"text": "Upright standing pose (recommended, default)", "value": "upright_standing_pose"},
        {"text": "Any pose (in beta, feedback welcome)", "value": "any_pose"},
      ],
      pose_model: 'hrnet',
      pose_models: [
        {"text": "HRNet (recommended, default)", "value": "hrnet"},
        {"text": "OpenPose (non-commercial research use only)", "value": "openpose"},
      ],
      framerate: 60,
      framerates_available: [
        {"text": "60fps (max recording time: 60s, default)", "value": 60},
      ],
      openSimModel: 'LaiUhlrich2022',
      openSimModels: [
        {"text": "Full body model (default)", "value": "LaiUhlrich2022"},
        {"text": "Full body model with ISB shoulder (in beta, feedback welcome)", "value": "LaiUhlrich2022_shoulder"},
      ],
      augmenter_model: 'v0.3',
      augmenter_models: [        
        {"text": "v0.3 (default)", "value": "v0.3"},
        {"text": "v0.2 (old model, default until 07-30-2023)", "value": "v0.2"},
      ],
      filter_frequency: 'default',
      filter_frequencies: [        
        {"text": "12Hz for gait, half the framerate otherwise (default)", "value": "default"},
      ],
      busy: false,
      disabledNextButton: true,
      imgs: null,
      lastPolledStatus: "",
      buttonCaptions: {
        recording: "Recording",
        uploading: "Processing",
        done: "Confirm",
        error: "Re-record",
        stopped: "Processing",
        processing: "Processing",
      },
      checkboxRule: (v) => !!v || 'The subject must agree to continue!',
      n_calibrated_cameras: 0,
      n_cameras_connected: 0,
      n_videos_uploaded: 0,
      tempFilterFrequency: 'default',
      componentKey: 0,
      isAuditoryFeedbackEnabled: false,
    };
  },
  created() {
    const storedValue = localStorage.getItem("auditory_feedback");
    this.isAuditoryFeedbackEnabled = storedValue === "true";
  },
  computed: {
    ...mapState({
      session: state => state.data.session,
      trialId: state => state.data.trialId,
      genders: state => state.data.genders,
      sexes: state => state.data.sexes,
      username: state => state.auth.username,
    }),
    subjectSelectorChoices() {
      return this.subjectsMapped;
    },
    rightButtonCaption() {
      return this.imgs
        ? "Confirm"
        : this.busy
        ? this.lastPolledStatus
          ? this.buttonCaptions[this.lastPolledStatus]
          : "Record"
        : "Record";
    },
    imgCols() {
      let res = [];
      let iRes = null;
      for (let i = 0; i < this.imgs.length; i++) {
        if (i % 2 == 0) {
          iRes = [this.imgs[i]];
        } else {
          iRes.push(this.imgs[i]);
          res.push(iRes);
          iRes = null;
        }
      }
      if (iRes) {
        res.push(iRes);
      }
      return res;
    },
    smallWidth() {
      return 140;
    },
    smallHeight() {
      return this.smallWidth * 1.33;
    },
    errorsConsole() {
      return this.errors;
    },
    subject_search: {
      get() {
        return this.subject_query
      },
      set(value) {
        if (value !== null) {
          this.subject_query = value
          this.subject_start = 0
          this.loadSubjectsList(false)
      }
    }
    },
  },
  async mounted() {
    if (this.$route.query.isMono === 'true') {
      this.isMonocularMode = true;
    }
    if (!this.isMonocularMode) {
      apiInfo("You can now record a neutral pose different than the upright standing pose (e.g., sitting). Select 'Any pose' 'Advanced Settings'.", 8000);
    }
    this.loadSession(this.$route.params.id)
    if (this.$route.query.autoRecord) {
      this.onNext();
    }

    const res = await axios.get(`/sessions/${this.$route.params.id}/get_n_calibrated_cameras/`, {})

    this.n_calibrated_cameras = res.data.data
    this.loadSubjectsList(false)
  },
  watch: {
    subject (newVal, oldVal) {
      if (newVal === null) {
        this.clearSubjectSearch()
      }
    },
  },
  methods: {
    ...mapMutations("data", ["setNeutral", "setTrialId"]),
    ...mapActions("data", ["loadSubjects", "loadSession"]),
    navigateBack() {
      if (this.isMonocularMode) {
        if (this.$route.query.fromDevice === 'true') {
          this.$router.push({ name: 'DeviceCheck' });
        } else {
          this.$router.push(`/${this.session.id}/calibration`);
        }
      } else {
        this.$router.push(`/${this.session.id}/calibration`);
      }
    },
    isSomeInputInvalid(state, input) {
      setTimeout(() => {
        this.formErrors[input] = state;
      },0)
    },
    loadSubjectsList (append_result = false) {
      this.subject_loading = true
      let data = {
        search: this.subject_search,
        start: this.subject_start,
        quantity: 40,
        simple: 'true'
      }
      axios.get('/subjects/', {params: data}).then((res) => {
        if (append_result) {
          this.loaded_subjects = [...this.loaded_subjects, ...res.data.subjects]
        } else {
          this.loaded_subjects = res.data.subjects
        }
        this.subject_loading = false
      }).catch((error) => {
        this.subject_loading = false
        apiError(error)
      })

    },
    loadNextSubjectsListPage (isIntersecting) {
      if (isIntersecting) {
        this.loadSubjectsList(true)
        this.subject_start += 40
      }
    },
    clearSubjectSearch() {
      this.subject_search = ""
      this.subject_start = 0
      this.loadSubjectsList(false)
    },
    submitAddSubject (data) {
      let obj = {
        id: data.id,
        display_name: `${data.name} (${data.weight} Kg, ${data.height} m, ${data.birth_year})`,
      }
      this.loaded_subjects.push(obj)
      this.subject = obj
    },
    reloadSubjects() {
    },
    openNewSubjectPopup() {
        this.$refs.dialogRef.edit_dialog = true
    },
    isAllInputsValidSelectSubject() {
        this.formErrors = {
            name: null,
            weight: null,
            height: null,
            birth_year: null,
            subject_tags: null,
        }

        let inputsInvalidSecond;
        if(!this.subject || !this.data_sharing || !this.data_sharing_0 ) {
            inputsInvalidSecond = true
        }

        inputsInvalidSecond ? this.disabledNextButton = true : this.disabledNextButton = false
    },
    isAllInputsValid() {
        this.formErrors = {
            name: null,
            weight: null,
            height: null,
            birth_year: null,
            subject_tags: null,
        }

        let inputsInvalidSecond;
        if(this.subject === null || this.subject.id === 'new' || !this.subject || !this.data_sharing || !this.data_sharing_0 ) {
            inputsInvalidSecond = true
        }

        inputsInvalidSecond ? this.disabledNextButton = true : this.disabledNextButton = false
    },
    async onNext() {
      if (this.imgs) {
        this.$router.push({
          name: "Session",
          params: {
            id: this.session.id,
          },
          query: this.$route.query.fromDevice === 'true' ? { sameDevice: 'true' } : {},
        });
      } else {
        if (this.n_calibrated_cameras < 2) {
          if (this.n_calibrated_cameras < 1)
              apiError("No cameras have been calibrated. Please go back and calibrate your cameras.");
          else if (this.n_calibrated_cameras == 1)
              apiError("There is only 1 calibrated camera, but at least 2 cameras are necessary. Please go back and calibrate your cameras.");
        } else {
          if (await this.$refs.observer.validate()) {
            apiInfo("Recording...")
            this.lastPolledStatus = "";
            this.busy = true;
            this.setNeutral({
                subject: this.subject,
              data_sharing: this.data_sharing,
              scaling_setup: this.scaling_setup,
              pose_model: this.pose_model,
              framerate: this.framerate,
              openSimModel: this.openSimModel,
              augmenter_model: this.augmenter_model,
              filter_frequency: this.filter_frequency,
            });
            try {
              await axios.get(
                `/sessions/${this.session.id}/set_metadata/`,
                {
                  params: {
                    settings_data_sharing: this.data_sharing,
                    settings_scaling_setup: this.scaling_setup,
                    settings_pose_model: this.pose_model,
                    settings_framerate: this.framerate,
                    settings_session_name: this.sessionName,
                    settings_openSimModel: this.openSimModel,
                    settings_augmenter_model: this.augmenter_model,
                    settings_filter_frequency: this.filter_frequency,
                  },
                }
              );

              await axios.get(
                  `/sessions/${this.session.id}/set_subject/`,
                  {
                      params: {
                          subject_id: this.subject.id,
                      }
                  }
              )
              
              const res = await axios.get(
                `/sessions/${this.session.id}/record/`,
                {
                  params: {
                    name: "neutral",
                    subject_id: this.identifier,
                    subject_mass: this.weight,
                    subject_height: this.height,
                    subject_sex: this.sex,
                    subject_gender: this.gender,
                    subject_data_sharing: this.data_sharing,
                    subject_pose_model: this.pose_model,
                  },
                }
              );
              this.setTrialId(res.data.id);
              this.pollStatus();
            } catch (error) {
              apiError(error);
            }
          }
        }
      }
    },
    async pollStatus() {
      try {
        const res = await axios.get(
          `/sessions/${this.session.id}/neutral_img/`
        );
        switch (res.data.status) {
          case "done": {
            this.$toasted.clear()
            this.$router.push({
              name: "Session",
              params: {
                id: this.session.id,
              },
              query: this.$route.query.fromDevice === 'true' ? { sameDevice: 'true' } : {},
            });
            break;
          }
          case "error": {
            const resTrial = await axios.get(`/trials/${this.trialId}/`);
            this.$toasted.clear();
            apiErrorRes(resTrial, "Error in processing neutral pose");
            this.busy = false;

            const resStatus = await axios.get(`/sessions/${this.$route.params.id}/status/`, {})

            this.n_cameras_connected = resStatus.data.n_cameras_connected
            this.n_videos_uploaded = resStatus.data.n_videos_uploaded

            const resCalibratedCameras = await axios.get(`/sessions/${this.$route.params.id}/get_n_calibrated_cameras/`, {})

            this.n_calibrated_cameras = resCalibratedCameras.data.data

            if (this.n_videos_uploaded !== this.n_calibrated_cameras) {
              const num_missing_cameras = this.n_calibrated_cameras - this.n_videos_uploaded
              apiError(this.n_calibrated_cameras + " devices expected and " + this.n_videos_uploaded + " videos were uploaded. Please reconnect the missing " + num_missing_cameras + " devices to the session using the QR code at the top of the screen.");
            }

            break;
          }
          default: {
            const resStatus = await axios.get(`/sessions/${this.$route.params.id}/status/`, {})

            this.n_videos_uploaded = resStatus.data.n_videos_uploaded

            if (
              res.data.status === "processing" &&
              res.data.status !== this.lastPolledStatus
            ) {
              clearToastMessages();
              apiInfo("Processing: the subject can relax.", 5000);

              if (this.isAuditoryFeedbackEnabled)
                playNeutralFinishedSound()
            }
            this.lastPolledStatus = res.data.status;
            window.setTimeout(this.pollStatus, 1000);
            break;
          }
        }
      } catch (error) {
        apiError(error);
      }
    },
    openAdvancedSettings() {
      this.advancedSettingsDialog = true;
      this.getAvailableFramerates()
    },
    async getAvailableFramerates() {
      const session_settings = await axios.get(`/sessions/${this.session.id}/get_session_settings/`)
      if('data' in session_settings && 'framerates' in session_settings.data) {
        this.framerates_available = []
        session_settings.data.framerates.forEach(element => {
          if(element == 60) {
            this.framerates_available.push({"text": "60fps (max recording time: 60s, default)", "value": 60})
          } else if(element == 120) {
            this.framerates_available.push({"text": "120fps (max recording time: 30s)", "value": 120})
          } else if(element == 240) {
            this.framerates_available.push({"text": "240fps (max recording time: 15s)", "value": 240})
          }
        });
      }
      if(this.framerates_available.length == 0) {
        this.framerates_available.push({"text": "60fps (max recording time: 60s, default)", "value": 60})
      }
    },
    updateFrequency() {
      const maxAllowedFrequency = this.framerate / 2;
      if (this.filter_frequency > maxAllowedFrequency) {
        this.filter_frequency = maxAllowedFrequency
        this.tempFilterFrequency = maxAllowedFrequency
        apiWarning("Too large filter frequency. Using half the framerate (" + maxAllowedFrequency + "Hz) instead.");
      }
    },
    validateAndSetFrequency() {
      const maxAllowedFrequency = this.framerate / 2;

      if (this.tempFilterFrequency === 'default') {
        this.filter_frequency = 'default';
      } else {
        const inputFrequency = parseFloat(this.tempFilterFrequency);
        if (!isNaN(inputFrequency) && inputFrequency > 0) {
          if (inputFrequency > maxAllowedFrequency) {
            this.filter_frequency = `${maxAllowedFrequency}`;
            apiWarning("Too large filter frequency. Using half the framerate (" + maxAllowedFrequency + "Hz) instead.");
          } else {
            this.filter_frequency = `${inputFrequency}`;
          }
        } else {
          apiWarning("Invalid filter frequency. Using default.");
          this.filter_frequency = 'default';
        }
      }
      this.tempFilterFrequency = this.filter_frequency;
      this.componentKey += 1;
    },
    async skipProcessingToMonocular() {
      if (await this.$refs.observer.validate()) {
        this.busy = true;
        try {
          await axios.get(
            `/sessions/${this.session.id}/set_metadata/`,
            {
              params: {
                isMono: true,
                settings_data_sharing: this.data_sharing,
                // settings_scaling_setup: this.scaling_setup,
                // settings_pose_model: this.pose_model,
                settings_framerate: this.framerate,
                settings_session_name: this.sessionName,
                settings_openSimModel: this.openSimModel,
                // settings_augmenter_model: this.augmenter_model,
                // settings_filter_frequency: this.filter_frequency,
              },
            }
          );

          await axios.get(
            `/sessions/${this.session.id}/set_subject/`,
            {
              params: {
                subject_id: this.subject.id,
              }
            }
          );
          
          this.$router.push({
            name: "Session",
            params: {
              id: this.session.id,
            },
            query: this.$route.query.fromDevice === 'true' ? { sameDevice: 'true' } : {},
          });
        } catch (error) {
          apiError(error);
          this.busy = false;
        }
      }
    },
  },
};
</script>

<style lang="scss">
.neutral-wrapper {
  display: flex;
  flex-direction: column;
  width: calc(100% + 16px);
  min-height: 0;
  overflow-x: hidden;
  /* Use min-height like MainLayout when fixedHeight=false - allows natural growth */
  min-height: calc(100vh - var(--app-bar-height, 64px) - 32px);
  /* Counteract half of MainLayout's pa-4 padding (16px) to get 8px total */
  margin-left: -8px;
  margin-right: -8px;
  padding-left: 8px;
  padding-right: 8px;
  box-sizing: border-box;
  align-items: stretch;
}

.neutral-content {
  flex: 0 1 auto;
  min-height: 0;
  max-height: calc(100vh - var(--app-bar-height, 64px) - 32px - 68px);
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 0;
  padding-left: 0;
  padding-right: 0;
  box-sizing: border-box;
  width: 100%;
}

.custom-navigation {
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
  margin-top: auto;
  padding-top: 8px;
  padding-bottom: 8px;
  background-color: transparent; 
  z-index: 10;
  flex-wrap: nowrap;
  gap: 8px;
  justify-content: space-between;

  ::v-deep .v-btn {
    min-width: 120px;
  }

  /* Ensure Back and Next are identical width */
  .same-width {
    width: 140px;
  }

  @media (max-width: 359px) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    .custom-nav-slot {
      width: 100%;
      justify-content: center;
    }
    .custom-nav-left {
      order: 1;
    }
    .custom-nav-right {
      order: 2;
      justify-content: center;
    }
  }
}

.custom-nav-slot {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0;
  margin: 0;
  
  ::v-deep .v-btn {
    margin: 0;
  }
}

.custom-nav-left {
  justify-content: flex-start;
  padding-left: 0;
  margin-left: 0;
  width: auto;
  flex: 0 0 auto;
}

.custom-nav-right {
  justify-content: flex-end;
  padding-right: 0;
  margin-right: 0;
  width: auto;
  flex: 0 0 auto;
  
  @media (max-width: 599px) {
    justify-content: center;
    padding-right: 0;
    margin-right: 0;
    width: 100%;
  }
}

.neutral-layout {
  display: flex;
  flex-direction: row;
  width: 100%;
  flex-wrap: nowrap;
  align-items: flex-start;
  min-height: auto;
  height: auto;
  padding-left: 0;
  padding-right: 0;
  margin-left: 0;
  margin-right: 0;
  
  @media (max-width: 960px) {
    flex-direction: column;
    padding-left: 0;
    padding-right: 0;
    margin-left: 0;
    margin-right: 0;
  }
}

.left-column {
  flex: 0 0 48%; 
  max-width: 48%;
  overflow-y: visible;
  overflow-x: hidden;
  height: auto;
  min-height: auto;
  align-self: flex-start;
  flex-shrink: 0;
  padding-left: 0;
  padding-right: 0;
  
  &.full-width {
    flex: 1 1 auto;
    flex-shrink: 0;
    max-width: 100%;
    padding-right: 0;
  }

  @media (max-width: 960px) {
    flex: 1 1 auto;
    flex-shrink: 0;
    max-width: 100%;
    padding-right: 0;
    padding-left: 0;
  }
  
  .cards-row {
    gap: 0;
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    flex-shrink: 0;
    min-height: 0;
  }
  
  .session-info-card,
  .data-sharing-card {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    flex: 0 0 auto;
    overflow: visible;
    
    &.v-card {
      overflow: visible;
    }
    
    .v-card__text {
      overflow: visible !important;
      max-height: none !important;
      height: auto !important;
    }
  }
  
  .data-sharing-card {
    overflow: visible !important;
    
    ::v-deep .v-card__text {
      overflow: visible !important;
      max-height: none !important;
    }
    
    ::v-deep .v-sheet {
      overflow: visible !important;
    }
  }
  
  .advanced-settings-row {
    width: 100%;
    margin-top: 0;
    flex-shrink: 0;
    min-height: 52px;
  }
}

.right-column {
  flex-grow: 1;   
  flex-basis: 0;    
  
  @media (max-width: 960px) {
    flex: 1;
    max-width: 100%;
    margin-left: 0 !important; 
    margin-top: 16px;
    padding-left: 0 !important;
    padding-right: 0 !important;
    
    .step-4-2.ml-4 {
      margin-left: 0 !important;
    }
  }
}

.step-4-1 {
  flex: 0 0 50%;
  li {
    font-size: 16px;
    &:not(:last-child) {
      margin-bottom: 8px;
    }
  }
}

.step-4-2 {
  flex-grow: 1;
  min-width: 0;
  overflow: hidden;
  
  @media (max-width: 960px) {
    margin-left: 0 !important;
    
    &.ml-4 {
      margin-left: 0 !important;
    }
  }
  
  h1 {
    line-height: 1.15;
  }
  
  .v-card__text {
    min-width: 0;
    max-width: 100%;
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
    hyphens: auto;
    box-sizing: border-box;
    
    ul {
      max-width: 100%;
      overflow-wrap: break-word;
      word-wrap: break-word;
    }
    
    li {
      max-width: 100%;
    }
  }
  
  .v-card__title {
    min-width: 0;
    max-width: 100%;
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
    box-sizing: border-box;
  }
  
  .record-pose-footer-title {
    font-size: 18px;
    line-height: 1.4;
    text-align: center;
    padding-left: 16px;
    padding-right: 16px;
  }
}

.subject-details {
  min-width: 100%;
  &>span>div {
    padding-top: 0;
  }
}

.form-divider {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 16px;
}

.images-box {
  display: flex;
  flex-direction: column;
  height: fit-content;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;

  ul {
    font-size: 16px;
    max-width: 100%;
    padding-left: 20px;
    margin: 0;
  }
  
  .v-card {
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
  }
  
  .record-pose-content {
    flex-wrap: wrap;
    
    @media (max-width: 959px) {
      flex-direction: column;
      align-items: center;
    }
  }
  
  .record-pose-instructions {
    min-width: 0;
    max-width: 100%;
  }
}

.checkbox-box > div {
  margin-top: 0;
}

.centered-settings {
    position: fixed;
    width: 50%;
    text-align: center;
    top: 25%;
    left: 50%;
    padding: 20px;
    transform: translate(-50%, 0);
    display: none;
}

.overlay-panel {
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: black;
    opacity: 0.6;
    display: none;
}

.space-above-small {
  margin-top: 15px; /* Adjust the value as needed */
}

.space-above-large {
  margin-top: 20px; /* Adjust the value as needed */
  font-size: 20px;  /* Adjust the font size as needed */
  font-weight: bold;
}

/* Ensure dropdowns appear above navigation buttons */
.v-select__content,
.v-autocomplete__content,
.v-menu__content {
  z-index: 999 !important;
}

.custom-navigation {
  z-index: 10;
}

/* Advanced Settings Dialog Responsive Styles */
.advanced-settings-dialog {
  z-index: 200 !important;
  
  ::v-deep .v-dialog__content {
    overflow-y: auto !important;
    overflow-x: hidden !important;
    max-height: 90vh;
  }
  
  .v-card.advanced-settings-card {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: visible !important;
    display: flex;
    flex-direction: column;
    padding-bottom: 48px;
    padding-top: 48px;
    min-height: auto;
    background-color: #1e1e1e !important;
    box-shadow: 0 12px 30px rgba(0,0,0,0.6);
    border-radius: 8px;
    
    * {
      background-color: transparent;
    }
    
    &::before,
    &::after {
      background-color: #1e1e1e !important;
    }
    
    ::v-deep .v-card__title,
    ::v-deep .v-card__text,
    ::v-deep .v-card__actions,
    ::v-deep .data-title,
    ::v-deep .checkbox-wrapper {
      background-color: #1e1e1e !important;
      color: #ffffff !important;
    }
    
    ::v-deep .v-card__title span,
    ::v-deep .data-title span {
      color: #ffffff !important;
      background-color: transparent !important;
    }
    
    ::v-deep .v-input {
      background-color: #1e1e1e !important;
    }
    
    ::v-deep .v-input__slot {
      background-color: rgba(255,255,255,0.08) !important;
      color: #ffffff !important;
    }
    
    ::v-deep .v-select__selection,
    ::v-deep .v-select__selections {
      color: #ffffff !important;
    }
    
    ::v-deep .v-label {
      color: rgba(255,255,255,0.7) !important;
    }
    
    ::v-deep .v-input__append-inner .v-icon {
      color: rgba(255,255,255,0.7) !important;
    }
    
    ::v-deep .v-icon {
      color: rgba(255,255,255,0.7) !important;
    }
    
    ::v-deep .v-tooltip span {
      background-color: transparent !important;
    }
  }
  
  .v-card__title.data-title {
    padding: 20px 16px 12px 16px;
    word-wrap: break-word;
    overflow-wrap: break-word;
    margin-bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    
    @media (max-width: 599px) {
      padding: 16px 12px 10px 12px;
      font-size: 16px;
    }
  }
  
  .v-card__text.checkbox-wrapper {
    padding: 8px 16px 20px 16px !important;
    width: 100% !important;
    box-sizing: border-box;
    margin-bottom: 8px;
    align-items: flex-start !important;
    flex-shrink: 0;
    min-height: auto;
    overflow: visible !important;
    position: relative;
    
    @media (max-width: 599px) {
      padding: 6px 12px 16px 12px !important;
    }
    
    &:last-of-type {
      padding-bottom: 40px !important;
      margin-bottom: 0;
      
      @media (max-width: 599px) {
        padding-bottom: 32px !important;
      }
    }
    
    .v-select,
    .v-combobox {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 100% !important;
      margin-bottom: 4px;
      flex: 0 0 auto;
      visibility: visible !important;
      opacity: 1 !important;
      display: block !important;
      position: relative !important;
      z-index: 1;
      
      ::v-deep .v-input {
        width: 100% !important;
        min-width: 100% !important;
      }
      
      ::v-deep .v-input__control {
        width: 100% !important;
        min-width: 100% !important;
      }
      
      ::v-deep .v-input__slot {
        width: 100% !important;
        min-width: 100% !important;
      }
      
      ::v-deep .v-select__selections {
        width: 100% !important;
      }
      
      ::v-deep .v-input__append-inner {
        display: block !important;
      }
    }
  }
  
  .full-width-select {
    width: 100%;
    max-width: 100%;
    margin-top: 8px;
    margin-bottom: 4px;
    
    ::v-deep .v-input__control {
      width: 100%;
    }
    
    ::v-deep .v-input__slot {
      width: 100%;
    }
  }
  
  /* Add spacing between sections */
  .v-card__title + .v-card__text {
    margin-top: 0;
  }
  
  .v-card__text + .v-card__title {
    margin-top: 16px;
    
    @media (max-width: 599px) {
      margin-top: 12px;
    }
  }
  
  .v-card__actions {
    padding: 12px 16px 8px 16px;
    flex-shrink: 0;
    z-index: 30;
    margin-top: 0;
    margin-bottom: 0;
    position: absolute;
    top: 8px;
    right: 8px;
    background: transparent;
    
    @media (max-width: 599px) {
      padding: 10px 12px 6px 12px;
    }
    
    .v-btn {
      min-width: 40px;
      width: 40px;
      height: 40px;
      padding: 0;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.08);
      color: #ffffff;
    }
  }
  
  .v-tooltip {
    .v-icon {
      margin-left: 4px;
      flex-shrink: 0;
    }
  }
  
  @media (max-width: 599px) {
    .data-title {
      font-size: 16px;
      line-height: 1.4;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      
      span {
        flex: 1 1 100%;
        margin-bottom: 4px;
        text-align: center;
      }
      
      .v-tooltip {
        flex: 0 0 auto;
        margin-left: 4px;
      }
    }
    
    .v-card__title {
      .v-tooltip {
        max-width: 100%;
      }
    }
  }
  
  /* Ensure tooltips don't overflow on small screens */
  @media (max-width: 599px) {
    ::v-deep .v-tooltip__content {
      max-width: 90vw !important;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
  }
  
  /* Ensure dropdown menus are visible */
  ::v-deep .v-menu__content {
    z-index: 1000 !important;
    overflow: visible !important;
  }
  
  ::v-deep .v-select__menu {
    z-index: 1000 !important;
  }
}
</style>
