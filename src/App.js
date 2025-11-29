import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, set, remove, onValue, off } from "firebase/database";

const ADMIN_PASSWORD = "777888";

const SACRIFICES = [
  { key: "korkak", name: "Korkak Feda", burn: 3, success: 10, partial: 30, fail: 60, icon: "🐇" },
  { key: "minik", name: "Minik Feda", burn: 5, success: 25, partial: 45, fail: 30, icon: "🕯️" },
  { key: "yüksek", name: "Yüksek Feda", burn: 7, success: 50, partial: 35, fail: 15, icon: "🔥" },
  { key: "tam", name: "Tam Feda", burn: 9, success: 62, partial: 28, fail: 10, icon: "💎" },
  { key: "mutlak", name: "Mutlak Feda", burn: 12, success: 72, partial: 22, fail: 6, icon: "👑" }
];

const COSTUME_TYPES = ["etek", "tanga", "star", "özel"];

function getRandomCostumePhoto() {
  const type = COSTUME_TYPES[Math.floor(Math.random() * COSTUME_TYPES.length)];

  let max;
  if (type === "etek") max = 12;
  else if (type === "tanga") max = 16;
  else if (type === "star") max = 8;
  else if (type === "özel") max = 8;

  const number = Math.floor(Math.random() * max) + 1;

  return { type, number };
}

function getRandomCostumePhotoSecond() {
  const typeSecond = COSTUME_TYPES[Math.floor(Math.random() * COSTUME_TYPES.length)];

  let max;
  if (typeSecond === "etek") max = 12;
  else if (typeSecond === "tanga") max = 16;
  else if (typeSecond === "star") max = 8;
  else if (typeSecond === "özel") max = 8;

  const numberSecond = Math.floor(Math.random() * max) + 1;

  return { typeSecond, numberSecond };
}

function getRandomPosePhoto() {
  const rarity = PHOTO_RARITIES[Math.floor(Math.random() * PHOTO_RARITIES.length)];
  const number = Math.floor(Math.random() * 8) + 1;

  return { rarity, number };
}

function getRandomPosePhotoSecond() {
  const raritySecond = PHOTO_RARITIES[Math.floor(Math.random() * PHOTO_RARITIES.length)];
  const numberSecond = Math.floor(Math.random() * 8) + 1;

  return { raritySecond, numberSecond };
}

function formatCostume(p) {
  return `${p.number} numaralı ${p.type}`;
}

function formatCostumeSecond(p) {
  return `${p.numberSecond} numaralı ${p.typeSecond}`;
}

function formatPose(p) {
  return `${p.number} numaralı pozisyon (${p.rarity})`;
}

function formatPoseSecond(p) {
  return `${p.numberSecond} numaralı pozisyon (${p.raritySecond})`;
}

const PHOTO_RARITIES = ["nadir", "epik", "efsanevi"];

