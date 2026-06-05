// ───────────────────────────────────────────────────────────────
// DEMO DATA — the seed that powers DEMO_MODE.
// A complete, believable tenant so every screen is clickable with ₹0
// spend and no connected accounts. Mirrors what the seed script would
// write to Postgres in the real path.
// ───────────────────────────────────────────────────────────────
import type {
  AdAccount,
  AdRecommendation,
  BrandKit,
  BusinessProfile,
  Campaign,
  ConnectedPage,
  Festival,
  Lead,
  Post,
  PostAnalytics,
  SegmentTemplate,
} from "@/lib/types";

// A fixed "today" so the demo is reproducible and never drifts.
export const DEMO_TODAY = "2026-06-03";

export const businessProfile: BusinessProfile = {
  id: "biz_001",
  name: "Bright Minds Coaching Centre",
  type: "coaching",
  city: "Pune",
  language: "English + Hindi",
  tone: "Warm, encouraging, parent-friendly",
  audience: "Parents of class 6–12 students in Pune",
};

export const brandKit: BrandKit = {
  logoText: "Bright Minds",
  primary: "#244fdb",
  secondary: "#0ea5e9",
  accent: "#f59e0b",
  font: "Poppins",
};

// ── Demo tenants ───────────────────────────────────────────────
// Three sample client businesses so the app can be demoed as different
// clients (simulating "log in with the client's FB account"). In production
// each of these is a real `tenants` row hydrated from the connected Page.
export interface DemoTenant {
  id: string;
  profile: BusinessProfile;
  kit: BrandKit;
}

export const demoTenants: DemoTenant[] = [
  {
    id: "t_abacus",
    profile: {
      id: "biz_abacus",
      name: "MMA Abacus Academy",
      type: "abacus",
      city: "Kolkata",
      language: "English + Hindi + Bengali",
      tone: "Encouraging, parent-friendly, proud",
      audience: "Parents of children aged 5–14 in Kolkata",
    },
    kit: { logoText: "MMA Abacus", primary: "#244fdb", secondary: "#0ea5e9", accent: "#f59e0b", font: "Poppins" },
  },
  {
    id: "t_gym",
    profile: {
      id: "biz_gym",
      name: "Iron Forge Fitness",
      type: "gym",
      city: "Pune",
      language: "English + Hindi",
      tone: "Motivating, energetic, no-excuses",
      audience: "Working adults 22–40 in Pune",
    },
    kit: { logoText: "Iron Forge", primary: "#b91c1c", secondary: "#f97316", accent: "#facc15", font: "Poppins" },
  },
  {
    id: "t_play",
    profile: {
      id: "biz_play",
      name: "Tiny Tots Playschool",
      type: "playschool",
      city: "Bengaluru",
      language: "English + Kannada",
      tone: "Warm, playful, reassuring",
      audience: "Parents of toddlers aged 2–5 in Bengaluru",
    },
    kit: { logoText: "Tiny Tots", primary: "#db2777", secondary: "#a855f7", accent: "#fde047", font: "Poppins" },
  },
];

export const connectedPage: ConnectedPage = {
  id: "pg_001",
  pageId: "104839201938472",
  name: "Bright Minds Coaching Centre",
  category: "Education",
  followers: 4820,
  connected: true,
  avatar: "https://picsum.photos/seed/brightminds/200",
};

export const adAccount: AdAccount = {
  id: "ad_001",
  actId: "act_SANDBOX_882019",
  name: "Bright Minds — Sandbox Ad Account",
  currency: "INR",
  fundingOk: false,
  isSandbox: true,
};

