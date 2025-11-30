// src/pages/SosPage.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  PhoneCall,
  AlertTriangle,
  X,
  MapPin,
  Users,
  Clock,
  Send,
  Loader2,
  SatelliteDish,
  Map,
  Truck,
  BellRing,
  CheckCircle,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Relative = { id: string; name: string; phone: string; notified?: boolean };
type Hospital = { id: string; name: string; distanceKm: number; phone: string; lat: number; lng: number };

type StepStatus = "pending" | "in-progress" | "done" | "failed";
type Step = { id: string; label: string; status: StepStatus };

export default function SosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form fields
  const [patientName, setPatientName] = useState("");
  const [query, setQuery] = useState("");
  const [relatives, setRelatives] = useState<Relative[]>([
    { id: "r1", name: "Parent", phone: "" },
    { id: "r2", name: "Sibling", phone: "" },
  ]);

  // Mock nearby hospitals
  const [hospitals] = useState<Hospital[]>([
    { id: "h1", name: "City General Hospital", distanceKm: 1.8, phone: "+91-80XXXXXXX01", lat: 12.9716, lng: 77.5946 },
    { id: "h2", name: "St. Mary Medical", distanceKm: 3.4, phone: "+91-80XXXXXXX02", lat: 12.9730, lng: 77.5990 },
    { id: "h3", name: "Rapid Response Clinic", distanceKm: 5.2, phone: "+91-80XXXXXXX03", lat: 12.9650, lng: 77.5900 },
  ]);

  // Location & tracking
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [watching, setWatching] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Progress / UI states
  const [sending, setSending] = useState(false);
  const [sendLog, setSendLog] = useState<string[]>([]);
  const [ambulancePos, setAmbulancePos] = useState<{ lat: number; lng: number } | null>(null);
  const [alertSentAt, setAlertSentAt] = useState<string | null>(null);

  // Steps for sequential success UI
  const [steps, setSteps] = useState<Step[]>([]);
  const [showProgressPanel, setShowProgressPanel] = useState(false);
  const [finalSuccess, setFinalSuccess] = useState(false);

  // Open/close modal
  const openSOSModal = () => setIsModalOpen(true);
  const closeSOSModal = () => setIsModalOpen(false);

  // Start geolocation watch (demo-friendly)
  const startLocationWatch = () => {
    if (!("geolocation" in navigator)) {
      setSendLog((s) => [...s, "Geolocation not available in this browser."]);
      toast.error("Geolocation not available in this browser.");
      return;
    }
    if (watchIdRef.current) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition({ lat, lng });
        // demo: set ambulance initial pos a bit away
        if (!ambulancePos) setAmbulancePos({ lat: lat + 0.005, lng: lng - 0.005 });
        setSendLog((s) => [...s, `Position update: ${lat.toFixed(5)}, ${lng.toFixed(5)}`]);
      },
      (err) => {
        setSendLog((s) => [...s, `Location error: ${err.message}`]);
        toast.error(`Location error: ${err.message}`);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
    watchIdRef.current = id as unknown as number;
    setWatching(true);
  };

  const stopLocationWatch = () => {
    if (watchIdRef.current && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setWatching(false);
  };

  useEffect(() => {
    return () => {
      // cleanup
      stopLocationWatch();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simulate ambulance moving toward current position (demo)
  useEffect(() => {
    if (!ambulancePos || !position) return;
    const id = setInterval(() => {
      setAmbulancePos((a) => {
        if (!a) return null;
        // simple linear step toward target
        const lat = a.lat + (position.lat - a.lat) * 0.12;
        const lng = a.lng + (position.lng - a.lng) * 0.12;
        return { lat, lng };
      });
    }, 1200);
    return () => clearInterval(id);
  }, [ambulancePos, position]);

  // Utility: update relative
  const updateRelative = (id: string, key: keyof Relative, value: string) => {
    // force numeric-only phone and cap to 10 digits
    if (key === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      value = digits;
    }
    setRelatives((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };

  // Remove relative
  const removeRelative = (id: string) => setRelatives((rs) => rs.filter((r) => r.id !== id));

  // Add relative
  const addRelative = () => setRelatives((rs) => [...rs, { id: `r${Date.now()}`, name: "New contact", phone: "" }]);

  // Form validation helpers
  const isTenDigits = (s: string) => /^\d{10}$/.test(s);
  const validateForm = () => {
    if (!patientName.trim()) {
      toast.error("Enter patient name");
      return false;
    }
    if (!query.trim()) {
      toast.error("Describe the emergency briefly");
      return false;
    }
    // at least one valid contact
    const valid = relatives.some((r) => r.name.trim() && isTenDigits(r.phone));
    if (!valid) {
      toast.error("Add at least one contact with a 10-digit phone number");
      return false;
    }
    // highlight invalid phones in log
    const invalid = relatives.filter((r) => r.phone && !isTenDigits(r.phone));
    if (invalid.length) {
      setSendLog((s) => [...s, `Invalid phone for: ${invalid.map((i) => i.name).join(", ")}`]);
      toast.error("Please fix invalid phone numbers (must be 10 digits)");
      return false;
    }
    return true;
  };

  // prepare steps — compute lengths at time of trigger
  const prepareSteps = () => {
    const base: Step[] = [
      { id: "s-verify", label: "Verifying inputs", status: "pending" },
      { id: "s-relatives", label: `Notifying relatives (${relatives.length})`, status: "pending" },
      { id: "s-hospitals", label: `Contacting hospitals (${hospitals.length})`, status: "pending" },
      { id: "s-ambulance", label: "Calling nearest ambulance", status: "pending" },
      { id: "s-location", label: "Sending live location", status: "pending" },
      { id: "s-complete", label: "Complete", status: "pending" },
    ];
    setSteps(base);
    setFinalSuccess(false);
  };

  // helper to update a step status (toasts removed to reduce noise)
  const setStepStatus = (id: string, status: StepStatus) => {
    setSteps((s) => s.map((st) => (st.id === id ? { ...st, status } : st)));
  };

  // Mock send function (simulate network calls to relatives & hospitals) with sequential step UI
  const triggerSOS = async () => {
    if (!validateForm()) return;

    setSending(true);
    setSendLog([]);
    setAlertSentAt(null);

    // prepare the steps and show the external progress panel
    prepareSteps();
    setIsModalOpen(false);
    setShowProgressPanel(true);

    // compact starting toast
    toast.info("SOS started — sending alerts...");

    startLocationWatch();

    // step 1: verify
    setStepStatus("s-verify", "in-progress");
    setSendLog((s) => [...s, `Preparing alert for ${patientName}…`]);
    await new Promise((r) => setTimeout(r, 700));
    setStepStatus("s-verify", "done");

    // step 2: relatives sequential (visualize each relative notification)
    setStepStatus("s-relatives", "in-progress");
    for (const r of relatives) {
      if (!r.name.trim() || !r.phone) continue;
      setSendLog((s) => [...s, `Notifying ${r.name} (+91-${r.phone})...`]);
      await new Promise((res) => setTimeout(res, 600));
      setRelatives((rs) => rs.map((rel) => (rel.id === r.id ? { ...rel, notified: true } : rel)));
      setSendLog((s) => [...s, `Sent to ${r.name}`]);
    }
    setStepStatus("s-relatives", "done");

    // step 3: hospitals (parallel-ish but we'll show sequential ticks)
    setStepStatus("s-hospitals", "in-progress");
    setSendLog((s) => [...s, "Contacting nearby hospitals..."]);
    for (const h of hospitals) {
      await new Promise((res) => setTimeout(res, 450 + Math.random() * 700));
      setSendLog((s) => [...s, `Hospital accepted: ${h.name} (${h.distanceKm} km)`]);
    }
    setStepStatus("s-hospitals", "done");

    // step 4: ambulance
    setStepStatus("s-ambulance", "in-progress");
    setSendLog((s) => [...s, "Calling nearest ambulance..."]);
    // emulate ambulance acceptance and movement
    await new Promise((res) => setTimeout(res, 900));
    setSendLog((s) => [...s, "Ambulance en route"]);
    setStepStatus("s-ambulance", "done");

    // step 5: send live location
    setStepStatus("s-location", "in-progress");
    setSendLog((s) => [...s, "Sending live location to contacts and hospitals..."]);
    setAlertSentAt(new Date().toISOString());
    await new Promise((res) => setTimeout(res, 600));
    setSendLog((s) => [...s, "Live location delivered to recipients."]);
    setStepStatus("s-location", "done");

    // final
    setStepStatus("s-complete", "done");
    setSendLog((s) => [...s, "All notifications dispatched."]);

    // compact final toast listing recipients (only one final toast)
    const recipientNames = relatives.filter((r) => r.notified).map((r) => r.name).join(", ");
    toast.success(`SOS completed — live location sent to: ${recipientNames}`);

    // show final success inside the progress panel
    setFinalSuccess(true);
    setSending(false);
  };

  // additional small features: copy location, resend alerts
  const copyLocation = () => {
    if (!position) return toast.error("No location to copy");
    navigator.clipboard.writeText(`${position.lat},${position.lng}`).then(() => {
      toast.success("Location copied to clipboard");
    });
  };

  const resendAlerts = async () => {
    // quick resend simulation: will re-run the last two steps
    if (!finalSuccess) return toast.info("No completed SOS to resend");
    toast.info("Resending alerts to contacts...");
    setSendLog((s) => [...s, "User requested resend of alerts..."]);
    setStepStatus("s-location", "in-progress");
    await new Promise((r) => setTimeout(r, 600));
    setSendLog((s) => [...s, "Resend: Live location delivered again."]);
    setStepStatus("s-location", "done");
    toast.success("Resent live location to contacts");
  };

  // helpers
  function formatPhone(s: string) {
    if (!s) return "";
    return `+91-${s}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <ToastContainer position="top-right" />
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <PhoneCall className="w-6 h-6 text-red-600" />
            <h1 className="text-xl font-semibold text-gray-900">Emergency SOS</h1>
          </div>
          <span className="text-xs text-gray-500">Use only for real emergencies</span>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Prepare and trigger a fast emergency protocol — notifies contacts and nearest hospitals with live location.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-gray-700">Patient name</label>
            <input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
              placeholder="e.g., Ravi Kumar"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Emergency summary / query</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
              placeholder="Short description (breathing issue, trauma, etc.)"
            />
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Relatives / Contacts</p>
            <button
              onClick={addRelative}
              className="text-xs px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200"
              aria-label="Add relative"
            >
              + Add
            </button>
          </div>

          <div className="mt-2 space-y-2">
            {relatives.map((r) => (
              <div key={r.id} className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                <input
                  value={r.name}
                  onChange={(e) => updateRelative(r.id, "name", e.target.value)}
                  className="rounded-md border px-2 py-1 text-sm w-36"
                  placeholder="Name"
                />
                <input
                  value={r.phone}
                  onChange={(e) => updateRelative(r.id, "phone", e.target.value)}
                  className={`rounded-md border px-2 py-1 text-sm w-40 ${r.phone && !isTenDigits(r.phone) ? "border-red-500" : ""}`}
                  placeholder="10-digit phone"
                  inputMode="numeric"
                />
                <button
                  onClick={() => removeRelative(r.id)}
                  className="ml-auto text-xs px-2 py-1 rounded-md hover:bg-gray-100"
                  aria-label="Remove"
                >
                  Remove
                </button>
                <span className="text-xs text-green-600 ml-2">{r.notified ? "Notified" : ""}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              openSOSModal();
              // ensure location watch starts immediately when modal opens for realism
              startLocationWatch();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold shadow-md hover:bg-red-700 transition"
          >
            <PhoneCall className="w-4 h-4" />
            Trigger SOS
          </button>

          <button
            onClick={() => {
              // snapshot: open maps if position present
              if (position) window.open(`https://www.google.com/maps?q=${position.lat},${position.lng}`, "_blank");
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm"
          >
            <Map className="w-4 h-4" />
            Open Map
          </button>

          <div className="ml-auto text-xs text-gray-500 flex items-center gap-3">
            <div className="relative w-8 h-8">
              {/* live pulse */}
              <span className="absolute inset-0 rounded-full bg-red-300/40 animate-ping" />
              <span className="absolute inset-1 rounded-full bg-red-300/25 animate-ping delay-75" />
              <div className="absolute inset-2 rounded-full bg-red-600" />
            </div>

            <SatelliteDish className="w-4 h-4" />
            Live location:{" "}
            <span className="font-medium text-gray-700">
              {position ? `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}` : "not available"}
            </span>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-red-100 relative overflow-hidden">
              {/* header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h2 className="text-sm font-semibold text-red-700">Confirm Emergency SOS</h2>
                </div>
                <button onClick={closeSOSModal} className="p-1 rounded-full hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* body */}
              <div className="px-5 py-4 space-y-3 text-sm text-gray-700">
                <p className="font-medium">Are you sure you want to activate SOS protocol for this patient?</p>
                <p className="text-xs text-gray-500">
                  This will notify emergency services and designated contacts with the patient’s location and summary.
                </p>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 flex flex-col">
                    <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500" />
                      Location snapshot
                    </p>
                    <p className="text-xs text-gray-600">Approximate GPS and address will be attached for responders.</p>
                    <div className="mt-2 text-xs text-gray-700 flex items-center gap-3">
                      <div className="relative w-10 h-10">
                        <span className="absolute inset-0 rounded-full bg-red-300/40 animate-ping" />
                        <span className="absolute inset-1 rounded-full bg-red-300/25 animate-ping delay-75" />
                        <div className="absolute inset-2 rounded-full bg-red-600" />
                      </div>
                      <div>
                        {position ? (
                          <a
                            href={`https://www.google.com/maps?q=${position.lat},${position.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                          >
                            View on map
                          </a>
                        ) : (
                          <span className="text-gray-500">Awaiting location…</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-500" />
                      Emergency contacts
                    </p>
                    <p className="text-xs text-gray-600">Primary and secondary contacts will receive an alert message.</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-500" />
                      Response timeline
                    </p>
                    <p className="text-xs text-gray-600">Time of activation is recorded for the clinical record.</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <Truck className="w-3 h-3 text-indigo-600" />
                      Ambulance tracking
                    </p>
                    <p className="text-xs text-gray-600">Simulated tracking will start and show ETA in the UI.</p>
                  </div>
                </div>

                {/* send log */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div>Activity log</div>
                    <div className="text-xs">{alertSentAt ? new Date(alertSentAt).toLocaleString() : ""}</div>
                  </div>
                  <div className="mt-2 h-36 overflow-auto rounded-md border p-2 bg-gray-50 text-xs">
                    {sendLog.length === 0 ? <div className="text-gray-400">No activity yet</div> : null}
                    {sendLog.map((l, i) => (
                      <div key={i} className="py-0.5">
                        • {l}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* footer */}
              <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 items-center">
                <div className="flex items-center gap-3 mr-auto text-xs">
                  <div className="flex items-center gap-1">
                    <Loader2 className={`w-4 h-4 ${sending ? "animate-spin text-red-600" : "text-gray-300"}`} />
                    <span>{sending ? "Sending alerts..." : "Idle"}</span>
                  </div>
                  <div className="text-gray-500">Location: {position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : "—"}</div>
                </div>

                <button
                  onClick={() => {
                    // cancel: stop tracking but keep modal
                    stopLocationWatch();
                    setSendLog((s) => [...s, "User cancelled location watch."]);
                    toast.info("Location watch stopped");
                  }}
                  className="px-3 py-2 text-xs font-medium text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  Stop Live
                </button>

                <button
                  onClick={() => {
                    triggerSOS();
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Confirm SOS
                </button>

                <button onClick={closeSOSModal} className="px-3 py-2 text-xs rounded-lg hover:bg-gray-100">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* External progress panel (shows sequential steps and final success outside modal) */}
        {showProgressPanel && (
          <div className="fixed right-6 bottom-6 w-96 bg-white rounded-lg shadow-lg border p-4 z-50">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <div className="text-sm font-semibold">SOS Progress</div>
                  <div className="text-xs text-gray-500">Live updates are shown here</div>
                </div>
              </div>
              <div>
                <button
                  onClick={() => setShowProgressPanel(false)}
                  className="text-xs px-2 py-1 rounded hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {steps.map((st) => (
                <div key={st.id} className="flex items-center justify-between bg-gray-50 border rounded-md px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4">
                      {st.status === "done" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : st.status === "in-progress" ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                    </div>
                    <div className="text-xs">{st.label}</div>
                  </div>
                  <div className="text-xs text-gray-500">{st.status === "done" ? "Done" : st.status === "in-progress" ? "In progress" : "Pending"}</div>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <div className="text-xs font-semibold">Activity log</div>
              <div className="mt-2 h-32 overflow-auto rounded-md border p-2 bg-gray-50 text-xs">
                {sendLog.length === 0 ? <div className="text-gray-400">No activity yet</div> : null}
                {sendLog.map((l, i) => (
                  <div key={i} className="py-0.5">
                    • {l}
                  </div>
                ))}
              </div>
            </div>

            {/* final success block + small actions */}
            {finalSuccess && (
              <div className="mt-3 border-t pt-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <div className="text-sm font-semibold">Alerts sent</div>
                    <div className="text-xs text-gray-600">{`Patient: ${patientName || "—"}`}</div>
                    <div className="text-xs text-gray-600">{`Recipients: ${relatives.map((r) => r.name).join(", ")}`}</div>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <button onClick={copyLocation} className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Copy location</button>
                  <button onClick={resendAlerts} className="text-xs px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Resend alerts</button>
                  <a
                    href={position ? `https://www.google.com/maps?q=${position.lat},${position.lng}` : "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-3 py-1 rounded bg-green-50 text-green-700 underline"
                  >
                    View on map
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// small helpers (kept outside component for readability)
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  // Haversine (approx)
  const R = 6371;
  const dLat = deg2rad(b.lat - a.lat);
  const dLon = deg2rad(b.lng - a.lng);
  const la1 = deg2rad(a.lat);
  const la2 = deg2rad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(la1) * Math.cos(la2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}
function deg2rad(d: number) {
  return (d * Math.PI) / 180;
}
function progressPercent(current: { lat: number; lng: number }, target: { lat: number; lng: number }) {
  // simple mapping for demo: when distance <=0.05km -> 100%
  const d = distanceKm(current, target);
  const percent = Math.min(100, Math.round(((5 - Math.min(5, d)) / 5) * 100));
  return percent;
}