const MOTIVATION = {
  success: [
    "Ritüel tam bir zaferdi! Hayalindeki ödülü kazandın. 🥂",
    "Night Bunny iradene boyun eğiyor! Güç bu gece senin. 🥂",
    "Kusursuz bir yükseliş—şanının tadını çıkar, seçilmiş olan! 🥂"
  ],
  partial: [
    "Tam kusursuz değil ama iki ödül kazandın. Kader yine oyun oynuyor!",
    "Kısmi başarı! Night Bunny cesaretine hayran.",
    "Büyüklüğün yarısına ulaştın. Risk alıp yükselmeye devam et!"
  ],
  fail: [
    "Ritüel sönüp gitti... Tekrar dene, belki şans bu kez güler.",
    "Night Bunny kankahalar atıyor... Kader acımasız!",
    "Bu sefer ödül yok. Bazen gece dişlerini gösterir! "
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

// FIREBASE SYNCHRONIZATION
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

  // Local kopyada sonucu göstermek için
  const [result, setResult] = useState(null);

  // STEP KONTROLLERİ (Ritüel ve NB ile eşleşme)
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

  // ADIM 1: İSİM + VIP GİRİŞ
  const handleConfirmInput = () => {
    if (!name || !vip) {
      setInputError("Lütfen oyuncu adı ve VIP seviyesini girin.");
      return;
    }
    if (name.length > 10) {
      setInputError("Oyuncu adı maksimum 10 karakter olabilir!");
      return;
    }
    if (!/^[1-9]$/.test(vip)) {
      setInputError("Sadece rakam ile giriş yapabilirsiniz (1-9)!");
      return;
    }
    setInputError("");
    setStep("bonus");
  };

  // ADIM 2: BONUS SORULARI
  // TEMP DEBUG: replace existing handleConfirmBonus
const handleConfirmBonus = async () => {
  if (!["Y", "N"].includes(legendaryInput) || !["Y", "N"].includes(epicInput)) {
    setBonusError("Only Y or N allowed for both questions.");
    return;
  }
  setBonusError("");

  const payload = {
    status: "waitingNb",
    player: { name, vip, legendaryInput, epicInput },
    time: Date.now()
  };

  console.log("DEBUG: about to write activeRitual payload:", payload);

  try {
    // setRitual is the firebase setter defined at top of App.js
    await setRitual(payload);
    console.log("DEBUG: setRitual succeeded");
    setStep("waitNbConfirm");
  } catch (err) {
    console.error("DEBUG: setRitual FAILED:", err);
    setBonusError("Failed to send ritual to NB: " + (err && err.message ? err.message : String(err)));
  }
};

  // ADIM 3: FEDAYI SEÇİP BAŞLAT
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

  // RESET
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

  // BONUSES (Yalnızca ritüel ekranında hesaplanır)
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
    infoLines.push("En az 3 efsanevi fotoğraf yakılacak: +%2 ek şans.");
  }
  if (bonusEpic) {
    totalBonus += 1;
    infoLines.push("En az 4 epik fotoğraf yakılacak: +%1 ek şans.");
  }
  if (vipBonus > 0) {
    totalBonus += vipBonus;
    infoLines.push(`VIP bonusu: +%${vipBonus} ek şans.`);
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
        }}>Yükseltme Ritüeli</h1>

        {/* İSİM-VIP GİRİŞ */}
        {step === "input" && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <input
              type="text"
              placeholder="Oyuncu Adı"
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
              placeholder="VIP Seviyesi (1-9)"
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
            >Onayla</button>
          </div>
        )}

        {/* BONUS SORULARI */}
        {step === "bonus" && (
          <div style={{ width: "100%", maxWidth: 400 }}>
            <div style={{ marginBottom: 12, fontWeight: 600 }}>Ekstra bonus kazanmak için:</div>
            <div style={{ marginBottom: 8 }}>
              <label>En az 3 efsanevi fotoğraf yakacak mısın? (Y/N): </label>
              <input
                type="text"
                maxLength={1}
                value={legendaryInput}
                onChange={e => setLegendaryInput(e.target.value.toUpperCase())}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>En az 4 epik fotoğraf yakacak mısın? (Y/N): </label>
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
              Onayla ve NB’ye Gönder
            </button>
          </div>
        )}

        {/* NB ONAYI BEKLENİYOR */}
        {step === "waitNbConfirm" && (
          <div style={{
            minHeight: 180,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <div style={{ fontWeight: "bold", color: "#C026D3", fontSize: 20, marginBottom: 10 }}>
              NB onayı bekleniyor...
            </div>
            <div style={{ fontSize: 16, color: "#64748b", fontStyle: "italic" }}>
              Oyuncu adı: <b>{name}</b><br />VIP seviyesi: <b>{vip}</b>
            </div>
          </div>
        )}

        {/* RİTÜEL SEÇİMİ */}
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
              Oyuncu adı: {ritual.player?.name} | VIP: {ritual.player?.vip}
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

        {/* NB ONAY BEKLENİYOR */}
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
              Night Bunny'nin onayı bekleniyor...
            </div>
            <div style={{ fontSize: 15, color: "#64748b", fontStyle: "italic", marginBottom: 8 }}>
              NB onayı gereklidir. Lütfen bekleyin...
            </div>
          </div>
        )}
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

