import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiFileText,
  FiImage,
  FiMapPin,
  FiMessageCircle,
  FiPhoneCall,
  FiSearch,
  FiShield,
  FiSkipForward,
  FiStar,
  FiTrendingUp,
  FiUpload,
  FiUsers,
  FiVideo,
  FiVolume2,
  FiVolumeX,
  FiXCircle,
} from "react-icons/fi";
import Modal from "../../components/common/Modal.jsx";
import useAuth from "../../hooks/useAuth.js";
import {
  studentCreateAd,
  studentCreateAdPlanOrder,
  studentGetAdsStatus,
  studentHome,
  studentVerifyAdPlanPayment,
} from "../../services/studentService.js";
import { uploadAdMedia, uploadAdMediaFromUrl } from "../../services/uploadService.js";
import { toAbsoluteMediaUrl } from "../../utils/media.js";
import { loadRazorpayCheckout } from "../../utils/razorpay.js";
import slide1 from "../../assets/images/student-home/slider-1.png";
import slide2 from "../../assets/images/student-home/slider-2.png";
import slide3 from "../../assets/images/student-home/slider-3.png";
import internshipBanner from "../../assets/images/student-home/internship-banner.png";
import govtBanner from "../../assets/images/student-home/govt-banner.png";

const baseCard = "rounded-[18px] border border-white/70 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]";
const defaultAccess = { canPost: false, planStatus: "none", planName: "Ads Starter Plan" };
const AD_SKIP_DELAY_MS = 3000;
const AD_BANNER_DURATION_MS = 6000;

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function money(min, max, suffix = "") {
  const a = Number(min || 0);
  const b = Number(max || 0);
  if (!a && !b) return "";
  if (a && b) return `Rs ${a.toLocaleString()} - Rs ${b.toLocaleString()}${suffix}`;
  return `Rs ${(a || b).toLocaleString()}${suffix}`;
}

function mapJob(job) {
  if (!job) return null;
  return {
    id: job._id || job.id,
    company: job.companyName || job.company?.name || job.company || "Company",
    companyLogo: job.companyLogo || job.logoUrl || job.company?.logoUrl || "",
    title: job.title || job.jobTitle || "Job",
    location: job.location || [job.city, job.state].filter(Boolean).join(", ") || "India",
    salary:
      job.salaryText ||
      money(job.salaryMin, job.salaryMax, "/mo") ||
      job.salary ||
      "Rs 20,000 - Rs 30,000/mo",
    rating: Number(job.rating || 4.4),
  };
}

function mapIntern(item) {
  if (!item) return null;
  return {
    id: item._id || item.id,
    title: item.title || "Internship",
    location: item.location || [item.city, item.state].filter(Boolean).join(", ") || "India",
    stipend:
      item.stipendText ||
      money(item.stipendMin, item.stipendMax, "/mo") ||
      "Rs 15,000/mo",
  };
}

function mapAd(ad) {
  if (!ad) return null;
  return {
    id: ad.id || ad._id || "",
    title: ad.title || "Sponsored Ad",
    description: ad.description || "",
    mediaType: ad.mediaType || "banner",
    mediaUrl: toAbsoluteMediaUrl(ad.mediaUrl) || "",
    mediaResourceType: ad.mediaResourceType || "",
    ctaLabel: ad.ctaLabel || "Learn More",
    targetUrl: ad.targetUrl || "",
    advertiserName: ad.advertiserName || ad.userName || "Sponsored",
  };
}

function isVideoAd(ad) {
  return String(ad?.mediaResourceType || ad?.mediaType || "").toLowerCase() === "video";
}

function defaultAdForm() {
  return {
    title: "",
    description: "",
    mediaType: "banner",
    ctaLabel: "Learn More",
    targetUrl: "",
    mediaMode: "device",
    mediaLink: "",
    file: null,
  };
}

function isMongoId(value) {
  return /^[a-fA-F0-9]{24}$/.test(String(value || ""));
}

