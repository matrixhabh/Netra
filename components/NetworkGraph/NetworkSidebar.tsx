'use client'

import React, { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Award,
  ChevronLeft,
  ChevronRight,
  GitFork,
  Network,
} from 'lucide-react'
import { getNodeThemeColor } from './CriminalNetwork3D'
import {
  BridgeNodeInfo,
  NetworkMetrics,
  NetworkNode,
  SuspiciousPattern,
  TopInfluencers,
} from '../../lib/types/network'

interface NetworkSidebarProps {
  metrics: NetworkMetrics
  influencers: TopInfluencers
  bridges: BridgeNodeInfo[]
  patterns: SuspiciousPattern[]
  onSelectNode: (node: NetworkNode) => void
  onHighlightGroup?: (nodeIds: string[]) => void
}

type TabType = 'metrics' | 'influencers' | 'bridges' | 'patterns'

export function NetworkSidebar({
  metrics,
  influencers,
  bridges,
  patterns,
  onSelectNode,
  onHighlightGroup,
}: NetworkSidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('metrics')
  const [influencerMetric, setInfluencerMetric] = useState<'degree' | 'betweenness' | 'pagerank'>('degree')

  useEffect(() => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setIsOpen(false)
    }
  }, [])

  return (
    <div
      className={`network-sidebar absolute top-4 bottom-4 left-4 z-20 flex transition-all duration-300 ${
        isOpen ? 'w-84' : 'w-10'
      }`}
    >
      {/* Expanded Intelligence Sidebar */}
      {isOpen ? (
        <div className="flex h-full w-full flex-col rounded-xl border border-border bg-card/95 shadow-xl backdrop-blur-md text-foreground">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-3.5">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Network size={15} />
              </span>
              <div>
                <h3 className="text-xs font-bold text-foreground">
                  Intelligence HUD
                </h3>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Network Analytics & Alerts
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="network-hud-collapse rounded-lg p-1 text-muted-foreground transition hover:bg-interactive hover:text-foreground"
              aria-label="Collapse HUD"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border bg-muted/40 text-[10px] font-semibold">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 transition ${
                activeTab === 'metrics'
                  ? 'border-b-2 border-primary text-primary font-bold bg-card/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Activity size={12} />
              <span>Metrics</span>
            </button>
            <button
              onClick={() => setActiveTab('influencers')}
              className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 transition ${
                activeTab === 'influencers'
                  ? 'border-b-2 border-primary text-primary font-bold bg-card/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Award size={12} />
              <span>Influencers</span>
            </button>
            <button
              onClick={() => setActiveTab('bridges')}
              className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 transition ${
                activeTab === 'bridges'
                  ? 'border-b-2 border-primary text-primary font-bold bg-card/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GitFork size={12} />
              <span>Bridges</span>
              {bridges.length > 0 && (
                <span className="rounded bg-amber-500/20 px-1 text-[8px] font-bold text-amber-700 dark:text-amber-400">
                  {bridges.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('patterns')}
              className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 transition ${
                activeTab === 'patterns'
                  ? 'border-b-2 border-primary text-primary font-bold bg-card/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <AlertTriangle size={12} />
              <span>Alerts</span>
              {patterns.length > 0 && (
                <span className="rounded bg-red-500/20 px-1 text-[8px] font-bold text-red-600 dark:text-red-400">
                  {patterns.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-3 text-xs intel-hud-scrollbar">
            {/* 1. Network Metrics Tab */}
            {activeTab === 'metrics' && (
              <div className="space-y-3">
                <div className="text-[10px] font-bold tracking-wider text-foreground uppercase">
                  Network Intelligence Topology
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border bg-surface p-2.5">
                    <span className="block text-[9px] text-muted-foreground uppercase font-semibold">
                      Total Entities
                    </span>
                    <strong className="text-lg font-bold text-foreground">
                      {metrics.totalEntities}
                    </strong>
                  </div>
                  <div className="rounded-lg border border-border bg-surface p-2.5">
                    <span className="block text-[9px] text-muted-foreground uppercase font-semibold">
                      Relationships
                    </span>
                    <strong className="text-lg font-bold text-primary">
                      {metrics.totalRelationships}
                    </strong>
                  </div>
                  <div className="rounded-lg border border-border bg-surface p-2.5">
                    <span className="block text-[9px] text-muted-foreground uppercase font-semibold">
                      Network Density
                    </span>
                    <strong className="text-lg font-bold text-foreground">
                      {(metrics.networkDensity * 100).toFixed(1)}%
                    </strong>
                  </div>
                  <div className="rounded-lg border border-border bg-surface p-2.5">
                    <span className="block text-[9px] text-muted-foreground uppercase font-semibold">
                      Clusters Detected
                    </span>
                    <strong className="text-lg font-bold text-foreground">
                      {metrics.clusterCount}
                    </strong>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-surface p-3">
                  <span className="block text-[9px] font-bold text-foreground uppercase">
                    Risk Threat Assessment
                  </span>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
                      Critical Risk Entities (85+)
                    </span>
                    <strong className="font-mono text-sm text-red-600 dark:text-red-400 font-bold">
                      {metrics.criticalCount}
                    </strong>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                      High Risk Entities (65–84)
                    </span>
                    <strong className="font-mono text-sm text-amber-600 dark:text-amber-400 font-bold">
                      {metrics.highRiskCount}
                    </strong>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-surface p-2.5 text-[11px] text-muted-foreground">
                  <p className="leading-relaxed">
                    Average degrees per entity is{' '}
                    <strong className="text-foreground font-bold">{metrics.avgDegree}</strong>.
                    Tight modularity indicates partitioned operational syndicates.
                  </p>
                </div>
              </div>
            )}

            {/* 2. Top Influencers Tab */}
            {activeTab === 'influencers' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider text-foreground uppercase">
                    Syndicate Influencers
                  </span>
                  <div className="flex rounded border border-border bg-muted/40 p-0.5 text-[9px]">
                    <button
                      onClick={() => setInfluencerMetric('degree')}
                      className={`rounded px-1.5 py-0.5 font-medium transition ${
                        influencerMetric === 'degree'
                          ? 'bg-card text-foreground font-bold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Degree
                    </button>
                    <button
                      onClick={() => setInfluencerMetric('betweenness')}
                      className={`rounded px-1.5 py-0.5 font-medium transition ${
                        influencerMetric === 'betweenness'
                          ? 'bg-card text-foreground font-bold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Between
                    </button>
                    <button
                      onClick={() => setInfluencerMetric('pagerank')}
                      className={`rounded px-1.5 py-0.5 font-medium transition ${
                        influencerMetric === 'pagerank'
                          ? 'bg-card text-foreground font-bold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      PageRank
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {(influencerMetric === 'degree'
                    ? influencers.byDegree
                    : influencerMetric === 'betweenness'
                    ? influencers.byBetweenness
                    : influencers.byPageRank
                  ).map((node, rank) => {
                    const riskColor = getNodeThemeColor(node.riskScore, false)
                    return (
                      <button
                        key={node.id}
                        onClick={() => onSelectNode(node)}
                        className="flex w-full items-center justify-between rounded-lg border border-border bg-surface p-2 text-left transition hover:border-primary/40 hover:bg-interactive"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">
                            #{rank + 1}
                          </span>
                          <div className="truncate">
                            <div className="truncate text-xs font-semibold text-foreground">
                              {node.label}
                            </div>
                            <div className="text-[9px] text-muted-foreground">
                              {node.type} • {node.clusterName || 'Syndicate'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                            style={{
                              backgroundColor: `${riskColor}18`,
                              color: riskColor,
                              border: `1px solid ${riskColor}35`,
                            }}
                          >
                            {influencerMetric === 'degree'
                              ? `${node.degree} links`
                              : influencerMetric === 'betweenness'
                              ? `B:${node.betweenness}`
                              : `PR:${node.pageRank}`}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 3. Key Bridges Tab */}
            {activeTab === 'bridges' && (
              <div className="space-y-3">
                <div className="text-[10px] font-bold tracking-wider text-foreground uppercase">
                  Cross-Cluster Articulation Bridges
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Neutralizing these bridge couriers severs operational links between distinct criminal groups.
                </p>

                <div className="space-y-2">
                  {bridges.map((b) => (
                    <button
                      key={b.node.id}
                      onClick={() => onSelectNode(b.node)}
                      className="w-full rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-left transition hover:border-amber-500 hover:bg-amber-500/10"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          {b.node.label}
                        </span>
                        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          ★ Critical Bridge
                        </span>
                      </div>

                      <div className="mt-1 text-[10px] text-muted-foreground">
                        Bridges {b.connectedClusters.join(' ↔ ')}
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-[9px] text-primary font-semibold">
                        <span>{b.bridgedEntitiesCount} direct contacts</span>
                        <span className="font-bold">Focus Node ›</span>
                      </div>
                    </button>
                  ))}
                  {bridges.length === 0 && (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      No articulation cut vertices identified.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 4. Suspicious Pattern Alerts Tab */}
            {activeTab === 'patterns' && (
              <div className="space-y-3">
                <div className="text-[10px] font-bold tracking-wider text-foreground uppercase">
                  Flagged Threat Patterns ({patterns.length})
                </div>

                <div className="space-y-2">
                  {patterns.map((pat) => (
                    <div
                      key={pat.id}
                      className={`rounded-lg border p-2.5 transition ${
                        pat.severity === 'Critical'
                          ? 'border-red-500/30 bg-red-500/5'
                          : 'border-amber-500/30 bg-amber-500/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            pat.severity === 'Critical'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {pat.title}
                        </span>
                        <span className="rounded border border-border bg-card px-1.5 py-0.5 text-[8px] font-bold uppercase text-foreground">
                          {pat.severity}
                        </span>
                      </div>

                      <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                        {pat.description}
                      </p>

                      {onHighlightGroup && (
                        <button
                          onClick={() => onHighlightGroup(pat.nodeIds)}
                          className="mt-2 text-[10px] font-semibold text-primary hover:underline"
                        >
                          Highlight Involved Targets ({pat.nodeIds.length}) ›
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Collapsed Sidebar Handle */
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card/90 text-primary shadow-lg backdrop-blur-md hover:bg-interactive hover:text-foreground"
          aria-label="Expand HUD"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  )
}