// === ADMIN SCREEN ===
// (Sadece temel senkronizasyon, onay ve sonuç kodları. Gerekirse geliştiririz.)
function AdminScreen() {
  // BÜTÜN HOOK'LAR FONKSİYONUN EN ÜSTÜNDE!
  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState("");
  const [fail, setFail] = useState(false);

  const [ritual, ] = useRitualSync();
  const [selected, setSelected] = useState(null);

  // Bonusları ve infoLines'ı hesapla (UserScreen ile aynı)
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
    infoLines.push("En az 3 efsanevi fotoğraf yakılacak: +%2 ek şans.");
  }
  if (bonusEpic) {
    totalBonus += 1;
    infoLines.push("En az 4 epik fotoğraf yakılacak: +%1 ek şans.");
  }
  if (vipBonus > 0) {
    totalBonus += vipBonus;
    infoLines.push(`VIP bonusu: +%${vipBonus} ek şans.`);
  }

  // ŞİFRE EKRANI
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
          <h2 style={{ color: "#C026D3", textAlign: "center" }}>NB Admin Giriş</h2>
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
          >Giriş</button>
          {fail && <div style={{ color: "#dc2626", marginTop: 7 }}>Hatalı şifre!</div>}
        </div>
      </div>
    );
  }

  // NB Onayı
 const handleApproveInput = () => {
  if (!ritual?.player) return;
  setRitual({
    ...ritual,
    status: "nbconfirmed",
    ts: Date.now(),
  });
};

 const handleApprove = () => {
  if (!ritual || !ritual.sacrifice) return;

  let bonus = 0;
  if (ritual.sacrifice !== "absolute") bonus = totalBonus;

  let sac = SACRIFICES.find((s) => s.key === ritual.sacrifice);

  let success = sac.success + (sac.key !== "absolute" ? bonus : 0);
  let partial = sac.partial;
  let fail = sac.fail - (sac.key !== "absolute" ? bonus : 0);

  // 🧮 Full Sacrifice özel koruma
  if (sac.key === "full") {
    if (fail < 1) {
      const deficit = 1 - fail;
      fail = 1;
      partial = Math.max(1, partial - deficit);

      // Toplam 100'ü aşarsa başarıyı azalt
      let total = success + partial + fail;
      if (total > 100) {
        const over = total - 100;
        success = Math.max(1, success - over);
      }
    }
  }

  // 🔮 Sonuç hesaplama
const roll = Math.random() * 100;
let type;
if (roll < success) type = "success";
else if (roll < success + partial) type = "partial";
else type = "fail";

let msg;

// ⭐ PARTIAL SUCCESS → 2 ÖDÜL
if (type === "partial") {
  const costume = getRandomCostumePhoto();
  const pose = getRandomPosePhoto();
  const costumeSecond = getRandomCostumePhotoSecond();
  const poseSecond = getRandomPosePhotoSecond();

  const rewardText =
    `Kazandığın ödüller:\n` +
    `• Kostüm: ${formatCostume(costume)}\n` +
    `• Pozisyon: ${formatPose(pose)}\n` +
    `• ve Kostüm: ${formatCostumeSecond(costumeSecond)}\n` +
    `• Pozisyon: ${formatPoseSecond(poseSecond)}`;

  const base = MOTIVATION.partial[Math.floor(Math.random() * MOTIVATION.partial.length)];
  msg = `${base}\n\n${rewardText}`;

} else {
  msg = MOTIVATION[type][Math.floor(Math.random() * MOTIVATION[type].length)];
}

setRitual({
  ...ritual,
  status: "result",
  result: { type, message: msg },
});

};    

  const resetResult = () => {
    clearRitual();
  };

  // --- NB PANELİ ---
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
  {!ritual ? (
    <>No rituals waiting.<br /><span style={{ color: "#C026D3" }}>Awaiting moonlit offerings...</span></>
  ) : (
    <>
      Player name: {ritual.player?.name} | VIP: {ritual.player?.vip}
      <br />
      {ritual.status === "waitingNb" && <span style={{ color: "#7c3aed" }}>Waiting for NB approval...</span>}
      {ritual.status === "nbconfirmed" && <span style={{ color: "#7c3aed" }}>Player is at ritual selection screen.</span>}
      {ritual.status === "waiting" && <span style={{ color: "#7c3aed" }}>Player is waiting NB’s approval.</span>}
      {ritual.status === "result" && <span style={{ color: "#7c3aed" }}>Ritual result is visible.</span>}
    </>
  )}
</div>

        {/* Oyuncu girişi onayı */}
        {ritual && ritual.status === "waitingNb" && (
          <div style={{
            margin: "16px 0", width: "100%", textAlign: "center",
            border: "2px dashed #C026D3", borderRadius: 10, padding: 12, background: "#f3e8ff"
          }}>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>
              Oyuncu adı: <span style={{ color: "#C026D3" }}>{ritual.player.name}</span>
            </div>
            <div style={{ fontWeight: 500, marginBottom: 12 }}>
              VIP seviyesi: <span style={{ color: "#C026D3" }}>{ritual.player.vip}</span>
            </div>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>
              En az 3 efsanevi fotoğraf yakacak mı?: <span>{ritual.player.legendaryInput}</span>
            </div>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>
              En az 4 epik fotoğraf yakacak mı?: <span>{ritual.player.epicInput}</span>
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
              Oyuncuyu Onayla
            </button>
          </div>
        )}

        {/* NB - Oyuncu ritüel seçimi ekranı */}
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
              Oyuncu adı: {ritual.player?.name} | VIP: {ritual.player?.vip}
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
              (Oyuncu ritüel seçimini bekliyor...)
            </div>
          </div>
        )}

        {/* NB ONAYI */}
        {ritual && ritual.status === "waiting" && (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 16, padding: 16
          }}>
            <div style={{ fontWeight: "bold", fontSize: 18, color: "#7c3aed" }}>
              Ritual Approval Request
            </div>
            <div>
              <span style={{ fontWeight: 600 }}>Oyuncu adı: </span>
              {ritual.player?.name}
            </div>
            <div>
              <span style={{ fontWeight: 600 }}>VIP seviyesi: </span>
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

        {/* SONUÇ */}
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


// === ANA APP ===
function App() {
  const [screen, setScreen] = useState("user");
  useEffect(() => {
    if (window.location.pathname.includes("admin")) setScreen("admin");
    else setScreen("user");
  }, []);
  return screen === "admin" ? <AdminScreen /> : <UserScreen />;
}

export default App;
