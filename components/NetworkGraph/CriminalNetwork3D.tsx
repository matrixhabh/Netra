'use client'

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import dynamic from 'next/dynamic'
import * as THREE from 'three'
import {
  findNeighbors,
} from '../../lib/networkAnalysis'
import {
  EntityType,
  NetworkGraphData,
  NetworkNode,
} from '../../lib/types/network'

// Dynamically import react-force-graph-3d with SSR disabled
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-background text-primary">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Initializing 3D Neural Engine...
        </span>
      </div>
    </div>
  ),
})

interface CriminalNetwork3DProps {
  data: NetworkGraphData
  selectedNode: NetworkNode | null
  onNodeSelect: (node: NetworkNode | null) => void
  onNodeHover?: (node: NetworkNode | null) => void
  focusNodeId?: string | null
  enableAutoRotate?: boolean
  is2DMode?: boolean
}

// ==========================================
// 1. SINGLETON GEOMETRY POOL
// Simple, meaningful 3D shapes:
// - 🔵 Sphere → Person / Suspect
// - 🔷 3D Diamond / Octahedron → Organization / Case
// - 🟠 Simple Cube → Bank Account / Location (Asset)
// - 🔺 Simple 3D Pyramid / Cone → Vehicle / Phone / Device
// ==========================================
const sharedGeometries: Record<string, THREE.BufferGeometry> = {}

function getSharedGeometry(type: EntityType): THREE.BufferGeometry {
  if (sharedGeometries[type]) return sharedGeometries[type]

  let geo: THREE.BufferGeometry
  switch (type) {
    case 'Person':
      // Sphere for individuals
      geo = new THREE.SphereGeometry(1, 20, 20)
      break
    case 'Organization':
    case 'Case':
      // 3D Diamond / Octahedron for organizations and domain anchors
      geo = new THREE.OctahedronGeometry(1.2, 0)
      break
    case 'BankAccount':
    case 'Location':
      // Simple Cube for locations and financial assets
      geo = new THREE.BoxGeometry(1.4, 1.4, 1.4)
      break
    case 'Vehicle':
      // 4-sided Pyramid for vehicles
      geo = new THREE.ConeGeometry(1.1, 2.0, 4)
      break
    case 'Phone':
      // Clean Cone for telecom endpoints
      geo = new THREE.ConeGeometry(1.0, 1.8, 14)
      break
    case 'Device':
    default:
      // Simple Pyramid for devices and hardware
      geo = new THREE.ConeGeometry(1.0, 1.8, 4)
      break
  }

  sharedGeometries[type] = geo
  return geo
}

// ==========================================
// 2. THEME RISK COLOR PALETTE & SHARED MATERIALS
// Optimized for cream/off-white and dark surfaces
// ==========================================
export function getNodeThemeColor(riskScore: number, isDark: boolean): string {
  if (riskScore >= 85) return isDark ? '#ef4444' : '#C53030' // Critical Crimson
  if (riskScore >= 65) return isDark ? '#f97316' : '#C05621' // High Terracotta
  if (riskScore >= 35) return isDark ? '#eab308' : '#B38600' // Medium Warm Ochre
  return isDark ? '#7698B5' : '#315C82'                     // Low Slate Navy Blue
}

const materialCache = new Map<string, THREE.Material>()
const textTextureCache = new Map<string, THREE.CanvasTexture>()
const MAX_TEXTURE_CACHE = 40

function getSharedNodeMaterial(
  colorHex: number,
  isDimmed: boolean,
  isSelected: boolean,
  isDark: boolean
): THREE.Material {
  const key = `${colorHex}_${isDimmed}_${isSelected}_${isDark}`
  if (materialCache.has(key)) {
    return materialCache.get(key)!
  }

  const mat = new THREE.MeshStandardMaterial({
    color: isDimmed ? (isDark ? 0x242d38 : 0xA0AAB4) : colorHex,
    roughness: 0.38,
    metalness: isDimmed ? 0.05 : 0.15,
    emissive: isSelected ? (isDark ? 0x1e3a5f : 0x1c3144) : 0x000000,
    emissiveIntensity: isSelected ? 0.35 : 0.0,
    transparent: isDimmed,
    opacity: isDimmed ? 0.32 : 0.98,
  })

  materialCache.set(key, mat)
  return mat
}

