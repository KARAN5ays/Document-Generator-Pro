import React from 'react'
import { motion } from 'framer-motion'
import { User, Shield, Mail, Key, ShieldAlert } from 'lucide-react'

export default function SettingsView({ userProfile }) {
    if (!userProfile) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-slate-200 rounded-full mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto px-4"
        >
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-brand-navy tracking-tight">Account Settings</h1>
                <p className="text-slate-500 mt-2">Manage your profile, security preferences, and subscription.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
                        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-brand-pink to-pink-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-brand-pink/30 mb-4">
                            {userProfile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <h2 className="text-xl font-bold text-brand-navy">{userProfile.name}</h2>
                        <p className="text-sm font-medium text-slate-500 mb-4">{userProfile.role}</p>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-50 text-brand-pink">
                            <Shield className="w-3 h-3" />
                            Verified Account
                        </span>
                    </div>
                </div>

                {/* Details Section */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-bold text-brand-navy flex items-center gap-2 mb-6">
                            <User className="w-5 h-5 text-brand-pink" />
                            Personal Information
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Display Name</label>
                                <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium">
                                    {userProfile.name}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                                    Email Address
                                    <span className="text-[10px] text-emerald-500 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Verified</span>
                                </label>
                                <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    {userProfile.email}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Account Role</label>
                                <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium flex items-center gap-3">
                                    <Key className="w-4 h-4 text-slate-400" />
                                    {userProfile.role}
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Your role determines your access to the Template Builder and global system templates.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
