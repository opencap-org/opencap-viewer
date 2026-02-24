<template>
    <div class="video-player d-flex">
        <div class="viewer flex-grow-1">
            <div v-if="trial" class="d-flex flex-column h-100">
                <div id="mocap" ref="mocap" class="flex-grow-1" />
                <div v-if="!videoControlsDisabled" class="video-controls-row">
                    <div class="time-input-wrap">
                        <v-text-field label="Time (s)" type="number" :step="0.01" :value="formattedTime"
                            dark dense hide-details @input="onChangeTime"/>
                    </div>
                    <v-slider :value="frame"
                              :min="timeToFrame(timeStart)"
                              :max="timeToFrame(timeEnd)"
                              @input="onNavigate" hide-details
                        class="mb-2 slider-wrap" />
                </div>
            </div>

            <div v-else-if="trialLoading" class="flex-grow-1 d-flex align-center justify-center">
                <v-progress-circular indeterminate color="grey" size="30" width="4" />
            </div>
        </div>

        <div class="right d-flex flex-column">
            <div class="videos flex-grow-1 d-flex flex-column">
                <video v-for="(video, index) in videos" :key="`video-${index}`" :ref="`video-${index}`"
                       muted
                       playsinline :src="video.media" crossorigin="anonymous"
                       @loadedmetadata="onVideoLoadMetadata(index)"
                       @timeupdate="onVideoTimeUpdate(index)"
                       @ended="onVideoEnded(index)" />
            </div>

            <SpeedControl v-model="playSpeed" />

            <VideoNavigation :playing="playing" :value="frame" :maxFrame="frames.length - 1"
                :disabled="videoControlsDisabled" @play="togglePlay(true)" @pause="togglePlay(false)"
                @input="onNavigate" class="mb-2" />
        </div>
    </div>
</template>
<script>
import axios from 'axios'
import * as THREE from 'three'
import * as THREE_OC from '@/orbitControls'
import { apiError } from '@/util/ErrorMessage.js'
import VideoNavigation from '@/components/ui/VideoNavigation'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import SpeedControl from '@/components/ui/SpeedControl'
import { mapState } from 'vuex'


const objLoader = new OBJLoader();


