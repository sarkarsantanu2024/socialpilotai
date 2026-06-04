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

// Indian festival calendar (2026) — fanned out to all tenants in Phase 3.
// Each entry is a ready-to-edit post: caption, hashtags, suggested format & image.
// {brand} is replaced with the active tenant's name when the card renders.
export const festivals: Festival[] = [
  {
    date: "2026-01-14", name: "Makar Sankranti", emoji: "🪁", blurb: "Kite-flying & harvest greetings.",
    postType: "image", imageQuery: "makar sankranti kites festival india",
    caption: "🪁 Happy Makar Sankranti from {brand}! May your year soar as high as your kites and your harvest be plentiful. Wishing you warmth, sweetness and new beginnings.",
    hashtags: ["#MakarSankranti", "#Sankranti2026", "#FestiveWishes", "#India"],
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
    caption: "🕉️ On this Maha Shivratri, may Lord Shiva bless you with strength, peace and prosperity. Warm wishes from the {brand} family.",
    hashtags: ["#MahaShivratri", "#HarHarMahadev", "#Blessings", "#Festival"],
  },
  {
    date: "2026-03-04", name: "Holi", emoji: "🎨", blurb: "Colourful, playful campaign.",
    postType: "carousel", imageQuery: "holi festival colors india celebration",
    caption: "🎨 Happy Holi from {brand}! May your life be as colourful and joyful as the festival itself. Play safe, spread love, and make memories! 💙💛❤️",
    hashtags: ["#Holi", "#HappyHoli", "#FestivalOfColours", "#Holi2026"],
  },
  {
    date: "2026-03-21", name: "Eid al-Fitr", emoji: "🌙", blurb: "Warm festive wishes.",
    postType: "image", imageQuery: "eid al fitr lantern celebration",
    caption: "🌙 Eid Mubarak from all of us at {brand}! May this Eid bring peace, happiness and prosperity to you and your loved ones.",
    hashtags: ["#EidMubarak", "#EidAlFitr", "#Eid2026", "#FestiveWishes"],
  },
  {
    date: "2026-04-14", name: "Ambedkar Jayanti", emoji: "📘", blurb: "Education & equality message.",
    postType: "image", imageQuery: "education books learning india",
    caption: "📘 On Ambedkar Jayanti, {brand} honours the visionary who championed education and equality for all. \"Education is the milk of a lioness.\" Let's keep learning.",
    hashtags: ["#AmbedkarJayanti", "#Education", "#Equality", "#JaiBhim"],
  },
  {
    date: "2026-06-15", name: "Father's Day", emoji: "👨‍👧", blurb: "Gratitude to dads.",
    postType: "image", imageQuery: "indian father child happy family",
    caption: "❤️ Behind every confident child is a parent who believed first. This Father's Day, {brand} salutes all the dads cheering from the sidelines. Happy Father's Day!",
    hashtags: ["#FathersDay", "#ThankYouDad", "#FamilyFirst"],
  },
  {
    date: "2026-08-15", name: "Independence Day", emoji: "🇮🇳", blurb: "Freedom & aspiration theme.",
    postType: "image", imageQuery: "india independence day flag tricolor",
    caption: "🇮🇳 Happy Independence Day! {brand} celebrates 79 years of freedom and the limitless potential of every Indian. Let's keep building a brighter tomorrow. Jai Hind!",
    hashtags: ["#IndependenceDay", "#15August", "#ProudIndian", "#JaiHind"],
  },
  {
    date: "2026-08-26", name: "Raksha Bandhan", emoji: "🪢", blurb: "Sibling-bond storytelling.",
    postType: "image", imageQuery: "raksha bandhan rakhi siblings india",
    caption: "🪢 Happy Raksha Bandhan from {brand}! Here's to the bond that protects, teases and loves unconditionally. Tag your sibling and celebrate! 💖",
    hashtags: ["#RakshaBandhan", "#Rakhi", "#SiblingLove", "#Rakhi2026"],
  },
  {
    date: "2026-09-05", name: "Teachers' Day", emoji: "🍎", blurb: "Celebrate your faculty!",
    postType: "carousel", imageQuery: "indian teacher classroom students",
    caption: "🍎 Happy Teachers' Day! At {brand}, our teachers don't just teach — they inspire, encourage and shape futures. Thank you to every mentor who makes a difference. 🙏",
    hashtags: ["#TeachersDay", "#ThankYouTeachers", "#5September", "#Gurus"],
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
    date: "2026-12-25", name: "Christmas", emoji: "🎄", blurb: "Cheerful seasonal greeting.",
    postType: "image", imageQuery: "christmas tree lights celebration",
    caption: "🎄 Merry Christmas from {brand}! Wishing you a season filled with joy, love and laughter. May your celebrations be merry and bright! ⭐",
    hashtags: ["#Christmas", "#MerryChristmas", "#Christmas2026", "#Festive"],
  },
];

