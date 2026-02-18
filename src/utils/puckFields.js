/**
 * Extract editable fields from Puck ui_config and inject values back.
 * Used for user-created templates: Create Document form + PuckRenderer preview.
 */

const EDITABLE_PROPS = {
  SectionHeader: ['title'],
  Heading: ['text', 'level', 'align', 'color'],
  Text: ['text', 'size', 'align', 'color', 'bold', 'italic'],
  Logo: ['url'],
  DynamicField: ['__value__'], // special: value keyed by props.id
  Table: ['__table__'], // special: headers + rows
}

const PROP_LABELS = {
  title: 'Section Title',
  text: 'Content',
  level: 'Heading Level',
  align: 'Alignment',
  color: 'Color',
  size: 'Text Size',
  bold: 'Bold',
  italic: 'Italic',
  url: 'Logo URL',
}

const PROP_SPEC = {
  title: { type: 'text' },
  text: { type: 'text' },
  level: {
    type: 'select',
    options: [
      { label: 'H1', value: 'h1' },
      { label: 'H2', value: 'h2' },
      { label: 'H3', value: 'h3' },
      { label: 'H4', value: 'h4' },
      { label: 'H5', value: 'h5' },
      { label: 'H6', value: 'h6' },
    ],
  },
  align: {
    type: 'select',
    options: [
      { label: 'Left', value: 'text-left' },
      { label: 'Center', value: 'text-center' },
      { label: 'Right', value: 'text-right' },
      { label: 'Justify', value: 'text-justify' },
    ],
  },
  color: {
    type: 'select',
    options: [
      { label: 'Navy', value: 'text-brand-navy' },
      { label: 'Pink', value: 'text-brand-pink' },
      { label: 'Dark', value: 'text-slate-900' },
      { label: 'Gray', value: 'text-slate-600' },
      { label: 'Light Gray', value: 'text-slate-400' },
    ],
  },
  size: {
    type: 'select',
    options: [
      { label: 'Small', value: 'text-sm' },
      { label: 'Normal', value: 'text-base' },
      { label: 'Large', value: 'text-lg' },
      { label: 'XL', value: 'text-xl' },
    ],
  },
  bold: {
    type: 'select',
    options: [
      { label: 'No', value: 'font-normal' },
      { label: 'Yes', value: 'font-bold' },
    ],
  },
  italic: {
    type: 'select',
    options: [
      { label: 'No', value: '' },
      { label: 'Yes', value: 'italic' },
    ],
  },
  url: { type: 'text' },
}

function flattenContent(rawContent) {
  if (Array.isArray(rawContent)) return rawContent
  if (rawContent && typeof rawContent === 'object')
    return Object.values(rawContent).flat().filter(Boolean)
  return []
}

export function extractFieldsFromPuckContent(rawContent) {
  const items = flattenContent(rawContent)
  const fields = []
  const seen = new Set()

  items.forEach((item, idx) => {
    if (!item || !item.type || !item.props) return
    const { type, props } = item

    if (type === 'DynamicField') {
      const id = props.id || `dynamic_${idx}`
      if (seen.has(id)) return
      seen.add(id)
      fields.push({
        id,
        label: props.label || 'Field',
        type: props.type || 'text',
        placeholder: props.placeholder || '',
        required: !!props.required,
        puckPath: { type, index: idx, prop: '__value__' },
      })
      return
    }

    if (type === 'Table') {
      const headers = props.headers || []
      const rows = props.rows || []
      const colKeys = ['col1', 'col2', 'col3', 'col4']
      headers.forEach((h, hi) => {
        const id = `table_${idx}_h_${hi}`
        fields.push({
          id,
          label: `Table Header ${hi + 1}`,
          type: 'text',
          placeholder: h?.label || '',
          puckPath: { type, index: idx, prop: '__table_header__', headerIndex: hi },
        })
      })
      const numCols = Math.max(headers.length, 1)
      rows.forEach((r, ri) => {
        for (let ci = 0; ci < numCols && ci < 4; ci++) {
          const ck = colKeys[ci]
          const id = `table_${idx}_r_${ri}_c_${ci}`
          fields.push({
            id,
            label: `Row ${ri + 1} Col ${ci + 1}`,
            type: 'text',
            placeholder: r?.[ck] ?? '',
            puckPath: { type, index: idx, prop: '__table_row__', rowIndex: ri, colKey: ck },
          })
        }
      })
      return
    }

    const propsList = EDITABLE_PROPS[type]
    if (!propsList) return

    propsList.forEach((propName) => {
      if (propName.startsWith('__')) return
      const id = `${type}_${idx}_${propName}`
      const value = props[propName]
      const spec = PROP_SPEC[propName] || { type: 'text' }
      const field = {
        id,
        label: PROP_LABELS[propName] || propName,
        type: spec.type || 'text',
        placeholder: typeof value === 'string' ? value : '',
        puckPath: { type, index: idx, prop: propName },
      }
      if (spec.options) field.options = spec.options
      fields.push(field)
    })
  })

  return fields
}

export function injectFieldsIntoPuckData(data, fields = {}) {
  if (!data || !data.content) return data
  const out = JSON.parse(JSON.stringify(data))
  const items = flattenContent(out.content)
  const isArray = Array.isArray(out.content)

  items.forEach((item, idx) => {
    if (!item || !item.props) return
    const { type } = item

    if (type === 'DynamicField') {
      const fieldId = item.props.id || `dynamic_${idx}`
      if (fields[fieldId] != null && fields[fieldId] !== '') {
        item.props.placeholder = String(fields[fieldId])
      }
      return
    }

    if (type === 'Table') {
      const headers = item.props.headers || []
      const rows = item.props.rows || []
      const colKeys = ['col1', 'col2', 'col3', 'col4']
      headers.forEach((h, hi) => {
        const id = `table_${idx}_h_${hi}`
        if (fields[id] != null) h.label = String(fields[id])
      })
      const numCols = Math.max(headers.length, 1)
      rows.forEach((r, ri) => {
        for (let ci = 0; ci < numCols && ci < 4; ci++) {
          const ck = colKeys[ci]
          const id = `table_${idx}_r_${ri}_c_${ci}`
          if (fields[id] != null) r[ck] = String(fields[id])
        }
      })
      return
    }

    const propsList = EDITABLE_PROPS[type]
    if (!propsList) return

    propsList.forEach((propName) => {
      if (propName.startsWith('__')) return
      const id = `${type}_${idx}_${propName}`
      if (fields[id] != null) {
        item.props[propName] = String(fields[id])
      }
    })
  })

  if (isArray) {
    out.content = items
  } else {
    Object.keys(out.content || {}).forEach((zone) => {
      if (Array.isArray(out.content[zone])) {
        out.content[zone] = items
      }
    })
  }

  return out
}
