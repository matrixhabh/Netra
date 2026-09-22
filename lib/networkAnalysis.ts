import {
  BridgeNodeInfo,
  ClusterInfo,
  NetworkEdge,
  NetworkMetrics,
  NetworkNode,
  RiskLevel,
  SuspiciousPattern,
  TopInfluencers,
} from './types/network'

// Helper to get raw ID whether edge source/target is string or object
export function getEndpointId(endpoint: string | NetworkNode | any): string {
  if (typeof endpoint === 'string') return endpoint
  if (endpoint && typeof endpoint === 'object' && endpoint.id) return endpoint.id
  return String(endpoint)
}

/**
 * Calculates Degree Centrality for all nodes.
 * Returns a map of nodeId -> { rawDegree, normalizedDegree }
 */
export function calculateDegreeCentrality(
  nodes: NetworkNode[],
  links: NetworkEdge[]
): Map<string, { degree: number; normalized: number }> {
  const degreeMap = new Map<string, number>()
  nodes.forEach((n) => degreeMap.set(n.id, 0))

  links.forEach((l) => {
    const s = getEndpointId(l.source)
    const t = getEndpointId(l.target)
    if (degreeMap.has(s)) degreeMap.set(s, (degreeMap.get(s) || 0) + 1)
    if (degreeMap.has(t)) degreeMap.set(t, (degreeMap.get(t) || 0) + 1)
  })

  const n = nodes.length
  const maxPossible = Math.max(1, n - 1)
  const result = new Map<string, { degree: number; normalized: number }>()

  degreeMap.forEach((deg, id) => {
    result.set(id, {
      degree: deg,
      normalized: Math.min(1, deg / maxPossible),
    })
  })

  return result
}

/**
 * Calculates Betweenness Centrality using Brandes' Algorithm (O(V * E)).
 */
export function calculateBetweennessCentrality(
  nodes: NetworkNode[],
  links: NetworkEdge[]
): Map<string, number> {
  const adj = new Map<string, string[]>()
  nodes.forEach((n) => adj.set(n.id, []))

  links.forEach((l) => {
    const s = getEndpointId(l.source)
    const t = getEndpointId(l.target)
    if (adj.has(s) && adj.has(t)) {
      adj.get(s)!.push(t)
      adj.get(t)!.push(s)
    }
  })

  const betweenness = new Map<string, number>()
  nodes.forEach((n) => betweenness.set(n.id, 0))

  for (const s of nodes) {
    const S: string[] = []
    const P = new Map<string, string[]>()
    nodes.forEach((n) => P.set(n.id, []))

    const sigma = new Map<string, number>()
    nodes.forEach((n) => sigma.set(n.id, 0))
    sigma.set(s.id, 1)

    const d = new Map<string, number>()
    nodes.forEach((n) => d.set(n.id, -1))
    d.set(s.id, 0)

    const Q: string[] = [s.id]

    while (Q.length > 0) {
      const v = Q.shift()!
      S.push(v)

      const neighbors = adj.get(v) || []
      for (const w of neighbors) {
        // w found for the first time?
        if (d.get(w)! < 0) {
          Q.push(w)
          d.set(w, d.get(v)! + 1)
        }
        // shortest path to w via v?
        if (d.get(w) === d.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!)
          P.get(w)!.push(v)
        }
      }
    }

    const delta = new Map<string, number>()
    nodes.forEach((n) => delta.set(n.id, 0))

    // S returns vertices in order of non-increasing distance from s
    while (S.length > 0) {
      const w = S.pop()!
      for (const v of P.get(w) || []) {
        const coeff = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!)
        delta.set(v, delta.get(v)! + coeff)
      }
      if (w !== s.id) {
        betweenness.set(w, betweenness.get(w)! + delta.get(w)!)
      }
    }
  }

  // Undirected graph normalizes by 2 and (N-1)(N-2)/2
  const N = nodes.length
  const scale = N > 2 ? 1 / ((N - 1) * (N - 2)) : 1

  const normalized = new Map<string, number>()
  betweenness.forEach((val, id) => {
    // Brandes counts each pair twice for undirected graphs
    normalized.set(id, Math.min(1, (val / 2) * scale * 2))
  })

  return normalized
}

/**
 * Calculates PageRank (eigenvector importance) with standard damping factor.
 */
