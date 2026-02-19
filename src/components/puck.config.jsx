// puck.config.js
export const puckConfig = {
    components: {
        SectionHeader: {
            fields: { title: { type: "text" } },
            defaultProps: { title: "Certificate of Completion" },
            render: ({ title }) => (
                <div className="text-center border-b-2 border-pink-100 pb-4 mb-6">
                    <h1 className="text-2xl font-bold uppercase tracking-widest text-brand-navy">{title}</h1>
                </div>
            )
        },
        Heading: {
            fields: {
                text: { type: "text" },
                level: {
                    type: "select",
                    options: [
                        { label: "Heading 1", value: "h1" },
                        { label: "Heading 2", value: "h2" },
                        { label: "Heading 3", value: "h3" },
                        { label: "Heading 4", value: "h4" },
                        { label: "Heading 5", value: "h5" },
                        { label: "Heading 6", value: "h6" },
                    ]
                },
                align: {
                    type: "radio",
                    options: [
                        { label: "Left", value: "text-left" },
                        { label: "Center", value: "text-center" },
                        { label: "Right", value: "text-right" },
                    ]
                },
                color: {
                    type: "select",
                    options: [
                        { label: "Navy (Default)", value: "text-brand-navy" },
                        { label: "Pink", value: "text-brand-pink" },
                        { label: "Start", value: "text-slate-900" },
                        { label: "Gray", value: "text-slate-500" },
                    ]
                }
            },
            defaultProps: {
                text: "New Heading",
                level: "h2",
                align: "text-left",
                color: "text-brand-navy"
            },
            render: ({ text, level, align, color }) => {
                const Tag = level;
                const sizeClasses = {
                    h1: "text-4xl",
                    h2: "text-3xl",
                    h3: "text-2xl",
                    h4: "text-xl",
                    h5: "text-lg",
                    h6: "text-base",
                }
                return (
                    <Tag className={`font-bold ${sizeClasses[level]} ${align} ${color} mb-4`}>
                        {text}
                    </Tag>
                )
            }
        },
        Text: {
            fields: {
                text: { type: "textarea" },
                size: {
                    type: "select",
                    options: [
                        { label: "Small", value: "text-sm" },
                        { label: "Normal", value: "text-base" },
                        { label: "Large", value: "text-lg" },
                        { label: "Extra Large", value: "text-xl" },
                    ]
                },
                align: {
                    type: "radio",
                    options: [
                        { label: "Left", value: "text-left" },
                        { label: "Center", value: "text-center" },
                        { label: "Right", value: "text-right" },
                        { label: "Justify", value: "text-justify" },
                    ]
                },
                color: {
                    type: "select",
                    options: [
                        { label: "Navy", value: "text-brand-navy" },
                        { label: "Pink", value: "text-brand-pink" },
                        { label: "Dark", value: "text-slate-900" },
                        { label: "Gray", value: "text-slate-600" },
                        { label: "Light Gray", value: "text-slate-400" },
                    ]
                },
                bold: { type: "select", options: [{ label: "No", value: "font-normal" }, { label: "Yes", value: "font-bold" }] },
                italic: { type: "select", options: [{ label: "No", value: "" }, { label: "Yes", value: "italic" }] },
            },
            defaultProps: {
                text: "Enter your text here...",
                size: "text-base",
                align: "text-left",
                color: "text-slate-600",
                bold: "font-normal",
                italic: ""
            },
            render: ({ text, size, align, color, bold, italic }) => (
                <p className={`${size} ${align} ${color} ${bold} ${italic} mb-4 leading-relaxed whitespace-pre-wrap`}>
                    {text}
                </p>
            )
        },
        Table: {
            fields: {
                headers: {
                    type: "array",
                    getItemSummary: (item) => item.label,
                    arrayFields: {
                        label: { type: "text" }
                    }
                },
                rows: {
                    type: "array",
                    getItemSummary: (item, index) => `Row ${index + 1}`,
                    arrayFields: {
                        col1: { type: "text", label: "Column 1" },
                        col2: { type: "text", label: "Column 2" },
                        col3: { type: "text", label: "Column 3" },
                        col4: { type: "text", label: "Column 4" },
                    }
                }
            },
            defaultProps: {
                headers: [{ label: "Item" }, { label: "Description" }, { label: "Qty" }, { label: "Price" }],
                rows: [
                    { col1: "Service A", col2: "Consultation", col3: "1", col4: "$100" },
                    { col1: "Service B", col2: "Implementation", col3: "2", col4: "$200" }
                ]
            },
            render: ({ headers, rows }) => (
                <div className="overflow-x-auto mb-6">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-pink-100">
                                {headers.map((h, i) => (
                                    <th key={i} className="px-4 py-3 text-left text-sm font-semibold text-brand-navy uppercase tracking-wider">
                                        {h.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50/50">
                                    {headers.map((_, colIndex) => {
                                        const key = `col${colIndex + 1}`;
                                        return (
                                            <td key={colIndex} className="px-4 py-3 text-sm text-slate-600">
                                                {row[key]}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
        },
        DynamicField: {
            fields: {
                label: { type: "text" },
                placeholder: { type: "text" },
                id: { type: "text" },
                value: { type: "text" },
                type: {
                    type: "select",
                    options: [
                        { label: "Text", value: "text" },
                        { label: "Text Area", value: "textarea" },
                        { label: "Number", value: "number" },
                        { label: "Date", value: "date" },
                        { label: "Email", value: "email" },
                    ]
                }
            },
            defaultProps: { label: "Full Name", placeholder: "John Doe", id: "user_name", value: "", type: "text" },
            render: ({ label, placeholder, value }) => (
                <div className="border-b border-pink-100 py-2.5 flex justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">{label}</span>
                    {value
                        ? <span className="text-sm text-brand-navy font-semibold">{value}</span>
                        : <span className="text-sm text-slate-400 italic">[{placeholder}]</span>
                    }
                </div>
            )
        },
        Logo: {
            fields: { url: { type: "text" } },
            defaultProps: { url: "https://your-placeholder-logo.com/logo.png" },
            render: ({ url }) => <img src={url} className="h-12 mx-auto mb-4" alt="Logo" />
        }
    },
    viewports: [
        {
            width: 1280,
            label: "Desktop",
        },
    ]
};