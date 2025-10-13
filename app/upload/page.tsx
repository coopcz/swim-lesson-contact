// @ts-nocheck - Client component with Supabase type issues
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Papa from 'papaparse'
import ColumnMapper from '@/components/ColumnMapper'
import Navigation from '@/components/layout/Navigation'

interface ParsedData {
  headers: string[]
  rows: Record<string, string>[]
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [mapping, setMapping] = useState<Record<string, string> | null>(null)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'upload' | 'map' | 'complete'>('upload')
  const router = useRouter()

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === 'text/csv') {
      setFile(droppedFile)
      parseCSV(droppedFile)
    } else {
      setError('Please upload a CSV file')
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      parseCSV(selectedFile)
    }
  }

  const parseCSV = (csvFile: File) => {
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || []
        const rows = results.data as Record<string, string>[]
        setParsedData({ headers, rows })
        setStep('map')
        setError(null)
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`)
      },
    })
  }

  const handleMappingComplete = async (finalMapping: Record<string, string>) => {
    setMapping(finalMapping)
    setProcessing(true)
    setError(null)

    try {
      const supabase = createClient()

      // Get user's org
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: orgMember } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single()

      if (!orgMember) throw new Error('No organization found')

      // Upload CSV to storage
      const fileName = `${orgMember.org_id}/${Date.now()}-${file!.name}`
      const { error: uploadError } = await supabase.storage
        .from('imports')
        .upload(fileName, file!)

      if (uploadError) throw uploadError

      // Save mapping config
      const { error: mappingError } = await supabase
        .from('import_mappings')
        .upsert({
          org_id: orgMember.org_id,
          mapping_config: finalMapping,
        })

      if (mappingError) throw mappingError

      // Call the ingest function
      const response = await fetch('/api/ingest-roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          mapping: finalMapping,
          rows: parsedData!.rows,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process roster')
      }

      const result = await response.json()
      console.log('Ingest result:', result)

      setStep('complete')
    } catch (err: any) {
      setError(err.message || 'Failed to process roster')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={{}} showEmergency={false} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload Roster</h1>
          <p className="mt-2 text-gray-600">
            Import swim lesson roster from Mindbody CSV export
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {step === 'upload' && (
          <div
            onDrop={handleFileDrop}
            onDragOver={(e) => e.preventDefault()}
            className="bg-white rounded-lg shadow p-8 border-2 border-dashed border-gray-300 hover:border-lifequest-orange transition-colors"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">📤</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Drop your CSV file here
              </h2>
              <p className="text-gray-600 mb-4">or</p>
              <label className="inline-block px-6 py-3 bg-lifequest-orange text-white rounded-md font-medium cursor-pointer hover:bg-opacity-90 transition-colors">
                Browse Files
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 mt-4">
                Supported format: CSV files from Mindbody
              </p>
            </div>
          </div>
        )}

        {step === 'map' && parsedData && (
          <ColumnMapper
            headers={parsedData.headers}
            sampleRows={parsedData.rows.slice(0, 5)}
            onComplete={handleMappingComplete}
            onCancel={() => {
              setStep('upload')
              setFile(null)
              setParsedData(null)
            }}
            loading={processing}
          />
        )}

        {step === 'complete' && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Roster Imported Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              Your roster has been processed and imported into the system.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => router.push('/lessons')}
                className="px-6 py-3 bg-lifequest-orange text-white rounded-md font-medium hover:bg-opacity-90"
              >
                View Lessons
              </button>
              <button
                onClick={() => {
                  setStep('upload')
                  setFile(null)
                  setParsedData(null)
                  setMapping(null)
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300"
              >
                Upload Another
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

