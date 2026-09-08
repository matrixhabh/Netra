'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Search, X, User, Building, Phone, Landmark, MapPin, Car, FileText, Smartphone } from 'lucide-react'
import { getNodeThemeColor } from './CriminalNetwork3D'
import { EntityType, NetworkNode } from '../../lib/types/network'

interface NetworkSearchProps {
  nodes: NetworkNode[]
  onSelectNode: (node: NetworkNode) => void
}

function getEntityIcon(type: EntityType) {
  switch (type) {
    case 'Person':
      return <User size={13} className="text-primary" />
    case 'Organization':
      return <Building size={13} className="text-primary" />
    case 'Phone':
      return <Phone size={13} className="text-[#C05621]" />
    case 'BankAccount':
      return <Landmark size={13} className="text-[#B38600]" />
    case 'Location':
      return <MapPin size={13} className="text-[#C53030]" />
    case 'Vehicle':
      return <Car size={13} className="text-[#C05621]" />
    case 'Case':
      return <FileText size={13} className="text-primary" />
    case 'Device':
    default:
      return <Smartphone size={13} className="text-[#C05621]" />
  }
}

export function NetworkSearch({ nodes, onSelectNode }: NetworkSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        inputRef.current?.focus()
      } else if (e.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter matching nodes
  const results = React.useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return nodes.filter((n) => {
      const matchLabel = n.label.toLowerCase().includes(q)
      const matchId = n.id.toLowerCase().includes(q)
      const matchType = n.type.toLowerCase().includes(q)
      const matchAlias = n.properties?.alias?.toLowerCase().includes(q)
      const matchVehicle = n.properties?.make?.toLowerCase().includes(q)
      const matchAccount = n.properties?.accountNumber?.toLowerCase().includes(q)
      const matchPhone = n.properties?.carrier?.toLowerCase().includes(q)
      return (
        matchLabel ||
        matchId ||
        matchType ||
        matchAlias ||
        matchVehicle ||
        matchAccount ||
        matchPhone
      )
    }).slice(0, 8)
  }, [query, nodes])

  const handleSelect = (node: NetworkNode) => {
    onSelectNode(node)
    setQuery(node.label)
    setIsOpen(false)
  }

  return (
    <div ref={searchContainerRef} className="relative w-72">
      {/* Search Bar Input */}
      <div className="relative flex items-center">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 text-muted-foreground"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search entities, vehicles, phones... [/]"
          className="h-9 w-full rounded-lg border border-border bg-card pr-8 pl-8 text-xs text-foreground placeholder:text-muted-foreground shadow-xs transition outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setIsOpen(false)
            }}
            className="absolute right-2.5 text-muted-foreground hover:text-foreground"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-11 left-0 z-40 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-card p-1.5 shadow-xl backdrop-blur-md text-foreground">
          <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            Matching Targets ({results.length})
          </div>
          {results.map((node) => {
            const riskColor = getNodeThemeColor(node.riskScore, false)
            return (
              <button
                key={node.id}
                onClick={() => handleSelect(node)}
                className="flex w-full items-center justify-between rounded-md p-2 text-left text-xs transition hover:bg-interactive"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted">
                    {getEntityIcon(node.type)}
                  </div>
                  <div className="truncate">
                    <div className="truncate font-semibold text-foreground">
                      {node.label}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span>{node.type}</span>
                      {node.clusterName && (
                        <>
                          <span>•</span>
                          <span className="truncate text-primary font-medium">
                            {node.clusterName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold"
                  style={{
                    backgroundColor: `${riskColor}18`,
                    color: riskColor,
                    border: `1px solid ${riskColor}40`,
                  }}
                >
                  {node.riskScore}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
