import * as THREE from 'three'

const PREFERRED_BODIES = ['pelvis', 'torso', 'body']

/**
 * Read pelvis (or fallback body) pose for a motion frame.
 * OpenSim body axes: +X anterior, +Y superior, +Z right.
 */
export function getPelvisPose(animationJson, frameIndex, frameCount = 0) {
  if (!animationJson?.bodies) {
    return null
  }

  const frame = Math.min(
    Math.max(0, frameIndex ?? 0),
    Math.max(0, (frameCount || 1) - 1)
  )

  for (const name of PREFERRED_BODIES) {
    const pose = poseFromBody(animationJson.bodies[name], frame)
    if (pose) {
      return pose
    }
  }

  let count = 0
  const sum = new THREE.Vector3()
  for (const bodyName in animationJson.bodies) {
    const translation = animationJson.bodies[bodyName]?.translation?.[frame]
    if (Array.isArray(translation) && translation.length >= 3) {
      sum.x += translation[0]
      sum.y += translation[1]
      sum.z += translation[2]
      count++
    }
  }

  if (count === 0) {
    return null
  }

  return buildPose(sum.multiplyScalar(1 / count), new THREE.Quaternion())
}

function poseFromBody(body, frame) {
  const translation = body?.translation?.[frame]
  if (!Array.isArray(translation) || translation.length < 3) {
    return null
  }

  const position = new THREE.Vector3(translation[0], translation[1], translation[2])
  const quaternion = new THREE.Quaternion()
  const rotation = body?.rotation?.[frame]
  if (Array.isArray(rotation) && rotation.length >= 3) {
    // Same Euler convention as mesh playback in Session/Visualizer.
    const euler = new THREE.Euler(rotation[0], rotation[1], rotation[2])
    quaternion.setFromEuler(euler)
  }

  return buildPose(position, quaternion)
}

function buildPose(position, quaternion) {
  const anterior = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion)
  const superior = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion)
  const right = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion)
  return { position, quaternion, anterior, superior, right }
}

export function getLookAtFromPose(pose, superiorOffset = 0.35) {
  return pose.position.clone().addScaledVector(pose.superior, superiorOffset)
}

/**
 * Place camera for an anatomical / default view relative to pelvis pose.
 */
export function placeCameraForView(camera, controls, view, pose, {
  distance = 5,
  heightBoost = 0.4
} = {}) {
  if (!camera || !controls || !pose) {
    return
  }

  const lookAt = getLookAtFromPose(pose)
  const { anterior, superior, right } = pose

  switch (view) {
    case 'frontal':
      camera.position.copy(lookAt)
        .addScaledVector(anterior, distance)
        .addScaledVector(superior, heightBoost)
      break
    case 'sagittal':
      camera.position.copy(lookAt)
        .addScaledVector(right, distance)
        .addScaledVector(superior, heightBoost)
      break
    case 'posterior':
      camera.position.copy(lookAt)
        .addScaledVector(anterior, -distance)
        .addScaledVector(superior, heightBoost)
      break
    case 'top':
    case 'transverse':
      // Tiny anterior offset avoids OrbitControls gimbal lock looking straight down.
      camera.position.copy(lookAt)
        .addScaledVector(superior, distance)
        .addScaledVector(anterior, 0.01)
      break
    case 'default':
    default:
      // Pelvis-relative version of the historic world offset (4.5, 3, -3).
      camera.position.copy(lookAt)
        .addScaledVector(anterior, 4.5)
        .addScaledVector(superior, 3)
        .addScaledVector(right, -3)
      break
  }

  controls.target.copy(lookAt)
  controls.update()
}

/**
 * Follow subject in XZ only, preserving the user's current viewpoint.
 * Applies horizontal pelvis deltas to camera + target so orbit/zoom/height stay as chosen.
 * Vertical pelvis motion is ignored (no bobbing).
 */
export function followSubjectHorizontally(
  camera,
  controls,
  pose,
  smoothedLookAt = null,
  smoothFactor = 0.18
) {
  if (!camera || !controls || !pose) {
    return smoothedLookAt
  }

  const targetX = pose.position.x
  const targetZ = pose.position.z

  if (!smoothedLookAt) {
    return { x: targetX, z: targetZ }
  }

  const alpha = Math.min(Math.max(smoothFactor, 0), 1)
  const lookX = smoothedLookAt.x + (targetX - smoothedLookAt.x) * alpha
  const lookZ = smoothedLookAt.z + (targetZ - smoothedLookAt.z) * alpha
  const dx = lookX - smoothedLookAt.x
  const dz = lookZ - smoothedLookAt.z

  if (dx !== 0 || dz !== 0) {
    controls.target.x += dx
    controls.target.z += dz
    camera.position.x += dx
    camera.position.z += dz
    controls.update()
  }

  return { x: lookX, z: lookZ }
}

/**
 * Snap follow framing onto the subject while keeping the current camera offset
 * (any orbit / zoom / height the user chose).
 */
export function snapFollowToSubject(camera, controls, pose) {
  if (!camera || !controls || !pose) {
    return null
  }

  const newX = pose.position.x
  const newZ = pose.position.z
  const dx = newX - controls.target.x
  const dz = newZ - controls.target.z
  controls.target.x = newX
  controls.target.z = newZ
  camera.position.x += dx
  camera.position.z += dz
  controls.update()

  return { x: newX, z: newZ }
}
