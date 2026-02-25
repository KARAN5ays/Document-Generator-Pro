/**
 * Extract editable fields from CKEditor HTML template.
 * Scans for {{ Variable_Name }} syntax.
 */

function formatLabel(key) {
  if (!key) return 'Field'
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function extractFieldsFromHTML(htmlString) {
  if (!htmlString || typeof htmlString !== 'string') return []

  const regex = /\{\{\s*([\w]+)\s*\}\}/g
  const fields = []
  const seen = new Set()

  let match
  while ((match = regex.exec(htmlString)) !== null) {
    const varName = match[1]
    if (!seen.has(varName)) {
      seen.add(varName)
      fields.push({
        id: varName,
        label: formatLabel(varName),
        type: 'text',
        placeholder: `Enter ${formatLabel(varName).toLowerCase()}...`,
        required: true,
        isDynamicHtmlField: true, // flag to identify these in DataEntryForm
      })
    }
  }

  return fields
}

/**
 * Replaces {{ Variable_Name }} in the HTML directly with the provided values.
 */
export function injectFieldsIntoHTML(htmlString, fields = {}) {
  if (!htmlString || typeof htmlString !== 'string') return htmlString

  return htmlString.replace(/\{\{\s*([\w]+)\s*\}\}/g, (match, varName) => {
    if (fields[varName] !== undefined && fields[varName] !== null && fields[varName] !== '') {
      return String(fields[varName])
    }
    return match // Keep the {{ Variable_Name }} placeholder if not filled
  })
}

/**
 * Legacy support for DataEntryForm to extract dynamic user-fillable inputs.
 */
export function extractDynamicFields(htmlString) {
  return extractFieldsFromHTML(htmlString)
}

/**
 * Legacy support - we don't use structured table schemas for CKEditor yet.
 * Tables are edited directly in CKEditor.
 */
export function extractTableSchemas(htmlString) {
  return []
}
