'use client'

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import {
  getCaseNetworkGraph,
  getCrossCaseGraph,
  getFullSyndicateGraph,
} from '../../lib/adapters/criminalNetworkAdapter'
import {
  calculateAllNetworkAnalytics,
} from '../../lib/networkAnalysis'
import {
  EntityType,
  NetworkFilterState,
  NetworkGraphData,
  NetworkNode,
} from '../../lib/types/network'
import { CriminalNetwork3D } from './CriminalNetwork3D'
import { EntityDetails } from './EntityDetails'
import { NetworkControls } from './NetworkControls'
import { NetworkFilters } from './NetworkFilters'
import { NetworkSearch } from './NetworkSearch'
import { NetworkSidebar } from './NetworkSidebar'

interface NetworkGraphContainerProps {
  initialCaseId?: string
  initialDataset?: 'syndicate' | 'case' | 'cross-case'
  embedded?: boolean
}

const DEFAULT_FILTER_STATE: NetworkFilterState = {
  entityTypes: [
    'Person',
    'Organization',
    'BankAccount',
    'Phone',
    'Location',
    'Vehicle',
    'Case',
    'Device',
  ],
  riskLevels: ['Critical', 'High', 'Medium', 'Low'],
  relationshipTypes: [],
  minWeight: 1,
  minConfidence: 0,
  selectedCluster: null,
}
const ENTITY_MEDIA_STORAGE_KEY = 'netra-entity-media-v1'
const ENTITY_MEDIA_SEEDED_KEY = 'netra-entity-media-seeded-v1'

const DEMO_ENTITY_MEDIA: Record<string, string> = {
  Person: '/demo/entities/person-demo.svg',
  Vehicle: '/demo/entities/vehicle-demo.svg',
  BankAccount: '/demo/entities/wallet-demo.svg',
}

