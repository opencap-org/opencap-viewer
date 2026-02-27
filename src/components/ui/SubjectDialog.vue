<template>
    <v-dialog v-model="edit_dialog"
      content-class="app-dialog"
      :width="$vuetify.breakpoint.smAndDown ? '100%' : '520'"
      max-width="520"
      :fullscreen="$vuetify.breakpoint.smAndDown"
      @click:outside="closeDialog">

      <ValidationObserver
              tag="form"
              class="d-flex flex-column"
              ref="observer"
              v-slot="{ invalid }">
      <v-form>
      <v-card>
        <v-card-title class="app-dialog-title">
          <v-icon class="mr-2" color="primary">mdi-account-plus</v-icon>
          <span v-if="edited_subject.id">Edit subject "{{ edited_subject.name }}"</span>
          <span v-else>Create new subject</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-text-field
            v-model="edited_subject.name"
            label="Name"
            required
            :error="formErrors.name != null"
            :error-messages="formErrors.name"
          ></v-text-field>

          <ValidationProvider rules="required|weightRule" v-slot="{ errors }" name="Weight" :immediate="false">
            <v-text-field
              v-model="edited_subject.weight"
              label="Weight (kg)"
              type="number"
              hide-spin-buttons
              required
              :error="errors.length > 0"
              :error-messages="errors[0]"
            ></v-text-field>
          </ValidationProvider>

          <ValidationProvider rules="required|heightRule" v-slot="{ errors }" name="Height" :immediate="false">
            <v-text-field
              v-model="edited_subject.height"
              label="Height (m)"
              type="number"
              hide-spin-buttons
              required
              :error="errors.length > 0"
              :error-messages="errors[0]"
            ></v-text-field>
          </ValidationProvider>

          <ValidationProvider rules="required|birthYearRule" v-slot="{ errors }" name="Birth Year" :immediate="false">
            <v-text-field
              v-model="edited_subject.birth_year"
              label="Birth year (yyyy)"
              type="number"
              hide-spin-buttons
              required
              :error="errors.length > 0"
              :error-messages="errors[0]"
            ></v-text-field>
          </ValidationProvider>

          <ValidationProvider rules="required|subjectTagsRule" v-slot="{ errors }" name="Subject Tags" :immediate="false">
            <v-autocomplete
                ref="subjectTagsSelect"
                clearable
                multiple
                v-model="edited_subject.subject_tags"
                item-title="text"
                item-value="value"
                label="Subject Tags"
                :items="tagsOptions"
                :error="errors.length > 0"
                :error-messages="errors[0]"
                :search-input.sync="tag_search_input"
                @change="tag_search_input = ''"
            ></v-autocomplete>
          </ValidationProvider>

          <v-select
              ref="sexAtBirthSelect"
              clearable
              v-model="edited_subject.sex_at_birth"
              item-title="text"
              item-value="value"
              label="Sex assigned at birth (Optional)"
              :items="sexesOptions"
          ></v-select>
          <v-select
              ref="genderSelect"
              clearable
              v-model="edited_subject.gender"
              item-title="text"
              item-value="value"
              label="Gender (Optional)"
              :items="gendersOptions"
          ></v-select>

          <v-textarea
            v-model="edited_subject.characteristics"
            label="Characteristics (Optional)"
            rows=3
          ></v-textarea>

          <div class="pt-0">
            <ValidationProvider :rules="{ required: {allowFalse: false}}" v-slot="{ errors }" name="Informed consent selection">
              <v-checkbox v-model="edited_subject.terms" class="mt-0 mb-0"
                          :error="errors.length > 0"
                          :error-messages="errors[0]">
                <template v-slot:label>
                  <div>I, the research Participant, have provided informed consent to the research Investigator conducting this study.
                    I have read and I agree to the
                    <v-tooltip location="bottom">
                      <template v-slot:activator="{ props }">
                        <a href="https://www.opencap.ai/terms-conditions"
                           target="_blank"
                           v-bind="props"
                           @click.stop>Terms and Conditions</a>
                      </template>
                      Opens in new window
                    </v-tooltip>
                    and
                    <v-tooltip location="bottom">
                      <template v-slot:activator="{ props }">
                        <a href="https://docs.google.com/document/d/1DBw9LVAuUwgz713037VQjsaD8sj2-AN_hzga_7kXtXI"
                           target="_blank"
                           v-bind="props"
                           @click.stop>Privacy Policy</a>
                      </template>
                    </v-tooltip>
                    of the OpenCap tool.
                  </div>
                </template>
                Opens in new window
              </v-checkbox>
            </ValidationProvider>
          </div>

        </v-card-text>
        <v-card-actions class="px-4">
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            text
            @click="cancelSubjectForm()"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            depressed
            :disabled="invalid"
            @click="submitSubjectForm()"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
      </v-form>
      </ValidationObserver>
    </v-dialog>
