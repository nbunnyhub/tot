import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, set, remove, onValue, off } from "firebase/database";

// ADMIN ŞİFREN BURADA (istediğin gibi değiştir!)
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

  const handleConfirmBonus = () => {
    if (!["Y", "N"].includes(legendaryInput) || !["Y", "N"].includes(epicInput)) {
      setBonusError("Her iki soruya da yalnızca Y veya N ile cevap verebilirsin.");
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
        {/* ... (diğer user ekranı kodları aynı, değiştirmene gerek yok) ... */}
        {/* ... Bu kısım daha önce verdiğim App.js'deki gibi devam edecek ... */}
        {/* KODUNUN DEVAMI BURADA OLMALI! */}
        {/* UserScreen’in geri kalanı değişmediği için tekrar yapıştırmadım. */}
      </div>
    </div>
  );
}

// === NB ADMIN SCREEN ===
function AdminScreen() {
  // --- HOOK'LAR HER ZAMAN EN ÜSTTE! ---
  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState("");
  const [fail, setFail] = useState(false);

  const [ritual, ] = useRitualSync();
  const [selected, setSelected] = useState(null);

  // Bonusları ve infoLines'ı hesapla
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

  // --- ŞİFRE KORUMALI GİRİŞ EKRANI ---
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

  // ... BURADAN İTİBAREN eski admin panelin kodunu devam ettir!

  // NB Onayı
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

  // ... burada önceki AdminScreen kodunun kalanını (panel JSX ve işlevleri) aynen devam ettirebilirsin ...
  // (Yani eski kodunun admin panel kısmı burada çalışır.)

}

function App() {
  const [screen, setScreen] = useState("user");
  useEffect(() => {
    if (window.location.pathname.includes("admin")) setScreen("admin");
    else setScreen("user");
  }, []);
  return screen === "admin" ? <AdminScreen /> : <UserScreen />;
}

export default App;