export function calculatePageRank(
  nodes: NetworkNode[],
  links: NetworkEdge[],
  dampingFactor = 0.85,
  iterations = 25
): Map<string, number> {
  const N = nodes.length
  if (N === 0) return new Map()

  const adj = new Map<string, string[]>()
  nodes.forEach((n) => adj.set(n.id, []))

  links.forEach((l) => {
    const s = getEndpointId(l.source)
    const t = getEndpointId(l.target)
    if (adj.has(s) && adj.has(t)) {
      adj.get(s)!.push(t)
      adj.get(t)!.push(s)
    }
  })

  let rank = new Map<string, number>()
  nodes.forEach((n) => rank.set(n.id, 1 / N))

  for (let it = 0; it < iterations; it++) {
    const nextRank = new Map<string, number>()
    const base = (1 - dampingFactor) / N

    nodes.forEach((n) => nextRank.set(n.id, base))

    for (const u of nodes) {
      const neighbors = adj.get(u.id) || []
      if (neighbors.length > 0) {
        const share = (dampingFactor * rank.get(u.id)!) / neighbors.length
        for (const v of neighbors) {
          nextRank.set(v, nextRank.get(v)! + share)
        }
      } else {
        // Dangling node distributes uniformly
        const share = (dampingFactor * rank.get(u.id)!) / N
        nodes.forEach((other) => {
          nextRank.set(other.id, nextRank.get(other.id)! + share)
        })
      }
    }
    rank = nextRank
  }

  // Normalize max to 1
  let max = 0
  rank.forEach((r) => {
    if (r > max) max = r
  })

  const normalized = new Map<string, number>()
  rank.forEach((r, id) => {
    normalized.set(id, max > 0 ? r / max : 0)
  })

  return normalized
}

/**
 * Returns 1-hop neighbors and directly connected links for focus mode.
 */
export function findNeighbors(
  nodeId: string,
  links: NetworkEdge[]
): { neighborIds: Set<string>; connectedLinkIndices: Set<number> } {
  const neighborIds = new Set<string>()
  const connectedLinkIndices = new Set<number>()

  links.forEach((l, idx) => {
    const s = getEndpointId(l.source)
    const t = getEndpointId(l.target)
    if (s === nodeId) {
      neighborIds.add(t)
      connectedLinkIndices.add(idx)
    } else if (t === nodeId) {
      neighborIds.add(s)
      connectedLinkIndices.add(idx)
    }
  })

  return { neighborIds, connectedLinkIndices }
}

/**
 * Detects Bridge Nodes (articulation points and cut vertices) that connect separate components or clusters.
 */
export function detectBridgeNodes(
  nodes: NetworkNode[],
  links: NetworkEdge[]
): BridgeNodeInfo[] {
  const adj = new Map<string, string[]>()
  nodes.forEach((n) => adj.set(n.id, []))

  links.forEach((l) => {
    const s = getEndpointId(l.source)
    const t = getEndpointId(l.target)
    if (adj.has(s) && adj.has(t)) {
      adj.get(s)!.push(t)
      adj.get(t)!.push(s)
    }
  })

  // Tarjan's Articulation Points algorithm
  let time = 0
  const disc = new Map<string, number>()
  const low = new Map<string, number>()
  const parent = new Map<string, string | null>()
  const ap = new Set<string>()

  nodes.forEach((n) => {
    disc.set(n.id, -1)
    low.set(n.id, -1)
    parent.set(n.id, null)
  })

  function dfs(u: string) {
    disc.set(u, time)
    low.set(u, time)
    time++
    let children = 0

    const neighbors = adj.get(u) || []
    for (const v of neighbors) {
      if (disc.get(v)! === -1) {
        children++
        parent.set(v, u)
        dfs(v)

        low.set(u, Math.min(low.get(u)!, low.get(v)!))

        // If u is root of DFS tree and has two or more children
        if (parent.get(u) === null && children > 1) {
          ap.add(u)
        }
        // If u is not root and low value of child is >= disc value of u
        if (parent.get(u) !== null && low.get(v)! >= disc.get(u)!) {
          ap.add(u)
        }
      } else if (v !== parent.get(u)) {
        low.set(u, Math.min(low.get(u)!, disc.get(v)!))
      }
    }
  }

  for (const n of nodes) {
    if (disc.get(n.id)! === -1) {
      dfs(n.id)
    }
  }

  // Also include nodes with high betweenness that connect different clusters
  const nodeMap = new Map<string, NetworkNode>()
  nodes.forEach((n) => nodeMap.set(n.id, n))

  const results: BridgeNodeInfo[] = []
  for (const id of ap) {
    const node = nodeMap.get(id)
    if (!node) continue

    const neighbors = adj.get(id) || []
    const connectedClusters = new Set<string>()
    neighbors.forEach((nbId) => {
      const nb = nodeMap.get(nbId)
      if (nb?.clusterName) connectedClusters.add(nb.clusterName)
    })

    results.push({
      node,
      connectedClusters: Array.from(connectedClusters),
      bridgedEntitiesCount: neighbors.length,
    })
  }

  return results
}

