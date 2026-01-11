'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Modified vertex shader to support instancing and per-instance random attribute
const vertex = `
  #ifdef GL_ES
  precision mediump float;
  #endif

  uniform float u_time;
  
  attribute float aRandom;
  varying float vRandom;
  
  void main() {
    vRandom = aRandom;
    vec3 newPosition = position;
    
    vec4 worldPosition = modelMatrix * instanceMatrix * vec4(newPosition, 1.0);
    vec4 mvPosition = viewMatrix * worldPosition;

    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragment = `
  #ifdef GL_ES
  precision mediump float;
  #endif

  uniform float u_time;
  varying float vRandom;


  // Colors: Lighter Green and Lighter Gold/Yellow (More visible)
  vec3 colorA = vec3(0.3, 0.8, 0.6); // Lighter Green
  vec3 colorB = vec3(1.0, 0.8, 0.4); // Lighter Gold

  void main() {
    // Static mix based on random value
    vec3 color = mix(colorA, colorB, vRandom); // Static blend based on random
    
    // Add subtle twinkling to alpha
    float alpha = 0.8 + 0.2 * sin(u_time * 2.0 + vRandom * 10.0);

    gl_FragColor = vec4(color, alpha);
  }
`

export function Globe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    controls: OrbitControls
    instancedMesh: THREE.InstancedMesh
    baseMesh: THREE.Mesh
    animationId: number
    material: THREE.ShaderMaterial
  } | null>(null)

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return

    const container = containerRef.current
    const canvas = canvasRef.current

    let sizes = {
      width: container.offsetWidth,
      height: container.offsetHeight,
    }

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(30, sizes.width / sizes.height, 1, 1000)
    camera.position.z = 100

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true, // Transparent background
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(sizes.width, sizes.height)

    // Lighting
    const pointLight = new THREE.PointLight(0x66ffcc, 20, 200)
    pointLight.position.set(-50, 0, 60)
    scene.add(pointLight)
    scene.add(new THREE.HemisphereLight(0x66ffcc, 0x102020, 2.0))

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.autoRotate = true
    controls.autoRotateSpeed = 2.0 // Very slow rotation
    controls.enableDamping = true
    controls.enableRotate = false // Disable user rotation
    controls.enablePan = false
    controls.enableZoom = false
    controls.minPolarAngle = Math.PI / 2 - 0.5
    controls.maxPolarAngle = Math.PI / 2 + 0.5

    // Globe Group (for tilt)
    const globeGroup = new THREE.Group()
    globeGroup.rotation.z = (22.5 * Math.PI) / 180 // Earth's tilt (approx 23.5, using 22.5 as requested)
    scene.add(globeGroup)

    // Base Sphere
    const baseSphere = new THREE.SphereGeometry(24.5, 24, 24)
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x66ffcc, // Bright mint green
      transparent: true,
      opacity: 0.15,
      side: THREE.FrontSide, // Ensure correct rendering
      depthWrite: false, // Critical: Prevent occlusion of back-side dots
    })
    const baseMesh = new THREE.Mesh(baseSphere, baseMaterial)
    globeGroup.add(baseMesh)

    // Shared Shader Material for InstancedMesh
    const material = new THREE.ShaderMaterial({
      // Optimization: Use BackSide for outward facing faces? Check geometry.
      // CircleGeometry faces +Z. We lookAt(0,0,0) (inwards).
      // So the +Z face points INWARDS. We see the BACK of the circle from outside using default FrontSide.
      // Actually, FrontSide culls back faces. If we lookAt(0,0,0), +Z is inwards.
      // Camera is outside. We see the "back" of the circle.
      // So enable DoubleSide or just fix orientation.
      // Let's use DoubleSide to be safe and easiest, or rotate 180.
      side: THREE.DoubleSide,
      uniforms: {
        u_time: { value: 1.0 },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false, // Helps with transparency sorting
    })

    // Map setup
    const dotSphereRadius = 25
    const activeLatLon: { [key: number]: number[] } = {}

    const readImageData = (imageData: Uint8ClampedArray) => {
      for (let i = 0, lon = -180, lat = 90; i < imageData.length; i += 4, lon++) {
        if (!activeLatLon[lat]) activeLatLon[lat] = []

        const red = imageData[i]
        const green = imageData[i + 1]
        const blue = imageData[i + 2]

        if (red < 80 && green < 80 && blue < 80) activeLatLon[lat].push(lon)

        if (lon === 180) {
          lon = -180
          lat--
        }
      }
    }

    const visibilityForCoordinate = (lon: number, lat: number): boolean => {
      let visible = false
      if (!activeLatLon[lat] || !activeLatLon[lat].length) return visible
      const closest = activeLatLon[lat].reduce((prev, curr) => {
        return Math.abs(curr - lon) < Math.abs(prev - lon) ? curr : prev
      })
      if (Math.abs(lon - closest) < 0.5) visible = true
      return visible
    }

    const calcPosFromLatLonRad = (lon: number, lat: number): THREE.Vector3 => {
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lon + 180) * (Math.PI / 180)
      const x = -(dotSphereRadius * Math.sin(phi) * Math.cos(theta))
      const z = dotSphereRadius * Math.sin(phi) * Math.sin(theta)
      const y = dotSphereRadius * Math.cos(phi)
      return new THREE.Vector3(x, y, z)
    }

    const createInstancedMesh = () => {
      const dotDensity = 1.8

      const instances: { position: THREE.Vector3; latIdx: number }[] = []

      for (let lat = 90, i = 0; lat > -90; lat--, i++) {
        const radius = Math.cos(Math.abs(lat) * (Math.PI / 180)) * dotSphereRadius
        const circumference = radius * Math.PI * 2
        const dotsForLat = circumference * dotDensity

        for (let x = 0; x < dotsForLat; x++) {
          const long = -180 + (x * 360) / dotsForLat
          if (!visibilityForCoordinate(long, lat)) continue

          const vector = calcPosFromLatLonRad(long, lat)
          instances.push({ position: vector, latIdx: i })
        }
      }

      const dotGeometry = new THREE.CircleGeometry(0.22, 5)
      const instancedMesh = new THREE.InstancedMesh(dotGeometry, material, instances.length)

      const dummy = new THREE.Object3D()
      const randoms = new Float32Array(instances.length)

      for (let i = 0; i < instances.length; i++) {
        const { position, latIdx } = instances[i]

        dummy.position.copy(position)
        dummy.lookAt(0, 0, 0)
        dummy.updateMatrix()
        instancedMesh.setMatrixAt(i, dummy.matrix)

        // Random 0..1
        randoms[i] = Math.random()
      }

      instancedMesh.instanceMatrix.needsUpdate = true
      instancedMesh.frustumCulled = false // Critical fix for disappearing dots

      // Explicit bounding sphere
      instancedMesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50)

      // Add custom attribute
      dotGeometry.setAttribute('aRandom', new THREE.InstancedBufferAttribute(randoms, 1))

      globeGroup.add(instancedMesh)
      return instancedMesh
    }

    // Load map image
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const imageCanvas = document.createElement('canvas')
      imageCanvas.width = image.width
      imageCanvas.height = image.height

      const context = imageCanvas.getContext('2d')
      if (context) {
        context.drawImage(image, 0, 0)
        const imageData = context.getImageData(0, 0, imageCanvas.width, imageCanvas.height)
        readImageData(imageData.data)
        sceneRef.current!.instancedMesh = createInstancedMesh()
      }
    }

    image.src = '/img/world_alpha_mini.jpg'

    const resize = () => {
      sizes = {
        width: container.offsetWidth,
        height: container.offsetHeight,
      }
      if (window.innerWidth > 700) camera.position.z = 100
      else camera.position.z = 140
      camera.aspect = sizes.width / sizes.height
      camera.updateProjectionMatrix()
      renderer.setSize(sizes.width, sizes.height)
    }

    window.addEventListener('resize', resize)

    const twinkleTime = 0.03
    let animationId: number = 0
    let isVisible = true

    const render = () => {
      if (!isVisible) {
        animationId = requestAnimationFrame(render)
        return
      }

      material.uniforms.u_time.value += twinkleTime
      globeGroup.rotation.y += 0.002 // Rotate the globe on its axis
      controls.update()
      renderer.render(scene, camera)
      animationId = requestAnimationFrame(render)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting
      },
      { threshold: 0.1 }
    )
    observer.observe(container)

    render()

    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      instancedMesh: null as any,
      baseMesh,
      animationId,
      material,
    }

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', resize) // Only resize event remains

      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId)
        sceneRef.current.renderer.dispose()
        sceneRef.current.controls.dispose()
        if (sceneRef.current.instancedMesh) {
          sceneRef.current.instancedMesh.geometry.dispose()
          sceneRef.current.material.dispose()
        }
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