export default {
    name: 'Visualizer',
    components: {
        VideoNavigation,
        SpeedControl
    },
    props: ['trialID', 'result'],
    data(){
        return {
            videos: [],
            frames: [],
            synced: false,
            camera: null,
            scene: null,
            renderer: null,
            controls: null,
            pose_spheres: [],
            pose_bones: [],
            meshes: {},
            frame: 0,
            time: 0,
            playing: false,
            playSpeed: 1,
            trial: null,
            trialLoading: false,
            timeStart: 0,
            timeEnd: 0,
            resizeObserver: null,
        }
    },
    computed: {
        videoControlsDisabled() {
            return !this.trial || this.frames.length === 0
        },
        formattedTime() {
            const t = Number(this.time)
            return Number.isFinite(t) ? t.toFixed(2) : '0.00'
        },
    },
    watch: {
        playSpeed() {
            this.eachVideo(videoElement => {
                videoElement.playbackRate = this.playSpeed
            })
        },
    },
    async mounted(){
        this.timeStart = this.result.indices.start
        this.timeEnd = this.result.indices.end
        window.addEventListener('resize', this.onResize)
        window.addEventListener('keydown', this.onKeydown)
        this.initResizeObserver()
        await this.loadTrial(this.trialID);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.onResize)
        window.removeEventListener('keydown', this.onKeydown)
        if (this.resizeObserver) {
            this.resizeObserver.disconnect()
            this.resizeObserver = null
        }
    },
    methods: {
        initResizeObserver() {
            if (typeof ResizeObserver === 'undefined' || !this.$refs.mocap) {
                return
            }
            if (this.resizeObserver) {
                this.resizeObserver.disconnect()
                this.resizeObserver = null
            }
            this.resizeObserver = new ResizeObserver(() => {
                this.onResize()
            })
            this.resizeObserver.observe(this.$refs.mocap)
        },
        async loadTrial(trialID) {
            console.log('loadTrial')
            this.time = this.timeStart

            if (!this.trialLoading) {
                this.frame = 0
                this.trial = null
                this.synced = false
                this.trialLoading = true

                try {
                    const { data } = await axios.get(`/trials/${trialID}/`)

                    this.trial = data

                    // load JSON
                    const json = data.results.filter(element => element.tag == "visualizerTransforms-json")

                    if (json && json.length > 0) {
                        let data
                        const url = json[0].media

                        if (url.startsWith(axios.defaults.baseURL)) {
                            const res = await axios.get(url)
                            data = res.data
                        } else {
                            let axiosClean = axios.create()

                            const res = await axiosClean.get(url, {
                                // Deleting Authorization header, because we have one as global Axios
                                // Do not pass out user token to 3rd party sites
                                transformRequest: [(data, headers) => {
                                    delete headers.common.Authorization
                                    return data
                                }]
                            })

                            data = res.data
                        }

                        this.frames = data.time
                        this.animation_json = data
                    } else {
                        this.frames = [] //null
                    }

                    this.videos = data.results.filter(element => element.tag == "video-sync")

                    if (this.videos.length === 0) {
                        this.frame = 0
                        this.time = this.timeStart
                    }

                    if (this.frames.length > 0) {
                        this.$nextTick(() => {
                            try {
                                this.initResizeObserver()
                                while (this.$refs.mocap.lastChild) {
                                    this.$refs.mocap.removeChild(this.$refs.mocap.lastChild)
                                }

                                // setup3d
                                const container = this.$refs.mocap

                                let ratio = container.clientWidth / container.clientHeight
                                this.camera = new THREE.PerspectiveCamera(45, ratio, 0.1, 125)
                                this.camera.position.x = 4.5
                                this.camera.position.z = -3
                                this.camera.position.y = 3

                                this.scene = new THREE.Scene()
                                this.renderer = new THREE.WebGLRenderer({ antialias: true })
                                this.renderer.shadowMap.enabled = true;
                                this.renderer.setPixelRatio(window.devicePixelRatio || 1)
                                this.onResize()
                                container.appendChild(this.renderer.domElement)
                                this.controls = new THREE_OC.OrbitControls(this.camera, this.renderer.domElement)

                                // show3d
                                // add the plane
                                {
                                    const planeSize = 5;

                                    const loader = new THREE.TextureLoader();
                                    const texture = loader.load('https://threejsfundamentals.org/threejs/resources/images/checker.png');
                                    //                  const texture = loader.load('https://www.the3rdsequence.com/texturedb/download/32/texture/jpg/1024/smooth+white+tile-1024x1024.jpg')
                                    texture.wrapS = THREE.RepeatWrapping;
                                    texture.wrapT = THREE.RepeatWrapping;
                                    texture.magFilter = THREE.NearestFilter;
                                    const repeats = planeSize * 2;
                                    texture.repeat.set(repeats, repeats);

                                    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
                                    const planeMat = new THREE.MeshPhongMaterial({
                                        map: texture,
                                        side: THREE.DoubleSide,
                                    });
                                    const mesh = new THREE.Mesh(planeGeo, planeMat);
                                    mesh.rotation.x = Math.PI * -.5;
                                    mesh.position.y = .0
                                    mesh.receiveShadow = true;
                                    this.scene.add(mesh);
                                }

                                // add sun
                                {
                                    const skyColor = 0xB1E1FF;  // light blue
                                    const groundColor = 0xB97A20;  // brownish orange
                                    const intensity = 0.5
                                    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
                                    this.scene.add(light);
                                }

                                // add directional light
                                {
                                    const color = 0xFFFFFF;
                                    const intensity = 0.8;
                                    const light = new THREE.DirectionalLight(color, intensity);
                                    light.position.set(2, 3, 1.5);
                                    light.target.position.set(0, 0, 0);
                                    light.castShadow = true;
                                    light.shadow.camera.left = -10
                                    light.shadow.camera.right = 10
                                    light.shadow.camera.top = -10
                                    light.shadow.camera.bottom = 10
                                    light.shadow.camera.near = 0
                                    light.shadow.camera.far = 50
                                    light.shadow.camera.zoom = 8
                                    this.scene.add(light);
                                    this.scene.add(light.target);

                                    // const helper = new THREE.DirectionalLightHelper(light);
                                    // this.scene.add(helper);

                                    // const cameraHelper = new THREE.CameraHelper(light.shadow.camera);
                                    // this.scene.add(cameraHelper);
                                }

                                // add bones
                                for (let body in this.animation_json.bodies) {
                                    let bd = this.animation_json.bodies[body]
                                    bd.attachedGeometries.forEach((geom) => {
                                        let path = 'https://mc-opencap-public.s3.us-west-2.amazonaws.com/geometries/' + geom.substr(0, geom.length - 4) + ".obj";
                                        objLoader.load(path, (root) => {
                                            root.castShadow = true;
                                            root.receiveShadow = true;
                                            root.traverse(function (child) {
                                                if (child instanceof THREE.Mesh) {
                                                    //                               child.receiveShadow = true;
                                                    child.castShadow = true;
                                                }
                                            });
                                            this.meshes[body + geom] = root;
                                            this.meshes[body + geom].scale.set(bd.scaleFactors[0], bd.scaleFactors[1], bd.scaleFactors[2])
                                            this.scene.add(root);
                                        })
                                    })
                                }
                            } finally {
                                this.trialLoading = false
                            }

                            this.onResize()
                            // animate

                            function delay(time) {
                                return new Promise(resolve => setTimeout(resolve, time));
                            }

                            delay(1000).then(() => {
                                this.togglePlay(true)
                            });
                        })
                    }
                } catch (error) {
                    apiError(error)
                    this.trialLoading = false
                }
            }
        },
        onResize() {
            const container = this.$refs.mocap
            if (container && this.renderer) {
                const width = container.clientWidth
                const height = container.clientHeight
                if (!width || !height) {
                    return
                }
                // Keep drawing buffer in sync with the visible canvas size.
                this.renderer.setSize(width, height, true)
                this.camera.aspect = width / height;
                this.camera.updateProjectionMatrix();
            }
        },
        animate() {
            // cancel display cycle if loading of new trial started
            if (!this.trialLoading) {
                requestAnimationFrame(this.animate)
                this.animateOneFrame()
            }
        },
        timeToFrame(time) {
            let duration = 0
            if (this.vid0()) duration = this.vid0().duration
            if (this.vid0() && !isNaN(this.vid0().duration)) {
              let framerate = this.frames.length / duration
              let t = parseFloat(time)
              return (Math.round(t * framerate)) > this.frames.length ? this.frames.length - 1 : (Math.round(t * framerate))
            } else {
              return 0
            }
        },
        animateOneFrame() {
            let cframe

            let frames = this.frames.length
            let duration = 0
            if (this.vid0()) duration = this.vid0().duration
            if (this.vid0() && !isNaN(this.vid0().duration)) {
                let framerate = frames / duration

                if (this.videos.length > 0) {
                    let t = 0
                    if (this.vid0()) t = this.vid0().currentTime;
                    cframe = (Math.round(t * framerate)) > this.frames.length ? this.frames.length - 1 : (Math.round(t * framerate))
                    this.frame = cframe
                    if (this.vid0()) this.time = this.frame == 0 ? 0 : parseFloat(this.vid0().currentTime.toFixed(2))
                } else {
                    cframe = this.frame++

                    if (this.frame >= this.frames.length) {
                        this.frame = this.frames.length - 1
                        this.time = this.vid0().duration
                    }
                }
                this.$emit('changeTimePosition', this.time)

                if (cframe < this.frames.length) {
                    // display the frame
                    let json = this.animation_json;
                    for (let body in json.bodies) {
                        json.bodies[body].attachedGeometries.forEach((geom) => {
                            if (this.meshes[body + geom]) {
                                this.meshes[body + geom].position.set(
                                    json.bodies[body].translation[cframe][0],
                                    json.bodies[body].translation[cframe][1],
                                    json.bodies[body].translation[cframe][2])
                                var euler = new THREE.Euler(
                                    json.bodies[body].rotation[cframe][0],
                                    json.bodies[body].rotation[cframe][1],
                                    json.bodies[body].rotation[cframe][2]);
                                this.meshes[body + geom].quaternion.setFromEuler(euler)
                            }
                        })
                    }
                }

                this.renderer.render(this.scene, this.camera)
                this.syncVideos()
            }
        },
        syncVideos() {
            if (this.synced || this.trial == null || this.videos.length == 0)
                return

            // will also reset all videos
            this.playSpeed = 1

            /*
            this.videos.forEach((video, index) => {
              const vid_element = this.videoElement(index)
              vid_element.playbackRate = 1
            })
            */

            this.synced = true
        },
        onVideoLoadMetadata(index) {
            if (index === 0) {
                this.videos.forEach((video, index) => {
                      const vid_element = this.videoElement(index)
                      vid_element.currentTime = this.timeStart
                })
            }
        },
        onVideoTimeUpdate(index) {
            if (index === 0) {
                this.videos.forEach((video, index) => {
                      const vid_element = this.videoElement(index)
                      if(vid_element.currentTime >= this.timeEnd) {
                          vid_element.currentTime = this.timeStart
                      }
                })
            }
        },
        onVideoEnded(index) {
            if (index === 0) {
                this.videos.forEach((video, index) => {
                    const vid_element = this.videoElement(index)
                    vid_element.currentTime = this.time = this.timeStart
                    vid_element.play()
                })
            }
        },
        videoElement(index) {
            const vid = this.$refs[`video-${index}`]

            return vid ? vid[0]: null
        },
        vid0() {
            return this.videoElement(0)
        },
        isSelected(trial) {
            return this.trial && this.trial.id === trial.id
        },
        eachVideo(func) {
            this.videos.forEach((video, index) => {
                func(this.videoElement(index))
            })
        },
        togglePlay(value) {
            this.playing = value

            if (this.playing) {
                this.animate()

                this.videos.forEach((video, index) => {
                    const vid_element = this.videoElement(index)
                    vid_element.play()
                })

            } else {
                this.videos.forEach((video, index) => {
                    const vid_element = this.videoElement(index)
                    vid_element.pause()
                })
            }
        },
        onNavigate(frame) {
            const step = this.vid0().duration / this.frames.length
            const newPosition = frame * step

            this.eachVideo(videoElement => {
                videoElement.currentTime = newPosition
            })

            this.animateOneFrame()
        },
        onChangeTime(time) {
            this.eachVideo(videoElement => {
                videoElement.currentTime = time
            })

            this.animateOneFrame()
        },
        onKeydown(event) {
            const activeTag = document.activeElement?.tagName?.toLowerCase()
            const isTypingTarget = ['input', 'textarea', 'select'].includes(activeTag) || document.activeElement?.isContentEditable
            if (isTypingTarget || this.videoControlsDisabled) {
                return
            }

            if (event.code === 'Space') {
                event.preventDefault()
                this.togglePlay(!this.playing)
                return
            }

            if (event.code === 'ArrowRight') {
                event.preventDefault()
                this.togglePlay(false)
                const nextFrame = Math.min(this.frame + 1, this.frames.length - 1)
                this.onNavigate(nextFrame)
                return
            }

            if (event.code === 'ArrowLeft') {
                event.preventDefault()
                this.togglePlay(false)
                const prevFrame = Math.max(this.frame - 1, 0)
                this.onNavigate(prevFrame)
            }
        },
        maxVideoDuration() {
            return this.vid0() ? (this.vid0().duration - 1) : 0
        },
    }
}
</script>