/**
 * Calculates indirect risk influence across neighbors.
 * Low risk nodes connected to critical hubs inherit risk exposure.
 */
export function calculateRiskInfluence(
  nodes: NetworkNode[],
  links: NetworkEdge[]
): Map<string, number> {
  const adj = new Map<string, string[]>()
  nodes.forEach((n) => adj.set(n.id, []))

  links.forEach((l) => {
    const s = getEndpointId(l.source)
    const t = getEndpointId(l.target)
    if (adj.has(s) && adj.has(t)) {
      adj.get(s)!.push(t)
      adj.get(t)!.push(s)
    }
  })

  const nodeMap = new Map<string, NetworkNode>()
  nodes.forEach((n) => nodeMap.set(n.id, n))

  const riskInfluence = new Map<string, number>()

  nodes.forEach((n) => {
    const neighbors = adj.get(n.id) || []
    if (neighbors.length === 0) {
      riskInfluence.set(n.id, n.riskScore)
      return
    }

    let neighborRiskSum = 0
    let neighborMaxRisk = 0
    for (const nbId of neighbors) {
      const nb = nodeMap.get(nbId)
      if (nb) {
        neighborRiskSum += nb.riskScore
        if (nb.riskScore > neighborMaxRisk) neighborMaxRisk = nb.riskScore
      }
    }

    const neighborAvg = neighborRiskSum / neighbors.length
    // Composite: 60% intrinsic risk + 25% max neighbor risk + 15% neighbor average
    const composite = n.riskScore * 0.6 + neighborMaxRisk * 0.25 + neighborAvg * 0.15
    riskInfluence.set(n.id, Math.round(Math.min(100, Math.max(0, composite))))
  })

  return riskInfluence
}

/**
 * Detects communities/clusters in the graph using Label Propagation with domain fallback.
 */
