import router from '@/router'
import axios from 'axios'
import { apiSuccess, apiError } from "@/util/ErrorMessage.js";
import Vue from "vue";

export default {
  namespaced: true,
  state: {
    loggedIn: false,
    verified: false,
    username: '',
    user_id: '',
    profile_picture_url: '/images/Default_pfp.svg',
    sessionTime: 1000 * 60 * 60 * 12,
    remember_device_flag: false,
    skip_forcing_otp: false
  },
  mutations: {
    setLoggedIn (state, { loggedIn, username, user_id}) {
      state.loggedIn = loggedIn
      state.username = username
      state.user_id = user_id
    },
    setVerified (state, {verified}) {
      state.verified = verified
    },
    setRememberDeviceFlag (state, {flag}) {
      state.remember_device_flag = flag
    },
    setSkipForcingOTP (state, {value}) {
      state.skip_forcing_otp = value
    },
    setProfilePicture (state, {value}) {
      state.profile_picture_url = value
    }
  },
  actions: {
    async checkToken ({ commit, dispatch }) {
      const token = localStorage.getItem('auth_token')
      const date = new Date(localStorage.getItem('valid_till'))
      const verifiedStored = localStorage.getItem('auth_verified') === 'true'
      const hasValidToken = token && !isNaN(date.getTime()) && new Date() < date
      const verified = verifiedStored && hasValidToken

      if (!hasValidToken && verifiedStored) {
        localStorage.removeItem('auth_verified')
      }
      commit('setVerified', { verified })

      if (verified) {
        axios.defaults.headers.common['Authorization'] = 'Token ' + token
        commit('setLoggedIn', {
            loggedIn: true,
            username: localStorage.getItem('auth_user'),
            user_id: localStorage.getItem('auth_user_id'),
        })


        try {
          let res = await axios.post('/get_user_info/', {
            username: localStorage.getItem('auth_user')
          })

          if(res.data.profile_picture)
            dispatch('set_profile_picture_url', {profile_picture_url: res.data.profile_picture})
          else
            dispatch('set_profile_picture_url', {profile_picture_url: '/images/Default_pfp.svg'})
        } catch (error) {
          apiError("Error retrieving user info.")
        }

        // await dispatch('data/loadExistingSessions', {reroute: false, quantity: 20}, { root: true })
        // await dispatch('data/loadSubjects', null, { root: true })
      }
    },
    async login ({ state, commit, dispatch }, { username, password }) {
      let res = await axios.post('/login/', {
        username,
        password
      })

      const date = new Date()
      date.setTime(date.getTime() + state.sessionTime)

      console.log(res.data)  

      localStorage.setItem('valid_till', date.toJSON())
      localStorage.setItem('auth_token', res.data.token)
      localStorage.setItem('institutional_use', res.data.institutional_use)
      localStorage.setItem('auth_user', username)
      localStorage.setItem('auth_user_id', res.data.user_id)
      localStorage.removeItem('auth_verified')
      commit('setVerified', { verified: false })
      commit('setSkipForcingOTP', { value: res.data.otp_challenge_sent })

      axios.defaults.headers.common['Authorization'] = `Token ${res.data.token}`

      try {
        let res = await axios.post('/get_user_info/', {
          username: username
        })
        if(res.data.profile_picture)
          dispatch('set_profile_picture_url', {profile_picture_url: res.data.profile_picture})
        else
          dispatch('set_profile_picture_url', {profile_picture_url: '/images/Default_pfp.svg'})

      } catch (error) {
        apiError("Error retrieving user info.")
      }

      commit('setLoggedIn', {
        loggedIn: true,
        username: username,
        user_id: res.data.user_id,
      })
    },
    async set_verify ({ state, commit }) {
      commit('setVerified', { verified: true })
      localStorage.setItem('auth_verified', true)
    },
    async set_skip_forcing_otp ({ state, commit }, value) {
        commit('setSkipForcingOTP', { value: value })
    },
    async verify ({ state, commit }, { otp_token, remember_device }) {
      console.log('verify:state.remember_device_flag', state.remember_device_flag, remember_device)
      let data = {
        otp_token,
      }
      if (state.remember_device_flag && remember_device) {
        data.remember_device = true
      }
      let res = await axios.post('/verify/', data)

      commit('setVerified', {
        verified: true
      })

      const token = localStorage.getItem('auth_token')
      const username = localStorage.getItem('auth_user')
      localStorage.setItem('auth_verified', true)
      if (state.remember_device_flag && remember_device) {
        localStorage.setItem('remember_device_timestamp', Date.now())
      }
    },
    async setRememberDeviceFlag ({ state, commit }, flag) {
        commit('setRememberDeviceFlag', {flag: flag})
    },
    logout ({ commit }) {
      commit('setLoggedIn', {
        loggedIn: false,
        username: '',
        user_id: null,
      })

      commit('setVerified', {
        verified: false
      })

      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem('auth_verified')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_user_id')
      localStorage.removeItem('valid_till')
      localStorage.removeItem('institutional_use')

      router.push({ name: 'Login' })
    },
    async register ({ commit }, data) {
      await axios.post('/register/', data)
    },
    async updateProfile ({ commit }, data) {
      await axios.post('/update_profile/', data)
    },
    async updateProfilePicture ({ commit }, data) {
      await axios.post('/update_profile_picture/', data)
    },
    async reset({commit }, {email}) {
      var host = window.location.protocol + "//" + window.location.host;
      return await axios.post('/reset-password/', {email, host})
    },
    async new_password({ commit }, data) {
      return await axios.post('/new-password/', data)
    },
    set_profile_picture_url({ commit }, data) {
      commit('setProfilePicture', { value: data.profile_picture_url })
    }
  }
}
