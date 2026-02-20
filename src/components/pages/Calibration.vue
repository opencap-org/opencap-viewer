<template>
  <MainLayout
    column
    :step="2">

    <v-card v-if="!$vuetify.breakpoint.smAndDown" class="step-2-1">
      <v-card-text class="d-flex align-center">
        <p style="margin-bottom: 0">{{ n_videos_uploaded }} of {{ n_cameras_connected }} videos uploaded.</p>
      </v-card-text>
    </v-card>

    <v-card class="step-2-2 mt-4 flex-grow-1">
      <v-card-title class="justify-center">
        Place a checkerboard in the scene
      </v-card-title>

      <v-card-text class="d-flex align-center flex-wrap">
        <ul class="flex-grow-1 instructions-list">
          <li>It should be visible by all cameras (nothing in the way of cameras' view when hitting Calibrate)</li>          
          <li>It can be either perpendicular to the floor (default) or lying on the floor (beta feature; select Lying placement below)</li>
          <li>If perpendicular to the floor, then:
            <ul>
              <li>Place it horizontally (longer side on the floor)</li>
            </ul>
          </li>
        </ul>

        <div class="image-container pa-3 checkerboard-image">
          <img src="/images/checkerboard-placement.png"/>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="step-2-2 mt-4 flex-grow-1">
      <v-card-title class="justify-center">
        Provide the checkerboard details
      </v-card-title>

      <v-card-text class="d-flex flex-wrap">
        <div class="d-flex inputs inputs-wrapper">
          <v-text-field
            v-model="rows"
            label="Rows"
            class="input-field"/>

          <v-text-field
            v-model="cols"
            label="Columns"
            class="input-field"/>

          <v-text-field
            v-model="squareSize"
            label="Square size (mm)"
            class="input-field"/>

          <v-select
            v-model="placement"
            :items="['Perpendicular', 'Lying']"
            label="Placement on the floor"
            class="input-field"/>

          <v-tooltip bottom="" max-width="500px">
            <template v-slot:activator="{ on, attrs }">
              <span v-on="on" v-bind="attrs" class="help-icon-wrapper">
                <v-icon class="ml-0 help-icon">mdi-help-circle-outline</v-icon>
              </span>
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

        <div class="image-container pa-3 checkerboard-image">
          <img src="/images/checkerboard_45.png"/>
        </div>
      </v-card-text>
    </v-card>

    <v-card v-if="$vuetify.breakpoint.smAndDown" class="step-2-1 mt-4">
      <v-card-text class="d-flex align-center">
        <p style="margin-bottom: 0">{{ n_videos_uploaded }} of {{ n_cameras_connected }} videos uploaded.</p>
      </v-card-text>
    </v-card>

    <div class="navigation d-flex justify-space-between align-center mt-3 w-100 flex-nowrap">
      <v-btn style="width: 120px;" @click="$router.push(`/${session.id}/connect-devices`)">Back to connect devices</v-btn>
      <v-btn style="width: 120px;" :disabled="busy" @click="onNext">Calibrate</v-btn>
    </div>

  </MainLayout>
</template>

<script>
import axios from 'axios'
import {mapActions, mapMutations, mapState} from 'vuex'
import { apiError, apiSuccess, apiErrorRes, apiInfo} from '@/util/ErrorMessage.js'
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
    })
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
        }
      }
    },
    async pollStatus() {
      try {
        const res = await axios.get(`/sessions/${this.session.id}/calibration_img/`)
        switch (res.data.status) {
          case "done": {
            this.$toasted.clear()

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
                apiInfo("Processing.");
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
      }
    },
  }
}
</script>

<style lang="scss">
.step-2-1 {
  .v-card-text {
    padding: 16px !important;
  }
  
  li {
    font-size: 24px;

    &:not(:last-child) {
      margin-bottom: 24px;
    }
  }
}

