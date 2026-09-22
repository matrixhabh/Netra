export type EntityType = 
  | 'Person' 
  | 'Organization' 
  | 'Phone' 
  | 'BankAccount' 
  | 'Location' 
  | 'Vehicle' 
  | 'Case' 
  | 'Device'

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'

export interface NetworkNode {
  id: string
  label: string
  type: EntityType
  riskScore: number // 0 - 100
  properties: Record<string, any>
  clusterId?: string
  clusterName?: string
  degree?: number
  betweenness?: number
  pageRank?: number
  riskLevel?: RiskLevel
  riskInfluence?: number
  isBridge?: boolean
  x?: number
  y?: number
  z?: number
  vx?: number
  vy?: number
  vz?: number
  __threeObj?: any
}

export interface NetworkEdge {
  id?: string
  source: string | NetworkNode
  target: string | NetworkNode
  relationshipType: string
  weight: number // 1 - 10
  confidence: number // 0.0 - 1.0
  properties?: Record<string, any>
  isSuspicious?: boolean
}

export interface NetworkGraphData {
  nodes: NetworkNode[]
  links: NetworkEdge[]
}

export interface NetworkMetrics {
  totalEntities: number
  totalRelationships: number
  networkDensity: number
  avgDegree: number
  clusterCount: number
  criticalCount: number
  highRiskCount: number
}

export interface TopInfluencers {
  byDegree: NetworkNode[]
  byBetweenness: NetworkNode[]
  byPageRank: NetworkNode[]
}

export interface BridgeNodeInfo {
  node: NetworkNode
  connectedClusters: string[]
  bridgedEntitiesCount: number
}

export interface SuspiciousPattern {
  id: string
  type: 'StarMule' | 'BridgeBroker' | 'HighRiskHub' | 'LaunderingCycle' | 'RapidExpansion'
  title: string
  severity: 'Critical' | 'High' | 'Medium'
  description: string
  nodeIds: string[]
}

export interface ClusterInfo {
  id: string
  name: string
  color: string
  nodeCount: number
  avgRisk: number
  dominantType: EntityType
}

export interface NetworkFilterState {
  entityTypes: EntityType[]
  riskLevels: RiskLevel[]
  relationshipTypes: string[]
  minWeight: number
  minConfidence: number
  selectedCluster: string | null
}
