// ============ تنظیمات قابل ویرایش ============
// آیدی دعوت سرور دیسکورد خودت رو اینجا جایگزین کن
const DISCORD_INVITE = "https://discord.gg/5Vj3547pN";

const CATEGORIES = [
  { id: "account", label: "اکانت", icon: "🧑‍🚀" },
  { id: "rank", label: "رنک", icon: "⭐" },
  { id: "block", label: "بلاک و آیتم", icon: "🧱" },
  { id: "world", label: "دنیا و مپ", icon: "🗺️" },
  { id: "skin", label: "اسکین", icon: "🎭" },
  { id: "plugin", label: "پلاگین", icon: "🔌" },
];

const SEED_LISTINGS = [
  {
    title: "رنک VIP سرور SkyBlock",
    category: "rank",
    price: 45000,
    description: "رنک VIP همراه با کیت روزانه، تگ اختصاصی و دسترسی به /fly توی سرور SkyBlock.",
    discord: "amir_mc",
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
  },
  {
    title: "اکانت مایکروسافت با اسکین‌های نایاب",
    category: "account",
    price: 120000,
    description: "اکانت اریجینال مایکروسافت با ۱۲ اسکین خریداری‌شده و کیپ‌های اختصاصی.",
    discord: "saraa#0421",
    createdAt: Date.now() - 1000 * 60 * 60 * 30,
  },
  {
    title: "۶۴ عدد دایموند بلاک",
    category: "block",
    price: 30000,
    description: "تحویل مستقیم توی سرور Survival خودم یا سرور شما (هماهنگی لازمه).",
    discord: "diamond_king",
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    title: "دنیای آماده Modern City",
    category: "world",
    price: 85000,
    description: "یک شهر مدرن کامل با بیش از ۴۰ ساختمون، آماده برای پروژه یوتیوب یا سرور شخصی.",
    discord: "buildmaster",
    createdAt: Date.now() - 1000 * 60 * 60 * 50,
  },
  {
    title: "اسکین اختصاصی طراحی‌شده",
    category: "skin",
    price: 15000,
    description: "طراحی اسکین سفارشی بر اساس درخواست شما، تحویل در کمتر از ۲۴ ساعت.",
    discord: "pixelartist",
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
  },
  {
    title: "پلاگین اقتصاد فارسی برای سرور",
    category: "plugin",
    price: 60000,
    description: "پلاگین اقتصاد کامل با پشتیبانی فارسی، فروشگاه درون‌بازی و سیستم مزایده.",
    discord: "dev_hossein",
    createdAt: Date.now() - 1000 * 60 * 60 * 70,
  },
];

const STORAGE_KEY = "dijimarket_listings_v1";

// ============ وضعیت ============
let listings = [];
let activeCategory = null;
let searchTerm = "";
let usingFirestore = false;
let attemptedSeed = false;

// ============ ذخیره‌سازی محلی (fallback وقتی Firebase تنظیم نشده) ============
function loadLocalListings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return SEED_LISTINGS.map((l, i) => ({ id: "seed-" + i, ...l }));
}

function saveLocalListings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  } catch (e) { /* storage might be unavailable */ }
}

// ============ رندر ============
const grid = document.getElementById("grid");
const emptyState = document.getElementById("emptyState");
const catRow = document.getElementById("catRow");
const statCount = document.getElementById("statCount");
const activeFilter = document.getElementById("activeFilter");
const activeFilterText = document.getElementById("activeFilterText");

function categoryLabel(id) {
  const c = CATEGORIES.find((c) => c.id === id);
  return c ? c.label : id;
}

function toPersianDigits(num) {
  const map = { 0: "۰", 1: "۱", 2: "۲", 3: "۳", 4: "۴", 5: "۵", 6: "۶", 7: "۷", 8: "۸", 9: "۹" };
  return String(num).replace(/[0-9]/g, (d) => map[d]);
}

function formatPrice(n) {
  return toPersianDigits(Number(n).toLocaleString("en-US")) + " تومان";
}

function renderCategories() {
  catRow.innerHTML = "";
  CATEGORIES.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "cat-btn" + (activeCategory === cat.id ? " active" : "");
    btn.innerHTML = `<span class="ic">${cat.icon}</span><span>${cat.label}</span>`;
    btn.addEventListener("click", () => {
      activeCategory = activeCategory === cat.id ? null : cat.id;
      renderCategories();
      renderListings();
      document.getElementById("listings").scrollIntoView({ block: "start" });
    });
    catRow.appendChild(btn);
  });
}

