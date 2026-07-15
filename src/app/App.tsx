import { useState, useEffect, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Coffee {
  _id: string;
  name: string;
  origin: string;
  roastLevel: "light" | "medium" | "medium-dark" | "dark";
  description: string;
  imageUrl?: string;
  inStock: boolean;
}

// ─── Roast palette ────────────────────────────────────────────────────────────

const ROAST_LEVELS = [
  {
    key: "light" as const,
    label: "Light Roast",
    subtitle: "Cinnamon · Floral · Fruity",
    description: "Bright acidity and complex origin flavors. Notes of berries, jasmine, and citrus peel.",
    pageBg: "#FFF8E7",
    pageText: "#3D2008",
    cardBg: "#FFF0C8",
    accent: "#B8860B",
    badge: "#F5C842",
    badgeText: "#3D2008",
    navBorder: "rgba(184,134,11,0.2)",
    temp: "190–205°C",
    example: "Ethiopian Yirgacheffe",
    image: "photo-1495474472287-4d71bcdd2085",
  },
  {
    key: "medium" as const,
    label: "Medium Roast",
    subtitle: "Caramel · Nutty · Balanced",
    description: "Rich caramel sweetness, roasted nuts, and a smooth lingering finish.",
    pageBg: "#FDF0DC",
    pageText: "#3D1800",
    cardBg: "#F5DEB3",
    accent: "#C8793A",
    badge: "#D4844A",
    badgeText: "#3D1800",
    navBorder: "rgba(200,121,58,0.2)",
    temp: "210–220°C",
    example: "Colombian Supremo",
    image: "photo-1509042239860-f550ce710b93",
  },
  {
    key: "medium-dark" as const,
    label: "Medium Dark",
    subtitle: "Chocolate · Smoky · Bold",
    description: "Deep chocolate bitterness with smoky sweetness and a fuller mouthfeel.",
    pageBg: "#2A1208",
    pageText: "#F5E6C8",
    cardBg: "#3D1F0D",
    accent: "#E8A254",
    badge: "#C06B35",
    badgeText: "#F5E6C8",
    navBorder: "rgba(232,162,84,0.2)",
    temp: "225–230°C",
    example: "Sumatra Mandheling",
    image: "photo-1442512595331-e89e73853f31",
  },
  {
    key: "dark" as const,
    label: "Dark Roast",
    subtitle: "Espresso · Bitter · Intense",
    description: "Maximum roast character — dominant bitterness, low acidity, heavy body.",
    pageBg: "#0D0402",
    pageText: "#E8A254",
    cardBg: "#1A0A04",
    accent: "#C8793A",
    badge: "#5C2A10",
    badgeText: "#E8A254",
    navBorder: "rgba(200,121,58,0.15)",
    temp: "240°C+",
    example: "Italian Espresso Blend",
    image: "photo-1485808191679-5f86510bd9d4",
  },
];

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_COFFEES: Coffee[] = [
  { _id: "1", name: "Ethiopian Yirgacheffe", origin: "Ethiopia", roastLevel: "light", description: "Bright citrus notes with a floral, jasmine-scented finish.", inStock: true, imageUrl: "photo-1495474472287-4d71bcdd2085" },
  { _id: "2", name: "Colombian Supremo", origin: "Colombia", roastLevel: "medium", description: "Classic caramel sweetness balanced with mild nutty undertones.", inStock: true, imageUrl: "photo-1509042239860-f550ce710b93" },
  { _id: "3", name: "Sumatra Mandheling", origin: "Indonesia", roastLevel: "medium-dark", description: "Earthy, syrupy body with dark chocolate and cedar.", inStock: true, imageUrl: "photo-1442512595331-e89e73853f31" },
  { _id: "4", name: "Italian Espresso Blend", origin: "Blend", roastLevel: "dark", description: "Bold, intense espresso with low acidity and thick crema.", inStock: true, imageUrl: "photo-1485808191679-5f86510bd9d4" },
  { _id: "5", name: "Kenya AA", origin: "Kenya", roastLevel: "light", description: "Wine-like berry acidity with tomato and brown sugar finish.", inStock: true, imageUrl: "photo-1459755486867-b55449bb39ff" },
  { _id: "6", name: "Guatemala Antigua", origin: "Guatemala", roastLevel: "medium", description: "Smooth cocoa and almond with a hint of fruit sweetness.", inStock: false, imageUrl: "photo-1447933601403-0c6688de566e" },
];

// ─── API helpers ──────────────────────────────────────────────────────────────

const API = axios.create({ baseURL: "http://localhost:5000/api", timeout: 3000 });

async function fetchCoffees(): Promise<Coffee[]> {
  try { return (await API.get("/coffees")).data; } catch { return MOCK_COFFEES; }
}
async function createCoffee(data: Omit<Coffee, "_id">): Promise<Coffee> {
  try { return (await API.post("/coffees", data)).data; } catch { return { ...data, _id: Date.now().toString() }; }
}
async function updateCoffee(id: string, data: Partial<Coffee>): Promise<Coffee> {
  try { return (await API.put(`/coffees/${id}`, data)).data; } catch { return { ...MOCK_COFFEES.find((c) => c._id === id)!, ...data }; }
}
async function deleteCoffee(id: string): Promise<void> {
  try { await API.delete(`/coffees/${id}`); } catch { /* offline */ }
}

// ─── Roast Carousel ───────────────────────────────────────────────────────────

function RoastCarousel({ onRoastChange }: { onRoastChange: (idx: number) => void }) {
  const [active, setActive] = useState(0);
  const [sliding, setSliding] = useState<"left" | "right" | null>(null);
  const touchStart = useRef<number | null>(null);

  const go = (next: number, dir: "left" | "right") => {
    if (sliding) return;
    setSliding(dir);
    setTimeout(() => {
      setActive(next);
      onRoastChange(next);
      setSliding(null);
    }, 350);
  };

  const prev = () => go((active - 1 + ROAST_LEVELS.length) % ROAST_LEVELS.length, "right");
  const next = () => go((active + 1) % ROAST_LEVELS.length, "left");

  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStart.current = null;
  };

  const r = ROAST_LEVELS[active];

  // slide transform
  const slideStyle: React.CSSProperties = {
    transform: sliding === "left" ? "translateX(-60px)" : sliding === "right" ? "translateX(60px)" : "translateX(0)",
    opacity: sliding ? 0 : 1,
    transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease",
  };

  return (
    <div
      className="relative overflow-hidden select-none"
      style={{ minHeight: "92vh", background: r.pageBg, transition: "background 0.6s ease" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Grain */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "160px 160px" }} />

      <div className="relative max-w-5xl mx-auto px-6 pt-28 pb-20 flex flex-col items-center gap-10">

        {/* Roast indicator dots */}
        <div className="flex items-center gap-2">
          {ROAST_LEVELS.map((lvl, i) => (
            <button
              key={i}
              onClick={() => go(i, i > active ? "left" : "right")}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === active ? 32 : 8,
                height: 8,
                background: i === active ? r.accent : `${r.pageText}30`,
              }}
            />
          ))}
        </div>

        {/* Card */}
        <div style={slideStyle} className="w-full max-w-lg">
          <div
            className="rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: r.cardBg }}
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={`https://images.unsplash.com/${r.image}?w=700&h=525&fit=crop&auto=format`}
                alt={r.label}
                className="w-full h-full object-cover"
                style={{ filter: active >= 2 ? "brightness(0.8)" : "brightness(1)" }}
              />
              {/* Color wash overlay that intensifies with roast darkness */}
              <div
                className="absolute inset-0"
                style={{
                  background: active === 0
                    ? "rgba(245,215,128,0.10)"
                    : active === 1
                    ? "rgba(200,121,58,0.15)"
                    : active === 2
                    ? "rgba(42,18,8,0.35)"
                    : "rgba(13,4,2,0.55)",
                }}
              />
              <span
                className="absolute top-4 left-4 text-xs font-mono px-3 py-1 rounded-full tracking-widest uppercase"
                style={{ background: r.badge, color: r.badgeText, fontFamily: "'DM Mono', monospace" }}
              >
                {r.temp}
              </span>
            </div>

            <div className="p-8">
              <p
                className="text-xs font-mono tracking-[0.25em] uppercase mb-2 opacity-60"
                style={{ color: r.pageText, fontFamily: "'DM Mono', monospace" }}
              >
                {r.subtitle}
              </p>
              <h2
                className="text-3xl font-bold mb-3"
                style={{ fontFamily: "'Playfair Display', serif", color: r.pageText }}
              >
                {r.example}
              </h2>
              <p className="text-sm leading-relaxed opacity-75" style={{ color: r.pageText }}>
                {r.description}
              </p>
            </div>
          </div>
        </div>

        {/* Label */}
        <div style={slideStyle} className="text-center">
          <h1
            className="text-5xl md:text-7xl font-bold mb-3"
            style={{ fontFamily: "'Playfair Display', serif", color: r.pageText }}
          >
            {r.label}
          </h1>
          <p className="text-sm opacity-50" style={{ color: r.pageText }}>
            Swipe or use arrows to explore roast levels
          </p>
        </div>

        {/* Arrow buttons */}
        <div className="flex items-center gap-6 mt-2">
          <button
            onClick={prev}
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all hover:scale-110 active:scale-95"
            style={{ background: `${r.pageText}15`, color: r.pageText, border: `1px solid ${r.pageText}20` }}
          >
            ←
          </button>
          <span
            className="text-xs font-mono tracking-widest opacity-40"
            style={{ color: r.pageText, fontFamily: "'DM Mono', monospace" }}
          >
            {active + 1} / {ROAST_LEVELS.length}
          </span>
          <button
            onClick={next}
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all hover:scale-110 active:scale-95"
            style={{ background: `${r.pageText}15`, color: r.pageText, border: `1px solid ${r.pageText}20` }}
          >
            →
          </button>
        </div>

        <Link
          to="/menu"
          className="px-10 py-3 rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95"
          style={{ background: r.accent, color: active >= 2 ? "#F5E6C8" : r.cardBg }}
        >
          Explore the Menu →
        </Link>
      </div>
    </div>
  );
}

