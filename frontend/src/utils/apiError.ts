interface ApiValidationDetail {
  field?: string
  message?: string
}

export function getApiErrorMessage(error: any, fallback: string) {
  const data = error?.response?.data
  const title = data?.error || data?.message || fallback
  const details = Array.isArray(data?.details) ? data.details : []
  const issues = Array.isArray(data?.issues) ? data.issues : []

  if (details.length > 0) {
    const lines = details.map((detail: ApiValidationDetail) => {
      const field = detail.field ? `${detail.field}: ` : ''
      return `${field}${detail.message || 'Invalid value'}`
    })

    return `${title}\n\n${lines.join('\n')}`
  }

  if (issues.length > 0) {
    return `${title}\n\n${issues.join('\n')}`
  }

  return title
}