export const segmentTemplates: SegmentTemplate[] = [
  {
    id: "seg_coaching",
    type: "coaching",
    label: "Coaching / Tuition",
    emoji: "📚",
    prompt: "Promote a results-driven batch with social proof and a demo-class CTA.",
    sampleCaption:
      "🎯 Results that speak! 9 of our 10 students improved by 2+ grades last term. Book a FREE demo class and see the difference. Limited seats!",
    hashtags: ["#Coaching", "#BoardExams", "#FreeDemoClass", "#StudySmart"],
  },
  {
    id: "seg_gym",
    type: "gym",
    label: "Gym / Fitness",
    emoji: "💪",
    prompt: "Drive trial memberships with a transformation hook and limited offer.",
    sampleCaption:
      "🔥 Summer body starts today! First month at 50% off + a free personal training session. Walk in, we'll handle the rest. 💪",
    hashtags: ["#FitnessGoals", "#GymLife", "#Transformation", "#NoExcuses"],
  },
  {
    id: "seg_playschool",
    type: "playschool",
    label: "Playschool / Daycare",
    emoji: "🧸",
    prompt: "Reassure parents with safety, play-based learning, and an open-house invite.",
    sampleCaption:
      "🧸 Where little ones learn through play! Safe, loving, and full of giggles. Join our open house this weekend and tour the campus with your child.",
    hashtags: ["#Playschool", "#EarlyLearning", "#HappyKids", "#OpenHouse"],
  },
  {
    id: "seg_abacus",
    type: "abacus",
    label: "Abacus / Mental Maths",
    emoji: "🧮",
    prompt: "Showcase speed-maths results and invite for a free assessment.",
    sampleCaption:
      "🧮 Watch a 7-year-old multiply faster than a calculator! Our abacus programme builds focus & confidence. Free assessment this week.",
    hashtags: ["#Abacus", "#MentalMaths", "#KidsLearning", "#BrainTraining"],
  },
  {
    id: "seg_salon",
    type: "salon",
    label: "Salon / Beauty",
    emoji: "💇",
    prompt: "Highlight a seasonal package and easy booking.",
    sampleCaption:
      "✨ Festive glow-up package is here! Hair, skin & nails — pampered head to toe. Book your slot before they're gone. 💅",
    hashtags: ["#Salon", "#GlowUp", "#SelfCare", "#FestiveLook"],
  },
  {
    id: "seg_restaurant",
    type: "restaurant",
    label: "Restaurant / Café",
    emoji: "🍽️",
    prompt: "Feature a signature dish and a weekend offer.",
    sampleCaption:
      "🍽️ The weekend just got tastier! Our chef's special thali + free dessert, this Saturday & Sunday only. Reserve your table now.",
    hashtags: ["#Foodie", "#WeekendVibes", "#ChefSpecial", "#PuneEats"],
  },
];
