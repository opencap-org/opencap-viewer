<template>
  <MainLayout
    column
    :rightButton="rightButtonLabel"
    :step="2"
    :rightDisabled="busy"
    @left="$router.push(`/${session.id}/connect-devices`)"
    @right="onNext">
    <template v-slot:left>
      <v-btn text @click="$router.push(`/${session.id}/connect-devices`)">
        <v-icon left>mdi-arrow-left</v-icon>
        {{ backLabel }}
      </v-btn>
    </template>

    <v-card class="step-2-1">
      <v-card-text class="d-flex align-center">
        <p style="margin-bottom: 0">{{ n_videos_uploaded }} of {{ n_cameras_connected }} videos uploaded.</p>
      </v-card-text>
    </v-card>

    <v-card class="step-2-2 mt-4 flex-grow-1">
      <v-card-title class="justify-center">
        Place a checkerboard in the scene
      </v-card-title>

      <v-card-text class="d-flex align-center calibration-card-content">
        <ul class="flex-grow-1">
          <li>It should be visible by all cameras (nothing in the way of cameras' view when hitting Calibrate)</li>
          <li>It can be either perpendicular to the floor (default) or lying on the floor (beta feature; select Lying placement below)</li>
          <li>If perpendicular to the floor, then:
            <ul>
              <li>Place it horizontally (longer side on the floor)</li>
            </ul>
          </li>
        </ul>

        <div class="image-container pa-3">
          <img src="/images/checkerboard-placement.png"/>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="step-2-2 mt-4 flex-grow-1">
      <v-card-title class="justify-center">
        Provide the checkerboard details
      </v-card-title>

      <v-card-text class="d-flex calibration-card-content">
        <div class="d-flex flex-grow-1 align-center inputs">
          <v-text-field
            v-model="rows"
            label="Rows"
            class="mr-3"/>

          <v-text-field
            v-model="cols"
            label="Columns"
            class="mr-3"/>

          <v-text-field
            v-model="squareSize"
            label="Square size (mm)"
            class="mr-3"/>

          <v-select
            v-model="placement"
            :items="['Perpendicular', 'Lying']"
            label="Placement on the floor"
            class="mr-0"/>

          <v-tooltip
            bottom
            max-width="500px"
            content-class="calibration-tooltip"
            open-on-click
            :close-on-content-click="false">
            <template v-slot:activator="{ on }">
              <v-btn
                icon
                small
                class="calibration-help-btn ml-0"
                :retain-focus-on-click="false"
                v-on="on">
                <v-icon>mdi-help-circle-outline</v-icon>
              </v-btn>
            </template>
            <div class="calibration-tooltip-content">
              The origin of the world frame is the top-left black-to-black corner of the board (red dot with a blue outline in the picture on the right).
              <br><br>
              When positioned perpendicular to the floor, transformations are applied so that in the processed data:
              <ul>
                <li>The forward axis of the world frame is perpendicular to the board (coming out).</li>
                <li>The vertical axis of the world frame is parallel to the board (going up).</li>
              </ul>
              <br>
              When positioned lying on the floor, transformations are applied so that in the processed data:
              <ul>
                <li>The forward axis of the world frame is parallel to the board (along the shorter side).</li>
                <li>The vertical axis of the world frame is perpendicular to the board (going up).</li>
              </ul>
              <br>
              To align movement with the forward axis of the world frame when the board is lying on the floor, place the board such that its forward axis is parallel to the direction of movement.
              For example, for walking, place the board with the longer side perpendicular to the walking direction. Note that this alignment is optional, as the system can operate with the board in any orientation.
            </div>
          </v-tooltip>
        </div>

        <div class="image-container pa-3">
          <img src="/images/checkerboard_45.png"/>
        </div>
      </v-card-text>
    </v-card>

  </MainLayout>
</template>

<script>
import axios from 'axios'
import {mapActions, mapMutations, mapState} from 'vuex'
import { apiError, apiSuccess, apiErrorRes, apiInfo, clearToastMessages } from '@/util/ErrorMessage.js'
import MainLayout from '@/layout/MainLayout'
import { playCalibrationFinishedSound } from "@/util/SoundMessage.js";

export default {
  name: 'Calibration',
  components: {
    MainLayout
  },
  data () {
    return {
      rows: 4,
      cols: 5,
      squareSize: 35,
      placement: 'Perpendicular',
      busy: false,
      imgs: null,
      lastPolledStatus: "",
      n_cameras_connected: 0,
      n_videos_uploaded: 0,
      isAuditoryFeedbackEnabled: false,
    }
  },
  created() {
    // Load the initial value from localStorage
    const storedValue = localStorage.getItem("auditory_feedback");
    this.isAuditoryFeedbackEnabled = storedValue === "true";
  },
  computed: {
    ...mapState({ 
      session: state => state.data.session,
      trialId: state => state.data.trialId
    }),
    backLabel() {
      return this.$vuetify.breakpoint.smAndDown ? 'Back' : 'Back to connect-devices'
    },
    rightButtonLabel() {
      return this.busy ? 'Processing' : 'Calibrate'
    }
  },
  mounted () {
      this.loadSession(this.$route.params.id)
  },
  methods: {
    ...mapMutations('data', ['setCalibration', 'setTrialId']),
    ...mapActions('data', ['loadSession']),
    async onNext () {
      if (this.imgs) {
        const query = this.$route.query.isMono === 'true' ? { isMono: 'true' } : {}
        this.$router.push({ path: `/${this.session.id}/neutral`, query })
      } else {
        this.lastPolledStatus = "";
        // Record press
        this.busy = true
        this.setCalibration({
          rows: this.rows,
          cols: this.cols,
          squareSize: this.squareSize,
          placement: this.placement
        })
        try {
          const resUpdate = await axios.get(`/sessions/${this.session.id}/set_metadata/`, {
            params: {
              cb_rows: this.rows,
              cb_cols: this.cols,
              cb_square: this.squareSize,
              cb_placement: this.placement
              }
            })

          const res = await axios.get(`/sessions/${this.session.id}/record/`, {
            params: {
              name: 'calibration',
            }
          })
          this.setTrialId(res.data.id)
          this.pollStatus()
        } catch (error) {
          apiError(error)
          this.busy = false
        }
      }
    },
    async pollStatus() {
      try {
        const res = await axios.get(`/sessions/${this.session.id}/calibration_img/`)
        switch (res.data.status) {
          case "done": {
            clearToastMessages()

            const resCalibratedCameras = await axios.get(`/sessions/${this.$route.params.id}/get_n_calibrated_cameras/`, {})

            this.n_calibrated_cameras = resCalibratedCameras.data.data

            if (this.n_calibrated_cameras < 2) {
              apiError(this.n_calibrated_cameras + " device(s) connected to the session and 2+ devices are required, please re-pair your devices using qr code at top of page.", 10000);
              this.busy = false
            } else {
              // Play sound indicating calibration finished.
              if (this.isAuditoryFeedbackEnabled)
                playCalibrationFinishedSound();

              apiSuccess(this.n_calibrated_cameras + " devices calibrated successfully.", 5000);
              const query = this.$route.query.isMono === 'true' ? { isMono: 'true' } : {}
              this.$router.push({ path: `/${this.session.id}/neutral`, query })
            }
            break;
          }
          case "error": {
            clearToastMessages()
            const res_trial = await axios.get(`/trials/${this.trialId}/`)
            apiErrorRes(res_trial, 'Finished with error')
            this.busy = false;

            break;

          }
          default: {
            if (
              res.data.status === "processing" &&
              res.data.status !== this.lastPolledStatus
            ) {
              const resCalibratedCameras = await axios.get(`/sessions/${this.$route.params.id}/get_n_calibrated_cameras/`, {})

              this.n_calibrated_cameras = resCalibratedCameras.data.data

              if (this.n_calibrated_cameras < 2) {
                clearToastMessages()
                apiError(this.n_calibrated_cameras + " device(s) connected to the session and 2+ devices are required, please re-pair the devices using qr code at top of page.", 10000);
                this.busy = false
              } else {
                clearToastMessages()
                apiInfo("Processing.", 0);
              }
            }
            this.lastPolledStatus = res.data.status;
            window.setTimeout(this.pollStatus, 1000);
            break;
          }
        }

        // Get n_cameras_connected.
        const res_status = await axios.get(`/sessions/${this.session.id}/status/`, {})

        this.n_videos_uploaded = res_status.data.n_videos_uploaded
        this.n_cameras_connected = res_status.data.n_cameras_connected
      } catch (error) {
        clearToastMessages()
        apiError(error);
        this.busy = false;
      }
    },
  }
}
</script>

<style lang="scss">
.step-2-1 {
  li {
    font-size: 24px;

    &:not(:last-child) {
      margin-bottom: 24px;
    }
  }
}

.step-2-2 {
  .calibration-card-content {
    @media (max-width: 599px) {
      flex-wrap: wrap;
    }
  }

  .inputs {
    flex-wrap: wrap;
    min-width: 0;
    gap: 8px;

    > * {
      flex: 0 0 150px;
    }

    /* Tablet: allow inputs to wrap and shrink */
    @media (max-width: 900px) {
      > * {
        flex: 1 1 120px;
        min-width: 0;
      }
    }

    /* Mobile: stack vertically, all inputs same full width for alignment */
    @media (max-width: 599px) {
      flex-direction: column;
      align-items: stretch;

      > * {
        flex: 1 1 auto;
        min-width: 0;
        max-width: 100%;
      }

      .v-text-field,
      .v-select {
        width: 100% !important;
        max-width: 100%;
      }

      /* Help button: keep compact, don't stretch full width */
      .v-tooltip {
        align-self: flex-start;
      }
    }
  }

  /* Fix Safari: calibration images must show fully, not zoomed/cropped.
     Use max-width/max-height (no object-fit) for reliable Safari compatibility. */
  .image-container {
    flex-shrink: 0;
    width: 280px;
    min-width: 220px;
    height: 200px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: auto !important;
      height: auto !important;
      max-width: 100%;
      max-height: 100%;
    }

    @media (max-width: 599px) {
      flex: 1 1 100%;
      min-width: 0;
      max-width: 100%;
    }
  }

  /* Help tooltip: proper touch target on mobile, visible and tappable */
  .calibration-help-btn {
    flex-shrink: 0;

    @media (max-width: 599px) {
      min-width: 44px !important;
      min-height: 44px !important;
      width: 44px !important;
      height: 44px !important;
    }
  }
}

/* Tooltip content: scrollable, fit viewport on mobile */
.calibration-tooltip-content {
  max-height: 70vh;
  overflow-y: auto;
}

.calibration-tooltip {
  max-height: 70vh !important;
  overflow-y: auto !important;
}

@media (max-width: 599px) {
  .calibration-tooltip {
    max-width: 90vw !important;
  }
}
</style>
