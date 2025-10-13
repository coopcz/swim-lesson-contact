'use client'

import { useState, useEffect } from 'react'

interface ColumnMapperProps {
  headers: string[]
  sampleRows: Record<string, string>[]
  onComplete: (mapping: Record<string, string>) => void
  onCancel: () => void
  loading?: boolean
}

const requiredFields = [
  { key: 'parent_name', label: 'Parent Name', required: true },
  { key: 'child_name', label: 'Child Name', required: true },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'lesson_name', label: 'Lesson Name', required: true },
  { key: 'lesson_time', label: 'Lesson Time', required: false },
  { key: 'weekday', label: 'Weekday', required: false },
]

export default function ColumnMapper({
  headers,
  sampleRows,
  onComplete,
  onCancel,
  loading = false,
}: ColumnMapperProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({})

  // Auto-detect mapping on mount
  useEffect(() => {
    const autoMapping: Record<string, string> = {}
    
    requiredFields.forEach(({ key, label }) => {
      const lowerLabel = label.toLowerCase().replace(/\s+/g, '_')
      const match = headers.find(h => {
        const lowerH = h.toLowerCase().replace(/\s+/g, '_')
        return lowerH.includes(lowerLabel) || lowerLabel.includes(lowerH)
      })
      if (match) {
        autoMapping[key] = match
      }
    })

    setMapping(autoMapping)
  }, [headers])

  const handleMappingChange = (field: string, header: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: header,
    }))
  }

  const handleSubmit = () => {
    const isValid = requiredFields
      .filter(f => f.required)
      .every(f => mapping[f.key])

    if (!isValid) {
      alert('Please map all required fields')
      return
    }

    onComplete(mapping)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Map CSV Columns
      </h2>
      <p className="text-gray-600 mb-6">
        Match your CSV columns to the required fields below:
      </p>

      <div className="space-y-4 mb-6">
        {requiredFields.map(({ key, label, required }) => (
          <div key={key} className="flex items-center space-x-4">
            <label className="w-40 text-sm font-medium text-gray-700">
              {label}
              {required && <span className="text-red-600 ml-1">*</span>}
            </label>
            <select
              value={mapping[key] || ''}
              onChange={(e) => handleMappingChange(key, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lifequest-orange"
            >
              <option value="">-- Select Column --</option>
              {headers.map(header => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Preview (first 5 rows)
        </h3>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {requiredFields.map(({ key, label }) => (
                  mapping[key] && (
                    <th
                      key={key}
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {label}
                    </th>
                  )
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sampleRows.map((row, idx) => (
                <tr key={idx}>
                  {requiredFields.map(({ key }) => (
                    mapping[key] && (
                      <td key={key} className="px-4 py-2 text-sm text-gray-900">
                        {row[mapping[key]] || '-'}
                      </td>
                    )
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2 bg-lifequest-orange text-white rounded-md hover:bg-opacity-90 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Import Roster'}
        </button>
      </div>
    </div>
  )
}