</template>

<script>
import axios from 'axios'
import { mapState, mapActions } from 'vuex'
import { rules } from '@/validation'

export default {
    name: 'SubjectsDialog',
    data () {
        return {
            rules,
            tag_search_input: '',
            edit_dialog: false,
            edited_subject: {
                id: "",
                name:"",
                weight:"",
                height:"",
                birth_year:"",
                sex_at_birth:"",
                gender:"",
                subject_tags:null,
                characteristics:""
            },
            empty_subject: {
                id: "",
                name:"",
                weight:"",
                height:"",
                birth_year:"",
                sex_at_birth:"",
                gender:"",
                subject_tags:null,
                characteristics:""
            },
            formErrors: {
                name: null,
                weight: null,
                height: null,
                birth_year: null,
                subject_tags: null,
            },
        }
    },
    computed: {
        ...mapState({
            sessions: state => state.data.sessions,
            genders: state => state.data.genders,
            subjectTags: state => state.data.subjectTags,
            sexes: state => state.data.sexes,
        }),
        gendersOptions () {
            return Object.entries(this.genders).map((s) => ({ text: s[1], value: s[0] }))
        },
        tagsOptions () {
            return Object.entries(this.subjectTags).map((s) => ({ text: s[1], value: s[0] }))
        },
        sexesOptions () {
            return Object.entries(this.sexes).map((s) => ({ text: s[1], value: s[0] }))
        }
    },
    mounted () {
      console.log('SubjectDialog mounted')
      this.loadSubjectTags()
    },
    methods: {
        ...mapActions('data', ['loadSubjects', 'loadSubjectTags']),
        closeDialog() {
          if (this.$refs.subjectTagsSelect.isMenuActive || this.$refs.sexAtBirthSelect.isMenuActive || this.$refs.genderSelect.isMenuActive)
            this.edit_dialog = true;
          else
            this.edit_dialog = false;
        },
        async cancelSubjectForm() {
            this.edit_dialog = false;
            this.edited_subject = this.empty_subject;
            this.formErrors = {
                name: null,
                weight: null,
                height: null,
                birth_year: null,
                subject_tags: null,
            }
        },
        async submitSubjectForm() {
            this.edit_dialog = false;

            if (this.edited_subject.subject_tags == null || this.edited_subject.subject_tags == "") {
                this.edit_dialog = true;
                this.formErrors.subject_tags = ["You must add at least one subject tag. For subjects with no conditions, select 'Unimpaired'."]
                return;
            }

            this.formErrors = {
                name: null,
                weight: null,
                height: null,
                birth_year: null,
                subject_tags: null,
            }

            console.log('edit_dialog=', this.edit_dialog)
            if(this.edited_subject.id) {
                const res = await axios.put('/subjects/' + this.edited_subject.id + '/', this.edited_subject)
                    .then(response => {
                        this.$emit('subject-updated', response.data)
                        this.clearEditedSubject();
                    })
                    .catch(error => {
                        if(error.response.status === 400) {
                            for (const [key, value] of Object.entries(error.response.data)) {
                                this.formErrors[key] = value
                            }
                            this.edit_dialog = true;
                        }
                    })
                // if (res && res.data) {
                //     this.clearEditedSubject();
                // } else {
                //     this.edit_dialog = true;
                // }
            } else {
                const res = await axios.post('/subjects/', this.edited_subject)
                    .then(response => {
                        this.$emit('subject-added', response.data)
                        this.clearEditedSubject();
                    })
                    .catch(error => {
                        if(error.response.status === 400) {
                            for (const [key, value] of Object.entries(error.response.data)) {
                                this.formErrors[key] = value
                            }
                            this.edit_dialog = true;
                        }
                    })
                // if (res && res.data) {
                //     this.clearEditedSubject();
                // } else {
                //   console.log('WTF', res)
                //     this.edit_dialog = true;
                // }
            }

            console.log('edit_dialog=', this.edit_dialog)
            // await this.loadSubjects();
        },
        clearEditedSubject() {
            this.edited_subject.id = "";
            this.edited_subject.name = "";
            this.edited_subject.weight = "";
            this.edited_subject.height = "";
            this.edited_subject.birth_year = "";
            this.edited_subject.sex_at_birth = "";
            this.edited_subject.gender = "";
            this.edited_subject.subject_tags = null;
            this.edited_subject.characteristics = "";
        },
        async addSubject() {
            this.edit_dialog = true;
            this.edited_subject = this.empty_subject;
            this.formErrors = {
                name: null,
                weight: null,
                height: null,
                birth_year: null,
                subject_tags: null,
            }
            console.log('add subject')
        }
    },
}
</script>