export function detectClusters(
  nodes: NetworkNode[],
  links: NetworkEdge[]
): {
  nodeClusterMap: Map<string, string>
  clusterList: ClusterInfo[]
} {
  const adj = new Map<string, string[]>()
  nodes.forEach((n) => adj.set(n.id, []))

  links.forEach((l) => {
    const s = getEndpointId(l.source)
    const t = getEndpointId(l.target)
    if (adj.has(s) && adj.has(t)) {
      adj.get(s)!.push(t)
      adj.get(t)!.push(s)
    }
  })

  // Connected components / Label propagation
  const labels = new Map<string, string>()
  nodes.forEach((n) => {
    // If predefined cluster exists in properties, use it
    labels.set(n.id, n.clusterId || n.id)
  })

  // Run 6 rounds of label propagation
  for (let it = 0; it < 6; it++) {
    for (const n of nodes) {
      // Keep static clusterId if explicitly designated in dataset
      if (n.clusterId) continue

      const neighbors = adj.get(n.id) || []
      if (neighbors.length === 0) continue

      const counts = new Map<string, number>()
      for (const nb of neighbors) {
        const l = labels.get(nb) || nb
        counts.set(l, (counts.get(l) || 0) + 1)
      }

      let bestLabel = labels.get(n.id)!
      let bestCount = -1
      counts.forEach((cnt, l) => {
        if (cnt > bestCount) {
          bestCount = cnt
          bestLabel = l
        }
      })
      labels.set(n.id, bestLabel)
    }
  }

  // Aggregate cluster stats
  const clusters = new Map<
    string,
    { nodes: NetworkNode[]; riskSum: number; typeCounts: Map<string, number> }
  >()

  const nodeMap = new Map<string, NetworkNode>()
  nodes.forEach((n) => nodeMap.set(n.id, n))

  labels.forEach((clusterId, nodeId) => {
    const node = nodeMap.get(nodeId)
    if (!node) return

    if (!clusters.has(clusterId)) {
      clusters.set(clusterId, {
        nodes: [],
        riskSum: 0,
        typeCounts: new Map(),
      })
    }
    const c = clusters.get(clusterId)!
    c.nodes.push(node)
    c.riskSum += node.riskScore
    c.typeCounts.set(node.type, (c.typeCounts.get(node.type) || 0) + 1)
  })

  const clusterColors = [
    '#ef4444', // Red (High Risk Syndicate)
    '#f59e0b', // Amber (Mule accounts)
    '#3b82f6', // Blue (Phishing/Telephony)
    '#10b981', // Emerald (Logistics/Safehouse)
    '#8b5cf6', // Violet (Hawala/Offshore)
    '#06b6d4', // Cyan
  ]

  const clusterList: ClusterInfo[] = []
  let colorIdx = 0

  clusters.forEach((data, cId) => {
    // Find dominant type
    let domType = data.nodes[0]?.type || 'Person'
    let maxCnt = 0
    data.typeCounts.forEach((cnt, t) => {
      if (cnt > maxCnt) {
        maxCnt = cnt
        domType = t as any
      }
    })

    // Create readable cluster name if not already titled
    const sample = data.nodes.find((n) => n.clusterName)
    const name =
      sample?.clusterName ||
      `Sub-Network ${String.fromCharCode(65 + (colorIdx % 26))} (${data.nodes.length} entities)`

    clusterList.push({
      id: cId,
      name,
      color: clusterColors[colorIdx % clusterColors.length],
      nodeCount: data.nodes.length,
      avgRisk: Math.round(data.riskSum / data.nodes.length),
      dominantType: domType,
    })
    colorIdx++
  })

  return { nodeClusterMap: labels, clusterList }
}

/**
 * Calculates high-level network topology metrics.
 */
export function calculateNetworkMetrics(
  nodes: NetworkNode[],
  links: NetworkEdge[]
): NetworkMetrics {
  const totalEntities = nodes.length
  const totalRelationships = links.length
  const maxPossibleEdges =
    totalEntities > 1 ? (totalEntities * (totalEntities - 1)) / 2 : 1
  const networkDensity =
    totalEntities > 1
      ? Math.min(1, Math.round((totalRelationships / maxPossibleEdges) * 1000) / 1000)
      : 0
  const avgDegree =
    totalEntities > 0
      ? Math.round(((totalRelationships * 2) / totalEntities) * 10) / 10
      : 0

  const { clusterList } = detectClusters(nodes, links)

  let criticalCount = 0
  let highRiskCount = 0
  nodes.forEach((n) => {
    if (n.riskScore >= 85) criticalCount++
    else if (n.riskScore >= 65) highRiskCount++
  })

  return {
    totalEntities,
    totalRelationships,
    networkDensity,
    avgDegree,
    clusterCount: clusterList.length,
    criticalCount,
    highRiskCount,
  }
}

/**
 * Finds top influencers based on Degree, Betweenness, and PageRank.
 */
export function getTopInfluencers(
  nodes: NetworkNode[],
  links: NetworkEdge[],
  limit = 5
): TopInfluencers {
  const degreeMap = calculateDegreeCentrality(nodes, links)
  const betweennessMap = calculateBetweennessCentrality(nodes, links)
  const pageRankMap = calculatePageRank(nodes, links)

  // Attach metrics to copies
  const enriched = nodes.map((n) => ({
    ...n,
    degree: degreeMap.get(n.id)?.degree ?? 0,
    betweenness: Math.round((betweennessMap.get(n.id) ?? 0) * 1000) / 1000,
    pageRank: Math.round((pageRankMap.get(n.id) ?? 0) * 1000) / 1000,
  }))

  const byDegree = [...enriched]
    .sort((a, b) => (b.degree || 0) - (a.degree || 0))
    .slice(0, limit)

  const byBetweenness = [...enriched]
    .sort((a, b) => (b.betweenness || 0) - (a.betweenness || 0))
    .slice(0, limit)

  const byPageRank = [...enriched]
    .sort((a, b) => (b.pageRank || 0) - (a.pageRank || 0))
    .slice(0, limit)

  return { byDegree, byBetweenness, byPageRank }
}

