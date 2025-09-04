// src/pages/Register.js
import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api"; // baseURL: http://localhost:5201/api
import Flag from "../components/Flag";
import Select, { components } from "react-select";
import "../styles/pages/_register.scss"; 

import BG from "../assets/registerbg.avif";

// Basit ülke listesi (emoji bayrak + ad + ISO kod)
const COUNTRIES = [
  { code: "TR", name: "Türkiye" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "CA", name: "Canada" },
  { code: "NL", name: "Netherlands" },
  { code: "JP", name: "Japan" },
];

const countryOptions = COUNTRIES.map(c => ({
  value: c.code,
  label: c.name,
  data: c
}));

// Flag’li Option
const Option = (props) => (
  <components.Option {...props}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Flag code={props.data.data.code} title={props.data.data.name} />
      <span>{props.data.data.name}</span>
    </div>
  </components.Option>
);

// Seçili değer (input’ta görünen)
const SingleValue = (props) => (
  <components.SingleValue {...props}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Flag code={props.data.data.code} title={props.data.data.name} />
      <span>{props.data.data.name}</span>
    </div>
  </components.SingleValue>
);


const MONTHS = ["01","02","03","04","05","06","07","08","09","10","11","12"];


function clampDay(day) {
  const d = parseInt(day || "0", 10);
  if (isNaN(d)) return "";
  return Math.min(31, Math.max(1, d)).toString().padStart(2, "0");
}

export default function Register() {
  const navigate = useNavigate();

  // steps
  const [step, setStep] = useState(1);

  // step-1
  const [email, setEmail] = useState("");

  // step-2
  const [userName, setUserName] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [country, setCountry] = useState(COUNTRIES[1]);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  // ui
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [emailAvailable, setEmailAvailable] = useState(null);   
  const [checkingEmail, setCheckingEmail]   = useState(false);
  const [counts , setCounts] = useState({ totalUsers: 0, totalGames: 0 });


  const selectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "rgba(0,0,0,0.40)",
      borderColor: "rgba(255,255,255,.15)",
      borderRadius: 12,
      minHeight: 48,
      color: "#fff"
    }),
    menu: (base) => ({ ...base, backgroundColor: "#0c1322" }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#172037" : "transparent",
      color: "#e8eef8",
      cursor: "pointer"
    }),
    singleValue: (base) => ({ ...base, color: "#fff" }),
    input: (base) => ({ ...base, color: "#fff" }),
    placeholder: (base) => ({ ...base, color: "rgba(255,255,255,.7)" }),
  };
  

  const emailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    [email]
  );

  const birthIso = useMemo(() => {
   if (!year || !month || !day) return null;
   return `${year}-${month}-${day}`; // day zaten 01-31
 }, [year, month, day]);

 const canSubmit = useMemo(() => {
  return !!(
    userName.trim() &&
    birthIso &&
    password &&
    password.length >= 6 &&
    password === password2
  );
}, [userName, birthIso, password, password2]);

  // Day seçenekleri (ay/yıla göre 28-29-30-31 otomatik)
const daysInMonth = useMemo(() => {
  if (!month) return 31;
  const mm = parseInt(month, 10);
  const yy = year ? parseInt(year, 10) : 2000; // leap-year kontrolü için varsayılan
  return new Date(yy, mm, 0).getDate();
}, [month, year]);

const DAYS = useMemo(
  () => Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0")),
  [daysInMonth]
);

