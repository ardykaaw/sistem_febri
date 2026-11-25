import { useMemo, useState, useEffect, useCallback } from "react"
import { getApiBaseUrl } from "./config"
import { ServerConfigModal } from "./components/ServerConfigModal"

// Types
export type Screen =
  | "splash"
  | "login"
  | "register"
  | "main"
  | "booking"
  | "ticket_detail"

export type Tab = "home" | "queue" | "schedule" | "profile"
export type Priority = "Darurat" | "Lansia" | "Anak" | "Reguler"
export type TicketStatus = "dipanggil" | "menunggu" | "selesai"

export type PatientUser = {
  id: string
  name: string
  phone: string
  nik: string
  dob: string
  rmNumber: string
  gender: "Laki-laki" | "Perempuan"
  registeredAt: string
  role?: "admin" | "user"
}

export type PatientTicket = {
  id: number
  ticketNumber: string
  patientName: string
  phone: string
  service: string
  doctor: string
  room: string
  priority: Priority
  arrivedAt: string
  order: number
  status: TicketStatus
  notes?: string
  qrCode?: string
  isServerTicket?: boolean
}

const priorityScore: Record<Priority, number> = {
  Darurat: 4,
  Lansia: 3,
  Anak: 2,
  Reguler: 1,
}

const initialQueue: PatientTicket[] = [
  {
    id: 1,
    ticketNumber: "A01",
    patientName: "Siti Aminah",
    phone: "0812****8891",
    service: "Sakit gigi akut",
    doctor: "drg. Alya Nirmala, Sp.KG",
    room: "Poli Gigi 1",
    priority: "Darurat",
    arrivedAt: "08.42",
    order: 1,
    status: "dipanggil",
  },
  {
    id: 2,
    ticketNumber: "A02",
    patientName: "Budi Santoso",
    phone: "0813****1122",
    service: "Kontrol gigi rutin",
    doctor: "drg. Alya Nirmala, Sp.KG",
    room: "Poli Gigi 1",
    priority: "Lansia",
    arrivedAt: "08.20",
    order: 2,
    status: "menunggu",
  },
  {
    id: 3,
    ticketNumber: "A03",
    patientName: "Keisha Putri",
    phone: "0857****3344",
    service: "Pemeriksaan gigi anak",
    doctor: "drg. Keisha Putri, Sp.KGA",
    room: "Poli Gigi 2",
    priority: "Anak",
    arrivedAt: "08.31",
    order: 3,
    status: "menunggu",
  },
  {
    id: 4,
    ticketNumber: "A04",
    patientName: "Rian Pratama",
    phone: "0812****7788",
    service: "Scaling karang gigi",
    doctor: "drg. Alya Nirmala, Sp.KG",
    room: "Poli Gigi 1",
    priority: "Reguler",
    arrivedAt: "08.50",
    order: 4,
    status: "menunggu",
  },
]

type IconName =
  | "home"
  | "queue"
  | "calendar"
  | "user"
  | "bell"
  | "clock"
  | "plus"
  | "arrow"
  | "arrowLeft"
  | "users"
  | "check"
  | "close"
  | "ticket"
  | "mapPin"
  | "sparkle"
  | "shield"
  | "phone"
  | "qr"
  | "logOut"
  | "lock"
  | "idCard"

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: (
      <>
        <path d="M3 10.8 12 3l9 7.8" />
        <path d="M5.5 9.5V21h13V9.5M9.5 21v-7h5v7" />
      </>
    ),
    queue: (
      <>
        <path d="M8 6h13M8 12h13M8 18h13" />
        <circle cx="3" cy="6" r="1" />
        <circle cx="3" cy="12" r="1" />
        <circle cx="3" cy="18" r="1" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M7 3v4M17 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: (
      <>
        <path d="M5 12h14M14 7l5 5-5 5" />
      </>
    ),
    arrowLeft: (
      <>
        <path d="M19 12H5M10 17l-5-5 5-5" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5.5a3 3 0 0 1 0 5.8M17.5 15a5 5 0 0 1 4 5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    ticket: (
      <>
        <path d="M2 9a3 3 0 0 1 0 6v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a3 3 0 0 1 0-6V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
        <path d="M13 5v2M13 11v2M13 17v2" />
      </>
    ),
    mapPin: (
      <>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    sparkle: (
      <path d="m12 3 2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5L12 3Z" />
    ),
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    phone: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    ),
    qr: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 18v3M18 14h3" />
      </>
    ),
    logOut: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
    lock: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
    idCard: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </>
    ),
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths[name]}
      </g>
    </svg>
  )
}

// Maskot Resmi "Wanshy" Gigi Klinik Wansha
export function ToothCharacter({
  className = "tooth-character",
}: {
  className?: string
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 180 150"
      role="img"
      aria-label="Maskot Resmi Gigi Wanshy Klinik Wansha"
    >
      <ellipse cx="92" cy="138" rx="54" ry="7" fill="rgba(18,78,74,.14)" />
      <path
        d="M47 20c12-9 24 3 43 3s31-12 43-3c21 15 3 48-3 69-8 28-13 43-25 42-10-1-7-29-15-29s-5 28-15 29c-12 1-17-14-25-42-6-21-24-54-3-69Z"
        fill="#FFFFFF"
        stroke="#173F3C"
        strokeWidth="3.2"
      />
      <path
        d="M55 33c9-8 19 0 30 1"
        fill="none"
        stroke="#C5EFE7"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="72" cy="62" r="4.2" fill="#173F3C" />
      <circle cx="108" cy="62" r="4.2" fill="#173F3C" />
      <path
        d="M75 78c8 10 21 10 29 0"
        fill="none"
        stroke="#173F3C"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M50 82c-14 3-18 12-22 21M130 82c14 3 18 12 22 21"
        fill="none"
        stroke="#173F3C"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="m144 36 4 8 8 4-8 4-4 8-4-8-8-4 8-4 4-8Z"
        fill="#F5B755"
        stroke="#173F3C"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="62" cy="73" r="5.5" fill="#FFAAA6" opacity=".9" />
      <circle cx="118" cy="73" r="5.5" fill="#FFAAA6" opacity=".9" />
    </svg>
  )
}

function PriorityBadge({ value }: { value: Priority }) {
  return (
    <span className={`priority priority-${value.toLowerCase()}`}>{value}</span>
  )
}

