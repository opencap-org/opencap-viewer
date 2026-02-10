<template>
    <div v-if="showSessionQR">
        <v-btn
            class="text-center qr-button"
            @click="loadQRCode"
            text
        >
            <span class="qr-button-text d-none d-sm-inline mr-2">Reconnect phone</span>
            <v-icon>mdi-qrcode</v-icon>
        </v-btn>
        <v-dialog
            v-model="dialog"
            activator="parent"
            width="auto"
        >
            <v-card>
                <v-card-text class="qr-code-content">
                    <v-progress-circular
                        v-if="loading"
                        indeterminate
                        color="grey"
                        size="32"
                        width="5"/>
                    <img
                        v-else
                        class="qr-code-image"
                        :src="session.qrcode">
                </v-card-text>
                <v-card-actions class="qr-dialog-actions">
                    <v-btn
                        v-if="showOpenInAppButton"
                        block
                        class="qr-dialog-btn"
                        @click="openInApp">
                        Open in app
                    </v-btn>
                    <v-btn block class="qr-dialog-btn" @click="dialog = false">Close</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import axios from 'axios'
import { mapState } from 'vuex'
import { getSessionDeepLink } from '@/util/SessionDeepLink.js'

export default {
    name: 'QRCodeDialog',
    computed: {
        ...mapState({
            session: state => state.data.session
        }),
        isMobileOrTablet() {
            return this.$vuetify.breakpoint.smAndDown
        },
        sessionDeepLinkUrl() {
            if (!this.session?.id) return null
            const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null
            const subjectName = this.session?.subject_name || null
            return getSessionDeepLink(this.session.id, token, subjectName)
        },
        showOpenInAppButton() {
            return this.isMobileOrTablet && this.session?.id && this.sessionDeepLinkUrl
        }
    },
    methods: {
        setShowSessionQR(){
            this.showSessionQR = ['Calibration', 'Neutral', 'Session'].find(
                element => this.$route.name === element
            )
        },

        async loadQRCode(){
            this.loading = true;
            this.dialog = true;
            const res = await axios.get(`/sessions/${this.session.id}/get_qr/`)
            this.session.qrcode = res.data['qr']
            this.loading = false
        },

        openInApp() {
            if (!this.session?.id) return
            const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null
            const subjectName = this.session?.subject_name || null
            const url = getSessionDeepLink(this.session.id, token, subjectName)
            if (url) window.location.href = url
        }
    },
    watch:{
        $route(){
            this.setShowSessionQR()
        }
    },
    data() {
        return {
            loading: false,
            dialog: false,
            showSessionQR: false
        }
    },
    mounted(){
        this.setShowSessionQR()
    },

}
</script>

<style scoped>
.qr-button {
  min-width: auto;
  
  @media (max-width: 599px) {
    padding: 0 4px !important;
    min-width: 36px !important;
    width: auto !important;
  }
}

.qr-code-content {
  padding: 24px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  
  .qr-code-image {
    width: 100%;
    height: auto;
    max-width: 400px;
    max-height: 400px;
    object-fit: contain;
  }
}

.qr-dialog-actions {
  flex-direction: column;
  align-items: stretch;
  padding: 16px 24px 24px;

  .qr-dialog-btn {
    flex: none;
    width: 100%;
    margin-bottom: 8px;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
  .qr-dialog-btn:last-child {
    margin-bottom: 0;
  }
}
</style>
