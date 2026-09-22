'use client'

import React from 'react'
import {
  X,
  ArrowRight,
  ArrowLeft,
  FileText,
  Target,
} from 'lucide-react'
import { getRiskLevel } from '../../lib/networkAnalysis'
import { getNodeThemeColor } from './CriminalNetwork3D'
import { NetworkEdge, NetworkNode } from '../../lib/types/network'

interface EntityDetailsProps {
  node: NetworkNode | null
  allNodes: NetworkNode[]
  allLinks: NetworkEdge[]
  onClose: () => void
  onFocusNode: (nodeId: string) => void
  onSelectNeighbor: (node: NetworkNode) => void
}

export function EntityDetails({
  node,
  allNodes,
  allLinks,
  onClose,
  onFocusNode,
  onSelectNeighbor,
}: EntityDetailsProps) {
  if (!node) return null

  const nodeMap = React.useMemo(() => {
    const map = new Map<string, NetworkNode>()
    allNodes.forEach((n) => map.set(n.id, n))
    return map
  }, [allNodes])

  // Extract direct relationships for this entity
  const directRelationships = React.useMemo(() => {
    const rels: {
      direction: 'out' | 'in'
      type: string
      targetNode: NetworkNode
      weight: number
      confidence: number
      properties?: Record<string, any>
    }[] = []

    allLinks.forEach((link) => {
      const sId = typeof link.source === 'string' ? link.source : (link.source as any).id
      const tId = typeof link.target === 'string' ? link.target : (link.target as any).id

      if (sId === node.id) {
        const target = nodeMap.get(tId)
        if (target) {
          rels.push({
            direction: 'out',
            type: link.relationshipType,
            targetNode: target,
            weight: link.weight,
            confidence: link.confidence,
            properties: link.properties,
          })
        }
      } else if (tId === node.id) {
        const source = nodeMap.get(sId)
        if (source) {
          rels.push({
            direction: 'in',
            type: link.relationshipType,
            targetNode: source,
            weight: link.weight,
            confidence: link.confidence,
            properties: link.properties,
          })
        }
      }
    })

    return rels
  }, [node, allLinks, nodeMap])

  const riskColor = getNodeThemeColor(node.riskScore, false)
  const riskLevel = getRiskLevel(node.riskScore)

  return (
    <div className="absolute top-4 right-4 bottom-4 z-30 flex w-88 flex-col rounded-xl border border-border bg-card/95 shadow-xl backdrop-blur-md text-foreground animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Dossier Header */}
      <div className="flex items-start justify-between border-b border-border p-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${riskColor}18`,
                color: riskColor,
                border: `1px solid ${riskColor}40`,
              }}
            >
              {riskLevel} Risk • {node.riskScore}/100
            </span>
            {node.isBridge && (
              <span className="flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-300 border border-amber-500/30">
                ★ Key Bridge
              </span>
            )}
          </div>
          <h3 className="mt-1.5 text-base font-bold text-foreground">
            {node.label}
          </h3>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{node.type}</span> • ID: <span className="font-mono">{node.id}</span>
          </p>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-1 text-muted-foreground transition hover:bg-interactive hover:text-foreground"
          aria-label="Close dossier"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable Intelligence Body */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs intel-hud-scrollbar">
        {/* Risk & Centrality Intelligence Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border bg-surface p-2 text-center">
            <span className="block text-[8px] tracking-wider text-muted-foreground uppercase font-semibold">
              Degree
            </span>
            <strong className="text-sm font-bold text-foreground">
              {node.degree ?? directRelationships.length}
            </strong>
          </div>
          <div className="rounded-lg border border-border bg-surface p-2 text-center">
            <span className="block text-[8px] tracking-wider text-muted-foreground uppercase font-semibold">
              Exposure
            </span>
            <strong
              className="text-sm font-bold"
              style={{ color: getNodeThemeColor(node.riskInfluence || node.riskScore, false) }}
            >
              {node.riskInfluence || node.riskScore}
            </strong>
          </div>
          <div className="rounded-lg border border-border bg-surface p-2 text-center">
            <span className="block text-[8px] tracking-wider text-muted-foreground uppercase font-semibold">
              PageRank
            </span>
            <strong className="text-sm font-bold text-primary">
              {node.pageRank ? node.pageRank.toFixed(2) : '0.85'}
            </strong>
          </div>
        </div>

        {/* Cluster Affiliation */}
        {node.clusterName && (
          <div className="rounded-lg border border-border bg-surface p-2.5">
            <div className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
              Assigned Criminal Cluster
            </div>
            <div className="mt-1 flex items-center gap-2 font-semibold text-foreground">
              <span className="size-2 rounded-full bg-primary" />
              <span>{node.clusterName}</span>
            </div>
          </div>
        )}

        {/* Known Relationships / 1-Hop Network */}
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold tracking-wider text-foreground uppercase">
              Known Relationships ({directRelationships.length})
            </h4>
            <span className="text-[9px] text-muted-foreground font-medium">Click to jump</span>
          </div>

          <div className="mt-2 space-y-1.5">
            {directRelationships.map((rel, idx) => (
              <button
                key={idx}
                onClick={() => onSelectNeighbor(rel.targetNode)}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-surface p-2 text-left transition hover:border-primary/40 hover:bg-interactive"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-foreground">
                    {rel.direction === 'out' ? (
                      <ArrowRight size={11} className="text-primary" />
                    ) : (
                      <ArrowLeft size={11} className="text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <div className="truncate">
                    <span className="block truncate text-xs font-semibold text-foreground">
                      {rel.targetNode.label}
                    </span>
                    <span className="block font-mono text-[9px] text-muted-foreground">
                      {rel.type}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="block text-[9px] font-bold text-foreground">
                    W:{rel.weight}
                  </span>
                  <span className="block text-[8px] font-medium text-emerald-600 dark:text-emerald-400">
                    {Math.round(rel.confidence * 100)}% conf
                  </span>
                </div>
              </button>
            ))}
            {directRelationships.length === 0 && (
              <p className="py-2 text-center text-xs text-muted-foreground">
                No direct connections recorded.
              </p>
            )}
          </div>
        </div>

        {/* Associated Case Files */}
        {node.properties?.associatedCases && (
          <div>
            <h4 className="text-[10px] font-bold tracking-wider text-foreground uppercase">
              Associated FIRs & Cases
            </h4>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {node.properties.associatedCases.map((c: string) => (
                <span
                  key={c}
                  className="flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary border border-primary/20"
                >
                  <FileText size={11} />
                  <span>{c}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Important Node Attributes */}
        <div>
          <h4 className="text-[10px] font-bold tracking-wider text-foreground uppercase">
            Investigative Intelligence Attributes
          </h4>
          <dl className="mt-2 divide-y divide-border rounded-lg border border-border bg-surface p-2.5">
            {Object.entries(node.properties || {})
              .filter(([key]) => key !== 'associatedCases')
              .map(([key, val]) => (
                <div key={key} className="flex justify-between py-1.5 text-[11px]">
                  <dt className="text-muted-foreground font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </dt>
                  <dd className="font-semibold text-foreground text-right max-w-[55%] truncate">
                    {String(val)}
                  </dd>
                </div>
              ))}
          </dl>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="flex items-center gap-2 border-t border-border p-3">
        <button
          onClick={() => onFocusNode(node.id)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90"
        >
          <Target size={13} />
          <span>Center in 3D</span>
        </button>
        <button
          onClick={onClose}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-interactive"
        >
          Clear Focus
        </button>
      </div>
    </div>
  )
}