function renderListings() {
  let items = listings.slice().sort((a, b) => b.createdAt - a.createdAt);

  if (activeCategory) {
    items = items.filter((l) => l.category === activeCategory);
  }
  if (searchTerm.trim()) {
    const q = searchTerm.trim().toLowerCase();
    items = items.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        categoryLabel(l.category).toLowerCase().includes(q)
    );
  }

  if (activeCategory || searchTerm.trim()) {
    activeFilter.hidden = false;
    const parts = [];
    if (activeCategory) parts.push(`دسته: ${categoryLabel(activeCategory)}`);
    if (searchTerm.trim()) parts.push(`جستجو: «${searchTerm.trim()}»`);
    activeFilterText.textContent = parts.join(" · ");
  } else {
    activeFilter.hidden = true;
  }

  grid.innerHTML = "";
  emptyState.hidden = items.length !== 0;

  items.forEach((l) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-top">
        <h3>${escapeHTML(l.title)}</h3>
        <span class="card-cat">${categoryLabel(l.category)}</span>
      </div>
      <p class="card-desc">${escapeHTML(l.description)}</p>
      <div class="card-price">${formatPrice(l.price)}</div>
      <div class="card-foot">
        <span class="card-seller">فروشنده: ${escapeHTML(l.discord)}</span>
        <button class="card-contact" data-discord="${escapeHTML(l.discord)}">تماس در دیسکورد</button>
      </div>
    `;
    grid.appendChild(card);
  });

  statCount.textContent = toPersianDigits(listings.length);
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

grid.addEventListener("click", (e) => {
  const btn = e.target.closest(".card-contact");
  if (!btn) return;
  const discordId = btn.getAttribute("data-discord");
  navigator.clipboard?.writeText(discordId).catch(() => {});
  showToast(`آیدی «${discordId}» کپی شد. توی دیسکورد پیام بده!`);
});

document.getElementById("clearFilter").addEventListener("click", () => {
  activeCategory = null;
  searchTerm = "";
  document.getElementById("searchInput").value = "";
  renderCategories();
  renderListings();
});

// ============ جستجو ============
document.getElementById("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  searchTerm = document.getElementById("searchInput").value;
  renderListings();
  document.getElementById("listings").scrollIntoView({ block: "start" });
});

// ============ مودال ثبت آگهی ============
const modalBackdrop = document.getElementById("modalBackdrop");
const categorySelect = document.getElementById("categorySelect");

CATEGORIES.forEach((cat) => {
  const opt = document.createElement("option");
  opt.value = cat.id;
  opt.textContent = cat.label;
  categorySelect.appendChild(opt);
});

function openModal() {
  modalBackdrop.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeModal() {
  modalBackdrop.hidden = true;
  document.body.style.overflow = "";
}

document.getElementById("openAddListing").addEventListener("click", openModal);
document.getElementById("closeModal").addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalBackdrop.hidden) closeModal();
});

document.getElementById("listingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  const submitBtn = form.querySelector("button[type=submit]");

  const newListing = {
    title: data.get("title").trim(),
    category: data.get("category"),
    price: Number(data.get("price")),
    description: data.get("description").trim(),
    discord: data.get("discord").trim(),
    createdAt: Date.now(),
  };

  submitBtn.disabled = true;

  try {
    if (usingFirestore) {
      await db.collection("listings").add(newListing);
      // لیست از طریق onSnapshot خودش به‌روزرسانی می‌شه
    } else {
      listings.push({ id: "listing-" + Date.now(), ...newListing });
      saveLocalListings();
      renderListings();
    }
    form.reset();
    closeModal();
    showToast("آگهی با موفقیت ثبت شد!");
    document.getElementById("listings").scrollIntoView({ block: "start" });
  } catch (err) {
    console.error(err);
    showToast("ثبت آگهی با خطا مواجه شد. دوباره امتحان کن.");
  } finally {
    submitBtn.disabled = false;
  }
});

// ============ نوتیفیکیشن (toast) ============
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 3000);
}

// ============ لینک‌های دیسکورد ============
document.getElementById("discordLink").href = DISCORD_INVITE;
document.getElementById("discordLinkFooter").href = DISCORD_INVITE;

// ============ راه‌اندازی: Firestore (مشترک بین همه) یا localStorage (محلی) ============
function startWithFirestore() {
  usingFirestore = true;
  db.collection("listings")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      async (snapshot) => {
        listings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // اولین باری که دیتابیس خالیه، آگهی‌های نمونه رو یک‌بار داخلش می‌ذاریم
        if (listings.length === 0 && !attemptedSeed) {
          attemptedSeed = true;
          try {
            const batch = db.batch();
            SEED_LISTINGS.forEach((item) => {
              const ref = db.collection("listings").doc();
              batch.set(ref, item);
            });
            await batch.commit();
          } catch (err) {
            console.warn("افزودن آگهی‌های نمونه به Firestore ناموفق بود.", err);
          }
          return; // onSnapshot دوباره با داده‌های جدید صدا زده می‌شه
        }

        renderCategories();
        renderListings();
      },
      (err) => {
        console.error("اتصال به Firestore ناموفق بود، حالت محلی فعال شد.", err);
        startWithLocalStorage();
      }
    );
}

function startWithLocalStorage() {
  usingFirestore = false;
  listings = loadLocalListings();
  renderCategories();
  renderListings();
}

renderCategories(); // یه رندر اولیه‌ی خالی تا دسته‌بندی‌ها فوراً دیده بشن

if (typeof db !== "undefined" && db) {
  startWithFirestore();
} else {
  startWithLocalStorage();
}
