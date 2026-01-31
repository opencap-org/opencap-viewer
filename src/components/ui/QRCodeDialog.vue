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
                <v-card-actions>
                    <v-btn block @click="dialog = false">Close</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import axios from 'axios'
import { mapState } from 'vuex'

export default {
    name: 'QRCodeDialog',
    computed: {
        ...mapState({
            session: state => state.data.session
        }),
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
</style>
