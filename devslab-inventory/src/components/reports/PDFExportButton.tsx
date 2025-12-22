'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StockReportPDF } from './StockReportPDF'

interface PDFExportButtonProps {
  balances: any[]
  movementMap: Record<string, number>
  stockValue: number
  branchIdFilter?: string
  session: any
}

export function PDFExportButton({
  balances,
  movementMap,
  stockValue,
  branchIdFilter,
  session
}: PDFExportButtonProps) {
  const fileName = `devslab-stock-report-${new Date().toISOString().split('T')[0]}.pdf`

  return (
    <PDFDownloadLink
      document={
        <StockReportPDF 
          balances={balances}
          movementMap={movementMap}
          stockValue={stockValue}
          branchIdFilter={branchIdFilter}
          session={session}
        />
      }
      fileName={fileName}
    >
      {({ loading }) => (
        <Button className="inline-flex items-center gap-2" disabled={loading}>
          <Download className="w-4 h-4" />
          {loading ? 'Generating PDF...' : 'Export PDF Report'}
        </Button>
      )}
    </PDFDownloadLink>
  )
}