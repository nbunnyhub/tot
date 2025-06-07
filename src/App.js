import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, set, remove, onValue, off } from "firebase/database";

// Admin password
const ADMIN_PASSWORD = "777888";

const SACRIFICES = [
  { key: "coward", name: "Coward's Sacrifice", burn: 3, success: 10, partial: 30, fail: 60, icon: "🐇" },
  { key: "tiny", name: "Tiny Sacrifice", burn: 5, success: 25, partial: 45, fail: 30, icon: "🕯️" },
  { key: "high", name: "High Sacrifice", burn: 7, success: 50, partial: 35, fail: 15, icon: "🔥" },
  { key: "full", name: "Full Sacrifice", burn: 9, success: 75, partial: 20, fail: 5, icon: "💎" },
  { key: "absolute", name: "Absolute Sacrifice", burn: 12, success: 95, partial: 4, fail: 1, icon: "👑" }
];

const MOTIVATION = {
  success: [
    "The ritual was a wild success! You claimed your dream reward. 🥂",
    "Night Bunny bows to your will! Power is yours tonight.",
    "A flawless ascension—bask in your glory, chosen one!"
  ],
  partial: [
    "Not quite perfect, but you earned two rewards. Fate’s a tease!",
    "Partial success! Night Bunny admires your courage.",
    "Halfway to greatness—keep risking, keep rising."
  ],
  fail: [
    "The ritual fizzled... Try again, luck may smile next time.",
    "Night Bunny sighs—a failed sacrifice. Destiny’s cruel!",
    "No reward this time. Sometimes the night bites back."
  ]
};

function getVipBonus(vipStr) {
  const vip = Number(vipStr);
  if (vip === 4) return 1;
  if (vip === 5) return 2;
  if (vip === 6) return 3;
  if (vip === 7) return 4;
  if (vip === 8) return 5;
  if (vip === 9) return 7;
  return 0;
}

// Firebase Sync
const RITUAL_PATH = "activeRitual";
function setRitual(data) {
  return set(ref(db, RITUAL_PATH), data);
}
function clearRitual() {
  return remove(ref(db, RITUAL_PATH));
}
function useRitualSync() {
  const [ritual, setRitualState] = useState(null);
  useEffect(() => {
    const ritualRef = ref(db, RITUAL_PATH);
    const unsub = onValue(ritualRef, (snapshot) => {
      setRitualState(snapshot.exists() ? snapshot.val() : null);
    });
    return () => off(ritualRef, "value", unsub);
  }, []);
  return [ritual, setRitualState];
}

