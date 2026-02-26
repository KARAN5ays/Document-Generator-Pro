import re

with open('src/pages/Dashboard.jsx', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    'Legend\n} from \'recharts\'',
    'Legend,\n    BarChart,\n    Bar\n} from \'recharts\''
)

# 2. Update Colors & Stats Data
data_section = """    // Verification Success Data (Mocked/Derived)
    const verificationData = [
        { name: 'Valid', value: statsData.verified_documents || 1, color: '#10b981' }, // Emerald 500
        { name: 'Invalid', value: statsData.verification_alerts || 0, color: '#f59e0b' }, // Amber 500
    ]
    const totalVerifications = verificationData.reduce((acc, curr) => acc + curr.value, 0)
    const verificationSuccessRate = Math.round((verificationData[0].value / totalVerifications) * 100) || 0

    // Quota Usage Data (Mocked)
    const quotaData = [
        {
            name: 'Documents',
            uv: 80, // Mock percentage
            fill: '#ec4899', // Brand Pink
        }
    ]"""
new_data_section = """    // Verification Success Data (Mocked/Derived)
    const verificationData = [
        { name: 'Valid', value: statsData.verified_documents || 1, color: '#ec4899' }, // Pink
        { name: 'Invalid', value: statsData.verification_alerts || 0, color: '#fbcfe8' }, // Light Pink
    ]
    const totalVerifications = verificationData.reduce((acc, curr) => acc + curr.value, 0)
    const verificationSuccessRate = Math.round((verificationData[0].value / totalVerifications) * 100) || 0

    // Bar Chart Data
    const barChartData = [
        { name: 'Total', Generated: 8, Verified: 2 },
        { name: 'Pending', Generated: 1, Verified: 0 },
        { name: 'Submitted', Generated: 0, Verified: 0 },
        { name: 'Processed', Generated: 6, Verified: 1 },
        { name: 'Rejected', Generated: 1, Verified: 1 },
    ]"""
content = content.replace(data_section, new_data_section)

# 3. Replace Advanced Widgets Row with Bar Chart and Pie Chart
advanced_widgets_start = "            {/* Advanced Widgets Row */}\n            <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-8\">"
main_content_grid = "            {/* Main Content Grid */}"
widgets_regex = re.compile(re.escape(advanced_widgets_start) + r".*?" + re.escape(main_content_grid), re.DOTALL)

new_widgets = """            {/* Middle Row: Bar & Pie Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Bar Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-brand-navy flex items-center gap-2">
                            <FileText className="w-5 h-5 text-brand-pink" />
                            Document Status
                        </h3>
                    </div>
                    <div className="flex-1 w-full min-h-[250px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dx={-10} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                                <Bar dataKey="Generated" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="Verified" fill="#fbcfe8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col"
                >
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-brand-navy flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-brand-pink" />
                            Verification Success
                        </h3>
                    </div>
                    <div className="flex-1 flex items-center justify-center relative min-h-[250px]">
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                            <span className="text-3xl font-bold text-brand-navy">{verificationSuccessRate}%</span>
                            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Success</span>
                        </div>
                        <div className="w-full h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={verificationData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        startAngle={90}
                                        endAngle={-270}
                                    >
                                        {verificationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" cornerRadius={10} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="flex justify-center gap-6 mt-2">
                        {verificationData.map((d, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                <span className="text-sm text-slate-600 font-medium">{d.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Main Content Grid */}"""
content = widgets_regex.sub(new_widgets, content)


# 4. Change some colors across the file (emerald, indigo, amber to pink since the user wants ONLY white and pink)
content = content.replace("text-emerald-600", "text-brand-pink")
content = content.replace("bg-emerald-50", "bg-pink-50")
content = content.replace("text-indigo-600", "text-brand-pink")
content = content.replace("bg-indigo-50", "bg-pink-50")
content = content.replace("text-amber-600", "text-brand-pink")
content = content.replace("bg-amber-50", "bg-pink-50")

content = content.replace("bg-emerald-500", "bg-brand-pink")
content = content.replace("text-emerald-500", "text-brand-pink")
content = content.replace("ring-emerald-50", "ring-pink-50")
content = content.replace("fill-amber-500", "fill-brand-pink")
content = content.replace("text-amber-500", "text-brand-pink")
content = content.replace("bg-emerald-100", "bg-pink-100")
content = content.replace("text-emerald-700", "text-brand-pink")

with open('src/pages/Dashboard.jsx', 'w') as f:
    f.write(content)