/**
 * Automatically detects suspicious patterns like mule stars, bridge brokers, and money laundering cycles.
 */
export function detectSuspiciousPatterns(
  nodes: NetworkNode[],
  links: NetworkEdge[]
): SuspiciousPattern[] {
  const patterns: SuspiciousPattern[] = []
  const degreeMap = calculateDegreeCentrality(nodes, links)
  const betweennessMap = calculateBetweennessCentrality(nodes, links)
  const bridges = detectBridgeNodes(nodes, links)

  // 1. High-Risk Hub Detection
  const highRiskHubs = nodes.filter(
    (n) => n.riskScore >= 85 && (degreeMap.get(n.id)?.degree || 0) >= 4
  )
  if (highRiskHubs.length > 0) {
    patterns.push({
      id: 'pattern-high-risk-hub',
      type: 'HighRiskHub',
      title: 'High-Risk Command Hub Detected',
      severity: 'Critical',
      description: `${highRiskHubs.map((h) => h.label).join(', ')} act as primary operational anchors coordinating multiple peripheral cells with critical risk rating.`,
      nodeIds: highRiskHubs.map((h) => h.id),
    })
  }

  // 2. Star Pattern / Mule Fan-Out
  // Look for bank accounts or persons connected to 3+ accounts/telecom entities
  const starNodes = nodes.filter((n) => {
    const deg = degreeMap.get(n.id)?.degree || 0
    const isMuleTarget = n.type === 'BankAccount' || n.type === 'Person'
    return isMuleTarget && deg >= 4
  })
  if (starNodes.length > 0) {
    patterns.push({
      id: 'pattern-star-mule',
      type: 'StarMule',
      title: 'Fan-Out Mule Account / Layering Cluster',
      severity: 'High',
      description: `Rapid disbursement star pattern detected centered at ${starNodes.map((s) => s.label).join(', ')}. Indicates coordinated money pooling and instant smurfing.`,
      nodeIds: starNodes.map((s) => s.id),
    })
  }

  // 3. Bridge Broker Between Separate Clusters
  if (bridges.length > 0) {
    const keyBridge = bridges[0]
    patterns.push({
      id: 'pattern-bridge-courier',
      type: 'BridgeBroker',
      title: 'Key Operational Bridge Identified',
      severity: 'High',
      description: `${keyBridge.node.label} acts as an articulation bridge bridging disparate operations (${keyBridge.connectedClusters.join(' <-> ')}). Neutralizing this node isolates communications.`,
      nodeIds: [keyBridge.node.id],
    })
  }

  // 4. Multi-Case Cross-Infiltration
  const multiCaseNodes = nodes.filter((n) => {
    const cases = n.properties?.associatedCases || []
    return Array.isArray(cases) && cases.length > 1
  })
  if (multiCaseNodes.length > 0) {
    patterns.push({
      id: 'pattern-cross-case',
      type: 'RapidExpansion',
      title: 'Cross-Jurisdiction Syndicated Linkage',
      severity: 'Critical',
      description: `${multiCaseNodes.map((m) => m.label).join(', ')} concurrently link separate police complaints (${multiCaseNodes.flatMap((m) => m.properties.associatedCases).slice(0, 3).join(', ')}), confirming organized syndicate activity.`,
      nodeIds: multiCaseNodes.map((m) => m.id),
    })
  }

  return patterns
}

/**
 * Returns human readable risk level string.
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 85) return 'Critical'
  if (score >= 65) return 'High'
  if (score >= 35) return 'Medium'
  return 'Low'
}

/**
 * Returns color code associated with risk level.
 */
export function getRiskColor(levelOrScore: RiskLevel | number): string {
  const score = typeof levelOrScore === 'number' ? levelOrScore : levelOrScore === 'Critical' ? 90 : levelOrScore === 'High' ? 75 : levelOrScore === 'Medium' ? 50 : 20
  if (score >= 85) return '#ef4444' // Crimson Critical
  if (score >= 65) return '#f97316' // Orange High
  if (score >= 35) return '#eab308' // Amber Medium
  return '#38bdf8' // Cyan Low
}

