'use client'

import React, { useState } from 'react'
import { Filter, RotateCcw, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { ClusterInfo, EntityType, NetworkFilterState, RiskLevel } from '../../lib/types/network'

interface NetworkFiltersProps {
  filterState: NetworkFilterState
  onFilterChange: (next: NetworkFilterState) => void
  availableClusters: ClusterInfo[]
  availableRelTypes: string[]
}

const ALL_ENTITY_TYPES: { type: EntityType; label: string }[] = [
  { type: 'Person', label: 'Person / Suspect' },
  { type: 'Organization', label: 'Organization' },
  { type: 'BankAccount', label: 'Bank Account' },
  { type: 'Phone', label: 'Phone Number' },
  { type: 'Location', label: 'Location' },
  { type: 'Vehicle', label: 'Vehicle' },
  { type: 'Case', label: 'Case / Domain' },
  { type: 'Device', label: 'Device / Hardware' },
]

const ALL_RISK_LEVELS: { level: RiskLevel; label: string; color: string }[] = [
  { level: 'Critical', label: 'Critical (85+)', color: '#C53030' },
  { level: 'High', label: 'High (65–84)', color: '#C05621' },
  { level: 'Medium', label: 'Medium (35–64)', color: '#B38600' },
  { level: 'Low', label: 'Low (<35)', color: '#315C82' },
]

export function NetworkFilters({
  filterState,
  onFilterChange,
  availableClusters,
  availableRelTypes,
}: NetworkFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Toggle single entity type
  const toggleEntityType = (type: EntityType) => {
    const exists = filterState.entityTypes.includes(type)
    const next = exists
      ? filterState.entityTypes.filter((t) => t !== type)
      : [...filterState.entityTypes, type]
    onFilterChange({ ...filterState, entityTypes: next })
  }

  // Toggle single risk level
  const toggleRiskLevel = (level: RiskLevel) => {
    const exists = filterState.riskLevels.includes(level)
    const next = exists
      ? filterState.riskLevels.filter((l) => l !== level)
      : [...filterState.riskLevels, level]
    onFilterChange({ ...filterState, riskLevels: next })
  }

  // Reset to default
  const handleReset = () => {
    onFilterChange({
      entityTypes: ALL_ENTITY_TYPES.map((e) => e.type),
      riskLevels: ['Critical', 'High', 'Medium', 'Low'],
      relationshipTypes: [],
      minWeight: 1,
      minConfidence: 0,
      selectedCluster: null,
    })
  }

  // Count active modifications from default
  const activeModificationsCount =
    (ALL_ENTITY_TYPES.length - filterState.entityTypes.length) +
    (ALL_RISK_LEVELS.length - filterState.riskLevels.length) +
    (filterState.minWeight > 1 ? 1 : 0) +
    (filterState.minConfidence > 0 ? 1 : 0) +
    (filterState.selectedCluster ? 1 : 0)

  return (
    <div className="relative z-30">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold shadow-md backdrop-blur-md transition ${
          isOpen || activeModificationsCount > 0
            ? 'border-primary bg-interactive text-foreground font-bold'
            : 'border-border bg-card/90 text-muted-foreground hover:bg-interactive hover:text-foreground'
        }`}
      >
        <Filter size={13} className="text-muted-foreground" />
        <span>Intelligence Filters</span>
        {activeModificationsCount > 0 && (
          <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {activeModificationsCount}
          </span>
        )}
        {isOpen ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
      </button>

      {/* Filter Drawer Card */}
      {isOpen && (
        <div className="absolute top-11 left-0 w-80 rounded-xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur-md text-foreground animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <span className="text-xs font-bold tracking-wider uppercase text-foreground">
              Filter Network Matrix
            </span>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
            >
              <RotateCcw size={10} />
              <span>Reset</span>
            </button>
          </div>

          {/* Cluster Selector */}
          <div className="mt-3">
            <label className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Target Criminal Cluster
            </label>
            <select
              value={filterState.selectedCluster || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filterState,
                  selectedCluster: e.target.value ? e.target.value : null,
                })
              }
              className="mt-1 w-full rounded-md border border-border bg-surface p-1.5 text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="" className="bg-card text-foreground">All Syndicate Sub-Networks</option>
              {availableClusters.map((c) => (
                <option key={c.id} value={c.id} className="bg-card text-foreground">
                  {c.name} ({c.nodeCount})
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type Checkboxes */}
          <div className="mt-3">
            <label className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Entity Classification ({filterState.entityTypes.length}/
              {ALL_ENTITY_TYPES.length})
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {ALL_ENTITY_TYPES.map(({ type, label }) => {
                const checked = filterState.entityTypes.includes(type)
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleEntityType(type)}
                    className={`flex items-center gap-1.5 rounded p-1.5 text-left text-[11px] font-medium transition ${
                      checked
                        ? 'bg-surface text-foreground border border-primary/40 font-semibold'
                        : 'bg-surface/50 text-muted-foreground border border-border/60 hover:bg-interactive hover:text-foreground'
                    }`}
                  >
                    <div
                      className={`flex size-3.5 items-center justify-center rounded border text-[9px] ${
                        checked
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card'
                      }`}
                    >
                      {checked && <Check size={10} strokeWidth={3} />}
                    </div>
                    <span className="truncate">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Risk Level Toggles */}
          <div className="mt-3">
            <label className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Risk Hierarchy
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {ALL_RISK_LEVELS.map(({ level, label, color }) => {
                const checked = filterState.riskLevels.includes(level)
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggleRiskLevel(level)}
                    className={`flex items-center gap-1.5 rounded p-1.5 text-[11px] font-medium transition ${
                      checked
                        ? 'bg-surface text-foreground border border-primary/40 font-semibold'
                        : 'bg-surface/50 text-muted-foreground border border-border/60 hover:bg-interactive hover:text-foreground'
                    }`}
                  >
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Min Strength Slider */}
          <div className="mt-3 border-t border-border pt-2.5">
            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
              <span>Min Relationship Weight</span>
              <strong className="text-foreground font-bold">{filterState.minWeight} / 10</strong>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={filterState.minWeight}
              onChange={(e) =>
                onFilterChange({
                  ...filterState,
                  minWeight: Number(e.target.value),
                })
              }
              className="mt-1 w-full accent-primary"
            />
          </div>

          {/* Min Confidence Slider */}
          <div className="mt-2.5">
            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
              <span>Evidence Confidence Threshold</span>
              <strong className="text-foreground font-bold">
                {Math.round(filterState.minConfidence * 100)}%
              </strong>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={filterState.minConfidence}
              onChange={(e) =>
                onFilterChange({
                  ...filterState,
                  minConfidence: Number(e.target.value),
                })
              }
              className="mt-1 w-full accent-primary"
            />
          </div>
        </div>
      )}
    </div>
  )
}
