import axios from 'axios'

let userGroups = []
let userGroupsLoaded = false
let userGroupsPromise = null

function normalizeGroups (groups) {
  return Array.isArray(groups) ? groups.map(group => String(group)) : []
}

export async function loadUserGroups ({ force = false } = {}) {
  if (userGroupsLoaded && !force) {
    return userGroups
  }

  if (userGroupsPromise && !force) {
    return userGroupsPromise
  }

  userGroupsPromise = axios.get('/user-groups/')
    .then(res => {
      userGroups = normalizeGroups(res.data?.groups)
      userGroupsLoaded = true
      return userGroups
    })
    .catch(error => {
      userGroups = []
      userGroupsLoaded = false
      throw error
    })
    .finally(() => {
      userGroupsPromise = null
    })

  return userGroupsPromise
}

export function isTester ({ groups = userGroups } = {}) {
  return normalizeGroups(groups).includes('tester')
}

export function canShowLocalDataSaveToggle ({ groups } = {}) {
  return isTester({ groups })
}

export function canShowLidarToggle ({ groups } = {}) {
  return isTester({ groups })
}
