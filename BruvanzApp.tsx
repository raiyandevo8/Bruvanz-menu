import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Minus, X, ShoppingBag, Clock, CheckCircle2, ChefHat,
  CreditCard, Wallet, ArrowLeft, Filter, Radio,
} from "lucide-react";

/* ============================================================
   BRUVANZ — DESIGN TOKENS
   Grounded in Sylhet's tea-garden landscape: deep tea-leaf green,
   turmeric/spice gold, rice-paper cream, chili-rust reserved for
   status/unpaid flags only. Kept out of Tailwind's default palette
   on purpose, applied via inline style so the brand stays exact.
   ============================================================ */
const C = {
  paper: "#F5F0DF",
  paperDeep: "#ECE4CC",
  ink: "#211C13",
  inkSoft: "rgba(33,28,19,0.6)",
  tea: "#223828",
  teaDeep: "#152219",
  gold: "#C98A2B",
  goldSoft: "#E4B460",
  rust: "#A6402A",
  line: "rgba(33,28,19,0.14)",
  white: "#FFFDF7",
};

const FONT_DISPLAY = "'Fraunces', serif";
const FONT_BODY = "'IBM Plex Sans', sans-serif";

/* ============================================================
   MENU DATA — edit this to update what customers see.
   Each item: id, category, name, price (BDT), desc, emoji
   (placeholder), optional image (paste a URL to replace emoji).
   ============================================================ */
const MENU = [
  { id: "s1", category: "Starters", name: "Beguni & Peyaju Basket", price: 150, desc: "Crisp fried eggplant and lentil fritters with tamarind dip", emoji: "🍢" },
  { id: "s2", category: "Starters", name: "Chicken Fry Sylheti", price: 280, desc: "Marinated fried chicken with green chili and mustard oil", emoji: "🍗" },
  { id: "s3", category: "Starters", name: "Fuchka (6 pcs)", price: 120, desc: "Puffed shells with tamarind water, chickpea and potato", emoji: "🥟" },

  { id: "sp1", category: "Sylheti Specials", name: "Shatkora Beef", price: 420, desc: "Slow-cooked beef with Sylhet's signature bitter citrus", emoji: "🍖" },
  { id: "sp2", category: "Sylheti Specials", name: "Chui Jhal Duck", price: 480, desc: "Duck curry simmered with chui jhal stem and spices", emoji: "🦆" },
  { id: "sp3", category: "Sylheti Specials", name: "Panta Ilish", price: 390, desc: "Fermented rice served with fried hilsa and green chili", emoji: "🐟" },

  { id: "r1", category: "Rice & Biryani", name: "Sylheti Beef Tehari", price: 320, desc: "Mustard-oil beef pulao with potato and whole spice", emoji: "🍛" },
  { id: "r2", category: "Rice & Biryani", name: "Morog Polao", price: 300, desc: "Fragrant chicken pulao finished with fried onion", emoji: "🍚" },
  { id: "r3", category: "Rice & Biryani", name: "Steamed White Rice", price: 80, desc: "Plain rice, serves one", emoji: "🍚" },

  { id: "c1", category: "Curries", name: "Bhorta Platter", price: 260, desc: "Potato, eggplant, and dried fish mash with mustard oil", emoji: "🥔" },
  { id: "c2", category: "Curries", name: "Rui Fish Curry", price: 340, desc: "Rohu fish in a light turmeric-tomato gravy", emoji: "🐠" },
  { id: "c3", category: "Curries", name: "Mixed Vegetable Curry", price: 180, desc: "Seasonal vegetables in a light garlic-cumin sauce", emoji: "🥦" },

  { id: "b1", category: "Breads", name: "Porota (2 pcs)", price: 60, desc: "Flaky layered flatbread", emoji: "🫓" },
  { id: "b2", category: "Breads", name: "Naan", price: 70, desc: "Tandoor-baked leavened bread", emoji: "🫓" },

  { id: "d1", category: "Drinks", name: "Sylhet Garden Cha", price: 50, desc: "Milk tea brewed with local Sylhet tea leaves", emoji: "🍵" },
  { id: "d2", category: "Drinks", name: "Borhani", price: 90, desc: "Spiced yogurt drink, chilled", emoji: "🥛" },
  { id: "d3", category: "Drinks", name: "Fresh Lemon Mint", price: 80, desc: "Lemon soda with mint and black salt", emoji: "🍋" },

  { id: "e1", category: "Desserts", name: "Sylheti Seven Layer Tea Cake", price: 150, desc: "Layered dessert inspired by the seven-layer tea", emoji: "🍰" },
  { id: "e2", category: "Desserts", name: "Roshomalai (2 pcs)", price: 110, desc: "Soft cheese dumplings in sweet cardamom milk", emoji: "🍮" },
];

