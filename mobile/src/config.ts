// Configuration for API endpoint
// When running in Capacitor on Android emulator: 10.0.2.2 points to host Mac
// When running on physical Android device connected via USB: use host Mac's Wi-Fi IP or adb reverse (localhost)
const DEFAULT_API_URL = 
  typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
    ? `${window.location.protocol}//${window.location.host}`
    : "http://10.0.2.2:8000"

export const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    // Allow user or debug override via localStorage
    const saved = localStorage.getItem("wansha_api_base_url")
    if (saved) return saved

    // If running in browser or PWA
    if (window.location.port === "8000" || window.location.port === "8443") {
      return `${window.location.protocol}//${window.location.host}`
    }

    // If host is an actual LAN IP
    if (window.location.hostname.startsWith("192.168.") || window.location.hostname.startsWith("10.")) {
      return `http://${window.location.hostname}:8000`
    }
  }

  // Fallback for Android (adb reverse allows localhost:8000, emulator uses 10.0.2.2:8000, local LAN uses 192.168.1.14:8000)
  return "http://192.168.1.14:8000"
}

export const setCustomApiUrl = (url: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("wansha_api_base_url", url.trim())
  }
}
