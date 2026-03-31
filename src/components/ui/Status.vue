<template>
  <div
    class="d-flex align-center status"
    :class="`st-${value.status}`"
    @click="onClick">
    <div
      class="mr-2 flex-shrink-0"/>
    <span :title="value.name" class="overflow-text">{{ value.name }}</span>
  </div>
</template>

<script>
import axios from 'axios'
import { apiSuccess, apiErrorRes, apiInfo, clearToastMessages } from '@/util/ErrorMessage.js'

export default {
  name: 'Status',
  props: {
    value: Object
  },
  methods: {
    async onClick () {
      console.log(JSON.stringify(this.value))
      switch (this.value.status) {
        case 'recording': {
          clearToastMessages()
          apiInfo('The trial is being recorded')
          break          
        }

        case 'processing': {
          clearToastMessages()
          apiInfo('Trial is in the queue to be processed.')
          break          
        }

        case 'reprocess': {
          clearToastMessages()
          apiInfo('Trial is in the queue to be reprocessed.')
          break          
        }
        
        case 'error': {
          clearToastMessages()
          const res = await axios.get(`/trials/${this.value.id}/`)
          apiErrorRes(res, 'Error in processing, you may want to re-record this trial.')
          this.$emit('click')
          break          
        }

        case 'done': {
          this.$emit('click')
          break
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.status {
  div {
    width: 12px;
    height: 12px;
    border-radius: 6px;
  }

  span {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space:nowrap;
  }

  &.st-done {
    div {
      background-color: green;
    }

    cursor: pointer;
    color: white;    
  }

  &.st-processing, &.st-stopped, &.st-reprocess {
    div {
      background-color: orange;
    }

    color: #e0e0e0;
  }

  &.st-recording, &.st-error {
    color: #e0e0e0;    
    background-color: transparent;

    div {
      background-color: red;
    }
  }
}

.overflow-text {
  max-width: 10em;
}

</style>
