import { OfficerPortal } from '@/components/officer-portal'
import { FirAnalyzer } from '@/components/fir-analyzer'

export default function FirAnalyzerPage() {
  return (
    <OfficerPortal title="FIR Analyzer" subtitle="Document intelligence">
      <div className="portal-welcome compact">
        <div>
          <p className="portal-eyebrow">DOCUMENT INTELLIGENCE</p>
          <h2>FIR Analyzer</h2>
          <p>Upload an FIR or case document to extract entities, dates, and connections, then ask questions grounded in the text.</p>
        </div>
      </div>
      <FirAnalyzer />
    </OfficerPortal>
  )
}
