/**
 * VerifyQR — renders a QR code that encodes the document's public verify URL.
 *
 * When a phone camera scans this QR, it opens:
 *   <origin>/?verify=<trackingCode>
 *
 * The VerificationTool already accepts `initialCode` via the App routing, so
 * we just need the QR to deliver the code to the right page. We use
 * window.location.origin so the URL is always correct regardless of deployment.
 *
 * Props:
 *   trackingCode  – the 8-char document tracking code (required)
 *   size          – QR pixel size (default 96)
 *   showLabel     – whether to show the "Scan to Verify" label (default true)
 */

import { QRCodeSVG } from 'qrcode.react'

export default function VerifyQR({ trackingCode, size = 96, showLabel = true }) {
    if (!trackingCode) return null

    // Build the public verify URL — works on localhost and on production.
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const verifyUrl = `${origin}/?verify=${trackingCode}`

    return (
        <div className="flex flex-col items-center gap-1.5">
            {/* QR Code */}
            <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm inline-block">
                <QRCodeSVG
                    value={verifyUrl}
                    size={size}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                    level="M"
                    includeMargin={false}
                />
            </div>

            {showLabel && (
                <div className="text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Scan to Verify
                    </p>
                    <p className="font-mono text-[9px] font-bold text-slate-300 tracking-widest mt-0.5">
                        {trackingCode}
                    </p>
                </div>
            )}
        </div>
    )
}