const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/800`;

export const posts: Post[] = [
  {
    id: "post_001",
    type: "image",
    status: "published",
    title: "Class 10 Crash Course — Last 5 Seats",
    caption:
      "🎯 Crack your boards with confidence! Our Class 10 crash course covers the full syllabus in 8 focused weeks. Small batches, doubt-clearing daily, and weekly mock tests. Only 5 seats left for the June batch!",
    hashtags: ["#PuneCoaching", "#Class10", "#BoardExams", "#BrightMinds", "#StudySmart"],
    music: "Upbeat motivational — 'Rise Up' (royalty-free)",
    assetUrl: img("crash10"),
    publishedAt: "2026-05-28T09:30:00+05:30",
    fbPostId: "104839201938472_998812",
    source: "studio",
  },
  {
    id: "post_002",
    type: "reel",
    status: "published",
    title: "60-second study hack: the Feynman method",
    caption:
      "📚 Struggling to remember formulas? Try the Feynman technique — teach it to a friend in plain words. Our students swear by it! Save this reel 🔖",
    hashtags: ["#StudyHacks", "#ExamTips", "#Feynman", "#PuneStudents", "#BrightMinds"],
    music: "Trending — 'Focus Flow' (lo-fi)",
    assetUrl: img("feynman"),
    publishedAt: "2026-05-30T18:00:00+05:30",
    fbPostId: "104839201938472_998955",
    source: "studio",
  },
  {
    id: "post_003",
    type: "image",
    status: "published",
    title: "Topper spotlight — Aarav, 96.4%",
    caption:
      "👏 Heartiest congratulations to Aarav S. who scored 96.4% in his Class 12 boards! Two years of hard work and a lot of chai. We're so proud. Your future is bright! ✨",
    hashtags: ["#TopperSpotlight", "#Results2026", "#ProudMoment", "#BrightMinds", "#Pune"],
    music: "Celebratory — 'Champions' (royalty-free)",
    assetUrl: img("topper"),
    publishedAt: "2026-06-01T11:00:00+05:30",
    fbPostId: "104839201938472_999210",
    source: "studio",
  },
  {
    id: "post_004",
    type: "image",
    status: "scheduled",
    title: "Free demo class this Saturday",
    caption:
      "🆓 Curious about our teaching style? Bring your child to a FREE demo class this Saturday, 7 June, 10 AM. Meet the teachers, see a live session, ask anything. Limited seats — register via DM.",
    hashtags: ["#FreeDemoClass", "#PuneCoaching", "#Class6to12", "#BrightMinds"],
    music: "Friendly — 'Sunny Day' (royalty-free)",
    assetUrl: img("democlass"),
    scheduledAt: "2026-06-05T10:00:00+05:30",
    source: "studio",
  },
  {
    id: "post_005",
    type: "image",
    status: "scheduled",
    title: "Father's Day — thank you, Dads",
    caption:
      "❤️ Behind every confident student is a parent who believed first. This Father's Day, we salute all the dads cheering from the sidelines. Happy Father's Day from Bright Minds!",
    hashtags: ["#FathersDay", "#ThankYouDad", "#BrightMinds", "#Pune"],
    music: "Warm — 'With You' (royalty-free)",
    assetUrl: img("fathersday"),
    scheduledAt: "2026-06-15T08:30:00+05:30",
    source: "festival",
  },
  {
    id: "post_006",
    type: "text",
    status: "draft",
    title: "New batch enquiry CTA",
    caption:
      "📣 Admissions open for the 2026–27 academic year! Classes 6 to 12, all boards. Comment 'INFO' and our team will reach out with the schedule and fees.",
    hashtags: ["#AdmissionsOpen", "#PuneCoaching", "#BrightMinds"],
    assetUrl: img("admissions"),
    source: "studio",
  },
  {
    id: "post_007",
    type: "reel",
    status: "draft",
    title: "A day at Bright Minds (campus tour)",
    caption:
      "🏫 Take a peek inside Bright Minds — bright classrooms, a quiet library, and teachers who actually care. Upload your campus footage and we'll handle the caption & hashtags!",
    hashtags: ["#CampusTour", "#PuneCoaching", "#BrightMinds", "#BehindTheScenes"],
    music: "Upbeat — 'Good Vibes' (royalty-free)",
    assetUrl: img("campus"),
    source: "studio",
  },
];

export const analytics: PostAnalytics[] = [
  {
    postId: "post_001",
    reach: 8240,
    impressions: 11920,
    reactions: 412,
    comments: 63,
    shares: 38,
    videoViews: 0,
    clicks: 286,
    engagementRate: 6.2,
  },
  {
    postId: "post_002",
    reach: 15630,
    impressions: 24110,
    reactions: 1284,
    comments: 142,
    shares: 311,
    videoViews: 12870,
    clicks: 198,
    engagementRate: 11.1,
  },
  {
    postId: "post_003",
    reach: 9870,
    impressions: 13240,
    reactions: 892,
    comments: 207,
    shares: 96,
    videoViews: 0,
    clicks: 154,
    engagementRate: 12.1,
  },
];

export const recommendations: AdRecommendation[] = [
  {
    id: "rec_001",
    postId: "post_002",
    postTitle: "60-second study hack: the Feynman method",
    postThumb: img("feynman"),
    score: 92,
    objective: "leads",
    rationale:
      "This reel is your top performer — 11.1% engagement and 12.8k video views, 3× your page average. High watch-through means warm audiences. Promoting it for lead generation should convert curiosity into demo-class enquiries at a low cost.",
    audience: {
      locations: ["Pune", "Pimpri-Chinchwad"],
      ageMin: 30,
      ageMax: 50,
      interests: ["Parenting", "Education", "Tutoring", "CBSE", "Exam preparation"],
    },
    dailyBudget: 250,
    days: 7,
    expected: {
      reach: "18,000 – 26,000",
      results: "40 – 70 leads",
      costPerResult: "₹25 – ₹38 / lead",
    },
    status: "pending",
  },
  {
    id: "rec_002",
    postId: "post_003",
    postTitle: "Topper spotlight — Aarav, 96.4%",
    postThumb: img("topper"),
    score: 86,
    objective: "engagement",
    rationale:
      "Social proof posts build trust before admission season. This topper spotlight already has 207 comments organically. Boosting for engagement will widen reach among parents and prime them for your demo-class campaign.",
    audience: {
      locations: ["Pune"],
      ageMin: 28,
      ageMax: 52,
      interests: ["Parenting", "Schools", "Academic achievement"],
    },
    dailyBudget: 150,
    days: 5,
    expected: {
      reach: "12,000 – 17,000",
      results: "900 – 1,400 engagements",
      costPerResult: "₹0.55 – ₹0.80 / engagement",
    },
    status: "pending",
  },
];

export const campaigns: Campaign[] = [
  {
    id: "camp_001",
    name: "Class 10 Crash Course — Leads (Sandbox)",
    fbCampaignId: "23859901188820341",
    adsetId: "23859901188820342",
    adId: "23859901188820343",
    objective: "leads",
    status: "PAUSED",
    isSandbox: true,
    dailyBudget: 250,
    days: 7,
    spend: 0,
    reach: 0,
    results: 0,
    costPerResult: 0,
    createdAt: "2026-06-02T15:20:00+05:30",
  },
  {
    id: "camp_002",
    name: "Topper Spotlight — Engagement (Sandbox)",
    fbCampaignId: "23859901188820411",
    adsetId: "23859901188820412",
    adId: "23859901188820413",
    objective: "engagement",
    status: "COMPLETED",
    isSandbox: true,
    dailyBudget: 150,
    days: 5,
    spend: 742,
    reach: 14280,
    results: 1156,
    costPerResult: 0.64,
    createdAt: "2026-05-20T10:00:00+05:30",
  },
];

export const leads: Lead[] = [
  {
    id: "lead_001",
    campaignId: "camp_002",
    campaignName: "Topper Spotlight — Engagement (Sandbox)",
    name: "Priya Deshmukh",
    phone: "+91 98220 11234",
    email: "priya.d@example.com",
    interest: "Class 9 — Maths & Science",
    createdAt: "2026-05-22T14:12:00+05:30",
    isTest: true,
  },
  {
    id: "lead_002",
    campaignId: "camp_002",
    campaignName: "Topper Spotlight — Engagement (Sandbox)",
    name: "Rohan Kulkarni",
    phone: "+91 99230 55678",
    email: "rohan.k@example.com",
    interest: "Class 12 — PCM crash course",
    createdAt: "2026-05-23T09:48:00+05:30",
    isTest: true,
  },
  {
    id: "lead_003",
    campaignId: "camp_002",
    campaignName: "Topper Spotlight — Engagement (Sandbox)",
    name: "Sneha Patil",
    phone: "+91 90110 99012",
    email: "sneha.p@example.com",
    interest: "Free demo class — Saturday",
    createdAt: "2026-05-24T17:30:00+05:30",
    isTest: true,
  },
  {
    id: "lead_004",
    campaignId: "camp_002",
    campaignName: "Topper Spotlight — Engagement (Sandbox)",
    name: "Imran Shaikh",
    phone: "+91 98900 33445",
    email: "imran.s@example.com",
    interest: "Class 10 — full syllabus",
    createdAt: "2026-05-25T11:05:00+05:30",
    isTest: true,
  },
  {
    id: "lead_005",
    campaignId: "camp_002",
    campaignName: "Topper Spotlight — Engagement (Sandbox)",
    name: "Aditi Joshi",
    phone: "+91 97650 77889",
    email: "aditi.j@example.com",
    interest: "Class 7 — all subjects",
    createdAt: "2026-05-26T19:22:00+05:30",
    isTest: true,
  },
];

// Indian festival & holiday calendar (2026) — fanned out to all tenants in Phase 3.
// Each entry is a ready-to-edit post: caption, hashtags, suggested format & image.
// {brand} is replaced with the active tenant's name when the card renders.
// NOTE: dates for lunar/religious festivals are the widely-published 2026 dates
// and may shift by a day regionally — always confirm before scheduling.
export const festivals: Festival[] = [
  {
    date: "2026-01-01", name: "New Year's Day", emoji: "🎉", blurb: "Fresh-start wishes.",
    postType: "image", imageQuery: "happy new year 2026 celebration fireworks",
    caption: "🎉 Happy New Year 2026 from {brand}! Here's to new goals, new wins and a year full of growth. Thank you for being part of our journey. Let's make it count! ✨",
    hashtags: ["#HappyNewYear", "#NewYear2026", "#NewBeginnings", "#Goals2026"],
  },
  {
    date: "2026-01-14", name: "Makar Sankranti / Pongal", emoji: "🪁", blurb: "Kite-flying & harvest greetings.",
    postType: "image", imageQuery: "makar sankranti kites pongal harvest india",
    caption: "🪁 Happy Makar Sankranti & Pongal from {brand}! May your year soar as high as your kites and your harvest be plentiful. Warmth, sweetness and new beginnings to all. 🌾",
    hashtags: ["#MakarSankranti", "#Pongal", "#Sankranti2026", "#HarvestFestival"],
  },
  {
    date: "2026-01-23", name: "Saraswati Puja / Vasant Panchami", emoji: "📖", blurb: "Goddess of knowledge — perfect for education brands.",
    postType: "image", imageQuery: "saraswati puja books knowledge india",
    caption: "📖 Happy Vasant Panchami! On Saraswati Puja, {brand} bows to the goddess of knowledge, music and learning. May wisdom and creativity bless every student. 🌼",
    hashtags: ["#SaraswatiPuja", "#VasantPanchami", "#Knowledge", "#Learning"],
  },
  {
    date: "2026-01-26", name: "Republic Day", emoji: "🇮🇳", blurb: "Patriotic salute to the nation.",
    postType: "image", imageQuery: "india republic day flag tricolor",
    caption: "🇮🇳 Happy Republic Day! {brand} salutes the spirit of our great nation. Here's to unity, progress and the dreams we build together. Jai Hind!",
    hashtags: ["#RepublicDay", "#26January", "#ProudIndian", "#JaiHind"],
  },
  {
    date: "2026-02-15", name: "Maha Shivratri", emoji: "🕉️", blurb: "Devotional, calm tone.",
    postType: "image", imageQuery: "maha shivratri temple diya devotional",
    caption: "🕉️ On this Maha Shivratri, may Lord Shiva bless you with strength, peace and prosperity. Warm wishes from the {brand} family. Har Har Mahadev!",
    hashtags: ["#MahaShivratri", "#HarHarMahadev", "#Blessings", "#Shivratri2026"],
  },
  {
    date: "2026-03-04", name: "Holi", emoji: "🎨", blurb: "Colourful, playful campaign.",
    postType: "carousel", imageQuery: "holi festival colors india celebration",
    caption: "🎨 Happy Holi from {brand}! May your life be as colourful and joyful as the festival itself. Play safe, spread love, and make memories! 💙💛❤️",
    hashtags: ["#Holi", "#HappyHoli", "#FestivalOfColours", "#Holi2026"],
  },
  {
    date: "2026-03-08", name: "International Women's Day", emoji: "♀️", blurb: "Celebrate women & equality.",
    postType: "image", imageQuery: "international womens day empowerment india",
    caption: "♀️ Happy International Women's Day! {brand} celebrates the strength, brilliance and resilience of women everywhere. Here's to equality, every single day. 💜",
    hashtags: ["#WomensDay", "#IWD2026", "#WomenEmpowerment", "#Equality"],
  },
  {
    date: "2026-03-21", name: "Eid al-Fitr", emoji: "🌙", blurb: "Warm festive wishes.",
    postType: "image", imageQuery: "eid al fitr lantern celebration",
    caption: "🌙 Eid Mubarak from all of us at {brand}! May this Eid bring peace, happiness and prosperity to you and your loved ones. 🤲",
    hashtags: ["#EidMubarak", "#EidAlFitr", "#Eid2026", "#FestiveWishes"],
  },
  {
    date: "2026-03-26", name: "Ram Navami", emoji: "🙏", blurb: "Devotional greeting.",
    postType: "image", imageQuery: "ram navami temple india devotional",
    caption: "🙏 Happy Ram Navami from {brand}! May Lord Rama bless you with courage, righteousness and peace. Jai Shri Ram! 🚩",
    hashtags: ["#RamNavami", "#JaiShriRam", "#Festival", "#Blessings"],
  },
  {
    date: "2026-04-03", name: "Good Friday", emoji: "✝️", blurb: "Solemn, respectful tone.",
    postType: "image", imageQuery: "good friday cross church",
    caption: "✝️ On Good Friday, {brand} joins in reflection, gratitude and hope. Wishing peace and blessings to you and your family.",
    hashtags: ["#GoodFriday", "#Blessings", "#Peace", "#Faith"],
  },
  {
    date: "2026-04-14", name: "Ambedkar Jayanti / Baisakhi", emoji: "📘", blurb: "Education & harvest message.",
    postType: "image", imageQuery: "education books learning baisakhi india",
    caption: "📘 On Ambedkar Jayanti & Baisakhi, {brand} honours knowledge, equality and new beginnings. \"Education is the milk of a lioness.\" Let's keep learning. 🌾",
    hashtags: ["#AmbedkarJayanti", "#Baisakhi", "#Education", "#JaiBhim"],
  },
  {
    date: "2026-05-01", name: "May Day / Labour Day", emoji: "🛠️", blurb: "Honour hard work.",
    postType: "image", imageQuery: "labour day workers india",
    caption: "🛠️ Happy May Day! {brand} salutes the hard work and dedication of every worker. Your effort builds the world around us. 💪",
    hashtags: ["#MayDay", "#LabourDay", "#HardWork", "#Workers"],
  },
  {
    date: "2026-05-10", name: "Mother's Day", emoji: "👩‍👧", blurb: "Gratitude to mothers.",
    postType: "image", imageQuery: "indian mother child happy family",
    caption: "💐 Behind every confident child is a mother who believed first. This Mother's Day, {brand} salutes every amazing mom. Happy Mother's Day! ❤️",
    hashtags: ["#MothersDay", "#ThankYouMom", "#FamilyFirst", "#MomLove"],
  },
  {
    date: "2026-05-27", name: "Eid al-Adha (Bakrid)", emoji: "🐑", blurb: "Warm festive wishes.",
    postType: "image", imageQuery: "eid al adha bakrid celebration",
    caption: "🌙 Eid al-Adha Mubarak from {brand}! May this Eid bring you sacrifice rewarded, prayers answered, and joy shared with loved ones. 🤲",
    hashtags: ["#EidAlAdha", "#Bakrid", "#EidMubarak", "#FestiveWishes"],
  },
  {
    date: "2026-06-21", name: "Father's Day / Yoga Day", emoji: "👨‍👧", blurb: "Gratitude to dads + wellness.",
    postType: "image", imageQuery: "indian father child happy family",
    caption: "❤️ Behind every confident child is a parent who believed first. This Father's Day, {brand} salutes all the dads cheering from the sidelines. Happy Father's Day!",
    hashtags: ["#FathersDay", "#ThankYouDad", "#FamilyFirst", "#YogaDay"],
  },
  {
    date: "2026-08-15", name: "Independence Day", emoji: "🇮🇳", blurb: "Freedom & aspiration theme.",
    postType: "image", imageQuery: "india independence day flag tricolor",
    caption: "🇮🇳 Happy Independence Day! {brand} celebrates 79 years of freedom and the limitless potential of every Indian. Let's keep building a brighter tomorrow. Jai Hind!",
    hashtags: ["#IndependenceDay", "#15August", "#ProudIndian", "#JaiHind"],
  },
  {
    date: "2026-08-28", name: "Raksha Bandhan", emoji: "🪢", blurb: "Sibling-bond storytelling.",
    postType: "image", imageQuery: "raksha bandhan rakhi siblings india",
    caption: "🪢 Happy Raksha Bandhan from {brand}! Here's to the bond that protects, teases and loves unconditionally. Tag your sibling and celebrate! 💖",
    hashtags: ["#RakshaBandhan", "#Rakhi", "#SiblingLove", "#Rakhi2026"],
  },
  {
    date: "2026-09-04", name: "Janmashtami", emoji: "🦚", blurb: "Devotional, joyful.",
    postType: "image", imageQuery: "krishna janmashtami india festival",
    caption: "🦚 Happy Janmashtami from {brand}! May Lord Krishna fill your life with love, wisdom and endless joy. Jai Shri Krishna! 🪈",
    hashtags: ["#Janmashtami", "#JaiShriKrishna", "#Festival", "#Krishna"],
  },
  {
    date: "2026-09-05", name: "Teachers' Day", emoji: "🍎", blurb: "Celebrate your faculty!",
    postType: "carousel", imageQuery: "indian teacher classroom students",
    caption: "🍎 Happy Teachers' Day! At {brand}, our teachers don't just teach — they inspire, encourage and shape futures. Thank you to every mentor who makes a difference. 🙏",
    hashtags: ["#TeachersDay", "#ThankYouTeachers", "#5September", "#Gurus"],
  },
  {
    date: "2026-09-14", name: "Ganesh Chaturthi", emoji: "🐘", blurb: "Auspicious new beginnings.",
    postType: "carousel", imageQuery: "ganesh chaturthi ganpati festival india",
    caption: "🐘 Ganpati Bappa Morya! {brand} wishes you a blessed Ganesh Chaturthi. May Lord Ganesha remove every obstacle and bring wisdom and prosperity. 🙏",
    hashtags: ["#GaneshChaturthi", "#GanpatiBappaMorya", "#Ganeshotsav", "#Blessings"],
  },
  {
    date: "2026-10-02", name: "Gandhi Jayanti", emoji: "🕊️", blurb: "Peace & non-violence.",
    postType: "image", imageQuery: "gandhi jayanti peace india",
    caption: "🕊️ On Gandhi Jayanti, {brand} remembers the Father of the Nation. \"Be the change you wish to see in the world.\" Let's lead with truth and kindness.",
    hashtags: ["#GandhiJayanti", "#2October", "#Peace", "#BeTheChange"],
  },
  {
    date: "2026-10-19", name: "Durga Puja / Navratri", emoji: "🌺", blurb: "Vibrant 9-day celebration.",
    postType: "carousel", imageQuery: "durga puja navratri festival india",
    caption: "🌺 Shubho Durga Puja & Happy Navratri from {brand}! May Maa Durga bless you with strength, courage and prosperity. Let the celebrations begin! 🪔",
    hashtags: ["#DurgaPuja", "#Navratri", "#ShubhoDurgaPuja", "#Festival2026"],
  },
  {
    date: "2026-10-20", name: "Dussehra", emoji: "🏹", blurb: "Victory of good over evil.",
    postType: "image", imageQuery: "dussehra ravana festival india",
    caption: "🏹 Happy Dussehra from {brand}! May good triumph over evil in your life, and may you find the courage to overcome every challenge. Shubh Vijayadashami!",
    hashtags: ["#Dussehra", "#Vijayadashami", "#GoodOverEvil", "#Festival"],
  },
  {
    date: "2026-11-08", name: "Diwali", emoji: "🪔", blurb: "Biggest festive push of the year.",
    postType: "carousel", imageQuery: "diwali diya lights rangoli india",
    caption: "🪔 Happy Diwali from the {brand} family! May this festival of lights fill your home with joy, your heart with warmth and your year with prosperity. ✨",
    hashtags: ["#Diwali", "#HappyDiwali", "#FestivalOfLights", "#Diwali2026"],
  },
  {
    date: "2026-11-10", name: "Bhai Dooj", emoji: "🤝", blurb: "Sibling love finale.",
    postType: "image", imageQuery: "bhai dooj siblings festival india",
    caption: "🤝 Happy Bhai Dooj from {brand}! Celebrating the beautiful bond between brothers and sisters. May your relationship grow stronger every year. 💖",
    hashtags: ["#BhaiDooj", "#SiblingLove", "#Festival", "#Diwali2026"],
  },
  {
    date: "2026-11-14", name: "Children's Day", emoji: "🎈", blurb: "Perfect for education & kids brands.",
    postType: "carousel", imageQuery: "children day happy kids india",
    caption: "🎈 Happy Children's Day! At {brand}, every child is a bundle of curiosity and potential. Here's to nurturing bright young minds. Keep dreaming, little ones! 🌟",
    hashtags: ["#ChildrensDay", "#BalDiwas", "#HappyKids", "#14November"],
  },
  {
    date: "2026-11-24", name: "Guru Nanak Jayanti", emoji: "🪯", blurb: "Devotional, peaceful.",
    postType: "image", imageQuery: "guru nanak jayanti gurpurab india",
    caption: "🪯 Happy Gurpurab from {brand}! On Guru Nanak Jayanti, may the teachings of Guru Nanak Dev Ji guide you towards love, humility and service. 🙏",
    hashtags: ["#GuruNanakJayanti", "#Gurpurab", "#Blessings", "#Festival"],
  },
  {
    date: "2026-12-25", name: "Christmas", emoji: "🎄", blurb: "Cheerful seasonal greeting.",
    postType: "image", imageQuery: "christmas tree lights celebration",
    caption: "🎄 Merry Christmas from {brand}! Wishing you a season filled with joy, love and laughter. May your celebrations be merry and bright! ⭐",
    hashtags: ["#Christmas", "#MerryChristmas", "#Christmas2026", "#Festive"],
  },
];

// Several ready-to-use templates per business type. The Content Intelligence
// page shows ONLY the templates matching the connected account's business type
// (e.g. an abacus Page never sees gym/salon ideas). Hashtags are tuned to be
// strong, relevant and discoverable for each industry.
export const segmentTemplates: SegmentTemplate[] = [
  // ── Abacus / Mental Maths ──────────────────────────────────────
  {
    id: "seg_abacus_demo", type: "abacus", label: "Abacus — Free Demo Class", emoji: "🧮",
    prompt: "Invite parents to a free demo / assessment with a speed-maths hook.",
    sampleCaption:
      "🧮 Can your child multiply faster than a calculator? They can! Book a FREE abacus demo class this week and watch focus, speed & confidence grow. Ages 5–14. Limited seats!",
    hashtags: ["#Abacus", "#MentalMaths", "#AbacusForKids", "#BrainDevelopment", "#FreeDemoClass", "#SmartKids"],
  },
  {
    id: "seg_abacus_result", type: "abacus", label: "Abacus — Student Achievement", emoji: "🏆",
    prompt: "Show social proof: a student clearing a level or solving sums at speed.",
    sampleCaption:
      "🏆 Proud moment! Our Level-5 champ just solved 50 sums in under 2 minutes — all in the head, no calculator. This is what abacus training builds. 👏 Save & share!",
    hashtags: ["#AbacusChampion", "#MentalArithmetic", "#SpeedMaths", "#ProudMoment", "#MathWhiz", "#FocusAndConfidence"],
  },
  {
    id: "seg_abacus_value", type: "abacus", label: "Abacus — Why It Works (Parents)", emoji: "🧠",
    prompt: "Educate parents on the benefits of early abacus learning.",
    sampleCaption:
      "🧠 Did you know? The brain is most receptive to abacus training before age 12. Early starters build sharper focus, stronger memory and lifelong number sense. Give your child the edge.",
    hashtags: ["#Abacus", "#ParentingTips", "#EarlyLearning", "#BrainTraining", "#VedicMaths", "#ChildDevelopment"],
  },

  // ── Coaching / Tuition ─────────────────────────────────────────
  {
    id: "seg_coaching_demo", type: "coaching", label: "Coaching — Free Demo Class", emoji: "🎯",
    prompt: "Promote a results-driven batch with a demo-class CTA.",
    sampleCaption:
      "🎯 Results that speak! 9 of 10 of our students improved by 2+ grades last term. Book a FREE demo class and see the difference for yourself. Limited seats!",
    hashtags: ["#Coaching", "#BoardExams", "#FreeDemoClass", "#StudySmart", "#ExamPrep", "#TopResults"],
  },
  {
    id: "seg_coaching_topper", type: "coaching", label: "Coaching — Topper Spotlight", emoji: "🌟",
    prompt: "Celebrate a topper to build trust before admission season.",
    sampleCaption:
      "🌟 Topper Spotlight! Heartiest congratulations to our student who scored 96.4% in the boards. Hard work + the right guidance = results. Your child could be next! 👏",
    hashtags: ["#TopperSpotlight", "#BoardResults", "#ProudMoment", "#Coaching", "#StudentSuccess", "#ExamResults"],
  },
  {
    id: "seg_coaching_tip", type: "coaching", label: "Coaching — Study Hack", emoji: "📚",
    prompt: "Share a quick study tip as a save-worthy reel.",
    sampleCaption:
      "📚 Study hack: can't remember formulas? Teach them to a friend in plain words (the Feynman technique). Our students swear by it. Save this for exam season! 🔖",
    hashtags: ["#StudyHacks", "#ExamTips", "#StudyMotivation", "#Coaching", "#LearnSmart", "#StudentLife"],
  },

  // ── Playschool / Daycare ───────────────────────────────────────
  {
    id: "seg_play_admissions", type: "playschool", label: "Playschool — Admissions Open", emoji: "🧸",
    prompt: "Reassure parents with safety + play-based learning and an open-house invite.",
    sampleCaption:
      "🧸 Admissions open! Safe, loving, play-based learning for ages 2–5. Join our open house this weekend, tour the campus with your little one, and see the giggles for yourself. 💛",
    hashtags: ["#Playschool", "#Admissions2026", "#EarlyLearning", "#HappyKids", "#PreSchool", "#OpenHouse"],
  },
  {
    id: "seg_play_day", type: "playschool", label: "Playschool — A Day With Us", emoji: "🌈",
    prompt: "Show a joyful day to build emotional trust with parents.",
    sampleCaption:
      "🌈 Finger-painting, story time and a whole lot of giggles! A little peek into a happy day with us — where little ones love to learn and grow. 💕",
    hashtags: ["#Playschool", "#LearningThroughPlay", "#HappyKids", "#EarlyChildhood", "#KidsActivities", "#PreSchool"],
  },
  {
    id: "seg_play_trial", type: "playschool", label: "Playschool — Free Trial Day", emoji: "🎨",
    prompt: "Offer a free play-and-learn trial to drive walk-ins.",
    sampleCaption:
      "🎨 FREE play-and-learn trial this Saturday! Bring your little one for a fun-filled morning of music, stories and play. Limited spots — message us to reserve. 🧸",
    hashtags: ["#FreeTrial", "#Playschool", "#EarlyLearning", "#HappyKids", "#ParentingWin", "#OpenHouse"],
  },

  // ── Gym / Fitness ──────────────────────────────────────────────
  {
    id: "seg_gym_transform", type: "gym", label: "Gym — Transformation Offer", emoji: "🔥",
    prompt: "Drive trial memberships with a transformation hook and limited offer.",
    sampleCaption:
      "🔥 Your transformation starts today! First month 50% OFF + a FREE personal-training session. Walk in, we'll handle the rest. 💪 Limited slots this week.",
    hashtags: ["#FitnessGoals", "#Transformation", "#GymLife", "#NoExcuses", "#FitFam", "#StartToday"],
  },
  {
    id: "seg_gym_result", type: "gym", label: "Gym — Member Result", emoji: "🏆",
    prompt: "Show a real member result to build credibility.",
    sampleCaption:
      "🏆 Real results: our member dropped 12 kg in 90 days! Consistency + coaching = change. Tag someone who's ready to start their journey. 💪",
    hashtags: ["#Transformation", "#WeightLoss", "#FitFam", "#GymMotivation", "#Results", "#FitnessJourney"],
  },
  {
    id: "seg_gym_trial", type: "gym", label: "Gym — Free Trial Week", emoji: "🎟️",
    prompt: "Offer a free trial week to lower the barrier to entry.",
    sampleCaption:
      "🎟️ Try us FREE for a whole week! Top equipment, expert trainers and the friendliest gym floor in town. No pressure — just come move. Walk in today. 🏋️",
    hashtags: ["#FreeTrial", "#GymLife", "#Fitness", "#WorkoutMotivation", "#HealthyLifestyle", "#StartToday"],
  },

  // ── Salon / Beauty ─────────────────────────────────────────────
  {
    id: "seg_salon_package", type: "salon", label: "Salon — Glow-Up Package", emoji: "✨",
    prompt: "Highlight a seasonal package and easy booking.",
    sampleCaption:
      "✨ Festive glow-up package is here! Hair, skin & nails — pampered head to toe. Book your slot before they're gone. You deserve this. 💅",
    hashtags: ["#Salon", "#GlowUp", "#SelfCare", "#FestiveLook", "#BeautySalon", "#PamperYourself"],
  },
  {
    id: "seg_salon_bridal", type: "salon", label: "Salon — Bridal Transformation", emoji: "👰",
    prompt: "Show a bridal transformation reel for high engagement.",
    sampleCaption:
      "💄 Swipe to see this stunning bridal transformation by our team! Your big day deserves nothing less than perfect. Booking for the wedding season now. 👰",
    hashtags: ["#BridalMakeup", "#BridalLook", "#Salon", "#MakeupArtist", "#WeddingSeason", "#GlamSquad"],
  },
  {
    id: "seg_salon_tip", type: "salon", label: "Salon — Care Tip", emoji: "💆",
    prompt: "Share a quick beauty/hair-care tip as a save-worthy post.",
    sampleCaption:
      "💆 Frizz, meet your match! 3 quick monsoon hair-care tips from our stylists that actually work. Save this and thank us later. 💧",
    hashtags: ["#HairCare", "#BeautyTips", "#SelfCare", "#Salon", "#SkinCare", "#HairGoals"],
  },

  // ── Restaurant / Café ──────────────────────────────────────────
  {
    id: "seg_rest_special", type: "restaurant", label: "Restaurant — Weekend Special", emoji: "🍽️",
    prompt: "Feature a signature dish and a weekend offer.",
    sampleCaption:
      "🍽️ The weekend just got tastier! Chef's special thali + a FREE dessert, this Saturday & Sunday only. Bring the family — reserve your table now.",
    hashtags: ["#Foodie", "#WeekendSpecial", "#ChefSpecial", "#FoodLovers", "#DineIn", "#InstaFood"],
  },
  {
    id: "seg_rest_bts", type: "restaurant", label: "Restaurant — Behind The Kitchen", emoji: "🔥",
    prompt: "Show how a signature dish is made as a reel.",
    sampleCaption:
      "🔥 Ever wondered how our signature biryani is made? Here's a peek behind the kitchen. Tag a foodie friend who needs to taste this! 🍛",
    hashtags: ["#Biryani", "#FoodReel", "#BehindTheScenes", "#Foodie", "#FoodPorn", "#ChefLife"],
  },
  {
    id: "seg_rest_offer", type: "restaurant", label: "Restaurant — BOGO Offer", emoji: "🎉",
    prompt: "Run a limited buy-one-get-one offer to drive footfall.",
    sampleCaption:
      "🎉 Buy 1 Get 1 FREE on all starters this week! Bring the gang, taste it all. Dine-in only — don't miss it. 🍴",
    hashtags: ["#Offer", "#FoodieLife", "#BOGO", "#FamilyDinner", "#WeekendVibes", "#FoodDeals"],
  },
];