const CATEGORIES = [...new Set(MENU.map((i) => i.category))];
const TABLE_COUNT = 12;
const STATUS_STEPS = ["Placed", "Preparing", "Ready", "Served"];

function money(n) {
  return "৳" + n.toLocaleString("en-BD");
}

/* ============================================================
   STORAGE HELPERS
   Orders are written to shared persistent storage so a customer's
   order shows up live on the staff dashboard, the way a real
   backend would sync them.
   ============================================================ */
async function saveOrder(order) {
  try {
    await window.storage.set(`order:${order.id}`, JSON.stringify(order), true);
  } catch (e) {
    console.error("saveOrder failed", e);
  }
}
async function loadOrder(id) {
  try {
    const res = await window.storage.get(`order:${id}`, true);
    return res ? JSON.parse(res.value) : null;
  } catch (e) {
    return null;
  }
}
async function loadAllOrders() {
  try {
    const list = await window.storage.list("order:", true);
    if (!list || !list.keys) return [];
    const results = await Promise.all(
      list.keys.map(async (k) => {
        try {
          const r = await window.storage.get(k, true);
          return r ? JSON.parse(r.value) : null;
        } catch {
          return null;
        }
      })
    );
    return results.filter(Boolean).sort((a, b) => b.placedAt - a.placedAt);
  } catch (e) {
    return [];
  }
}

/* ============================================================
   SHARED UI BITS
   ============================================================ */
function GoogleFonts() {
  return (
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
    />
  );
}

function Logo({ size = 34, sub }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="rounded-full flex items-center justify-center shrink-0"
        style={{ width: size, height: size, background: C.gold, color: C.teaDeep, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: size * 0.45 }}
      >
        B
      </div>
      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 18, color: C.white, lineHeight: 1.1 }}>Bruvanz</div>
        <div style={{ fontSize: 11, color: "rgba(255,253,247,0.7)", marginTop: 1 }}>{sub || "Sylhet"}</div>
      </div>
    </div>
  );
}

function ModeSwitch({ view, onSwitch }) {
  return (
    <button
      onClick={onSwitch}
      className="fixed bottom-4 right-4 z-50 rounded-full px-4 py-2.5 text-xs font-semibold shadow-lg transition-transform active:scale-95"
      style={{ background: C.ink, color: C.white }}
    >
      {view === "staff" ? "Customer view" : "Staff view"}
    </button>
  );
}

/* ============================================================
   ROOT APP
   ============================================================ */