function getSharedSelectionMaterial(isDark: boolean): THREE.Material {
  const key = `sel_outline_${isDark}`
  if (materialCache.has(key)) return materialCache.get(key)!
  const mat = new THREE.MeshBasicMaterial({
    color: isDark ? 0x7698B5 : 0x315C82,
    wireframe: true,
    transparent: true,
    opacity: 0.75,
  })
  materialCache.set(key, mat)
  return mat
}

// Clean, high-contrast label card matching website UI
function getOrCreateLabelTexture(
  label: string,
  type: string,
  riskScore: number,
  isBridge: boolean,
  isSelected: boolean,
  isDimmed: boolean,
  isDark: boolean
): THREE.CanvasTexture {
  const cacheKey = `${label}_${type}_${riskScore}_${isBridge}_${isSelected}_${isDimmed}_${isDark}`
  if (textTextureCache.has(cacheKey)) {
    return textTextureCache.get(cacheKey)!
  }

  const canvas = document.createElement('canvas')
  canvas.width = 384
  canvas.height = 120
  const ctx = canvas.getContext('2d')

  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const riskColor = getNodeThemeColor(riskScore, isDark)
    const bgColor = isDark
      ? isDimmed ? 'rgba(21, 27, 32, 0.65)' : 'rgba(21, 27, 32, 0.95)'
      : isDimmed ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.96)'

    const borderColor = isSelected
      ? isDark ? '#7698B5' : '#315C82'
      : isDimmed
      ? isDark ? '#252C33' : '#D9D9D4'
      : isDark ? '#334155' : '#D0D0CA'

    // Card background with rounded corners
    const x = 12
    const y = 14
    const w = 360
    const h = 92
    const r = 8

    ctx.fillStyle = bgColor
    ctx.strokeStyle = borderColor
    ctx.lineWidth = isSelected ? 2.5 : 1.5

    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Risk indicator badge
    ctx.fillStyle = riskColor
    ctx.beginPath()
    ctx.arc(36, 44, 6, 0, Math.PI * 2)
    ctx.fill()

    // Entity Name - high contrast dark text on light cream, light text on dark
    ctx.font = 'bold 22px Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillStyle = isDimmed
      ? isDark ? '#68717A' : '#8C959F'
      : isDark ? '#ECEFF1' : '#15181B'
    const truncated = label.length > 20 ? label.slice(0, 19) + '…' : label
    ctx.fillText(truncated, 52, 51)

    // Type and Risk pill subtext
    ctx.font = '600 13px Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillStyle = isDimmed
      ? isDark ? '#68717A' : '#8C959F'
      : isDark ? '#89939D' : '#68717A'

    const bridgeBadge = isBridge ? '  •  ★ BRIDGE' : ''
    ctx.fillText(
      `${type.toUpperCase()}  •  RISK ${riskScore}/100${bridgeBadge}`,
      30,
      82
    )
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter

  if (textTextureCache.size >= MAX_TEXTURE_CACHE) {
    const oldest = textTextureCache.keys().next().value
    if (oldest) {
      const oldTex = textTextureCache.get(oldest)
      oldTex?.dispose()
      textTextureCache.delete(oldest)
    }
  }

  textTextureCache.set(cacheKey, texture)
  return texture
}

