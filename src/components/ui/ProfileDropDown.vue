<template>
  <div class="profile-dropdown" @click="toggleDropdown">
    <img :src="profile_picture_url" alt="Profile" class="profile-image" />
    <transition name="fade">
      <div v-if="isDropdownOpen" class="dropdown-content">
        <ul>
          <router-link
            class="dropdown-element"
            tag="li"
            :to="{ name: 'SelectSession' }">
            <li>Signed in as: {{username}}</li>
          </router-link>
        </ul>
        <hr>
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
        <hr>
        <ul>
          <a target="_blank" href="https://simtk.org/plugins/phpBB/indexPhpbb.php?group_id=2385&pluginname=phpBB">
            <li>
                  <i class="mdi mdi-forum inline-icon"></i>
                  Forum
            </li>
          </a>
          <a target="_blank" href="https://github.com/opencap-org">
            <li>
                  <i class="mdi mdi-source-repository inline-icon"></i>
                  Find on GitHub
            </li>
          </a>
          <a target="_blank" href="https://github.com/stanfordnmbl/opencap-processing">
            <li>
                  <i class="mdi mdi-file-chart inline-icon"></i>
                  Data Analysis and Processing
            </li>
          </a>
          <a target="_blank" href="https://www.opencap.ai/best-practices">
            <li>
                <i class="mdi mdi-help inline-icon"></i>
                Best Practices
            </li>
          </a>
          <a target="_blank" href="https://mobilize.stanford.edu/wp-content/uploads/2022/12/OpenCap-QA-Final.pdf">
            <li>
                <i class="mdi mdi-frequently-asked-questions inline-icon"></i>
                FAQ
            </li>
          </a>
          <a target="_blank" href="https://www.opencap.ai/terms-conditions">
            <li>
                  <i class="mdi mdi-file-document-edit inline-icon"></i>
                  Terms and Conditions
            </li>
          </a>
          <a target="_blank" href="https://docs.google.com/document/d/1DBw9LVAuUwgz713037VQjsaD8sj2-AN_hzga_7kXtXI/edit">
            <li>
                <i class="mdi mdi-eye inline-icon"></i>
                Data Privacy and Security
            </li>
          </a>
          <a target="_blank" href="https://github.com/stanfordnmbl/opencap-core/issues">
            <li>
                <i class="mdi mdi-bug inline-icon"></i>
                Bug Report
            </li>
          </a>
        </ul>
        <hr>
        <ul>
          <li @click="logoutAction">
                <i class="mdi mdi-logout inline-icon"></i>
                Logout
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
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
    logoutAction() {
      this.logout();
    }
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
  background-color: #111111;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  padding: 8px;
  z-index: 1000;
  width: auto;
  min-width: 25em;
  max-width: calc(100vw - 32px);
  
  @media (max-width: 599px) {
    min-width: 200px;
    right: -8px;
  }
}

ul {
  list-style-type: none;
  padding: 0 !important;
  margin: 0;
}

li {
  padding: 8px;
  cursor: pointer;
  user-select: none;
  vertical-align: middle;
}

a {
  text-decoration: none;
}

li:hover, a:hover{
  background-color: #444444;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

.profile-image:hover {
  border: 2px solid #444444; /* Change color to your desired highlight color */
}

.inline-icon {
   vertical-align: bottom;
   margin-right: 0.5em;
}
</style>