export default function BruvanzApp() {
  const [view, setView] = useState("tap"); // tap | menu | status | staff
  const [tableNumber, setTableNumber] = useState(null);
  const [cart, setCart] = useState({}); // id -> {qty, note}
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [payMethod, setPayMethod] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  // Real NFC flow: each tag's link looks like yoursite.com/?table=5
  // If a table number is present in the URL, skip the tap/select screen
  // entirely and jump straight into that table's menu.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("table");
      if (t && !isNaN(Number(t))) {
        setTableNumber(Number(t));
        setView("menu");
      }
    } catch (e) {
      // no-op if URL parsing isn't available
    }
  }, []);

  const cartItems = CATEGORIES.flatMap(() => [])
    .concat([])
    .length; // noop keep linter quiet

  const items = Object.entries(cart).map(([id, c]) => ({ ...MENU.find((m) => m.id === id), ...c }));
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  const addItem = (id) =>
    setCart((c) => ({ ...c, [id]: { qty: (c[id]?.qty || 0) + 1, note: c[id]?.note || "" } }));
  const decItem = (id) =>
    setCart((c) => {
      const next = { ...c };
      if (!next[id]) return c;
      const qty = next[id].qty - 1;
      if (qty <= 0) delete next[id];
      else next[id] = { ...next[id], qty };
      return next;
    });
  const setNote = (id, note) =>
    setCart((c) => (c[id] ? { ...c, [id]: { ...c[id], note } } : c));

  const placeOrder = async () => {
    const id = "T" + tableNumber + "-" + Date.now().toString().slice(-6);
    const order = {
      id,
      table: tableNumber,
      items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price, note: i.note || "" })),
      total,
      paymentMethod: payMethod,
      paid: payMethod === "online",
      status: "Placed",
      placedAt: Date.now(),
    };
    await saveOrder(order);
    setCurrentOrder(order);
    setCurrentOrderId(id);
    setCart({});
    setShowCart(false);
    setShowCheckout(false);
    setPayMethod(null);
    setView("status");
  };

  // poll live status while on the status screen
  useEffect(() => {
    if (view !== "status" || !currentOrderId) return;
    let cancelled = false;
    const tick = async () => {
      const fresh = await loadOrder(currentOrderId);
      if (fresh && !cancelled) setCurrentOrder(fresh);
    };
    const id = setInterval(tick, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [view, currentOrderId]);

  const switchMode = () => setView((v) => (v === "staff" ? "tap" : "staff"));

  return (
    <div style={{ fontFamily: FONT_BODY, color: C.ink, minHeight: "100vh", background: C.paper }}>
      <GoogleFonts />
      {view === "tap" && (
        <TapScreen
          onTap={(n) => {
            setTableNumber(n);
            setCart({});
            setView("menu");
          }}
        />
      )}
      {view === "menu" && (
        <MenuScreen
          tableNumber={tableNumber}
          cart={cart}
          addItem={addItem}
          decItem={decItem}
          setNote={setNote}
          count={count}
          total={total}
          items={items}
          showCart={showCart}
          setShowCart={setShowCart}
          showCheckout={showCheckout}
          setShowCheckout={setShowCheckout}
          payMethod={payMethod}
          setPayMethod={setPayMethod}
          placeOrder={placeOrder}
        />
      )}
      {view === "status" && (
        <StatusScreen
          order={currentOrder}
          orderId={currentOrderId}
          onNewOrder={() => setView("menu")}
        />
      )}
      {view === "staff" && <StaffDashboard />}
      <ModeSwitch view={view} onSwitch={switchMode} />
    </div>
  );
}

/* ============================================================
   TAP / TABLE SELECT SCREEN (simulated NFC)
   ============================================================ */
function TapScreen({ onTap }) {
  const [table, setTable] = useState("");
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 sm:px-8 text-center"
      style={{ background: `linear-gradient(180deg, ${C.tea}, ${C.teaDeep})`, color: C.white }}
    >
      <div
        className="rounded-full flex items-center justify-center mb-6"
        style={{ width: 68, height: 68, background: C.gold, color: C.teaDeep, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 28 }}
      >
        B
      </div>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 600, margin: 0 }}>Bruvanz</h1>
      <p className="mt-2 mb-8 max-w-xs sm:max-w-sm text-sm leading-relaxed" style={{ color: "rgba(255,253,247,0.78)" }}>
        Sylhet's table-side ordering. In the finished app this screen is skipped — tapping the NFC tag on
        your table opens the menu instantly, already knowing your table number.
      </p>

      <select
        value={table}
        onChange={(e) => setTable(e.target.value)}
        className="w-56 mb-4 rounded px-4 py-3 text-sm appearance-none"
        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)", color: C.white }}
      >
        <option value="" disabled>
          Choose a table (demo only)
        </option>
        {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n} style={{ color: C.ink }}>
            Table {n}
          </option>
        ))}
      </select>

      <button
        disabled={!table}
        onClick={() => onTap(Number(table))}
        className="w-56 rounded py-3.5 text-sm font-semibold transition-opacity disabled:opacity-40 active:scale-[0.98]"
        style={{ background: C.gold, color: C.teaDeep }}
      >
        Simulate NFC tap
      </button>

      <p className="mt-6 max-w-xs text-[11px] leading-relaxed" style={{ color: "rgba(255,253,247,0.5)" }}>
        Real version: each table's NFC tag is programmed with its own link, e.g. bruvanz.com/order?table=5
        — no menu shown here in production.
      </p>
    </div>
  );
}