export function CriminalNetwork3D({
  data,
  selectedNode,
  onNodeSelect,
  onNodeHover,
  focusNodeId,
  enableAutoRotate = false,
  is2DMode = false,
}: CriminalNetwork3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<any>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null)
  const [hoveredPos, setHoveredPos] = useState<{ x: number; y: number } | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Track animation frame ID for rotation
  const animFrameRef = useRef<number | null>(null)

  // Observe theme changes from documentElement to sync 3D canvas background
  useEffect(() => {
    const checkDark = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDark()
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  // Responsive canvas resize observer
  useEffect(() => {
    if (!containerRef.current) return
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth || 800
        const h = containerRef.current.clientHeight || 600
        setDimensions((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }))
      }
    }
    updateSize()
    const ro = new ResizeObserver(updateSize)
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Calculate 1-hop focus neighborhood
  const { neighborIds } = useMemo(() => {
    if (!selectedNode) {
      return { neighborIds: new Set<string>() }
    }
    return findNeighbors(selectedNode.id, data.links)
  }, [selectedNode, data.links])

  // Camera glide to focused node
  useEffect(() => {
    if (!focusNodeId || !fgRef.current) return
    const node = data.nodes.find((n) => n.id === focusNodeId)
    if (node && typeof node.x === 'number' && typeof node.y === 'number') {
      const distance = 160
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, (node.z || 0) || 1)
      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: (node.z || 0) * distRatio },
        node,
        1200
      )
    }
  }, [focusNodeId, data.nodes])

  // 3D Physical Lighting Setup matching cream / off-white background
  useEffect(() => {
    if (!fgRef.current) return
    try {
      const scene = fgRef.current.scene?.()
      if (!scene) return

      // Remove previous lights to avoid accumulation
      const existingLights: THREE.Light[] = []
      scene.traverse((obj: any) => {
        if (obj.isLight) existingLights.push(obj)
      })
      existingLights.forEach((l) => scene.remove(l))

      // Soft ambient lighting for uniform base visibility
      const ambient = new THREE.AmbientLight(0xffffff, isDarkMode ? 0.65 : 0.88)
      scene.add(ambient)

      // Key directional light creating soft shadows and realistic depth
      const keyLight = new THREE.DirectionalLight(0xffffff, isDarkMode ? 0.85 : 1.05)
      keyLight.position.set(120, 180, 140)
      scene.add(keyLight)

      // Secondary fill light for subtle facet and specular balance
      const fillLight = new THREE.DirectionalLight(isDarkMode ? 0x315C82 : 0xF4F3EF, 0.4)
      fillLight.position.set(-100, -120, -100)
      scene.add(fillLight)
    } catch {
      // safe fallback
    }
  }, [isDarkMode])

  // ==========================================
  // 3. CLEAN 3D NODE RENDERER
  // Simplified geometric shapes with tangible physical depth
  // ==========================================
  const nodeThreeObject = useCallback(
    (node: any) => {
      const isSelected = selectedNode?.id === node.id
      const isNeighbor = neighborIds.has(node.id)
      const isDimmed = Boolean(selectedNode && !isSelected && !isNeighbor)

      // Radius scale based on Degree + Risk
      const deg = node.degree || 0
      const risk = node.riskScore || 0
      let radius = 4.5 + deg * 0.75 + (risk / 100) * 4.5
      if (node.type === 'Organization') radius *= 1.3
      if (node.isBridge) radius *= 1.2

      const riskColorStr = getNodeThemeColor(node.riskScore, isDarkMode)
      const colorHex = new THREE.Color(riskColorStr).getHex()

      const group = new THREE.Group()

      // Primary 3D mesh using clean unit geometry
      const geometry = getSharedGeometry(node.type)
      const material = getSharedNodeMaterial(colorHex, isDimmed, isSelected, isDarkMode)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.scale.set(radius, radius, radius)
      group.add(mesh)

      // Selection Indicator: Crisp geometric wireframe envelope (no decorative toruses or rings)
      if (isSelected) {
        const outlineMat = getSharedSelectionMaterial(isDarkMode)
        const outlineMesh = new THREE.Mesh(geometry, outlineMat)
        outlineMesh.scale.set(radius * 1.25, radius * 1.25, radius * 1.25)
        group.add(outlineMesh)
      }

      // Intelligent Label Visibility:
      // Avoid overcrowding by showing labels only for priority targets or on hover/selection
      const isHovered = hoveredNode?.id === node.id
      const isHighPriority =
        isSelected ||
        isHovered ||
        isNeighbor ||
        node.riskScore >= 85 ||
        Boolean(node.isBridge) ||
        deg >= 5

      if (isHighPriority) {
        const texture = getOrCreateLabelTexture(
          node.label,
          node.type,
          node.riskScore,
          Boolean(node.isBridge),
          isSelected,
          isDimmed,
          isDarkMode
        )
        const spriteMat = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          opacity: isDimmed ? 0.35 : 0.96,
          depthWrite: false,
        })
        const sprite = new THREE.Sprite(spriteMat)
        // Scaled down, anchored closely above node to eliminate overlapping
        sprite.scale.set(22, 6.8, 1)
        sprite.position.set(0, radius + 4.5, 0)
        group.add(sprite)
      }

      return group
    },
    [selectedNode, neighborIds, isDarkMode, hoveredNode]
  )

  // ==========================================
  // 4. SUBTLE, THEME-CONSISTENT LINK STYLING
  // ==========================================
  const linkColor = useCallback(
    (link: any) => {
      const isDirect =
        selectedNode &&
        (link.source.id === selectedNode.id ||
          link.target.id === selectedNode.id ||
          link.source === selectedNode.id ||
          link.target === selectedNode.id)

      if (selectedNode && !isDirect) {
        return isDarkMode ? 'rgba(30, 41, 59, 0.08)' : 'rgba(180, 185, 195, 0.18)'
      }

      if (link.isSuspicious || link.properties?.isSuspicious) {
        return isDarkMode ? 'rgba(239, 68, 68, 0.92)' : 'rgba(182, 111, 114, 0.92)'
      }

      return isDirect
        ? isDarkMode ? 'rgba(118, 152, 181, 0.95)' : 'rgba(49, 92, 130, 0.92)'
        : isDarkMode ? 'rgba(71, 85, 105, 0.45)' : 'rgba(49, 92, 130, 0.28)'
    },
    [selectedNode, isDarkMode]
  )

  const linkWidth = useCallback(
    (link: any) => {
      const isDirect =
        selectedNode &&
        (link.source.id === selectedNode.id ||
          link.target.id === selectedNode.id ||
          link.source === selectedNode.id ||
          link.target === selectedNode.id)

      const base = (link.weight || 5) * 0.22
      return isDirect ? base * 1.8 : base
    },
    [selectedNode]
  )

  const linkDirectionalParticles = useCallback(
    (link: any) => {
      if (selectedNode) {
        const isDirect =
          link.source.id === selectedNode.id ||
          link.target.id === selectedNode.id ||
          link.source === selectedNode.id ||
          link.target === selectedNode.id
        return isDirect ? 2 : 0
      }
      return link.isSuspicious ? 2 : 0
    },
    [selectedNode]
  )

  const linkDirectionalParticleSpeed = useCallback((link: any) => {
    return (link.weight || 5) * 0.0012
  }, [])

  const linkDirectionalParticleWidth = useCallback(
    (link: any) => {
      const isDirect =
        selectedNode &&
        (link.source.id === selectedNode.id ||
          link.target.id === selectedNode.id ||
          link.source === selectedNode.id ||
          link.target === selectedNode.id)
      return isDirect ? 2.0 : 1.3
    },
    [selectedNode]
  )

  const linkDirectionalParticleColor = useCallback((link: any) => {
    if (link.isSuspicious || link.properties?.isSuspicious) return '#B66F72'
    return '#315C82'
  }, [])

  // Interaction handlers
  const handleNodeClick = useCallback(
    (node: any) => {
      if (!node) return
      onNodeSelect(node)

      if (fgRef.current && typeof node.x === 'number') {
        const distance = 160
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, (node.z || 0) || 1)
        fgRef.current.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: (node.z || 0) * distRatio },
          node,
          1200
        )
      }
    },
    [onNodeSelect]
  )

  const handleBackgroundClick = useCallback(() => {
    onNodeSelect(null)
  }, [onNodeSelect])

  const handleNodeHover = useCallback(
    (node: any) => {
      setHoveredNode(node || null)
      if (onNodeHover) onNodeHover(node || null)
    },
    [onNodeHover]
  )

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      setHoveredPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }, [])

  // ==========================================
  // 5. FORCE SIMULATION CONFIGURATION
  // ==========================================
  useEffect(() => {
    if (!fgRef.current) return
    const fg = fgRef.current

    const linkForce = fg.d3Force('link')
    if (linkForce) {
      linkForce.distance((link: any) => {
        const w = link.weight || 5
        return Math.max(32, 105 - w * 6)
      })
      linkForce.strength((link: any) => {
        return Math.min(1, 0.3 + (link.weight || 5) * 0.08)
      })
    }

    const chargeForce = fg.d3Force('charge')
    if (chargeForce) {
      chargeForce.strength(-250).distanceMax(450)
    }

    if (fg.numDimensions) {
      fg.numDimensions(is2DMode ? 2 : 3)
    }
  }, [is2DMode])

  // ==========================================
  // 6. SYNCHRONIZED AUTO-ORBIT LOOP
  // ==========================================
  useEffect(() => {
    if (!fgRef.current || !enableAutoRotate) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
      return
    }

    let angle = 0
    const distance = 400

    const rotateLoop = () => {
      if (document.hidden) {
        animFrameRef.current = requestAnimationFrame(rotateLoop)
        return
      }

      if (fgRef.current) {
        angle += 0.0025
        fgRef.current.cameraPosition({
          x: distance * Math.sin(angle),
          z: distance * Math.cos(angle),
        })
      }
      animFrameRef.current = requestAnimationFrame(rotateLoop)
    }

    animFrameRef.current = requestAnimationFrame(rotateLoop)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
  }, [enableAutoRotate])

  // ==========================================
  // 7. WEBGL CLEANUP ON UNMOUNT
  // ==========================================
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }

      textTextureCache.forEach((tex) => tex.dispose())
      textTextureCache.clear()

      materialCache.forEach((mat) => mat.dispose())
      materialCache.clear()

      if (fgRef.current) {
        try {
          const scene = fgRef.current.scene?.()
          if (scene) {
            scene.traverse((obj: any) => {
              if (obj.geometry) obj.geometry.dispose()
              if (obj.material) {
                if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose())
                else obj.material.dispose()
              }
            })
          }
          const renderer = fgRef.current.renderer?.()
          if (renderer && typeof renderer.dispose === 'function') {
            renderer.dispose()
          }
        } catch {
          // ignore cleanup teardown edge-cases
        }
      }
    }
  }, [])

  // Canvas background matching website theme (#F4F3EF cream by default)
  const canvasBackgroundColor = isDarkMode ? '#090C0F' : '#F4F3EF'

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-background select-none"
      onMouseMove={handleMouseMove}
    >
      {/* 3D Force Graph Canvas */}
      <ForceGraph3D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        backgroundColor={canvasBackgroundColor}
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={false}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkDirectionalParticles={linkDirectionalParticles}
        linkDirectionalParticleSpeed={linkDirectionalParticleSpeed}
        linkDirectionalParticleWidth={linkDirectionalParticleWidth}
        linkDirectionalParticleColor={linkDirectionalParticleColor}
        linkDirectionalArrowLength={2.8}
        linkDirectionalArrowRelPos={0.88}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onBackgroundClick={handleBackgroundClick}
        enableNodeDrag={true}
        showNavInfo={false}
        warmupTicks={30}
        cooldownTicks={80}
      />

      {/* High-Contrast Interactive Hover HUD Tooltip */}
      {hoveredNode && hoveredPos && (
        <div
          className="pointer-events-none absolute z-30 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md transition-opacity duration-150 text-foreground"
          style={{
            left: `${Math.min(hoveredPos.x + 16, dimensions.width - 240)}px`,
            top: `${Math.min(hoveredPos.y + 16, dimensions.height - 180)}px`,
            width: '230px',
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold text-foreground">
              {hoveredNode.label}
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{
                backgroundColor: `${getNodeThemeColor(hoveredNode.riskScore, isDarkMode)}18`,
                color: getNodeThemeColor(hoveredNode.riskScore, isDarkMode),
                border: `1px solid ${getNodeThemeColor(hoveredNode.riskScore, isDarkMode)}40`,
              }}
            >
              Risk {hoveredNode.riskScore}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
            <div>
              <span className="block text-[8px] uppercase tracking-wider text-muted-foreground font-semibold">
                Entity Type
              </span>
              <strong className="text-foreground font-medium">{hoveredNode.type}</strong>
            </div>
            <div>
              <span className="block text-[8px] uppercase tracking-wider text-muted-foreground font-semibold">
                Connections
              </span>
              <strong className="text-foreground font-medium">
                {hoveredNode.degree ?? '—'}
              </strong>
            </div>
          </div>

          {hoveredNode.clusterName && (
            <div className="mt-2 border-t border-border pt-1.5 text-[9px] text-primary font-medium">
              <span className="text-muted-foreground">Cluster: </span>
              {hoveredNode.clusterName}
            </div>
          )}

          {hoveredNode.isBridge && (
            <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400">
              <span>★ Key Articulation Bridge</span>
            </div>
          )}
        </div>
      )}

      {/* Discrete Corner Status Indicators */}
      <div className="pointer-events-none absolute top-4 left-4 font-mono text-[9px] text-muted-foreground/75 uppercase tracking-widest font-semibold">
        NETRA // 3D TOPOLOGY V4.2
      </div>
      <div className="pointer-events-none absolute right-4 bottom-4 font-mono text-[9px] text-muted-foreground/75 font-semibold">
        [3D FORCE ACTIVE]
      </div>
    </div>
  )
}
