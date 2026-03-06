<template>
  <MainLayout
    column
    leftButton="Back"
    :rightButton="rightButtonLabel"
    :step="2"
    :rightDisabled="busy"
    @left="$router.push(`/${session.id}/connect-devices`)"
    @right="onNext">

    <v-card class="step-2-1">
      <v-card-text class="d-flex align-center">
        <p style="margin-bottom: 0">{{ n_videos_uploaded }} of {{ n_cameras_connected }} videos uploaded.</p>
      </v-card-text>
    </v-card>

    <v-card class="step-2-2 mt-4 flex-grow-1">
      <v-card-title class="justify-center">
        Place a checkerboard in the scene
      </v-card-title>

      <v-card-text class="d-flex align-center">
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

      <v-card-text class="d-flex">
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

          <v-tooltip bottom="" max-width="500px">
            <template v-slot:activator="{ on }">
              <v-icon v-on="on" class="ml-0">mdi-help-circle-outline</v-icon>
            </template>
            <div>
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
                apiError(this.n_calibrated_cameras + " device(s) connected to the session and 2+ devices are required, please re-pair the devices using qr code at top of page.", 10000);
                this.busy = false
              } else {
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
  .inputs {
    > * {
      flex: 0 0 150px;
    }
  }
}
</style>