/* ============================================================
   MENU SCREEN
   ============================================================ */
function MenuScreen({
  tableNumber, cart, addItem, decItem, setNote, count, total, items,
  showCart, setShowCart, showCheckout, setShowCheckout, payMethod, setPayMethod, placeOrder,
}) {
  const [activeCat, setActiveCat] = useState(CATEGORIES[0]);
  const sectionRefs = useRef({});

  const scrollToCat = (cat) => {
    setActiveCat(cat);
    sectionRefs.current[cat]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative pb-24" style={{ background: C.paper }}>
      <div className="sticky top-0 z-20 px-5 py-4 flex items-center justify-between" style={{ background: C.tea }}>
        <Logo />
        <div
          className="text-xs font-medium rounded-full px-3 py-1.5"
          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: C.white }}
        >
          Table {tableNumber}
        </div>
      </div>

      <div
        className="sticky z-10 flex gap-2 overflow-x-auto px-4 py-3"
        style={{ top: 66, background: C.paper, borderBottom: `1px solid ${C.line}`, scrollbarWidth: "none" }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => scrollToCat(cat)}
            className="shrink-0 rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors"
            style={
              activeCat === cat
                ? { background: C.tea, color: C.white, border: `1px solid ${C.tea}` }
                : { background: C.white, color: C.ink, border: `1px solid ${C.line}` }
            }
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="px-4 sm:px-5">
        {CATEGORIES.map((cat) => (
          <section key={cat} ref={(el) => (sectionRefs.current[cat] = el)} className="scroll-mt-32">
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, fontWeight: 600, margin: "24px 0 10px" }}>{cat}</h2>
            <div className="flex flex-col">
              {MENU.filter((i) => i.category === cat).map((item) => (
                <ItemRow key={item.id} item={item} inCart={cart[item.id]} addItem={addItem} decItem={decItem} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {count > 0 && (
        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex items-center justify-between px-5 py-3.5 z-30"
          style={{ background: C.tea, boxShadow: "0 -6px 18px rgba(0,0,0,0.18)" }}
        >
          <div>
            <div className="text-[11px]" style={{ color: "rgba(255,253,247,0.75)" }}>
              {count} item{count > 1 ? "s" : ""}
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 600, color: C.white }}>{money(total)}</div>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="rounded px-5 py-2.5 text-sm font-semibold flex items-center gap-2 active:scale-95 transition-transform"
            style={{ background: C.gold, color: C.teaDeep }}
          >
            <ShoppingBag size={15} /> View cart
          </button>
        </div>
      )}

      {showCart && (
        <CartSheet
          items={items}
          total={total}
          tableNumber={tableNumber}
          addItem={addItem}
          decItem={decItem}
          setNote={setNote}
          onClose={() => setShowCart(false)}
          onCheckout={() => {
            setShowCart(false);
            setShowCheckout(true);
          }}
        />
      )}

      {showCheckout && (
        <CheckoutSheet
          items={items}
          total={total}
          payMethod={payMethod}
          setPayMethod={setPayMethod}
          onClose={() => setShowCheckout(false)}
          onPlace={placeOrder}
        />
      )}
    </div>
  );
}

