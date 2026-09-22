import { OfficerPortal } from '@/components/officer-portal'
import { NetworkGraphContainer } from '@/components/NetworkGraph/NetworkGraphContainer'

export default function IntelligencePage() {
  return (
    <OfficerPortal
      title="Criminal Intelligence Network"
      subtitle="3D Force-Directed Neural Topology & Syndicate Analysis"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="portal-eyebrow">SIH PROBLEM STATEMENT 26189 // INVESTIGATIVE INTELLIGENCE</p>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Criminal Syndicate Knowledge Graph
          </h2>
          <p className="text-xs text-muted-foreground">
            Interactive multi-cluster 3D relationship visualizer with automated bridge node detection, centrality rankings, and suspicious transaction pattern alerts.
          </p>
        </div>
      </div>

      <NetworkGraphContainer initialDataset="syndicate" />
    </OfficerPortal>
  )
}