const YEARS = useMemo(() => {
  const now = new Date().getFullYear();
  const min = 1900;
  return Array.from({ length: now - min + 1 }, (_, i) => String(now - i));
}, []);


  function goStep2(e) {
    e.preventDefault();
    setErr("");
    if (!emailValid) {
      setErr("Lütfen geçerli bir e‑posta adresi giriniz.");
      return;
    }
    setStep(2);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); setOk("");

    if (!userName.trim()) return setErr("Kullanıcı adı zorunludur.");
    if (!birthIso) return setErr("Doğum tarihini (Ay/Gün/Yıl) seçiniz.");
    if (!password || password.length < 6) return setErr("Şifre en az 6 karakter olmalı.");
    if (password !== password2) return setErr("Şifreler eşleşmiyor.");
    if (!country?.name) return setErr("Ülke seçimi zorunlu.");

    setLoading(true);
    try {
      await API.post("/auth/register", {
        userName: userName.trim(),
        email: email.trim(),
        password,
        birthdate: birthIso,     // .NET DateTime parse eder
        country: country.name,   // backend Country string bekliyor
      });
      setOk("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz…");
      setTimeout(() => navigate("/login"), 900);
    } catch (ex) {
     const srv = ex?.response;
  // ModelState hatalarını yakala
  const modelErrors = srv?.data?.errors;
  let msg =
    (typeof srv?.data === "object" && srv.data?.message) ? srv.data.message :
    (typeof srv?.data === "string") ? srv.data :
    srv?.statusText || "Kayıt sırasında bir hata oluştu.";

  if (modelErrors && typeof modelErrors === "object") {
    const firstKey = Object.keys(modelErrors)[0];
    const firstMsg = modelErrors[firstKey]?.[0];
    if (firstMsg) msg = firstMsg; // ekrana en anlamlı ilk hatayı ver
    console.error("Model validation errors:", modelErrors);
  }

  console.error("Register error:", {
    status: srv?.status,
    data: srv?.data,
    sentBody: {
      userName: userName.trim(),
      email: email.trim(),
      birthdate: birthIso,
      country: country.name,
      // password intentionally not logged
    },
  });

  setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  //CheckEmail
  useEffect(() => {
  // temizle
  setEmailAvailable(null);

  // geçerli format değilse kontrol etme
  if (!emailValid) return;

  let alive = true;
  const t = setTimeout(async () => {
    try {
      setCheckingEmail(true);
      const { data } = await API.get("/auth/check-email", { params: { email } });
      if (!alive) return;
      setEmailAvailable(Boolean(data?.available));
    } catch (e) {
      if (!alive) return;
      setEmailAvailable(false); // hata durumunda güvenli taraf
    } finally {
      if (alive) setCheckingEmail(false);
    }
  }, 400); // 400ms debounce

  return () => { alive = false; clearTimeout(t); };
}, [email, emailValid]);


  useEffect(() => {
    if (!day) return;
    const d = parseInt(day, 10);
    if (d > daysInMonth) setDay("");
  }, [daysInMonth, day]);

   useEffect(() => {
  let alive = true;
  (async () => {
    try {
      const res = await API.get("/admin/usergamecount");
      if (alive) setCounts(res.data ?? { totalUsers: 0, totalGames: 0 });
    } catch (err) {
      if (alive) setCounts({ totalUsers: 0, totalGames: 0 });
    }
  })();
  return () => { alive = false; };
}, []);

const totalUser = counts?.totalUsers ?? 0;
const totalGame = counts?.totalGames ?? 0;


  


  return (
    <div
      className="register-page"
      style={{ ["--register-bg"]: `url(${BG})` }} // İstersen kullanma; SCSS $bg-img de var
    >
      <div className="register-inner">
        <div className="register-card">
          <div className="card-body">
            <h1 className="title">Join the Game World</h1>
            <p className="subtitle">Create your gaming profile and connect with millions of players</p>

            <div className="stepbar">
              <div className="track">
                <div className="progress" style={{ width: step === 1 ? "50%" : "100%" }} />
              </div>
              <div className="labels">
                <span className={step === 1 ? "active" : ""}>Step 1</span>
                <span className={step === 2 ? "active" : ""}>Step 2</span>
              </div>
            </div>

           {step === 1 ? (
            <form onSubmit={goStep2}>
              <div className={`form-field floating ${email && emailValid ? (emailAvailable === true ? "ok" : (emailAvailable === false && !checkingEmail ? "err" : "")) : ""}`}>
                <input
                  id="reg-email"
                  type="email"
                  className="input"
                  placeholder=" "                // önemli: boş bir placeholder bırak
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <label htmlFor="reg-email">
                  Email address <span className="req">*</span>
                </label>

                {/* Sağdaki durum ikonu (opsiyonel) */}
                {email && emailValid && emailAvailable === true && (
                  <span className="status-icon ok">✔</span>
                )}
                {email && emailValid && emailAvailable === false && !checkingEmail && (
                  <span className="status-icon err">✕</span>
                )}
              </div>

              {/* Alt mesajlar (senin önceki uygunluk mesajların) */}
              {email && !emailValid && (
                <div className="check err">Please enter a valid email.</div>
              )}
              {email && emailValid && checkingEmail && (
                <div className="check info">Checking…</div>
              )}
              {email && emailValid && emailAvailable === true && (
                <div className="check ok">Email is available</div>
              )}
              {email && emailValid && emailAvailable === false && !checkingEmail && (
                <div className="check err">This email is already in use</div>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={!emailValid || checkingEmail || emailAvailable !== true}
              >
                Continue
              </button>

              <div className="auth-alt mt-5">
                <span>Already a player? </span>
                <Link to="/login" className="auth-alt-link">Sign in</Link>
              </div>
            </form>
            ) : (
              <form onSubmit={onSubmit}>
              {err && <div className="alert error">{err}</div>}
              {ok  && <div className="alert ok">{ok}</div>}

                <div className="form-field floating">
                  <input
                    id="reg-username"
                    className="input"
                    placeholder=" "
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                    autoComplete="username"
                  />
                  <label htmlFor="reg-username">
                    Username <span className="req">*</span>
                  </label>
                </div>

                {/* DATE OF BIRTH */}
                
            <label className="form-label">Date of birth *</label>
            <div className="date-row">
              <select
                className="select date-month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
              >
                <option value="">Month</option>
         {MONTHS.map((m) => (<option key={m} value={m}>{m}</option>))}
                
              </select>

              <select
                className="select date-day"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                required
              >
                <option value="">Day</option>
              {DAYS.map((d) => (<option key={d} value={d}>{d}</option>))}
              </select>

              <select
                className="select date-year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
              >
                <option value="">Year</option>
               {YEARS.map((y) => (<option key={y} value={y}>{y}</option>))}
              </select>
            </div>


                {/* COUNTRY (SELECT) */}
                <label className="form-label">Country *</label>
<div className="rs-field">   {/* ALT BOŞLUK için sarmal */}
  <Select
    classNamePrefix="rs"      // CSS için prefix
    options={countryOptions}
    value={countryOptions.find(o => o.value === country.code)}
    onChange={(opt) => {
      const c = COUNTRIES.find(x => x.code === opt.value) || COUNTRIES[0];
      setCountry(c);
    }}
    // MENÜ clipping fix
    menuPortalTarget={document.body}
    menuPosition="fixed"
    styles={{
      control: (base, state) => ({
        ...base,
        minHeight: 56,               // input yüksekliği ile uyum
        borderRadius: 12,
        backgroundColor: "rgba(0,0,0,.30)",
        borderColor: "rgba(255,255,255,.15)",
        boxShadow: state.isFocused ? "0 0 0 3px rgba(250,204,21,.35)" : "none",
        ":hover": { borderColor: "rgba(255,255,255,.25)" },
      }),
      valueContainer: (base) => ({ ...base, padding: "8px 12px" }),
      input: (base) => ({ ...base, color: "#fff" }),
      singleValue: (base) => ({ ...base, color: "#fff" }),
      placeholder: (base) => ({ ...base, color: "rgba(255,255,255,.6)" }),
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      menu: (base) => ({ ...base, zIndex: 9999, borderRadius: 12, overflow: "hidden" }),
    }}
    components={{
      Option,
      SingleValue,
      DropdownIndicator: null,
      IndicatorSeparator: () => null,
    }}
    theme={(theme) => ({
      ...theme,
      colors: {
        ...theme.colors,
        primary: "#facc15",
        primary25: "rgba(250,204,21,.15)",
        primary50: "rgba(250,204,21,.25)",
        neutral0: "#0b1220",
        neutral80: "#fff",
      },
    })}
  />
</div>


                <div className="form-field floating">
                  <input
                    id="reg-password"
                    className="input"
                    type={showPwd ? "text" : "password"}
                    placeholder=" "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <label htmlFor="reg-password">
                    Password <span className="req">*</span>
                  </label>
                  <button
                    type="button"
                    className="toggle"
                    onClick={() => setShowPwd((s) => !s)}
                  >
                    {showPwd ? "🙈" : "👁️"}
                  </button>
                </div>

                {/* 🔽 Şifre uyarı mesajı */}
                {password && password.length < 6 && (
                  <div className="check err">Password must be at least 6 characters.</div>
                )}

                {/* CONFIRM PASSWORD */}
                <div className="form-field floating">
                  <input
                    id="reg-password2"
                    className="input"
                    type={showPwd2 ? "text" : "password"}
                    placeholder=" "
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <label htmlFor="reg-password2">Confirm password <span className="req">*</span></label>
                  <button type="button" className="toggle" onClick={() => setShowPwd2((s) => !s)}>
                    {showPwd2 ? "🙈" : "👁️"}
                  </button>
                </div>
                {password2 && password !== password2 && (
                  <div className="check err">Passwords do not match.</div>
                )}
               <button
                type="submit"
                className="btn-primary"
                disabled={
                  loading ||
                  !userName.trim() ||
                  !birthIso ||
                  !password ||
                  password.length < 6 ||
                  password !== password2 ||
                  !country?.name
                }
              >
                {loading ? "Creating..." : "Join the Game World"}
              </button>

              <div className="auth-alt mt-3">
              <span>
                Go back to {""} <span
                  type="button" 
                  className="auth-alt-link" 
                  onClick={() => setStep(1)}
                >
                  email
                </span>
              </span>
            </div>

             <div className="auth-alt mt-5">
                <span>Already a player? </span>
                <Link to="/login" className="auth-alt-link">Sign in</Link>
              </div>
              </form>
            )}
          </div>

          <div className="card-stats">
            <div className="stat"><div className="num">{totalUser}</div><div className="label">Gamers</div></div>
            <div className="stat"><div className="num">{totalGame}</div><div className="label">Games</div></div>
            <div className="stat"><div className="num">28</div><div className="label">Reviews</div></div>
          </div>

          <div className="card-bottom">💎 Premium members get 50% more rewards</div>
        </div>
      </div>
    </div>
  );
}