function ItemRow({ item, inCart, addItem, decItem }) {
  return (
    <div className="flex gap-3.5 py-3.5" style={{ borderBottom: `1px solid ${C.line}` }}>
      <div
        className="w-16 h-16 sm:w-[68px] sm:h-[68px] rounded shrink-0 flex items-center justify-center text-2xl overflow-hidden"
        style={{ background: C.paperDeep }}
      >
        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : item.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[15px]">{item.name}</div>
        <div className="text-xs leading-relaxed mt-0.5 mb-2" style={{ color: C.inkSoft }}>
          {item.desc}
        </div>
        <div className="flex items-center justify-between">
          <div className="font-semibold text-sm">{money(item.price)}</div>
          {inCart ? (
            <div className="flex items-center gap-2.5 rounded-full px-1.5 py-1" style={{ background: C.tea }}>
              <button onClick={() => decItem(item.id)} className="w-6 h-6 flex items-center justify-center text-white active:scale-90 transition-transform">
                <Minus size={13} />
              </button>
              <span className="text-white text-sm font-semibold min-w-[14px] text-center">{inCart.qty}</span>
              <button onClick={() => addItem(item.id)} className="w-6 h-6 flex items-center justify-center text-white active:scale-90 transition-transform">
                <Plus size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addItem(item.id)}
              className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: C.tea, color: C.white }}
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CART SHEET
   ============================================================ */
function Sheet({ onClose, children, wide }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center"
      style={{ background: "rgba(20,17,10,0.5)" }}
      onClick={onClose}
    >
      <div
        className={`w-full ${wide ? "max-w-lg" : "max-w-md"} max-h-[88vh] overflow-y-auto rounded-t-2xl px-5 pt-3.5 pb-7`}
        style={{ background: C.paper }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ background: C.line }} />
        {children}
      </div>
    </div>
  );
}

function CartSheet({ items, total, tableNumber, addItem, decItem, setNote, onClose, onCheckout }) {
  return (
    <Sheet onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600 }}>Your order — Table {tableNumber}</h2>
        <button onClick={onClose} className="opacity-50">
          <X size={20} />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-14 text-sm" style={{ color: C.inkSoft }}>
          Your cart is empty
        </div>
      ) : (
        <>
          {items.map((i) => (
            <div key={i.id} className="flex gap-3 py-3 items-start" style={{ borderBottom: `1px solid ${C.line}` }}>
              <div className="flex-1">
                <div className="font-semibold text-sm">{i.name}</div>
                <textarea
                  rows={1}
                  defaultValue={i.note || ""}
                  placeholder="Add a note (e.g. less spicy)"
                  onBlur={(e) => setNote(i.id, e.target.value)}
                  className="w-full mt-2 rounded px-2.5 py-2 text-xs resize-none"
                  style={{ border: `1px solid ${C.line}`, background: C.white, fontFamily: FONT_BODY }}
                />
                <div className="text-sm font-semibold mt-1.5">{money(i.price * i.qty)}</div>
              </div>
              <div className="flex items-center gap-2.5 rounded-full px-1.5 py-1 shrink-0" style={{ background: C.paperDeep }}>
                <button onClick={() => decItem(i.id)} className="w-6 h-6 flex items-center justify-center active:scale-90 transition-transform">
                  <Minus size={13} />
                </button>
                <span className="text-sm font-semibold min-w-[14px] text-center">{i.qty}</span>
                <button onClick={() => addItem(i.id)} className="w-6 h-6 flex items-center justify-center active:scale-90 transition-transform">
                  <Plus size={13} />
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-between font-bold text-base pt-3 mt-1" style={{ borderTop: `1px solid ${C.line}` }}>
            <span>Total</span>
            <span>{money(total)}</span>
          </div>
          <button
            onClick={onCheckout}
            className="w-full rounded py-3.5 mt-4 font-bold text-sm active:scale-[0.99] transition-transform"
            style={{ background: C.gold, color: C.teaDeep }}
          >
            Go to checkout
          </button>
        </>
      )}
    </Sheet>
  );
}

