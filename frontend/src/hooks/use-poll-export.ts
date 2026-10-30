import { useCallback, useState } from 'react'

import { env } from '@/env'

export type ExportFormat = 'csv' | 'pdf'

export function usePollExport(pollId: string) {
  const [exportingFormat, setExportingFormat] = useState<ExportFormat>()
  const [exportError, setExportError] = useState<string>()

  const exportResults = useCallback(
    async (format: ExportFormat) => {
      setExportError(undefined)
      setExportingFormat(format)
      try {
        const response = await fetch(
          `${env.VITE_API_URL}/polls/${encodeURIComponent(pollId)}/export?format=${format}`,
          { credentials: 'include' },
        )
        if (!response.ok) {
          const body = await response.json().catch(() => null)
          throw new Error(body?.message ?? 'Não foi possível exportar os resultados.')
        }

        const contentDisposition = response.headers.get('Content-Disposition')
        const filename = contentDisposition?.match(/filename="([^"]+)"/)?.[1] ?? `resultados-${pollId}.${format}`
        const url = URL.createObjectURL(await response.blob())
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.append(link)
        link.click()
        link.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1_000)
      } catch (exportFailure) {
        setExportError(exportFailure instanceof Error ? exportFailure.message : 'Não foi possível exportar os resultados.')
      } finally {
        setExportingFormat(undefined)
      }
    },
    [pollId],
  )

  return { exportingFormat, exportError, exportResults }
}