export function NetworkGraphContainer({
  initialCaseId = 'C-1042',
  initialDataset = 'syndicate',
  embedded = false,
}: NetworkGraphContainerProps) {
  const [datasetType, setDatasetType] = useState<'syndicate' | 'case' | 'cross-case'>(initialDataset)
  const [caseId, setCaseId] = useState(initialCaseId)
  const [filterState, setFilterState] = useState<NetworkFilterState>(DEFAULT_FILTER_STATE)
  const [entityMedia, setEntityMedia] = useState<Record<string, string>>({})
  const [entityMediaReady, setEntityMediaReady] = useState(false)

  useEffect(() => {
  try {
    const stored = window.localStorage.getItem(ENTITY_MEDIA_STORAGE_KEY)

    if (stored) {
      const parsed = JSON.parse(stored)

      if (parsed && typeof parsed === 'object') {
        setEntityMedia(parsed)
      }
    }
  }
  catch {
    // Keep the graph usable even if localStorage is unavailable/corrupt.
    }
  finally {
    setEntityMediaReady(true)
    }
  }, [])

  useEffect(() => {
  if (!entityMediaReady) return

  try {
    window.localStorage.setItem(
      ENTITY_MEDIA_STORAGE_KEY,
      JSON.stringify(entityMedia)
    )
  } catch {
    // Do not break investigation UI if browser storage is full.
  }
  }, [entityMedia, entityMediaReady])

  // Interactive selection state
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null)

  // Camera & visualization options
  const [isAutoRotate, setIsAutoRotate] = useState(false)
  const [is2DMode, setIs2DMode] = useState(false)
  const [isPhysicsPaused, setIsPhysicsPaused] = useState(false)

  // Clear focus when dataset changes
  useEffect(() => {
    setSelectedNode(null)
    setFocusNodeId(null)
  }, [datasetType, caseId])

  // Fetch raw dataset based on selected view mode (cached by adapter)
  const rawGraphData: NetworkGraphData = useMemo(() => {
    switch (datasetType) {
      case 'case':
        return getCaseNetworkGraph(caseId)
      case 'cross-case':
        return getCrossCaseGraph()
      case 'syndicate':
      default:
        return getFullSyndicateGraph()
    }
  }, [datasetType, caseId])

  useEffect(() => {
  if (!entityMediaReady || !rawGraphData.nodes.length) return

  const alreadySeeded =
    window.localStorage.getItem(ENTITY_MEDIA_SEEDED_KEY) === '1'

  if (alreadySeeded) return

  setEntityMedia((current) => {
    const next = { ...current }

    ;(['Person', 'Vehicle', 'BankAccount'] as const).forEach((type) => {
      const node = rawGraphData.nodes.find((candidate) => candidate.type === type)

      if (node && !next[node.id]) {
        next[node.id] = DEMO_ENTITY_MEDIA[type]
      }
    })

    return next
  })

  window.localStorage.setItem(ENTITY_MEDIA_SEEDED_KEY, '1')
  }, [entityMediaReady, rawGraphData.nodes])

  const availableRelTypes = useMemo(() => {
    return Array.from(new Set(rawGraphData.links.map((l) => l.relationshipType)))
  }, [rawGraphData.links])

  // Apply real-time multi-factor filters with reference stability
  const filteredData: NetworkGraphData = useMemo(() => {
    const isDefaultFilter =
      filterState.entityTypes.length === 8 &&
      filterState.riskLevels.length === 4 &&
      filterState.relationshipTypes.length === 0 &&
      filterState.minWeight <= 1 &&
      filterState.minConfidence <= 0 &&
      !filterState.selectedCluster

    if (isDefaultFilter) {
      return rawGraphData
    }

    const allowedTypes = new Set(filterState.entityTypes)
    const allowedRisks = new Set(filterState.riskLevels)

    // Filter nodes
    const validNodes = rawGraphData.nodes.filter((node) => {
      if (!allowedTypes.has(node.type)) return false
      const level = node.riskLevel || 'Low'
      if (!allowedRisks.has(level)) return false
      if (filterState.selectedCluster && node.clusterId !== filterState.selectedCluster) {
        return false
      }
      return true
    })

    const validNodeIds = new Set(validNodes.map((n) => n.id))

    // Filter links connecting only valid nodes
    const validLinks = rawGraphData.links.filter((link) => {
      const sId = typeof link.source === 'string' ? link.source : (link.source as any).id
      const tId = typeof link.target === 'string' ? link.target : (link.target as any).id

      if (!validNodeIds.has(sId) || !validNodeIds.has(tId)) return false
      if ((link.weight || 1) < filterState.minWeight) return false
      if ((link.confidence ?? 1) < filterState.minConfidence) return false
      if (
        filterState.relationshipTypes.length > 0 &&
        !filterState.relationshipTypes.includes(link.relationshipType)
      ) {
        return false
      }

      return true
    })

    return {
      nodes: validNodes,
      links: validLinks,
    }
  }, [rawGraphData, filterState])

  // Consolidated single-pass analytics computation
  const { metrics, influencers, bridges, patterns, clusterList } = useMemo(() => {
    return calculateAllNetworkAnalytics(filteredData.nodes, filteredData.links)
  }, [filteredData])

  // Node selection handler
  const handleNodeSelect = useCallback((node: NetworkNode | null) => {
    setSelectedNode(node)
    if (node) {
      setFocusNodeId(node.id)
    }
  }, [])

  const handleEntityImageUpload = useCallback(
  (nodeId: string, imageUrl: string) => {
    setEntityMedia((current) => ({
      ...current,
      [nodeId]: imageUrl,
    }))
  },
  []
  )

  const handleEntityImageRemove = useCallback((nodeId: string) => {
    setEntityMedia((current) => {
      const next = { ...current }
      delete next[nodeId]
      return next
    })
  }, [])

  // Camera reset
  const handleResetCamera = useCallback(() => {
    setSelectedNode(null)
    setFocusNodeId(null)
  }, [])

  return (
    <div className={`relative flex flex-col overflow-hidden bg-card text-foreground ${embedded ? 'h-[520px] rounded-xl border border-border' : 'h-[calc(100vh-140px)] min-h-[640px] rounded-2xl border border-border shadow-lg'}`}>
      {/* Top Intelligence Header Bar */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/90 px-4 py-2.5 backdrop-blur-md">
        {/* Dataset View Mode Switcher */}
        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            Dataset:
          </span>
          <div className="flex rounded-lg border border-border bg-muted/70 p-0.5 text-xs font-semibold">
            <button
              onClick={() => {
                setDatasetType('syndicate')
                setSelectedNode(null)
              }}
              className={`rounded-md px-2.5 py-1 transition ${
                datasetType === 'syndicate'
                  ? 'bg-card text-foreground shadow-sm font-bold border border-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Syndicate Network (35+)
            </button>
            <button
              onClick={() => {
                setDatasetType('case')
                setSelectedNode(null)
              }}
              className={`rounded-md px-2.5 py-1 transition ${
                datasetType === 'case'
                  ? 'bg-card text-foreground shadow-sm font-bold border border-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Case C-1042 Scope
            </button>
            <button
              onClick={() => {
                setDatasetType('cross-case')
                setSelectedNode(null)
              }}
              className={`rounded-md px-2.5 py-1 transition ${
                datasetType === 'cross-case'
                  ? 'bg-card text-foreground shadow-sm font-bold border border-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Cross-FIR Nexus
            </button>
          </div>
        </div>

        {/* Filter Drawer & Entity Search */}
        <div className="flex items-center gap-2">
          <NetworkFilters
            filterState={filterState}
            onFilterChange={setFilterState}
            availableClusters={clusterList}
            availableRelTypes={availableRelTypes}
          />
          <NetworkSearch
            nodes={filteredData.nodes}
            onSelectNode={handleNodeSelect}
          />
        </div>
      </div>

      {/* Main 3D Canvas Area */}
      <div className="relative flex-1">
        {/* Left Analytics HUD Sidebar */}
        <NetworkSidebar
          metrics={metrics}
          influencers={influencers}
          bridges={bridges}
          patterns={patterns}
          onSelectNode={handleNodeSelect}
          onHighlightGroup={(nodeIds) => {
            const first = filteredData.nodes.find((n) => nodeIds.includes(n.id))
            if (first) handleNodeSelect(first)
          }}
        />

        {/* Floating Camera & Simulation Controls */}
        <NetworkControls
          onResetCamera={handleResetCamera}
          onToggleAutoRotate={() => setIsAutoRotate(!isAutoRotate)}
          isAutoRotate={isAutoRotate}
          onToggle2DMode={() => setIs2DMode(!is2DMode)}
          is2DMode={is2DMode}
          onTogglePhysics={() => setIsPhysicsPaused(!isPhysicsPaused)}
          isPhysicsPaused={isPhysicsPaused}
        />

        {/* 3D WebGL Canvas Engine */}
        <CriminalNetwork3D
          data={filteredData}
          selectedNode={selectedNode}
          onNodeSelect={handleNodeSelect}
          focusNodeId={focusNodeId}
          enableAutoRotate={isAutoRotate}
          is2DMode={is2DMode}
          entityMedia={entityMedia}
        />

        {/* Right Entity Profile Dossier */}
        <EntityDetails
          node={selectedNode}
          allNodes={rawGraphData.nodes}
          allLinks={rawGraphData.links}
          entityMedia={entityMedia}
          onUploadImage={handleEntityImageUpload}
          onRemoveImage={handleEntityImageRemove}
          onClose={() => setSelectedNode(null)}
          onFocusNode={(id) => setFocusNodeId(id)}
          onSelectNeighbor={handleNodeSelect}
        />
      </div>
    </div>
  )
}