// ─── Nav (theme-aware) ────────────────────────────────────────────────────────

function Nav({ roastIdx }: { roastIdx: number }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const r = ROAST_LEVELS[roastIdx];
  const isHome = location.pathname === "/";

  const navBg = isHome ? `${r.pageBg}EE` : "#120804EE";
  const navText = isHome ? r.pageText : "#F5E6C8";
  const navBorder = isHome ? r.navBorder : "rgba(200,121,58,0.2)";
  const logoColor = isHome ? r.accent : "#E8A254";

  const links = [
    { to: "/", label: "Home" },
    { to: "/menu", label: "Menu" },
    { to: "/admin", label: "Admin" },
    { to: "/login", label: "Login" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm transition-all duration-500"
      style={{ background: navBg, borderBottom: `1px solid ${navBorder}`, fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <span style={{ fontFamily: "'Playfair Display', serif", color: logoColor }} className="text-xl font-bold transition-colors duration-500">◎ Vanta</span>
          <span className="text-xs tracking-widest uppercase opacity-50 transition-colors duration-500" style={{ color: navText }}>Coffee</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {links.map(({ to, label }) => (
            <Link key={to} to={to}
              className="text-sm tracking-wide transition-colors duration-300"
              style={{ color: location.pathname === to ? logoColor : `${navText}80` }}
            >
              {label}
            </Link>
          ))}
        </div>
        <button className="md:hidden transition-colors duration-300" style={{ color: navText }} onClick={() => setMenuOpen(!menuOpen)}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
          </svg>
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden px-6 pb-4 flex flex-col gap-4" style={{ background: navBg }}>
          {links.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)}
              className="text-sm" style={{ color: location.pathname === to ? logoColor : `${navText}80` }}
            >{label}</Link>
          ))}
        </div>
      )}
    </nav>
  );
}

