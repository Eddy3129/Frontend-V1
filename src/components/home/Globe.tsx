'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'

const vertex = `
  #ifdef GL_ES
  precision mediump float;
  #endif

  uniform float u_time;
  uniform float u_maxExtrusion;

  void main() {
    vec3 newPosition = position;
    if(u_maxExtrusion > 1.0) newPosition.xyz = newPosition.xyz * u_maxExtrusion + sin(u_time);
    else newPosition.xyz = newPosition.xyz * u_maxExtrusion;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
  }
`

const fragment = `
  #ifdef GL_ES
  precision mediump float;
  #endif

  uniform float u_time;

  // Teal and gold colors
  vec3 colorA = vec3(0.051, 0.580, 0.533); // #0d9488 primary teal
  vec3 colorB = vec3(0.925, 0.694, 0.349); // #ecb159 accent gold

  void main() {
    vec3  color = vec3(0.0);
    float pct   = abs(sin(u_time));
          color = mix(colorA, colorB, pct);

    gl_FragColor = vec4(color, 0.9);
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
    materials: THREE.ShaderMaterial[]
    baseMesh: THREE.Mesh
    animationId: number
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(sizes.width, sizes.height)

    // Lighting
    const pointLight = new THREE.PointLight(0x4ce0a5, 20, 200)
    pointLight.position.set(-50, 0, 60)
    scene.add(pointLight)
    scene.add(new THREE.HemisphereLight(0x4ce0a5, 0x102020, 2.0))

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.autoRotate = true
    controls.autoRotateSpeed = 10
    controls.enableDamping = true
    controls.enableRotate = true
    controls.enablePan = false
    controls.enableZoom = false
    controls.minPolarAngle = Math.PI / 2 - 0.5
    controls.maxPolarAngle = Math.PI / 2 + 0.5

    // Base Sphere - transparent green
    const baseSphere = new THREE.SphereGeometry(24.5, 35, 35)
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x4ce0a5, // Light green color
      transparent: true,
      opacity: 0.1, // More transparent
    })
    const baseMesh = new THREE.Mesh(baseSphere, baseMaterial)
    scene.add(baseMesh)

    // Shader material for dots
    const materials: THREE.ShaderMaterial[] = []
    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        u_time: { value: 1.0 },
        u_maxExtrusion: { value: 1.0 },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
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

    const createMaterial = (timeValue: number): THREE.ShaderMaterial => {
      const mat = material.clone()
      mat.uniforms.u_time.value = timeValue * Math.sin(Math.random())
      materials.push(mat)
      return mat
    }

    const setDots = () => {
      const dotDensity = 2.5
      let vector = new THREE.Vector3()

      for (let lat = 90, i = 0; lat > -90; lat--, i++) {
        const radius = Math.cos(Math.abs(lat) * (Math.PI / 180)) * dotSphereRadius
        const circumference = radius * Math.PI * 2
        const dotsForLat = circumference * dotDensity

        for (let x = 0; x < dotsForLat; x++) {
          const long = -180 + (x * 360) / dotsForLat

          if (!visibilityForCoordinate(long, lat)) continue

          vector = calcPosFromLatLonRad(long, lat)

          const dotGeometry = new THREE.CircleGeometry(0.1, 5)
          dotGeometry.lookAt(vector)
          dotGeometry.translate(vector.x, vector.y, vector.z)

          const m = createMaterial(i)
          const mesh = new THREE.Mesh(dotGeometry, m)

          scene.add(mesh)
        }
      }
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

        setDots()
      }
    }

    image.src = '/img/world_alpha_mini.jpg'

    // Raycaster for interaction
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    let isIntersecting = false
    let minMouseDownFlag = false
    let mouseDown = false
    let grabbing = false

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

    const mousemove = (event: MouseEvent) => {
      isIntersecting = false

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

      raycaster.setFromCamera(mouse, camera)

      const intersects = raycaster.intersectObject(baseMesh)
      if (intersects[0]) {
        isIntersecting = true
        if (!grabbing) document.body.style.cursor = 'pointer'
      } else {
        if (!grabbing) document.body.style.cursor = 'default'
      }
    }

    const mousedown = () => {
      if (!isIntersecting) return

      materials.forEach((el) => {
        gsap.to(el.uniforms.u_maxExtrusion, {
          value: 1.07,
        })
      })

      mouseDown = true
      minMouseDownFlag = false

      setTimeout(() => {
        minMouseDownFlag = true
        if (!mouseDown) mouseup()
      }, 500)

      document.body.style.cursor = 'grabbing'
      grabbing = true
    }

    const mouseup = () => {
      mouseDown = false
      if (!minMouseDownFlag) return

      materials.forEach((el) => {
        gsap.to(el.uniforms.u_maxExtrusion, {
          value: 1.0,
          duration: 0.15,
        })
      })

      grabbing = false
      if (isIntersecting) document.body.style.cursor = 'pointer'
      else document.body.style.cursor = 'default'
    }

    // Event listeners
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', mousemove)
    window.addEventListener('mousedown', mousedown)
    window.addEventListener('mouseup', mouseup)

    // Render loop
    const twinkleTime = 0.03
    let animationId: number = 0

    const render = () => {
      materials.forEach((el) => {
        el.uniforms.u_time.value += twinkleTime
      })

      controls.update()
      renderer.render(scene, camera)
      animationId = requestAnimationFrame(render)
    }

    render()

    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      materials,
      baseMesh,
      animationId,
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', mousemove)
      window.removeEventListener('mousedown', mousedown)
      window.removeEventListener('mouseup', mouseup)

      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId)
        sceneRef.current.renderer.dispose()
        sceneRef.current.controls.dispose()
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
