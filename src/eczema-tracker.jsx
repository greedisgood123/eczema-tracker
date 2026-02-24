import { useState, useEffect, useCallback } from "react";

const PROTOCOL_EXPECTATIONS = [
  { day: 1, phase: "Week 1: Eliminate + Reset", expected: "Starting elimination diet. Body adjusting. No change expected yet." },
  { day: 2, phase: "Week 1: Eliminate + Reset", expected: "Possible sugar/gluten withdrawal — mild headache, cravings. Skin unchanged." },
  { day: 3, phase: "Week 1: Eliminate + Reset", expected: "Gut beginning to rest during fasting hours. Cravings may peak today." },
  { day: 4, phase: "Week 1: Eliminate + Reset", expected: "Withdrawal symptoms easing. Gut flora starting to shift. Some may feel lighter." },
  { day: 5, phase: "Week 1: Eliminate + Reset", expected: "Possible die-off reaction — skin may temporarily worsen. This is normal." },
  { day: 6, phase: "Week 1: Eliminate + Reset", expected: "Energy stabilizing. Gut inflammation reducing. Skin may still be reactive." },
  { day: 7, phase: "Week 1: Eliminate + Reset", expected: "End of Week 1. Cravings significantly reduced. Some may notice less itching." },
  { day: 8, phase: "Week 2: Deepen Healing", expected: "Gut bacteria diversity increasing from fasting + probiotics. Skin calming." },
  { day: 9, phase: "Week 2: Deepen Healing", expected: "Inflammation markers dropping. Existing patches may look less red." },
  { day: 10, phase: "Week 2: Deepen Healing", expected: "Noticeable reduction in itching for most people. Sleep improving." },
  { day: 11, phase: "Week 2: Deepen Healing", expected: "Gut lining repair accelerating. Skin texture may start improving." },
  { day: 12, phase: "Week 2: Deepen Healing", expected: "Patches may be visibly smaller or lighter. Less flaking." },
  { day: 13, phase: "Week 2: Deepen Healing", expected: "Significant improvement expected if food was a major trigger." },
  { day: 14, phase: "Week 2: Deepen Healing", expected: "Protocol complete. Baseline established. Ready for reintroduction phase." },
];

const BODY_AREAS = ["Face/Neck", "Arms/Hands", "Legs/Feet", "Torso/Back"];

const SYMPTOM_OPTIONS = [
  "Itching", "Redness", "Dry/Flaky", "Cracking", "Oozing",
  "Swelling", "New patches", "Sleep disruption", "Headache", "Bloating"
];

const DIET_CHECKLIST = [
  { id: "no_dairy", label: "No dairy" },
  { id: "no_gluten", label: "No gluten" },
  { id: "no_sugar", label: "No added sugar" },
  { id: "no_eggs", label: "No eggs" },
  { id: "no_soy", label: "No soy" },
  { id: "no_nightshades", label: "No nightshades" },
  { id: "no_processed", label: "No processed food" },
  { id: "probiotic", label: "Took probiotic" },
  { id: "raw_garlic", label: "Ate raw garlic" },
  { id: "pumpkin_seeds", label: "Ate pumpkin seeds" },
  { id: "papaya_seeds", label: "Ate papaya seeds" },
  { id: "acv", label: "Drank ACV" },
  { id: "turmeric", label: "Turmeric drink" },
  { id: "coconut_oil", label: "Applied coconut oil" },
  { id: "water", label: "Drank 1.5L+ water" },
];

