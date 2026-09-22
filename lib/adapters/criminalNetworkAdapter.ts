import {
  cases,
  entitiesByCase,
  evidenceByCase,
  getCase,
  getEntities,
  getEvidence,
} from '../data/cases'
import {
  mockCriminalLinks,
  mockCriminalNodes,
} from '../data/mockCriminalNetwork'
import {
  calculateDegreeCentrality,
  calculateRiskInfluence,
  detectBridgeNodes,
  detectClusters,
  getRiskLevel,
} from '../networkAnalysis'
import {
  EntityType,
  NetworkEdge,
  NetworkGraphData,
  NetworkNode,
} from '../types/network'

/**
 * Enriches graph nodes with computed metrics (degree, risk level, cluster metadata, bridge status).
 */
export function enrichGraphData(data: NetworkGraphData): NetworkGraphData {
  const { nodeClusterMap, clusterList } = detectClusters(data.nodes, data.links)
  const degreeMap = calculateDegreeCentrality(data.nodes, data.links)
  const riskInfluenceMap = calculateRiskInfluence(data.nodes, data.links)
  const bridges = detectBridgeNodes(data.nodes, data.links)
  const bridgeIdSet = new Set(bridges.map((b) => b.node.id))

  const clusterNameMap = new Map<string, string>()
  clusterList.forEach((c) => clusterNameMap.set(c.id, c.name))

  const enrichedNodes: NetworkNode[] = data.nodes.map((n) => {
    const clusterId = nodeClusterMap.get(n.id) || n.clusterId || 'cluster-default'
    const clusterName =
      n.clusterName || clusterNameMap.get(clusterId) || 'Unassigned Cluster'
    const deg = degreeMap.get(n.id)?.degree || 0
    const riskScore = n.riskScore
    const riskLevel = getRiskLevel(riskScore)
    const riskInfluence = riskInfluenceMap.get(n.id) || riskScore
    const isBridge = n.isBridge || bridgeIdSet.has(n.id)

    return {
      ...n,
      clusterId,
      clusterName,
      degree: deg,
      riskScore,
      riskLevel,
      riskInfluence,
      isBridge,
    }
  })

  return {
    nodes: enrichedNodes,
    links: data.links,
  }
}

/**
 * Returns the full multi-cluster intelligence syndicate graph (32+ entities).
 */
export function getFullSyndicateGraph(): NetworkGraphData {
  return enrichGraphData({
    nodes: [...mockCriminalNodes],
    links: [...mockCriminalLinks],
  })
}

/**
 * Adapts existing data from lib/data/cases.ts for a specific case (e.g. C-1042),
 * connecting case entities, evidence, and known criminal links.
 */
