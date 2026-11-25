import { useState } from "react"
import { getApiBaseUrl, setCustomApiUrl } from "../config"

interface ServerConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

export function ServerConfigModal({ isOpen, onClose, onSaved }: ServerConfigModalProps) {
  const [url, setUrl] = useState(() => getApiBaseUrl())
  const [status, setStatus] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  if (!isOpen) return null

  const handleTestConnection = async () => {
    setTesting(true)
    setStatus(null)
    try {
      const res = await fetch(`${url.trim()}/api/queue/live`, {
        headers: { Accept: "application/json" },
      })
      const data = await res.json()
      if (data.success) {
        setStatus("✅ Terhubung ke Server Laravel! Data realtime sinkron.")
      } else {
        setStatus("⚠️ Server merespon tapi format data tidak sesuai.")
      }
    } catch (err: any) {
      setStatus(`❌ Gagal terhubung: ${err?.message || "Cek IP atau jaringan Wi-Fi"}`)
    } finally {
      setTesting(false)
    }
  }

  const handleSave = () => {
    setCustomApiUrl(url.trim())
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-bold text-gray-900">Pengaturan Server Backend</h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Sesuaikan alamat IP server Laravel saat menjalankan di HP Android fisik (WiFi yang sama) atau emulator.
        </p>

        <label className="block text-xs font-semibold text-gray-700 mb-1">
          URL Server Laravel
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="contoh: http://192.168.1.14:8000"
          className="w-full text-xs font-mono px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-2"
        />

        <div className="flex flex-wrap gap-1.5 mb-3">
          <button
            type="button"
            onClick={() => setUrl("http://192.168.1.14:8000")}
            className="text-[11px] bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
          >
            Wi-Fi Mac (192.168.1.14)
          </button>
          <button
            type="button"
            onClick={() => setUrl("http://10.0.2.2:8000")}
            className="text-[11px] bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
          >
            Emulator (10.0.2.2)
          </button>
          <button
            type="button"
            onClick={() => setUrl("http://localhost:8000")}
            className="text-[11px] bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
          >
            USB (adb reverse)
          </button>
        </div>

        {status && (
          <div className="p-2 mb-3 rounded-lg text-xs font-medium bg-gray-50 border border-gray-200 text-gray-800">
            {status}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            disabled={testing}
            onClick={handleTestConnection}
            className="flex-1 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-300 hover:bg-emerald-100 disabled:opacity-50"
          >
            {testing ? "Mengetes..." : "Tes Koneksi"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}