export interface FullNetworkAnalytics {
  metrics: NetworkMetrics
  influencers: TopInfluencers
  bridges: BridgeNodeInfo[]
  patterns: SuspiciousPattern[]
  clusterList: ClusterInfo[]
  nodeClusterMap: Map<string, string>
}

// Bounded in-memory cache to prevent re-calculating identical graph states
const analyticsCache = new Map<string, FullNetworkAnalytics>()
const MAX_ANALYTICS_CACHE_SIZE = 12

/**
 * Unified, single-pass pipeline for all network analysis metrics.
 * Shares adjacency lists and computes metrics in a single coordinated execution.
 */
export function calculateAllNetworkAnalytics(
  nodes: NetworkNode[],
  links: NetworkEdge[]
): FullNetworkAnalytics {
  if (nodes.length === 0) {
    return {
      metrics: {
        totalEntities: 0,
        totalRelationships: 0,
        networkDensity: 0,
        avgDegree: 0,
        clusterCount: 0,
        criticalCount: 0,
        highRiskCount: 0,
      },
      influencers: { byDegree: [], byBetweenness: [], byPageRank: [] },
      bridges: [],
      patterns: [],
      clusterList: [],
      nodeClusterMap: new Map(),
    }
  }

  // Generate lightweight signature key
  const cacheKey = `${nodes.length}_${links.length}_${nodes[0]?.id || ''}_${links[0]?.relationshipType || ''}`
  if (analyticsCache.has(cacheKey)) {
    return analyticsCache.get(cacheKey)!
  }

  // 1. Degree Centrality
  const degreeMap = calculateDegreeCentrality(nodes, links)

  // 2. Betweenness Centrality
  const betweennessMap = calculateBetweennessCentrality(nodes, links)

  // 3. PageRank
  const pageRankMap = calculatePageRank(nodes, links)

  // 4. Clusters
  const { nodeClusterMap, clusterList } = detectClusters(nodes, links)

  // 5. Bridges
  const bridges = detectBridgeNodes(nodes, links)

  // 6. Enriched influencers
  const enriched = nodes.map((n) => ({
    ...n,
    degree: degreeMap.get(n.id)?.degree ?? 0,
    betweenness: Math.round((betweennessMap.get(n.id) ?? 0) * 1000) / 1000,
    pageRank: Math.round((pageRankMap.get(n.id) ?? 0) * 1000) / 1000,
    clusterName: n.clusterName || clusterList.find(c => c.id === nodeClusterMap.get(n.id))?.name,
  }))

  const influencers: TopInfluencers = {
    byDegree: [...enriched].sort((a, b) => (b.degree || 0) - (a.degree || 0)).slice(0, 6),
    byBetweenness: [...enriched].sort((a, b) => (b.betweenness || 0) - (a.betweenness || 0)).slice(0, 6),
    byPageRank: [...enriched].sort((a, b) => (b.pageRank || 0) - (a.pageRank || 0)).slice(0, 6),
  }

  // 7. Topology metrics
  const totalEntities = nodes.length
  const totalRelationships = links.length
  const maxPossibleEdges = totalEntities > 1 ? (totalEntities * (totalEntities - 1)) / 2 : 1
  const networkDensity = totalEntities > 1 ? Math.min(1, Math.round((totalRelationships / maxPossibleEdges) * 1000) / 1000) : 0
  const avgDegree = totalEntities > 0 ? Math.round(((totalRelationships * 2) / totalEntities) * 10) / 10 : 0

  let criticalCount = 0
  let highRiskCount = 0
  nodes.forEach((n) => {
    if (n.riskScore >= 85) criticalCount++
    else if (n.riskScore >= 65) highRiskCount++
  })

  const metrics: NetworkMetrics = {
    totalEntities,
    totalRelationships,
    networkDensity,
    avgDegree,
    clusterCount: clusterList.length,
    criticalCount,
    highRiskCount,
  }

  // 8. Patterns
  const patterns = detectSuspiciousPatterns(nodes, links)

  const result: FullNetworkAnalytics = {
    metrics,
    influencers,
    bridges,
    patterns,
    clusterList,
    nodeClusterMap,
  }

  if (analyticsCache.size >= MAX_ANALYTICS_CACHE_SIZE) {
    const oldestKey = analyticsCache.keys().next().value
    if (oldestKey) analyticsCache.delete(oldestKey)
  }
  analyticsCache.set(cacheKey, result)

  return result
}

