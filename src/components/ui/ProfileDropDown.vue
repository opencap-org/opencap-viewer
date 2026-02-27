<template>
  <div class="profile-dropdown" @click="toggleDropdown">
    <span class="profile-username d-none d-sm-inline">{{ username }}</span>
    <img :src="profile_picture_url" alt="Profile" class="profile-image" />
    <transition name="fade">
      <div v-if="isDropdownOpen" class="dropdown-content">
        <div class="dropdown-header">Signed in as: {{ username }}</div>
        <hr class="dropdown-divider">
        <ul>
          <router-link
            class="dropdown-element"
            tag="li"
            :to="{ name: 'ProfilePage', params: { username: this.username } }">
              <i class="mdi mdi-account inline-icon"></i>
              Your Profile
          </router-link>
          <router-link
            class="dropdown-element"
            tag="li"
            :to="{ name: 'SelectSession' }">
              <i class="mdi mdi-magnify inline-icon"></i>
              Your Sessions
          </router-link>
        </ul>
        <hr class="dropdown-divider">
        <ul>
          <li class="dropdown-element">
            <a target="_blank" rel="noopener noreferrer" href="https://simtk.org/plugins/phpBB/indexPhpbb.php?group_id=2385&pluginname=phpBB">
              <i class="mdi mdi-forum inline-icon"></i>
              Forum
            </a>
          </li>
          <li class="dropdown-element">
            <a target="_blank" rel="noopener noreferrer" href="https://github.com/opencap-org">
              <i class="mdi mdi-source-repository inline-icon"></i>
              Find on GitHub
            </a>
          </li>
          <li class="dropdown-element">
            <a target="_blank" rel="noopener noreferrer" href="https://github.com/stanfordnmbl/opencap-processing">
              <i class="mdi mdi-file-chart inline-icon"></i>
              Data Analysis & Processing
            </a>
          </li>
          <li class="dropdown-element">
            <a target="_blank" rel="noopener noreferrer" href="https://www.opencap.ai/best-practices">
              <i class="mdi mdi-help inline-icon"></i>
              Best Practices
            </a>
          </li>
          <li class="dropdown-element">
            <a target="_blank" rel="noopener noreferrer" href="https://mobilize.stanford.edu/wp-content/uploads/2022/12/OpenCap-QA-Final.pdf">
              <i class="mdi mdi-frequently-asked-questions inline-icon"></i>
              FAQ
            </a>
          </li>
          <li class="dropdown-element">
            <a target="_blank" rel="noopener noreferrer" href="https://www.opencap.ai/terms-conditions">
              <i class="mdi mdi-file-document-edit inline-icon"></i>
              Terms and Conditions
            </a>
          </li>
          <li class="dropdown-element">
            <a target="_blank" rel="noopener noreferrer" href="https://docs.google.com/document/d/1DBw9LVAuUwgz713037VQjsaD8sj2-AN_hzga_7kXtXI/edit">
              <i class="mdi mdi-eye inline-icon"></i>
              Data Privacy and Security
            </a>
          </li>
          <li class="dropdown-element">
            <a target="_blank" rel="noopener noreferrer" href="https://github.com/stanfordnmbl/opencap-core/issues">
              <i class="mdi mdi-bug inline-icon"></i>
              Bug Report
            </a>
          </li>
        </ul>
        <hr class="dropdown-divider">
        <ul>
          <li class="dropdown-logout" @click.stop="openLogoutDialog">
                <i class="mdi mdi-logout inline-icon"></i>
                Logout
          </li>
        </ul>
      </div>
    </transition>
    <!-- Logout confirmation dialog -->
    <v-dialog
      v-model="showLogoutDialog"
      content-class="confirm-dialog"
      max-width="500"
      :fullscreen="$vuetify.breakpoint.smAndDown"
      :retain-focus="false">
      <v-card>
        <v-card-text class="pt-4">
          <v-row class="m-0">
            <v-col cols="12" sm="2">
              <v-icon x-large color="blue">mdi-logout</v-icon>
            </v-col>
            <v-col cols="12" sm="10">
              <p>Are you sure you want to log out?</p>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="white" text @click="showLogoutDialog = false">
            Cancel
          </v-btn>
          <v-btn color="white" text @click="confirmLogout">
            Log out
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'ProfileDropdown',
  computed: {
    ...mapState({
      username: state => state.auth.username,
      profile_picture_url: state => state.auth.profile_picture_url
    }),
  },
  data() {
    return {
      isDropdownOpen: false,
      profileImage: '/images/Default_pfp.svg',
      showLogoutDialog: false,
    };
  },
  methods: {
    ...mapActions('auth', ['logout']),
    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen;

      if (this.isDropdownOpen) {
        document.body.addEventListener('click', this.closeDropdownOnClickOutside);
      } else {
        document.body.removeEventListener('click', this.closeDropdownOnClickOutside);
      }
    },
    closeDropdownOnClickOutside(event) {
      if (!this.$el.contains(event.target)) {
        this.isDropdownOpen = false;
      }
    },
    showHelp() {
      // Add your help logic here
      console.log('Help clicked');
    },
    openLogoutDialog() {
      this.isDropdownOpen = false;
      this.showLogoutDialog = true;
    },
    confirmLogout() {
      this.showLogoutDialog = false;
      this.logout();
    },
  },
  beforeDestroy() {
    document.body.removeEventListener('click', this.closeDropdownOnClickOutside);
  }
};
</script>

<style scoped>
.profile-dropdown {
  position: relative;
  cursor: pointer;
  z-index: 1001;
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-username {
  font-size: 0.9375rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.dropdown-content {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: rgba(30, 30, 30, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  padding: 8px 0;
  z-index: 1000;
  width: auto;
  min-width: 260px;
  max-width: calc(100vw - 32px);
  
  @media (max-width: 599px) {
    min-width: 220px;
    right: -8px;
  }
}

.dropdown-header {
  padding: 10px 16px 12px;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 4px;
  cursor: default;
}

ul {
  list-style-type: none;
  padding: 0 !important;
  margin: 0;
}

li {
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  vertical-align: middle;
  transition: background 0.15s ease;
}

a {
  text-decoration: none;
  color: inherit;
}

li:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

.dropdown-element a {
  display: block;
  color: inherit;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

.profile-image:hover {
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.dropdown-divider {
  border: none;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 4px 0;
}

.dropdown-logout {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: 4px;
  padding-top: 12px;
}

.inline-icon {
   vertical-align: bottom;
   margin-right: 0.5em;
}
</style>