/* ============================================================
   CHECKOUT SHEET
   ============================================================ */
function CheckoutSheet({ items, total, payMethod, setPayMethod, onClose, onPlace }) {
  const [card, setCard] = useState({ name: "", number: "", exp: "", cvv: "" });
  const cardOk = card.name && card.number.length >= 12 && card.exp.length === 5 && card.cvv.length === 3;
  const canPlace = payMethod === "counter" || (payMethod === "online" && cardOk);

  return (
    <Sheet onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600 }}>Checkout</h2>
        <button onClick={onClose} className="opacity-50">
          <X size={20} />
        </button>
      </div>

      <div className="rounded p-4 mb-4" style={{ background: C.white, border: `1px solid ${C.line}` }}>
        {items.map((i) => (
          <div key={i.id} className="flex justify-between text-[13px] py-1.5">
            <span>
              {i.qty} × {i.name}
            </span>
            <span>{money(i.price * i.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-base pt-3 mt-1" style={{ borderTop: `1px solid ${C.line}` }}>
          <span>Total</span>
          <span>{money(total)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <button
          onClick={() => setPayMethod("online")}
          className="rounded p-3.5 text-center text-sm font-semibold flex flex-col items-center gap-1.5"
          style={
            payMethod === "online"
              ? { border: `1.5px solid ${C.tea}`, background: "rgba(34,56,40,0.06)" }
              : { border: `1px solid ${C.line}`, background: C.white }
          }
        >
          <CreditCard size={17} />
          Pay online
          <span className="font-normal text-[11px]" style={{ color: C.inkSoft }}>
            Card / mobile banking
          </span>
        </button>
        <button
          onClick={() => setPayMethod("counter")}
          className="rounded p-3.5 text-center text-sm font-semibold flex flex-col items-center gap-1.5"
          style={
            payMethod === "counter"
              ? { border: `1.5px solid ${C.tea}`, background: "rgba(34,56,40,0.06)" }
              : { border: `1px solid ${C.line}`, background: C.white }
          }
        >
          <Wallet size={17} />
          Pay at counter
          <span className="font-normal text-[11px]" style={{ color: C.inkSoft }}>
            Settle after eating
          </span>
        </button>
      </div>

      {payMethod === "online" && (
        <div className="flex flex-col gap-2.5 mb-4">
          <input
            placeholder="Name on card"
            value={card.name}
            onChange={(e) => setCard({ ...card, name: e.target.value })}
            className="rounded px-3 py-2.5 text-[13px]"
            style={{ border: `1px solid ${C.line}`, background: C.white }}
          />
          <input
            placeholder="Card number"
            maxLength={19}
            value={card.number}
            onChange={(e) => setCard({ ...card, number: e.target.value })}
            className="rounded px-3 py-2.5 text-[13px]"
            style={{ border: `1px solid ${C.line}`, background: C.white }}
          />
          <div className="flex gap-2.5">
            <input
              placeholder="MM/YY"
              maxLength={5}
              value={card.exp}
              onChange={(e) => setCard({ ...card, exp: e.target.value })}
              className="flex-1 rounded px-3 py-2.5 text-[13px]"
              style={{ border: `1px solid ${C.line}`, background: C.white }}
            />
            <input
              placeholder="CVV"
              maxLength={3}
              value={card.cvv}
              onChange={(e) => setCard({ ...card, cvv: e.target.value })}
              className="flex-1 rounded px-3 py-2.5 text-[13px]"
              style={{ border: `1px solid ${C.line}`, background: C.white }}
            />
          </div>
        </div>
      )}

      <button
        disabled={!canPlace}
        onClick={onPlace}
        className="w-full rounded py-3.5 font-bold text-sm disabled:opacity-40 active:scale-[0.99] transition-transform"
        style={{ background: C.gold, color: C.teaDeep }}
      >
        {payMethod === "online" ? `Pay ${money(total)} & place order` : "Place order"}
      </button>
    </Sheet>
  );
}

/* ============================================================
   STATUS SCREEN
   ============================================================ */
function StatusScreen({ order, orderId, onNewOrder }) {
  const o = order || { status: "Placed", items: [], total: 0, table: "-", paid: false };
  const stepIndex = STATUS_STEPS.indexOf(o.status);

  const message = {
    Placed: "The kitchen has received it and will start shortly.",
    Preparing: "Your food is being prepared right now.",
    Ready: "Your order is ready and on its way to your table.",
    Served: "Served — thanks for dining with Bruvanz.",
  }[o.status];

  return (
    <div className="max-w-md mx-auto min-h-screen" style={{ background: C.paper }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ background: C.tea }}>
        <Logo />
        <div
          className="text-xs font-medium rounded-full px-3 py-1.5"
          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: C.white }}
        >
          Table {o.table}
        </div>
      </div>

      <div className="px-6 sm:px-8 pt-10 pb-24 text-center">
        <div className="inline-block rounded-full px-3 py-1.5 text-xs font-semibold mb-4" style={{ background: C.paperDeep }}>
          Order {orderId}
        </div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600, margin: "0 0 6px" }}>
          {o.status === "Served" ? "Enjoy your meal" : "We've got your order"}
        </h1>
        <p className="text-[13px] max-w-xs mx-auto" style={{ color: C.inkSoft }}>
          {message}
        </p>

        <div className="relative flex justify-between max-w-sm mx-auto mt-9 mb-2">
          <div className="absolute top-[11px] left-[22px] right-[22px] h-0.5" style={{ background: C.line }} />
          {STATUS_STEPS.map((s, i) => (
            <div key={s} className="relative z-10 flex flex-col items-center gap-2 flex-1">
              <div
                className="w-[22px] h-[22px] rounded-full"
                style={{
                  background: i < stepIndex ? C.tea : i === stepIndex ? C.gold : C.white,
                  border: `2px solid ${i <= stepIndex ? (i === stepIndex ? C.gold : C.tea) : C.line}`,
                }}
              />
              <div className="text-[11px] font-semibold" style={{ color: i <= stepIndex ? C.ink : C.inkSoft }}>
                {s}
              </div>
            </div>
          ))}
        </div>

        <div className="text-left rounded p-4 mt-9" style={{ background: C.white, border: `1px solid ${C.line}` }}>
          {o.items.map((i, idx) => (
            <div key={idx} className="flex justify-between text-[13px] py-1.5">
              <span>
                {i.qty} × {i.name}
              </span>
              <span>{money(i.price * i.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-base pt-3 mt-1" style={{ borderTop: `1px solid ${C.line}` }}>
            <span>Total</span>
            <span>{money(o.total)}</span>
          </div>
          <div className="flex justify-between text-[13px] mt-2">
            <span>Payment</span>
            <span className="font-semibold" style={{ color: o.paid ? C.tea : C.rust }}>
              {o.paid ? "Paid online" : "Pay at counter"}
            </span>
          </div>
        </div>

        <button
          onClick={onNewOrder}
          className="mt-7 rounded px-6 py-3 text-sm font-medium"
          style={{ border: `1px solid ${C.line}`, background: "transparent" }}
        >
          Order something else
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   STAFF DASHBOARD
   ============================================================ */
function StaffDashboard() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("active"); // active | served | all

  const refresh = useCallback(async () => {
    const all = await loadAllOrders();
    setOrders(all);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, [refresh]);

  const advance = async (order) => {
    const next = STATUS_STEPS[STATUS_STEPS.indexOf(order.status) + 1];
    if (!next) return;
    const updated = { ...order, status: next };
    await saveOrder(updated);
    refresh();
  };

  const filtered = orders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "served") return o.status === "Served";
    return o.status !== "Served";
  });

  return (
    <div className="max-w-6xl mx-auto min-h-screen" style={{ background: C.paper }}>
      <div className="px-5 sm:px-8 py-4 flex items-center justify-between" style={{ background: C.tea }}>
        <Logo sub="Kitchen dashboard" />
        <Radio size={16} color={C.goldSoft} className="animate-pulse" />
      </div>

      <div className="px-5 sm:px-8 pt-6 pb-16">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
          <div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, margin: 0 }}>Orders</h1>
            <div className="text-xs mt-0.5" style={{ color: C.inkSoft }}>
              Updates automatically as customers order and pay
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: "active", label: "Active" },
            { key: "served", label: "Served" },
            { key: "all", label: "All" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="rounded-full px-3.5 py-1.5 text-xs font-medium"
              style={
                filter === f.key
                  ? { background: C.ink, color: C.white, border: `1px solid ${C.ink}` }
                  : { background: C.white, color: C.ink, border: `1px solid ${C.line}` }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-sm" style={{ color: C.inkSoft }}>
            No orders here yet. Place a demo order from the customer view to see it appear live.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((o) => (
              <Ticket key={o.id} order={o} onAdvance={() => advance(o)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_STYLE = {
  Placed: { bg: "rgba(166,64,42,0.12)", fg: C.rust },
  Preparing: { bg: "rgba(201,138,43,0.16)", fg: "#8A5F17" },
  Ready: { bg: "rgba(34,56,40,0.14)", fg: C.tea },
  Served: { bg: "rgba(33,28,19,0.08)", fg: "rgba(33,28,19,0.5)" },
};

function Ticket({ order, onAdvance }) {
  const style = STATUS_STYLE[order.status];
  const next = STATUS_STEPS[STATUS_STEPS.indexOf(order.status) + 1];
  const time = new Date(order.placedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="relative rounded-md px-4 pt-4 pb-3.5" style={{ background: C.white, boxShadow: "0 1px 3px rgba(33,28,19,0.08)" }}>
      <div
        className="absolute top-0 left-0 right-0 h-[5px] rounded-t-md"
        style={{ background: `repeating-linear-gradient(90deg, ${C.paper} 0 6px, transparent 6px 12px)` }}
      />
      <div className="flex justify-between items-start mb-2.5 pt-1">
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, fontWeight: 600, lineHeight: 1.1 }}>Table {order.table}</div>
          <span className="inline-block text-[10.5px] font-bold px-2.5 py-1 rounded-full mt-1.5" style={{ background: style.bg, color: style.fg }}>
            {order.status}
          </span>
        </div>
        <div className="text-right text-[11px]" style={{ color: C.inkSoft }}>
          <div className="flex items-center gap-1 justify-end">
            <Clock size={11} /> {time}
          </div>
          <div className="mt-0.5">{order.id}</div>
        </div>
      </div>

      <div className="mb-3">
        {order.items.map((i, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-[13px] py-0.5">
              <span>
                <span style={{ color: C.inkSoft }}>{i.qty}×</span> {i.name}
              </span>
              <span>{money(i.price * i.qty)}</span>
            </div>
            {i.note && (
              <div className="text-[11.5px] mb-0.5" style={{ color: C.rust }}>
                Note: {i.note}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2.5" style={{ borderTop: `1px dashed ${C.line}` }}>
        <span className="text-[11px] font-semibold" style={{ color: order.paid ? C.tea : C.rust }}>
          {order.paid ? "Paid online" : "Unpaid — pay at counter"}
        </span>
        {next ? (
          <button onClick={onAdvance} className="rounded px-3 py-1.5 text-xs font-semibold active:scale-95 transition-transform" style={{ background: C.tea, color: C.white }}>
            Mark {next}
          </button>
        ) : (
          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: C.inkSoft }}>
            <CheckCircle2 size={13} /> Served
          </span>
        )}
      </div>
    </div>
  );
}