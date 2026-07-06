import axios from 'axios'
import router from '@/router'
import Vue from 'vue'
import { formatDate } from '@/util/DateFormat.js'

export default {
  namespaced: true,
  state: {
    // existing sessions
    sessions: [],

    // init
    session: {
      trials: []
    },

    // Analysis dashboards
    analysis_dashboards: [],
    analysis_dashboard: {
      data: {
        sessions: [],
        subjects: [],
        trials: [],
        results: [],
      }
    },

    // step 1
    cameras: 2,
    // step 2
    rows: 4,
    cols: 5,
    squareSize: 35,
    placement: 'Perpendicular',
    // step 3
    trialId: '',

    // step 4
    identifier: '',
    weight: 70,
    height: 1.80,
    sex: 'woman',
    gender: 'woman',
    data_sharing: '',
    scaling_setup: 'upright_standing_pose',
    pose_model: 'hrnet',
    framerate: 60,
    openSimModel: 'LaiUhlrich2022',
    augmenter_model: 'v0.3',
    filter_frequency: 'default',

    // step 5
    trialName: '',
    analysisFunctions: [],

    subjects: [],
    sexes: {
      // "": "",
      "woman": "Female",
      "man": "Male",
      "intersect": "Intersex",
      "not-listed": "Not Listed",
      "prefer-not-respond": "Prefer not to respond"
    },
    genders: {
      // "": "",
      "woman": "Woman",
      "man": "Man",
      "transgender": "Transgender",
      "non-binary": "Non-Binary/Non-Conforming",
      "prefer-not-respond": "Prefer not to respond",
    },
    subjectTags: {},
    trialTags: {},
    isSyncDownloadAllowed: JSON.parse(localStorage.getItem("isSyncDownloadAllowed")),
    analysis: {},

    // Timestamp (ms) until which recording should be blocked after the LiDAR
    // preference changes. The mobile app needs a few seconds to switch its
    // capture pipeline between AVFoundation (RGB) and ARKit (LiDAR).
    lidarSwitchCooldownUntil: 0
  },
  mutations: {
    setAnalysis(state, trial, analysisData){
      state.analysis[trial.id] = {
        isInvokeInProgress: analysisData.isInvokeInProgress,
        isInvokeDone: analysisData.isInvokeDone,
        functionId: analysisData.functionId,
        result: analysisData.result
      }
    },
    setAnalysisDahboardList (state, analysis_dashboards) {
      state.analysis_dashboards = analysis_dashboards;
    },
    setAnalysisDahboard (state, analysis_dashboard) {
      state.analysis_dashboard = analysis_dashboard;
    },
    setSession (state, session) {
      session.created_at = formatDate(session.created_at); 
      state.session = session;
      // const sessionIds = state.sessions.map(session => session.id);
      // if(!sessionIds.includes(session.id)){
      //   state.sessions.unshift(session);
      // } else {
      //   const index = state.sessions.findIndex(s => s.id === session.id);
      //   state.sessions.splice(index, 1, session);
      // }
    },
    setSessionId (state, id) {
      state.session.id = id
    },
    setSessionSaveLocal (state, saveLocal) {
      Vue.set(state.session, 'save_local', saveLocal)
    },
    setSessionUseLidar (state, useLidar) {
      Vue.set(state.session, 'useLidar', useLidar)
    },
    setLidarSwitchCooldownUntil (state, timestamp) {
      state.lidarSwitchCooldownUntil = timestamp || 0
    },
    setExistingSessions (state, sessions) {

      // Dates to human readable format.
      let i = 0
      for (i = 0; i < sessions.length; i++) {
        sessions[i].created_at = formatDate(sessions[i].created_at);
      }

      state.sessions = sessions

    },
    updateExistingSessions (state, sessions) {
      let old_session_ids = state.sessions.map(s => s.id);

      for(let i = 0; i < sessions.length; i++) {
        sessions[i].created_at = formatDate(sessions[i].created_at)
        if(old_session_ids.includes(sessions[i].id)) {
          let index = old_session_ids.indexOf(sessions[i].id);
          state.sessions.splice(index, 1, sessions[i]);
        } else {
          state.sessions.push(sessions[i]);
        }
      }
    },
    setSubjects (state, subjects) {
      for (let i = 0; i < subjects.length; i++) {
        subjects[i].created_at = formatDate(subjects[i].created_at);
      }
      state.subjects = subjects
    },
    updateSubjects (state, subjects) {
      let old_subject_ids = state.subjects.map(s => s.id);

      for(let i = 0; i < subjects.length; i++) {
        subjects[i].created_at = formatDate(subjects[i].created_at)
        if(old_subject_ids.includes(subjects[i].id)) {
          let index = old_subject_ids.indexOf(subjects[i].id);
          state.subjects.splice(index, 1, subjects[i]);
        } else {
          state.subjects.push(subjects[i]);
        }
      }
    },
    setAnalysisFunctions(state, functions){
      state.analysisFunctions = functions.map((func) => (
          {...func, trials: [], results: [],
            states: []}));
    },
    setAnalysisFunctionPending(state, data) {
      for(let i = 0; i < state.analysisFunctions.length; i++) {
        let f_id = state.analysisFunctions[i].id.toString();
        if (f_id in data) {
          Vue.set(state.analysisFunctions[i], "trials", data[f_id]);
        } else {
          Vue.set(state.analysisFunctions[i], "trials", []);
        }

      }
    },
    setAnalysisFunctionsStates(state, data) {
      for(let i = 0; i < state.analysisFunctions.length; i++) {
        let f_id = state.analysisFunctions[i].id.toString();
        if (f_id in data) {
          Vue.set(state.analysisFunctions[i], "states", data[f_id]);
        } else {
          Vue.set(state.analysisFunctions[i], "states", []);
        }

      }
    },
    setAnalysisFunctionState(state, {functionId, trialId, data}){
      const index = state.analysisFunctions.findIndex((func) => (func.id === functionId));
      if (index >= 0) {
        const analysisFunction = state.analysisFunctions[index];
        Vue.set(state.analysisFunctions[index].states, trialId, data);
      }
    },
    setAnalysisFunctionTrial(state, {functionId, trialId}){
      const index = state.analysisFunctions.findIndex((func) => (func.id === functionId));
      if (index >= 0) {
        const analysisFunction = state.analysisFunctions[index];
        if (!analysisFunction.trials.includes(trialId)) {
          analysisFunction.trials.push(trialId);
        }
        // Vue.set(state.analysisFunctions, index, analysisFunction);
      }
    },
    removeAnalysisFunctionTrial(state, {functionId, trialId}){
      const index = state.analysisFunctions.findIndex((func) => (func.id === functionId));
      if (index >= 0) {
        Vue.set(state.analysisFunctions[index], "trials", state.analysisFunctions[index].trials.filter(id => id !== trialId));
        if(trialId in state.analysisFunctions[index].states) {
          if(state.analysisFunctions[index].states[trialId].status === "pending") {
            Vue.delete(state.analysisFunctions[index].states, trialId);
          }
        }
      }
    },
    setAnalysisFunctionResult(state, functionId, result){
      const index = state.analysisFunctions.findIndex((func) => (func.id === functionId));
      if (index >= 0) {
        const analysisFunction = state.analysisFunctions[index];
        analysisFunction.results.push(result);
        // Vue.set(state.analysisFunctions, index, analysisFunction);
      }
    },
    resetAnalysisFunctionResult(state, functionId, trialId){
      const index = state.analysisFunctions.findIndex((func) => (func.id === functionId));
      if (index >= 0) {
        const analysisFunction = state.analysisFunctions[index];
        analysisFunction.results = analysisFunction.results.filter(result => result.trial.id !== trialId);
        // Vue.set(state.analysisFunctions, index, analysisFunction);
      }
    },
    setConnectDevices (state, { cameras }) {
      state.cameras = cameras
    },
    setCalibration (state, { rows, cols, squareSize, placement }) {
      state.rows = rows
      state.cols = cols
      state.squareSize = squareSize
      state.placement = placement
    },
    setTrialId (state, trialId) {
      state.trialId = trialId
    },
    setNeutral (state, { subject, data_sharing, scaling_setup, pose_model, openSimModel, augmenter_model, filter_frequency }) {
      // state.identifier = identifier
      // state.weight = weight
      // state.height = height
      // state.sex = sex
      // state.gender = gender
      state.subject = subject
      state.data_sharing = data_sharing
      state.scaling_setup = scaling_setup
      state.pose_model = pose_model
      state.openSimModel = openSimModel
      state.augmenter_model = augmenter_model
      state.filter_frequency = filter_frequency
    },
    setSessionStep5 (state, { trialName }) {
      state.trialName = trialName
    },
    clearAll (state) {
      // session
      state.session = { trials: [] }
      // step 1
      state.cameras = 2
      // step 2
      state.rows = 4
      state.cols = 5
      state.squareSize = 35
      // step 4
      state.identifier = ''
      state.weight = 70
      state.height = 1.80
      state.sex = 'woman'
      state.gender = 'woman'
      state.data_sharing = ''
      state.scaling_setup = 'upright_standing_pose'
      state.pose_model = 'openpose'
      state.openSimModel = 'LaiUhlrich2022'
      state.augmenter_model = 'v0.3'
      state.filter_frequency = 'default'
      // step 5
      state.trialName = ''       
    },
    addTrial (state, trial) {
      state.session.trials.push(trial)
    },
    updateTrial (state, trial) {
      const index = state.session.trials.findIndex(t => t.id === trial.id)

      if (index >= 0) {
        Vue.set(state.session.trials, index, trial)
      }
    },
    updateSession (state, session) {
      const index = state.sessions.findIndex(t => t.id === session.id);

      if (index >= 0) {
        Vue.set(state.sessions, index, session);
      }
    },
    updateSubject (state, subject) {
      const index = state.subjects.findIndex(t => t.id === subject.id);

      if (index >= 0) {
        Vue.set(state.subjects, index, subject);
      }
    },
    updateSubjectTags (state, tags) {
      state.subjectTags = tags;
    },
    updateTrialTags (state, tags) {
      state.trialTags = tags;
    }
  },
  actions: {
    async loadAnalysisDashboardList({ state, commit }) {
      let res = await axios.get(`/analysis-dashboards/`)
      let result = res.data.map((dashboard) => ({id: dashboard.id, title: dashboard.title}))
      commit('setAnalysisDahboardList', result)
    },
    async loadAnalysisDashboard({ state, commit }, {id, subject_id, share_token}) {
      const dashboardId = id

      let res = await axios.get(`/analysis-dashboards/${dashboardId}/`)
      let result = res.data
      let data_url = `/analysis-dashboards/${dashboardId}/data/`
      console.log('loadAnalysisDashboard', data_url, subject_id, share_token)
      if (share_token) {
        data_url += `?subject_id=${subject_id}&share_token=${share_token}`
      }
      res = await axios.get(data_url)
      result['data'] = res.data

      commit('setAnalysisDahboard', result)

    },
    async initSession ({ state, commit }) {
      const res = await axios.get('/sessions/new/')
      commit('setSession', res.data[0])
    },
    async initSessionSameSetup ({ state, commit }) {
      const res = await axios.get(`/sessions/${state.session.id}/new_subject/`)      
      commit('setSession', res.data[0])
    },
    async loadSession ({ state, commit }, id) {
      const sessionId = id || state.session.id

      var res;
      try {
        res = await axios.get(`/sessions/${sessionId}/`)
        commit('setSession', res.data)
      } catch (e) {
        if (e.response.status === 401) {
          router.push({ name: 'Login' })
        }
      }


    },
    // async trashExistingTrial ({ state, commit }, trial) {
    //   const sessionId = id || state.session.id
    //
    //   const res = await axios.post(`/sessions/${sessionId}/trash/`)
    //   commit('updateSession', res.data)
    // },

    async permanentRemoveExistingSession ({ state, commit }, id) {
      const sessionId = id || state.session.id
      const index = state.sessions.findIndex(t => t.id === sessionId);
      const res = await axios.post(`/sessions/${sessionId}/permanent_remove/`)
      state.sessions.splice(index, 1);
    },
    async trashExistingSession ({ state, commit }, id) {
      const sessionId = id || state.session.id

      const res = await axios.post(`/sessions/${sessionId}/trash/`)

      res.data.created_at = formatDate(res.data.created_at);

      commit('updateSession', res.data)
    },
    async restoreTrashedSession ({ state, commit }, id) {
      const sessionId = id || state.session.id

      const res = await axios.post(`/sessions/${sessionId}/restore/`)

      // Dates to human readable format.
      res.data.created_at = formatDate(res.data.created_at);

      commit('updateSession', res.data)
    },
    async loadExistingSessions ({ state, commit }, {reroute, quantity = -1, subject_id = null}) {
      console.log('loadExistingSessions', reroute, quantity, subject_id)

      // let update_sessions = false;
      // let data = {
      //   quantity: quantity
      // }
      // if (subject_id) {
      //   data.subject_id = subject_id
      //   update_sessions = true;
      // }
      //
      // // Experiments with partial loading
      //
      // // let start = 0
      // // do {
      // //   data.start = start
      // //   data.quantity = 2
      // //   let res = await axios.post('/sessions/valid/', data)
      // //   console.log('loadExistingSessions', start, res.data)
      // //   start += res.data.sessions.length
      // // } while (start < res.data.total)
      //
      // let sessions = []
      // data.start = 0
      // data.quantity = 20
      // let moreDataAvailable = true
      //
      // while (moreDataAvailable) {
      //   let res = await axios.post('/sessions/valid/', data)
      //   sessions = sessions.concat(res.data.sessions)
      //   if (res.data.sessions.length < data.quantity) {
      //     moreDataAvailable = false
      //   } else {
      //       data.start += data.quantity
      //   }
      // }
      // console.log('loadExistingSessions!!!', sessions)
      //
      //
      // // old code
      //
      // // const res = await axios.post('/sessions/valid/', data)
      // if (update_sessions) {
      //   commit('updateExistingSessions', sessions)
      // } else {
      //   commit('setExistingSessions', sessions)
      // }

      if (reroute) {
        let institutionalUse = localStorage.getItem('institutional_use')
        if (institutionalUse === '' || institutionalUse === 'patient_care' || institutionalUse === 'sports_performance_assessment' || institutionalUse === 'use_in_company') {
          router.push({name: 'License'})
        } else {
          // if (state.sessions.length > 0) {
            router.push({ name: 'SelectSession' })
          // } else {
          //   router.push({ name: 'ConnectDevices' })
          // }
        }
      }
    },
    async loadSubjects({ state, commit }, {session_id}) {
      try {
        let subjects = []
        let start = 0
        let quantity = 100
        let moreDataAvailable = true

        while (moreDataAvailable) {
          let r_params = {
              start: start,
              quantity: quantity
          }
          if (session_id) {
            r_params.session_id = session_id
          }
          let res = await axios.get('/subjects/', {
            params: r_params
          })

          let tagPromises = []
          for (let i = 0; i < res.data.length; i++) {
            const tagPromise = axios.get(`/subject-tags/${res.data[i].id}/get_tags_subject/`)
              .then((tags) => {
                res.data[i].subject_tags = tags.data.map(tag => tag.tag);
              }).catch((error) => {
                if (error.response && error.response.status === 404) {
                  console.error('Subject tags not found for the given ID:', error);
                } else {
                  console.error('Error fetching subject tags:', error);
                }
              });

            tagPromises.push(tagPromise);
          }

          subjects = subjects.concat(res.data.subjects)
          if (res.data.subjects.length < quantity) {
            moreDataAvailable = false
          } else {
              start += quantity
          }
        }

        commit('setSubjects', subjects);

      } catch (error) {
        console.error('Error loading subjects:', error);
      }
    },
    async loadAnalysisFunctions({ state, commit }){
      const response = await axios.get('/analysis-functions/');
      commit('setAnalysisFunctions', response.data);
    },
    async loadAnalysisFunctionsStates({ state, commit }){
      const response = await axios.get('/analysis-results/states/');
      commit('setAnalysisFunctionsStates', response.data);
    },
    async loadAnalysisFunctionsPending({ state, commit }){
      const response = await axios.get('/analysis-results/pending/');
      commit('setAnalysisFunctionPending', response.data);
    },
    async trashExistingSubject ({ state, commit }, id) {
      const subjectId = id

      const res = await axios.post(`/subjects/${subjectId}/trash/`)

      res.data.created_at = formatDate(res.data.created_at);

      commit('updateSubject', res.data)
    },
    async restoreTrashedSubject ({ state, commit }, id) {
      const subjectId = id

      const res = await axios.post(`/subjects/${subjectId}/restore/`)

      res.data.created_at = formatDate(res.data.created_at);

      commit('updateSubject', res.data)
    },
    async loadSubjectTags({ state, commit }) {
      const response = await fetch('/tags/subjectTags.json');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      const resultObject = {};

      data["subject_tags"].forEach(tag => {
          resultObject[tag.value] = tag.label;
      });

      commit("updateSubjectTags", resultObject)
      this.subjectTags = resultObject
    },
    async loadTrialTags({ state, commit }) {
      const response = await fetch('/tags/trialTags.json');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      const resultObject = {};

      data["trial_tags"].forEach(tag => {
          resultObject[tag.value] = tag.label;
      });

      commit("updateTrialTags", resultObject)
      this.trialTags = resultObject
    }
  }

}