// === USER SCREEN ===
function UserScreen() {
  const [ritual, ] = useRitualSync();
  const [step, setStep] = useState("input"); // input, bonus, waitNbConfirm, ritual, waiting, result
  const [name, setName] = useState("");
  const [vip, setVip] = useState("");
  const [inputError, setInputError] = useState("");
  const [legendaryInput, setLegendaryInput] = useState("");
  const [epicInput, setEpicInput] = useState("");
  const [bonusError, setBonusError] = useState("");
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!ritual) {
      setStep("input");
      setResult(null);
      return;
    }
    if (ritual.status === "waitingNb" && step !== "waitNbConfirm") setStep("waitNbConfirm");
    if (ritual.status === "nbconfirmed" && step !== "ritual") setStep("ritual");
    if (ritual.status === "waiting" && step !== "waiting") setStep("waiting");
    if (ritual.status === "result" && step !== "result") {
      setResult(ritual.result);
      setStep("result");
    }
  }, [ritual]);

  const handleConfirmInput = () => {
    if (!name || !vip) {
      setInputError("Please enter your player name and VIP level.");
      return;
    }
    if (name.length > 10) {
      setInputError("Player name must be at most 10 characters!");
      return;
    }
    if (!/^[1-9]$/.test(vip)) {
      setInputError("Please enter VIP level as a single digit (1-9)!");
      return;
    }
    setInputError("");
    setStep("bonus");
  };

  const handleConfirmBonus = () => {
    if (!["Y", "N"].includes(legendaryInput) || !["Y", "N"].includes(epicInput)) {
      setBonusError("Please answer both questions with only Y or N.");
      return;
    }
    setBonusError("");
    setRitual({
      status: "waitingNb",
      player: { name, vip, legendaryInput, epicInput }
    });
    setStep("waitNbConfirm");
  };

  const startRitual = () => {
    if (!selected) return;
    setRitual({
      status: "waiting",
      player: ritual.player,
      sacrifice: selected.key,
      ts: Date.now(),
      legendaryInput: ritual.player.legendaryInput,
      epicInput: ritual.player.epicInput
    });
    setStep("waiting");
  };

  const resetAll = () => {
    clearRitual();
    setStep("input");
    setName("");
    setVip("");
    setSelected(null);
    setResult(null);
    setInputError("");
    setLegendaryInput("");
    setEpicInput("");
    setBonusError("");
  };

  let bonusLegendary = false, bonusEpic = false, vipBonus = 0;
  let currentVip = vip, infoLines = [];
  if (ritual && ritual.player) {
    bonusLegendary = ritual.player.legendaryInput === "Y";
    bonusEpic = ritual.player.epicInput === "Y";
    currentVip = ritual.player.vip;
    vipBonus = getVipBonus(currentVip);
  }
  let totalBonus = 0;
  if (bonusLegendary) {
    totalBonus += 2;
    infoLines.push("At least 3 legendary photos will be burned: +2% extra chance.");
  }
  if (bonusEpic) {
    totalBonus += 1;
    infoLines.push("At least 4 epic photos will be burned: +1% extra chance.");
  }
  if (vipBonus > 0) {
    totalBonus += vipBonus;
    infoLines.push(`VIP bonus: +${vipBonus}% extra chance.`);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f8bbd0 0%, #ede7f6 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        padding: 24,
        borderRadius: 24,
        boxShadow: "0 4px 32px #2222",
        background: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <h1 style={{
          fontSize: 32,
          fontWeight: "bold",
          marginBottom: 24,
          textAlign: "center",
          color: "#C026D3"
        }}>Upgrade Ritual</h1>

        {/* INPUT SCREEN */}
        {step === "input" && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <input
              type="text"
              placeholder="Player Name"
              value={name}
              maxLength={10}
              onChange={e => {
                setName(e.target.value);
                setInputError("");
              }}
              style={{
                width: "100%",
                maxWidth: 320,
                padding: "12px",
                fontSize: 16,
                borderRadius: 8,
                border: "1px solid #C026D3"
              }}
            />
            <input
              type="text"
              placeholder="VIP Level (1-9)"
              value={vip}
              onChange={e => {
                setVip(e.target.value);
                setInputError("");
              }}
              style={{
                width: "100%",
                maxWidth: 320,
                padding: "12px",
                fontSize: 16,
                borderRadius: 8,
                border: "1px solid #C026D3"
              }}
            />
            {inputError && <div style={{ color: "#dc2626", fontWeight: 500 }}>{inputError}</div>}
            <button
              style={{
                marginTop: 8,
                width: "100%",
                maxWidth: 320,
                padding: "12px 0",
                borderRadius: 16,
                background: "#C026D3",
                color: "white",
                fontWeight: 600,
                fontSize: 18,
                border: "none",
                cursor: "pointer"
              }}
              onClick={handleConfirmInput}
            >Confirm</button>
          </div>
        )}

        {/* BONUS QUESTIONS */}
        {step === "bonus" && (
          <div style={{ width: "100%", maxWidth: 400 }}>
            <div style={{ marginBottom: 12, fontWeight: 600 }}>Answer for bonus chance:</div>
            <div style={{ marginBottom: 8 }}>
              <label>Will you burn at least 3 legendary photos? (Y/N): </label>
              <input
                type="text"
                maxLength={1}
                value={legendaryInput}
                onChange={e => setLegendaryInput(e.target.value.toUpperCase())}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Will you burn at least 4 epic photos? (Y/N): </label>
              <input
                type="text"
                maxLength={1}
                value={epicInput}
                onChange={e => setEpicInput(e.target.value.toUpperCase())}
              />
            </div>
            {bonusError && <div style={{ color: "#dc2626" }}>{bonusError}</div>}
            <button
              onClick={handleConfirmBonus}
              style={{
                marginTop: 8,
                width: "100%",
                maxWidth: 320,
                padding: "12px 0",
                borderRadius: 16,
                background: "#C026D3",
                color: "white",
                fontWeight: 600,
                fontSize: 18,
                border: "none",
                cursor: "pointer"
              }}
            >
              Confirm and Send to NB
            </button>
          </div>
        )}

        {/* WAITING FOR NB APPROVAL */}
        {step === "waitNbConfirm" && (
          <div style={{
            minHeight: 180,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <div style={{ fontWeight: "bold", color: "#C026D3", fontSize: 20, marginBottom: 10 }}>
              Waiting for NB approval...
            </div>
            <div style={{ fontSize: 16, color: "#64748b", fontStyle: "italic" }}>
              Player: <b>{name}</b><br />VIP: <b>{vip}</b>
            </div>
          </div>
        )}

        {/* RITUAL SELECTION */}
        {step === "ritual" && ritual && ritual.player && (
          <div style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16
          }}>
            {infoLines.length > 0 && (
              <div
                style={{
                  width: "100%",
                  marginBottom: 10,
                  background: "#f1f5f9",
                  border: "1.5px solid #0284c7",
                  borderRadius: 10,
                  padding: "14px 10px",
                  color: "#0369a1",
                  fontWeight: 600,
                  fontSize: 15,
                  textAlign: "center",
                }}
              >
                {infoLines.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            )}
            <div style={{ fontWeight: 600, marginBottom: 6, color: "#C026D3" }}>
              Player: {ritual.player?.name} | VIP: {ritual.player?.vip}
            </div>
            {SACRIFICES.map((sac) => {
              let localBonus = 0;
              if (sac.key !== "absolute") localBonus = totalBonus;
              const success = sac.success + localBonus;
              const fail = sac.fail - localBonus;
              return (
                <button
                  key={sac.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    borderRadius: 16,
                    padding: "14px 18px",
                    width: "100%",
                    maxWidth: 320,
                    textAlign: "left",
                    border: selected === sac ? "2px solid #C026D3" : "2px solid #d1d5db",
                    background: selected === sac ? "#f3e8ff" : "#f9fafb",
                    fontSize: 16,
                    fontWeight: "normal",
                    cursor: "pointer",
                    boxShadow: selected === sac ? "0 2px 16px #e879f91c" : undefined,
                    transition: "0.15s"
                  }}
                  onClick={() => setSelected(sac)}
                >
                  <span style={{ fontSize: 26 }}>{sac.icon}</span>
                  <div>
                    <div style={{ fontWeight: "bold" }}>{sac.name}</div>
                    <div style={{ fontSize: 14, color: "#475569" }}>Burns {sac.burn} photos</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      <span style={{ color: "#15803d" }}>Success: {success}%</span> |{" "}
                      <span style={{ color: "#ca8a04" }}>Partial: {sac.partial}%</span> |{" "}
                      <span style={{ color: "#dc2626" }}>Fail: {fail}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
            <button
              disabled={!selected}
              style={{
                marginTop: 24,
                width: "100%",
                maxWidth: 320,
                padding: "12px 0",
                borderRadius: 16,
                background: selected ? "#C026D3" : "#f3e8ff",
                color: selected ? "white" : "#d1d5db",
                fontWeight: 600,
                fontSize: 18,
                border: "none",
                cursor: selected ? "pointer" : "not-allowed",
                transition: "0.15s"
              }}
              onClick={startRitual}
            >
              Start Ritual
            </button>
          </div>
        )}

        {/* WAITING FOR NB */}
        {step === "waiting" && (
          <div style={{
            minHeight: 180,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <div style={{
              borderRadius: "9999px",
              height: 56,
              width: 56,
              borderTop: "3px solid #C026D3",
              borderBottom: "3px solid #a21caf",
              marginBottom: 16,
              animation: "spin 1s linear infinite"
            }}></div>
            <div style={{ fontWeight: "bold", color: "#C026D3", fontSize: 18, marginBottom: 6 }}>
              Waiting for Night Bunny’s approval...
            </div>
            <div style={{ fontSize: 15, color: "#64748b", fontStyle: "italic", marginBottom: 8 }}>
              NB approval required. Please wait...
            </div>
          </div>
        )}

        {/* RESULT */}
        {step === "result" && result && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 32 }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>
              {result.type === "success"
                ? "✨"
                : result.type === "partial"
                  ? "🌗"
                  : "❌"}
            </div>
            <div style={{
              fontWeight: "bold", fontSize: 24, marginBottom: 4,
              color: result.type === "success" ? "#15803d" : result.type === "partial" ? "#b45309" : "#dc2626"
            }}>
              {result.type === "success"
                ? "Success!"
                : result.type === "partial"
                  ? "Partial Success"
                  : "Failure"}
            </div>
            <div style={{ marginBottom: 14, textAlign: "center", color: "#334155" }}>
              {result.message}
            </div>
            <button
              style={{
                marginTop: 6,
                padding: "10px 26px",
                borderRadius: 16,
                background: "#C026D3",
                color: "white",
                fontWeight: 600,
                fontSize: 17,
                border: "none",
                cursor: "pointer",
                transition: "0.15s"
              }}
              onClick={resetAll}
            >
              Restart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// === NB ADMIN SCREEN ===
function AdminScreen() {
  // ALL HOOKS AT THE TOP!
  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState("");
  const [fail, setFail] = useState(false);

  const [ritual, ] = useRitualSync();
  const [selected, setSelected] = useState(null);

  let bonusLegendary = false, bonusEpic = false, vipBonus = 0;
  let currentVip = "", infoLines = [];
  if (ritual && ritual.player) {
    bonusLegendary = ritual.player.legendaryInput === "Y";
    bonusEpic = ritual.player.epicInput === "Y";
    currentVip = ritual.player.vip;
    vipBonus = getVipBonus(currentVip);
  }
  let totalBonus = 0;
  if (bonusLegendary) {
    totalBonus += 2;
    infoLines.push("At least 3 legendary photos will be burned: +2% extra chance.");
  }
  if (bonusEpic) {
    totalBonus += 1;
    infoLines.push("At least 4 epic photos will be burned: +1% extra chance.");
  }
  if (vipBonus > 0) {
    totalBonus += vipBonus;
    infoLines.push(`VIP bonus: +${vipBonus}% extra chance.`);
  }

  // ADMIN PASSWORD SCREEN
  if (!auth) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f8bbd0 0%, #ede7f6 100%)"
      }}>
        <div style={{
          padding: 32,
          background: "white",
          borderRadius: 20,
          boxShadow: "0 4px 24px #2222"
        }}>
          <h2 style={{ color: "#C026D3", textAlign: "center" }}>NB Admin Login</h2>
          <input
            type="password"
            value={pass}
            onChange={e => { setPass(e.target.value); setFail(false); }}
            placeholder="Admin Password"
            style={{
              padding: "10px 18px",
              fontSize: 18,
              borderRadius: 8,
              border: "1.5px solid #C026D3",
              marginBottom: 10,
              width: "100%"
            }}
          />
          <button
            onClick={() => {
              if (pass === ADMIN_PASSWORD) setAuth(true);
              else setFail(true);
            }}
            style={{
              width: "100%",
              padding: "10px 0",
              borderRadius: 12,
              background: "#C026D3",
              color: "white",
              fontWeight: 600,
              border: "none",
              fontSize: 17,
              cursor: "pointer"
            }}
          >Login</button>
          {fail && <div style={{ color: "#dc2626", marginTop: 7 }}>Wrong password!</div>}
        </div>
      </div>
    );
  }

  // NB Approvals
  const handleApproveInput = () => {
    setRitual({ ...ritual, status: "nbconfirmed" });
  };

  const handleApprove = () => {
    if (!ritual || !ritual.sacrifice) return;
    let bonus = 0;
    if (ritual.sacrifice !== "absolute") bonus = totalBonus;
    const sac = SACRIFICES.find((s) => s.key === ritual.sacrifice);
    const success = sac.success + (sac.key !== "absolute" ? bonus : 0);
    const fail = sac.fail - (sac.key !== "absolute" ? bonus : 0);
    const roll = Math.random() * 100;
    let type;
    if (roll < success) type = "success";
    else if (roll < success + sac.partial) type = "partial";
    else type = "fail";
    const msg = MOTIVATION[type][Math.floor(Math.random() * MOTIVATION[type].length)];
    setRitual({
      ...ritual,
      status: "result",
      result: { type, message: msg }
    });
  };

  const resetResult = () => {
    clearRitual();
  };

  // --- NB PANEL ---
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f8bbd0 0%, #ede7f6 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        padding: 24,
        borderRadius: 24,
        boxShadow: "0 4px 32px #2222",
        background: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 4,
          textAlign: "center",
          color: "#C026D3"
        }}>NB Admin Panel</h1>
        <div style={{ color: "#64748b", textAlign: "center", fontSize: 16 }}>
          {(!ritual || !ritual.player) ? (
            <>No rituals waiting.<br /><span style={{ color: "#C026D3" }}>Awaiting moonlit offerings...</span></>
          ) : (
            <>
              Player: {ritual.player?.name} | VIP: {ritual.player?.vip}
              <br />
              {ritual.status === "waitingNb" && <span style={{ color: "#7c3aed" }}>Waiting for player confirmation...</span>}
              {ritual.status === "nbconfirmed" && <span style={{ color: "#7c3aed" }}>Player is at the ritual selection screen.</span>}
              {ritual.status === "waiting" && <span style={{ color: "#7c3aed" }}>Waiting for NB approval...</span>}
              {ritual.status === "result" && <span style={{ color: "#7c3aed" }}>Result is being displayed.</span>}
            </>
          )}
        </div>
        {/* Player confirmation */}
        {ritual && ritual.status === "waitingNb" && (
          <div style={{
            margin: "16px 0", width: "100%", textAlign: "center",
            border: "2px dashed #C026D3", borderRadius: 10, padding: 12, background: "#f3e8ff"
          }}>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>
              Player: <span style={{ color: "#C026D3" }}>{ritual.player.name}</span>
            </div>
            <div style={{ fontWeight: 500, marginBottom: 12 }}>
              VIP Level: <span style={{ color: "#C026D3" }}>{ritual.player.vip}</span>
            </div>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>
              Burn at least 3 legendary photos?: <span>{ritual.player.legendaryInput}</span>
            </div>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>
              Burn at least 4 epic photos?: <span>{ritual.player.epicInput}</span>
            </div>
            <button
              style={{
                padding: "10px 36px",
                borderRadius: 16,
                background: "#C026D3",
                color: "white",
                fontWeight: 600,
                fontSize: 17,
                border: "none",
                cursor: "pointer",
                transition: "0.15s"
              }}
              onClick={handleApproveInput}
            >
              Confirm Player
            </button>
          </div>
        )}

        {/* NB - Player ritual selection */}
        {ritual && ritual.status === "nbconfirmed" && ritual.player && (
          <div style={{
            width: "100%",
            marginTop: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16
          }}>
            {infoLines.length > 0 && (
              <div
                style={{
                  width: "100%",
                  marginBottom: 10,
                  background: "#f1f5f9",
                  border: "1.5px solid #0284c7",
                  borderRadius: 10,
                  padding: "14px 10px",
                  color: "#0369a1",
                  fontWeight: 600,
                  fontSize: 15,
                  textAlign: "center",
                }}
              >
                {infoLines.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            )}
            <div style={{ fontWeight: 600, marginBottom: 6, color: "#C026D3" }}>
              Player: {ritual.player?.name} | VIP: {ritual.player?.vip}
            </div>
            {SACRIFICES.map((sac) => {
              let localBonus = 0;
              if (sac.key !== "absolute") localBonus = totalBonus;
              const success = sac.success + localBonus;
              const fail = sac.fail - localBonus;
              return (
                <button
                  key={sac.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    borderRadius: 16,
                    padding: "14px 18px",
                    width: "100%",
                    maxWidth: 320,
                    textAlign: "left",
                    border: selected === sac ? "2px solid #C026D3" : "2px solid #d1d5db",
                    background: selected === sac ? "#f3e8ff" : "#f9fafb",
                    fontSize: 16,
                    fontWeight: "normal",
                    cursor: "not-allowed",
                    boxShadow: selected === sac ? "0 2px 16px #e879f91c" : undefined,
                    transition: "0.15s",
                    opacity: 0.7
                  }}
                  disabled
                >
                  <span style={{ fontSize: 26 }}>{sac.icon}</span>
                  <div>
                    <div style={{ fontWeight: "bold" }}>{sac.name}</div>
                    <div style={{ fontSize: 14, color: "#475569" }}>Burns {sac.burn} photos</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      <span style={{ color: "#15803d" }}>Success: {success}%</span> |{" "}
                      <span style={{ color: "#ca8a04" }}>Partial: {sac.partial}%</span> |{" "}
                      <span style={{ color: "#dc2626" }}>Fail: {fail}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
            <div style={{ marginTop: 18, color: "#64748b", fontSize: 15, fontStyle: "italic" }}>
              (Waiting for player's ritual choice...)
            </div>
          </div>
        )}

        {/* NB APPROVAL */}
        {ritual && ritual.status === "waiting" && (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 16, padding: 16
          }}>
            <div style={{ fontWeight: "bold", fontSize: 18, color: "#7c3aed" }}>
              Ritual Approval Request
            </div>
            <div>
              <span style={{ fontWeight: 600 }}>Player: </span>
              {ritual.player?.name}
            </div>
            <div>
              <span style={{ fontWeight: 600 }}>VIP: </span>
              {ritual.player?.vip}
            </div>
            <div>
              <span style={{ fontWeight: 600 }}>Sacrifice: </span>
              {SACRIFICES.find((s) => s.key === ritual.sacrifice)?.name}
            </div>
            <button
              style={{
                marginTop: 8,
                padding: "10px 36px",
                borderRadius: 16,
                background: "#C026D3",
                color: "white",
                fontWeight: 600,
                fontSize: 17,
                border: "none",
                cursor: "pointer",
                transition: "0.15s"
              }}
              onClick={handleApprove}
            >
              Approve & Reveal Result
            </button>
          </div>
        )}

        {/* RESULT */}
        {ritual && ritual.status === "result" && ritual.result && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 32 }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>
              {ritual.result.type === "success"
                ? "✨"
                : ritual.result.type === "partial"
                  ? "🌗"
                  : "❌"}
            </div>
            <div style={{
              fontWeight: "bold", fontSize: 24, marginBottom: 4,
              color: ritual.result.type === "success" ? "#15803d" : ritual.result.type === "partial" ? "#b45309" : "#dc2626"
            }}>
              {ritual.result.type === "success"
                ? "Success!"
                : ritual.result.type === "partial"
                  ? "Partial Success"
                  : "Failure"}
            </div>
            <div style={{ marginBottom: 14, textAlign: "center", color: "#334155" }}>
              {ritual.result.message}
            </div>
            <button
              style={{
                marginTop: 6,
                padding: "10px 26px",
                borderRadius: 16,
                background: "#C026D3",
                color: "white",
                fontWeight: 600,
                fontSize: 17,
                border: "none",
                cursor: "pointer",
                transition: "0.15s"
              }}
              onClick={resetResult}
            >
              Back to Waiting
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// === APP ROOT ===
function App() {
  const [screen, setScreen] = useState("user");
  useEffect(() => {
    if (window.location.pathname.includes("admin")) setScreen("admin");
    else setScreen("user");
  }, []);
  return screen === "admin" ? <AdminScreen /> : <UserScreen />;
}

export default App;