export function getCaseNetworkGraph(caseId: string): NetworkGraphData {
  const targetCase = getCase(caseId)
  const caseEntities = getEntities(caseId)
  const caseEvidence = getEvidence(caseId)

  const nodes: NetworkNode[] = []
  const links: NetworkEdge[] = []

  // 1. Root Case Node
  nodes.push({
    id: targetCase.id,
    label: targetCase.title,
    type: 'Case',
    riskScore: targetCase.priority === 'High' ? 85 : 50,
    clusterId: 'cluster-case',
    clusterName: `Case ${targetCase.id} Dossier`,
    properties: {
      complainant: targetCase.complainant,
      amount: targetCase.amount,
      location: targetCase.location,
      assignedTo: targetCase.assignedTo,
      status: targetCase.status,
      summary: targetCase.summary,
    },
  })

  // Map case entity type strings to standard EntityType
  const typeMap: Record<string, EntityType> = {
    Person: 'Person',
    Phone: 'Phone',
    Payment: 'BankAccount',
    Domain: 'Device',
    Network: 'Device',
    Location: 'Location',
  }

  // 2. Case Entities
  caseEntities.forEach((ent) => {
    const stdType = typeMap[ent.type] || 'Person'
    const riskScore =
      ent.confidence === 'Verified'
        ? ent.type === 'Domain'
          ? 92
          : ent.type === 'Person'
          ? 15
          : 80
        : 65

    nodes.push({
      id: ent.id,
      label: ent.value,
      type: stdType,
      riskScore,
      clusterId: 'cluster-case',
      clusterName: `Case ${targetCase.id} Dossier`,
      properties: {
        rawType: ent.type,
        role: ent.label,
        confidence: ent.confidence,
        linkedCase: targetCase.id,
      },
    })

    // Edge from Case to Entity
    links.push({
      source: targetCase.id,
      target: ent.id,
      relationshipType: 'INVESTIGATES',
      weight: 9,
      confidence: ent.confidence === 'Verified' ? 1.0 : 0.8,
    })
  })

  // 3. Evidence Items linked to case
  caseEvidence.forEach((ev) => {
    nodes.push({
      id: ev.id,
      label: ev.name,
      type: 'Device',
      riskScore: 40,
      clusterId: 'cluster-case',
      clusterName: `Case ${targetCase.id} Dossier`,
      properties: {
        evidenceType: ev.type,
        status: ev.status,
        addedBy: ev.addedBy,
        addedAt: ev.addedAt,
      },
    })

    links.push({
      source: targetCase.id,
      target: ev.id,
      relationshipType: 'EVIDENCE_RECORDED',
      weight: 6,
      confidence: 0.95,
    })
  })

  // 4. Connect complainant to UPI payment and phone if present
  const personNode = nodes.find((n) => n.properties?.rawType === 'Person')
  const phoneNode = nodes.find((n) => n.properties?.rawType === 'Phone')
  const paymentNode = nodes.find((n) => n.properties?.rawType === 'Payment')
  const domainNode = nodes.find((n) => n.properties?.rawType === 'Domain')
  const ipNode = nodes.find((n) => n.properties?.rawType === 'Network')

  if (personNode && phoneNode) {
    links.push({
      source: personNode.id,
      target: phoneNode.id,
      relationshipType: 'USES',
      weight: 8,
      confidence: 0.99,
    })
  }

  if (personNode && paymentNode) {
    links.push({
      source: personNode.id,
      target: paymentNode.id,
      relationshipType: 'OWNS',
      weight: 9,
      confidence: 1.0,
    })
  }

  if (domainNode && ipNode) {
    links.push({
      source: domainNode.id,
      target: ipNode.id,
      relationshipType: 'RESOLVES_TO',
      weight: 8,
      confidence: 0.9,
    })
  }

  // 5. Expand with linked syndicate nodes if matching (e.g., C-1042 connects to HDFC mule account and Arjun Sharma syndicate)
  const syndicateMatches = mockCriminalNodes.filter(
    (sn) =>
      sn.properties?.associatedCases?.includes(caseId) ||
      sn.id === 'N-ARJUN' ||
      sn.id === 'N-RAMESH' ||
      sn.id === 'N-ACC-HDFC' ||
      sn.id === 'N-VIKRAM'
  )

  syndicateMatches.forEach((sn) => {
    if (!nodes.some((existing) => existing.id === sn.id)) {
      nodes.push({ ...sn })
    }
  })

  // Link case entity to syndicate match
  if (paymentNode) {
    links.push({
      source: paymentNode.id,
      target: 'N-ACC-HDFC',
      relationshipType: 'TRANSFERRED_MONEY_TO',
      weight: 9,
      confidence: 0.98,
      properties: { amount: targetCase.amount, isSuspicious: true },
    })
  }

  if (domainNode) {
    links.push({
      source: domainNode.id,
      target: 'N-VIKRAM',
      relationshipType: 'ADMINISTERED_BY',
      weight: 9,
      confidence: 0.92,
    })
  }

  // Add internal syndicate links between imported syndicate nodes
  const nodeIds = new Set(nodes.map((n) => n.id))
  mockCriminalLinks.forEach((ml) => {
    const s = typeof ml.source === 'string' ? ml.source : (ml.source as any).id
    const t = typeof ml.target === 'string' ? ml.target : (ml.target as any).id
    if (nodeIds.has(s) && nodeIds.has(t)) {
      links.push({ ...ml })
    }
  })

  return enrichGraphData({ nodes, links })
}

/**
 * Returns a Cross-Case graph showing how multiple complaints (C-1042, C-1038, C-1029)
 * collide on shared infrastructure.
 */
export function getCrossCaseGraph(): NetworkGraphData {
  const base = getFullSyndicateGraph()
  return base
}