<style lang="scss">

.video-player {
    height: 100%;

    .left {
        width: 250px;

        .trials {
            overflow-y: auto;

            .trial {
                border-radius: 4px;
                padding: 2px 6px;

                &.selected {
                    background-color: #272727;
                    cursor: default;
                }
            }
        }
    }

    .viewer {
        height: 100%;

        #mocap {
            width: 100%;
            overflow: hidden;

            canvas {
                display: block;
                width: 100% !important;
                height: 100% !important;
            }
        }
    }

    .right {
        flex: 0 0 200px;
        height: 100%;

        .videos {
            overflow: hidden;
            width: 200px;
        }
    }
}

.video-controls-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 2px 0 4px;
}

.video-controls-row .time-input-wrap {
    width: 72px;
    min-width: 72px;
    max-width: 72px;
    flex: 0 0 72px;
}

.video-controls-row .slider-wrap {
    flex: 1;
    min-width: 120px;
}

/* Mobile optimizations */
@media (max-width: 960px) {
    .video-player {
        .right {
            flex: 0 0 120px;
            width: 120px;
            max-width: 30%;

            .videos {
                width: 100%;
                
                video {
                    width: 100%;
                    max-height: 80px;
                    object-fit: contain;
                }
            }
        }

        .viewer {
            .video-controls-row {
                flex-wrap: nowrap;
                gap: 4px;
                padding: 4px 0;
            }

            .video-controls-row .time-input-wrap {
                width: 64px;
                min-width: 64px;
                max-width: 64px;
                flex: 0 0 64px;
            }

            .video-controls-row .slider-wrap {
                flex: 1 1 auto;
                min-width: 0;
            }
        }
    }

    /* Reduce speed control size on mobile */
    .video-player .right .speed-control-button {
        min-width: 60px;
        font-size: 0.75rem;
        padding: 0 8px;

        .v-icon {
            font-size: 16px;
        }
    }
}
</style>