export default function Home() {
  const nav = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isStudentView = location.pathname.startsWith("/student");
  const withBase = (path) => `${isStudentView ? "/student" : ""}${path}`;

  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [q, setQ] = useState("");
  const [notice, setNotice] = useState(null);
  const [adOpen, setAdOpen] = useState(false);
  const [adView, setAdView] = useState("options");
  const [adSubmitting, setAdSubmitting] = useState(false);
  const [assetUploading, setAssetUploading] = useState(false);
  const [adPlans, setAdPlans] = useState([]);
  const [adForm, setAdForm] = useState(defaultAdForm());
  const [planForm, setPlanForm] = useState({
    planId: "",
  });
  const [data, setData] = useState({
    jobs: [],
    internships: [],
    stats: {},
    banners: [],
    announcements: [],
    ads: [],
  });
  const [adStatus, setAdStatus] = useState({
    access: defaultAccess,
    latestRequest: null,
  });

  const slides = useMemo(() => {
    if (data.banners?.length) {
      return data.banners.slice(0, 6).map((item, index) => ({
        title: item.title || "Featured Opportunity",
        subtitle: item.subtitle || item.description || "Discover opportunities tailored for students.",
        cta: "Explore Now",
        image: toAbsoluteMediaUrl(item.imageUrl) || [slide1, slide2, slide3][index % 3],
        tone: index % 2 ? "blue" : "orange",
        linkUrl: item.linkUrl || "",
      }));
    }
    return [
      { title: "10,000+ Jobs", subtitle: "Find your next role with one smart search.", cta: "Browse Jobs", image: slide1, tone: "orange", linkUrl: "/student/jobs" },
      { title: "Internships", subtitle: "Build skills with fresh openings.", cta: "Explore", image: slide2, tone: "orange", linkUrl: "/student/internship" },
      { title: "One Click Apply", subtitle: "Shortlist and apply from one place.", cta: "Apply Now", image: slide3, tone: "blue", linkUrl: "/student/jobs" },
    ];
  }, [data.banners]);

  const featuredJobs = useMemo(() => (data.jobs || []).slice(0, 4), [data.jobs]);
  const homeAds = useMemo(() => (data.ads || []).slice(0, 6), [data.ads]);
  const welcomeName = useMemo(
    () => (user?.name || user?.fullName || user?.username || "Student").trim() || "Student",
    [user],
  );

  useEffect(() => {
    const timer = setInterval(() => setActiveSlide((prev) => (prev + 1) % slides.length), 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 3200);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!isStudentView) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [homeRes, adsRes] = await Promise.all([studentHome(), studentGetAdsStatus()]);
        if (!mounted) return;
        const payload = homeRes?.data || {};
        setData({
          jobs: Array.isArray(payload.jobs) ? payload.jobs.map(mapJob).filter(Boolean) : [],
          internships: Array.isArray(payload.internships) ? payload.internships.map(mapIntern).filter(Boolean) : [],
          stats: payload.stats || { liveJobs: 10000, topCompanies: 500, studentsHired: 50000 },
          banners: Array.isArray(payload.banners) ? payload.banners : [],
          announcements: Array.isArray(payload.announcements) ? payload.announcements : [],
          ads: Array.isArray(payload.ads) ? payload.ads.map(mapAd).filter(Boolean) : [],
        });
        setAdStatus({
          access: adsRes?.data?.access || defaultAccess,
          latestRequest: adsRes?.data?.latestRequest || null,
        });
        const nextPlans = Array.isArray(adsRes?.data?.plans) ? adsRes.data.plans : [];
        setAdPlans(nextPlans);
        setPlanForm((prev) => ({
          ...prev,
          planId: prev.planId || nextPlans.find((item) => item.highlight)?.id || nextPlans[0]?.id || "",
        }));
      } catch (e) {
        console.error("studentHome error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isStudentView]);

  const ping = (type, message) => setNotice({ type, message });
  const openLink = (url) => {
    const target = String(url || "").trim();
    if (!target) return nav(withBase("/jobs"));
    if (/^https?:\/\//i.test(target)) return window.open(target, "_blank", "noopener,noreferrer");
    return nav(target);
  };
  const runSearch = () =>
    nav(q.trim() ? `${withBase("/jobs")}?q=${encodeURIComponent(q.trim())}` : withBase("/jobs"));
  const openDrawer = () => {
    setAdView("options");
    setAdOpen(true);
  };
  const openPostFlow = () => {
    if (adStatus?.access?.canPost && adStatus?.access?.planStatus === "approved") {
      setAdView("post");
      return;
    }
    setAdView("buy");
    ping("error", "Buy a plan first. After admin approval, you can post your ad.");
  };
  const buyPlan = async () => {
    try {
      setAdSubmitting(true);
      const selectedPlan = adPlans.find(
        (item) => String(item.id || item._id || "") === String(planForm.planId || ""),
      );
      if (!selectedPlan) return ping("error", "Choose an ad plan first.");
      const orderRes = await studentCreateAdPlanOrder({
        planId: selectedPlan.id || selectedPlan._id,
        planName: selectedPlan.name,
      });
      const Razorpay = await loadRazorpayCheckout();
      await new Promise((resolve, reject) => {
        const instance = new Razorpay({
          key: orderRes?.data?.keyId,
          amount: orderRes?.data?.order?.amount,
          currency: orderRes?.data?.order?.currency || "INR",
          name: "JobGateway",
          description: selectedPlan.name,
          order_id: orderRes?.data?.order?.id,
          prefill: {
            name: orderRes?.data?.user?.name || "",
            email: orderRes?.data?.user?.email || "",
          },
          handler: async (response) => {
            try {
              await studentVerifyAdPlanPayment({
                paymentId: orderRes?.data?.payment?.id,
                ...response,
              });
              resolve(response);
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled.")),
          },
          theme: {
            color: "#F97316",
          },
        });
        if (!instance) {
          reject(new Error("Razorpay checkout failed to initialize."));
          return;
        }
        instance.open();
      });
      setAdStatus((prev) => ({
        ...prev,
        access: {
          ...(prev.access || {}),
          canPost: true,
          planStatus: "approved",
          planName: selectedPlan.name,
        },
        latestRequest: {
          ...(prev.latestRequest || {}),
          planName: selectedPlan.name,
          amount: `Rs ${selectedPlan.price}`,
          status: "approved",
        },
      }));
      setAdView("post");
      ping("success", "Payment verified. You can post your ad now.");
    } catch (e) {
      console.error("buyPlan error:", e);
      ping("error", e?.response?.data?.message || e?.message || "Failed to buy ad plan.");
    } finally {
      setAdSubmitting(false);
    }
  };
  const postAd = async () => {
    try {
      if (!adForm.title.trim()) return ping("error", "Ad title is required.");
      setAdSubmitting(true);
      setAssetUploading(true);
      const uploadRes =
        adForm.mediaMode === "device"
          ? adForm.file
            ? await uploadAdMedia(adForm.file)
            : null
          : String(adForm.mediaLink || "").trim()
          ? await uploadAdMediaFromUrl(adForm.mediaLink.trim())
          : null;
      if (!uploadRes) return ping("error", adForm.mediaMode === "device" ? "Choose a file from this device." : "Enter a valid media link.");
      const media = uploadRes.data || {};
      const res = await studentCreateAd({
        title: adForm.title,
        description: adForm.description,
        mediaType: adForm.mediaType,
        sourceType: adForm.mediaMode === "device" ? "upload" : "link",
        mediaUrl: media.mediaUrl,
        mediaPublicId: media.publicId,
        mediaResourceType: media.resourceType,
        mimeType: media.mimeType,
        ctaLabel: adForm.ctaLabel,
        targetUrl: adForm.targetUrl,
      });
      const nextAd = mapAd(res?.data?.ad);
      setData((prev) => ({ ...prev, ads: nextAd ? [nextAd, ...(prev.ads || [])] : prev.ads }));
      setAdForm(defaultAdForm());
      setAdOpen(false);
      ping("success", res?.data?.message || "Ad posted successfully.");
    } catch (e) {
      ping("error", e?.response?.data?.message || e?.message || "Failed to post ad.");
    } finally {
      setAssetUploading(false);
      setAdSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50">
      {/* 3D Animated Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {notice && (
          <motion.div
            className="pointer-events-auto fixed left-1/2 top-20 z-[70] w-[min(92vw,460px)] -translate-x-1/2"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`rounded-2xl border px-4 py-3 shadow-[0_20px_50px_rgba(15,23,42,0.18)] backdrop-blur-xl ${notice.type === "success" ? "border-emerald-200 bg-emerald-50/90 text-emerald-800" : "border-rose-200 bg-rose-50/90 text-rose-800"}`}>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg">{notice.type === "success" ? <FiCheckCircle /> : <FiXCircle />}</span>
                <div>
                  <p className="text-sm font-extrabold">{notice.type === "success" ? "Success" : "Error"}</p>
                  <p className="text-sm font-medium">{notice.message}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full px-4 pb-14 pt-6 sm:px-6 lg:px-8">
        {/* Premium Hero Slider with 3D Effects */}
        <motion.section
          className="rounded-[22px] bg-white/40 p-4 shadow-[0_25px_50px_rgba(15,23,42,0.1)] backdrop-blur-2xl border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative overflow-hidden rounded-[18px] border border-white/60 bg-gradient-to-br from-white via-blue-50/30 to-orange-50/30">
            <div className="relative h-[220px] w-full sm:h-[240px] md:h-[280px]">
              <AnimatePresence mode="wait">
                {slides.map((s, idx) =>
                  idx === activeSlide ? (
                    <motion.div
                      key={idx}
                      className="absolute inset-0 w-full h-full"
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.6 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[#fff7ed] via-white to-[#eef4ff]" />
                      <div className="relative grid h-full grid-cols-1 items-center gap-6 p-5 md:grid-cols-2 md:p-7">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                          <h2 className="text-[22px] font-extrabold leading-tight text-slate-900 sm:text-[26px]">
                            <span className="bg-gradient-to-r from-[#f97316] to-[#ea580c] bg-clip-text text-transparent">{s.title}</span>
                          </h2>
                          <p className="mt-2 text-[12px] font-semibold text-slate-600">{s.subtitle}</p>
                          <motion.button
                            type="button"
                            onClick={() => openLink(s.linkUrl)}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className={`mt-4 inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-[12px] font-extrabold text-white shadow-lg transition-all ${
                              s.tone === "blue"
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-blue-500/30"
                                : "bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-orange-500/30"
                            }`}
                          >
                            {s.cta}
                            <FiArrowRight className="ml-2" />
                          </motion.button>
                        </motion.div>
                        <motion.div
                          className="hidden h-full items-center justify-end md:flex"
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <motion.img
                            src={s.image}
                            alt=""
                            className="h-[190px] w-auto object-contain"
                            draggable="false"
                            initial={{ scale: 0.8, rotate: -5 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ duration: 0.6 }}
                          />
                        </motion.div>
                      </div>
                    </motion.div>
                  ) : null
                )}
              </AnimatePresence>

              <motion.button
                type="button"
                onClick={() => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                whileHover={{ scale: 1.1, x: -3 }}
                whileTap={{ scale: 0.9 }}
                className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 hover:bg-white text-slate-700 backdrop-blur-sm transition-all shadow-md"
              >
                <FiChevronLeft />
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setActiveSlide((prev) => (prev + 1) % slides.length)}
                whileHover={{ scale: 1.1, x: 3 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 hover:bg-white text-slate-700 backdrop-blur-sm transition-all shadow-md"
              >
                <FiChevronRight />
              </motion.button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-2 rounded-full transition-all ${idx === activeSlide ? "w-6 bg-[#f97316]" : "w-2 bg-slate-300"}`}
                    whileHover={{ scale: 1.2 }}
                  />
                ))}
              </div>
            </div>
          </div>

          <motion.div
            className="mt-4 flex flex-col gap-3 rounded-[16px] bg-white/70 px-4 py-4 shadow-[0_10px_25px_rgba(15,23,42,0.05)] backdrop-blur md:flex-row md:items-center md:justify-between border border-white/50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 text-[#F97316]"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <FiSearch />
              </motion.div>
              <div>
                <p className="text-[12px] font-extrabold text-slate-900">Search Jobs</p>
                <p className="text-[11px] font-semibold text-slate-500">Find jobs by role, skills, & company</p>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-2 md:max-w-[520px]">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && runSearch()}
                placeholder="Job Title, Skills, or Company"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-200/50 transition-all"
              />
              <motion.button
                type="button"
                onClick={runSearch}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#F97316] to-[#ea580c] px-5 text-sm font-extrabold text-white shadow-lg hover:shadow-orange-500/30 transition-all"
              >
                Search
              </motion.button>
            </div>
          </motion.div>
        </motion.section>

        <div className={homeAds.length ? "grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start" : "grid grid-cols-1"}>
          <div>
            {/* Welcome Section */}
            <motion.section
              className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className={`${baseCard} flex items-center gap-4 p-4 hover:shadow-[0_25px_50px_rgba(15,23,42,0.12)] transition-all`}
              whileHover={{ y: -2 }}
            >
              <motion.div
                className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-100 to-blue-100 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.4 }}
              >
                <div className="text-lg font-extrabold text-[#F97316]">{initials(welcomeName)}</div>
              </motion.div>
              <div className="flex-1">
                <h3 className="text-[20px] font-extrabold text-slate-900">Welcome Back, {welcomeName}!</h3>
                <p className="mt-0.5 text-[12px] font-semibold text-slate-600">Ready to explore opportunities?</p>
              </div>
            </motion.div>
          </motion.div>
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="grid grid-cols-3 gap-3">
              <StatBox icon={<FiBriefcase className="text-[18px]" />} value={`${Number(data.stats?.liveJobs || 10000).toLocaleString()}+`} label="Live Jobs" delay={0.4} />
              <StatBox icon={<FiTrendingUp className="text-[18px]" />} value={`${Number(data.stats?.topCompanies || 500).toLocaleString()}+`} label="Top Companies" delay={0.5} />
              <StatBox icon={<FiShield className="text-[18px]" />} value={`${Number(data.stats?.studentsHired || 50000).toLocaleString()}+`} label="Students Hired" delay={0.6} />
            </div>
          </motion.div>
            </motion.section>

            {/* Featured Jobs */}
            <motion.section className="mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[20px] font-extrabold text-slate-900">Featured Jobs</h2>
            <motion.button type="button" onClick={() => nav(withBase("/jobs"))} whileHover={{ x: 5 }} className="inline-flex items-center gap-1 text-[13px] font-extrabold text-[#F97316] hover:text-orange-600 transition-colors">
              View All <FiArrowRight />
            </motion.button>
          </div>
          {loading ? (
            <div className={`${baseCard} p-6 text-sm font-semibold text-slate-600`}>
              <div className="flex items-center gap-2">
                <motion.div className="h-4 w-4 rounded-full bg-orange-500" animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }} />
                Loading jobs...
              </div>
            </div>
          ) : (
            <motion.div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {featuredJobs.map((job, idx) => (
                <JobCard key={job.id || idx} job={job} onClick={() => (isMongoId(job.id) ? nav(withBase(`/jobs/${job.id}`)) : nav(withBase("/jobs")))} delay={0.5 + idx * 0.1} />
              ))}
            </motion.div>
          )}
            </motion.section>

            {/* Internships & Government Jobs */}
            <motion.section className="mt-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <h3 className="mb-4 text-center text-[22px] font-extrabold text-slate-900">Internships & Government Jobs</h3>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BigBannerCard title="Internships" subtitle={`${Math.max(30, data.internships?.length || 0)}+ Open`} button="Discover" image={internshipBanner} tone="orange" onClick={() => nav(withBase("/internship"))} delay={0.6} />
            <BigBannerCard title="Government Jobs" subtitle="100+ Latest Openings" button="Explore" image={govtBanner} tone="green" onClick={() => nav(withBase("/government"))} delay={0.7} />
          </div>
            </motion.section>

            {/* Quick Actions */}
            <motion.section className="mt-8 rounded-[28px] border border-slate-200/60 bg-white/50 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Quick Actions</p>
              <h3 className="mt-2 text-[22px] font-extrabold text-slate-900">What's Next?</h3>
            </div>
            <motion.div className="hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-orange-100/50 px-4 py-3 lg:block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
              <p className="text-xs font-black uppercase tracking-widest text-orange-700">Status</p>
              <motion.p className="mt-1 text-sm font-bold capitalize text-slate-900" key={adStatus?.access?.planStatus} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                {adStatus?.access?.planStatus || "none"}
              </motion.p>
            </motion.div>
          </div>
          <motion.div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ActionCard icon={<FiBriefcase />} title="Apply Job" subtitle="Browse & apply to jobs" description="Find perfect job matches." cta="Go to Jobs" accent="from-[#fff1e6] to-[#ffe3cf]" onClick={() => nav("/student/jobs")} chips={["Jobs", "Apply", "Track"]} delay={0.8} />
            <ActionCard icon={<FiUsers />} title="Company Login" subtitle="For recruiters & teams" description="Start hiring talented students." cta="Sign In" accent="from-[#e8f1ff] to-[#d9ebff]" onClick={() => nav("/company/login")} chips={["Recruiters", "Hiring", "Team"]} delay={0.85} />
            <ActionCard icon={<FiImage />} title="Post Ad" subtitle="Promote your offers" description="Reach thousands of students." cta="Post Now" accent="from-[#ecfff5] to-[#d8fff0]" onClick={openDrawer} chips={["Video", "Banner", "Media"]} delay={0.9} />
          </motion.div>
            </motion.section>

            <motion.section className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.95 }}>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-white/70 bg-white/50 p-4 shadow-[0_16px_38px_rgba(15,23,42,0.06)] backdrop-blur">
                <QuickChip icon={<FiFileText />} label="Easy Apply" />
                <QuickChip icon={<FiTrendingUp />} label="Track Status" />
                <QuickChip icon={<FiPhoneCall />} label="Support" />
                <QuickChip icon={<FiMessageCircle />} label="Tips" />
              </div>
            </motion.section>
          </div>

          {homeAds.length ? (
            <motion.aside
              className="mt-8 xl:sticky xl:top-24 xl:mt-6"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/80 shadow-[0_24px_50px_rgba(15,23,42,0.1)] backdrop-blur-xl">
                <div className="border-b border-slate-200/80 px-5 py-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#ea580c]">Sponsored</p>
                  <h3 className="mt-3 text-[22px] font-extrabold text-slate-900">Latest Ads</h3>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                    One sponsored ad plays at a time with skip, mute, and auto-next controls.
                  </p>
                  <motion.button
                    type="button"
                    onClick={openDrawer}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3 text-sm font-extrabold text-white shadow-lg transition-all hover:shadow-slate-900/30"
                  >
                    Post Your Ad
                    <FiArrowRight />
                  </motion.button>
                </div>

                <div className="p-4 xl:max-h-[calc(100vh-10rem)] xl:overflow-y-auto">
                  <SponsoredAdsRail ads={homeAds} />
                </div>
              </div>
            </motion.aside>
          ) : null}
        </div>
      </div>

      {/* Modal for Ads */}
      <Modal
        open={adOpen}
        onClose={() => setAdOpen(false)}
        title={adView === "post" ? "Post Ad" : adView === "buy" ? "Buy Plan" : "Ad Options"}
        widthClass="max-w-4xl"
        footer={
          adView === "post" ? (
            <>
              <button type="button" onClick={() => setAdView("options")} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
                Back
              </button>
              <button type="button" disabled={adSubmitting || assetUploading} onClick={postAd} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">
                {assetUploading ? "Uploading..." : adSubmitting ? "Posting..." : "Post Ad"}
              </button>
            </>
          ) : adView === "buy" ? (
            <>
              <button type="button" onClick={() => setAdView("options")} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
                Back
              </button>
              <button type="button" disabled={adSubmitting || !planForm.planId} onClick={buyPlan} className="rounded-lg bg-[#F97316] px-4 py-2 text-sm font-semibold text-white">
                {adSubmitting ? "Processing..." : "Pay Now"}
              </button>
            </>
          ) : null
        }
      >
        {assetUploading ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/20 backdrop-blur-[1px]">
            <div className="min-w-[240px] rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#2563EB]" />
              <p className="mt-4 text-base font-bold text-slate-900">Uploading...</p>
            </div>
          </div>
        ) : null}
        {adView === "options" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <OptionCard icon={<FiUpload />} title="Post Ad" text="Upload and publish your creative." button="Post" onClick={openPostFlow} />
            <OptionCard icon={<FiShield />} title="Buy Plan" text="Choose a plan and start posting." button="Buy" onClick={() => setAdView("buy")} tone="orange" />
          </div>
        ) : null}
        {adView === "buy" ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid grid-cols-1 gap-4">
              {adPlans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setPlanForm({ planId: plan.id })}
                  className={`rounded-[24px] border p-5 text-left shadow-sm transition ${planForm.planId === plan.id ? "border-[#F97316] bg-orange-50/70" : "border-slate-200 bg-white"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-black text-slate-900">{plan.name}</p>
                      <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
                    </div>
                    {plan.highlight && <span className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-bold text-[#F97316]">Popular</span>}
                  </div>
                  <div className="mt-4 flex items-end gap-2">
                    <p className="text-3xl font-black text-slate-900">Rs {plan.price}</p>
                    <p className="pb-1 text-sm text-slate-500">/{plan.durationDays}d</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-5 text-sm text-slate-700">
              <p className="text-xs font-black uppercase text-emerald-700">Flow</p>
              <div className="mt-4 space-y-3">
                <p>• Select plan</p>
                <p>• Razorpay payment</p>
                <p>• Start posting</p>
              </div>
            </div>
          </div>
        ) : null}
        {adView === "post" ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Title
                  <input value={adForm.title} onChange={(e) => setAdForm((prev) => ({ ...prev, title: e.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Type
                  <select value={adForm.mediaType} onChange={(e) => setAdForm((prev) => ({ ...prev, mediaType: e.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none">
                    <option value="banner">Banner</option>
                    <option value="video">Video</option>
                    <option value="pamphlet">Pamphlet</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm font-semibold text-slate-700">
                Description
                <textarea value={adForm.description} onChange={(e) => setAdForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none" />
              </label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex gap-2 mb-4">
                  <button type="button" onClick={() => setAdForm((prev) => ({ ...prev, mediaMode: "device" }))} className={`rounded-full px-4 py-2 text-sm font-bold ${adForm.mediaMode === "device" ? "bg-blue-600 text-white" : "border border-slate-200 bg-white"}`}>
                    Device
                  </button>
                  <button type="button" onClick={() => setAdForm((prev) => ({ ...prev, mediaMode: "link" }))} className={`rounded-full px-4 py-2 text-sm font-bold ${adForm.mediaMode === "link" ? "bg-blue-600 text-white" : "border border-slate-200 bg-white"}`}>
                    Link
                  </button>
                </div>
                {adForm.mediaMode === "device" ? (
                  <input type="file" accept="image/*,video/*" onChange={(e) => setAdForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                ) : (
                  <input value={adForm.mediaLink} onChange={(e) => setAdForm((prev) => ({ ...prev, mediaLink: e.target.value }))} placeholder="https://..." className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function StatBox({ icon, value, label, delay = 0 }) {
  return (
    <motion.div
      className="rounded-[16px] border border-white/70 bg-white/60 p-3 text-center shadow-[0_12px_28px_rgba(15,23,42,0.06)] backdrop-blur hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)] transition-all cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5, scale: 1.02 }}
    >
      <motion.div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 text-[#F97316]" whileHover={{ rotate: 10, scale: 1.1 }}>
        {icon}
      </motion.div>
      <p className="mt-2 text-[16px] font-extrabold text-slate-900">{value}</p>
      <p className="text-[12px] font-semibold text-slate-600">{label}</p>
    </motion.div>
  );
}

function JobCard({ job, onClick, delay = 0 }) {
  const ratingText = Math.min(5, Math.max(3.5, Number(job.rating || 4.4))).toFixed(1);
  const logoUrl = toAbsoluteMediaUrl(job.companyLogo || job.logoUrl || "");
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`${baseCard} group w-full p-4 text-left hover:shadow-[0_20px_45px_rgba(15,23,42,0.12)] transition-all`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        <motion.div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 text-[#F97316]" whileHover={{ rotate: 10 }}>
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[16px] font-extrabold">{initials(job.company)}</span>
          )}
        </motion.div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-extrabold text-slate-900">{job.title}</p>
          <p className="truncate text-[12px] font-semibold text-slate-600">{job.company}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-slate-500">
            <FiMapPin className="text-[13px]" /> {job.location}
          </p>
        </div>
      </div>
      <p className="mt-3 text-[14px] font-extrabold text-emerald-700">{job.salary}</p>
      <div className="mt-3 flex items-center gap-2 text-[#F97316]">
        {Array.from({ length: 5 }).map((_, i) => (
          <FiStar key={i} className={`text-[14px] ${i < Math.round(Number(ratingText)) ? "" : "opacity-30"}`} />
        ))}
        <span className="text-[12px] font-extrabold text-slate-700">{ratingText}</span>
      </div>
    </motion.button>
  );
}

function BigBannerCard({ title, subtitle, button, image, tone, onClick, delay = 0 }) {
  const btnCls = tone === "green" ? "bg-gradient-to-r from-emerald-500 to-emerald-600" : "bg-gradient-to-r from-[#F97316] to-[#ea580c]";
  const titleCls = tone === "green" ? "text-emerald-700" : "text-[#2563EB]";
  return (
    <motion.div className={`${baseCard} relative overflow-hidden`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} whileHover={{ y: -5 }}>
      <div className="relative p-4">
        <h4 className={`text-[20px] font-extrabold ${titleCls}`}>{title}</h4>
        <p className="mt-1 text-[14px] font-semibold text-slate-700">{subtitle}</p>
        <motion.div className="mt-3 overflow-hidden rounded-[16px] border border-slate-100 bg-slate-50" whileHover={{ scale: 1.05 }}>
          <img src={image} alt="" className="h-[160px] w-full object-cover" />
        </motion.div>
        <motion.button type="button" onClick={onClick} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={`mt-4 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-[14px] font-extrabold text-white shadow-lg transition-all ${btnCls}`}>
          {button}
        </motion.button>
      </div>
    </motion.div>
  );
}

function QuickChip({ icon, label }) {
  return (
    <motion.div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 px-4 py-2 text-[13px] font-extrabold text-slate-700 backdrop-blur hover:bg-white transition-all cursor-pointer" whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
      <motion.span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-50 to-orange-100 text-[#F97316]" whileHover={{ rotate: 10 }}>
        {icon}
      </motion.span>
      {label}
    </motion.div>
  );
}

function ActionCard({ icon, title, subtitle, description, cta, accent, onClick, chips, delay = 0 }) {
  return (
    <motion.div className="relative overflow-hidden rounded-[28px] border border-slate-200/60 bg-white/40 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur hover:shadow-[0_25px_60px_rgba(15,23,42,0.15)] transition-all" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} whileHover={{ y: -5 }}>
      <motion.div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-r ${accent}`} />
      <div className="relative">
        <motion.div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl text-slate-800 shadow-md" whileHover={{ rotate: 10, scale: 1.1 }}>
          {icon}
        </motion.div>
        <h4 className="mt-4 text-[22px] font-black text-slate-900">{title}</h4>
        <p className="mt-1 text-sm font-bold text-slate-700">{subtitle}</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <motion.span key={chip} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600" whileHover={{ scale: 1.05 }}>
              {chip}
            </motion.span>
          ))}
        </div>
        <motion.button type="button" onClick={onClick} whileHover={{ scale: 1.05, x: 5 }} whileTap={{ scale: 0.95 }} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg hover:shadow-slate-900/30 transition-all">
          {cta}
          <FiArrowRight />
        </motion.button>
      </div>
    </motion.div>
  );
}

function OptionCard({ icon, title, text, button, onClick, tone = "blue" }) {
  const cls = tone === "orange" ? "from-[#fff7ed] to-white" : "from-[#eff6ff] to-white";
  const btn = tone === "orange" ? "bg-[#F97316]" : "bg-[#2563EB]";
  return (
    <div className={`rounded-[28px] border border-slate-200 bg-gradient-to-br ${cls} p-5 shadow-sm`}>
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl text-slate-800 shadow-sm">{icon}</div>
      <h4 className="mt-4 text-xl font-black text-slate-900">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
      <button type="button" onClick={onClick} className={`mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold text-white ${btn}`}>
        {button}
        <FiArrowRight />
      </button>
    </div>
  );
}

function SponsoredAdsRail({ ads = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [skipCountdown, setSkipCountdown] = useState(Math.ceil(AD_SKIP_DELAY_MS / 1000));
  const videoRef = useRef(null);

  const activeAd = ads[activeIndex] || null;
  const isVideo = isVideoAd(activeAd);
  const activeKey = `${activeAd?.id || "ad"}-${cycle}`;
  const description = String(activeAd?.description || "Featured sponsor content tailored for students.").trim();
  const mediaLabel = String(activeAd?.mediaType || (isVideo ? "video" : "banner")).toUpperCase();
  const canSkip = ads.length <= 1 || skipCountdown <= 0;
  useEffect(() => {
    if (!ads.length) return undefined;
    setActiveIndex((prev) => (prev >= ads.length ? 0 : prev));
    return undefined;
  }, [ads.length]);

  useEffect(() => {
    if (!activeAd) return undefined;
    setProgress(0);
    setIsMuted(true);
    setSkipCountdown(Math.ceil(AD_SKIP_DELAY_MS / 1000));

    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const remainingMs = Math.max(0, AD_SKIP_DELAY_MS - (Date.now() - startedAt));
      setSkipCountdown(Math.ceil(remainingMs / 1000));
      if (remainingMs <= 0) {
        window.clearInterval(intervalId);
      }
    }, 200);

    return () => window.clearInterval(intervalId);
  }, [activeKey, activeAd]);

  useEffect(() => {
    if (!activeAd || isVideo) return undefined;

    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      const nextProgress = Math.min(100, (elapsedMs / AD_BANNER_DURATION_MS) * 100);
      setProgress(nextProgress);

      if (elapsedMs >= AD_BANNER_DURATION_MS) {
        window.clearInterval(intervalId);
        setIsMuted(true);
        if (ads.length <= 1) {
          setCycle((prev) => prev + 1);
          return;
        }
        setActiveIndex((prev) => (prev + 1) % ads.length);
      }
    }, 120);

    return () => window.clearInterval(intervalId);
  }, [activeKey, activeAd, isVideo, ads.length]);

  useEffect(() => {
    if (!activeAd || !isVideo || !videoRef.current) return undefined;

    const video = videoRef.current;
    video.muted = isMuted;
    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {});
    }
    return undefined;
  }, [activeKey, activeAd, isVideo]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
  }, [isMuted, activeKey]);

  if (!activeAd) return null;

  const openTarget = () => {
    if (!activeAd.targetUrl) return;
    window.open(activeAd.targetUrl, "_blank", "noopener,noreferrer");
  };

  const playNextAd = () => {
    setProgress(0);
    setIsMuted(true);
    if (ads.length <= 1) {
      setCycle((prev) => prev + 1);
      return;
    }
    setActiveIndex((prev) => (prev + 1) % ads.length);
  };

  return (
    <div className="overflow-hidden rounded-[26px] bg-[#0f172a] text-white shadow-[0_24px_60px_rgba(15,23,42,0.25)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#020617]">
        <div className="absolute inset-x-0 top-0 z-20 p-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-red-500"
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear", duration: 0.2 }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-orange-200">
              Sponsored
            </span>
            <span className="rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
              Ad {activeIndex + 1} / {ads.length}
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeKey}
            className="absolute inset-0"
            initial={{ opacity: 0.2, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.1, scale: 0.98 }}
            transition={{ duration: 0.35 }}
          >
            {activeAd.mediaUrl ? (
              isVideo ? (
                <video
                  key={activeKey}
                  ref={videoRef}
                  src={activeAd.mediaUrl}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted={isMuted}
                  playsInline
                  preload="metadata"
                  onTimeUpdate={(event) => {
                    const duration = event.currentTarget.duration;
                    if (!Number.isFinite(duration) || duration <= 0) return;
                    setProgress(Math.min(100, (event.currentTarget.currentTime / duration) * 100));
                  }}
                  onEnded={playNextAd}
                  onError={playNextAd}
                />
              ) : (
                <img src={activeAd.mediaUrl} alt={activeAd.title} className="h-full w-full object-cover" loading="lazy" />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 px-8 text-center">
                <div>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-lg font-black">
                    {initials(activeAd.advertiserName)}
                  </div>
                  <p className="mt-4 text-sm font-bold uppercase tracking-[0.3em] text-orange-200">{mediaLabel}</p>
                  <p className="mt-2 text-xl font-black text-white">{activeAd.title}</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/55 to-transparent p-4">
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-center gap-2">
              {isVideo ? (
                <motion.button
                  type="button"
                  onClick={() => setIsMuted((prev) => !prev)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white backdrop-blur"
                >
                  {isMuted ? <FiVolumeX /> : <FiVolume2 />}
                  {isMuted ? "Unmute" : "Mute"}
                </motion.button>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/75 backdrop-blur">
                  <FiImage />
                  Timed Banner
                </span>
              )}
            </div>

            <motion.button
              type="button"
              onClick={playNextAd}
              disabled={!canSkip}
              whileHover={canSkip ? { scale: 1.03 } : undefined}
              whileTap={canSkip ? { scale: 0.97 } : undefined}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                canSkip
                  ? "bg-white text-slate-900 shadow-lg"
                  : "cursor-not-allowed bg-white/10 text-white/60"
              }`}
            >
              <FiSkipForward />
              {canSkip ? (ads.length > 1 ? "Skip Ad" : "Replay Ad") : `Skip in ${skipCountdown}s`}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-orange-300">{activeAd.advertiserName}</p>
            <h4 className="mt-2 text-[20px] font-extrabold leading-7 text-white">{activeAd.title}</h4>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
            {mediaLabel}
          </span>
        </div>

        <p className="text-sm leading-6 text-slate-300">{description}</p>

        {activeAd.targetUrl ? (
          <div className="pt-1">
            <motion.button
              type="button"
              onClick={openTarget}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/15 px-4 py-2 text-[12px] font-extrabold text-blue-200 transition-colors hover:bg-blue-500/20"
            >
              {activeAd.ctaLabel || "Learn More"}
              <FiExternalLink />
            </motion.button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
