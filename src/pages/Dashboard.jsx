import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    TrendingUp,
    Users,
    FileCheck,
    FileText,
    AlertCircle,
    Calendar,
    FilePlus,
    ShieldCheck,
    Zap,
    FolderOpen,
    ArrowRight,
    Sparkles,
    Target,
    Award,
    Lightbulb,
    Activity,
    Server,
    Database,
    CheckCircle2
} from 'lucide-react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    RadialBarChart,
    RadialBar,
    Legend
} from 'recharts'
import API from '../api/client'

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white px-5 py-4 rounded-xl shadow-xl border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-lg font-bold text-brand-navy">
                    {payload[0].value} document{payload[0].value !== 1 ? 's' : ''}
                </p>
            </div>
        )
    }
    return null
}

function SkeletonCard() {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse">
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100" />
            </div>
            <div className="h-4 w-24 bg-slate-100 rounded mb-2" />
            <div className="h-8 w-16 bg-slate-100 rounded" />
        </div>
    )
}

export default function Dashboard({ onNavigate }) {
    const [statsData, setStatsData] = useState({
        total_documents: 0,
        active_users: 0,
        verified_documents: 0,
        verification_alerts: 0,
        trends: []
    })
    const [recentDocs, setRecentDocs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token')
                const config = { headers: { Authorization: `Bearer ${token}` } }
                const [analyticsRes, docsRes] = await Promise.all([
                    API.get('analytics/', config),
                    API.get('documents/', config).catch(() => ({ data: [] }))
                ])
                setStatsData(analyticsRes.data)
                setRecentDocs((docsRes.data || []).slice(0, 5))
            } catch (error) {
                console.error("Failed to fetch analytics:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const STATS = [
        { label: 'Total Documents', value: statsData.total_documents, icon: FileCheck, color: 'text-brand-pink', bg: 'bg-pink-50' },
        { label: 'Verified', value: statsData.verified_documents, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Active Users', value: statsData.active_users, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Alerts', value: statsData.verification_alerts, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    ]

    const trends = statsData.trends || []

    // Verification Success Data (Mocked/Derived)
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
    ]

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 17) return 'Good afternoon'
        return 'Good evening'
    }

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-96 bg-slate-100 rounded-2xl animate-pulse" />
                    <div className="h-96 bg-slate-100 rounded-2xl animate-pulse" />
                </div>
            </div>
        )
    }

    return (
        <div className="pb-10 space-y-8">
            {/* Welcome Banner */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-brand-pink flex items-center gap-1.5 uppercase tracking-wider">
                                <Sparkles className="w-3.5 h-3.5" />
                                {getGreeting()}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-brand-navy tracking-tight mb-2">
                            Welcome Back, {localStorage.getItem('username') || 'User'}
                        </h1>
                        <p className="text-slate-500 max-w-lg text-sm font-medium">
                            Ready to create something amazing today? Your document suite is ready.
                        </p>
                    </div>
                    <div className="flex flex-shrink-0">
                        <button
                            onClick={() => onNavigate?.('generate')}
                            className="bg-brand-pink hover:bg-pink-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                        >
                            <FilePlus className="w-4 h-4" />
                            Create New
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {STATS.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 group cursor-default"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-sm font-semibold text-slate-500 transition-colors">{stat.label}</div>
                            {i === 0 && <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50 mt-1 animate-pulse" />}
                        </div>
                        <div className="text-3xl font-black text-brand-navy tabular-nums tracking-tight">{(stat.value || 0).toLocaleString()}</div>
                    </motion.div>
                ))}
            </div>

            {/* Advanced Widgets Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Verification Success Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col"
                >
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-brand-navy flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            Verification Success
                        </h3>
                    </div>
                    <div className="flex-1 flex items-center justify-center relative">
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                            <span className="text-3xl font-bold text-brand-navy">{verificationSuccessRate}%</span>
                            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Success</span>
                        </div>
                        <div className="w-full h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={verificationData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
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

                {/* Quota Usage */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-brand-navy flex items-center gap-2">
                            <Database className="w-5 h-5 text-brand-pink" />
                            Quota Usage
                        </h3>
                        <span className="text-xs font-bold px-2 py-1 bg-pink-50 text-brand-pink rounded-lg">Pro Plan</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="mb-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-600 font-medium">Documents generated</span>
                                <span className="text-brand-navy font-bold">{statsData.total_documents} / 1,000</span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((statsData.total_documents / 1000) * 100, 100)}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className="h-full bg-brand-pink rounded-full"
                                />
                            </div>
                        </div>

                    </div>
                    <button className="mt-4 w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
                        Manage Plan
                    </button>
                </motion.div>

                {/* System Health / Status */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-brand-navy flex items-center gap-2">
                            <Server className="w-5 h-5 text-emerald-500" />
                            System Status
                        </h3>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metrics</span>
                    </div>

                    <div className="space-y-3 flex-1">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-sm font-semibold text-slate-700">API Gateway</span>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-sm font-semibold text-slate-700">Database</span>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-sm font-semibold text-slate-700">Verification Node</span>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                    </div>
                    <div className="mt-4 text-[11px] text-center text-slate-400 font-mono font-medium">
                        Last check: {new Date().toLocaleTimeString()}
                    </div>
                </motion.div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Chart Section */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
                >
                    <div className="px-6 lg:px-8 py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-brand-navy flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-pink-50">
                                    <TrendingUp className="w-5 h-5 text-brand-pink" />
                                </div>
                                Growth Trends
                            </h2>
                            <p className="text-sm text-slate-500 mt-1 ml-10">Document generation over the last 6 months</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-semibold text-slate-600">Last 6 Months</span>
                        </div>
                    </div>

                    {trends.length === 0 ? (
                        <div className="flex-1 min-h-[320px] flex flex-col items-center justify-center p-8">
                            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
                                <Activity className="w-10 h-10 text-slate-300" />
                            </div>
                            <p className="text-base font-semibold text-slate-600 mb-1">No trend data yet</p>
                            <p className="text-sm text-slate-500 text-center max-w-sm mb-6">Create documents to see your activity visualized here</p>
                            <button
                                onClick={() => onNavigate?.('generate')}
                                className="px-6 py-3 rounded-xl bg-brand-pink text-white font-semibold text-sm hover:bg-pink-600 transition-colors"
                            >
                                Create your first document
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 min-h-[320px] w-full p-6 lg:p-8 pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trends} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#EC4899" stopOpacity={0.25} />
                                            <stop offset="100%" stopColor="#EC4899" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                                        dy={8}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 11 }}
                                        dx={-8}
                                        width={36}
                                        tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '5 5' }} />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#EC4899"
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill="url(#colorCount)"
                                        activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#EC4899' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </motion.div>

                {/* Right Column */}
                <div className="space-y-6">

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
                    >
                        <h3 className="font-bold text-brand-navy mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                            Quick Actions
                        </h3>
                        <div className="space-y-3">
                            <button onClick={() => onNavigate?.('generate')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group text-left">
                                <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center text-brand-pink group-hover:scale-110 transition-transform">
                                    <FilePlus className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm text-slate-700">Create Document</div>
                                    <div className="text-xs text-slate-400">Start from a template</div>
                                </div>
                            </button>
                            <button onClick={() => onNavigate?.('verify')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group text-left">
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm text-slate-700">Verify Authenticity</div>
                                    <div className="text-xs text-slate-400">Check document status</div>
                                </div>
                            </button>
                            <button onClick={() => onNavigate?.('builder')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group text-left">
                                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                    <FolderOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm text-slate-700">Template Builder</div>
                                    <div className="text-xs text-slate-400">Manage templates</div>
                                </div>
                            </button>
                        </div>
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-sm text-brand-navy uppercase tracking-wider">Recent Activity</h3>
                            <button onClick={() => onNavigate?.('documents')} className="text-xs font-semibold text-brand-pink hover:text-pink-600">View All</button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {recentDocs.length === 0 ? (
                                <div className="p-8 text-center">
                                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-xs text-slate-500">No recent documents</p>
                                </div>
                            ) : (
                                recentDocs.map((doc) => (
                                    <div key={doc.id} className="p-4 hover:bg-pink-50/30 transition-colors flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                            <FileText className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-700 truncate">{doc.document_type_name || 'Document'}</p>
                                            <p className="text-xs text-slate-400 font-mono truncate">#{doc.tracking_field}</p>
                                        </div>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                                            Valid
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
