// Per-tenant demo data. Each connected client business shows ITS OWN posts,
// analytics, leads and campaigns — selected by the active tenant id (cookie).
// Built from compact, business-type-specific specs so every screen is believable
// per client. In production this all comes from the tenant's Postgres rows.
import type {
  AdRecommendation,
  BusinessType,
  Campaign,
  ConnectedPage,
  Lead,
  Post,
  PostAnalytics,
} from "@/lib/types";
import { demoTenants, type DemoTenant } from "./data";

export interface TenantData {
  page: ConnectedPage;
  posts: Post[];
  analytics: PostAnalytics[];
  leads: Lead[];
  campaigns: Campaign[];
  recommendations: AdRecommendation[];
}

const pexels = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop`;

type PostSpec = {
  t: string;
  c: string;
  h: string[];
  type: Post["type"];
  status: Post["status"];
  music?: string;
  date?: string; // published/scheduled date
  source?: Post["source"];
};

type Spec = {
  category: string;
  followers: number;
  images: number[];
  posts: PostSpec[];
  leadNames: string[];
  leadInterests: string[];
  campaignName: string;
  promoteIndex: number; // which post the ad engine recommends
  objective: AdRecommendation["objective"];
  interests: string[];
};

// ── Business-type content specs ────────────────────────────────
const SPECS: Record<BusinessType, Spec> = {
  abacus: {
    category: "Education",
    followers: 4820,
    images: [8613095, 31864404, 1019470, 8612925, 6692923],
    posts: [
      { t: "Speed Maths Workshop — Free Demo", c: "🧮 Watch your child multiply faster than a calculator! Free abacus demo this Saturday at {brand}, {city}. Ages 5–14. Limited seats!", h: ["#Abacus", "#MentalMaths", "#FreeDemo", "#KidsLearning"], type: "image", status: "published", date: "2026-05-22T09:30:00+05:30" },
      { t: "50 sums in 2 minutes ⚡", c: "🔥 Our Level-5 student just solved 50 sums in under 2 minutes! Abacus builds focus, speed & confidence. Save & share 🔖", h: ["#Abacus", "#BrainTraining", "#SpeedMaths", "#ProudMoment"], type: "reel", status: "published", music: "Upbeat — 'Rise Up' (royalty-free)", date: "2026-05-27T18:00:00+05:30" },
      { t: "Level-up Certificate Day 🎉", c: "👏 Congratulations to our young champions who cleared Level 3 this term at {brand}! A proud moment for parents and kids alike. ✨", h: ["#Abacus", "#Achievement", "#ProudParents", "#KidsLearning"], type: "image", status: "published", date: "2026-06-01T11:00:00+05:30" },
      { t: "New batch starts Monday", c: "📣 A new abacus batch begins Monday at {brand}, {city}. Give your child the mental-maths edge. Enrol now — few seats left!", h: ["#AdmissionsOpen", "#Abacus", "#MentalMaths"], type: "image", status: "scheduled", date: "2026-06-08T10:00:00+05:30" },
      { t: "Why abacus before age 12?", c: "🧠 The brain is most receptive to abacus training before age 12. Here's why early starters build lifelong focus and number sense…", h: ["#Abacus", "#ParentingTips", "#EarlyLearning"], type: "text", status: "draft" },
    ],
    leadNames: ["Ananya Ghosh", "Rohit Saha", "Priya Dutta", "Imran Khan"],
    leadInterests: ["Abacus Level 1 (age 6)", "Free demo — Saturday", "Mental maths (age 9)", "Abacus Level 3"],
    campaignName: "50 Sums Reel — Leads",
    promoteIndex: 1,
    objective: "leads",
    interests: ["Parenting", "Education", "Kids activities", "Mental maths"],
  },
  gym: {
    category: "Gym/Physical Fitness Centre",
    followers: 6310,
    images: [5221029, 11661410, 10795063, 13534122, 11439928],
    posts: [
      { t: "Transformation Challenge 🔥", c: "🔥 Join the {brand} 8-week Transformation Challenge! First month 50% off + a free PT session. {city}, let's get to work. 💪", h: ["#FitnessGoals", "#Transformation", "#GymLife", "#NoExcuses"], type: "image", status: "published", date: "2026-05-22T07:00:00+05:30" },
      { t: "Member lost 12 kg in 90 days 🏆", c: "🏆 Real results: Rohit dropped 12 kg in 90 days at {brand}! Consistency + coaching = change. Your turn next. 💪", h: ["#Transformation", "#FitFam", "#GymMotivation", "#Results"], type: "reel", status: "published", music: "High-energy — 'Beast Mode' (royalty-free)", date: "2026-05-27T19:00:00+05:30" },
      { t: "Free Trial Week — limited slots", c: "🆓 Try {brand} free for a week! Top equipment, expert trainers, {city}'s friendliest gym floor. Walk in today.", h: ["#FreeTrial", "#GymLife", "#Fitness", "#StartToday"], type: "image", status: "published", date: "2026-06-01T08:00:00+05:30" },
      { t: "New weekend Zumba batch 💃", c: "💃 New weekend Zumba batch at {brand}! Burn calories, have fun, make friends. Starts Saturday — register now.", h: ["#Zumba", "#WeekendVibes", "#Fitness"], type: "image", status: "scheduled", date: "2026-06-07T17:00:00+05:30" },
      { t: "5 myths about strength training", c: "🏋️ 'Lifting makes you bulky'? Let's bust 5 common gym myths that hold beginners back…", h: ["#StrengthTraining", "#GymTips", "#Myths"], type: "text", status: "draft" },
    ],
    leadNames: ["Vikram Patil", "Sneha Rao", "Arjun Mehta", "Kavya Nair"],
    leadInterests: ["Transformation Challenge", "Free trial week", "Personal training", "Weekend Zumba"],
    campaignName: "Transformation Reel — Leads",
    promoteIndex: 1,
    objective: "leads",
    interests: ["Fitness and wellness", "Weight training", "Bodybuilding", "Healthy lifestyle"],
  },
  playschool: {
    category: "Preschool",
    followers: 3540,
    images: [4047662, 8612877, 30279471, 17332827, 29279438],
    posts: [
      { t: "Admissions Open 2026–27 🧸", c: "🧸 Admissions open at {brand}, {city}! Safe, loving, play-based learning for ages 2–5. Book your campus tour today. 💛", h: ["#Admissions", "#Playschool", "#EarlyLearning", "#HappyKids"], type: "image", status: "published", date: "2026-05-22T09:00:00+05:30" },
      { t: "A day at {brand} 🌈", c: "🌈 Finger-painting, story time and lots of giggles! A little peek into a happy day at {brand}. Where little ones love to learn.", h: ["#Playschool", "#LearningThroughPlay", "#HappyKids"], type: "image", status: "published", date: "2026-05-28T10:00:00+05:30" },
      { t: "Annual Day rehearsals 🎭", c: "🎭 Our tiny stars are rehearsing for Annual Day! Confidence starts early at {brand}. So proud of our little performers! 💕", h: ["#AnnualDay", "#Playschool", "#ProudMoments"], type: "reel", status: "published", music: "Cheerful — 'Sunny Day' (royalty-free)", date: "2026-06-01T16:00:00+05:30" },
      { t: "Free play-and-learn trial 🎨", c: "🎨 Free play-and-learn trial this Saturday at {brand}, {city}! Bring your little one for a fun-filled morning. Limited spots.", h: ["#FreeTrial", "#Playschool", "#OpenHouse"], type: "image", status: "scheduled", date: "2026-06-07T09:30:00+05:30" },
      { t: "Why play-based learning works", c: "🧩 Play isn't a break from learning — it IS learning. Here's how {brand} nurtures curiosity, language and confidence…", h: ["#EarlyLearning", "#Parenting", "#Playschool"], type: "text", status: "draft" },
    ],
    leadNames: ["Meera Iyer", "Sanjay Reddy", "Fatima Sheikh", "Deepak Kumar"],
    leadInterests: ["Admission — age 3", "Campus tour", "Free trial — Saturday", "Daycare timings"],
    campaignName: "Admissions 2026 — Leads",
    promoteIndex: 0,
    objective: "leads",
    interests: ["Parenting", "Toddlers", "Early childhood education", "Daycare"],
  },
  // Fallbacks for types that aren't demo tenants but could be set in Settings.
  coaching: {
    category: "Education",
    followers: 4820,
    images: [35745592, 18870256, 35745583, 8617762, 8618062],
    posts: [
      { t: "Class 10 Crash Course — Last 5 Seats", c: "🎯 Crack your boards with confidence! Class 10 crash course at {brand}, {city}. Small batches, daily doubt-clearing. Only 5 seats left!", h: ["#Coaching", "#Class10", "#BoardExams", "#StudySmart"], type: "image", status: "published", date: "2026-05-22T09:30:00+05:30" },
      { t: "60-second study hack ⚡", c: "📚 Struggling to remember formulas? Try the Feynman technique — teach it to a friend in plain words. Students swear by it! 🔖", h: ["#StudyHacks", "#ExamTips", "#Coaching"], type: "reel", status: "published", music: "Lo-fi — 'Focus Flow'", date: "2026-05-27T18:00:00+05:30" },
      { t: "Topper spotlight — 96.4% 👏", c: "👏 Congratulations to our topper who scored 96.4%! Two years of hard work at {brand}. We're so proud. ✨", h: ["#TopperSpotlight", "#Results", "#ProudMoment"], type: "image", status: "published", date: "2026-06-01T11:00:00+05:30" },
      { t: "Free demo class this Saturday", c: "🆓 Bring your child to a FREE demo class this Saturday at {brand}, {city}. Meet the teachers, see a live session.", h: ["#FreeDemo", "#Coaching", "#Admissions"], type: "image", status: "scheduled", date: "2026-06-07T10:00:00+05:30" },
      { t: "Admissions open 2026–27", c: "📣 Admissions open for 2026–27! Classes 6 to 12, all boards. Comment 'INFO' for the schedule & fees.", h: ["#AdmissionsOpen", "#Coaching"], type: "text", status: "draft" },
    ],
    leadNames: ["Priya Deshmukh", "Rohan Kulkarni", "Sneha Patil", "Imran Shaikh"],
    leadInterests: ["Class 9 — Maths & Science", "Class 12 — PCM", "Free demo class", "Class 10 — full syllabus"],
    campaignName: "Study Hack Reel — Leads",
    promoteIndex: 1,
    objective: "leads",
    interests: ["Parenting", "Education", "Tutoring", "Exam preparation"],
  },
  salon: {
    category: "Beauty Salon",
    followers: 5120,
    images: [17548721, 20826575, 7755209, 11876088, 36874235],
    posts: [
      { t: "Festive Glow-Up Package ✨", c: "✨ Festive glow-up package is here at {brand}, {city}! Hair, skin & nails — pampered head to toe. Book before slots fill. 💅", h: ["#Salon", "#GlowUp", "#FestiveLook", "#SelfCare"], type: "image", status: "published", date: "2026-05-22T11:00:00+05:30" },
      { t: "Bridal transformation 💄", c: "💄 Swipe to see this stunning bridal transformation by our team at {brand}! Your big day deserves the best. 👰", h: ["#BridalMakeup", "#Salon", "#Transformation"], type: "reel", status: "published", music: "Elegant — 'Golden Hour'", date: "2026-05-28T17:00:00+05:30" },
      { t: "Weekend Hair-Spa Offer", c: "💆 Weekend hair-spa offer at {brand}! Relax, rejuvenate, repeat. {city}, treat yourself this weekend.", h: ["#HairSpa", "#SelfCare", "#WeekendVibes"], type: "image", status: "published", date: "2026-06-01T12:00:00+05:30" },
      { t: "New-season hairstyles", c: "💇 New-season hairstyle trends just dropped at {brand}! Book a consultation and find your look.", h: ["#Hairstyle", "#Salon", "#Trends"], type: "image", status: "scheduled", date: "2026-06-07T11:00:00+05:30" },
      { t: "5 monsoon hair-care tips", c: "🌧️ Frizz, meet your match. 5 monsoon hair-care tips from the {brand} stylists…", h: ["#HairCare", "#Salon", "#Tips"], type: "text", status: "draft" },
    ],
    leadNames: ["Riya Kapoor", "Neha Verma", "Pooja Singh", "Anjali Roy"],
    leadInterests: ["Bridal package", "Hair spa", "Glow-up package", "Hair colour"],
    campaignName: "Bridal Reel — Engagement",
    promoteIndex: 1,
    objective: "engagement",
    interests: ["Beauty", "Bridal", "Self care", "Fashion"],
  },
  restaurant: {
    category: "Restaurant",
    followers: 7280,
    images: [8818723, 29148133, 17223838, 35008222],
    posts: [
      { t: "Weekend Special Thali 🍽️", c: "🍽️ The weekend just got tastier! Chef's special thali + free dessert at {brand}, {city}, this Sat & Sun only. Reserve now.", h: ["#Foodie", "#WeekendSpecial", "#ChefSpecial"], type: "image", status: "published", date: "2026-05-22T12:30:00+05:30" },
      { t: "Behind the kitchen 🔥", c: "🔥 Ever wondered how our signature biryani is made? A peek behind the {brand} kitchen. Tag a foodie friend! 🍛", h: ["#Biryani", "#FoodReel", "#Restaurant"], type: "reel", status: "published", music: "Fun — 'Spice Market'", date: "2026-05-28T19:30:00+05:30" },
      { t: "Buy 1 Get 1 on Starters", c: "🎉 BOGO on all starters this week at {brand}, {city}! Bring the family, taste it all. Dine-in only.", h: ["#Offer", "#Foodie", "#FamilyDinner"], type: "image", status: "published", date: "2026-06-01T13:00:00+05:30" },
      { t: "New summer menu ☀️", c: "☀️ Our new summer menu is here at {brand}! Cool coolers, fresh flavours. Come try it this weekend.", h: ["#NewMenu", "#SummerSpecial", "#Foodie"], type: "image", status: "scheduled", date: "2026-06-07T12:00:00+05:30" },
      { t: "Now taking party bookings", c: "🎂 Planning a celebration? {brand} now takes party & event bookings. DM us for packages.", h: ["#PartyBooking", "#Restaurant"], type: "text", status: "draft" },
    ],
    leadNames: ["Karan Malhotra", "Divya Shah", "Aman Gupta", "Ritu Joshi"],
    leadInterests: ["Party booking (20 pax)", "Weekend thali", "Catering enquiry", "Table reservation"],
    campaignName: "Biryani Reel — Engagement",
    promoteIndex: 1,
    objective: "engagement",
    interests: ["Food and drink", "Dining out", "Foodies", "Family"],
  },
};

function build(tenant: DemoTenant): TenantData {
  const spec = SPECS[tenant.profile.type] ?? SPECS.coaching;
  const { name, city } = tenant.profile;
  const fill = (s: string) => s.replaceAll("{brand}", name).replaceAll("{city}", city);
  const pageId = `pg_${tenant.id}`;

  const posts: Post[] = spec.posts.map((p, i) => {
    const id = `${tenant.id}_post_${i + 1}`;
    const post: Post = {
      id,
      type: p.type,
      status: p.status,
      title: fill(p.t),
      caption: fill(p.c),
      hashtags: p.h,
      music: p.music,
      assetUrl: pexels(spec.images[i % spec.images.length]),
      source: p.source ?? "studio",
    };
    if (p.status === "published") {
      post.publishedAt = p.date;
      post.fbPostId = `${pageId}_${1001 + i}`; // demo id (not a real FB post)
    }
    if (p.status === "scheduled") post.scheduledAt = p.date;
    return post;
  });

  // Deterministic analytics for published posts.
  const analytics: PostAnalytics[] = posts
    .filter((p) => p.status === "published")
    .map((p, idx) => {
      const reach = Math.round(spec.followers * (1.4 + idx * 0.7));
      const isReel = p.type === "reel";
      const impressions = Math.round(reach * 1.5);
      const reactions = Math.round(reach * (isReel ? 0.08 : 0.05));
      const comments = Math.round(reach * 0.012);
      const shares = Math.round(reach * (isReel ? 0.02 : 0.008));
      const videoViews = isReel ? Math.round(reach * 0.85) : 0;
      const clicks = Math.round(reach * 0.02);
      const engagementRate = Number((((reactions + comments + shares) / reach) * 100).toFixed(1));
      return { postId: p.id, reach, impressions, reactions, comments, shares, videoViews, clicks, engagementRate };
    });

  const promote = posts[spec.promoteIndex] ?? posts[0];
  const campaign: Campaign = {
    id: `${tenant.id}_camp_1`,
    name: `${spec.campaignName} (Sandbox)`,
    fbCampaignId: `2385990118${tenant.id.length}820341`,
    adsetId: `2385990118${tenant.id.length}820342`,
    adId: `2385990118${tenant.id.length}820343`,
    objective: spec.objective,
    status: "COMPLETED",
    isSandbox: true,
    dailyBudget: 200,
    days: 5,
    spend: 742,
    reach: Math.round(spec.followers * 2.3),
    results: spec.objective === "leads" ? 28 : 1156,
    costPerResult: spec.objective === "leads" ? 26.5 : 0.64,
    createdAt: "2026-05-20T10:00:00+05:30",
  };
  // A PAUSED campaign awaiting "Go live" (created from an approved recommendation).
  const pausedCampaign: Campaign = {
    id: `${tenant.id}_camp_2`,
    name: `${promote.title.slice(0, 32)} — ${spec.objective} (Sandbox)`,
    fbCampaignId: `2385990118${tenant.id.length}820351`,
    adsetId: `2385990118${tenant.id.length}820352`,
    adId: `2385990118${tenant.id.length}820353`,
    objective: spec.objective,
    status: "PAUSED",
    isSandbox: true,
    dailyBudget: 250,
    days: 7,
    spend: 0,
    reach: 0,
    results: 0,
    costPerResult: 0,
    createdAt: "2026-06-02T15:20:00+05:30",
  };

  const leads: Lead[] = spec.leadNames.map((nm, i) => ({
    id: `${tenant.id}_lead_${i + 1}`,
    campaignId: campaign.id,
    campaignName: campaign.name,
    name: nm,
    phone: `+91 9${String(80000000 + i * 1234567).slice(0, 9)}`,
    email: `${nm.split(" ")[0].toLowerCase()}@example.com`,
    interest: spec.leadInterests[i] ?? "General enquiry",
    createdAt: `2026-05-2${2 + i}T1${i}:15:00+05:30`,
    isTest: true,
  }));

  const top = analytics.slice().sort((a, b) => b.engagementRate - a.engagementRate)[0];
  const topPost = posts.find((p) => p.id === top?.postId) ?? promote;
  const recommendations: AdRecommendation[] = [
    {
      id: `${tenant.id}_rec_1`,
      postId: topPost.id,
      postTitle: topPost.title,
      postThumb: topPost.assetUrl,
      score: 90,
      objective: spec.objective,
      rationale: `This is your top organic performer. Promoting it for ${spec.objective} should convert interest into ${spec.objective === "leads" ? "enquiries" : "reach"} at a low cost in ${city}.`,
      audience: { locations: [city], ageMin: 24, ageMax: 48, interests: spec.interests },
      dailyBudget: 250,
      days: 7,
      expected:
        spec.objective === "leads"
          ? { reach: "18,000 – 26,000", results: "30 – 60 leads", costPerResult: "₹25 – ₹40 / lead" }
          : { reach: "20,000 – 30,000", results: "1,000 – 1,600 engagements", costPerResult: "₹0.5 – ₹0.8 / eng." },
      status: "pending",
    },
  ];

  const page: ConnectedPage = {
    id: pageId,
    pageId,
    name: name,
    category: spec.category,
    followers: spec.followers,
    connected: true,
    avatar: pexels(spec.images[0]),
  };

  return { page, posts, analytics, leads, campaigns: [pausedCampaign, campaign], recommendations };
}

const CACHE = new Map<string, TenantData>();

export function getTenantData(tenantId: string): TenantData {
  const tenant = demoTenants.find((t) => t.id === tenantId) ?? demoTenants[0];
  const cached = CACHE.get(tenant.id);
  if (cached) return cached;
  const data = build(tenant);
  CACHE.set(tenant.id, data);
  return data;
}

// Map a Page name/category to a business type, so the ads/leads SAMPLES match
// the connected client (e.g. an abacus Page gets abacus-themed sample ads/leads).
export function guessBusinessType(text: string): BusinessType | null {
  const s = text.toLowerCase();
  if (/abacus|mental ?math/.test(s)) return "abacus";
  if (/gym|fitness|workout|crossfit/.test(s)) return "gym";
  if (/playschool|preschool|daycare|kindergarten|nursery/.test(s)) return "playschool";
  if (/salon|beauty|spa|hair/.test(s)) return "salon";
  if (/restaurant|cafe|food|dining|kitchen|bakery/.test(s)) return "restaurant";
  if (/coaching|tuition|academy|school|institute|education|classes/.test(s)) return "coaching";
  return null;
}

// Build a themed sample dataset for a business type, named after the live Page.
export function buildForType(type: BusinessType, name: string): TenantData {
  return build({
    id: `live_${type}`,
    profile: { id: `biz_${type}`, name, type, city: "your area", language: "English", tone: "Friendly, professional", audience: "Local customers" },
    kit: { logoText: name, primary: "#244fdb", secondary: "#0ea5e9", accent: "#f59e0b", font: "Poppins" },
  });
}