async function loadDay(day) {
  try {
    const res = await fetch(`/api/day/${day}`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function saveDay(day, data) {
  try {
    await fetch(`/api/day/${day}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {}
}

async function saveStartDate(d) {
  try {
    await fetch("/api/start-date", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: d }),
    });
  } catch {}
}

const emptyEntry = () => ({
  itchLevel: 5,
  overallFeeling: 5,
  symptoms: [],
  bodyAreas: {},
  dietChecklist: {},
  suhoorMeal: "",
  iftarMeal: "",
  notes: "",
  photos: [],
  timestamp: null,
});

export default function EczemaTracker() {
  const [startDate, setStartDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allDays, setAllDays] = useState({});
  const [currentDay, setCurrentDay] = useState(1);
  const [entry, setEntry] = useState(emptyEntry());
  const [view, setView] = useState("log"); // log | timeline | today
  const [saved, setSaved] = useState(false);
  const [tempStartDate, setTempStartDate] = useState("");

  const getDayFromDate = useCallback((sd) => {
    if (!sd) return 1;
    const start = new Date(sd);
    const now = new Date();
    start.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    const diff = Math.floor((now - start) / 86400000) + 1;
    return Math.max(1, Math.min(14, diff));
  }, []);

  // Effect 1: load all data from server on mount
  useEffect(() => {
    fetch("/api/data")
      .then(r => r.json())
      .then(data => {
        setStartDate(data.startDate);
        setAllDays(data.days || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Effect 2: when startDate is set, jump to today's day and load its entry
  useEffect(() => {
    if (startDate) {
      const d = getDayFromDate(startDate);
      setCurrentDay(d);
      loadDay(d).then(existing => setEntry(existing || emptyEntry()));
    }
  }, [startDate, getDayFromDate]);

  const handleStartProtocol = async () => {
    const d = tempStartDate || new Date().toISOString().split("T")[0];
    await saveStartDate(d);
    setStartDate(d);
  };

  const handleSave = async () => {
    const data = { ...entry, timestamp: new Date().toISOString() };
    await saveDay(currentDay, data);
    setEntry(data);
    setAllDays(prev => ({ ...prev, [String(currentDay)]: data }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectDay = async (d) => {
    setCurrentDay(d);
    const existing = await loadDay(d);
    setEntry(existing || emptyEntry());
    setView("log");
  };

  const handleUploadPhoto = async (file) => {
    const form = new FormData();
    form.append("photo", file);
    const res = await fetch(`/api/day/${currentDay}/photo`, { method: "POST", body: form });
    const { filename } = await res.json();
    setEntry(p => ({ ...p, photos: [...(p.photos || []), filename] }));
    setAllDays(prev => {
      const day = prev[String(currentDay)] || {};
      return { ...prev, [String(currentDay)]: { ...day, photos: [...(day.photos || []), filename] } };
    });
  };

  const handleDeletePhoto = async (filename) => {
    await fetch(`/api/day/${currentDay}/photo/${filename}`, { method: "DELETE" });
    setEntry(p => ({ ...p, photos: (p.photos || []).filter(f => f !== filename) }));
    setAllDays(prev => {
      const day = prev[String(currentDay)] || {};
      return { ...prev, [String(currentDay)]: { ...day, photos: (day.photos || []).filter(f => f !== filename) } };
    });
  };

  const getCompletionCount = () =>
    Object.values(allDays).filter(d => d?.timestamp).length;

  const getDietScore = () => {
    const items = Object.values(entry.dietChecklist);
    if (items.length === 0) return 0;
    return Math.round((items.filter(Boolean).length / DIET_CHECKLIST.length) * 100);
  };

  const protocolInfo = PROTOCOL_EXPECTATIONS[currentDay - 1] || PROTOCOL_EXPECTATIONS[0];
  const todayDay = startDate ? getDayFromDate(startDate) : 1;
  const hoursOnDiet = startDate ? Math.max(0, Math.floor((new Date() - new Date(startDate)) / 3600000)) : 0;
  const daysOnDiet = Math.floor(hoursOnDiet / 24);

  if (loading) return <LoadingScreen />;

  if (!startDate) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0a0f0d 0%, #1a2721 40%, #0d1915 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        padding: "20px",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px",
          padding: "48px 40px",
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🌿</div>
          <h1 style={{
            color: "#e8f0ec", fontSize: "28px", fontWeight: 700,
            margin: "0 0 8px", letterSpacing: "-0.5px",
          }}>Eczema Healing Tracker</h1>
          <p style={{
            color: "#7a9b8a", fontSize: "14px", margin: "0 0 32px",
            lineHeight: 1.6,
          }}>
            14-day Ramadan gut reset protocol.<br/>Track your elimination diet, symptoms, and healing progress.
          </p>
          <label style={{ color: "#7a9b8a", fontSize: "13px", display: "block", marginBottom: "8px", textAlign: "left" }}>
            When did you start (or plan to start)?
          </label>
          <input
            type="date"
            value={tempStartDate}
            onChange={e => setTempStartDate(e.target.value)}
            style={{
              width: "100%", padding: "14px 16px", borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)",
              color: "#e8f0ec", fontSize: "16px", marginBottom: "20px",
              outline: "none", boxSizing: "border-box",
            }}
          />
          <button onClick={handleStartProtocol} style={{
            width: "100%", padding: "16px", borderRadius: "12px",
            background: "linear-gradient(135deg, #2d6a4f, #40916c)",
            color: "#fff", fontSize: "16px", fontWeight: 600,
            border: "none", cursor: "pointer",
            transition: "transform 0.15s",
          }}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
          >
            Start Protocol
          </button>
          <p style={{ color: "#5a7b6a", fontSize: "12px", marginTop: "16px" }}>
            Leave blank to start from today
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0a0f0d 0%, #1a2721 40%, #0d1915 100%)",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#e8f0ec",
      paddingBottom: "100px",
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 20px 0",
        maxWidth: "560px", margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>
              🌿 Day {currentDay} <span style={{ color: "#5a9b72", fontWeight: 400, fontSize: "15px" }}>/ 14</span>
            </h1>
            <p style={{ color: "#5a8b6a", fontSize: "12px", margin: "4px 0 0" }}>
              {hoursOnDiet}h on protocol · {getCompletionCount()} entries logged
            </p>
          </div>
          <div style={{
            background: "rgba(64,145,108,0.15)", borderRadius: "12px",
            padding: "8px 14px", textAlign: "center",
          }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#5adb8a" }}>{getDietScore()}%</div>
            <div style={{ fontSize: "10px", color: "#5a8b6a", textTransform: "uppercase", letterSpacing: "0.5px" }}>compliance</div>
          </div>
        </div>

        {/* Day pills */}
        <div style={{
          display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "12px",
          scrollbarWidth: "none",
        }}>
          {Array.from({ length: 14 }, (_, i) => {
            const d = i + 1;
            const hasEntry = allDays[String(d)]?.timestamp;
            const isToday = d === todayDay;
            const isCurrent = d === currentDay;
            return (
              <button key={d} onClick={() => selectDay(d)} style={{
                minWidth: "36px", height: "36px", borderRadius: "10px",
                border: isCurrent ? "2px solid #5adb8a" : "1px solid rgba(255,255,255,0.08)",
                background: hasEntry ? "rgba(64,145,108,0.25)" : "rgba(255,255,255,0.03)",
                color: isCurrent ? "#5adb8a" : hasEntry ? "#7adb9a" : "#5a7b6a",
                fontSize: "13px", fontWeight: isCurrent ? 700 : 500,
                cursor: "pointer", position: "relative",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {d}
                {isToday && <div style={{
                  position: "absolute", bottom: "-1px", left: "50%", transform: "translateX(-50%)",
                  width: "4px", height: "4px", borderRadius: "50%", background: "#5adb8a",
                }} />}
              </button>
            );
          })}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginTop: "8px", marginBottom: "20px" }}>
          {[
            { id: "log", label: "Journal" },
            { id: "today", label: "Expected" },
            { id: "timeline", label: "Progress" },
          ].map(t => (
            <button key={t.id} onClick={() => setView(t.id)} style={{
              flex: 1, padding: "10px", borderRadius: "10px",
              border: "none", cursor: "pointer",
              background: view === t.id ? "rgba(64,145,108,0.2)" : "rgba(255,255,255,0.03)",
              color: view === t.id ? "#5adb8a" : "#5a7b6a",
              fontSize: "13px", fontWeight: view === t.id ? 600 : 400,
              transition: "all 0.2s",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "0 20px" }}>

        {/* === EXPECTED VIEW === */}
        {view === "today" && (
          <div>
            <div style={{
              background: "rgba(64,145,108,0.08)", border: "1px solid rgba(64,145,108,0.2)",
              borderRadius: "16px", padding: "24px", marginBottom: "16px",
            }}>
              <div style={{ fontSize: "11px", color: "#5a9b72", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
                {protocolInfo.phase}
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px" }}>Day {currentDay} — What to expect</h2>
              <p style={{ color: "#a0c4b0", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
                {protocolInfo.expected}
              </p>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "16px", padding: "24px",
            }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 16px", color: "#b0d4c0" }}>
                Protocol milestones
              </h3>
              {PROTOCOL_EXPECTATIONS.map((p, i) => (
                <div key={i} style={{
                  display: "flex", gap: "12px", marginBottom: "12px",
                  opacity: i + 1 === currentDay ? 1 : i + 1 < currentDay ? 0.5 : 0.35,
                }}>
                  <div style={{
                    minWidth: "28px", height: "28px", borderRadius: "8px",
                    background: i + 1 <= currentDay ? "rgba(64,145,108,0.3)" : "rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "12px", fontWeight: 600,
                    color: i + 1 === currentDay ? "#5adb8a" : "#5a7b6a",
                  }}>{i + 1}</div>
                  <p style={{ fontSize: "12px", color: "#8aab9a", lineHeight: 1.5, margin: 0 }}>
                    {p.expected}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === PROGRESS VIEW === */}
        {view === "timeline" && (
          <div>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px",
            }}>
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "14px", padding: "20px",
              }}>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#5adb8a" }}>{daysOnDiet}</div>
                <div style={{ fontSize: "12px", color: "#5a8b6a" }}>days completed</div>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "14px", padding: "20px",
              }}>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#5adb8a" }}>{hoursOnDiet}h</div>
                <div style={{ fontSize: "12px", color: "#5a8b6a" }}>hours on protocol</div>
              </div>
            </div>

            <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 12px", color: "#b0d4c0" }}>Itch Level Trend</h3>
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "14px", padding: "20px", marginBottom: "20px",
            }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "120px" }}>
                {Array.from({ length: 14 }, (_, i) => {
                  const d = allDays[String(i + 1)];
                  const val = d?.itchLevel ?? 0;
                  const hasData = d?.timestamp;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                      <div style={{
                        width: "100%", borderRadius: "4px 4px 0 0",
                        height: hasData ? `${val * 10}%` : "2px",
                        background: hasData
                          ? val <= 3 ? "#2d6a4f" : val <= 6 ? "#e6a817" : "#c44536"
                          : "rgba(255,255,255,0.05)",
                        minHeight: hasData ? "8px" : "2px",
                        transition: "height 0.3s",
                      }} />
                      <span style={{ fontSize: "9px", color: "#5a7b6a" }}>{i + 1}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                <span style={{ fontSize: "10px", color: "#2d6a4f" }}>Low itch</span>
                <span style={{ fontSize: "10px", color: "#c44536" }}>High itch</span>
              </div>
            </div>

            <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 12px", color: "#b0d4c0" }}>Past Entries</h3>
            {Array.from({ length: 14 }, (_, i) => {
              const d = allDays[String(i + 1)];
              if (!d?.timestamp) return null;
              return (
                <div key={i} onClick={() => selectDay(i + 1)} style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px", padding: "16px", marginBottom: "8px", cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "14px" }}>Day {i + 1}</span>
                      <span style={{ color: "#5a7b6a", fontSize: "12px", marginLeft: "8px" }}>
                        Itch: {d.itchLevel}/10
                      </span>
                    </div>
                    <div style={{
                      display: "flex", gap: "4px",
                    }}>
                      {d.symptoms?.slice(0, 3).map((s, j) => (
                        <span key={j} style={{
                          fontSize: "10px", background: "rgba(255,255,255,0.06)",
                          padding: "2px 8px", borderRadius: "6px", color: "#7a9b8a",
                        }}>{s}</span>
                      ))}
                    </div>
                  </div>
                  {d.notes && <p style={{ fontSize: "12px", color: "#5a8b6a", margin: "8px 0 0", lineHeight: 1.5 }}>{d.notes.slice(0, 80)}{d.notes.length > 80 ? "..." : ""}</p>}
                  {d.photos?.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
                      {d.photos.slice(0, 3).map(f => (
                        <img key={f} src={`/photos/${f}`} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />
                      ))}
                      {d.photos.length > 3 && (
                        <div style={{
                          width: 40, height: 40, borderRadius: 6,
                          background: "rgba(255,255,255,0.06)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "11px", color: "#5a7b6a",
                        }}>
                          +{d.photos.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* === LOG VIEW === */}
        {view === "log" && (
          <div>
            {/* Expected for today - compact */}
            <div style={{
              background: "rgba(64,145,108,0.06)", border: "1px solid rgba(64,145,108,0.15)",
              borderRadius: "12px", padding: "14px 16px", marginBottom: "20px",
            }}>
              <div style={{ fontSize: "10px", color: "#5a9b72", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>
                Day {currentDay} expectation
              </div>
              <p style={{ fontSize: "13px", color: "#a0c4b0", margin: 0, lineHeight: 1.5 }}>
                {protocolInfo.expected}
              </p>
            </div>

            {/* Itch Level */}
            <Section title="Itch Level">
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <input type="range" min={1} max={10} value={entry.itchLevel}
                  onChange={e => setEntry(p => ({ ...p, itchLevel: +e.target.value }))}
                  style={{ flex: 1, accentColor: "#40916c" }}
                />
                <div style={{
                  minWidth: "48px", height: "48px", borderRadius: "12px",
                  background: entry.itchLevel <= 3 ? "rgba(45,106,79,0.3)" : entry.itchLevel <= 6 ? "rgba(230,168,23,0.2)" : "rgba(196,69,54,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "20px", fontWeight: 700,
                  color: entry.itchLevel <= 3 ? "#5adb8a" : entry.itchLevel <= 6 ? "#e6a817" : "#c44536",
                }}>{entry.itchLevel}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#5a7b6a", marginTop: "4px" }}>
                <span>Barely noticeable</span><span>Unbearable</span>
              </div>
            </Section>

            {/* Overall feeling */}
            <Section title="Overall Feeling">
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <input type="range" min={1} max={10} value={entry.overallFeeling}
                  onChange={e => setEntry(p => ({ ...p, overallFeeling: +e.target.value }))}
                  style={{ flex: 1, accentColor: "#40916c" }}
                />
                <div style={{
                  minWidth: "48px", height: "48px", borderRadius: "12px",
                  background: "rgba(64,145,108,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "20px", fontWeight: 700, color: "#5adb8a",
                }}>{entry.overallFeeling}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#5a7b6a", marginTop: "4px" }}>
                <span>Terrible</span><span>Amazing</span>
              </div>
            </Section>

            {/* Symptoms */}
            <Section title="Current Symptoms">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {SYMPTOM_OPTIONS.map(s => {
                  const active = entry.symptoms.includes(s);
                  return (
                    <button key={s} onClick={() => {
                      setEntry(p => ({
                        ...p,
                        symptoms: active ? p.symptoms.filter(x => x !== s) : [...p.symptoms, s],
                      }));
                    }} style={{
                      padding: "8px 14px", borderRadius: "10px",
                      border: active ? "1px solid #40916c" : "1px solid rgba(255,255,255,0.08)",
                      background: active ? "rgba(64,145,108,0.2)" : "rgba(255,255,255,0.03)",
                      color: active ? "#5adb8a" : "#7a9b8a",
                      fontSize: "12px", cursor: "pointer",
                      transition: "all 0.15s",
                    }}>{s}</button>
                  );
                })}
              </div>
            </Section>

            {/* Body areas */}
            <Section title="Affected Areas (severity 1-10)">
              {BODY_AREAS.map(area => (
                <div key={area} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "13px", color: "#8aab9a", minWidth: "100px" }}>{area}</span>
                  <input type="range" min={0} max={10}
                    value={entry.bodyAreas[area] || 0}
                    onChange={e => setEntry(p => ({
                      ...p, bodyAreas: { ...p.bodyAreas, [area]: +e.target.value }
                    }))}
                    style={{ flex: 1, accentColor: "#40916c" }}
                  />
                  <span style={{
                    fontSize: "13px", fontWeight: 600, minWidth: "24px", textAlign: "center",
                    color: (entry.bodyAreas[area] || 0) <= 3 ? "#5adb8a" : (entry.bodyAreas[area] || 0) <= 6 ? "#e6a817" : "#c44536",
                  }}>{entry.bodyAreas[area] || 0}</span>
                </div>
              ))}
            </Section>

            {/* Diet checklist */}
            <Section title="Diet & Protocol Checklist">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                {DIET_CHECKLIST.map(item => {
                  const checked = entry.dietChecklist[item.id] || false;
                  return (
                    <button key={item.id} onClick={() => {
                      setEntry(p => ({
                        ...p, dietChecklist: { ...p.dietChecklist, [item.id]: !checked }
                      }));
                    }} style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "10px 12px", borderRadius: "10px",
                      border: checked ? "1px solid rgba(64,145,108,0.3)" : "1px solid rgba(255,255,255,0.06)",
                      background: checked ? "rgba(64,145,108,0.1)" : "rgba(255,255,255,0.02)",
                      cursor: "pointer", textAlign: "left",
                    }}>
                      <div style={{
                        width: "18px", height: "18px", borderRadius: "5px",
                        border: checked ? "none" : "1.5px solid rgba(255,255,255,0.15)",
                        background: checked ? "#40916c" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "11px", color: "#fff", flexShrink: 0,
                      }}>{checked ? "✓" : ""}</div>
                      <span style={{
                        fontSize: "11px",
                        color: checked ? "#a0d4b0" : "#6a8b7a",
                      }}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Meals */}
            <Section title="Suhoor Meal">
              <textarea
                value={entry.suhoorMeal}
                onChange={e => setEntry(p => ({ ...p, suhoorMeal: e.target.value }))}
                placeholder="What did you eat at suhoor?"
                rows={2}
                style={textareaStyle}
              />
            </Section>

            <Section title="Iftar Meal">
              <textarea
                value={entry.iftarMeal}
                onChange={e => setEntry(p => ({ ...p, iftarMeal: e.target.value }))}
                placeholder="What did you eat at iftar?"
                rows={2}
                style={textareaStyle}
              />
            </Section>

            {/* Notes */}
            <Section title="Notes">
              <textarea
                value={entry.notes}
                onChange={e => setEntry(p => ({ ...p, notes: e.target.value }))}
                placeholder="How are you feeling? Any observations about your skin, energy, mood..."
                rows={3}
                style={textareaStyle}
              />
            </Section>

            {/* Photos */}
            <Section title="Photos">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                {(entry.photos || []).map(f => (
                  <div key={f} style={{ position: "relative" }}>
                    <img
                      src={`/photos/${f}`}
                      style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, display: "block" }}
                    />
                    <button
                      onClick={() => handleDeletePhoto(f)}
                      style={{
                        position: "absolute", top: "4px", right: "4px",
                        width: "22px", height: "22px", borderRadius: "50%",
                        background: "rgba(0,0,0,0.6)", border: "none",
                        color: "#fff", fontSize: "13px", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        lineHeight: 1, padding: 0,
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
              <input
                type="file"
                accept="image/*"
                id="photo-upload-input"
                style={{ display: "none" }}
                onChange={e => {
                  if (e.target.files[0]) {
                    handleUploadPhoto(e.target.files[0]);
                    e.target.value = "";
                  }
                }}
              />
              <button
                onClick={() => document.getElementById("photo-upload-input").click()}
                style={{
                  padding: "10px 16px", borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#7a9b8a", fontSize: "13px", cursor: "pointer",
                }}
              >+ Add Photo</button>
            </Section>

            {/* Save button */}
            <button onClick={handleSave} style={{
              width: "100%", padding: "18px", borderRadius: "14px",
              background: saved ? "rgba(45,106,79,0.4)" : "linear-gradient(135deg, #2d6a4f, #40916c)",
              color: "#fff", fontSize: "16px", fontWeight: 600,
              border: "none", cursor: "pointer",
              marginTop: "8px", marginBottom: "20px",
              transition: "all 0.2s",
            }}
            onMouseDown={e => e.currentTarget.style.transform = "scale(0.98)"}
            onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            >
              {saved ? "✓ Saved" : `Save Day ${currentDay} Entry`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0a0f0d 0%, #1a2721 40%, #0d1915 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      <div style={{ color: "#5a9b72", fontSize: "14px" }}>Loading...</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "14px", padding: "20px",
      marginBottom: "12px",
    }}>
      <h3 style={{
        fontSize: "13px", fontWeight: 600, color: "#7a9b8a",
        textTransform: "uppercase", letterSpacing: "0.5px",
        margin: "0 0 14px",
      }}>{title}</h3>
      {children}
    </div>
  );
}

const textareaStyle = {
  width: "100%", padding: "12px 14px", borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  color: "#e8f0ec", fontSize: "14px", lineHeight: 1.6,
  resize: "vertical", outline: "none",
  fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  boxSizing: "border-box",
};