// ─── Coffee Card ──────────────────────────────────────────────────────────────

const ROAST_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  light: { label: "Light", color: "#3D2008", bg: "#F5C842" },
  medium: { label: "Medium", color: "#3D1800", bg: "#D4844A" },
  "medium-dark": { label: "Med-Dark", color: "#F5E6C8", bg: "#7B4A2D" },
  dark: { label: "Dark", color: "#E8A254", bg: "#2C1A0E" },
};

function CoffeeCard({ coffee, onEdit, onDelete }: { coffee: Coffee; onEdit?: () => void; onDelete?: () => void }) {
  const badge = ROAST_BADGE[coffee.roastLevel];
  return (
    <div className="rounded-xl overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl"
      style={{ background: "#1E0E06", border: "1px solid rgba(200,121,58,0.15)" }}>
      <div className="relative aspect-video bg-[#2A1208]">
        <img
          src={`https://images.unsplash.com/${coffee.imageUrl || "photo-1509042239860-f550ce710b93"}?w=400&h=250&fit=crop&auto=format`}
          alt={coffee.name}
          className="w-full h-full object-cover opacity-75"
        />
        <span className="absolute top-3 left-3 text-xs font-mono px-2 py-0.5 rounded-full"
          style={{ background: badge.bg, color: badge.color, fontFamily: "'DM Mono', monospace" }}>
          {badge.label}
        </span>
        {!coffee.inStock && (
          <span className="absolute top-3 right-3 text-xs bg-black/60 text-[#A0856A] px-2 py-0.5 rounded-full">Out of stock</span>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg font-semibold text-[#F5E6C8]">{coffee.name}</h3>
        </div>
        <p className="text-xs text-[#A0856A] mb-3 tracking-wide">{coffee.origin}</p>
        <p className="text-sm text-[#C8A882] leading-relaxed flex-1">{coffee.description}</p>
        {(onEdit || onDelete) && (
          <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: "1px solid rgba(200,121,58,0.15)" }}>
            {onEdit && (
              <button onClick={onEdit} className="flex-1 py-1.5 text-xs rounded-lg" style={{ background: "rgba(200,121,58,0.15)", color: "#E8A254" }}>Edit</button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="flex-1 py-1.5 text-xs rounded-lg" style={{ background: "rgba(212,24,61,0.15)", color: "#FF7A8A" }}>Delete</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────

function HomePage({ roastIdx, setRoastIdx }: { roastIdx: number; setRoastIdx: (i: number) => void }) {
  const [coffees, setCoffees] = useState<Coffee[]>([]);
  useEffect(() => { fetchCoffees().then((d) => setCoffees(d.slice(0, 3))); }, []);
  const r = ROAST_LEVELS[roastIdx];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", transition: "background 0.6s ease" }}>
      <RoastCarousel onRoastChange={setRoastIdx} />

      {/* Story — bg shifts with roast */}
      <section className="py-24 px-6 transition-all duration-700" style={{ background: r.pageBg }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-mono tracking-[0.3em] uppercase mb-4 opacity-50"
              style={{ color: r.pageText, fontFamily: "'DM Mono', monospace" }}>
              Our Philosophy
            </p>
            <h2 className="text-4xl font-bold mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif", color: r.pageText }}>
              From seed to cup,<br />
              <em style={{ color: r.accent }}>nothing is rushed.</em>
            </h2>
            <p className="leading-relaxed mb-4 opacity-70" style={{ color: r.pageText }}>
              At Vanta Coffee, we source directly from smallholder farms across Ethiopia, Colombia, Indonesia,
              and Kenya. Every bean is traceable. Every roast is intentional.
            </p>
            <p className="leading-relaxed opacity-70" style={{ color: r.pageText }}>
              The temperature curve determines the soul of your cup — from golden light roasts
              to the deep espresso character of a dark roast.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {ROAST_LEVELS.map((lvl, i) => (
              <div key={lvl.key} className="rounded-xl p-5 flex flex-col gap-2 cursor-pointer transition-all hover:scale-105"
                style={{ background: lvl.cardBg, border: `2px solid ${i === roastIdx ? lvl.accent : "transparent"}`, opacity: i === roastIdx ? 1 : 0.6 }}>
                <div className="w-7 h-7 rounded-full" style={{ background: lvl.badge }} />
                <p className="text-sm font-semibold" style={{ color: lvl.pageText, fontFamily: "'Playfair Display', serif" }}>{lvl.label}</p>
                <p className="text-xs opacity-60" style={{ color: lvl.pageText }}>{lvl.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured — dark strip */}
      <section className="py-20 px-6 bg-[#0D0603]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs font-mono text-[#C8793A] tracking-[0.3em] uppercase mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>Featured Beans</p>
              <h2 className="text-3xl font-bold text-[#F5E6C8]" style={{ fontFamily: "'Playfair Display', serif" }}>Currently in rotation</h2>
            </div>
            <Link to="/menu" className="text-sm text-[#C8793A] hover:text-[#E8A254] transition-colors">View all →</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {coffees.map((c) => <CoffeeCard key={c._id} coffee={c} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center transition-all duration-700" style={{ background: r.pageBg }}>
        <p className="text-xs font-mono tracking-[0.3em] uppercase mb-4 opacity-40" style={{ color: r.pageText, fontFamily: "'DM Mono', monospace" }}>Visit Us</p>
        <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: r.pageText }}>Open daily, 7am – 6pm</h2>
        <p className="mb-8 opacity-60" style={{ color: r.pageText }}>12 Roaster{"'"}s Lane, Melbourne VIC 3000</p>
        <Link to="/menu" className="inline-block px-10 py-3 rounded-full text-sm font-medium transition-all hover:scale-105"
          style={{ background: r.accent, color: roastIdx >= 2 ? "#F5E6C8" : r.cardBg }}>
          Browse the Menu
        </Link>
      </section>
    </div>
  );
}

// ─── Menu Page ────────────────────────────────────────────────────────────────

function MenuPage() {
  const [coffees, setCoffees] = useState<Coffee[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCoffees().then((d) => { setCoffees(d); setLoading(false); }); }, []);

  const filters = ["all", "light", "medium", "medium-dark", "dark"];
  const filtered = filter === "all" ? coffees : coffees.filter((c) => c.roastLevel === filter);

  return (
    <div className="min-h-screen bg-[#0D0603] pt-16" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <p className="text-xs font-mono text-[#C8793A] tracking-[0.3em] uppercase mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>Our Selection</p>
          <h1 className="text-5xl font-bold text-[#F5E6C8] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>The Menu</h1>
          <p className="text-[#A0856A] max-w-md mx-auto">Single-origins and blends, roasted weekly in small batches.</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {filters.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-5 py-2 rounded-full text-sm capitalize transition-all"
              style={filter === f ? { background: "#C8793A", color: "#120804" } : { background: "rgba(200,121,58,0.1)", color: "#A0856A" }}>
              {f === "all" ? "All Roasts" : f.replace("-", " ")}
            </button>
          ))}
        </div>
        {loading
          ? <div className="text-center py-20 text-[#A0856A]">Loading beans...</div>
          : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((c) => <CoffeeCard key={c._id} coffee={c} />)}
            </div>
        }
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-[#A0856A]">No coffees for this roast level.</div>
        )}
      </div>
    </div>
  );
}

// ─── Admin Page ────────────────────────────────────────────────────────────────

const EMPTY_FORM = { name: "", origin: "", roastLevel: "medium" as Coffee["roastLevel"], description: "", inStock: true };

function AdminPage() {
  const [coffees, setCoffees] = useState<Coffee[]>([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchCoffees().then(setCoffees); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.origin.trim()) e.origin = "Origin is required";
    if (!form.description.trim()) e.description = "Description is required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    if (editId) {
      const updated = await updateCoffee(editId, form);
      setCoffees((prev) => prev.map((c) => (c._id === editId ? updated : c)));
      showToast("Coffee updated!");
    } else {
      const created = await createCoffee(form as Omit<Coffee, "_id">);
      setCoffees((prev) => [...prev, created]);
      showToast("Coffee added!");
    }
    setForm({ ...EMPTY_FORM }); setEditId(null); setShowForm(false);
  };

  const handleEdit = (coffee: Coffee) => {
    setForm({ name: coffee.name, origin: coffee.origin, roastLevel: coffee.roastLevel, description: coffee.description, inStock: coffee.inStock });
    setEditId(coffee._id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coffee?")) return;
    await deleteCoffee(id);
    setCoffees((prev) => prev.filter((c) => c._id !== id));
    showToast("Deleted.");
  };

  const inp = { background: "#2A1208", border: "1px solid rgba(200,121,58,0.25)", color: "#F5E6C8", borderRadius: 8 };

  return (
    <div className="min-h-screen bg-[#0D0603] pt-16" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-5 py-3 rounded-xl text-sm shadow-lg" style={{ background: "#C8793A", color: "#120804", fontWeight: 500 }}>{toast}</div>
      )}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs font-mono text-[#C8793A] tracking-[0.3em] uppercase mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>Dashboard</p>
            <h1 className="text-4xl font-bold text-[#F5E6C8]" style={{ fontFamily: "'Playfair Display', serif" }}>Admin Panel</h1>
          </div>
          <button onClick={() => { setForm({ ...EMPTY_FORM }); setEditId(null); setShowForm(!showForm); }}
            className="px-6 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105"
            style={{ background: "#C8793A", color: "#120804" }}>
            {showForm ? "Cancel" : "+ Add Coffee"}
          </button>
        </div>

        {showForm && (
          <div className="rounded-2xl p-8 mb-12" style={{ background: "#1E0E06", border: "1px solid rgba(200,121,58,0.2)" }}>
            <h2 className="text-xl font-semibold text-[#F5E6C8] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              {editId ? "Edit Coffee" : "Add New Coffee"}
            </h2>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#A0856A]">Name *</label>
                <input style={inp} className="px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#C8793A]"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ethiopian Yirgacheffe" />
                {errors.name && <span className="text-xs text-red-400">{errors.name}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#A0856A]">Origin *</label>
                <input style={inp} className="px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#C8793A]"
                  value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="Ethiopia" />
                {errors.origin && <span className="text-xs text-red-400">{errors.origin}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#A0856A]">Roast Level</label>
                <select style={inp} className="px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#C8793A]"
                  value={form.roastLevel} onChange={(e) => setForm({ ...form, roastLevel: e.target.value as Coffee["roastLevel"] })}>
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="medium-dark">Medium Dark</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div className="flex items-center gap-3 self-end pb-2">
                <input type="checkbox" id="inStock" checked={form.inStock}
                  onChange={(e) => setForm({ ...form, inStock: e.target.checked })} className="accent-[#C8793A] w-4 h-4" />
                <label htmlFor="inStock" className="text-sm text-[#A0856A]">In Stock</label>
              </div>
              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-xs text-[#A0856A]">Description *</label>
                <textarea style={{ ...inp, resize: "none" }} className="px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#C8793A]"
                  rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Tasting notes..." />
                {errors.description && <span className="text-xs text-red-400">{errors.description}</span>}
              </div>
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button type="submit" className="px-8 py-2.5 rounded-full text-sm font-medium hover:scale-105 transition-all"
                  style={{ background: "#C8793A", color: "#120804" }}>
                  {editId ? "Update Coffee" : "Add Coffee"}
                </button>
                <button type="button" onClick={() => { setForm({ ...EMPTY_FORM }); setEditId(null); setShowForm(false); }}
                  className="px-6 py-2.5 rounded-full text-sm"
                  style={{ background: "rgba(200,121,58,0.1)", color: "#A0856A" }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {(["all", "light", "medium", "dark"] as const).map((key) => (
            <div key={key} className="rounded-xl p-5" style={{ background: "#1E0E06", border: "1px solid rgba(200,121,58,0.15)" }}>
              <p className="text-xs text-[#A0856A] mb-1 capitalize">{key === "all" ? "Total Beans" : `${key} roast`}</p>
              <p className="text-2xl font-mono font-bold text-[#E8A254]">
                {key === "all" ? coffees.length : coffees.filter((c) => c.roastLevel === key).length}
              </p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(200,121,58,0.15)" }}>
          <div className="px-6 py-4" style={{ background: "#1E0E06", borderBottom: "1px solid rgba(200,121,58,0.15)" }}>
            <h2 className="text-sm font-semibold text-[#F5E6C8]">All Products</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ background: "#150a05" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(200,121,58,0.1)" }}>
                  {["Name", "Origin", "Roast", "Stock", "Actions"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-mono text-[#A0856A] tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coffees.map((c) => {
                  const badge = ROAST_BADGE[c.roastLevel];
                  return (
                    <tr key={c._id} className="transition-colors hover:bg-[#1E0E06]" style={{ borderBottom: "1px solid rgba(200,121,58,0.07)" }}>
                      <td className="px-6 py-4 text-sm text-[#F5E6C8] font-medium">{c.name}</td>
                      <td className="px-6 py-4 text-sm text-[#A0856A]">{c.origin}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={c.inStock ? { background: "rgba(52,211,153,0.15)", color: "#34D399" } : { background: "rgba(212,24,61,0.15)", color: "#FF7A8A" }}>
                          {c.inStock ? "In Stock" : "Out"}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button onClick={() => handleEdit(c)} className="text-xs px-3 py-1 rounded-lg" style={{ background: "rgba(200,121,58,0.15)", color: "#E8A254" }}>Edit</button>
                        <button onClick={() => handleDelete(c._id)} className="text-xs px-3 py-1 rounded-lg" style={{ background: "rgba(212,24,61,0.12)", color: "#FF7A8A" }}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const validateLogin = () => {
    const e: Record<string, string> = {};
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
    if (!form.password || form.password.length < 6) e.password = "Min 6 characters";
    return e;
  };
  const validateRegister = () => {
    const e = validateLogin();
    if (!form.name.trim()) e.name = "Name is required";
    if (form.confirm !== form.password) e.confirm = "Passwords do not match";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = tab === "login" ? validateLogin() : validateRegister();
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({}); setSubmitting(true);
    try {
      await API.post(tab === "login" ? "/users/login" : "/users/register", form);
    } catch { /* demo mode */ }
    setSuccess(tab === "login" ? "Welcome back!" : "Account created!");
    setTimeout(() => navigate("/admin"), 1200);
    setSubmitting(false);
  };

  const inp = { background: "#2A1208", border: "1px solid rgba(200,121,58,0.25)", color: "#F5E6C8", borderRadius: 8 };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-16"
      style={{ background: "linear-gradient(135deg, #0D0603 0%, #1E0E06 100%)", fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <span style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-[#E8A254]">◎ Vanta</span>
          <p className="text-[#A0856A] mt-2 text-sm">The roaster{"'"}s portal</p>
        </div>
        <div className="rounded-2xl p-8" style={{ background: "#1E0E06", border: "1px solid rgba(200,121,58,0.2)" }}>
          <div className="flex rounded-xl p-1 mb-8" style={{ background: "#2A1208" }}>
            {(["login", "register"] as const).map((t) => (
              <button key={t} onClick={() => { setTab(t); setErrors({}); setSuccess(""); }}
                className="flex-1 py-2 text-sm rounded-lg capitalize transition-all"
                style={tab === t ? { background: "#C8793A", color: "#120804", fontWeight: 500 } : { color: "#A0856A" }}>
                {t}
              </button>
            ))}
          </div>
          {success && <div className="mb-6 px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(52,211,153,0.15)", color: "#34D399" }}>{success}</div>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {tab === "register" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#A0856A]">Full Name *</label>
                <input style={inp} className="px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#C8793A]"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Alex Barista" />
                {errors.name && <span className="text-xs text-red-400">{errors.name}</span>}
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#A0856A]">Email *</label>
              <input style={inp} className="px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#C8793A]" type="email"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="alex@vanta.coffee" />
              {errors.email && <span className="text-xs text-red-400">{errors.email}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#A0856A]">Password *</label>
              <input style={inp} className="px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#C8793A]" type="password"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
              {errors.password && <span className="text-xs text-red-400">{errors.password}</span>}
            </div>
            {tab === "register" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#A0856A]">Confirm Password *</label>
                <input style={inp} className="px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#C8793A]" type="password"
                  value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="••••••••" />
                {errors.confirm && <span className="text-xs text-red-400">{errors.confirm}</span>}
              </div>
            )}
            <button type="submit" disabled={submitting}
              className="mt-2 py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-60"
              style={{ background: "#C8793A", color: "#120804" }}>
              {submitting ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-[#A0856A] mt-6">
          {tab === "login" ? "No account? " : "Already have one? "}
          <button className="text-[#C8793A] hover:text-[#E8A254]" onClick={() => { setTab(tab === "login" ? "register" : "login"); setErrors({}); }}>
            {tab === "login" ? "Register" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────

function AppInner() {
  const [roastIdx, setRoastIdx] = useState(0);
  const location = useLocation();

  return (
    <>
      <Nav roastIdx={roastIdx} />
      <Routes>
        <Route path="/" element={<HomePage roastIdx={roastIdx} setRoastIdx={setRoastIdx} />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<HomePage roastIdx={roastIdx} setRoastIdx={setRoastIdx} />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