.step-2-2 {
  .v-card-text {
    gap: 16px;
    padding: 16px !important;
    min-width: 0;
    overflow: hidden;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    
    @media (max-width: 959px) {
      flex-direction: column;
      align-items: center;
      gap: 12px;
      width: 100% !important;
      max-width: 100% !important;
      justify-content: flex-start;
    }
    
    @media (max-width: 599px) {
      gap: 8px;
      padding: 12px !important;
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: hidden;
    }
  }
  
  .v-card-title {
    padding: 16px 16px 0 16px !important;
    text-align: center;
    font-size: 1.25rem;
    
    @media (max-width: 959px) {
      font-size: 1.1rem;
      padding: 12px 12px 0 12px !important;
    }
    
    @media (max-width: 599px) {
      font-size: 1rem;
      padding: 8px 8px 0 8px !important;
    }
  }
  
  .instructions-list {
    min-width: 0;
    flex: 1 1 auto;
    
    @media (max-width: 959px) {
      width: 100%;
      margin-bottom: 16px;
      flex: 1 1 100%;
    }
    
    li {
      font-size: 1rem;
      
      @media (max-width: 599px) {
        font-size: 0.9rem;
      }
    }
  }
  
  .inputs-wrapper {
    flex-wrap: wrap;
    gap: 8px;
    min-width: 0;
    flex: 0 0 auto;
    box-sizing: border-box;
    align-items: flex-start;
    width: auto;
    max-width: fit-content;
    
    @media (min-width: 960px) {
      max-width: calc(100% - 332px);
      width: auto;
    }
    
    @media (max-width: 959px) {
      justify-content: flex-start;
      align-items: flex-start;
      gap: 8px;
      width: 100% !important;
      max-width: 100% !important;
      flex-wrap: wrap;
    }
    
    @media (max-width: 599px) {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      width: 100% !important;
      max-width: 100% !important;
      flex-wrap: nowrap;
      align-items: stretch;
    }
  }
  
  .inputs {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    flex: 0 1 auto;
    align-items: flex-start;
    display: flex;
    flex-wrap: wrap;
    
    @media (max-width: 959px) and (min-width: 600px) {
      width: 100% !important;
      max-width: 100% !important;
    }
    
    > * {
      flex: 0 0 150px;
      min-width: 150px;
      max-width: 150px;
      box-sizing: border-box;
      align-self: flex-start;
      
      @media (max-width: 959px) and (min-width: 600px) {
        flex: 0 0 calc(50% - 4px) !important;
        min-width: 0 !important;
        max-width: calc(50% - 4px) !important;
        width: calc(50% - 4px) !important;
        align-self: flex-start;
      }
      
      @media (max-width: 599px) {
        flex: 0 0 auto !important;
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        align-self: stretch;
      }
    }
    
    .input-field {
      width: 150px;
      max-width: 150px;
      min-width: 150px;
      box-sizing: border-box;
      flex: 0 0 150px;
      align-self: flex-start;
      
      ::v-deep .v-input__control {
        min-width: 0;
        width: 100%;
        max-width: 100%;
        height: auto !important;
        min-height: 0 !important;
      }
      
      ::v-deep .v-input__slot {
        min-width: 0;
        width: 100%;
        max-width: 100%;
        height: auto !important;
        min-height: 0 !important;
      }
      
      ::v-deep .v-text-field__slot {
        width: 100%;
        max-width: 100%;
        height: auto !important;
      }
      
      @media (max-width: 959px) and (min-width: 600px) {
        width: calc(50% - 4px) !important;
        max-width: calc(50% - 4px) !important;
        min-width: 0 !important;
        flex: 0 0 calc(50% - 4px) !important;
      }
      
      @media (max-width: 599px) {
        margin-right: 0 !important;
        margin-left: 0 !important;
        margin-bottom: 8px;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        flex: 0 0 auto;
        
        ::v-deep .v-input__control {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          min-height: 0 !important;
        }
        
        ::v-deep .v-input__slot {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          min-height: 0 !important;
        }
        
        ::v-deep .v-text-field__slot {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
        }
        
        ::v-deep .v-select__slot {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
        }
      }
    }
    
    .help-icon-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 4px;
      margin-left: 8px;
      flex-shrink: 0;
      flex: 0 0 auto;
      
      @media (max-width: 959px) {
        margin-left: 4px;
        flex: 0 0 auto;
      }
      
      @media (max-width: 599px) {
        align-self: center;
        margin-left: 0;
        margin-top: 8px;
        margin-bottom: 4px;
        width: auto;
        flex: 0 0 auto;
      }
    }
    
    .help-icon {
      display: inline-block;
    }
  }
  
  .checkerboard-image {
    flex-shrink: 0;
    flex: 0 0 auto;
    max-width: 300px;
    max-height: 300px;
    width: 300px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    
    @media (max-width: 959px) {
      max-width: 250px;
      max-height: 250px;
      width: 100%;
      margin-left: 0;
      margin-top: 16px;
    }
    
    @media (max-width: 599px) {
      max-width: 200px;
      max-height: 200px;
      margin-top: 12px;
    }
    
    img {
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  }
}
</style>
