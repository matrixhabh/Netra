'use client'

import React, { useState } from 'react'
import {
  Eye,
  Orbit,
  Pause,
  Play,
  RotateCcw,
  Layers,
} from 'lucide-react'

interface NetworkControlsProps {
  onResetCamera: () => void
  onToggleAutoRotate: () => void
  isAutoRotate: boolean
  onToggle2DMode: () => void
  is2DMode: boolean
  onTogglePhysics?: () => void
  isPhysicsPaused?: boolean
}

export function NetworkControls({
  onResetCamera,
  onToggleAutoRotate,
  isAutoRotate,
  onToggle2DMode,
  is2DMode,
  onTogglePhysics,
  isPhysicsPaused = false,
}: NetworkControlsProps) {
  const [showLegend, setShowLegend] = useState(false)

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
      {/* Control Buttons Group */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-card/90 p-1 shadow-md backdrop-blur-md">
        <button
          onClick={onResetCamera}
          className="flex size-8 items-center justify-center rounded text-muted-foreground transition hover:bg-interactive hover:text-foreground"
          title="Reset Camera View"
          aria-label="Reset Camera View"
        >
          <RotateCcw size={15} />
        </button>

        <button
          onClick={onToggleAutoRotate}
          className={`flex size-8 items-center justify-center rounded transition ${
            isAutoRotate
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:bg-interactive hover:text-foreground'
          }`}
          title={isAutoRotate ? 'Stop Auto Orbit' : 'Start Auto Orbit'}
          aria-label="Toggle Auto Orbit"
        >
          <Orbit size={15} />
        </button>

        <button
          onClick={onToggle2DMode}
          className={`flex h-8 items-center gap-1 rounded px-2 text-[11px] font-semibold transition ${
            is2DMode
              ? 'bg-primary text-primary-foreground font-bold'
              : 'text-muted-foreground hover:bg-interactive hover:text-foreground'
          }`}
          title="Toggle 2D / 3D View"
          aria-label="Toggle 2D / 3D View"
        >
          <Layers size={13} />
          <span>{is2DMode ? '2D' : '3D'}</span>
        </button>

        {onTogglePhysics && (
          <button
            onClick={onTogglePhysics}
            className="flex size-8 items-center justify-center rounded text-muted-foreground transition hover:bg-interactive hover:text-foreground"
            title={isPhysicsPaused ? 'Resume Force Layout' : 'Freeze Layout'}
            aria-label="Toggle Physics Simulation"
          >
            {isPhysicsPaused ? <Play size={14} /> : <Pause size={14} />}
          </button>
        )}

        <button
          onClick={() => setShowLegend(!showLegend)}
          className={`flex size-8 items-center justify-center rounded transition ${
            showLegend
              ? 'bg-interactive text-primary'
              : 'text-muted-foreground hover:bg-interactive hover:text-foreground'
          }`}
          title="Toggle Entity Legend"
          aria-label="Toggle Entity Legend"
        >
          <Eye size={15} />
        </button>
      </div>

      {/* Floating 3D Entity & Risk Legend Panel */}
      {showLegend && (
        <div className="w-58 rounded-lg border border-border bg-card/95 p-3 text-[11px] shadow-xl backdrop-blur-md text-foreground">
          <div className="mb-2 border-b border-border pb-1.5 font-bold tracking-wider text-muted-foreground uppercase text-[9px]">
            3D Entity Geometry Legend
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-2 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#315C82]" />
              <span className="text-foreground">Person (Sphere)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rotate-45 border-2 border-[#315C82]" />
              <span className="text-foreground">Org (Diamond)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-xs bg-[#B38600]" />
              <span className="text-foreground">Asset (Cube)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-0 border-x-[5px] border-x-transparent border-b-[8px] border-b-[#C05621]" />
              <span className="text-foreground">Vehicle (Cone)</span>
            </div>
          </div>

          <div className="mt-3 mb-1.5 border-b border-border pb-1 font-bold tracking-wider text-muted-foreground uppercase text-[9px]">
            Risk Threat Matrix
          </div>
          <div className="flex items-center justify-between text-[10px] font-semibold">
            <span className="text-[#315C82]">● Low</span>
            <span className="text-[#B38600]">● Med</span>
            <span className="text-[#C05621]">● High</span>
            <span className="text-[#C53030] font-bold">● Crit</span>
          </div>
        </div>
      )}
    </div>
  )
}
