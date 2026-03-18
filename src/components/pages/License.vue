<template>
  <v-layout class="login-main" ma-0 pa-3 row justify-center align-center fill-height>
    <v-flex
      xs12 sm10 md8 lg6 xl4 pa-3
      class="d-flex flex-column align-stretch">

      <v-card>
        <v-card-text>
          <h3 class="white--text text-center" v-if="!secondaryMessage">
            OpenCap is free for academic research and educational use
            (<a href="https://www.opencap.ai/terms-conditions" style="color: #7799cf; text-decoration: underline;" >Terms & Conditions</a>).
            Please identify how you use / intend to use OpenCap:</h3>
          <h3 class="white--text text-center" v-else>
            Your previously indicated that you intended to use OpenCap for
            an application not permitted by the OpenCap license. Has you intended use changed?
            OpenCap is free for academic research and educational use
            (<a href="https://www.opencap.ai/terms-conditions" style="color: #7799cf; text-decoration: underline;" >Terms & Conditions</a>).
            Please identify how you use / intend to use OpenCap:</h3>

          <v-radio-group v-model="institutionalUse" @change="submit(false)">
            <v-radio label="Patient care" value="patient_care"></v-radio>
            <v-radio label="Sports performance assessment" value="sports_performance_assessment"></v-radio>
            <v-radio label="Use in a company or in collaboration with a company" value="use_in_company"></v-radio>
            <v-radio label="Research at an academic institution" value="research_at_academic"></v-radio>
            <v-radio label="Teaching at an academic institution" value="teaching_at_academic"></v-radio>
            <v-radio label="Other non-commercial activity" value="other_non_commercial"></v-radio>
          </v-radio-group>

          <v-alert type="info" v-if="notPermitted">
            This use is not a permitted use of OpenCap, please contact Model Health
            (<a href="mailto:info@modelhealth.io">info@modelhealth.io</a>) to purchase a license.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-4" dark @click="submit(true)" :disabled="institutionalUse == '' || notPermitted">Submit</v-btn>
        </v-card-actions>
      </v-card>


    </v-flex>
  </v-layout>
</template>
<script>
import { mapActions, mapState } from 'vuex'
import { apiError } from '@/util/ErrorMessage.js'
import axios from "axios";

export default {
  name: 'License',
  data () {
    return {
      institutionalUse: '',
      secondaryMessage: false,
    }
  },
  computed: {
    notPermitted () {
      return this.institutionalUse === 'patient_care' || this.institutionalUse === 'sports_performance_assessment' || this.institutionalUse === 'use_in_company'
    },
  },
  mounted() {
    this.institutionalUse = localStorage.getItem('institutional_use')
    if (this.notPermitted) {
      this.secondaryMessage = true
    }
  },
  methods: {
    submit (reroute) {
      axios.post('/set-institutional-use/', {
        institutional_use: this.institutionalUse,
      }).then((response) => {
        localStorage.setItem('institutional_use', this.institutionalUse)
        if (reroute) { this.$router.push({name: 'SelectSession'}) }
      }).catch((error) => {
        apiError(error)
      })
    },
  }
}
</script>