export default function App() {
  // Navigation Screen State
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash")
  const [activeTab, setActiveTab] = useState<Tab>("home")

  // Authentication State
  const [currentUser, setCurrentUser] = useState<PatientUser | null>(null)

  // Queue & Ticket State
  const [queue, setQueue] = useState<PatientTicket[]>(initialQueue)
  const [myTicketId, setMyTicketId] = useState<number | null>(null)

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isServerModalOpen, setIsServerModalOpen] = useState(false)

  // Booking Form State
  const [service, setService] = useState("Scaling karang gigi")
  const [doctor, setDoctor] = useState("drg. Alya Nirmala, Sp.KG")
  const [priority, setPriority] = useState<Priority>("Reguler")
  const [notes, setNotes] = useState("")

  // Auth Forms State
  const [loginPhone, setLoginPhone] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  const [regName, setRegName] = useState("")
  const [regPhone, setRegPhone] = useState("")
  const [regNik, setRegNik] = useState("")
  const [regDob, setRegDob] = useState("")
  const [regGender, setRegGender] = useState<"Laki-laki" | "Perempuan">(
    "Laki-laki",
  )
  const [regPassword, setRegPassword] = useState("")

  // Auto toast timer
  function showToast(msg: string) {
    setToastMessage(msg)
    window.setTimeout(() => setToastMessage(null), 3800)
  }

  // Fetch Live Queue from Backend
  const fetchLiveQueue = useCallback(async () => {
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/queue/live`, {
        headers: { Accept: "application/json" },
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.success && Array.isArray(data.active_queue)) {
        const serverTickets: PatientTicket[] = data.active_queue.map((item: any, idx: number) => ({
          id: item.id,
          ticketNumber: item.ticket_number,
          patientName: item.patient_name,
          phone: item.patient_phone || "",
          service: item.service || "Pemeriksaan Gigi",
          doctor: item.doctor || "drg. Febri, Sp.KG",
          room: item.room || "Ruang Periksa Gigi",
          priority: (["Darurat", "Lansia", "Anak", "Reguler"].includes(item.priority) ? item.priority : "Reguler") as Priority,
          arrivedAt: item.created_at ? new Date(item.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "08:00",
          order: idx + 1,
          status: (item.status === "dipanggil" ? "dipanggil" : item.status === "selesai" ? "selesai" : "menunggu") as TicketStatus,
          notes: item.notes || "",
          qrCode: item.qr_code,
          isServerTicket: true,
        }))
        if (serverTickets.length > 0) {
          setQueue(serverTickets)
        }
      }
    } catch {
      // offline or server unreachable fallback to local state
    }
  }, [])

  // Poll live queue every 4 seconds for realtime sync with admin
  useEffect(() => {
    fetchLiveQueue()
    const timer = setInterval(fetchLiveQueue, 4000)
    return () => clearInterval(timer)
  }, [fetchLiveQueue])

  // Active user ticket & queue sorting
  const sortedQueue = useMemo(() => {
    return [...queue].sort((a, b) => {
      if (a.status === "dipanggil" && b.status !== "dipanggil") return -1
      if (b.status === "dipanggil" && a.status !== "dipanggil") return 1
      return (
        priorityScore[b.priority] - priorityScore[a.priority] ||
        a.order - b.order
      )
    })
  }, [queue])

  const currentlyServing =
    sortedQueue.find((q) => q.status === "dipanggil") || sortedQueue[0]
  const myTicket = queue.find((q) => q.id === myTicketId) || null

  const myQueuePosition = useMemo(() => {
    if (!myTicket) return null
    const waitingList = sortedQueue.filter((q) => q.status !== "selesai")
    const index = waitingList.findIndex((q) => q.id === myTicket.id)
    return {
      index: index + 1,
      peopleAhead: Math.max(0, index),
      estimatedWaitTime: Math.max(5, index * 15),
    }
  }, [myTicket, sortedQueue])

  // Login handler
  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!loginPhone.trim()) {
      showToast("Nomor WhatsApp atau ID pengguna wajib diisi.")
      return
    }

    const isAdmin =
      loginPhone.trim() === "081299999999" ||
      loginPassword === "admin123" ||
      loginPhone.toLowerCase().includes("admin")

    const user: PatientUser = {
      id: `usr_${Date.now()}`,
      name: isAdmin ? "Administrator Klinik" : "Dimas Anggara",
      phone: loginPhone.trim(),
      nik: isAdmin ? "3171010101900001" : "3171020409950001",
      dob: isAdmin ? "01 Januari 1990" : "14 Mei 1995",
      gender: "Laki-laki",
      rmNumber: isAdmin ? "ADM-WNS-01" : "RM-WNS-8842",
      registeredAt: "12 Januari 2026",
      role: isAdmin ? "admin" : "user",
    }

    setCurrentUser(user)
    showToast(
      isAdmin
        ? "Selamat datang, Administrator Klinik Wansha! (Hak Akses Penuh)"
        : `Selamat datang kembali, ${user.name}!`
    )
    setCurrentScreen("main")
  }

  // Register handler
  function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!regName.trim() || !regPhone.trim()) {
      showToast("Nama dan nomor WhatsApp wajib diisi.")
      return
    }

    const newUser: PatientUser = {
      id: `usr_${Date.now()}`,
      name: regName.trim(),
      phone: regPhone.trim(),
      nik: regNik.trim() || "317102********01",
      dob: regDob.trim() || "01 Jan 1998",
      gender: regGender,
      rmNumber: `RM-WNS-${Math.floor(1000 + Math.random() * 9000)}`,
      registeredAt: "Hari ini",
    }

    setCurrentUser(newUser)
    showToast(`Pendaftaran berhasil! Halo, ${newUser.name}.`)
    setCurrentScreen("main")
  }

  // Quick Demo Autofill
  function autofillDemoUser() {
    setRegName("Dimas Anggara")
    setRegPhone("081234567890")
    setRegNik("3171020409950001")
    setRegDob("1995-05-14")
    setRegPassword("123456")
  }

  // Intercept Ambil Antrean -> Wajib Registrasi
  function handleStartBooking(preferredService?: string, preferredDoctor?: string) {
    if (preferredService) setService(preferredService)
    if (preferredDoctor) setDoctor(preferredDoctor)

    if (!currentUser) {
      showToast("Silakan login atau daftar akun terlebih dahulu.")
      setCurrentScreen("login")
      return
    }

    setCurrentScreen("booking")
  }

  // Confirm booking (Sync with Backend Laravel Server)
  async function handleConfirmBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!currentUser) return

    showToast("Menerbitkan tiket ke server klinik...")

    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/queue/reserve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          patient_name: currentUser.name,
          patient_phone: currentUser.phone,
          service,
          doctor,
          priority,
          notes,
        }),
      })

      const data = await res.json()

      if (data.success && data.ticket) {
        const srvTicket = data.ticket
        const confirmedTicket: PatientTicket = {
          id: srvTicket.id,
          ticketNumber: srvTicket.ticket_number,
          patientName: srvTicket.patient_name,
          phone: srvTicket.patient_phone,
          service: srvTicket.service,
          doctor: srvTicket.doctor,
          room: srvTicket.room,
          priority: srvTicket.priority,
          arrivedAt: new Date(srvTicket.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          order: queue.length + 1,
          status: "menunggu",
          notes: srvTicket.notes || "",
          qrCode: srvTicket.qr_code,
          isServerTicket: true,
        }

        setQueue((prev) => [confirmedTicket, ...prev.filter((q) => q.id !== confirmedTicket.id)])
        setMyTicketId(confirmedTicket.id)
        showToast(`Nomor antrean ${srvTicket.ticket_number} berhasil diterbitkan di server!`)
        setCurrentScreen("ticket_detail")
        fetchLiveQueue()
        return
      }
    } catch (err) {
      console.warn("Backend reservation failed, fallback local:", err)
    }

    // Fallback offline / local
    const now = new Date()
    const nextOrder = Math.max(0, ...queue.map((q) => q.order)) + 1
    const ticketCode = `A${String(nextOrder).padStart(2, "0")}`

    const newTicket: PatientTicket = {
      id: Date.now(),
      ticketNumber: ticketCode,
      patientName: currentUser.name,
      phone: currentUser.phone,
      service,
      doctor,
      room: doctor.includes("Alya")
        ? "Poli Gigi 1"
        : doctor.includes("Keisha")
          ? "Poli Gigi 2"
          : "Poli Gigi 3",
      priority,
      arrivedAt: `${String(now.getHours()).padStart(2, "0")}.${String(now.getMinutes()).padStart(2, "0")}`,
      order: nextOrder,
      status: "menunggu",
      notes,
      qrCode: `WNS-QR-${ticketCode}-${Date.now().toString().slice(-4)}`,
    }

    setQueue((prev) => [...prev, newTicket])
    setMyTicketId(newTicket.id)
    showToast(`Nomor antrean ${ticketCode} berhasil diambil (mode offline)!`)
    setCurrentScreen("ticket_detail")
  }

  function handleCancelTicket() {
    if (!myTicket) return
    setQueue((prev) => prev.filter((q) => q.id !== myTicket.id))
    setMyTicketId(null)
    showToast("Nomor antrean telah dibatalkan.")
    setCurrentScreen("main")
  }

  function handleLogout() {
    setCurrentUser(null)
    setMyTicketId(null)
    showToast("Anda telah keluar.")
    setCurrentScreen("splash")
  }

  return (
    <main className="page-shell">
      <section className="mobile-app">
        {/* ======================================================== */}
        {/* SCREEN 1: SPLASH & ONBOARDING                            */}
        {/* ======================================================== */}
        {currentScreen === "splash" && (
          <div className="screen-fullscreen splash-view">
            <div className="splash-top">
              <div className="mascot-hero-wrap">
                <div className="mascot-glow-circle" />
                <ToothCharacter className="splash-mascot" />
              </div>
            </div>

            <div className="splash-body">
              <div className="brand-badge-pill">
                <Icon name="sparkle" size={14} /> KLINIK WANSHA CARE
              </div>

              <h1 className="splash-title">
                Senyum Sehat & Bebas Antre Tanpa Rasa Takut
              </h1>

              <p className="splash-subtitle">
                Ambil nomor antrean digital, konsultasi dokter spesialis gigi,
                dan pantau giliran Anda langsung dari smartphone.
              </p>

              <div className="splash-features">
                <div className="feat-chip">
                  <Icon name="check" size={13} /> Tanpa Antre Lama
                </div>
                <div className="feat-chip">
                  <Icon name="check" size={13} /> Dokter Spesialis
                </div>
                <div className="feat-chip">
                  <Icon name="check" size={13} /> Rekam Medis Digital
                </div>
              </div>
            </div>

            <div className="splash-actions">
              <button
                className="btn-primary-large"
                onClick={() => setCurrentScreen("register")}
              >
                Daftar Akun Pasien Baru <Icon name="arrow" size={18} />
              </button>

              <button
                className="btn-secondary-large"
                onClick={() => setCurrentScreen("login")}
              >
                Sudah Punya Akun? Masuk
              </button>

              <button
                className="btn-link-guest"
                onClick={() => {
                  setCurrentScreen("main")
                  showToast("Mode Penjelajah: Masuk untuk mengambil antrean.")
                }}
              >
                Lewati & Jelajahi Klinik Dulu
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 2: LOGIN                                          */}
        {/* ======================================================== */}
        {currentScreen === "login" && (
          <div className="screen-fullscreen auth-view">
            <header className="auth-header">
              <button
                className="back-circle-btn"
                onClick={() => setCurrentScreen("splash")}
                aria-label="Kembali"
              >
                <Icon name="arrowLeft" size={20} />
              </button>
              <span className="auth-step-title">Masuk ke Akun Pasien</span>
              <div className="w-8" />
            </header>

            <div className="auth-body">
              <div className="auth-welcome">
                <div className="auth-mini-mascot">
                  <ToothCharacter className="w-16 h-14" />
                </div>
                <h2>Selamat Datang di Wansha</h2>
                <p>
                  Masukkan nomor WhatsApp dan password untuk mengakses tiket dan
                  rekam medis digital Anda.
                </p>
              </div>

              <form onSubmit={handleLogin} className="auth-form-card">
                <label className="input-group">
                  <span>Nomor WhatsApp Aktif</span>
                  <div className="input-box">
                    <Icon name="phone" size={18} />
                    <input
                      type="tel"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      required
                      autoFocus
                    />
                  </div>
                </label>

                <label className="input-group">
                  <span>Password / PIN Pasien</span>
                  <div className="input-box">
                    <Icon name="lock" size={18} />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Masukkan password Anda"
                      required
                    />
                  </div>
                </label>

                <button type="submit" className="btn-primary-large mt-4">
                  Masuk Sekarang <Icon name="arrow" size={18} />
                </button>

                {/* Quick Fill Demo Helpers for Admin & User */}
                <div className="space-y-2 mt-2">
                  <div className="text-[11px] font-semibold text-center text-[#6E817F]">
                    Pilih Akun Contoh (1-Klik Isi):
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="quick-demo-fill text-left py-2 px-2.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/75 transition-colors"
                      onClick={() => {
                        setLoginPhone("081299999999")
                        setLoginPassword("admin123")
                        showToast("Akun Admin terisi! Klik Masuk Sekarang.")
                      }}
                    >
                      <div className="font-bold text-[11px] text-amber-900 flex items-center gap-1">
                        👑 Admin Klinik
                      </div>
                      <div className="text-[10px] text-amber-700">081299999999</div>
                    </button>

                    <button
                      type="button"
                      className="quick-demo-fill text-left py-2 px-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/75 transition-colors"
                      onClick={() => {
                        setLoginPhone("081234567890")
                        setLoginPassword("123456")
                        showToast("Akun Pasien terisi! Klik Masuk Sekarang.")
                      }}
                    >
                      <div className="font-bold text-[11px] text-emerald-900 flex items-center gap-1">
                        👤 Pasien (User)
                      </div>
                      <div className="text-[10px] text-emerald-700">081234567890</div>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="auth-footer">
              <p>
                Belum memiliki akun?{" "}
                <button
                  type="button"
                  className="text-link-green"
                  onClick={() => setCurrentScreen("register")}
                >
                  Daftar di sini
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 3: REGISTER                                       */}
        {/* ======================================================== */}
        {currentScreen === "register" && (
          <div className="screen-fullscreen auth-view">
            <header className="auth-header">
              <button
                className="back-circle-btn"
                onClick={() => setCurrentScreen("splash")}
                aria-label="Kembali"
              >
                <Icon name="arrowLeft" size={20} />
              </button>
              <span className="auth-step-title">Pendaftaran Akun Pasien</span>
              <div className="w-8" />
            </header>

            <div className="auth-body scrollable">
              <div className="auth-welcome">
                <div className="auth-mini-mascot">
                  <ToothCharacter className="w-16 h-14" />
                </div>
                <h2>Registrasi Pasien Baru</h2>
                <p>
                  Data Anda akan digunakan untuk penerbitan Nomor Rekam Medis
                  resmi di Klinik Wansha.
                </p>
              </div>

              <form onSubmit={handleRegister} className="auth-form-card">
                <label className="input-group">
                  <span>Nama Lengkap Pasien *</span>
                  <div className="input-box">
                    <Icon name="user" size={18} />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Contoh: Dimas Anggara"
                      required
                    />
                  </div>
                </label>

                <label className="input-group">
                  <span>Nomor WhatsApp Aktif *</span>
                  <div className="input-box">
                    <Icon name="phone" size={18} />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      required
                    />
                  </div>
                </label>

                <label className="input-group">
                  <span>NIK / No. KTP (Untuk Rekam Medis)</span>
                  <div className="input-box">
                    <Icon name="idCard" size={18} />
                    <input
                      type="text"
                      value={regNik}
                      onChange={(e) => setRegNik(e.target.value)}
                      placeholder="Contoh: 3171020409950001"
                    />
                  </div>
                </label>

                <div className="form-row-2">
                  <label className="input-group">
                    <span>Tanggal Lahir</span>
                    <input
                      type="date"
                      value={regDob}
                      onChange={(e) => setRegDob(e.target.value)}
                      className="input-plain"
                    />
                  </label>

                  <label className="input-group">
                    <span>Jenis Kelamin</span>
                    <select
                      value={regGender}
                      onChange={(e) =>
                        setRegGender(e.target.value as "Laki-laki" | "Perempuan")
                      }
                      className="input-plain"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </label>
                </div>

                <label className="input-group">
                  <span>Buat Password / PIN Akun *</span>
                  <div className="input-box">
                    <Icon name="lock" size={18} />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      required
                    />
                  </div>
                </label>

                <button type="submit" className="btn-primary-large mt-3">
                  Daftar & Masuk ke Klinik <Icon name="arrow" size={18} />
                </button>

                <button
                  type="button"
                  className="quick-demo-fill"
                  onClick={autofillDemoUser}
                >
                  <Icon name="sparkle" size={14} /> Isi Contoh Otomatis
                </button>
              </form>

              <div className="auth-footer mt-4 pb-6">
                <p>
                  Sudah memiliki akun terdaftar?{" "}
                  <button
                    type="button"
                    className="text-link-green"
                    onClick={() => setCurrentScreen("login")}
                  >
                    Masuk di sini
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 4: BOOKING / AMBIL ANTREAN (DEDICATED FULL SCREEN)*/}
        {/* ======================================================== */}
        {currentScreen === "booking" && (
          <div className="screen-fullscreen auth-view">
            <header className="auth-header">
              <button
                className="back-circle-btn"
                onClick={() => setCurrentScreen("main")}
                aria-label="Kembali ke Beranda"
              >
                <Icon name="arrowLeft" size={20} />
              </button>
              <span className="auth-step-title">Ambil Nomor Antrean</span>
              <div className="w-8" />
            </header>

            <form
              onSubmit={handleConfirmBooking}
              className="booking-screen-body scrollable"
            >
              {currentUser && (
                <div className="booking-patient-summary">
                  <div className="pat-avatar">
                    <Icon name="user" size={18} />
                  </div>
                  <div>
                    <strong>{currentUser.name}</strong>
                    <span>
                      WA: {currentUser.phone} · RM: {currentUser.rmNumber}
                    </span>
                  </div>
                </div>
              )}

              {/* STEP 1: PILIH LAYANAN */}
              <div className="booking-section">
                <label className="section-label">
                  1. Pilih Layanan Perawatan
                </label>
                <div className="services-choice-list">
                  {[
                    {
                      name: "Scaling karang gigi",
                      desc: "Bersih tuntas ultrasonik & nafas segar",
                      badge: "Populer",
                    },
                    {
                      name: "Sakit gigi akut (Darurat)",
                      desc: "Penanganan cepat rasa sakit berlebih",
                      badge: "Prioritas",
                    },
                    {
                      name: "Pemeriksaan gigi anak",
                      desc: "Ramah anak & santai bersama Wanshy",
                      badge: "Spesialis Anak",
                    },
                    {
                      name: "Penambalan komposit",
                      desc: "Tambal estetik sewarna gigi asli",
                      badge: "Estetika",
                    },
                    {
                      name: "Konsultasi kawat gigi / Behel",
                      desc: "Pemeriksaan ortodonti & cetak gigi",
                      badge: "Ortodonti",
                    },
                    {
                      name: "Pencabutan gigi",
                      desc: "Pencabutan aman & minim rasa sakit",
                      badge: "Tindakan",
                    },
                  ].map((s) => (
                    <div
                      key={s.name}
                      className={`choice-card ${service === s.name ? "selected" : ""}`}
                      onClick={() => setService(s.name)}
                    >
                      <div className="choice-left">
                        <span className="choice-title">{s.name}</span>
                        <span className="choice-desc">{s.desc}</span>
                      </div>
                      <span className="choice-badge">{s.badge}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* STEP 2: PILIH DOKTER */}
              <div className="booking-section">
                <label className="section-label">2. Pilih Dokter Spesialis</label>
                <div className="doctor-choice-list">
                  {[
                    {
                      name: "drg. Alya Nirmala, Sp.KG",
                      spec: "Spesialis Konservasi Gigi",
                      room: "Poli Gigi 1",
                      hours: "08.00 - 14.00 WIB",
                    },
                    {
                      name: "drg. Keisha Putri, Sp.KGA",
                      spec: "Spesialis Kedokteran Gigi Anak",
                      room: "Poli Gigi 2",
                      hours: "09.00 - 15.00 WIB",
                    },
                    {
                      name: "drg. Budi Santoso, Sp.Ort",
                      spec: "Spesialis Ortodonti & Behel",
                      room: "Poli Gigi 3",
                      hours: "14.00 - 20.00 WIB",
                    },
                  ].map((d) => (
                    <div
                      key={d.name}
                      className={`doctor-choice-card ${doctor === d.name ? "selected" : ""}`}
                      onClick={() => setDoctor(d.name)}
                    >
                      <div className="doc-avatar">
                        <Icon name="user" size={16} />
                      </div>
                      <div className="doc-meta-info">
                        <strong>{d.name}</strong>
                        <span>{d.spec}</span>
                        <span className="doc-time">
                          {d.room} · {d.hours}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* STEP 3: KATEGORI PRIORITAS */}
              <div className="booking-section">
                <label className="section-label">3. Kategori Prioritas Pasien</label>
                <div className="priority-choice-grid">
                  {(["Darurat", "Lansia", "Anak", "Reguler"] as Priority[]).map(
                    (p) => (
                      <button
                        key={p}
                        type="button"
                        className={`priority-btn ${priority === p ? "selected" : ""}`}
                        onClick={() => setPriority(p)}
                      >
                        {p}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* STEP 4: KELUHAN */}
              <div className="booking-section">
                <label className="section-label">4. Keluhan / Catatan Tambahan</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ceritakan keluhan gigi Anda (contoh: gigi geraham belakang ngilu 2 hari)"
                  className="textarea-input"
                  rows={3}
                />
              </div>

              <div className="sticky-booking-footer">
                <button type="submit" className="btn-primary-large">
                  Konfirmasi & Terbitkan Tiket Antrean{" "}
                  <Icon name="arrow" size={18} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 5: TIKET DETAIL (DEDICATED FULL SCREEN)           */}
        {/* ======================================================== */}
        {currentScreen === "ticket_detail" && myTicket && (
          <div className="screen-fullscreen auth-view">
            <header className="auth-header">
              <button
                className="back-circle-btn"
                onClick={() => setCurrentScreen("main")}
                aria-label="Kembali ke Beranda"
              >
                <Icon name="arrowLeft" size={20} />
              </button>
              <span className="auth-step-title">Tiket Antrean Digital</span>
              <div className="w-8" />
            </header>

            <div className="ticket-screen-body scrollable">
              {/* Boarding-pass style ticket card */}
              <div className="digital-ticket-container">
                <div className="ticket-top-banner">
                  <div className="flex items-center gap-2">
                    <span className="pulse-dot" />
                    <span className="ticket-clinic-name">KLINIK WANSHA</span>
                  </div>
                  <PriorityBadge value={myTicket.priority} />
                </div>

                <div className="ticket-number-hero">
                  <span className="hero-sub">NOMOR ANTREAN ANDA</span>
                  <h1 className="hero-num">{myTicket.ticketNumber}</h1>
                  <span className="hero-service-badge">{myTicket.service}</span>
                </div>

                {/* Perforated separator */}
                <div className="ticket-perforated">
                  <div className="notch-left" />
                  <div className="perforated-line" />
                  <div className="notch-right" />
                </div>

                {/* QR Code section */}
                <div className="ticket-qr-section">
                  <div className="qr-wrapper">
                    {myTicket.qrCode ? (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(myTicket.qrCode)}`}
                        alt="QR Code Tiket"
                        className="w-36 h-36 object-contain rounded-lg shadow-sm"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    ) : (
                      <Icon name="qr" size={120} />
                    )}
                  </div>
                  <div className="text-center mt-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                      {myTicket.qrCode || `WNS-${myTicket.ticketNumber}`}
                    </span>
                  </div>
                  <p className="qr-caption">
                    Tunjukkan QR code ini ke kamera scanner resepsionis
                    Klinik Wansha untuk validasi otomatis.
                  </p>
                </div>

                {/* Ticket Details */}
                <div className="ticket-spec-table">
                  <div className="spec-row">
                    <span>Pasien:</span>
                    <strong>{myTicket.patientName}</strong>
                  </div>
                  <div className="spec-row">
                    <span>Dokter:</span>
                    <strong>{myTicket.doctor}</strong>
                  </div>
                  <div className="spec-row">
                    <span>Ruang Poli:</span>
                    <strong>{myTicket.room}</strong>
                  </div>
                  <div className="spec-row">
                    <span>Waktu Kedatangan:</span>
                    <strong>{myTicket.arrivedAt} WIB</strong>
                  </div>
                  <div className="spec-row">
                    <span>Estimasi Menit Masuk:</span>
                    <strong className="text-emerald-700">
                      ± {myQueuePosition?.estimatedWaitTime} Menit
                    </strong>
                  </div>
                  <div className="spec-row">
                    <span>Urutan Antrean:</span>
                    <strong>
                      {myQueuePosition?.peopleAhead === 0
                        ? "Giliran Anda Sekarang!"
                        : `${myQueuePosition?.peopleAhead} orang lagi di depan`}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="ticket-screen-actions">
                <button
                  className="btn-primary-large"
                  onClick={() => setCurrentScreen("main")}
                >
                  Pantau Antrean di Beranda
                </button>

                <button
                  className="btn-cancel-ticket"
                  onClick={handleCancelTicket}
                >
                  Batalkan Antrean Ini
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 6: MAIN TABS (BERANDA, ANTREAN, JADWAL, PROFIL)   */}
        {/* ======================================================== */}
        {currentScreen === "main" && (
          <>
            {/* Topbar */}
            <header className="topbar">
              <div className="brand">
                <div className="brand-mark">
                  <svg viewBox="0 0 32 32" aria-hidden="true">
                    <path d="M9.2 5.4c2.3-1.6 4.2.7 6.8.7s4.5-2.3 6.8-.7c4 2.8.5 8.5-.6 12.4-1.5 5.2-2.5 8-4.7 7.8-1.8-.2-1.3-5.4-2.7-5.4s-.9 5.2-2.7 5.4c-2.2.2-3.2-2.6-4.7-7.8-1.1-3.9-4.6-9.6-.6-12.4Z" />
                  </svg>
                </div>
                <div>
                  <span className="brand-name">Klinik Wansha</span>
                  <span className="brand-subtitle">Klinik Gigi & Ortodonti</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentUser ? (
                  <button
                    className="user-pill-btn flex items-center gap-1.5"
                    onClick={() => setActiveTab("profile")}
                    title={`Profil ${currentUser.role === "admin" ? "Admin" : "Pasien"}`}
                  >
                    <span className="user-dot" />
                    {currentUser.role === "admin" && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1 py-0.5 rounded">
                        👑 Admin
                      </span>
                    )}
                    <span className="user-name-short">
                      {currentUser.name.split(" ")[0]}
                    </span>
                  </button>
                ) : (
                  <button
                    className="login-quick-btn"
                    onClick={() => setCurrentScreen("login")}
                  >
                    Masuk
                  </button>
                )}

                <button
                  className="icon-button"
                  aria-label="Pengaturan Server"
                  title="Pengaturan Server API"
                  onClick={() => setIsServerModalOpen(true)}
                >
                  <Icon name="sparkle" size={18} />
                </button>

                <button
                  className="icon-button"
                  aria-label="Notifikasi"
                  onClick={() =>
                    showToast("Klinik Wansha buka hari ini s/d 20.00 WIB.")
                  }
                >
                  <Icon name="bell" size={20} />
                  <span className="notification-dot" />
                </button>
              </div>
            </header>

            {/* Content per Tab */}
            <div className="content">
              {/* TAB 1: BERANDA */}
              {activeTab === "home" && (
                <>
                  <section className="welcome-card">
                    <div className="welcome-copy">
                      <span className="eyebrow">
                        {currentUser
                          ? `HALO, ${currentUser.name.toUpperCase()}`
                          : "SELAMAT DATANG DI WANSHA"}
                      </span>
                      <h1>Siap membuat senyum sehat hari ini?</h1>
                      <p>
                        {currentlyServing
                          ? `Sedang melayani antrean ${currentlyServing.ticketNumber} di ${currentlyServing.room}.`
                          : "Antrean klinik saat ini sedang lengang."}
                      </p>
                    </div>
                    <ToothCharacter />
                  </section>

                  {/* Promo Banner with Mascot */}
                  <div className="mascot-promo-strip">
                    <div className="promo-badge">
                      <Icon name="sparkle" size={14} /> PROMO WANSHA CARE
                    </div>
                    <div className="promo-content">
                      <div>
                        <strong>Scaling Gigi Bersama Wanshy</strong>
                        <p>Gratis dental kit & konsultasi dokter gigi.</p>
                      </div>
                      <button
                        className="promo-btn"
                        onClick={() =>
                          handleStartBooking("Scaling karang gigi")
                        }
                      >
                        Klaim
                      </button>
                    </div>
                  </div>

                  {/* Status Tiket Saya OR Ambil Antrean Card */}
                  <section className="section-block">
                    <div className="section-heading">
                      <div>
                        <span className="section-kicker">STATUS TIKET ANDA</span>
                        <h2>Antrean Hari Ini</h2>
                      </div>
                      {myTicket && (
                        <button
                          className="text-button"
                          onClick={() => setCurrentScreen("ticket_detail")}
                        >
                          Buka Tiket QR
                        </button>
                      )}
                    </div>

                    {myTicket ? (
                      <div className="next-card patient-ticket-card">
                        <div className="queue-number">
                          {myTicket.ticketNumber}
                        </div>
                        <div className="patient-main">
                          <div className="patient-topline">
                            <h3>{myTicket.patientName}</h3>
                            <PriorityBadge value={myTicket.priority} />
                          </div>
                          <p>
                            {myTicket.service} · {myTicket.doctor}
                          </p>

                          <div className="patient-meta">
                            <span>
                              <Icon name="clock" size={15} /> Estimasi ±{" "}
                              {myQueuePosition?.estimatedWaitTime} menit
                            </span>
                            <span>
                              <Icon name="users" size={15} />{" "}
                              {myQueuePosition?.peopleAhead === 0
                                ? "Giliran Anda Sekarang!"
                                : `${myQueuePosition?.peopleAhead} pasien lagi di depan`}
                            </span>
                          </div>
                        </div>

                        <div className="ticket-actions">
                          <button
                            className="call-button primary-action"
                            onClick={() => setCurrentScreen("ticket_detail")}
                          >
                            <Icon name="ticket" size={18} /> Detail Tiket QR
                          </button>
                          <button
                            className="outline-button-small"
                            onClick={() => setActiveTab("queue")}
                          >
                            Papan Antrean Live
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="empty-ticket-card">
                        <div className="empty-ticket-icon">
                          <Icon name="ticket" size={28} />
                        </div>
                        <div>
                          <h3>
                            {currentUser
                              ? "Anda Belum Mengambil Antrean"
                              : "Registrasi & Ambil Nomor Antrean"}
                          </h3>
                          <p>
                            {currentUser
                              ? "Pilih layanan perawatan dan dokter untuk mendapatkan nomor antrean online tanpa perlu menunggu lama di klinik."
                              : "Daftar akun pasien terlebih dahulu untuk mendapatkan nomor antrean resmi dan rekam medis digital."}
                          </p>
                        </div>
                        <button
                          className="call-button"
                          onClick={() => handleStartBooking()}
                        >
                          {currentUser
                            ? "Ambil Nomor Antrean Sekarang"
                            : "Daftar Akun & Ambil Antrean"}
                          <Icon name="arrow" size={18} />
                        </button>
                      </div>
                    )}
                  </section>

                  {/* Status Klinik Hari Ini */}
                  <section className="section-block">
                    <div className="section-heading">
                      <div>
                        <span className="section-kicker">STATUS KLINIK</span>
                        <h2>Aktivitas Hari Ini</h2>
                      </div>
                    </div>
                    <div className="stats-grid">
                      <article className="stat-card mint">
                        <div className="stat-icon">
                          <Icon name="users" />
                        </div>
                        <strong>
                          {queue.filter((q) => q.status === "menunggu").length}
                        </strong>
                        <span>Menunggu</span>
                      </article>
                      <article className="stat-card cream">
                        <div className="stat-icon">
                          <Icon name="check" />
                        </div>
                        <strong>{currentlyServing?.ticketNumber || "-"}</strong>
                        <span>Di Ruang Poli</span>
                      </article>
                      <article className="stat-card blue">
                        <div className="stat-icon">
                          <Icon name="clock" />
                        </div>
                        <strong>± 15</strong>
                        <span>Menit / Pasien</span>
                      </article>
                    </div>
                  </section>

                  {/* Layanan Unggulan */}
                  <section className="section-block">
                    <div className="section-heading">
                      <div>
                        <span className="section-kicker">
                          LAYANAN UNGGULAN
                        </span>
                        <h2>Pilih Perawatan Gigi</h2>
                      </div>
                    </div>

                    <div className="service-quick-grid">
                      {[
                        {
                          name: "Scaling Karang Gigi",
                          desc: "Bersih tuntas & nafas segar",
                          tag: "Paling Populer",
                        },
                        {
                          name: "Sakit Gigi Akut",
                          desc: "Penanganan darurat cepat",
                          tag: "Prioritas Cepat",
                        },
                        {
                          name: "Pemeriksaan Gigi Anak",
                          desc: "Ramah anak bersama Wanshy",
                          tag: "Spesialis Anak",
                        },
                        {
                          name: "Tambal Komposit",
                          desc: "Estetik sewarna gigi asli",
                          tag: "Hasil Alami",
                        },
                      ].map((srv) => (
                        <div
                          key={srv.name}
                          className="service-card"
                          onClick={() => handleStartBooking(srv.name)}
                        >
                          <div className="service-tag">{srv.tag}</div>
                          <h4>{srv.name}</h4>
                          <p>{srv.desc}</p>
                          <span className="service-cta">
                            Daftar Layanan <Icon name="arrow" size={14} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Info Strip */}
                  <div className="info-strip">
                    <div className="info-icon">
                      <Icon name="mapPin" />
                    </div>
                    <div>
                      <strong>Klinik Wansha Dental Care</strong>
                      <span>Gedung Medika Lt. 1 · Buka 08.00 - 20.00 WIB</span>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: ANTREAN */}
              {activeTab === "queue" && (
                <section className="queue-page">
                  <div className="queue-header">
                    <span className="section-kicker">PAPAN ANTREAN PUBLIK</span>
                    <h1>Live Status Antrean</h1>
                    <p>
                      Pantau posisi nomor antrean secara langsung dari HP Anda.
                      Urutan mengutamakan prioritas medis lalu waktu kedatangan.
                    </p>
                  </div>

                  <div className="now-serving-banner">
                    <div className="serving-left">
                      <span className="pulse-dot" />
                      <div>
                        <span className="sub-title">SEDANG DIPERIKSA</span>
                        <h3>{currentlyServing?.room || "Poli Gigi 1"}</h3>
                      </div>
                    </div>
                    <div className="serving-ticket">
                      {currentlyServing?.ticketNumber || "--"}
                    </div>
                  </div>

                  <div className="legend">
                    <span>
                      <i className="dot danger" /> Darurat
                    </span>
                    <span>
                      <i className="dot senior" /> Lansia
                    </span>
                    <span>
                      <i className="dot child" /> Anak
                    </span>
                    <span>
                      <i className="dot regular" /> Reguler
                    </span>
                  </div>

                  <div className="queue-list">
                    {sortedQueue.map((item, index) => {
                      const isMyTicket = item.id === myTicketId
                      const isCurrent = item.status === "dipanggil"

                      return (
                        <article
                          className={`patient-row ${isCurrent ? "is-next" : ""} ${isMyTicket ? "is-mine" : ""}`}
                          key={item.id}
                        >
                          <div className="row-position">
                            {item.ticketNumber}
                          </div>
                          <div className="row-copy">
                            <div>
                              <h3>
                                {isMyTicket
                                  ? `${item.patientName} (Tiket Anda)`
                                  : `Pasien ${item.ticketNumber}`}
                              </h3>
                              <PriorityBadge value={item.priority} />
                            </div>
                            <p>
                              {item.service} · Tiba {item.arrivedAt}
                            </p>
                          </div>

                          {isCurrent ? (
                            <span className="next-label">DIPERIKSA</span>
                          ) : isMyTicket ? (
                            <span className="mine-label">TIKET SAYA</span>
                          ) : (
                            <span className="wait-label">
                              Urutan ke-{index + 1}
                            </span>
                          )}
                        </article>
                      )
                    })}
                  </div>

                  <button
                    className="call-button queue-call"
                    onClick={() => handleStartBooking()}
                  >
                    <Icon name="plus" size={18} /> Ambil Antrean Pasien
                  </button>
                </section>
              )}

              {/* TAB 3: JADWAL */}
              {activeTab === "schedule" && (
                <section className="schedule-page">
                  <div className="queue-header">
                    <span className="section-kicker">JADWAL PRAKTEK</span>
                    <h1>Dokter Spesialis Wansha</h1>
                    <p>
                      Pilih dokter spesialis sesuai kebutuhan keluhan Anda dan
                      reservasi janji temu dengan mudah.
                    </p>
                  </div>

                  <div className="doctor-list">
                    {[
                      {
                        name: "drg. Alya Nirmala, Sp.KG",
                        specialty: "Spesialis Konservasi & Perawatan Gigi",
                        hours: "Hari Ini: 08.00 - 14.00 WIB",
                        room: "Poli Gigi 1",
                        badge: "Sedang Praktek",
                      },
                      {
                        name: "drg. Budi Santoso, Sp.Ort",
                        specialty: "Spesialis Ortodonti (Behel & Aligner)",
                        hours: "Hari Ini: 14.00 - 20.00 WIB",
                        room: "Poli Gigi 3",
                        badge: "Sore Nanti",
                      },
                      {
                        name: "drg. Keisha Putri, Sp.KGA",
                        specialty: "Spesialis Kedokteran Gigi Anak",
                        hours: "Besok: 09.00 - 15.00 WIB",
                        room: "Poli Gigi 2",
                        badge: "Bisa Booking",
                      },
                    ].map((doc) => (
                      <article key={doc.name} className="doctor-card">
                        <div className="doctor-avatar">
                          <Icon name="user" size={24} />
                        </div>
                        <div className="doctor-info">
                          <div className="doctor-header">
                            <h3>{doc.name}</h3>
                            <span className="available-pill">{doc.badge}</span>
                          </div>
                          <span className="doctor-spec">{doc.specialty}</span>
                          <div className="doctor-meta">
                            <span>
                              <Icon name="clock" size={14} /> {doc.hours}
                            </span>
                            <span>
                              <Icon name="mapPin" size={14} /> {doc.room}
                            </span>
                          </div>
                          <button
                            className="outline-button-small"
                            onClick={() =>
                              handleStartBooking(undefined, doc.name)
                            }
                          >
                            Pilih & Ambil Antrean{" "}
                            <Icon name="arrow" size={14} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* TAB 4: PROFIL */}
              {activeTab === "profile" && (
                <section className="profile-page">
                  <div className="queue-header">
                    <span className="section-kicker">PROFIL PASIEN</span>
                    <h1>Kartu Pasien Digital</h1>
                    <p>
                      {currentUser
                        ? "Identitas rekam medis resmi Anda di Klinik Wansha."
                        : "Masuk atau daftar akun untuk mengakses kartu pasien digital."}
                    </p>
                  </div>

                  {currentUser ? (
                    <>
                      <div className="patient-digital-card">
                        <div className="card-top">
                          <div>
                            <span className="card-chip">KLINIK WANSHA DENTAL</span>
                            <h2>{currentUser.name}</h2>
                            <span className="card-rm">
                              No. RM: {currentUser.rmNumber}
                            </span>
                            <span className="card-phone">
                              WA: {currentUser.phone}
                            </span>
                          </div>
                          <div className="card-qr">
                            <Icon name="qr" size={44} />
                          </div>
                        </div>
                        <div className="card-bottom">
                          <div>
                            <span>STATUS PASIEN</span>
                            <strong>Pasien Terverifikasi</strong>
                          </div>
                          <div>
                            <span>TERDAFTAR SEJAK</span>
                            <strong>{currentUser.registeredAt}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Riwayat Perawatan */}
                      <section className="section-block">
                        <div className="section-heading">
                          <div>
                            <span className="section-kicker">
                              RIWAYAT PERAWATAN
                            </span>
                            <h2>Kunjungan Pasien</h2>
                          </div>
                        </div>

                        <div className="history-list">
                          <div className="history-item">
                            <div className="history-icon">
                              <Icon name="check" size={16} />
                            </div>
                            <div className="history-content">
                              <strong>Scaling Gigi Menyeluruh</strong>
                              <p>drg. Alya Nirmala, Sp.KG · 12 Jan 2026</p>
                            </div>
                            <span className="history-tag">Selesai</span>
                          </div>

                          <div className="history-item">
                            <div className="history-icon">
                              <Icon name="check" size={16} />
                            </div>
                            <div className="history-content">
                              <strong>Penambalan Gigi Geraham Kiri</strong>
                              <p>drg. Alya Nirmala, Sp.KG · 18 Nov 2025</p>
                            </div>
                            <span className="history-tag">Selesai</span>
                          </div>
                        </div>
                      </section>

                      {/* Reminder */}
                      <div className="care-reminder-box">
                        <Icon name="sparkle" size={24} />
                        <div>
                          <strong>Jadwal Kontrol Gigi Rutin</strong>
                          <p>
                            Pembersihan karang gigi disarankan setiap 6 bulan
                            sekali. Jadwal Anda berikutnya:{" "}
                            <strong>Juli 2026</strong>.
                          </p>
                        </div>
                      </div>

                      <button
                        className="logout-button"
                        onClick={handleLogout}
                      >
                        <Icon name="logOut" size={16} /> Keluar dari Akun
                      </button>
                    </>
                  ) : (
                    <div className="empty-ticket-card text-center">
                      <div className="mini-character mx-auto">
                        <ToothCharacter />
                      </div>
                      <h3>Belum Masuk ke Akun</h3>
                      <p>
                        Daftar akun pasien Klinik Wansha untuk memiliki Kartu
                        Pasien Digital dan riwayat rekam medis pribadi Anda.
                      </p>
                      <div className="flex gap-2 mt-4">
                        <button
                          className="call-button flex-1"
                          onClick={() => setCurrentScreen("register")}
                        >
                          Daftar Akun Baru
                        </button>
                        <button
                          className="outline-button-small flex-1"
                          onClick={() => setCurrentScreen("login")}
                        >
                          Sudah Punya Akun
                        </button>
                      </div>
                    </div>
                  )}

                  {/* WhatsApp Hubungi Resepsionis */}
                  <a
                    href="https://wa.me/6281234567890"
                    target="_blank"
                    rel="noreferrer"
                    className="whatsapp-help-btn"
                  >
                    <Icon name="phone" size={18} /> Hubungi Resepsionis Klinik
                    Wansha
                  </a>
                </section>
              )}
            </div>

            {/* Floating Action Button */}
            <button
              className="floating-add"
              onClick={() => handleStartBooking()}
              aria-label="Ambil Nomor Antrean Pasien"
            >
              <Icon name="plus" size={25} />
            </button>

            {/* Bottom Navigation */}
            <nav className="bottom-nav" aria-label="Navigasi Pasien">
              {[
                ["home", "home", "Beranda"],
                ["queue", "queue", "Antrean"],
                ["schedule", "calendar", "Jadwal"],
                ["profile", "user", "Profil"],
              ].map(([tab, icon, label]) => (
                <button
                  className={activeTab === tab ? "active" : ""}
                  key={tab}
                  onClick={() => setActiveTab(tab as Tab)}
                >
                  <Icon name={icon as IconName} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </>
        )}

        {/* Global Toast */}
        {toastMessage && (
          <div className="toast">
            <span className="toast-icon">
              <Icon name="check" />
            </span>
            <div>
              <strong>Klinik Wansha</strong>
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Server Config Modal */}
        <ServerConfigModal
          isOpen={isServerModalOpen}
          onClose={() => setIsServerModalOpen(false)}
          onSaved={() => {
            showToast("Alamat server backend berhasil disimpan!")
            fetchLiveQueue()
          }}
        />
      </section>
    </main>
  )
}
