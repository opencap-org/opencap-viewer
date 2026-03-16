<template>
  <div>
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

          <div class="d-flex align-start">
            <ValidationProvider :rules="weightValidationRules" v-slot="{ errors }" name="Weight" :immediate="false" class="flex-grow-1">
              <v-text-field
                v-model="weightDisplay"
                :label="`Weight (${weightUnitLabel})`"
                type="number"
                :min="weightMin"
                :step="weightStep"
                hide-spin-buttons
                required
                @wheel="$event.target.blur()"
                @keydown="restrictToNumbersAndDot"
                :error="errors.length > 0 || !!weightWarningMessage"
                :error-messages="errors[0] || weightWarningMessage"
              ></v-text-field>
            </ValidationProvider>
            <v-select
              v-model="weight_unit"
              :items="weightUnitOptions"
              label="Unit"
              dense
              outlined
              hide-details
              class="ml-2"
              style="max-width: 110px;"
            ></v-select>
          </div>

          <div class="d-flex align-start">
            <ValidationProvider :rules="heightValidationRules" v-slot="{ errors }" name="Height" :immediate="false" class="flex-grow-1">
              <v-text-field
                v-model="heightDisplay"
                :label="`Height (${heightUnitLabel})`"
                type="number"
                :min="heightMin"
                :step="heightStep"
                hide-spin-buttons
                required
                @wheel="$event.target.blur()"
                @keydown="restrictToNumbersAndDot"
                :error="errors.length > 0"
                :error-messages="errors[0]"
              ></v-text-field>
            </ValidationProvider>
            <v-select
              v-model="height_unit"
              :items="heightUnitOptions"
              label="Unit"
              dense
              outlined
              hide-details
              class="ml-2"
              style="max-width: 110px;"
            ></v-select>
          </div>

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
            color="grey darken-4"
            dark
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
    <v-dialog v-model="low_weight_confirm_dialog" content-class="confirm-dialog" max-width="500" :fullscreen="$vuetify.breakpoint.smAndDown">
      <v-card>
        <v-card-title class="justify-center">Confirm low subject weight</v-card-title>
        <v-card-text>
          The entered weight is {{ lowWeightDisplayValue }} {{ weightUnitLabel }}, which is lower than {{ lowWeightThresholdDisplayValue }} {{ weightUnitLabel }}.
          Please confirm this value is intentional before saving.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error darken-4" text @click="low_weight_confirm_dialog = false">Cancel</v-btn>
          <v-btn color="grey darken-4" dark @click="confirmAndSubmitLowWeight">Confirm and save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
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
            low_weight_warning_threshold: 20,
            low_weight_confirm_dialog: false,
            low_weight_confirmed_for_current_value: false,
            weight_unit: 'kg',
            kg_to_lbs: 2.20462,
            weight_raw: '',
            height_unit: 'm',
            m_to_ft: 3.28084,
            height_raw: '',
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
        },
        weightUnitOptions () {
            return [
                { text: 'kg', value: 'kg' },
                { text: 'lbs', value: 'lbs' }
            ]
        },
        weightUnitLabel () {
            return this.weight_unit;
        },
        weightMin () {
            return this.weight_unit === 'lbs' ? 0.2 : 0.1;
        },
        weightStep () {
            return this.weight_unit === 'lbs' ? 0.2 : 0.1;
        },
        weightValidationRules () {
            return this.weight_unit === 'lbs' ? 'required|weightRuleLbs' : 'required|weightRule';
        },
        weightDisplay: {
            get () {
                // Return the raw typed buffer — never round-trip through kg
                return this.weight_raw;
            },
            set (value) {
                // Update the display buffer immediately (no conversion = no glitches while typing)
                this.weight_raw = value;

                // Also keep the backing kg value in sync for validation and saving
                if (typeof value === "string" && !value.trim()) {
                    this.edited_subject.weight = "";
                    return;
                }
                const parsedValue = parseFloat(value);
                if (isNaN(parsedValue)) {
                    this.edited_subject.weight = value;
                    return;
                }
                if (this.weight_unit === 'lbs') {
                    this.edited_subject.weight = this.roundWeight(parsedValue / this.kg_to_lbs);
                } else {
                    this.edited_subject.weight = parsedValue;
                }
            }
        },
        heightUnitOptions () {
            return [
                { text: 'm', value: 'm' },
                { text: 'ft', value: 'ft' }
            ]
        },
        heightUnitLabel () {
            return this.height_unit;
        },
        heightMin () {
            return this.height_unit === 'ft' ? 0.3 : 0.1;
        },
        heightStep () {
            return this.height_unit === 'ft' ? 0.1 : 0.01;
        },
        heightValidationRules () {
            return this.height_unit === 'ft' ? 'required|heightRuleFt' : 'required|heightRule';
        },
        heightDisplay: {
            get () {
                return this.height_raw;
            },
            set (value) {
                this.height_raw = value;

                if (typeof value === "string" && !value.trim()) {
                    this.edited_subject.height = "";
                    return;
                }
                const parsedValue = parseFloat(value);
                if (isNaN(parsedValue)) {
                    this.edited_subject.height = value;
                    return;
                }
                if (this.height_unit === 'ft') {
                    this.edited_subject.height = this.roundHeight(parsedValue / this.m_to_ft);
                } else {
                    this.edited_subject.height = parsedValue;
                }
            }
        },
        weightWarningMessage () {
            const weightKg = parseFloat(this.edited_subject.weight);
            if (isNaN(weightKg) || weightKg <= 0 || weightKg >= this.low_weight_warning_threshold)
                return "";

            const displayWeight = this.weight_unit === 'lbs'
                ? this.roundLbs(weightKg * this.kg_to_lbs)
                : this.roundWeight(weightKg);

            return `The subject's weight (${displayWeight} ${this.weightUnitLabel}) is unusually low. Please double-check this value and confirm that the selected unit is correct.`;
        },
        lowWeightDisplayValue () {
            const weightKg = parseFloat(this.edited_subject.weight);
            if (isNaN(weightKg))
                return this.edited_subject.weight;

            if (this.weight_unit === 'lbs')
                return this.roundLbs(weightKg * this.kg_to_lbs);

            return this.roundWeight(weightKg);
        },
        lowWeightThresholdDisplayValue () {
            if (this.weight_unit === 'lbs')
                return this.roundLbs(this.low_weight_warning_threshold * this.kg_to_lbs);

            return this.roundWeight(this.low_weight_warning_threshold);
        }
    },
    watch: {
        'edited_subject.weight'() {
            this.low_weight_confirmed_for_current_value = false;
        },
        weight_unit(newUnit) {
            this.low_weight_confirmed_for_current_value = false;
            // Re-express the current kg value in the new unit
            const weightKg = parseFloat(this.edited_subject.weight);
            if (!isNaN(weightKg) && weightKg > 0) {
                this.weight_raw = String(
                    newUnit === 'lbs'
                        ? this.roundLbs(weightKg * this.kg_to_lbs)
                        : this.roundWeight(weightKg)
                );
            } else {
                this.weight_raw = '';
            }
        },
        height_unit(newUnit) {
            const heightM = parseFloat(this.edited_subject.height);
            if (!isNaN(heightM) && heightM > 0) {
                this.height_raw = String(
                    newUnit === 'ft'
                        ? this.roundHeight(heightM * this.m_to_ft)
                        : this.roundHeight(heightM)
                );
            } else {
                this.height_raw = '';
            }
        },
        edit_dialog(isOpen) {
            if (isOpen) {
                // Populate display buffers when dialog opens (handles edit mode)
                const weightKg = parseFloat(this.edited_subject.weight);
                if (!isNaN(weightKg) && weightKg > 0) {
                    this.weight_raw = String(
                        this.weight_unit === 'lbs'
                            ? this.roundLbs(weightKg * this.kg_to_lbs)
                            : this.roundWeight(weightKg)
                    );
                } else {
                    this.weight_raw = '';
                }

                const heightM = parseFloat(this.edited_subject.height);
                if (!isNaN(heightM) && heightM > 0) {
                    this.height_raw = String(
                        this.height_unit === 'ft'
                            ? this.roundHeight(heightM * this.m_to_ft)
                            : this.roundHeight(heightM)
                    );
                } else {
                    this.height_raw = '';
                }
            }
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
            this.low_weight_confirm_dialog = false;
            this.low_weight_confirmed_for_current_value = false;
            this.weight_unit = 'kg';
            this.weight_raw = '';
            this.height_unit = 'm';
            this.height_raw = '';
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
            if (this.edited_subject.subject_tags == null || this.edited_subject.subject_tags == "") {
                this.edit_dialog = true;
                this.formErrors.subject_tags = ["You must add at least one subject tag. For subjects with no conditions, select 'Unimpaired'."]
                return;
            }

            if (
                this.weightWarningMessage &&
                !this.low_weight_confirmed_for_current_value
            ) {
                this.low_weight_confirm_dialog = true;
                return;
            }

            this.edit_dialog = false;

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
            this.low_weight_confirmed_for_current_value = false;
            this.weight_unit = 'kg';
            this.weight_raw = '';
            this.height_unit = 'm';
            this.height_raw = '';
        },
        async addSubject() {
            this.edit_dialog = true;
            this.low_weight_confirm_dialog = false;
            this.low_weight_confirmed_for_current_value = false;
            this.weight_unit = 'kg';
            this.weight_raw = '';
            this.height_unit = 'm';
            this.height_raw = '';
            this.edited_subject = this.empty_subject;
            this.formErrors = {
                name: null,
                weight: null,
                height: null,
                birth_year: null,
                subject_tags: null,
            }
            console.log('add subject')
        },
        async confirmAndSubmitLowWeight() {
            this.low_weight_confirmed_for_current_value = true;
            this.low_weight_confirm_dialog = false;
            await this.submitSubjectForm();
        },
        restrictToNumbersAndDot(e) {
            const allowed = ['0','1','2','3','4','5','6','7','8','9','.'];
            const control = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];
            if (!allowed.includes(e.key) && !control.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
            }
        },
        roundWeight(value) {
            return Math.round(value);
        },
        roundLbs(value) {
            return Math.round(value);
        },
        roundHeight(value) {
            return parseFloat(Number(value).toFixed(2));
        }
    },
}
</script>