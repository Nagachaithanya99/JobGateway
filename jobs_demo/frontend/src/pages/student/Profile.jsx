

// ////////////////////////////////////////////////////////////////////////////////////////////////////



// // frontend/src/pages/student/Profile.jsx
// //
// // ✅ LIGHT / WHITE THEME — full redesign from dark
// // ✅ Recently logged-in users section (LinkedIn-style) with _id, name, avatar, designation
// // ✅ New API: getRecentUsers from studentService
// // ✅ Resume: inline PDF viewer modal — NO navigation away
// // ✅ All data is REAL — from API, no fake/mock data
// // ✅ Follow suggestions: real registered users from DB
// // ✅ Applied jobs: real from DB
// // ✅ SweetAlert2-style confirm popups + Toast notifications

// import { useEffect, useMemo, useRef, useState, useCallback } from "react";
// import { Link } from "react-router-dom";
// import { useAuth } from "@clerk/clerk-react";
// import {
//   FiBook, FiBriefcase, FiMapPin, FiSave, FiUploadCloud,
//   FiUser, FiTrash2, FiEdit2, FiPlus, FiCamera, FiLink,
//   FiGlobe, FiGithub, FiTwitter, FiLinkedin, FiInstagram,
//   FiYoutube, FiExternalLink, FiAward, FiCode, FiFileText,
//   FiCheckSquare, FiX, FiCheck, FiUsers, FiEye, FiSearch,
//   FiClock, FiImage, FiAlertTriangle, FiAlertCircle,
//   FiInfo, FiDownload, FiZoomIn, FiZoomOut, FiRefreshCw,
//   FiMaximize2, FiCalendar, FiChevronDown, FiUserPlus,
//   FiActivity,
// } from "react-icons/fi";

// import {
//   studentMe,
//   studentUpdateProfile,
//   uploadResume as uploadResumeAPI,
//   uploadAvatar as uploadAvatarAPI,
//   getFollowSuggestions,
//   toggleFollow,
//   getAppliedJobs,
//   withdrawApplication,
//   getRecentUsers, // ← NEW: add this export to your studentService.js
// } from "../../services/studentService.js";

// // ─── ADD THIS TO studentService.js ───────────────────────────────────────────
// // export const getRecentUsers = (token) =>
// //   axios.get("/api/recent-users", { headers: { Authorization: `Bearer ${token}` } });
// // ─────────────────────────────────────────────────────────────────────────────

// // ─── CONSTANTS ────────────────────────────────────────────────────────────────
// const SKILL_CATEGORIES = {
//   "Languages":    ["Java","Python","JavaScript","TypeScript","C","C++","C#","Go","Rust","Kotlin","Swift","PHP","Ruby","R","Dart"],
//   "Frontend":     ["React","Vue.js","Angular","Next.js","HTML5","CSS3","Tailwind CSS","Bootstrap","Svelte","Redux","Zustand"],
//   "Backend":      ["Node.js","Express.js","Spring Boot","Django","FastAPI","Flask","NestJS","GraphQL","REST API","Laravel"],
//   "Database":     ["MySQL","PostgreSQL","MongoDB","Redis","Firebase","SQLite","Oracle","DynamoDB","Supabase"],
//   "DevOps":       ["Docker","Kubernetes","AWS","Azure","GCP","CI/CD","Jenkins","Git","GitHub Actions","Linux","Terraform"],
//   "Mobile":       ["React Native","Flutter","Android (Kotlin)","iOS (Swift)","Expo"],
//   "Design":       ["Figma","Adobe XD","Photoshop","Illustrator","Canva","UI/UX","Wireframing","Prototyping"],
//   "Data & ML":    ["Machine Learning","Deep Learning","TensorFlow","PyTorch","Pandas","NumPy","Scikit-learn","Power BI","Tableau"],
//   "Soft Skills":  ["Leadership","Communication","Teamwork","Problem Solving","Time Management","Agile/Scrum"],
// };

// const DESIGNATION_OPTIONS = [
//   "Student","Fresher","Software Engineer Intern","Software Engineer","Junior Developer",
//   "Frontend Developer","Backend Developer","Full Stack Developer","Data Analyst",
//   "Data Scientist","ML Engineer","DevOps Engineer","UI/UX Designer","Product Manager",
//   "Business Analyst","Cybersecurity Analyst","Cloud Engineer","Mobile Developer","QA Engineer","Other",
// ];

// const DEGREE_OPTIONS = [
//   "B.Tech / B.E.","M.Tech / M.E.","BCA","MCA","B.Sc","M.Sc","MBA","BBA",
//   "B.Com","M.Com","B.Arch","B.Pharm","MBBS","B.Ed","12th (PCM)","12th (PCB)",
//   "12th (Commerce)","12th (Arts)","10th (SSLC)","Diploma","Ph.D","Other",
// ];
// const BRANCH_OPTIONS = [
//   "Computer Science & Engineering","Information Technology","Electronics & Communication",
//   "Electrical Engineering","Mechanical Engineering","Civil Engineering","Data Science",
//   "Artificial Intelligence & ML","Cybersecurity","Cloud Computing","Biomedical Engineering","Other",
// ];
// const BOARD_OPTIONS = [
//   "CBSE","ICSE","State Board","IGCSE","IB","VTU","Anna University","Osmania University",
//   "Mumbai University","Pune University","Other University",
// ];
// const INDIAN_STATES = [
//   "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
//   "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
//   "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
//   "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
//   "Delhi","Jammu & Kashmir","Ladakh","Chandigarh","Puducherry",
// ];
// const CITIES_BY_STATE = {
//   "Karnataka":    ["Bangalore","Mysore","Hubli","Mangalore","Belgaum","Davangere","Tumkur","Udupi","Shimoga"],
//   "Maharashtra":  ["Mumbai","Pune","Nagpur","Nashik","Aurangabad","Thane","Kolhapur","Solapur"],
//   "Tamil Nadu":   ["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Vellore","Tirunelveli"],
//   "Delhi":        ["New Delhi","Dwarka","Rohini","Saket","Janakpuri"],
//   "Telangana":    ["Hyderabad","Warangal","Nizamabad","Karimnagar","Khammam"],
//   "Gujarat":      ["Ahmedabad","Surat","Vadodara","Rajkot","Gandhinagar","Bhavnagar"],
//   "West Bengal":  ["Kolkata","Howrah","Durgapur","Asansol","Siliguri"],
//   "Rajasthan":    ["Jaipur","Jodhpur","Udaipur","Kota","Bikaner","Ajmer"],
//   "Uttar Pradesh":["Lucknow","Kanpur","Agra","Varanasi","Allahabad","Noida","Ghaziabad"],
//   "Andhra Pradesh":["Visakhapatnam","Vijayawada","Guntur","Tirupati","Nellore"],
//   "Kerala":       ["Thiruvananthapuram","Kochi","Kozhikode","Thrissur","Kollam"],
//   "Haryana":      ["Gurgaon","Faridabad","Ambala","Panipat","Rohtak"],
// };
// const JOB_STREAMS    = ["IT / Software","Non-IT","Core Engineering","Finance & Banking","Marketing","Healthcare","Design","Research","Government / PSU","Startup","Other"];
// const JOB_CATEGORIES = ["Software Development","Data Science","DevOps & Cloud","Cybersecurity","UI/UX Design","Product Management","Business Analysis","Digital Marketing","Sales","Finance","HR","Content Writing","Other"];
// const WORK_MODES     = ["Remote","On-site","Hybrid","Flexible"];
// const SALARY_RANGES  = ["Below 3 LPA","3–5 LPA","5–8 LPA","8–12 LPA","12–18 LPA","18–25 LPA","25–35 LPA","Above 35 LPA"];

// const FIXED_BANNERS = [
//   "https://images.unsplash.com/photo-1562240020-ce31ccb0fa7d?w=1200&q=80",
//   "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?w=1200&q=80",
//   "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
//   "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
//   "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&q=80",
//   "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80",
//   "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
//   "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80",
//   "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200&q=80",
//   "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80",
//   "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
//   "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=1200&q=80",
//   "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80",
//   "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1200&q=80",
//   "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=1200&q=80",
// ];
// const GRADIENT_BANNERS = [
//   "linear-gradient(135deg,#0f2027,#203a43,#2c5364)",
//   "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)",
//   "linear-gradient(135deg,#000428,#004e92)",
//   "linear-gradient(135deg,#f97316,#ef4444,#8b5cf6)",
//   "linear-gradient(135deg,#06b6d4,#3b82f6,#8b5cf6)",
//   "linear-gradient(135deg,#10b981,#06b6d4,#3b82f6)",
//   "linear-gradient(135deg,#f59e0b,#ef4444,#ec4899)",
//   "linear-gradient(135deg,#84cc16,#06b6d4,#3b82f6)",
// ];

// // ─── HELPERS ──────────────────────────────────────────────────────────────────
// const safeObj = x => (x && typeof x === "object" ? x : {});
// const safeArr = x => (Array.isArray(x) ? x : []);
// const initials = name =>
//   String(name || "S").trim().split(" ").filter(Boolean).slice(0, 2)
//     .map(s => s[0]?.toUpperCase() || "").join("");

// function parseSkillsText(v = "") {
//   return String(v).split(/[\n,;/|]+/g).map(s => s.trim()).filter(Boolean);
// }
// function normalizeSkillsForUi(skills = []) {
//   const seen = new Set(); const out = [];
//   safeArr(skills)
//     .flatMap(s => parseSkillsText(typeof s === "string" ? s : s?.name || s?.skill || ""))
//     .forEach(name => {
//       const k = name.toLowerCase();
//       if (!seen.has(k)) { seen.add(k); out.push({ id: `sk_${Date.now()}_${out.length}`, name }); }
//     });
//   return out;
// }
// function normalizedSkillCount(sk = []) {
//   return safeArr(sk).flatMap(s => parseSkillsText(typeof s === "string" ? s : s?.name || s?.skill || "")).length;
// }
// function hasValidEducation(edu = []) {
//   return safeArr(edu).some(e => e?.degree && e?.college);
// }
// function formatAppliedDate(iso) {
//   const d = new Date(iso);
//   const DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
//   const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
//   const diffMs   = Date.now() - d.getTime();
//   const diffDays = Math.floor(diffMs / 86400000);
//   return {
//     dayName: DAYS[d.getDay()],
//     date: `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
//     time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
//     ago: diffDays === 0 ? "Today" : diffDays === 1 ? "Yesterday" : `${diffDays} days ago`,
//   };
// }

// // Avatar gradient palette (same across components)
// const AVATAR_GRADIENTS = [
//   ["#6366f1","#8b5cf6"],
//   ["#3b82f6","#06b6d4"],
//   ["#10b981","#3b82f6"],
//   ["#f97316","#ef4444"],
//   ["#ec4899","#8b5cf6"],
//   ["#0ea5e9","#6366f1"],
// ];
// function avatarGradient(id = "") {
//   let h = 0;
//   for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
//   const [a, b] = AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
//   return `linear-gradient(135deg,${a},${b})`;
// }

// const EMPTY = {
//   personal: { fullName:"",email:"",phone:"",dob:"",gender:"Male",address:"",city:"",state:"",location:"",linkedin:"",portfolio:"",github:"",twitter:"",instagram:"",youtube:"",website:"",designation:"Student",about:"",coverPhoto:"",avatarUrl:"" },
//   education: [], skills: [], fresher: true,
//   experience: [{ id:"ex1",company:"",role:"",from:"",to:"",current:false,description:"" }],
//   projects: [],
//   preferred: { stream:"",category:"",subcategory:"",locations:"",salary:"",workMode:"Hybrid" },
//   resume: { fileName:"",size:"",updatedAt:"",url:"" },
//   stats: { profileViews:0,projectViews:0,followers:0,following:0 },
// };

// function mapProfileToForm(me = {}) {
//   const p = safeObj(me.studentProfile);
//   const preferred = safeObj(p.preferred);
//   return {
//     personal: {
//       fullName: p.personal?.fullName || me.name || "",
//       email: p.personal?.email || me.email || "",
//       phone: p.personal?.phone || me.phone || "",
//       dob: p.personal?.dob || "",
//       gender: p.personal?.gender || "Male",
//       address: p.personal?.address || "",
//       city: p.personal?.city || "",
//       state: p.personal?.state || "",
//       location: p.personal?.location || me.location || "",
//       linkedin: p.personal?.linkedin || me.linkedin || "",
//       portfolio: p.personal?.portfolio || me.portfolio || "",
//       github: p.personal?.github || "",
//       twitter: p.personal?.twitter || "",
//       instagram: p.personal?.instagram || "",
//       youtube: p.personal?.youtube || "",
//       website: p.personal?.website || "",
//       designation: p.personal?.designation || "Student",
//       about: p.personal?.about || "",
//       coverPhoto: p.personal?.coverPhoto || "",
//       avatarUrl: p.personal?.avatarUrl || "",
//     },
//     education: safeArr(p.education).map((e, i) => ({ id:e.id||`ed_${i}`, degree:e.degree||"", college:e.college||"", year:e.year||"", branch:e.branch||"", score:e.score||"", board:e.board||"", universityRollNo:e.universityRollNo||"", achievements:e.achievements||"" })),
//     skills: safeArr(p.skills).map((s, i) => typeof s === "string" ? { id:`sk_${i}`,name:s } : { id:s.id||`sk_${i}`,name:s.name||s.skill||"" }),
//     fresher: p.fresher !== undefined ? !!p.fresher : true,
//     experience: safeArr(p.experience).length
//       ? safeArr(p.experience).map((x, i) => ({ id:x.id||`ex_${i}`, company:x.company||"", role:x.role||"", from:x.from||"", to:x.to||"", current:!!x.current, description:x.description||"" }))
//       : [{ id:"ex1",company:"",role:"",from:"",to:"",current:false,description:"" }],
//     projects: safeArr(p.projects).map((pr, i) => ({ id:pr.id||`pr_${i}`, title:pr.title||"", description:pr.description||"", techStack:pr.techStack||"", hashtags:pr.hashtags||"", imageUrl:pr.imageUrl||"", liveUrl:pr.liveUrl||"", githubUrl:pr.githubUrl||"", daysToComplete:pr.daysToComplete||"" })),
//     preferred: { stream:preferred.stream||"", category:preferred.category||"", subcategory:preferred.subcategory||preferred.subCategory||"", locations:Array.isArray(preferred.locations)?preferred.locations.join(", "):preferred.locations||"", salary:preferred.salary||preferred.expectedSalary||"", workMode:preferred.workMode||"Hybrid" },
//     resume: { fileName:p.resumeMeta?.fileName||(me.resumeUrl?"Uploaded Resume":""), size:p.resumeMeta?.size||"", updatedAt:p.resumeMeta?.updatedAt||"", url:me.resumeUrl||"" },
//     stats: { profileViews:me.profileViews||0, projectViews:me.projectViews||0, followers:(me.followers||[]).length, following:(me.following||[]).length },
//   };
// }

// // ─── LIGHT ANIMATED BACKGROUND ───────────────────────────────────────────────
// const BG_CSS = `
// @keyframes floatA { 0%,100%{transform:translate(0,0) rotate(0deg);} 33%{transform:translate(30px,-40px) rotate(120deg);} 66%{transform:translate(-20px,25px) rotate(240deg);} }
// @keyframes floatB { 0%,100%{transform:translate(0,0) rotate(0deg) scale(1);} 50%{transform:translate(-35px,30px) rotate(180deg) scale(1.15);} }
// @keyframes floatC { 0%,100%{transform:translate(0,0) rotate(0deg);} 25%{transform:translate(20px,30px) rotate(90deg);} 75%{transform:translate(-25px,-20px) rotate(270deg);} }
// @keyframes floatD { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(-50px) rotate(180deg);} }
// @keyframes driftLine { 0%{transform:translate(-100px,0) rotate(-45deg);opacity:0;} 50%{opacity:0.25;} 100%{transform:translate(200vw,0) rotate(-45deg);opacity:0;} }
// @keyframes pulseDot { 0%,100%{transform:scale(1);opacity:0.18;} 50%{transform:scale(1.3);opacity:0.35;} }
// @keyframes spinHex { 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }
// @keyframes floatTri { 0%,100%{transform:translate(0,0) rotate(0deg);} 50%{transform:translate(15px,-30px) rotate(180deg);} }
// @keyframes modalIn { 0%{opacity:0;transform:translateY(-16px) scale(0.96);} 100%{opacity:1;transform:translateY(0) scale(1);} }
// @keyframes sweetPop { 0%{opacity:0;transform:scale(0.65);} 65%{transform:scale(1.06);} 100%{opacity:1;transform:scale(1);} }
// @keyframes toastSlide { 0%{opacity:0;transform:translateX(110%);} 100%{opacity:1;transform:translateX(0);} }
// @keyframes checkPath { 0%{stroke-dashoffset:60;} 100%{stroke-dashoffset:0;} }
// @keyframes onlinePulse { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.5);} 50%{box-shadow:0 0 0 5px rgba(16,185,129,0);} }

// .bg-shape-a { animation: floatA 9s ease-in-out infinite; }
// .bg-shape-b { animation: floatB 12s ease-in-out infinite; }
// .bg-shape-c { animation: floatC 7s ease-in-out infinite; }
// .bg-shape-d { animation: floatD 10s ease-in-out infinite; }
// .bg-tri     { animation: floatTri 8s ease-in-out infinite; }
// .bg-spin    { animation: spinHex 20s linear infinite; }
// .bg-line    { animation: driftLine 14s linear infinite; }
// .bg-dot     { animation: pulseDot 3s ease-in-out infinite; }
// .modal-anim { animation: modalIn 0.22s ease-out; }
// .sweet-anim { animation: sweetPop 0.35s cubic-bezier(0.175,0.885,0.32,1.275); }
// .toast-anim { animation: toastSlide 0.3s ease-out; }
// .online-dot { animation: onlinePulse 2s ease-in-out infinite; }
// `;

// const PASTEL_SHAPE_COLORS = [
//   "#93c5fd","#6ee7b7","#fca5a5","#c4b5fd","#67e8f9",
//   "#f9a8d4","#fcd34d","#86efac","#a5b4fc","#fdba74",
// ];

// function AnimatedBackground() {
//   return (
//     <>
//       <style>{BG_CSS}</style>
//       <div className="fixed inset-0 z-0 pointer-events-none" style={{ background:"#f0f4ff" }}>
//         {/* Pastel glow orbs */}
//         {[
//           { top:"8%",  left:"5%",  w:320,h:320,c:"#6366f1",op:0.07 },
//           { top:"60%", left:"75%", w:360,h:360,c:"#8b5cf6",op:0.06 },
//           { top:"40%", left:"40%", w:400,h:400,c:"#06b6d4",op:0.04 },
//           { top:"80%", left:"15%", w:260,h:260,c:"#ec4899",op:0.05 },
//           { top:"15%", left:"70%", w:290,h:290,c:"#10b981",op:0.05 },
//         ].map((o, i) => (
//           <div key={i} className={`bg-shape-${["a","b","c","d","b"][i]} absolute rounded-full`}
//             style={{ top:o.top, left:o.left, width:o.w, height:o.h, background:`radial-gradient(circle, ${o.c}, transparent 70%)`, opacity:o.op, filter:"blur(60px)", animationDelay:`${i*1.3}s` }}/>
//         ))}
//         {/* Light circles */}
//         {[
//           { top:"10%",left:"60%",size:120,c:"#6366f1",cls:"bg-shape-a",delay:"0s",  op:0.10 },
//           { top:"55%",left:"10%",size:160,c:"#8b5cf6",cls:"bg-shape-b",delay:"1.5s",op:0.08 },
//           { top:"75%",left:"55%",size:100,c:"#10b981",cls:"bg-shape-c",delay:"2s",  op:0.10 },
//           { top:"25%",left:"85%",size:90, c:"#ec4899",cls:"bg-shape-d",delay:"0.8s",op:0.08 },
//           { top:"85%",left:"80%",size:130,c:"#f97316",cls:"bg-shape-a",delay:"3s",  op:0.07 },
//         ].map((s, i) => (
//           <div key={`c_${i}`} className={`${s.cls} absolute rounded-full border`}
//             style={{ top:s.top, left:s.left, width:s.size, height:s.size, borderColor:s.c, opacity:s.op, animationDelay:s.delay, background:`radial-gradient(circle at 35% 35%, ${s.c}18, transparent)` }}/>
//         ))}
//         {/* Triangles */}
//         {[
//           { top:"15%",left:"45%",size:28,c:"#06b6d4",cls:"bg-tri",    delay:"0s"   },
//           { top:"70%",left:"30%",size:22,c:"#f59e0b",cls:"bg-tri",    delay:"1.8s" },
//           { top:"30%",left:"15%",size:32,c:"#ec4899",cls:"bg-shape-a",delay:"3.5s" },
//         ].map((t, i) => (
//           <svg key={`t_${i}`} className={`${t.cls} absolute`} style={{ top:t.top, left:t.left, opacity:0.18, animationDelay:t.delay }} width={t.size*2} height={t.size*2} viewBox="0 0 60 60">
//             <polygon points="30,4 56,52 4,52" fill="none" stroke={t.c} strokeWidth="2"/>
//           </svg>
//         ))}
//         {/* Diagonal streaks */}
//         {[
//           { top:"25%",left:"-5%",w:180,c:"#6366f1",delay:"0s", dur:"12s" },
//           { top:"65%",left:"-5%",w:140,c:"#06b6d4",delay:"4s", dur:"16s" },
//           { top:"45%",left:"-5%",w:100,c:"#f59e0b",delay:"8s", dur:"10s" },
//         ].map((l, i) => (
//           <div key={`l_${i}`} className="bg-line absolute"
//             style={{ top:l.top, left:l.left, width:l.w, height:3, background:l.c, opacity:0.28, borderRadius:2, transform:"rotate(-45deg)", animationDuration:l.dur, animationDelay:l.delay }}/>
//         ))}
//         {/* Spinning hexagons */}
//         {[
//           { top:"48%",left:"3%", size:60,c:"#6366f1",delay:"0s"  },
//           { top:"12%",left:"55%",size:45,c:"#ec4899",delay:"5s"  },
//         ].map((h, i) => (
//           <svg key={`h_${i}`} className="bg-spin absolute" style={{ top:h.top, left:h.left, opacity:0.10, animationDelay:h.delay }} width={h.size} height={h.size} viewBox="0 0 60 60">
//             <polygon points="30,2 55,16 55,44 30,58 5,44 5,16" fill="none" stroke={h.c} strokeWidth="1.5"/>
//           </svg>
//         ))}
//         {/* Small dots */}
//         {Array.from({length:14}).map((_, i) => (
//           <div key={`d_${i}`} className="bg-dot absolute rounded-full"
//             style={{ top:`${6+i*6.5}%`, left:`${(i*14+7)%95}%`, width:i%3===0?7:5, height:i%3===0?7:5, background:PASTEL_SHAPE_COLORS[i%PASTEL_SHAPE_COLORS.length], opacity:0.25, animationDelay:`${i*0.25}s` }}/>
//         ))}
//         {/* Grid */}
//         <svg className="absolute inset-0 w-full h-full" style={{ opacity:0.025 }}>
//           <defs><pattern id="g" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M 64 0 L 0 0 0 64" fill="none" stroke="#6366f1" strokeWidth="0.8"/></pattern></defs>
//           <rect width="100%" height="100%" fill="url(#g)"/>
//         </svg>
//       </div>
//     </>
//   );
// }

// // ─── TOAST SYSTEM ─────────────────────────────────────────────────────────────
// let _tid = 0;
// const _tListeners = new Set();
// const toast = (msg, type = "success", duration = 3500) => {
//   const id = ++_tid;
//   _tListeners.forEach(fn => fn({ id, msg, type, duration }));
// };
// function useToasts() {
//   const [toasts, setToasts] = useState([]);
//   useEffect(() => {
//     const fn = t => {
//       setToasts(p => [...p, t]);
//       setTimeout(() => setToasts(p => p.filter(x => x.id !== t.id)), t.duration);
//     };
//     _tListeners.add(fn);
//     return () => _tListeners.delete(fn);
//   }, []);
//   return { toasts, dismiss: id => setToasts(p => p.filter(x => x.id !== id)) };
// }

// function ToastContainer() {
//   const { toasts, dismiss } = useToasts();
//   const C = { success:"bg-emerald-500", error:"bg-red-500", warning:"bg-amber-500", info:"bg-blue-500" };
//   const I = { success:<FiCheck size={13}/>, error:<FiX size={13}/>, warning:<FiAlertTriangle size={13}/>, info:<FiInfo size={13}/> };
//   return (
//     <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
//       {toasts.map(t => (
//         <div key={t.id} className={`toast-anim flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold pointer-events-auto min-w-[260px] max-w-[380px] ${C[t.type]||C.success}`}>
//           <span className="flex-shrink-0 h-6 w-6 rounded-full bg-white/25 flex items-center justify-center">{I[t.type]||I.success}</span>
//           <span className="flex-1">{t.msg}</span>
//           <button onClick={() => dismiss(t.id)} className="hover:opacity-70"><FiX size={13}/></button>
//         </div>
//       ))}
//     </div>
//   );
// }

// // ─── SWEET ALERT ──────────────────────────────────────────────────────────────
// let _sweetResolve = null;
// const _sweetListeners = new Set();
// function SweetAlertHost() {
//   const [cfg, setCfg] = useState({ open: false });
//   useEffect(() => {
//     const fn = c => setCfg(c);
//     _sweetListeners.add(fn);
//     return () => _sweetListeners.delete(fn);
//   }, []);
//   const close = val => { setCfg(c => ({ ...c, open: false })); _sweetResolve?.(val); };
//   if (!cfg.open) return null;
//   const ICONS = {
//     success: <div className="w-16 h-16 rounded-full border-2 border-emerald-200 bg-emerald-50 flex items-center justify-center"><FiCheck size={28} className="text-emerald-500"/></div>,
//     error:   <div className="w-16 h-16 rounded-full border-2 border-red-200 bg-red-50 flex items-center justify-center"><FiX size={28} className="text-red-500"/></div>,
//     warning: <div className="w-16 h-16 rounded-full border-2 border-amber-200 bg-amber-50 flex items-center justify-center"><FiAlertTriangle size={26} className="text-amber-500"/></div>,
//     confirm: <div className="w-16 h-16 rounded-full border-2 border-blue-200 bg-blue-50 flex items-center justify-center"><FiAlertCircle size={26} className="text-blue-500"/></div>,
//     info:    <div className="w-16 h-16 rounded-full border-2 border-blue-200 bg-blue-50 flex items-center justify-center"><FiInfo size={26} className="text-blue-500"/></div>,
//   };
//   const BTN = { success:"bg-emerald-500 hover:bg-emerald-600", error:"bg-red-500 hover:bg-red-600", warning:"bg-amber-500 hover:bg-amber-600", confirm:"bg-blue-600 hover:bg-blue-700", info:"bg-blue-600 hover:bg-blue-700" };
//   return (
//     <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
//       <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => close(false)}/>
//       <div className="sweet-anim relative z-10 bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
//         <div className="flex justify-center mb-4">{ICONS[cfg.type]||ICONS.info}</div>
//         <h3 className="text-xl font-extrabold text-slate-800 mb-2">{cfg.title}</h3>
//         {cfg.text && <p className="text-sm text-slate-500 leading-relaxed mb-6">{cfg.text}</p>}
//         <div className="flex gap-3 justify-center">
//           {cfg.cancelText && <button onClick={() => close(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">{cfg.cancelText}</button>}
//           <button onClick={() => close(true)} className={`px-6 py-2.5 rounded-xl text-white text-sm font-bold transition ${BTN[cfg.type]||BTN.info}`}>{cfg.confirmText||"OK"}</button>
//         </div>
//       </div>
//     </div>
//   );
// }
// function sweet(cfg) {
//   return new Promise(resolve => { _sweetResolve = resolve; _sweetListeners.forEach(fn => fn({ ...cfg, open: true })); });
// }

// // ─── UI ATOMS ─────────────────────────────────────────────────────────────────
// function Modal({ open, onClose, title, children, wide, extraWide }) {
//   if (!open) return null;
//   return (
//     <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
//       <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
//       <div className={`modal-anim relative z-10 w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${extraWide?"max-w-4xl":wide?"max-w-2xl":"max-w-lg"}`}>
//         <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
//           <h3 className="font-extrabold text-slate-800 text-base">{title}</h3>
//           <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 transition"><FiX size={16}/></button>
//         </div>
//         <div className="overflow-y-auto flex-1 p-6 space-y-4">{children}</div>
//       </div>
//     </div>
//   );
// }
// function Inp({ label, ...props }) {
//   return (
//     <div className="flex flex-col gap-1.5">
//       {label && <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>}
//       <input {...props} className={`h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition placeholder:text-slate-300 ${props.readOnly?"bg-slate-50 text-slate-400":""} ${props.className||""}`}/>
//     </div>
//   );
// }
// function Txta({ label, ...props }) {
//   return (
//     <div className="flex flex-col gap-1.5">
//       {label && <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>}
//       <textarea {...props} className={`rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition placeholder:text-slate-300 resize-none ${props.className||""}`}/>
//     </div>
//   );
// }
// function ComboInput({ label, value, onChange, options = [], placeholder }) {
//   const [open, setOpen] = useState(false);
//   const ref = useRef(null);
//   const filtered = options.filter(o => o.toLowerCase().includes((value||"").toLowerCase())).slice(0, 10);
//   useEffect(() => {
//     const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
//     document.addEventListener("mousedown", h);
//     return () => document.removeEventListener("mousedown", h);
//   }, []);
//   return (
//     <div className="flex flex-col gap-1.5 relative" ref={ref}>
//       {label && <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>}
//       <div className="relative">
//         <input value={value||""} onChange={e => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={placeholder}
//           className="w-full h-10 rounded-xl border border-slate-200 px-3 pr-8 text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition placeholder:text-slate-300"/>
//         <FiChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"/>
//       </div>
//       {open && filtered.length > 0 && (
//         <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-52 overflow-y-auto">
//           {filtered.map(o => (
//             <button key={o} type="button" onMouseDown={() => { onChange(o); setOpen(false); }}
//               className={`w-full text-left px-3 py-2.5 text-sm transition hover:bg-blue-50 hover:text-blue-700 ${value===o?"bg-blue-50 text-blue-700 font-semibold":"text-slate-700"}`}>{o}</button>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── AVATAR COMPONENT ─────────────────────────────────────────────────────────
// function AvatarComp({ src, name, id, size = 96, editable, onEdit, showOnline }) {
//   return (
//     <div className="relative inline-block" style={{ width:size, height:size }}>
//       {src
//         ? <img src={src} alt={name} className="rounded-full object-cover shadow-md" style={{ width:size, height:size, border:"3px solid white" }}/>
//         : <div className="rounded-full flex items-center justify-center text-white font-bold shadow-md" style={{ width:size, height:size, fontSize:size*0.33, border:"3px solid white", background:avatarGradient(id||name) }}>{initials(name)}</div>}
//       {showOnline && (
//         <span className="online-dot absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-white"/>
//       )}
//       {editable && (
//         <button onClick={onEdit} className="absolute bottom-1 right-1 h-7 w-7 rounded-full bg-white shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-100 transition border border-slate-200">
//           <FiCamera size={12}/>
//         </button>
//       )}
//     </div>
//   );
// }

// // ─── SECTION CARD ─────────────────────────────────────────────────────────────
// function SectionCard({ title, icon, onEdit, children, accent = "#3b82f6" }) {
//   return (
//     <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
//       <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
//         <h3 className="font-bold text-slate-800 flex items-center gap-2 text-[15px]">
//           <span style={{ color:accent }}>{icon}</span>{title}
//         </h3>
//         {onEdit && (
//           <button onClick={onEdit} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition border border-slate-200">
//             <FiEdit2 size={13}/>
//           </button>
//         )}
//       </div>
//       <div className="px-6 py-5">{children}</div>
//     </div>
//   );
// }

// // ─── COLOR BADGE ──────────────────────────────────────────────────────────────
// const SKILL_COLORS = ["#3b82f6","#10b981","#f97316","#a855f7","#06b6d4","#ec4899","#eab308","#ef4444"];
// function skillColor(name) { let h = 0; for (let c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff; return SKILL_COLORS[h % SKILL_COLORS.length]; }

// function ColorBadge({ name, color = "#3b82f6", onRemove }) {
//   return (
//     <span className="inline-flex items-center gap-1.5 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm" style={{ background:color }}>
//       {name}
//       {onRemove && <button onClick={onRemove} className="hover:opacity-70 rounded-full w-4 h-4 flex items-center justify-center"><FiX size={9}/></button>}
//     </span>
//   );
// }

// // ─── PDF VIEWER ───────────────────────────────────────────────────────────────
// function PdfViewerModal({ open, onClose, url, fileName }) {
//   const [zoom, setZoom] = useState(100);
//   useEffect(() => {
//     document.body.style.overflow = open ? "hidden" : "";
//     return () => { document.body.style.overflow = ""; };
//   }, [open]);
//   if (!open) return null;
//   const embedUrl = url
//     ? url.includes("cloudinary")
//       ? `${url}#toolbar=0&view=FitH`
//       : `https://docs.google.com/gviewer?url=${encodeURIComponent(url)}&embedded=true`
//     : null;
//   return (
//     <div className="fixed inset-0 z-[9000] flex flex-col" style={{ background:"#f8fafc" }}>
//       <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b border-slate-200 bg-white shadow-sm">
//         <div className="flex items-center gap-3">
//           <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-red-50 border border-red-100">
//             <FiFileText size={16} className="text-red-500"/>
//           </div>
//           <div>
//             <p className="text-sm font-bold text-slate-800">{fileName||"Resume"}</p>
//             <p className="text-xs text-slate-400">PDF Preview</p>
//           </div>
//         </div>
//         <div className="flex items-center gap-2">
//           <button onClick={() => setZoom(z => Math.max(50, z-25))} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"><FiZoomOut size={14}/></button>
//           <span className="text-xs text-slate-600 w-12 text-center font-bold">{zoom}%</span>
//           <button onClick={() => setZoom(z => Math.min(200, z+25))} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"><FiZoomIn size={14}/></button>
//           <button onClick={() => setZoom(100)} className="h-8 px-2.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 flex items-center gap-1 transition"><FiRefreshCw size={11}/>Reset</button>
//           {url && <a href={url} download target="_blank" rel="noreferrer" className="h-8 px-3 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 transition"><FiDownload size={12}/>Download</a>}
//           {url && <a href={url} target="_blank" rel="noreferrer" className="h-8 px-3 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 transition"><FiMaximize2 size={12}/>Full Tab</a>}
//           <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 transition ml-1"><FiX size={17}/></button>
//         </div>
//       </div>
//       <div className="flex-1 overflow-auto flex items-start justify-center p-6 bg-slate-100">
//         {embedUrl
//           ? <div style={{ width:`${zoom}%`, maxWidth:"100%", minWidth:"400px" }}>
//               <iframe key={embedUrl} src={embedUrl} title="Resume PDF" className="w-full rounded-2xl shadow-lg border-0" style={{ height:"calc(100vh - 100px)", minHeight:"500px" }}/>
//             </div>
//           : <div className="flex flex-col items-center justify-center h-64 text-slate-400">
//               <FiFileText size={48} className="mb-4 opacity-30"/>
//               <p className="font-bold">Resume URL not available</p>
//               <p className="text-sm mt-1 opacity-60">Please upload your resume first, then save your profile.</p>
//             </div>}
//       </div>
//     </div>
//   );
// }

// // ─── AVATAR MODAL ─────────────────────────────────────────────────────────────
// function AvatarModal({ open, onClose, currentUrl, onUpload, onUrlSelect }) {
//   const fileRef  = useRef(null);
//   const videoRef = useRef(null);
//   const [tab, setTab]         = useState("local");
//   const [stream, setStream]   = useState(null);
//   const [urlVal, setUrlVal]   = useState("");
//   const [uploading, setUploading] = useState(false);
//   const { getToken } = useAuth();

//   const stopCam = useCallback(() => { stream?.getTracks().forEach(t => t.stop()); setStream(null); }, [stream]);
//   useEffect(() => { if (!open) stopCam(); }, [open, stopCam]);

//   const startCam = async () => {
//     try {
//       const s = await navigator.mediaDevices.getUserMedia({ video: true });
//       setStream(s);
//       if (videoRef.current) videoRef.current.srcObject = s;
//     } catch { toast("Camera access denied", "error"); }
//   };
//   const capture = async () => {
//     const c = document.createElement("canvas");
//     c.width = videoRef.current.videoWidth; c.height = videoRef.current.videoHeight;
//     c.getContext("2d").drawImage(videoRef.current, 0, 0);
//     c.toBlob(async blob => { await handleFileUpload(new File([blob], "avatar.jpg", { type:"image/jpeg" })); stopCam(); }, "image/jpeg", 0.9);
//   };
//   const handleFileUpload = async file => {
//     try {
//       setUploading(true);
//       const token = await getToken();
//       const res = await uploadAvatarAPI(file, token);
//       const avatarUrl = res?.data?.data?.avatarUrl ?? res?.data?.avatarUrl;
//       if (avatarUrl) { onUpload(avatarUrl); toast("Profile photo updated!", "success"); onClose(); }
//     } catch { toast("Failed to upload photo", "error"); }
//     finally { setUploading(false); }
//   };

//   return (
//     <Modal open={open} onClose={() => { stopCam(); onClose(); }} title="Update Profile Photo">
//       <div className="flex gap-2">
//         {[["local","📁 Local"],["cloud","☁️ URL"],["camera","📷 Camera"]].map(([t,l]) => (
//           <button key={t} onClick={() => { setTab(t); if (t==="camera") startCam(); else stopCam(); }}
//             className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${tab===t?"text-white bg-blue-500":"bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{l}</button>
//         ))}
//       </div>
//       {tab === "local" && (
//         <>
//           <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }}/>
//           <button onClick={() => fileRef.current?.click()} disabled={uploading}
//             className="w-full py-10 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 text-blue-600 text-sm font-bold hover:bg-blue-100 transition disabled:opacity-60">
//             {uploading ? "Uploading…" : "📁 Click to choose from device"}
//           </button>
//         </>
//       )}
//       {tab === "cloud" && (
//         <div className="space-y-3">
//           <Inp label="Image URL" value={urlVal} onChange={e => setUrlVal(e.target.value)} placeholder="https://example.com/photo.jpg"/>
//           {urlVal && <img src={urlVal} alt="" className="h-24 w-24 rounded-full object-cover mx-auto border-2 border-blue-200" onError={e => e.target.style.display="none"}/>}
//           <button onClick={() => { if (urlVal) { onUrlSelect(urlVal); toast("Profile photo updated!", "success"); onClose(); } }}
//             className="w-full py-2.5 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 transition">Use this photo</button>
//         </div>
//       )}
//       {tab === "camera" && (
//         <div className="space-y-3">
//           <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl bg-black aspect-video"/>
//           {stream
//             ? <button onClick={capture} disabled={uploading} className="w-full py-2.5 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600">📸 Capture & Upload</button>
//             : <button onClick={startCam} className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200">Start Camera</button>}
//         </div>
//       )}
//     </Modal>
//   );
// }

// // ─── COVER MODAL ──────────────────────────────────────────────────────────────
// function CoverModal({ open, onClose, onSelect }) {
//   const fileRef = useRef(null);
//   const [urlVal, setUrlVal]     = useState("");
//   const [activeTab, setActiveTab] = useState("presets");
//   return (
//     <Modal open={open} onClose={onClose} title="Choose Cover Banner" extraWide>
//       <div className="flex gap-2 flex-wrap">
//         {["presets","gradients","upload"].map(t => (
//           <button key={t} onClick={() => setActiveTab(t)}
//             className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition ${activeTab===t?"text-white bg-blue-500":"bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
//             {t==="presets"?"🖼 Photos":t==="gradients"?"🎨 Gradients":"📁 Upload"}
//           </button>
//         ))}
//       </div>
//       {activeTab === "presets" && (
//         <div className="grid grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto pr-1">
//           {FIXED_BANNERS.map((u, i) => (
//             <div key={i} className="relative group cursor-pointer rounded-xl overflow-hidden h-24" onClick={() => { onSelect(u); onClose(); toast("Cover updated!", "success"); }}>
//               <img src={u} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"/>
//               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
//                 <span className="bg-white rounded-full px-2 py-0.5 text-xs font-bold text-slate-700">Select</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//       {activeTab === "gradients" && (
//         <div className="grid grid-cols-4 gap-2">
//           {GRADIENT_BANNERS.map((g, i) => (
//             <div key={i} className="h-16 rounded-xl cursor-pointer hover:scale-105 hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-400"
//               style={{ background:g }} onClick={() => { onSelect(`__gradient__${g}`); onClose(); toast("Gradient set!", "success"); }}/>
//           ))}
//         </div>
//       )}
//       {activeTab === "upload" && (
//         <div className="space-y-3">
//           <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { onSelect(ev.target.result); onClose(); toast("Cover updated!", "success"); }; r.readAsDataURL(f); }}/>
//           <button onClick={() => fileRef.current?.click()} className="w-full py-6 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 text-blue-600 text-sm font-bold hover:bg-blue-100 transition">📁 Upload from device</button>
//           <div className="flex gap-2">
//             <Inp label="Or paste image URL" value={urlVal} onChange={e => setUrlVal(e.target.value)} placeholder="https://…" className="flex-1"/>
//             <button onClick={() => { if (urlVal) { onSelect(urlVal); onClose(); toast("Banner set!", "success"); } }} className="self-end h-10 px-4 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 transition">Use</button>
//           </div>
//         </div>
//       )}
//     </Modal>
//   );
// }

// // ─── SKILLS MODAL ─────────────────────────────────────────────────────────────
// function SkillsModal({ open, onClose, skills, onChange }) {
//   const [search, setSearch]         = useState("");
//   const [customInput, setCustomInput] = useState("");
//   const [activeCategory, setActiveCategory] = useState("Languages");
//   const selectedNames = skills.map(s => s.name.toLowerCase());
//   const isSelected = name => selectedNames.includes(name.toLowerCase());
//   const toggle = name => {
//     if (isSelected(name)) onChange(skills.filter(s => s.name.toLowerCase() !== name.toLowerCase()));
//     else onChange(normalizeSkillsForUi([...skills, name]));
//   };
//   const allFlat = Object.values(SKILL_CATEGORIES).flat();
//   const searchResults = search.trim() ? allFlat.filter(s => s.toLowerCase().includes(search.toLowerCase())) : [];
//   const addCustom = () => {
//     const parsed = parseSkillsText(customInput).filter(n => !isSelected(n));
//     if (!parsed.length) return;
//     onChange(normalizeSkillsForUi([...skills, ...parsed]));
//     setCustomInput(""); toast(`Added ${parsed.join(", ")}!`, "success");
//   };
//   return (
//     <Modal open={open} onClose={onClose} title="Add / Edit Skills" wide>
//       {skills.length > 0 && (
//         <div>
//           <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Selected ({skills.length})</p>
//           <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 min-h-[44px]">
//             {skills.map(s => <ColorBadge key={s.id} name={s.name} color={skillColor(s.name)} onRemove={() => toggle(s.name)}/>)}
//           </div>
//         </div>
//       )}
//       <div className="relative">
//         <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
//         <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search skills…"
//           className="w-full h-10 rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"/>
//       </div>
//       <div className="flex gap-1.5 overflow-x-auto pb-1">
//         {Object.keys(SKILL_CATEGORIES).map(cat => (
//           <button key={cat} onClick={() => setActiveCategory(cat)}
//             className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition ${activeCategory===cat?"text-white bg-blue-500 border-transparent":"bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}>{cat}</button>
//         ))}
//       </div>
//       <div className="flex flex-wrap gap-2">
//         {(search.trim() ? searchResults : SKILL_CATEGORIES[activeCategory]).map(s => (
//           <button key={s} onClick={() => toggle(s)}
//             className="px-3 py-1.5 rounded-full text-xs font-bold border transition shadow-sm"
//             style={isSelected(s)?{background:skillColor(s),color:"white",borderColor:skillColor(s)}:{background:"white",color:"#475569",borderColor:"#e2e8f0"}}>
//             {isSelected(s)?"✓ ":""}{s}
//           </button>
//         ))}
//       </div>
//       <div>
//         <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Add custom skill</p>
//         <div className="flex gap-2">
//           <input value={customInput} onChange={e => setCustomInput(e.target.value)}
//             onKeyDown={e => { if (e.key==="Enter") { e.preventDefault(); addCustom(); } }}
//             placeholder="Type skill + Enter (or comma separated)" className="flex-1 h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"/>
//           <button onClick={addCustom} className="px-4 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 transition">Add</button>
//         </div>
//       </div>
//       <button onClick={onClose} className="w-full py-2.5 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 transition shadow-sm">Done</button>
//     </Modal>
//   );
// }

// // ─── PROJECTS MODAL ───────────────────────────────────────────────────────────
// function newProject() { return { id:`pr_${Date.now()}`,title:"",description:"",techStack:"",hashtags:"",imageUrl:"",liveUrl:"",githubUrl:"",daysToComplete:"" }; }
// function ProjectsModal({ open, onClose, projects, onChange }) {
//   const [local, setLocal] = useState([]);
//   const fileRefs = useRef({});
//   useEffect(() => { if (open) setLocal(projects.length ? [...projects] : [newProject()]); }, [open]);
//   const upd = (id, field, value) => setLocal(p => p.map(x => x.id===id?{...x,[field]:value}:x));
//   const pickImg = (id, e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => upd(id,"imageUrl",ev.target.result); r.readAsDataURL(f); };
//   const save = () => { onChange(local.filter(p => p.title.trim())); onClose(); toast("Projects saved!", "success"); };
//   return (
//     <Modal open={open} onClose={onClose} title="Add / Edit Projects" wide>
//       <div className="space-y-6">
//         {local.map((pr, idx) => (
//           <div key={pr.id} className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
//             <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
//               <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
//                 <span className="h-6 w-6 rounded-full text-white text-xs flex items-center justify-center bg-blue-500 font-bold">{idx+1}</span>
//                 {pr.title||"New Project"}
//               </span>
//               {local.length > 1 && <button onClick={() => setLocal(p => p.filter(x => x.id!==pr.id))} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"><FiTrash2 size={11}/>Remove</button>}
//             </div>
//             <div className="p-4 space-y-3">
//               {pr.imageUrl
//                 ? <div className="relative group rounded-xl overflow-hidden h-36 bg-slate-200">
//                     <img src={pr.imageUrl} alt="" className="w-full h-full object-cover"/>
//                     <button onClick={() => upd(pr.id,"imageUrl","")} className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-500"><FiTrash2 size={12}/></button>
//                   </div>
//                 : <div className="flex gap-2">
//                     <input type="file" accept="image/*" className="hidden" ref={el => fileRefs.current[pr.id]=el} onChange={e => pickImg(pr.id,e)}/>
//                     <button onClick={() => fileRefs.current[pr.id]?.click()} className="flex-1 py-4 rounded-xl border-2 border-dashed border-slate-200 text-xs text-slate-500 hover:border-blue-300 hover:bg-blue-50 transition flex items-center justify-center gap-2"><FiImage size={14}/>Upload image</button>
//                     <input value={pr.imageUrl} onChange={e => upd(pr.id,"imageUrl",e.target.value)} placeholder="Or paste image URL…" className="flex-1 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-400 bg-white"/>
//                   </div>}
//               <div className="grid grid-cols-2 gap-3">
//                 <Inp label="Project Name *" value={pr.title} onChange={e => upd(pr.id,"title",e.target.value)} placeholder="My Awesome App" className="col-span-2"/>
//                 <Txta label="Description" value={pr.description} onChange={e => upd(pr.id,"description",e.target.value)} placeholder="What does this project do?" className="h-24 w-full col-span-2"/>
//                 <Inp label="Tech Stack" value={pr.techStack} onChange={e => upd(pr.id,"techStack",e.target.value)} placeholder="React, Node.js, MongoDB" className="col-span-2"/>
//                 <Inp label="Hashtags" value={pr.hashtags} onChange={e => upd(pr.id,"hashtags",e.target.value)} placeholder="#webdev #react #fullstack" className="col-span-2"/>
//                 <div className="flex flex-col gap-1.5">
//                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><FiClock size={11}/>Days to Build</label>
//                   <input type="number" min="1" value={pr.daysToComplete} onChange={e => upd(pr.id,"daysToComplete",e.target.value)} placeholder="e.g. 14" className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white outline-none focus:border-blue-400"/>
//                 </div>
//                 <Inp label="Live Demo URL" value={pr.liveUrl} onChange={e => upd(pr.id,"liveUrl",e.target.value)} placeholder="https://…"/>
//                 <Inp label="GitHub URL" value={pr.githubUrl} onChange={e => upd(pr.id,"githubUrl",e.target.value)} placeholder="https://github.com/…" className="col-span-2"/>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//       <button onClick={() => setLocal(p => [...p, newProject()])} className="w-full py-3 rounded-2xl border-2 border-dashed border-blue-200 text-sm text-blue-600 font-bold hover:bg-blue-50 transition flex items-center justify-center gap-2"><FiPlus/>Add Another Project</button>
//       <button onClick={save} className="w-full py-3 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 transition shadow-sm">Save All Projects</button>
//     </Modal>
//   );
// }

// // ─── ABOUT MODAL ──────────────────────────────────────────────────────────────
// function AboutModal({ open, onClose, value, onSave }) {
//   const [draft, setDraft] = useState(value);
//   useEffect(() => { if (open) setDraft(value); }, [open, value]);
//   return (
//     <Modal open={open} onClose={onClose} title="Edit About / Headline">
//       <p className="text-xs text-slate-500 leading-relaxed">Write a compelling summary — mention your course, skills, goals, and what kind of opportunities you're seeking.</p>
//       <Txta value={draft} onChange={e => setDraft(e.target.value.slice(0,600))} placeholder="e.g. Final year B.Tech CSE student passionate about full-stack development…" className="h-48 w-full"/>
//       <div className="flex justify-between items-center">
//         <span className={`text-xs font-bold ${draft.length>540?"text-amber-500":"text-slate-400"}`}>{draft.length}/600</span>
//         <div className="flex gap-2">
//           <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
//           <button onClick={() => { onSave(draft); onClose(); toast("About section updated!", "success"); }}
//             className="px-5 py-2 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 shadow-sm">Save</button>
//         </div>
//       </div>
//     </Modal>
//   );
// }

// // ─── EDUCATION MODAL ─────────────────────────────────────────────────────────
// function EducationModal({ open, onClose, education, onChange }) {
//   const [local, setLocal] = useState([]);
//   useEffect(() => {
//     if (open) setLocal(education.length ? education.map(e => ({...e})) : [{ id:`ed_${Date.now()}`,degree:"",college:"",year:"",branch:"",score:"",board:"",universityRollNo:"",achievements:"" }]);
//   }, [open]);
//   const upd = (id, field, val) => setLocal(p => p.map(x => x.id===id?{...x,[field]:val}:x));
//   const YEAR_OPTIONS = Array.from({length:10}, (_,i) => String(new Date().getFullYear()+2-i));
//   return (
//     <Modal open={open} onClose={onClose} title="Edit Education Details" wide>
//       <div className="space-y-5">
//         {local.map((ed, idx) => (
//           <div key={ed.id} className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
//             <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
//               <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
//                 <span className="h-6 w-6 rounded-full text-white text-xs flex items-center justify-center bg-emerald-500">{idx+1}</span>
//                 Education Entry
//               </span>
//               {local.length > 1 && <button onClick={() => setLocal(p => p.filter(x => x.id!==ed.id))} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"><FiTrash2 size={11}/>Remove</button>}
//             </div>
//             <div className="p-4 grid grid-cols-2 gap-3">
//               <ComboInput label="Degree / Class *" value={ed.degree} onChange={v => upd(ed.id,"degree",v)} options={DEGREE_OPTIONS} placeholder="e.g. B.Tech, 12th…"/>
//               <ComboInput label="Branch / Stream" value={ed.branch} onChange={v => upd(ed.id,"branch",v)} options={BRANCH_OPTIONS} placeholder="e.g. CSE, Commerce…"/>
//               <Inp label="College / School *" value={ed.college} onChange={e => upd(ed.id,"college",e.target.value)} placeholder="Full institution name" className="col-span-2"/>
//               <ComboInput label="Board / University" value={ed.board} onChange={v => upd(ed.id,"board",v)} options={BOARD_OPTIONS} placeholder="e.g. CBSE, VTU…"/>
//               <ComboInput label="Pass-out Year *" value={ed.year} onChange={v => upd(ed.id,"year",v)} options={YEAR_OPTIONS} placeholder="e.g. 2026"/>
//               <Inp label="Score / CGPA / %" value={ed.score} onChange={e => upd(ed.id,"score",e.target.value)} placeholder="e.g. 8.5 CGPA or 92%"/>
//               <Inp label="University Roll Number" value={ed.universityRollNo} onChange={e => upd(ed.id,"universityRollNo",e.target.value)} placeholder="e.g. 1RV20CS001"/>
//               <Txta label="Achievements / Activities" value={ed.achievements} onChange={e => upd(ed.id,"achievements",e.target.value)} placeholder="e.g. Rank 3, Hackathon winner…" className="col-span-2 h-16 w-full"/>
//             </div>
//           </div>
//         ))}
//       </div>
//       <button onClick={() => setLocal(p => [...p, { id:`ed_${Date.now()}`,degree:"",college:"",year:"",branch:"",score:"",board:"",universityRollNo:"",achievements:"" }])}
//         className="w-full py-3 rounded-2xl border-2 border-dashed border-emerald-200 text-sm text-emerald-600 font-bold hover:bg-emerald-50 transition">+ Add Another Education</button>
//       <button onClick={() => { onChange(local.filter(e => e.college||e.degree)); onClose(); toast("Education saved!", "success"); }}
//         className="w-full py-2.5 rounded-xl text-white text-sm font-bold bg-emerald-500 hover:bg-emerald-600 shadow-sm">Save Education</button>
//     </Modal>
//   );
// }

// // ─── PREFERRED JOBS MODAL ─────────────────────────────────────────────────────
// function PreferredModal({ open, onClose, preferred, onChange }) {
//   const [local, setLocal] = useState({ ...EMPTY.preferred });
//   useEffect(() => { if (open) setLocal({ ...preferred }); }, [open, preferred]);
//   const upd = (k, v) => setLocal(p => ({ ...p, [k]:v }));
//   const LOC_OPTIONS = ["Bangalore","Mumbai","Hyderabad","Chennai","Pune","Delhi / NCR","Noida","Gurgaon","Kolkata","Ahmedabad","Remote","Pan India","Any Location"];
//   const chipStyle = sel => sel
//     ? { background:"#3b82f6",color:"white",borderColor:"#3b82f6" }
//     : { background:"white",color:"#475569",borderColor:"#e2e8f0" };
//   return (
//     <Modal open={open} onClose={onClose} title="Preferred Job Settings" wide>
//       <div className="grid grid-cols-2 gap-4">
//         {[["stream","Job Stream",JOB_STREAMS],["category","Job Category",JOB_CATEGORIES]].map(([key,heading,opts]) => (
//           <div key={key} className="col-span-2">
//             <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{heading}</p>
//             <div className="flex flex-wrap gap-2 mb-2">{opts.map(s => <button key={s} onClick={() => upd(key,s)} className="px-3 py-1.5 rounded-full text-xs font-bold border transition" style={chipStyle(local[key]===s)}>{s}</button>)}</div>
//             <input value={local[key]} onChange={e => upd(key,e.target.value)} placeholder="Or type custom…" className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 bg-white"/>
//           </div>
//         ))}
//         <div className="col-span-2">
//           <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Work Mode</p>
//           <div className="flex gap-2 flex-wrap">{WORK_MODES.map(m => <button key={m} onClick={() => upd("workMode",m)} className="px-4 py-2 rounded-xl text-sm font-bold border transition" style={chipStyle(local.workMode===m)}>{m}</button>)}</div>
//         </div>
//         <div className="col-span-2">
//           <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Expected Salary</p>
//           <div className="flex flex-wrap gap-2 mb-2">{SALARY_RANGES.map(s => <button key={s} onClick={() => upd("salary",s)} className="px-3 py-1.5 rounded-full text-xs font-bold border transition" style={chipStyle(local.salary===s)}>{s}</button>)}</div>
//           <input value={local.salary} onChange={e => upd("salary",e.target.value)} placeholder="Or type custom…" className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 bg-white"/>
//         </div>
//         <div className="col-span-2">
//           <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Preferred Locations</p>
//           <div className="flex flex-wrap gap-2 mb-2">
//             {LOC_OPTIONS.map(l => {
//               const isSel = (local.locations||"").split(",").map(s => s.trim()).includes(l);
//               return (
//                 <button key={l} onClick={() => {
//                   const arr = (local.locations||"").split(",").map(s => s.trim()).filter(Boolean);
//                   const next = isSel ? arr.filter(x => x!==l) : [...arr,l];
//                   upd("locations", next.join(", "));
//                 }} className="px-3 py-1.5 rounded-full text-xs font-bold border transition" style={chipStyle(isSel)}>{l}</button>
//               );
//             })}
//           </div>
//           <input value={local.locations} onChange={e => upd("locations",e.target.value)} placeholder="Or type cities…" className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 bg-white"/>
//         </div>
//       </div>
//       <button onClick={() => { onChange(local); onClose(); toast("Job preferences saved!", "success"); }}
//         className="w-full py-2.5 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 shadow-sm mt-2">Save Preferences</button>
//     </Modal>
//   );
// }

// // ─── RECENTLY LOGGED-IN USERS (LinkedIn style) ────────────────────────────────
// // Shows users who recently logged in, with _id, name, avatar, designation, + Follow button
// function RecentUsersSection({ token, onFollowChange }) {
//   const [users, setUsers]             = useState([]);
//   const [loading, setLoading]         = useState(true);
//   const [followState, setFollowState] = useState({});    // { userId: "none" | "following" | "loading" }
//   const [showAll, setShowAll]         = useState(false);

//   useEffect(() => {
//     if (!token) return;
//     setLoading(true);
//     getRecentUsers(token)
//       .then(res => {
//         // API should return: [{ _id, name, avatarUrl, designation, lastSeen?, city? }, ...]
//         const data = res?.data?.data ?? res?.data ?? [];
//         const arr  = Array.isArray(data) ? data : [];
//         setUsers(arr);
//         const init = {};
//         arr.forEach(u => { init[u._id] = "none"; });
//         setFollowState(init);
//       })
//       .catch(() => setUsers([]))
//       .finally(() => setLoading(false));
//   }, [token]);

//   const handleFollow = async user => {
//     const current = followState[user._id] || "none";
//     if (current === "loading") return;
//     setFollowState(p => ({ ...p, [user._id]:"loading" }));
//     try {
//       const res    = await toggleFollow(user._id, token);
//       const action = res?.data?.action ?? res?.data?.data?.action;
//       const next   = action === "followed" ? "following" : "none";
//       setFollowState(p => ({ ...p, [user._id]:next }));
//       toast(next === "following" ? `Now following ${user.name}!` : `Unfollowed ${user.name}`, next === "following" ? "success" : "info");
//       onFollowChange?.(next === "following" ? "followed" : "unfollowed");
//     } catch {
//       setFollowState(p => ({ ...p, [user._id]:current }));
//       toast("Failed — please try again", "error");
//     }
//   };

//   if (loading) return (
//     <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm">
//       <div className="flex items-center gap-2 mb-4">
//         <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center"><FiActivity size={14} className="text-emerald-500"/></div>
//         <p className="text-sm font-bold text-slate-700">Recently Active</p>
//       </div>
//       <div className="flex items-center gap-2 text-slate-400 text-xs">
//         <div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-transparent animate-spin"/>
//         Loading recent users…
//       </div>
//     </div>
//   );

//   if (users.length === 0) return null;

//   const displayed = showAll ? users : users.slice(0, 5);

//   return (
//     <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
//       {/* Header */}
//       <div className="px-5 pt-5 pb-4 border-b border-slate-100">
//         <div className="flex items-center gap-2.5 mb-1">
//           <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
//             <FiActivity size={14} className="text-emerald-500"/>
//           </div>
//           <div>
//             <p className="text-sm font-bold text-slate-800">Recently Active</p>
//             <p className="text-xs text-slate-400">{users.length} user{users.length!==1?"s":""} online recently</p>
//           </div>
//         </div>
//       </div>

//       {/* User list */}
//       <div className="divide-y divide-slate-50">
//         {displayed.map((user, idx) => {
//           const state       = followState[user._id] || "none";
//           const isFollowing = state === "following";
//           const isLoading   = state === "loading";

//           return (
//             <div key={user._id} className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors group">
//               <div className="flex items-center gap-3">
//                 {/* Avatar with online dot */}
//                 <div className="relative flex-shrink-0">
//                   {user.avatarUrl
//                     ? <img src={user.avatarUrl} alt={user.name}
//                         className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"/>
//                     : <div className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-white shadow-sm"
//                         style={{ background:avatarGradient(user._id) }}>
//                         {initials(user.name)}
//                       </div>}
//                   {/* Green online indicator */}
//                   <span className="online-dot absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white"/>
//                 </div>

//                 {/* Info */}
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-1.5">
//                     <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{user.name}</p>
//                   </div>
//                   <p className="text-xs text-slate-500 truncate leading-tight mt-0.5">
//                     {user.designation || "Student"}
//                     {user.city ? <span className="text-slate-400"> · {user.city}</span> : null}
//                   </p>
//                   {/* User ID badge — shown on hover like LinkedIn's "1st", "2nd" */}
//                   <p className="text-[10px] text-slate-300 font-mono truncate leading-tight mt-0.5 group-hover:text-slate-400 transition-colors">
//                     ID: {user._id}
//                   </p>
//                 </div>

//                 {/* Follow button — LinkedIn style */}
//                 <button
//                   onClick={() => handleFollow(user)}
//                   disabled={isLoading}
//                   className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all disabled:opacity-60 ${
//                     isFollowing
//                       ? "bg-slate-100 text-slate-500 border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
//                       : "bg-white text-blue-600 border-blue-300 hover:bg-blue-500 hover:text-white hover:border-blue-500 shadow-sm"
//                   }`}
//                 >
//                   {isLoading
//                     ? <span className="h-3 w-3 rounded-full border border-current border-t-transparent animate-spin"/>
//                     : isFollowing
//                       ? <><FiCheck size={11}/> Following</>
//                       : <><FiUserPlus size={11}/> Follow</>}
//                 </button>
//               </div>

//               {/* Mutual skills / connections row (if available) */}
//               {(user.mutualConnections > 0 || user.sharedSkills > 0) && (
//                 <div className="flex items-center gap-3 mt-1.5 ml-[52px]">
//                   {user.mutualConnections > 0 && (
//                     <span className="text-[10px] text-blue-500 font-semibold flex items-center gap-0.5">
//                       <FiUsers size={9}/> {user.mutualConnections} mutual
//                     </span>
//                   )}
//                   {user.sharedSkills > 0 && (
//                     <span className="text-[10px] text-slate-400 font-semibold">
//                       {user.sharedSkills} shared skill{user.sharedSkills>1?"s":""}
//                     </span>
//                   )}
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>

//       {/* Show more / less */}
//       {users.length > 5 && (
//         <button
//           onClick={() => setShowAll(v => !v)}
//           className="w-full py-3 text-xs font-bold text-blue-500 hover:bg-blue-50 transition-colors border-t border-slate-100 flex items-center justify-center gap-1.5">
//           {showAll
//             ? <><FiChevronDown size={13} style={{ transform:"rotate(180deg)" }}/> Show less</>
//             : <><FiUsers size={12}/> Show {users.length - 5} more</>}
//         </button>
//       )}
//     </div>
//   );
// }

// // ─── FOLLOW SUGGESTIONS (existing, light-themed) ──────────────────────────────
// function FollowSuggestions({ token, onFollowChange }) {
//   const [suggestions, setSuggestions] = useState([]);
//   const [loading, setLoading]         = useState(true);
//   const [followState, setFollowState] = useState({});

//   useEffect(() => {
//     if (!token) return;
//     setLoading(true);
//     getFollowSuggestions(token)
//       .then(res => {
//         const data = res?.data?.data ?? res?.data ?? [];
//         const arr  = Array.isArray(data) ? data : [];
//         setSuggestions(arr);
//         const init = {};
//         arr.forEach(u => { init[u._id] = "none"; });
//         setFollowState(init);
//       })
//       .catch(() => setSuggestions([]))
//       .finally(() => setLoading(false));
//   }, [token]);

//   const handleFollow = async user => {
//     const current = followState[user._id] || "none";
//     if (current === "loading") return;
//     setFollowState(p => ({ ...p, [user._id]:"loading" }));
//     try {
//       const res    = await toggleFollow(user._id, token);
//       const action = res?.data?.action ?? res?.data?.data?.action;
//       const next   = action === "followed" ? "following" : "none";
//       setFollowState(p => ({ ...p, [user._id]:next }));
//       toast(next === "following" ? `Now following ${user.name}!` : `Unfollowed ${user.name}`, next === "following" ? "success" : "info");
//       onFollowChange?.(next === "following" ? "followed" : "unfollowed");
//     } catch {
//       setFollowState(p => ({ ...p, [user._id]:current }));
//       toast("Failed — please try again", "error");
//     }
//   };

//   if (loading) return (
//     <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm">
//       <div className="flex items-center gap-2 text-slate-400 text-xs">
//         <div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-transparent animate-spin"/>
//         Finding people you may know…
//       </div>
//     </div>
//   );
//   if (suggestions.length === 0) return null;

//   return (
//     <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm">
//       <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
//         <FiUsers size={14} className="text-blue-500"/>People you may know
//       </h3>
//       <div className="space-y-4">
//         {suggestions.map(s => {
//           const state       = followState[s._id] || "none";
//           const isFollowing = state === "following";
//           const isLoading   = state === "loading";
//           return (
//             <div key={s._id} className="flex items-center gap-3">
//               {s.avatarUrl
//                 ? <img src={s.avatarUrl} alt={s.name} className="h-9 w-9 rounded-full object-cover flex-shrink-0 border border-slate-200"/>
//                 : <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background:avatarGradient(s._id) }}>{initials(s.name)}</div>}
//               <div className="flex-1 min-w-0">
//                 <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
//                 <p className="text-xs text-slate-500 truncate">{s.designation}{s.city?` · ${s.city}`:""}</p>
//                 {s.mutualConnections > 0 && <p className="text-xs text-blue-500 font-semibold">{s.mutualConnections} mutual</p>}
//               </div>
//               <button onClick={() => handleFollow(s)} disabled={isLoading}
//                 className={`text-xs font-bold px-3 py-1.5 rounded-full border transition flex-shrink-0 disabled:opacity-60 ${
//                   isFollowing
//                     ? "bg-slate-100 text-slate-500 border-slate-200"
//                     : "text-blue-600 border-blue-300 hover:bg-blue-500 hover:text-white hover:border-blue-500"
//                 }`}>
//                 {isLoading ? "…" : isFollowing ? "✓ Following" : "+ Follow"}
//               </button>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// // ─── APPLIED JOBS TAB ─────────────────────────────────────────────────────────
// const STATUS_STYLES = {
//   "Applied":             { bg:"#eff6ff",color:"#3b82f6",border:"#bfdbfe" },
//   "Under Review":        { bg:"#fffbeb",color:"#f59e0b",border:"#fde68a" },
//   "Shortlisted":         { bg:"#f0fdf4",color:"#10b981",border:"#a7f3d0" },
//   "Interview Scheduled": { bg:"#faf5ff",color:"#a855f7",border:"#e9d5ff" },
//   "Rejected":            { bg:"#fef2f2",color:"#ef4444",border:"#fecaca" },
//   "Offered":             { bg:"#ecfeff",color:"#06b6d4",border:"#a5f3fc" },
// };

// function AppliedJobsTab({ token }) {
//   const [jobs, setJobs]     = useState([]);
//   const [loading, setLoading] = useState(true);

//   const loadJobs = useCallback(async () => {
//     if (!token) return;
//     setLoading(true);
//     try {
//       const res = await getAppliedJobs(token);
//       setJobs(res?.data?.data ?? res?.data ?? []);
//     } catch { toast("Failed to load applied jobs", "error"); }
//     finally { setLoading(false); }
//   }, [token]);

//   useEffect(() => { loadJobs(); }, [loadJobs]);

//   const handleWithdraw = async app => {
//     const ok = await sweet({ type:"confirm", title:"Withdraw Application?", text:`Withdraw your application for ${app.title} at ${app.company}? This cannot be undone.`, confirmText:"Yes, Withdraw", cancelText:"Keep" });
//     if (!ok) return;
//     try {
//       await withdrawApplication(app.applicationId, token);
//       setJobs(p => p.filter(j => j.applicationId !== app.applicationId));
//       toast(`Application withdrawn from ${app.company}`, "warning");
//       sweet({ type:"success", title:"Withdrawn!", text:"Your application has been withdrawn.", confirmText:"OK" });
//     } catch { toast("Failed to withdraw", "error"); }
//   };

//   if (loading) return (
//     <div className="max-w-[1128px] mx-auto px-4 py-12 text-center">
//       <div className="h-10 w-10 rounded-full border-2 border-blue-400 border-t-transparent animate-spin mx-auto"/>
//     </div>
//   );

//   return (
//     <div className="max-w-[1128px] mx-auto px-4 py-4 relative z-10">
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h2 className="text-xl font-extrabold text-slate-800">Applied Jobs</h2>
//           <p className="text-sm text-slate-500">{jobs.length} application{jobs.length!==1?"s":""}</p>
//         </div>
//         <Link to="/student/jobs" className="px-4 py-2 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 flex items-center gap-2 transition shadow-sm"><FiSearch size={13}/>Browse Jobs</Link>
//       </div>
//       {jobs.length === 0
//         ? <div className="rounded-2xl p-12 text-center border border-slate-200 bg-white shadow-sm">
//             <FiCheckSquare size={40} className="mx-auto mb-3 text-slate-300"/>
//             <p className="font-bold text-slate-500">No applications yet</p>
//             <p className="text-xs text-slate-400 mt-1">Jobs you apply to will appear here</p>
//           </div>
//         : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {jobs.map(job => {
//               const { dayName, date, time, ago } = formatAppliedDate(job.appliedAt);
//               const ss = STATUS_STYLES[job.status] || STATUS_STYLES["Applied"];
//               return (
//                 <div key={job.applicationId} className="rounded-2xl p-5 border overflow-hidden relative bg-white shadow-sm hover:shadow-md hover:scale-[1.01] transition-all" style={{ borderColor:ss.border }}>
//                   <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background:ss.color, opacity:0.4 }}/>
//                   <div className="flex items-start gap-4">
//                     <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold shadow-sm flex-shrink-0" style={{ background:ss.bg, border:`1px solid ${ss.border}`, color:ss.color }}>
//                       {job.companyLogo ? <img src={job.companyLogo} alt={job.company} className="h-10 w-10 rounded-xl object-contain"/> : (job.company?.[0]||"?")}
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-start justify-between gap-2">
//                         <div>
//                           <p className="font-extrabold text-slate-800 text-base">{job.title}</p>
//                           <p className="text-sm font-bold text-slate-500">{job.company}</p>
//                         </div>
//                         <span className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background:ss.bg,color:ss.color,border:`1px solid ${ss.border}` }}>{job.status}</span>
//                       </div>
//                       {job.location && <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><FiMapPin size={10}/>{job.location}</p>}
//                     </div>
//                   </div>
//                   <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-100">
//                     <div className="text-xs text-slate-400 flex items-center gap-1.5"><FiCalendar size={11}/>{dayName}, {date} · {time}</div>
//                     <span className="text-xs font-bold" style={{ color:ss.color }}>{ago}</span>
//                   </div>
//                   <div className="mt-3 flex gap-2">
//                     <button className="flex-1 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition flex items-center justify-center gap-1"><FiEye size={11}/>View Job</button>
//                     <button onClick={() => handleWithdraw(job)} className="flex-1 py-1.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition flex items-center justify-center gap-1"><FiX size={11}/>Withdraw</button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>}
//     </div>
//   );
// }

// // ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
// export default function Profile() {
//   const { getToken }     = useAuth();
//   const resumeInputRef   = useRef(null);
//   const [token, setToken]           = useState(null);
//   const [form, setForm]             = useState(EMPTY);
//   const [initialForm, setInitialForm] = useState(EMPTY);
//   const [loading, setLoading]       = useState(true);
//   const [saving, setSaving]         = useState(false);
//   const [uploadingResume, setUploadingResume] = useState(false);
//   const [dirty, setDirty]           = useState(false);
//   const [activeTab, setActiveTab]   = useState("profile");
//   const [modal, setModal]           = useState(null);
//   const [pdfOpen, setPdfOpen]       = useState(false);

//   const openModal  = name => setModal(name);
//   const closeModal = ()   => setModal(null);
//   const setPersonal = (key, val) => { setForm(p => ({ ...p, personal:{ ...p.personal,[key]:val } })); setDirty(true); };

//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       try {
//         setLoading(true);
//         const t  = await getToken();
//         setToken(t);
//         const res = await studentMe(t);
//         const me  = res?.data?.data ?? res?.data ?? {};
//         const next = mapProfileToForm(me);
//         next.skills = normalizeSkillsForUi(next.skills);
//         if (!mounted) return;
//         setForm(next); setInitialForm(next); setDirty(false);
//       } catch (err) {
//         console.error("[Profile load]", err?.response?.data || err.message);
//         toast("Failed to load profile", "error");
//       } finally { if (mounted) setLoading(false); }
//     })();
//     return () => { mounted = false; };
//   }, [getToken]);

//   const completion = useMemo(() => {
//     const checks = {
//       "Personal Info": !!(form.personal.fullName && form.personal.phone && form.personal.city),
//       "About": !!form.personal.about,
//       "Education": hasValidEducation(form.education),
//       "Skills": normalizedSkillCount(form.skills) >= 2,
//       "Experience": form.fresher || form.experience.some(e => e.company && e.role),
//       "Resume": !!form.resume.fileName,
//       "Projects": form.projects.length > 0,
//     };
//     const done = Object.values(checks).filter(Boolean).length;
//     return { checks, value: Math.round((done / Object.keys(checks).length) * 100) };
//   }, [form]);

//   const onPickResume = async e => {
//     const file = e.target.files?.[0]; if (!file) return;
//     const allowed = [".pdf",".doc",".docx"].some(x => file.name.toLowerCase().endsWith(x));
//     if (!allowed) { toast("Only PDF, DOC, DOCX allowed", "error"); e.target.value=""; return; }
//     try {
//       setUploadingResume(true);
//       const t   = await getToken();
//       const res = await uploadResumeAPI(file, t);
//       const rp  = res?.data?.data ?? res?.data ?? {};
//       setForm(p => ({ ...p, resume:{ fileName:rp.resumeMeta?.fileName||file.name, size:rp.resumeMeta?.size||`${Math.max(1,Math.round(file.size/1024))} KB`, updatedAt:rp.resumeMeta?.updatedAt||new Date().toISOString(), url:rp.resumeUrl||"" } }));
//       setDirty(true);
//       toast("Resume uploaded! ✓", "success");
//       sweet({ type:"success", title:"Resume Uploaded!", text:`"${file.name}" uploaded successfully.`, confirmText:"Great!" });
//     } catch (err) {
//       toast(err?.response?.data?.message || "Upload failed", "error");
//     } finally { setUploadingResume(false); e.target.value=""; }
//   };

//   const viewResume = () => {
//     if (!form.resume.url && !form.resume.fileName) { sweet({ type:"warning", title:"No Resume", text:"Please upload your resume first.", confirmText:"OK" }); return; }
//     if (!form.resume.url) { sweet({ type:"info", title:"Not Available Yet", text:"Save your profile first then try again.", confirmText:"OK" }); return; }
//     setPdfOpen(true);
//   };

//   const save = async () => {
//     if (!form.personal.fullName.trim()) { toast("Please enter your full name", "warning"); return; }
//     try {
//       setSaving(true);
//       const t = await getToken();
//       const payload = {
//         name: form.personal.fullName, phone:form.personal.phone,
//         location:form.personal.location, linkedin:form.personal.linkedin, portfolio:form.personal.portfolio,
//         studentProfile: {
//           personal: form.personal,
//           education: safeArr(form.education).map(({ id, ...r }) => r),
//           skills: safeArr(form.skills).flatMap(s => parseSkillsText(typeof s==="string"?s:s?.name||"")).filter(Boolean),
//           fresher: form.fresher,
//           experience: safeArr(form.experience).map(({ id, ...r }) => r),
//           projects: safeArr(form.projects).map(({ id, ...r }) => r),
//           preferred: { ...form.preferred, subCategory:form.preferred.subcategory||"", expectedSalary:form.preferred.salary||"" },
//           resumeMeta: { fileName:form.resume.fileName, size:form.resume.size, updatedAt:form.resume.updatedAt },
//         },
//       };
//       const saveRes = await studentUpdateProfile(payload, t);
//       const updated = saveRes?.data?.data ?? saveRes?.data ?? {};
//       const next    = mapProfileToForm(updated);
//       next.skills   = normalizeSkillsForUi(next.skills);
//       setForm(next); setInitialForm(next); setDirty(false);
//       toast("Profile saved! ✓", "success");
//       sweet({ type:"success", title:"Profile Saved!", text:"All changes saved successfully.", confirmText:"Awesome!" });
//     } catch (err) {
//       toast(err?.response?.data?.message || "Save failed", "error");
//     } finally { setSaving(false); }
//   };

//   const handleDiscard = async () => {
//     const ok = await sweet({ type:"confirm", title:"Discard Changes?", text:"All unsaved changes will be lost.", confirmText:"Yes, Discard", cancelText:"Keep Editing" });
//     if (ok) { setForm(initialForm); setDirty(false); toast("Changes discarded", "info"); }
//   };

//   if (loading) return (
//     <div className="min-h-screen flex items-center justify-center" style={{ background:"#f0f4ff" }}>
//       <AnimatedBackground/><ToastContainer/><SweetAlertHost/>
//       <div className="text-center space-y-3 relative z-10">
//         <div className="h-12 w-12 rounded-full border-2 border-blue-400 border-t-transparent animate-spin mx-auto"/>
//         <p className="text-sm text-slate-500 font-semibold">Loading your profile…</p>
//       </div>
//     </div>
//   );

//   const coverStyle = form.personal.coverPhoto?.startsWith("__gradient__")
//     ? { background: form.personal.coverPhoto.replace("__gradient__",""), backgroundSize:"cover" }
//     : form.personal.coverPhoto
//       ? { backgroundImage:`url(${form.personal.coverPhoto})`, backgroundSize:"cover", backgroundPosition:"center" }
//       : { background:"linear-gradient(135deg,#667eea,#764ba2)" };

//   const citySuggestions = form.personal.state ? (CITIES_BY_STATE[form.personal.state]||[]) : Object.values(CITIES_BY_STATE).flat().slice(0,20);

//   return (
//     <div className="min-h-screen" style={{ background:"#f0f4ff" }}>
//       <AnimatedBackground/>
//       <ToastContainer/>
//       <SweetAlertHost/>

//       <PdfViewerModal open={pdfOpen} onClose={() => setPdfOpen(false)} url={form.resume.url} fileName={form.resume.fileName}/>

//       {/* ── HERO CARD ─────────────────────────────────────────────────── */}
//       <div className="max-w-[1128px] mx-auto px-4 pt-4 pb-2 relative z-10">
//         <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
//           {/* Cover */}
//           <div className="relative h-48 group cursor-pointer" style={coverStyle} onClick={() => openModal("cover")}>
//             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
//               <span className="bg-black/50 rounded-full px-4 py-2 text-sm font-bold text-white flex items-center gap-2"><FiCamera size={14}/>Change Cover</span>
//             </div>
//           </div>

//           <div className="px-6 pb-0">
//             <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12">
//               <AvatarComp src={form.personal.avatarUrl} name={form.personal.fullName} id={form.personal.email} size={96} editable onEdit={() => openModal("avatar")}/>
//               <div className="flex gap-2 sm:mb-2 flex-wrap">
//                 <button onClick={() => openModal("hero")} className="h-9 px-4 rounded-full text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 transition shadow-sm">
//                   <FiEdit2 size={13}/>Edit Profile
//                 </button>
//                 <button onClick={() => resumeInputRef.current?.click()} disabled={uploadingResume}
//                   className="h-9 px-4 rounded-full text-white text-sm font-bold bg-orange-500 hover:bg-orange-600 flex items-center gap-1.5 transition disabled:opacity-60 shadow-sm">
//                   <FiUploadCloud size={13}/>{uploadingResume ? "Uploading…" : "Upload Resume"}
//                 </button>
//                 {form.resume.fileName && (
//                   <button onClick={e => { e.preventDefault(); e.stopPropagation(); viewResume(); }}
//                     className="h-9 px-4 rounded-full text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 flex items-center gap-1.5 transition shadow-sm">
//                     <FiEye size={13}/>View Resume
//                   </button>
//                 )}
//                 <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onPickResume}/>
//               </div>
//             </div>

//             <div className="mt-3 pb-4">
//               <div className="flex flex-wrap items-center gap-2">
//                 <h1 className="text-2xl font-extrabold text-slate-900">{form.personal.fullName || "Your Name"}</h1>
//                 <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">{form.personal.designation||"Student"}</span>
//               </div>
//               <div className="mt-1.5 cursor-pointer group" onClick={() => openModal("about")}>
//                 {form.personal.about
//                   ? <p className="text-sm text-slate-500 leading-relaxed max-w-2xl group-hover:text-slate-700 transition">{form.personal.about}</p>
//                   : <p className="text-sm text-slate-400 italic group-hover:text-blue-500 transition flex items-center gap-1.5"><FiEdit2 size={12}/>Click to add a headline or about…</p>}
//               </div>
//               <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
//                 {(form.personal.city||form.personal.state) && <span className="flex items-center gap-1"><FiMapPin size={11}/>{[form.personal.city,form.personal.state].filter(Boolean).join(", ")}</span>}
//                 {form.personal.email && <span>{form.personal.email}</span>}
//                 {form.personal.linkedin && <a href={form.personal.linkedin} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1"><FiLinkedin size={11}/>LinkedIn</a>}
//                 {form.personal.github  && <a href={form.personal.github}   target="_blank" rel="noreferrer" className="text-slate-500 hover:underline flex items-center gap-1"><FiGithub size={11}/>GitHub</a>}
//               </div>
//               {/* Stats */}
//               <div className="flex flex-wrap mt-4 pt-4 divide-x divide-slate-100 border-t border-slate-100">
//                 {[
//                   { label:"Profile Views",val:form.stats.profileViews,c:"#3b82f6",icon:<FiEye size={10}/> },
//                   { label:"Project Views",val:form.stats.projectViews,c:"#10b981",icon:<FiCode size={10}/> },
//                   { label:"Followers",    val:form.stats.followers,   c:"#a855f7",icon:<FiUsers size={10}/> },
//                   { label:"Following",    val:form.stats.following,   c:"#06b6d4",icon:<FiUsers size={10}/> },
//                 ].map(s => (
//                   <div key={s.label} className="flex flex-col items-center gap-0.5 px-4">
//                     <span className="text-xl font-extrabold" style={{ color:s.c }}>{s.val}</span>
//                     <span className="text-xs text-slate-400 flex items-center gap-0.5">{s.icon}{s.label}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Tabs */}
//             <div className="flex border-t border-slate-100">
//               {[{ k:"profile",l:"Profile" },{ k:"jobs",l:"Applied Jobs" }].map(t => (
//                 <button key={t.k} onClick={() => setActiveTab(t.k)}
//                   className="px-5 py-3 text-sm font-bold border-b-2 transition"
//                   style={activeTab===t.k ? { borderColor:"#3b82f6",color:"#3b82f6" } : { borderColor:"transparent",color:"#94a3b8" }}>
//                   {t.l}
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Applied Jobs */}
//       {activeTab === "jobs" && <AppliedJobsTab token={token}/>}

//       {/* Profile Tab */}
//       {activeTab === "profile" && (
//         <div className="max-w-[1128px] mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 relative z-10">
//           {/* LEFT */}
//           <div className="space-y-4">
//             <SectionCard title="About" icon={<FiUser size={15}/>} onEdit={() => openModal("about")} accent="#3b82f6">
//               {form.personal.about
//                 ? <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{form.personal.about}</p>
//                 : <button onClick={() => openModal("about")} className="text-sm text-blue-500 hover:underline font-semibold flex items-center gap-1.5"><FiPlus size={13}/>Add about / headline</button>}
//             </SectionCard>

//             <SectionCard title="Education" icon={<FiBook size={15}/>} onEdit={() => openModal("education")} accent="#10b981">
//               {form.education.length === 0
//                 ? <button onClick={() => openModal("education")} className="text-sm text-emerald-500 hover:underline font-semibold flex items-center gap-1.5"><FiPlus size={13}/>Add education</button>
//                 : <div className="space-y-4">{form.education.map(ed => (
//                     <div key={ed.id} className="flex gap-3">
//                       <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50 border border-emerald-100"><FiBook size={16} className="text-emerald-500"/></div>
//                       <div>
//                         <p className="text-sm font-bold text-slate-800">{ed.college||"College"}</p>
//                         <p className="text-sm text-slate-500">{ed.degree}{ed.branch?` — ${ed.branch}`:""}</p>
//                         <p className="text-xs text-slate-400">{ed.board&&`${ed.board} · `}{ed.year}{ed.score?` · Score: ${ed.score}`:""}</p>
//                         {ed.achievements && <p className="text-xs font-medium mt-0.5 text-emerald-600">🏆 {ed.achievements}</p>}
//                       </div>
//                     </div>
//                   ))}</div>}
//             </SectionCard>

//             <SectionCard title="Skills" icon={<FiAward size={15}/>} onEdit={() => openModal("skills")} accent="#a855f7">
//               {form.skills.length === 0
//                 ? <button onClick={() => openModal("skills")} className="text-sm text-purple-500 hover:underline font-semibold flex items-center gap-1.5"><FiPlus size={13}/>Add skills</button>
//                 : <div className="flex flex-wrap gap-2">
//                     {form.skills.map(s => <ColorBadge key={s.id} name={s.name} color={skillColor(s.name)}/>)}
//                     <button onClick={() => openModal("skills")} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 border-dashed border-purple-200 text-purple-500 hover:bg-purple-50 transition"><FiPlus size={11}/>Add more</button>
//                   </div>}
//             </SectionCard>

//             <SectionCard title="Experience" icon={<FiBriefcase size={15}/>} onEdit={() => openModal("experience")} accent="#f97316">
//               {form.fresher
//                 ? <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400"/><p className="text-sm text-slate-600 font-semibold">Fresher — open to first opportunities</p></div>
//                 : form.experience.filter(e => e.company).length === 0
//                   ? <button onClick={() => openModal("experience")} className="text-sm text-orange-500 hover:underline font-semibold flex items-center gap-1.5"><FiPlus size={13}/>Add experience</button>
//                   : <div className="space-y-4">{form.experience.filter(e => e.company).map(ex => (
//                       <div key={ex.id} className="flex gap-3">
//                         <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-orange-50 border border-orange-100"><FiBriefcase size={16} className="text-orange-500"/></div>
//                         <div>
//                           <p className="text-sm font-bold text-slate-800">{ex.role}</p>
//                           <p className="text-sm text-slate-500">{ex.company}</p>
//                           <p className="text-xs text-slate-400">{ex.from}{ex.from&&" – "}{ex.current?"Present":ex.to}</p>
//                           {ex.description && <p className="text-xs text-slate-400 mt-0.5">{ex.description}</p>}
//                         </div>
//                       </div>
//                     ))}</div>}
//             </SectionCard>

//             <SectionCard title="Projects" icon={<FiCode size={15}/>} onEdit={() => openModal("projects")} accent="#06b6d4">
//               {form.projects.filter(p => p.title).length === 0
//                 ? <button onClick={() => openModal("projects")} className="text-sm text-cyan-500 hover:underline font-semibold flex items-center gap-1.5"><FiPlus size={13}/>Add a project</button>
//                 : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                     {form.projects.filter(p => p.title).map(pr => (
//                       <div key={pr.id} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 hover:shadow-md hover:scale-[1.02] transition-all">
//                         {pr.imageUrl
//                           ? <img src={pr.imageUrl} alt={pr.title} className="h-36 w-full object-cover"/>
//                           : <div className="h-36 flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-50"><FiCode size={32} className="text-cyan-200"/></div>}
//                         <div className="p-4">
//                           <p className="text-sm font-bold text-slate-800">{pr.title}</p>
//                           {pr.daysToComplete && <p className="text-xs font-bold text-cyan-500 flex items-center gap-1 mt-0.5"><FiClock size={10}/>{pr.daysToComplete} days to build</p>}
//                           {pr.description && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{pr.description}</p>}
//                           {pr.techStack && (
//                             <div className="flex flex-wrap gap-1 mt-2">
//                               {pr.techStack.split(",").filter(Boolean).map(t => (
//                                 <span key={t} className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500">{t.trim()}</span>
//                               ))}
//                             </div>
//                           )}
//                           <div className="flex gap-3 mt-3">
//                             {pr.liveUrl   && <a href={pr.liveUrl}   target="_blank" rel="noreferrer" className="text-xs text-blue-500 flex items-center gap-1 hover:underline font-semibold"><FiExternalLink size={11}/>Live</a>}
//                             {pr.githubUrl && <a href={pr.githubUrl} target="_blank" rel="noreferrer" className="text-xs text-slate-500 flex items-center gap-1 hover:underline font-semibold"><FiGithub size={11}/>Code</a>}
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                     <button onClick={() => openModal("projects")} className="h-36 rounded-xl font-bold border-2 border-dashed border-cyan-200 text-cyan-500 hover:bg-cyan-50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-sm">
//                       <FiPlus/>Add Project
//                     </button>
//                   </div>}
//             </SectionCard>

//             <SectionCard title="Preferred Job Settings" icon={<FiBriefcase size={15}/>} onEdit={() => openModal("preferred")} accent="#eab308">
//               {!(form.preferred.stream||form.preferred.workMode)
//                 ? <button onClick={() => openModal("preferred")} className="text-sm text-yellow-500 hover:underline font-semibold flex items-center gap-1.5"><FiPlus size={13}/>Add job preferences</button>
//                 : <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
//                     {[["Stream",form.preferred.stream],["Category",form.preferred.category],["Subcategory",form.preferred.subcategory],["Work Mode",form.preferred.workMode],["Locations",form.preferred.locations],["Salary",form.preferred.salary]].filter(([,v])=>v).map(([k,v]) => (
//                       <div key={k}>
//                         <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-0.5">{k}</p>
//                         <p className="text-sm text-slate-700 font-bold">{v}</p>
//                       </div>
//                     ))}
//                   </div>}
//             </SectionCard>
//           </div>

//           {/* RIGHT SIDEBAR */}
//           <div className="space-y-4">
//             {/* Profile strength */}
//             <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm">
//               <h3 className="text-sm font-bold text-slate-800 mb-3">Profile Strength</h3>
//               <div className="relative h-2.5 rounded-full mb-3 overflow-hidden bg-slate-100">
//                 <div className="h-full rounded-full transition-all duration-700" style={{ width:`${completion.value}%`, background:"linear-gradient(90deg,#3b82f6,#8b5cf6)" }}/>
//               </div>
//               <div className="flex justify-between text-xs mb-3">
//                 <span className="text-slate-400">{completion.value}% complete</span>
//                 <span className="font-bold" style={{ color:completion.value===100?"#10b981":completion.value>=70?"#3b82f6":"#94a3b8" }}>
//                   {completion.value===100?"All Star 🎉":completion.value>=70?"Strong":"Keep going"}
//                 </span>
//               </div>
//               <div className="space-y-2">
//                 {Object.entries(completion.checks).map(([k, done]) => (
//                   <div key={k} className="flex items-center gap-2 text-xs">
//                     <span className={`h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 ${done?"bg-emerald-100 text-emerald-600":"bg-slate-100 text-slate-400"}`}>
//                       {done ? <FiCheck size={9}/> : <FiX size={9}/>}
//                     </span>
//                     <span className={done ? "text-slate-400 line-through" : "text-slate-600"}>{k}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Resume */}
//             <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm">
//               <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><FiFileText size={14} className="text-orange-500"/>Resume</h3>
//               {form.resume.fileName
//                 ? <div className="rounded-xl p-3 flex items-center gap-3 mb-3 bg-slate-50 border border-slate-200">
//                     <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-50 border border-red-100"><FiFileText size={18} className="text-red-500"/></div>
//                     <div className="flex-1 min-w-0">
//                       <p className="text-xs font-bold text-slate-700 truncate">{form.resume.fileName}</p>
//                       <p className="text-xs text-slate-400">{form.resume.size}</p>
//                       {form.resume.updatedAt && <p className="text-xs text-slate-300">{new Date(form.resume.updatedAt).toLocaleDateString()}</p>}
//                     </div>
//                   </div>
//                 : <p className="text-xs text-slate-400 italic mb-3">No resume uploaded yet</p>}
//               <div className="flex gap-2 flex-wrap">
//                 <button onClick={() => resumeInputRef.current?.click()} disabled={uploadingResume}
//                   className="flex-1 py-2 rounded-xl text-xs font-bold text-orange-500 bg-orange-50 border border-orange-200 hover:bg-orange-100 transition disabled:opacity-60 min-w-[60px]">
//                   {uploadingResume ? "…" : "⬆ Upload"}
//                 </button>
//                 {form.resume.fileName && (
//                   <button onClick={e => { e.preventDefault(); e.stopPropagation(); viewResume(); }}
//                     className="flex-1 py-2 rounded-xl text-xs font-bold text-blue-500 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition min-w-[60px]">
//                     👁 View PDF
//                   </button>
//                 )}
//                 <Link to="/student/resume-builder" className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition text-center min-w-[60px]">
//                   ✏️ Build
//                 </Link>
//               </div>
//             </div>

//             {/* ── RECENTLY LOGGED-IN USERS — new LinkedIn-style section ── */}
//             <RecentUsersSection
//               token={token}
//               onFollowChange={action => {
//                 setForm(p => ({
//                   ...p,
//                   stats: {
//                     ...p.stats,
//                     following: Math.max(0, p.stats.following + (action === "followed" ? 1 : -1)),
//                   }
//                 }));
//               }}
//             />

//             {/* Follow suggestions */}
//             <FollowSuggestions
//               token={token}
//               onFollowChange={action => {
//                 setForm(p => ({
//                   ...p,
//                   stats: {
//                     ...p.stats,
//                     following: Math.max(0, p.stats.following + (action === "followed" ? 1 : -1)),
//                   }
//                 }));
//               }}
//             />

//             {/* Social links */}
//             {[form.personal.linkedin,form.personal.github,form.personal.twitter,form.personal.website,form.personal.instagram,form.personal.youtube].some(Boolean) && (
//               <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm">
//                 <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><FiLink size={14} className="text-cyan-500"/>Social Links</h3>
//                 <div className="space-y-2.5">
//                   {[
//                     { u:form.personal.linkedin, icon:<FiLinkedin size={14}/>, l:"LinkedIn",  c:"#3b82f6" },
//                     { u:form.personal.github,   icon:<FiGithub size={14}/>,   l:"GitHub",    c:"#1e293b" },
//                     { u:form.personal.twitter,  icon:<FiTwitter size={14}/>,  l:"Twitter",   c:"#06b6d4" },
//                     { u:form.personal.instagram,icon:<FiInstagram size={14}/>,l:"Instagram", c:"#ec4899" },
//                     { u:form.personal.youtube,  icon:<FiYoutube size={14}/>,  l:"YouTube",   c:"#ef4444" },
//                     { u:form.personal.website,  icon:<FiGlobe size={14}/>,    l:"Website",   c:"#a855f7" },
//                   ].filter(s => s.u).map(s => (
//                     <a key={s.l} href={s.u} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold hover:underline" style={{ color:s.c }}>{s.icon}{s.l}</a>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* ── MODALS ──────────────────────────────────────────────────────── */}
//       <AboutModal open={modal==="about"} onClose={closeModal} value={form.personal.about} onSave={v => { setPersonal("about",v); setDirty(true); }}/>
//       <SkillsModal open={modal==="skills"} onClose={closeModal} skills={form.skills} onChange={skills => { setForm(p => ({ ...p,skills })); setDirty(true); }}/>
//       <ProjectsModal open={modal==="projects"} onClose={closeModal} projects={form.projects} onChange={projects => { setForm(p => ({ ...p,projects })); setDirty(true); }}/>
//       <AvatarModal open={modal==="avatar"} onClose={closeModal} currentUrl={form.personal.avatarUrl}
//         onUpload={url => { setPersonal("avatarUrl",url); setDirty(true); }}
//         onUrlSelect={url => { setPersonal("avatarUrl",url); setDirty(true); }}/>
//       <CoverModal open={modal==="cover"} onClose={closeModal} onSelect={url => { setPersonal("coverPhoto",url); setDirty(true); }}/>
//       <EducationModal open={modal==="education"} onClose={closeModal} education={form.education} onChange={ed => { setForm(p => ({ ...p,education:ed })); setDirty(true); }}/>
//       <PreferredModal open={modal==="preferred"} onClose={closeModal} preferred={form.preferred} onChange={pref => { setForm(p => ({ ...p,preferred:pref })); setDirty(true); }}/>

//       {/* Hero / Personal Info */}
//       <Modal open={modal==="hero"} onClose={closeModal} title="Edit Personal Details" wide>
//         <div className="grid grid-cols-2 gap-3">
//           <Inp label="Full Name *" value={form.personal.fullName} onChange={e => setPersonal("fullName",e.target.value)} placeholder="Full Name" className="col-span-2"/>
//           <div className="col-span-2 flex flex-col gap-1.5">
//             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Designation</label>
//             <select value={form.personal.designation} onChange={e => setPersonal("designation",e.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white outline-none focus:border-blue-400">
//               {DESIGNATION_OPTIONS.map(d => <option key={d}>{d}</option>)}
//             </select>
//           </div>
//           <Inp label="Phone" value={form.personal.phone} onChange={e => setPersonal("phone",e.target.value)} placeholder="10-digit number"/>
//           <Inp label="Email" value={form.personal.email} readOnly/>
//           <Inp label="Date of Birth" type="date" value={form.personal.dob} onChange={e => setPersonal("dob",e.target.value)}/>
//           <div className="flex flex-col gap-1.5">
//             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gender</label>
//             <select value={form.personal.gender} onChange={e => setPersonal("gender",e.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white outline-none focus:border-blue-400">
//               {["Male","Female","Non-binary","Prefer not to say"].map(g => <option key={g}>{g}</option>)}
//             </select>
//           </div>
//           <ComboInput label="State" value={form.personal.state} onChange={v => { setPersonal("state",v); setPersonal("city",""); }} options={INDIAN_STATES} placeholder="Type or select state"/>
//           <ComboInput label="City" value={form.personal.city} onChange={v => setPersonal("city",v)} options={citySuggestions} placeholder="Type or select city"/>
//           <Inp label="Street Address" value={form.personal.address} onChange={e => setPersonal("address",e.target.value)} placeholder="House no, street…" className="col-span-2"/>
//           <Inp label="LinkedIn URL" value={form.personal.linkedin} onChange={e => setPersonal("linkedin",e.target.value)} placeholder="https://linkedin.com/in/…" className="col-span-2"/>
//           <Inp label="GitHub" value={form.personal.github} onChange={e => setPersonal("github",e.target.value)} placeholder="https://github.com/…"/>
//           <Inp label="Portfolio" value={form.personal.portfolio} onChange={e => setPersonal("portfolio",e.target.value)} placeholder="Portfolio URL"/>
//           <Inp label="Twitter / X" value={form.personal.twitter} onChange={e => setPersonal("twitter",e.target.value)} placeholder="https://twitter.com/…"/>
//           <Inp label="Instagram" value={form.personal.instagram} onChange={e => setPersonal("instagram",e.target.value)} placeholder="https://instagram.com/…"/>
//           <Inp label="YouTube" value={form.personal.youtube} onChange={e => setPersonal("youtube",e.target.value)} placeholder="Channel URL"/>
//           <Inp label="Personal Website" value={form.personal.website} onChange={e => setPersonal("website",e.target.value)} placeholder="https://yoursite.com"/>
//         </div>
//         <button onClick={() => { closeModal(); toast("Personal details updated! Don't forget to Save.", "info"); }}
//           className="w-full py-2.5 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 shadow-sm">Done</button>
//       </Modal>

//       {/* Experience */}
//       <Modal open={modal==="experience"} onClose={closeModal} title="Edit Experience" wide>
//         <label className="flex items-center gap-2.5 text-sm cursor-pointer p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
//           <input type="checkbox" checked={form.fresher} onChange={() => { setForm(p => ({ ...p,fresher:!p.fresher })); setDirty(true); }} className="accent-blue-500 w-4 h-4"/>
//           <span className="font-bold">I'm a fresher</span>
//           <span className="text-xs text-slate-400 ml-auto">No prior work experience</span>
//         </label>
//         {!form.fresher && (
//           <div className="space-y-4">
//             {form.experience.map(ex => (
//               <div key={ex.id} className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50">
//                 <div className="grid grid-cols-2 gap-3">
//                   <Inp label="Company" value={ex.company} onChange={e => { setForm(p => ({ ...p,experience:p.experience.map(x => x.id===ex.id?{...x,company:e.target.value}:x) })); setDirty(true); }} placeholder="Company name"/>
//                   <Inp label="Role / Title" value={ex.role} onChange={e => { setForm(p => ({ ...p,experience:p.experience.map(x => x.id===ex.id?{...x,role:e.target.value}:x) })); setDirty(true); }} placeholder="e.g. Software Engineer"/>
//                   <Inp label="From" value={ex.from} onChange={e => { setForm(p => ({ ...p,experience:p.experience.map(x => x.id===ex.id?{...x,from:e.target.value}:x) })); setDirty(true); }} placeholder="Jan 2022"/>
//                   <div className="space-y-1.5">
//                     <Inp label="To" value={ex.to} disabled={ex.current} onChange={e => { setForm(p => ({ ...p,experience:p.experience.map(x => x.id===ex.id?{...x,to:e.target.value}:x) })); setDirty(true); }} placeholder={ex.current?"Present":"Dec 2023"}/>
//                     <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
//                       <input type="checkbox" checked={ex.current} onChange={e => { setForm(p => ({ ...p,experience:p.experience.map(x => x.id===ex.id?{...x,current:e.target.checked}:x) })); setDirty(true); }} className="accent-blue-500"/>
//                       Currently working here
//                     </label>
//                   </div>
//                   <Txta label="Description" value={ex.description} onChange={e => { setForm(p => ({ ...p,experience:p.experience.map(x => x.id===ex.id?{...x,description:e.target.value}:x) })); setDirty(true); }} className="col-span-2 h-20 w-full" placeholder="What did you work on?"/>
//                 </div>
//                 <button onClick={() => { setForm(p => ({ ...p,experience:p.experience.filter(x => x.id!==ex.id) })); setDirty(true); }} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"><FiTrash2 size={11}/>Remove</button>
//               </div>
//             ))}
//             <button onClick={() => { setForm(p => ({ ...p,experience:[...p.experience,{id:`ex_${Date.now()}`,company:"",role:"",from:"",to:"",current:false,description:""}] })); setDirty(true); }}
//               className="w-full py-3 rounded-2xl border-2 border-dashed border-blue-200 text-sm text-blue-500 font-bold hover:bg-blue-50 transition">+ Add Experience</button>
//           </div>
//         )}
//         <button onClick={closeModal} className="w-full py-2.5 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 shadow-sm">Done</button>
//       </Modal>

//       {/* Sticky Save Bar */}
//       {dirty && (
//         <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm shadow-lg">
//           <div className="max-w-[1128px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
//             <span className="text-xs font-bold text-amber-500 flex items-center gap-2">
//               <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"/>Unsaved changes
//             </span>
//             <div className="flex gap-2">
//               <button onClick={handleDiscard} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition">Discard</button>
//               <button onClick={save} disabled={saving} className="px-6 py-2 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 disabled:opacity-60 flex items-center gap-2 transition shadow-sm">
//                 <FiSave size={13}/>{saving ? "Saving…" : "Save Profile"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



/////////////////////////////////////////////////////////////////////////////////////////



// frontend/src/pages/student/Profile.jsx
//
// ✅ View Resume → opens Cloudinary PDF in NEW TAB (window.open) — no iframe crash
// ✅ Richer 3D animated background — more shapes, more colors, more motion
// ✅ Real SweetAlert2 (sweetalert2 npm package) for action notifications
// ✅ Backend persistence — loads from MongoDB via API on every mount
// ✅ Light / white theme
// ✅ Recently logged-in users (LinkedIn-style)
// ✅ Follow suggestions from DB
// ✅ Applied jobs from DB
// ✅ Cloudinary avatar + resume upload

// npm install sweetalert2   ← run this once in your frontend folder

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { toAbsoluteMediaUrl } from "../../utils/media.js";
import Swal from "sweetalert2";
import {
  FiBook, FiBriefcase, FiMapPin, FiSave, FiUploadCloud,
  FiUser, FiTrash2, FiEdit2, FiPlus, FiCamera, FiLink,
  FiGlobe, FiGithub, FiTwitter, FiLinkedin, FiInstagram,
  FiYoutube, FiExternalLink, FiAward, FiCode, FiFileText,
  FiCheckSquare, FiX, FiCheck, FiUsers, FiEye, FiSearch,
  FiClock, FiImage, FiAlertTriangle, FiAlertCircle,
  FiInfo, FiDownload, FiZoomIn, FiZoomOut, FiRefreshCw,
  FiMaximize2, FiCalendar, FiChevronDown, FiUserPlus,
  FiActivity,
} from "react-icons/fi";

import {
  studentMe,
  studentUpdateProfile,
  uploadResume as uploadResumeAPI,
  studentViewResumeFile,
  uploadAvatar as uploadAvatarAPI,
  getFollowSuggestions,
  toggleFollow,
  getAppliedJobs,
  withdrawApplication,
  getRecentUsers,
} from "../../services/studentService.js";

// ─── SweetAlert2 helpers ──────────────────────────────────────────────────────
const swalBase = {
  customClass: {
    popup:      "!rounded-3xl !shadow-2xl",
    title:      "!text-slate-800 !font-extrabold",
    htmlContainer:"!text-slate-500 !text-sm",
    confirmButton:"!rounded-xl !font-bold !px-6 !py-2.5",
    cancelButton: "!rounded-xl !font-bold !px-6 !py-2.5 !bg-slate-100 !text-slate-600 hover:!bg-slate-200",
  },
  buttonsStyling: false,
  showClass: { popup:"swal2-show" },
  hideClass: { popup:"swal2-hide" },
};

const sweet = {
  success: (title, text) => Swal.fire({ ...swalBase, icon:"success", title, text, confirmButtonText:"Awesome!", customClass:{ ...swalBase.customClass, confirmButton:swalBase.customClass.confirmButton+" !bg-emerald-500 !text-white hover:!bg-emerald-600" } }),
  error:   (title, text) => Swal.fire({ ...swalBase, icon:"error",   title, text, confirmButtonText:"OK", customClass:{ ...swalBase.customClass, confirmButton:swalBase.customClass.confirmButton+" !bg-red-500 !text-white hover:!bg-red-600" } }),
  warning: (title, text) => Swal.fire({ ...swalBase, icon:"warning", title, text, confirmButtonText:"OK", customClass:{ ...swalBase.customClass, confirmButton:swalBase.customClass.confirmButton+" !bg-amber-500 !text-white hover:!bg-amber-600" } }),
  info:    (title, text) => Swal.fire({ ...swalBase, icon:"info",    title, text, confirmButtonText:"OK", customClass:{ ...swalBase.customClass, confirmButton:swalBase.customClass.confirmButton+" !bg-blue-500 !text-white hover:!bg-blue-600" } }),
  confirm: (title, text, confirmText="Yes", cancelText="Cancel") =>
    Swal.fire({ ...swalBase, icon:"question", title, text, showCancelButton:true, confirmButtonText:confirmText, cancelButtonText:cancelText,
      customClass:{ ...swalBase.customClass, confirmButton:swalBase.customClass.confirmButton+" !bg-blue-600 !text-white hover:!bg-blue-700" } })
      .then(r => r.isConfirmed),
};

// ─── TOAST (lightweight, top-right) ──────────────────────────────────────────
let _tid = 0;
const _tListeners = new Set();
const toast = (msg, type = "success", duration = 3500) => {
  const id = ++_tid;
  _tListeners.forEach(fn => fn({ id, msg, type, duration }));
};
function useToasts() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const fn = t => {
      setToasts(p => [...p, t]);
      setTimeout(() => setToasts(p => p.filter(x => x.id !== t.id)), t.duration);
    };
    _tListeners.add(fn);
    return () => _tListeners.delete(fn);
  }, []);
  return { toasts, dismiss: id => setToasts(p => p.filter(x => x.id !== id)) };
}
function ToastContainer() {
  const { toasts, dismiss } = useToasts();
  const C = { success:"bg-emerald-500", error:"bg-red-500", warning:"bg-amber-500", info:"bg-blue-500" };
  const I = { success:<FiCheck size={13}/>, error:<FiX size={13}/>, warning:<FiAlertTriangle size={13}/>, info:<FiInfo size={13}/> };
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`toast-anim flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold pointer-events-auto min-w-[260px] max-w-[380px] ${C[t.type]||C.success}`}>
          <span className="flex-shrink-0 h-6 w-6 rounded-full bg-white/25 flex items-center justify-center">{I[t.type]||I.success}</span>
          <span className="flex-1">{t.msg}</span>
          <button onClick={() => dismiss(t.id)} className="hover:opacity-70"><FiX size={13}/></button>
        </div>
      ))}
    </div>
  );
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SKILL_CATEGORIES = {
  "Languages":   ["Java","Python","JavaScript","TypeScript","C","C++","C#","Go","Rust","Kotlin","Swift","PHP","Ruby","R","Dart"],
  "Frontend":    ["React","Vue.js","Angular","Next.js","HTML5","CSS3","Tailwind CSS","Bootstrap","Svelte","Redux","Zustand"],
  "Backend":     ["Node.js","Express.js","Spring Boot","Django","FastAPI","Flask","NestJS","GraphQL","REST API","Laravel"],
  "Database":    ["MySQL","PostgreSQL","MongoDB","Redis","Firebase","SQLite","Oracle","DynamoDB","Supabase"],
  "DevOps":      ["Docker","Kubernetes","AWS","Azure","GCP","CI/CD","Jenkins","Git","GitHub Actions","Linux","Terraform"],
  "Mobile":      ["React Native","Flutter","Android (Kotlin)","iOS (Swift)","Expo"],
  "Design":      ["Figma","Adobe XD","Photoshop","Illustrator","Canva","UI/UX","Wireframing","Prototyping"],
  "Data & ML":   ["Machine Learning","Deep Learning","TensorFlow","PyTorch","Pandas","NumPy","Scikit-learn","Power BI","Tableau"],
  "Soft Skills": ["Leadership","Communication","Teamwork","Problem Solving","Time Management","Agile/Scrum"],
};
const DESIGNATION_OPTIONS = ["Student","Fresher","Software Engineer Intern","Software Engineer","Junior Developer","Frontend Developer","Backend Developer","Full Stack Developer","Data Analyst","Data Scientist","ML Engineer","DevOps Engineer","UI/UX Designer","Product Manager","Business Analyst","Cybersecurity Analyst","Cloud Engineer","Mobile Developer","QA Engineer","Other"];
const DEGREE_OPTIONS  = ["B.Tech / B.E.","M.Tech / M.E.","BCA","MCA","B.Sc","M.Sc","MBA","BBA","B.Com","M.Com","B.Arch","B.Pharm","MBBS","B.Ed","12th (PCM)","12th (PCB)","12th (Commerce)","12th (Arts)","10th (SSLC)","Diploma","Ph.D","Other"];
const BRANCH_OPTIONS  = ["Computer Science & Engineering","Information Technology","Electronics & Communication","Electrical Engineering","Mechanical Engineering","Civil Engineering","Data Science","Artificial Intelligence & ML","Cybersecurity","Cloud Computing","Biomedical Engineering","Other"];
const BOARD_OPTIONS   = ["CBSE","ICSE","State Board","IGCSE","IB","VTU","Anna University","Osmania University","Mumbai University","Pune University","Other University"];
const INDIAN_STATES   = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Chandigarh","Puducherry"];
const CITIES_BY_STATE = { "Karnataka":["Bangalore","Mysore","Hubli","Mangalore","Belgaum","Davangere","Tumkur","Udupi","Shimoga"],"Maharashtra":["Mumbai","Pune","Nagpur","Nashik","Aurangabad","Thane","Kolhapur","Solapur"],"Tamil Nadu":["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Vellore","Tirunelveli"],"Delhi":["New Delhi","Dwarka","Rohini","Saket","Janakpuri"],"Telangana":["Hyderabad","Warangal","Nizamabad","Karimnagar","Khammam"],"Gujarat":["Ahmedabad","Surat","Vadodara","Rajkot","Gandhinagar","Bhavnagar"],"West Bengal":["Kolkata","Howrah","Durgapur","Asansol","Siliguri"],"Rajasthan":["Jaipur","Jodhpur","Udaipur","Kota","Bikaner","Ajmer"],"Uttar Pradesh":["Lucknow","Kanpur","Agra","Varanasi","Allahabad","Noida","Ghaziabad"],"Andhra Pradesh":["Visakhapatnam","Vijayawada","Guntur","Tirupati","Nellore"],"Kerala":["Thiruvananthapuram","Kochi","Kozhikode","Thrissur","Kollam"],"Haryana":["Gurgaon","Faridabad","Ambala","Panipat","Rohtak"] };
const JOB_STREAMS     = ["IT / Software","Non-IT","Core Engineering","Finance & Banking","Marketing","Healthcare","Design","Research","Government / PSU","Startup","Other"];
const JOB_CATEGORIES  = ["Software Development","Data Science","DevOps & Cloud","Cybersecurity","UI/UX Design","Product Management","Business Analysis","Digital Marketing","Sales","Finance","HR","Content Writing","Other"];
const WORK_MODES      = ["Remote","On-site","Hybrid","Flexible"];
const SALARY_RANGES   = ["Below 3 LPA","3–5 LPA","5–8 LPA","8–12 LPA","12–18 LPA","18–25 LPA","25–35 LPA","Above 35 LPA"];
const FIXED_BANNERS   = ["https://images.unsplash.com/photo-1562240020-ce31ccb0fa7d?w=1200&q=80","https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?w=1200&q=80","https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80","https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80","https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&q=80","https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80","https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80","https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200&q=80","https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80","https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80","https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=1200&q=80","https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80","https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1200&q=80","https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=1200&q=80"];
const GRADIENT_BANNERS= ["linear-gradient(135deg,#0f2027,#203a43,#2c5364)","linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)","linear-gradient(135deg,#000428,#004e92)","linear-gradient(135deg,#f97316,#ef4444,#8b5cf6)","linear-gradient(135deg,#06b6d4,#3b82f6,#8b5cf6)","linear-gradient(135deg,#10b981,#06b6d4,#3b82f6)","linear-gradient(135deg,#f59e0b,#ef4444,#ec4899)","linear-gradient(135deg,#84cc16,#06b6d4,#3b82f6)"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const safeObj = x => (x && typeof x === "object" ? x : {});
const safeArr = x => (Array.isArray(x) ? x : []);
const initials = name => String(name||"S").trim().split(" ").filter(Boolean).slice(0,2).map(s=>s[0]?.toUpperCase()||"").join("");

function parseSkillsText(v="") { return String(v).split(/[\n,;/|]+/g).map(s=>s.trim()).filter(Boolean); }
function normalizeSkillsForUi(skills=[]) {
  const seen=new Set(); const out=[];
  safeArr(skills).flatMap(s=>parseSkillsText(typeof s==="string"?s:s?.name||s?.skill||"")).forEach(name=>{ const k=name.toLowerCase(); if(!seen.has(k)){seen.add(k);out.push({id:`sk_${Date.now()}_${out.length}`,name});} });
  return out;
}
function normalizedSkillCount(sk=[]) { return safeArr(sk).flatMap(s=>parseSkillsText(typeof s==="string"?s:s?.name||s?.skill||"")).length; }
function hasValidEducation(edu=[]) { return safeArr(edu).some(e=>e?.degree&&e?.college); }
function formatAppliedDate(iso) {
  const d=new Date(iso); const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]; const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const diffDays=Math.floor((Date.now()-d.getTime())/86400000);
  return { dayName:DAYS[d.getDay()], date:`${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`, time:d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true}), ago:diffDays===0?"Today":diffDays===1?"Yesterday":`${diffDays} days ago` };
}
const AVATAR_GRADIENTS=[["#6366f1","#8b5cf6"],["#3b82f6","#06b6d4"],["#10b981","#3b82f6"],["#f97316","#ef4444"],["#ec4899","#8b5cf6"],["#0ea5e9","#6366f1"]];
function avatarGradient(id=""){let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))&0xffff;const[a,b]=AVATAR_GRADIENTS[h%AVATAR_GRADIENTS.length];return `linear-gradient(135deg,${a},${b})`;}

const EMPTY={personal:{fullName:"",email:"",phone:"",dob:"",gender:"Male",address:"",city:"",state:"",location:"",linkedin:"",portfolio:"",github:"",twitter:"",instagram:"",youtube:"",website:"",designation:"Student",about:"",coverPhoto:"",avatarUrl:""},education:[],skills:[],fresher:true,experience:[{id:"ex1",company:"",role:"",from:"",to:"",current:false,description:""}],projects:[],preferred:{stream:"",category:"",subcategory:"",locations:"",salary:"",workMode:"Hybrid"},resume:{fileName:"",size:"",updatedAt:"",url:""},stats:{profileViews:0,projectViews:0,followers:0,following:0}};

function mapProfileToForm(me={}) {
  const p=safeObj(me.studentProfile); const preferred=safeObj(p.preferred);
  return {
    personal:{ fullName:p.personal?.fullName||me.name||"", email:p.personal?.email||me.email||"", phone:p.personal?.phone||me.phone||"", dob:p.personal?.dob||"", gender:p.personal?.gender||"Male", address:p.personal?.address||"", city:p.personal?.city||"", state:p.personal?.state||"", location:p.personal?.location||me.location||"", linkedin:p.personal?.linkedin||me.linkedin||"", portfolio:p.personal?.portfolio||me.portfolio||"", github:p.personal?.github||"", twitter:p.personal?.twitter||"", instagram:p.personal?.instagram||"", youtube:p.personal?.youtube||"", website:p.personal?.website||"", designation:p.personal?.designation||"Student", about:p.personal?.about||"", coverPhoto:p.personal?.coverPhoto||"", avatarUrl:p.personal?.avatarUrl||p.personal?.profileImageUrl||me.avatarUrl||me.avatar||me.profilePhoto||me.profileImageUrl||me.imageUrl||"" },
    education:safeArr(p.education).map((e,i)=>({id:e.id||`ed_${i}`,degree:e.degree||"",college:e.college||"",year:e.year||"",branch:e.branch||"",score:e.score||"",board:e.board||"",universityRollNo:e.universityRollNo||"",achievements:e.achievements||""})),
    skills:safeArr(p.skills).map((s,i)=>typeof s==="string"?{id:`sk_${i}`,name:s}:{id:s.id||`sk_${i}`,name:s.name||s.skill||""}),
    fresher:p.fresher!==undefined?!!p.fresher:true,
    experience:safeArr(p.experience).length?safeArr(p.experience).map((x,i)=>({id:x.id||`ex_${i}`,company:x.company||"",role:x.role||"",from:x.from||"",to:x.to||"",current:!!x.current,description:x.description||""})): [{id:"ex1",company:"",role:"",from:"",to:"",current:false,description:""}],
    projects:safeArr(p.projects).map((pr,i)=>({id:pr.id||`pr_${i}`,title:pr.title||"",description:pr.description||"",techStack:pr.techStack||"",hashtags:pr.hashtags||"",imageUrl:pr.imageUrl||"",liveUrl:pr.liveUrl||"",githubUrl:pr.githubUrl||"",daysToComplete:pr.daysToComplete||""})),
    preferred:{stream:preferred.stream||"",category:preferred.category||"",subcategory:preferred.subcategory||preferred.subCategory||"",locations:Array.isArray(preferred.locations)?preferred.locations.join(", "):preferred.locations||"",salary:preferred.salary||preferred.expectedSalary||"",workMode:preferred.workMode||"Hybrid"},
    resume:{fileName:p.resumeMeta?.fileName||(me.resumeUrl?"Uploaded Resume":""),size:p.resumeMeta?.size||"",updatedAt:p.resumeMeta?.updatedAt||"",url:me.resumeUrl||""},
    stats:{profileViews:me.profileViews||0,projectViews:me.projectViews||0,followers:(me.followers||[]).length,following:(me.following||[]).length},
  };
}

// ─── RICH ANIMATED BACKGROUND ────────────────────────────────────────────────
const BG_CSS = `
@keyframes floatA{0%,100%{transform:translate(0,0) rotate(0deg);}33%{transform:translate(40px,-50px) rotate(120deg);}66%{transform:translate(-30px,35px) rotate(240deg);}}
@keyframes floatB{0%,100%{transform:translate(0,0) rotate(0deg) scale(1);}50%{transform:translate(-45px,40px) rotate(180deg) scale(1.2);}}
@keyframes floatC{0%,100%{transform:translate(0,0) rotate(0deg);}25%{transform:translate(30px,40px) rotate(90deg);}75%{transform:translate(-35px,-30px) rotate(270deg);}}
@keyframes floatD{0%,100%{transform:translateY(0) rotate(0deg);}50%{transform:translateY(-60px) rotate(180deg);}}
@keyframes floatE{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(25px,-35px) scale(1.1);}66%{transform:translate(-20px,20px) scale(0.9);}}
@keyframes driftLine{0%{transform:translate(-150px,0) rotate(-45deg);opacity:0;}40%{opacity:0.5;}100%{transform:translate(220vw,0) rotate(-45deg);opacity:0;}}
@keyframes pulseDot{0%,100%{transform:scale(1);opacity:0.2;}50%{transform:scale(1.5);opacity:0.5;}}
@keyframes spinHex{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
@keyframes spinHexR{0%{transform:rotate(0deg);}100%{transform:rotate(-360deg);}}
@keyframes floatTri{0%,100%{transform:translate(0,0) rotate(0deg);}50%{transform:translate(20px,-40px) rotate(180deg);}}
@keyframes morphBlob{0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%;}50%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%;}}
@keyframes modalIn{0%{opacity:0;transform:translateY(-16px) scale(0.96);}100%{opacity:1;transform:translateY(0) scale(1);}}
@keyframes toastSlide{0%{opacity:0;transform:translateX(110%);}100%{opacity:1;transform:translateX(0);}}
@keyframes onlinePulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.6);}50%{box-shadow:0 0 0 6px rgba(16,185,129,0);}}
@keyframes orbit{0%{transform:rotate(0deg) translateX(80px) rotate(0deg);}100%{transform:rotate(360deg) translateX(80px) rotate(-360deg);}}
@keyframes sparkle{0%,100%{opacity:0;transform:scale(0);}50%{opacity:1;transform:scale(1);}}

.bg-a{animation:floatA 9s ease-in-out infinite;}
.bg-b{animation:floatB 12s ease-in-out infinite;}
.bg-c{animation:floatC 7s ease-in-out infinite;}
.bg-d{animation:floatD 10s ease-in-out infinite;}
.bg-e{animation:floatE 14s ease-in-out infinite;}
.bg-tri{animation:floatTri 8s ease-in-out infinite;}
.bg-hex{animation:spinHex 22s linear infinite;}
.bg-hexr{animation:spinHexR 18s linear infinite;}
.bg-line{animation:driftLine 13s linear infinite;}
.bg-dot{animation:pulseDot 3s ease-in-out infinite;}
.bg-blob{animation:morphBlob 10s ease-in-out infinite;}
.modal-anim{animation:modalIn 0.22s ease-out;}
.toast-anim{animation:toastSlide 0.3s ease-out;}
.online-dot{animation:onlinePulse 2s ease-in-out infinite;}
`;

const VIVID = ["#6366f1","#3b82f6","#10b981","#f97316","#ec4899","#a855f7","#06b6d4","#eab308","#ef4444","#84cc16","#0ea5e9","#f43f5e"];

function AnimatedBackground() {
  return (
    <>
      <style>{BG_CSS}</style>
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{background:"#eef2ff"}}>

        {/* ── Large morphing blobs ── */}
        {[
          {top:"5%",  left:"2%",  w:380,c:"#6366f1",op:0.08,delay:"0s"},
          {top:"55%", left:"70%", w:420,c:"#ec4899",op:0.07,delay:"3s"},
          {top:"35%", left:"35%", w:500,c:"#06b6d4",op:0.05,delay:"1.5s"},
          {top:"75%", left:"10%", w:300,c:"#10b981",op:0.08,delay:"5s"},
          {top:"10%", left:"65%", w:350,c:"#f97316",op:0.06,delay:"2s"},
          {top:"65%", left:"45%", w:280,c:"#a855f7",op:0.07,delay:"4s"},
        ].map((o,i)=>(
          <div key={`blob_${i}`} className="bg-blob absolute"
            style={{top:o.top,left:o.left,width:o.w,height:o.w,background:`radial-gradient(circle,${o.c},transparent 70%)`,opacity:o.op,filter:"blur(55px)",animationDelay:o.delay}}/>
        ))}

        {/* ── Vivid floating circles with glow ── */}
        {[
          {top:"8%", left:"58%",size:110,c:"#6366f1",cls:"bg-a",delay:"0s",  op:0.18},
          {top:"52%",left:"8%", size:150,c:"#ec4899",cls:"bg-b",delay:"1.5s",op:0.15},
          {top:"72%",left:"52%",size:95, c:"#10b981",cls:"bg-c",delay:"2s",  op:0.18},
          {top:"22%",left:"82%",size:85, c:"#f97316",cls:"bg-d",delay:"0.8s",op:0.16},
          {top:"83%",left:"78%",size:125,c:"#3b82f6",cls:"bg-a",delay:"3s",  op:0.14},
          {top:"4%", left:"28%",size:75, c:"#eab308",cls:"bg-b",delay:"2.5s",op:0.18},
          {top:"44%",left:"92%",size:90, c:"#a855f7",cls:"bg-e",delay:"1s",  op:0.15},
          {top:"90%",left:"35%",size:105,c:"#06b6d4",cls:"bg-c",delay:"4s",  op:0.14},
          {top:"18%",left:"12%",size:80, c:"#f43f5e",cls:"bg-d",delay:"3.5s",op:0.16},
        ].map((s,i)=>(
          <div key={`circ_${i}`} className={`${s.cls} absolute rounded-full border-2`}
            style={{top:s.top,left:s.left,width:s.size,height:s.size,borderColor:s.c,opacity:s.op,animationDelay:s.delay,
              background:`radial-gradient(circle at 35% 35%,${s.c}25,transparent 70%)`,
              boxShadow:`0 0 ${s.size*0.4}px ${s.c}35`}}/>
        ))}

        {/* ── Triangles ── */}
        {[
          {top:"13%",left:"43%",size:30,c:"#06b6d4",cls:"bg-tri",  delay:"0s"},
          {top:"68%",left:"28%",size:24,c:"#eab308",cls:"bg-tri",  delay:"1.8s"},
          {top:"28%",left:"13%",size:34,c:"#ec4899",cls:"bg-a",    delay:"3.5s"},
          {top:"82%",left:"62%",size:22,c:"#10b981",cls:"bg-c",    delay:"2.2s"},
          {top:"48%",left:"86%",size:28,c:"#a855f7",cls:"bg-tri",  delay:"1s"},
          {top:"6%", left:"76%",size:20,c:"#f97316",cls:"bg-b",    delay:"4s"},
          {top:"38%",left:"55%",size:26,c:"#6366f1",cls:"bg-e",    delay:"2.8s"},
          {top:"92%",left:"18%",size:32,c:"#3b82f6",cls:"bg-tri",  delay:"0.5s"},
        ].map((t,i)=>(
          <svg key={`tri_${i}`} className={`${t.cls} absolute`} style={{top:t.top,left:t.left,opacity:0.3,animationDelay:t.delay}} width={t.size*2} height={t.size*2} viewBox="0 0 60 60">
            <polygon points="30,4 56,52 4,52" fill="none" stroke={t.c} strokeWidth="2.5"/>
          </svg>
        ))}

        {/* ── Squares / diamonds ── */}
        {[
          {top:"32%",left:"6%", size:24,c:"#f97316",cls:"bg-c",delay:"1s"},
          {top:"60%",left:"88%",size:20,c:"#10b981",cls:"bg-a",delay:"3s"},
          {top:"78%",left:"50%",size:28,c:"#6366f1",cls:"bg-b",delay:"2s"},
          {top:"20%",left:"50%",size:18,c:"#ec4899",cls:"bg-e",delay:"0.5s"},
        ].map((sq,i)=>(
          <svg key={`sq_${i}`} className={`${sq.cls} absolute`} style={{top:sq.top,left:sq.left,opacity:0.22,animationDelay:sq.delay}} width={sq.size*2} height={sq.size*2} viewBox="0 0 60 60">
            <rect x="10" y="10" width="40" height="40" fill="none" stroke={sq.c} strokeWidth="2.5" transform="rotate(45 30 30)"/>
          </svg>
        ))}

        {/* ── Spinning hexagons (nested) ── */}
        {[
          {top:"46%",left:"2%",  size:70,c:"#6366f1",cls:"bg-hex", delay:"0s"},
          {top:"10%",left:"53%", size:52,c:"#ec4899",cls:"bg-hexr",delay:"5s"},
          {top:"70%",left:"90%", size:62,c:"#10b981",cls:"bg-hex", delay:"10s"},
          {top:"88%",left:"5%",  size:45,c:"#f97316",cls:"bg-hexr",delay:"7s"},
          {top:"25%",left:"95%", size:55,c:"#06b6d4",cls:"bg-hex", delay:"3s"},
        ].map((h,i)=>(
          <svg key={`hex_${i}`} className={`${h.cls} absolute`} style={{top:h.top,left:h.left,opacity:0.15,animationDelay:h.delay}} width={h.size} height={h.size} viewBox="0 0 60 60">
            <polygon points="30,2 55,16 55,44 30,58 5,44 5,16" fill="none" stroke={h.c} strokeWidth="1.5"/>
            <polygon points="30,12 47,22 47,38 30,48 13,38 13,22" fill="none" stroke={h.c} strokeWidth="1"/>
          </svg>
        ))}

        {/* ── Diagonal drift lines ── */}
        {[
          {top:"22%",left:"-5%",w:220,c:"#6366f1",delay:"0s", dur:"11s"},
          {top:"62%",left:"-5%",w:170,c:"#06b6d4",delay:"3.5s",dur:"15s"},
          {top:"42%",left:"-5%",w:120,c:"#eab308",delay:"7s",  dur:"9s"},
          {top:"78%",left:"-5%",w:200,c:"#ec4899",delay:"1.5s",dur:"13s"},
          {top:"10%",left:"-5%",w:140,c:"#10b981",delay:"9s",  dur:"12s"},
          {top:"90%",left:"-5%",w:160,c:"#a855f7",delay:"5s",  dur:"14s"},
        ].map((l,i)=>(
          <div key={`line_${i}`} className="bg-line absolute"
            style={{top:l.top,left:l.left,width:l.w,height:3,background:`linear-gradient(90deg,transparent,${l.c},transparent)`,opacity:0.45,borderRadius:2,transform:"rotate(-45deg)",animationDuration:l.dur,animationDelay:l.delay}}/>
        ))}

        {/* ── Sparkling dots (lots more!) ── */}
        {Array.from({length:26}).map((_,i)=>(
          <div key={`dot_${i}`} className="bg-dot absolute rounded-full"
            style={{top:`${4+i*3.7}%`,left:`${(i*13+7)%96}%`,width:i%4===0?9:i%4===1?6:i%4===2?7:5,height:i%4===0?9:i%4===1?6:i%4===2?7:5,background:VIVID[i%VIVID.length],opacity:0.3,animationDelay:`${i*0.18}s`}}/>
        ))}

        {/* ── Rings (circles with no fill) ── */}
        {[
          {top:"35%",left:"75%",size:180,c:"#6366f1",op:0.06},
          {top:"70%",left:"20%",size:220,c:"#ec4899",op:0.05},
          {top:"5%", left:"40%",size:150,c:"#06b6d4",op:0.06},
        ].map((r,i)=>(
          <div key={`ring_${i}`} className="bg-c absolute rounded-full"
            style={{top:r.top,left:r.left,width:r.size,height:r.size,border:`2px solid ${r.c}`,opacity:r.op,animationDelay:`${i*2}s`}}/>
        ))}

        {/* ── Grid overlay ── */}
        <svg className="absolute inset-0 w-full h-full" style={{opacity:0.028}}>
          <defs><pattern id="g" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M 64 0 L 0 0 0 64" fill="none" stroke="#6366f1" strokeWidth="0.8"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
        </svg>
      </div>
    </>
  );
}

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, wide, extraWide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className={`modal-anim relative z-10 w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${extraWide?"max-w-4xl":wide?"max-w-2xl":"max-w-lg"}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <h3 className="font-extrabold text-slate-800 text-base">{title}</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 transition"><FiX size={16}/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}
function Inp({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>}
      <input {...props} className={`h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition placeholder:text-slate-300 ${props.readOnly?"bg-slate-50 text-slate-400":""} ${props.className||""}`}/>
    </div>
  );
}
function Txta({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>}
      <textarea {...props} className={`rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition placeholder:text-slate-300 resize-none ${props.className||""}`}/>
    </div>
  );
}
function ComboInput({ label, value, onChange, options=[], placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const filtered = options.filter(o=>o.toLowerCase().includes((value||"").toLowerCase())).slice(0,10);
  useEffect(() => {
    const h = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",h); return ()=>document.removeEventListener("mousedown",h);
  },[]);
  return (
    <div className="flex flex-col gap-1.5 relative" ref={ref}>
      {label && <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>}
      <div className="relative">
        <input value={value||""} onChange={e=>{onChange(e.target.value);setOpen(true);}} onFocus={()=>setOpen(true)} placeholder={placeholder}
          className="w-full h-10 rounded-xl border border-slate-200 px-3 pr-8 text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition placeholder:text-slate-300"/>
        <FiChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"/>
      </div>
      {open && filtered.length>0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-52 overflow-y-auto">
          {filtered.map(o=>(
            <button key={o} type="button" onMouseDown={()=>{onChange(o);setOpen(false);}}
              className={`w-full text-left px-3 py-2.5 text-sm transition hover:bg-blue-50 hover:text-blue-700 ${value===o?"bg-blue-50 text-blue-700 font-semibold":"text-slate-700"}`}>{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function AvatarComp({ src, name, id, size=96, editable, onEdit, showOnline }) {
  const srcUrl = toAbsoluteMediaUrl(src);
  return (
    <div className="relative inline-block" style={{width:size,height:size}}>
      {srcUrl
        ? <img src={srcUrl} alt={name} className="rounded-full object-cover shadow-md" style={{width:size,height:size,border:"3px solid white"}}/>
        : <div className="rounded-full flex items-center justify-center text-white font-bold shadow-md" style={{width:size,height:size,fontSize:size*0.33,border:"3px solid white",background:avatarGradient(id||name)}}>{initials(name)}</div>}
      {showOnline && <span className="online-dot absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-white"/>}
      {editable && (
        <button onClick={onEdit} className="absolute bottom-1 right-1 h-7 w-7 rounded-full bg-white shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-100 transition border border-slate-200">
          <FiCamera size={12}/>
        </button>
      )}
    </div>
  );
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon, onEdit, children, accent="#3b82f6" }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-[15px]">
          <span style={{color:accent}}>{icon}</span>{title}
        </h3>
        {onEdit && (
          <button onClick={onEdit} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition border border-slate-200">
            <FiEdit2 size={13}/>
          </button>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── SKILL BADGE ──────────────────────────────────────────────────────────────
const SKILL_COLORS=["#3b82f6","#10b981","#f97316","#a855f7","#06b6d4","#ec4899","#eab308","#ef4444"];
function skillColor(name){let h=0;for(let c of name)h=(h*31+c.charCodeAt(0))&0xffff;return SKILL_COLORS[h%SKILL_COLORS.length];}
function ColorBadge({name,color="#3b82f6",onRemove}){
  return (
    <span className="inline-flex items-center gap-1.5 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm" style={{background:color}}>
      {name}
      {onRemove&&<button onClick={onRemove} className="hover:opacity-70 rounded-full w-4 h-4 flex items-center justify-center"><FiX size={9}/></button>}
    </span>
  );
}

// ─── VIEW RESUME — opens in new browser tab ───────────────────────────────────
// Fetch through the backend so protected Cloudinary/local resumes open reliably.
async function openResumeInNewTab(fetchResumeFile, targetWindow = null) {
  const res = await fetchResumeFile();
  const contentType = res?.headers?.["content-type"] || "application/pdf";
  const blob = new Blob([res.data], { type: contentType });
  const blobUrl = URL.createObjectURL(blob);
  if (targetWindow && !targetWindow.closed) {
    targetWindow.location.href = blobUrl;
  } else {
    window.open(blobUrl, "_blank", "noopener,noreferrer");
  }
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

// ─── AVATAR MODAL ─────────────────────────────────────────────────────────────
function AvatarModal({ open, onClose, onUpload, onUrlSelect }) {
  const fileRef=useRef(null); const videoRef=useRef(null);
  const [tab,setTab]=useState("local"); const [stream,setStream]=useState(null);
  const [urlVal,setUrlVal]=useState(""); const [uploading,setUploading]=useState(false);
  const {getToken}=useAuth();
  const stopCam=useCallback(()=>{stream?.getTracks().forEach(t=>t.stop());setStream(null);},[stream]);
  useEffect(()=>{if(!open)stopCam();},[open,stopCam]);
  const startCam=async()=>{try{const s=await navigator.mediaDevices.getUserMedia({video:true});setStream(s);if(videoRef.current)videoRef.current.srcObject=s;}catch{toast("Camera access denied","error");}};
  const capture=async()=>{const c=document.createElement("canvas");c.width=videoRef.current.videoWidth;c.height=videoRef.current.videoHeight;c.getContext("2d").drawImage(videoRef.current,0,0);c.toBlob(async blob=>{await handleFileUpload(new File([blob],"avatar.jpg",{type:"image/jpeg"}));stopCam();},"image/jpeg",0.9);};
  const handleFileUpload=async file=>{try{setUploading(true);const token=await getToken();const res=await uploadAvatarAPI(file,token);const avatarUrl=res?.data?.data?.avatarUrl??res?.data?.avatarUrl;if(avatarUrl){onUpload(avatarUrl);toast("Profile photo updated!","success");onClose();}}catch{toast("Failed to upload photo","error");}finally{setUploading(false);}};
  return (
    <Modal open={open} onClose={()=>{stopCam();onClose();}} title="Update Profile Photo">
      <div className="flex gap-2">
        {[["local","📁 Local"],["cloud","☁️ URL"],["camera","📷 Camera"]].map(([t,l])=>(
          <button key={t} onClick={()=>{setTab(t);if(t==="camera")startCam();else stopCam();}}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${tab===t?"text-white bg-blue-500":"bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{l}</button>
        ))}
      </div>
      {tab==="local"&&(<><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e=>{if(e.target.files?.[0])handleFileUpload(e.target.files[0]);}}/><button onClick={()=>fileRef.current?.click()} disabled={uploading} className="w-full py-10 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 text-blue-600 text-sm font-bold hover:bg-blue-100 transition disabled:opacity-60">{uploading?"Uploading…":"📁 Click to choose from device"}</button></>)}
      {tab==="cloud"&&(<div className="space-y-3"><Inp label="Image URL" value={urlVal} onChange={e=>setUrlVal(e.target.value)} placeholder="https://example.com/photo.jpg"/>{urlVal&&<img src={urlVal} alt="" className="h-24 w-24 rounded-full object-cover mx-auto border-2 border-blue-200" onError={e=>e.target.style.display="none"}/>}<button onClick={()=>{if(urlVal){onUrlSelect(urlVal);toast("Photo updated!","success");onClose();}}} className="w-full py-2.5 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600">Use this photo</button></div>)}
      {tab==="camera"&&(<div className="space-y-3"><video ref={videoRef} autoPlay playsInline className="w-full rounded-xl bg-black aspect-video"/>{stream?<button onClick={capture} disabled={uploading} className="w-full py-2.5 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600">📸 Capture & Upload</button>:<button onClick={startCam} className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200">Start Camera</button>}</div>)}
    </Modal>
  );
}

// ─── COVER MODAL ──────────────────────────────────────────────────────────────
function CoverModal({open,onClose,onSelect}){
  const fileRef=useRef(null); const [urlVal,setUrlVal]=useState(""); const [tab,setTab]=useState("presets");
  return (
    <Modal open={open} onClose={onClose} title="Choose Cover Banner" extraWide>
      <div className="flex gap-2 flex-wrap">
        {["presets","gradients","upload"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition ${tab===t?"text-white bg-blue-500":"bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {t==="presets"?"🖼 Photos":t==="gradients"?"🎨 Gradients":"📁 Upload"}
          </button>
        ))}
      </div>
      {tab==="presets"&&(<div className="grid grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto pr-1">{FIXED_BANNERS.map((u,i)=>(<div key={i} className="relative group cursor-pointer rounded-xl overflow-hidden h-24" onClick={()=>{onSelect(u);onClose();toast("Cover updated!","success");}}><img src={u} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"/><div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100"><span className="bg-white rounded-full px-2 py-0.5 text-xs font-bold text-slate-700">Select</span></div></div>))}</div>)}
      {tab==="gradients"&&(<div className="grid grid-cols-4 gap-2">{GRADIENT_BANNERS.map((g,i)=>(<div key={i} className="h-16 rounded-xl cursor-pointer hover:scale-105 hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-400" style={{background:g}} onClick={()=>{onSelect(`__gradient__${g}`);onClose();toast("Gradient set!","success");}}/>))}</div>)}
      {tab==="upload"&&(<div className="space-y-3"><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{onSelect(ev.target.result);onClose();toast("Cover updated!","success");};r.readAsDataURL(f);}}/><button onClick={()=>fileRef.current?.click()} className="w-full py-6 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 text-blue-600 text-sm font-bold hover:bg-blue-100 transition">📁 Upload from device</button><div className="flex gap-2"><Inp label="Or paste URL" value={urlVal} onChange={e=>setUrlVal(e.target.value)} placeholder="https://…" className="flex-1"/><button onClick={()=>{if(urlVal){onSelect(urlVal);onClose();toast("Banner set!","success");}}} className="self-end h-10 px-4 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600">Use</button></div></div>)}
    </Modal>
  );
}

// ─── SKILLS MODAL ─────────────────────────────────────────────────────────────
function SkillsModal({open,onClose,skills,onChange}){
  const [search,setSearch]=useState(""); const [customInput,setCustomInput]=useState(""); const [activeCat,setActiveCat]=useState("Languages");
  const selectedNames=skills.map(s=>s.name.toLowerCase());
  const isSelected=name=>selectedNames.includes(name.toLowerCase());
  const toggle=name=>{if(isSelected(name))onChange(skills.filter(s=>s.name.toLowerCase()!==name.toLowerCase()));else onChange(normalizeSkillsForUi([...skills,name]));};
  const allFlat=Object.values(SKILL_CATEGORIES).flat();
  const searchResults=search.trim()?allFlat.filter(s=>s.toLowerCase().includes(search.toLowerCase())):[];
  const addCustom=()=>{const parsed=parseSkillsText(customInput).filter(n=>!isSelected(n));if(!parsed.length)return;onChange(normalizeSkillsForUi([...skills,...parsed]));setCustomInput("");toast(`Added ${parsed.join(", ")}!`,"success");};
  return (
    <Modal open={open} onClose={onClose} title="Add / Edit Skills" wide>
      {skills.length>0&&(<div><p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Selected ({skills.length})</p><div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 min-h-[44px]">{skills.map(s=><ColorBadge key={s.id} name={s.name} color={skillColor(s.name)} onRemove={()=>toggle(s.name)}/>)}</div></div>)}
      <div className="relative"><FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search skills…" className="w-full h-10 rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"/></div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">{Object.keys(SKILL_CATEGORIES).map(cat=>(<button key={cat} onClick={()=>setActiveCat(cat)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition ${activeCat===cat?"text-white bg-blue-500 border-transparent":"bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}>{cat}</button>))}</div>
      <div className="flex flex-wrap gap-2">{(search.trim()?searchResults:SKILL_CATEGORIES[activeCat]).map(s=>(<button key={s} onClick={()=>toggle(s)} className="px-3 py-1.5 rounded-full text-xs font-bold border transition shadow-sm" style={isSelected(s)?{background:skillColor(s),color:"white",borderColor:skillColor(s)}:{background:"white",color:"#475569",borderColor:"#e2e8f0"}}>{isSelected(s)?"✓ ":""}{s}</button>))}</div>
      <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Add custom</p><div className="flex gap-2"><input value={customInput} onChange={e=>setCustomInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addCustom();}}} placeholder="Type skill + Enter" className="flex-1 h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"/><button onClick={addCustom} className="px-4 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600">Add</button></div></div>
      <button onClick={onClose} className="w-full py-2.5 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 shadow-sm">Done</button>
    </Modal>
  );
}

// ─── PROJECTS MODAL ───────────────────────────────────────────────────────────
function newProject(){return {id:`pr_${Date.now()}`,title:"",description:"",techStack:"",hashtags:"",imageUrl:"",liveUrl:"",githubUrl:"",daysToComplete:""};}
function ProjectsModal({open,onClose,projects,onChange}){
  const [local,setLocal]=useState([]); const fileRefs=useRef({});
  useEffect(()=>{if(open)setLocal(projects.length?[...projects]:[newProject()]);},[open]);
  const upd=(id,field,value)=>setLocal(p=>p.map(x=>x.id===id?{...x,[field]:value}:x));
  const pickImg=(id,e)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>upd(id,"imageUrl",ev.target.result);r.readAsDataURL(f);};
  const save=()=>{onChange(local.filter(p=>p.title.trim()));onClose();toast("Projects saved!","success");};
  return (
    <Modal open={open} onClose={onClose} title="Add / Edit Projects" wide>
      <div className="space-y-6">{local.map((pr,idx)=>(
        <div key={pr.id} className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
            <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><span className="h-6 w-6 rounded-full text-white text-xs flex items-center justify-center bg-blue-500 font-bold">{idx+1}</span>{pr.title||"New Project"}</span>
            {local.length>1&&<button onClick={()=>setLocal(p=>p.filter(x=>x.id!==pr.id))} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"><FiTrash2 size={11}/>Remove</button>}
          </div>
          <div className="p-4 space-y-3">
            {pr.imageUrl?<div className="relative group rounded-xl overflow-hidden h-36 bg-slate-200"><img src={pr.imageUrl} alt="" className="w-full h-full object-cover"/><button onClick={()=>upd(pr.id,"imageUrl","")} className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-500"><FiTrash2 size={12}/></button></div>
              :<div className="flex gap-2"><input type="file" accept="image/*" className="hidden" ref={el=>fileRefs.current[pr.id]=el} onChange={e=>pickImg(pr.id,e)}/><button onClick={()=>fileRefs.current[pr.id]?.click()} className="flex-1 py-4 rounded-xl border-2 border-dashed border-slate-200 text-xs text-slate-500 hover:border-blue-300 hover:bg-blue-50 transition flex items-center justify-center gap-2"><FiImage size={14}/>Upload image</button><input value={pr.imageUrl} onChange={e=>upd(pr.id,"imageUrl",e.target.value)} placeholder="Or paste URL…" className="flex-1 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-400 bg-white"/></div>}
            <div className="grid grid-cols-2 gap-3">
              <Inp label="Project Name *" value={pr.title} onChange={e=>upd(pr.id,"title",e.target.value)} placeholder="My Awesome App" className="col-span-2"/>
              <Txta label="Description" value={pr.description} onChange={e=>upd(pr.id,"description",e.target.value)} placeholder="What does this project do?" className="h-24 w-full col-span-2"/>
              <Inp label="Tech Stack" value={pr.techStack} onChange={e=>upd(pr.id,"techStack",e.target.value)} placeholder="React, Node.js, MongoDB" className="col-span-2"/>
              <Inp label="Hashtags" value={pr.hashtags} onChange={e=>upd(pr.id,"hashtags",e.target.value)} placeholder="#webdev #react" className="col-span-2"/>
              <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><FiClock size={11}/>Days to Build</label><input type="number" min="1" value={pr.daysToComplete} onChange={e=>upd(pr.id,"daysToComplete",e.target.value)} placeholder="e.g. 14" className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white outline-none focus:border-blue-400"/></div>
              <Inp label="Live Demo URL" value={pr.liveUrl} onChange={e=>upd(pr.id,"liveUrl",e.target.value)} placeholder="https://…"/>
              <Inp label="GitHub URL" value={pr.githubUrl} onChange={e=>upd(pr.id,"githubUrl",e.target.value)} placeholder="https://github.com/…" className="col-span-2"/>
            </div>
          </div>
        </div>
      ))}</div>
      <button onClick={()=>setLocal(p=>[...p,newProject()])} className="w-full py-3 rounded-2xl border-2 border-dashed border-blue-200 text-sm text-blue-600 font-bold hover:bg-blue-50 transition flex items-center justify-center gap-2"><FiPlus/>Add Another Project</button>
      <button onClick={save} className="w-full py-3 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 shadow-sm">Save All Projects</button>
    </Modal>
  );
}

// ─── ABOUT MODAL ──────────────────────────────────────────────────────────────
function AboutModal({open,onClose,value,onSave}){
  const [draft,setDraft]=useState(value);
  useEffect(()=>{if(open)setDraft(value);},[open,value]);
  return (
    <Modal open={open} onClose={onClose} title="Edit About / Headline">
      <p className="text-xs text-slate-500 leading-relaxed">Write a compelling summary — mention your course, skills, goals, and opportunities you're seeking.</p>
      <Txta value={draft} onChange={e=>setDraft(e.target.value.slice(0,600))} placeholder="e.g. Final year B.Tech CSE student passionate about full-stack development…" className="h-48 w-full"/>
      <div className="flex justify-between items-center">
        <span className={`text-xs font-bold ${draft.length>540?"text-amber-500":"text-slate-400"}`}>{draft.length}/600</span>
        <div className="flex gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={()=>{onSave(draft);onClose();toast("About updated!","success");}} className="px-5 py-2 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 shadow-sm">Save</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── EDUCATION MODAL ──────────────────────────────────────────────────────────
function EducationModal({open,onClose,education,onChange}){
  const [local,setLocal]=useState([]);
  useEffect(()=>{if(open)setLocal(education.length?education.map(e=>({...e})):[{id:`ed_${Date.now()}`,degree:"",college:"",year:"",branch:"",score:"",board:"",universityRollNo:"",achievements:""}]);},[open]);
  const upd=(id,field,val)=>setLocal(p=>p.map(x=>x.id===id?{...x,[field]:val}:x));
  const YEAR_OPTIONS=Array.from({length:10},(_,i)=>String(new Date().getFullYear()+2-i));
  return (
    <Modal open={open} onClose={onClose} title="Edit Education Details" wide>
      <div className="space-y-5">{local.map((ed,idx)=>(
        <div key={ed.id} className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
            <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><span className="h-6 w-6 rounded-full text-white text-xs flex items-center justify-center bg-emerald-500">{idx+1}</span>Education Entry</span>
            {local.length>1&&<button onClick={()=>setLocal(p=>p.filter(x=>x.id!==ed.id))} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"><FiTrash2 size={11}/>Remove</button>}
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <ComboInput label="Degree / Class *" value={ed.degree} onChange={v=>upd(ed.id,"degree",v)} options={DEGREE_OPTIONS} placeholder="e.g. B.Tech, 12th…"/>
            <ComboInput label="Branch / Stream" value={ed.branch} onChange={v=>upd(ed.id,"branch",v)} options={BRANCH_OPTIONS} placeholder="e.g. CSE…"/>
            <Inp label="College / School *" value={ed.college} onChange={e=>upd(ed.id,"college",e.target.value)} placeholder="Full institution name" className="col-span-2"/>
            <ComboInput label="Board / University" value={ed.board} onChange={v=>upd(ed.id,"board",v)} options={BOARD_OPTIONS} placeholder="e.g. CBSE, VTU…"/>
            <ComboInput label="Pass-out Year *" value={ed.year} onChange={v=>upd(ed.id,"year",v)} options={YEAR_OPTIONS} placeholder="e.g. 2026"/>
            <Inp label="Score / CGPA / %" value={ed.score} onChange={e=>upd(ed.id,"score",e.target.value)} placeholder="e.g. 8.5 CGPA"/>
            <Inp label="University Roll No" value={ed.universityRollNo} onChange={e=>upd(ed.id,"universityRollNo",e.target.value)} placeholder="e.g. 1RV20CS001"/>
            <Txta label="Achievements" value={ed.achievements} onChange={e=>upd(ed.id,"achievements",e.target.value)} placeholder="e.g. Rank 3, Hackathon winner…" className="col-span-2 h-16 w-full"/>
          </div>
        </div>
      ))}</div>
      <button onClick={()=>setLocal(p=>[...p,{id:`ed_${Date.now()}`,degree:"",college:"",year:"",branch:"",score:"",board:"",universityRollNo:"",achievements:""}])} className="w-full py-3 rounded-2xl border-2 border-dashed border-emerald-200 text-sm text-emerald-600 font-bold hover:bg-emerald-50 transition">+ Add Another Education</button>
      <button onClick={()=>{onChange(local.filter(e=>e.college||e.degree));onClose();toast("Education saved!","success");}} className="w-full py-2.5 rounded-xl text-white text-sm font-bold bg-emerald-500 hover:bg-emerald-600 shadow-sm">Save Education</button>
    </Modal>
  );
}

// ─── PREFERRED JOBS MODAL ─────────────────────────────────────────────────────
function PreferredModal({open,onClose,preferred,onChange}){
  const [local,setLocal]=useState({...EMPTY.preferred});
  useEffect(()=>{if(open)setLocal({...preferred});},[open,preferred]);
  const upd=(k,v)=>setLocal(p=>({...p,[k]:v}));
  const LOC_OPTIONS=["Bangalore","Mumbai","Hyderabad","Chennai","Pune","Delhi / NCR","Noida","Gurgaon","Kolkata","Ahmedabad","Remote","Pan India","Any Location"];
  const chip=sel=>sel?{background:"#3b82f6",color:"white",borderColor:"#3b82f6"}:{background:"white",color:"#475569",borderColor:"#e2e8f0"};
  return (
    <Modal open={open} onClose={onClose} title="Preferred Job Settings" wide>
      <div className="grid grid-cols-2 gap-4">
        {[["stream","Job Stream",JOB_STREAMS],["category","Job Category",JOB_CATEGORIES]].map(([key,heading,opts])=>(
          <div key={key} className="col-span-2"><p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{heading}</p><div className="flex flex-wrap gap-2 mb-2">{opts.map(s=><button key={s} onClick={()=>upd(key,s)} className="px-3 py-1.5 rounded-full text-xs font-bold border transition" style={chip(local[key]===s)}>{s}</button>)}</div><input value={local[key]} onChange={e=>upd(key,e.target.value)} placeholder="Or type custom…" className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 bg-white"/></div>
        ))}
        <div className="col-span-2"><p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Work Mode</p><div className="flex gap-2 flex-wrap">{WORK_MODES.map(m=><button key={m} onClick={()=>upd("workMode",m)} className="px-4 py-2 rounded-xl text-sm font-bold border transition" style={chip(local.workMode===m)}>{m}</button>)}</div></div>
        <div className="col-span-2"><p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Expected Salary</p><div className="flex flex-wrap gap-2 mb-2">{SALARY_RANGES.map(s=><button key={s} onClick={()=>upd("salary",s)} className="px-3 py-1.5 rounded-full text-xs font-bold border transition" style={chip(local.salary===s)}>{s}</button>)}</div><input value={local.salary} onChange={e=>upd("salary",e.target.value)} placeholder="Or type custom…" className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 bg-white"/></div>
        <div className="col-span-2"><p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Preferred Locations</p><div className="flex flex-wrap gap-2 mb-2">{LOC_OPTIONS.map(l=>{const isSel=(local.locations||"").split(",").map(s=>s.trim()).includes(l);return(<button key={l} onClick={()=>{const arr=(local.locations||"").split(",").map(s=>s.trim()).filter(Boolean);const next=isSel?arr.filter(x=>x!==l):[...arr,l];upd("locations",next.join(", "));}} className="px-3 py-1.5 rounded-full text-xs font-bold border transition" style={chip(isSel)}>{l}</button>);})}</div><input value={local.locations} onChange={e=>upd("locations",e.target.value)} placeholder="Or type cities…" className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 bg-white"/></div>
      </div>
      <button onClick={()=>{onChange(local);onClose();toast("Job preferences saved!","success");}} className="w-full py-2.5 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 shadow-sm mt-2">Save Preferences</button>
    </Modal>
  );
}

// ─── RECENTLY ACTIVE USERS ────────────────────────────────────────────────────
function RecentUsersSection({token,onFollowChange}){
  const [users,setUsers]=useState([]); const [loading,setLoading]=useState(true);
  const [followState,setFollowState]=useState({}); const [showAll,setShowAll]=useState(false);
  useEffect(()=>{if(!token)return;setLoading(true);getRecentUsers(token).then(res=>{const data=res?.data?.data??res?.data??[];const arr=Array.isArray(data)?data:[];setUsers(arr);const init={};arr.forEach(u=>{init[u._id]="none";});setFollowState(init);}).catch(()=>setUsers([])).finally(()=>setLoading(false));},[token]);
  const handleFollow=async user=>{const current=followState[user._id]||"none";if(current==="loading")return;setFollowState(p=>({...p,[user._id]:"loading"}));try{const res=await toggleFollow(user._id,token);const action=res?.data?.action??res?.data?.data?.action;const next=action==="followed"?"following":"none";setFollowState(p=>({...p,[user._id]:next}));toast(next==="following"?`Now following ${user.name}!`:`Unfollowed ${user.name}`,next==="following"?"success":"info");onFollowChange?.(next==="following"?"followed":"unfollowed");}catch{setFollowState(p=>({...p,[user._id]:current}));toast("Failed — please try again","error");}};
  if(loading)return(<div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-2 mb-3"><div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center"><FiActivity size={14} className="text-emerald-500"/></div><p className="text-sm font-bold text-slate-700">Recently Active</p></div><div className="flex items-center gap-2 text-slate-400 text-xs"><div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-transparent animate-spin"/>Loading…</div></div>);
  if(users.length===0)return null;
  const displayed=showAll?users:users.slice(0,5);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center"><FiActivity size={14} className="text-emerald-500"/></div>
        <div><p className="text-sm font-bold text-slate-800">Recently Active</p><p className="text-xs text-slate-400">{users.length} user{users.length!==1?"s":""} online recently</p></div>
      </div>
      <div className="divide-y divide-slate-50">{displayed.map(user=>{const state=followState[user._id]||"none";const isFollowing=state==="following";const isLoading=state==="loading";return(
        <div key={user._id} className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              {user.avatarUrl?<img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"/>:<div className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{background:avatarGradient(user._id)}}>{initials(user.name)}</div>}
              <span className="online-dot absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.designation||"Student"}{user.city?` · ${user.city}`:""}</p>
            </div>
            <button onClick={()=>handleFollow(user)} disabled={isLoading}
              className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all disabled:opacity-60 ${isFollowing?"bg-slate-100 text-slate-500 border-slate-200 hover:bg-red-50 hover:text-red-500":"bg-white text-blue-600 border-blue-300 hover:bg-blue-500 hover:text-white hover:border-blue-500 shadow-sm"}`}>
              {isLoading?<span className="h-3 w-3 rounded-full border border-current border-t-transparent animate-spin"/>:isFollowing?<><FiCheck size={11}/> Following</>:<><FiUserPlus size={11}/> Follow</>}
            </button>
          </div>
        </div>
      );})}</div>
      {users.length>5&&(<button onClick={()=>setShowAll(v=>!v)} className="w-full py-3 text-xs font-bold text-blue-500 hover:bg-blue-50 transition-colors border-t border-slate-100 flex items-center justify-center gap-1.5">{showAll?<><FiChevronDown size={13} style={{transform:"rotate(180deg)"}}/> Show less</>:<><FiUsers size={12}/> Show {users.length-5} more</>}</button>)}
    </div>
  );
}

// ─── FOLLOW SUGGESTIONS ───────────────────────────────────────────────────────
function FollowSuggestions({token,onFollowChange}){
  const [suggestions,setSuggestions]=useState([]); const [loading,setLoading]=useState(true); const [followState,setFollowState]=useState({});
  useEffect(()=>{if(!token)return;setLoading(true);getFollowSuggestions(token).then(res=>{const data=res?.data?.data??res?.data??[];const arr=Array.isArray(data)?data:[];setSuggestions(arr);const init={};arr.forEach(u=>{init[u._id]="none";});setFollowState(init);}).catch(()=>setSuggestions([])).finally(()=>setLoading(false));},[token]);
  const handleFollow=async user=>{const current=followState[user._id]||"none";if(current==="loading")return;setFollowState(p=>({...p,[user._id]:"loading"}));try{const res=await toggleFollow(user._id,token);const action=res?.data?.action??res?.data?.data?.action;const next=action==="followed"?"following":"none";setFollowState(p=>({...p,[user._id]:next}));toast(next==="following"?`Now following ${user.name}!`:`Unfollowed ${user.name}`,next==="following"?"success":"info");onFollowChange?.(next==="following"?"followed":"unfollowed");}catch{setFollowState(p=>({...p,[user._id]:current}));toast("Failed — please try again","error");}};
  if(loading)return(<div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-2 text-slate-400 text-xs"><div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-transparent animate-spin"/>Finding people you may know…</div></div>);
  if(suggestions.length===0)return null;
  return (
    <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><FiUsers size={14} className="text-blue-500"/>People you may know</h3>
      <div className="space-y-4">{suggestions.map(s=>{const state=followState[s._id]||"none";const isFollowing=state==="following";const isLoading=state==="loading";return(
        <div key={s._id} className="flex items-center gap-3">
          {s.avatarUrl?<img src={s.avatarUrl} alt={s.name} className="h-9 w-9 rounded-full object-cover flex-shrink-0 border border-slate-200"/>:<div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{background:avatarGradient(s._id)}}>{initials(s.name)}</div>}
          <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p><p className="text-xs text-slate-500 truncate">{s.designation}{s.city?` · ${s.city}`:""}</p>{s.mutualConnections>0&&<p className="text-xs text-blue-500 font-semibold">{s.mutualConnections} mutual</p>}</div>
          <button onClick={()=>handleFollow(s)} disabled={isLoading} className={`text-xs font-bold px-3 py-1.5 rounded-full border transition flex-shrink-0 disabled:opacity-60 ${isFollowing?"bg-slate-100 text-slate-500 border-slate-200":"text-blue-600 border-blue-300 hover:bg-blue-500 hover:text-white hover:border-blue-500"}`}>{isLoading?"…":isFollowing?"✓ Following":"+ Follow"}</button>
        </div>
      );})}</div>
    </div>
  );
}

// ─── APPLIED JOBS TAB ─────────────────────────────────────────────────────────
const STATUS_STYLES={"Applied":{bg:"#eff6ff",color:"#3b82f6",border:"#bfdbfe"},"Under Review":{bg:"#fffbeb",color:"#f59e0b",border:"#fde68a"},"Shortlisted":{bg:"#f0fdf4",color:"#10b981",border:"#a7f3d0"},"Interview Scheduled":{bg:"#faf5ff",color:"#a855f7",border:"#e9d5ff"},"Rejected":{bg:"#fef2f2",color:"#ef4444",border:"#fecaca"},"Offered":{bg:"#ecfeff",color:"#06b6d4",border:"#a5f3fc"}};

function AppliedJobsTab({token}){
  const [jobs,setJobs]=useState([]); const [loading,setLoading]=useState(true);
  const loadJobs=useCallback(async()=>{if(!token)return;setLoading(true);try{const res=await getAppliedJobs(token);setJobs(res?.data?.data??res?.data??[]);}catch{toast("Failed to load applied jobs","error");}finally{setLoading(false);}}, [token]);
  useEffect(()=>{loadJobs();},[loadJobs]);
  const handleWithdraw=async app=>{
    const ok=await sweet.confirm("Withdraw Application?",`Withdraw your application for ${app.title} at ${app.company}? This cannot be undone.`,"Yes, Withdraw","Keep");
    if(!ok)return;
    try{await withdrawApplication(app.applicationId,token);setJobs(p=>p.filter(j=>j.applicationId!==app.applicationId));toast(`Withdrawn from ${app.company}`,"warning");sweet.success("Withdrawn!","Your application has been withdrawn.");}
    catch{toast("Failed to withdraw","error");}
  };
  if(loading)return(<div className="max-w-[1128px] mx-auto px-4 py-12 text-center"><div className="h-10 w-10 rounded-full border-2 border-blue-400 border-t-transparent animate-spin mx-auto"/></div>);
  return (
    <div className="max-w-[1128px] mx-auto px-4 py-4 relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div><h2 className="text-xl font-extrabold text-slate-800">Applied Jobs</h2><p className="text-sm text-slate-500">{jobs.length} application{jobs.length!==1?"s":""}</p></div>
        <Link to="/student/jobs" className="px-4 py-2 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 flex items-center gap-2 transition shadow-sm"><FiSearch size={13}/>Browse Jobs</Link>
      </div>
      {jobs.length===0?<div className="rounded-2xl p-12 text-center border border-slate-200 bg-white shadow-sm"><FiCheckSquare size={40} className="mx-auto mb-3 text-slate-300"/><p className="font-bold text-slate-500">No applications yet</p><p className="text-xs text-slate-400 mt-1">Jobs you apply to will appear here</p></div>
      :<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{jobs.map(job=>{const{dayName,date,time,ago}=formatAppliedDate(job.appliedAt);const ss=STATUS_STYLES[job.status]||STATUS_STYLES["Applied"];return(
        <div key={job.applicationId} className="rounded-2xl p-5 border overflow-hidden relative bg-white shadow-sm hover:shadow-md hover:scale-[1.01] transition-all" style={{borderColor:ss.border}}>
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{background:ss.color,opacity:0.4}}/>
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-extrabold shadow-sm flex-shrink-0" style={{background:ss.bg,border:`1px solid ${ss.border}`,color:ss.color}}>{job.companyLogo?<img src={job.companyLogo} alt={job.company} className="h-10 w-10 rounded-xl object-contain"/>:(job.company?.[0]||"?")}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2"><div><p className="font-extrabold text-slate-800 text-base">{job.title}</p><p className="text-sm font-bold text-slate-500">{job.company}</p></div><span className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full" style={{background:ss.bg,color:ss.color,border:`1px solid ${ss.border}`}}>{job.status}</span></div>
              {job.location&&<p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><FiMapPin size={10}/>{job.location}</p>}
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-100"><div className="text-xs text-slate-400 flex items-center gap-1.5"><FiCalendar size={11}/>{dayName}, {date} · {time}</div><span className="text-xs font-bold" style={{color:ss.color}}>{ago}</span></div>
          <div className="mt-3 flex gap-2">
            <button className="flex-1 py-1.5 rounded-xl text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition flex items-center justify-center gap-1"><FiEye size={11}/>View Job</button>
            <button onClick={()=>handleWithdraw(job)} className="flex-1 py-1.5 rounded-xl text-xs font-bold text-red-400 bg-red-50 hover:bg-red-100 border border-red-200 transition flex items-center justify-center gap-1"><FiX size={11}/>Withdraw</button>
          </div>
        </div>
      );})}</div>}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Profile() {
  const {getToken}=useAuth();
  const resumeInputRef=useRef(null);
  const [token,setToken]=useState(null);
  const [form,setForm]=useState(EMPTY);
  const [initialForm,setInitialForm]=useState(EMPTY);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [uploadingResume,setUploadingResume]=useState(false);
  const [dirty,setDirty]=useState(false);
  const [activeTab,setActiveTab]=useState("profile");
  const [modal,setModal]=useState(null);

  const openModal=name=>setModal(name);
  const closeModal=()=>setModal(null);
  const setPersonal=(key,val)=>{setForm(p=>({...p,personal:{...p.personal,[key]:val}}));setDirty(true);};

  // ── Load profile from MongoDB on mount ──────────────────────────────────────
  useEffect(()=>{
    let mounted=true;
    (async()=>{
      try{
        setLoading(true);
        const t=await getToken();
        setToken(t);
        const res=await studentMe(t);
        const me=res?.data?.data??res?.data??{};
        const next=mapProfileToForm(me);
        next.skills=normalizeSkillsForUi(next.skills);
        if(!mounted)return;
        setForm(next);setInitialForm(next);setDirty(false);
      }catch(err){
        console.error("[Profile load]",err?.response?.data||err.message);
        toast("Failed to load profile","error");
      }finally{if(mounted)setLoading(false);}
    })();
    return()=>{mounted=false;};
  },[getToken]);

  const completion=useMemo(()=>{
    const checks={"Personal Info":!!(form.personal.fullName&&form.personal.phone&&form.personal.city),"About":!!form.personal.about,"Education":hasValidEducation(form.education),"Skills":normalizedSkillCount(form.skills)>=2,"Experience":form.fresher||form.experience.some(e=>e.company&&e.role),"Resume":!!form.resume.fileName,"Projects":form.projects.length>0};
    const done=Object.values(checks).filter(Boolean).length;
    return{checks,value:Math.round((done/Object.keys(checks).length)*100)};
  },[form]);

  // ── Upload resume → Cloudinary ───────────────────────────────────────────────
  const onPickResume=async e=>{
    const file=e.target.files?.[0];if(!file)return;
    const allowed=[".pdf",".doc",".docx"].some(x=>file.name.toLowerCase().endsWith(x));
    if(!allowed){toast("Only PDF, DOC, DOCX allowed","error");e.target.value="";return;}
    try{
      setUploadingResume(true);
      const t=await getToken();
      const res=await uploadResumeAPI(file,t);
      const rp=res?.data?.data??res?.data??{};
      setForm(p=>({...p,resume:{fileName:rp.resumeMeta?.fileName||file.name,size:rp.resumeMeta?.size||`${Math.max(1,Math.round(file.size/1024))} KB`,updatedAt:rp.resumeMeta?.updatedAt||new Date().toISOString(),url:rp.resumeUrl||""}}));
      setDirty(true);
      toast("Resume uploaded! ✓","success");
      sweet.success("Resume Uploaded!",`"${file.name}" uploaded successfully to Cloudinary.`);
    }catch(err){
      const msg=err?.response?.data?.message||"Upload failed";
      toast(msg,"error");
      sweet.error("Upload Failed",msg);
    }finally{setUploadingResume(false);e.target.value="";}
  };

  // ── View Resume — opens directly in new browser tab ──────────────────────────
  const viewResume=async()=>{
    if(!form.resume.url&&!form.resume.fileName){
      sweet.warning("No Resume","Please upload your resume first.");return;
    }
    const resumeWindow=window.open("", "_blank");
    if(resumeWindow) resumeWindow.opener=null;
    try{
      const t=token||await getToken();
      await openResumeInNewTab(()=>studentViewResumeFile(t),resumeWindow);
    }catch(err){
      if(resumeWindow&&!resumeWindow.closed) resumeWindow.close();
      const msg=err?.response?.data?.message||"Resume file is not available. Please upload it again.";
      toast(msg,"error");
      sweet.error("Resume Not Available",msg);
    }
  };

  // ── Save profile to MongoDB ──────────────────────────────────────────────────
  const save=async()=>{
    if(!form.personal.fullName.trim()){toast("Please enter your full name","warning");return;}
    try{
      setSaving(true);
      const t=await getToken();
      const payload={
        name:form.personal.fullName,phone:form.personal.phone,
        location:form.personal.location,linkedin:form.personal.linkedin,portfolio:form.personal.portfolio,
        avatarUrl:form.personal.avatarUrl,profileImageUrl:form.personal.avatarUrl,imageUrl:form.personal.avatarUrl,
        studentProfile:{
          personal:form.personal,
          education:safeArr(form.education).map(({id,...r})=>r),
          skills:safeArr(form.skills).flatMap(s=>parseSkillsText(typeof s==="string"?s:s?.name||"")).filter(Boolean),
          fresher:form.fresher,
          experience:safeArr(form.experience).map(({id,...r})=>r),
          projects:safeArr(form.projects).map(({id,...r})=>r),
          preferred:{...form.preferred,subCategory:form.preferred.subcategory||"",expectedSalary:form.preferred.salary||""},
          resumeMeta:{fileName:form.resume.fileName,size:form.resume.size,updatedAt:form.resume.updatedAt},
        },
      };
      const saveRes=await studentUpdateProfile(payload,t);
      const updated=saveRes?.data?.data??saveRes?.data??{};
      const next=mapProfileToForm(updated);
      next.skills=normalizeSkillsForUi(next.skills);
      setForm(next);setInitialForm(next);setDirty(false);
      toast("Profile saved! ✓","success");
      sweet.success("Profile Saved!","All your changes have been saved to the database.");
    }catch(err){
      const msg=err?.response?.data?.message||"Save failed";
      toast(msg,"error");
      sweet.error("Save Failed",msg);
    }finally{setSaving(false);}
  };

  const handleDiscard=async()=>{
    const ok=await sweet.confirm("Discard Changes?","All unsaved changes will be lost.","Yes, Discard","Keep Editing");
    if(ok){setForm(initialForm);setDirty(false);toast("Changes discarded","info");}
  };

  if(loading)return(
    <div className="min-h-screen flex items-center justify-center" style={{background:"#eef2ff"}}>
      <AnimatedBackground/><ToastContainer/>
      <div className="text-center space-y-3 relative z-10">
        <div className="h-12 w-12 rounded-full border-2 border-blue-400 border-t-transparent animate-spin mx-auto"/>
        <p className="text-sm text-slate-500 font-semibold">Loading your profile…</p>
      </div>
    </div>
  );

  const coverStyle=form.personal.coverPhoto?.startsWith("__gradient__")
    ?{background:form.personal.coverPhoto.replace("__gradient__",""),backgroundSize:"cover"}
    :form.personal.coverPhoto
      ?{backgroundImage:`url(${form.personal.coverPhoto})`,backgroundSize:"cover",backgroundPosition:"center"}
      :{background:"linear-gradient(135deg,#667eea,#764ba2)"};

  const citySuggestions=form.personal.state?(CITIES_BY_STATE[form.personal.state]||[]):Object.values(CITIES_BY_STATE).flat().slice(0,20);

  return (
    <div className="min-h-screen" style={{background:"#eef2ff"}}>
      <AnimatedBackground/>
      <ToastContainer/>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[1128px] mx-auto px-4 pt-4 pb-2 relative z-10">
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
          {/* Cover */}
          <div className="relative h-48 group cursor-pointer" style={coverStyle} onClick={()=>openModal("cover")}>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="bg-black/50 rounded-full px-4 py-2 text-sm font-bold text-white flex items-center gap-2"><FiCamera size={14}/>Change Cover</span>
            </div>
          </div>

          <div className="px-6 pb-0">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12">
              <AvatarComp src={form.personal.avatarUrl} name={form.personal.fullName} id={form.personal.email} size={96} editable onEdit={()=>openModal("avatar")}/>
              <div className="flex gap-2 sm:mb-2 flex-wrap">
                <button onClick={()=>openModal("hero")} className="h-9 px-4 rounded-full text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 transition shadow-sm"><FiEdit2 size={13}/>Edit Profile</button>
                <button onClick={()=>resumeInputRef.current?.click()} disabled={uploadingResume}
                  className="h-9 px-4 rounded-full text-white text-sm font-bold bg-orange-500 hover:bg-orange-600 flex items-center gap-1.5 transition disabled:opacity-60 shadow-sm">
                  <FiUploadCloud size={13}/>{uploadingResume?"Uploading…":"Upload Resume"}
                </button>
                {form.resume.fileName&&(
                  <button onClick={viewResume}
                    className="h-9 px-4 rounded-full text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 flex items-center gap-1.5 transition shadow-sm">
                    <FiEye size={13}/>View Resume
                  </button>
                )}
                <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onPickResume}/>
              </div>
            </div>

            <div className="mt-3 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">{form.personal.fullName||"Your Name"}</h1>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">{form.personal.designation||"Student"}</span>
              </div>
              <div className="mt-1.5 cursor-pointer group" onClick={()=>openModal("about")}>
                {form.personal.about
                  ?<p className="text-sm text-slate-500 leading-relaxed max-w-2xl group-hover:text-slate-700 transition">{form.personal.about}</p>
                  :<p className="text-sm text-slate-400 italic group-hover:text-blue-500 transition flex items-center gap-1.5"><FiEdit2 size={12}/>Click to add a headline or about…</p>}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                {(form.personal.city||form.personal.state)&&<span className="flex items-center gap-1"><FiMapPin size={11}/>{[form.personal.city,form.personal.state].filter(Boolean).join(", ")}</span>}
                {form.personal.email&&<span>{form.personal.email}</span>}
                {form.personal.linkedin&&<a href={form.personal.linkedin} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1"><FiLinkedin size={11}/>LinkedIn</a>}
                {form.personal.github&&<a href={form.personal.github} target="_blank" rel="noreferrer" className="text-slate-500 hover:underline flex items-center gap-1"><FiGithub size={11}/>GitHub</a>}
              </div>
              {/* Stats */}
              <div className="flex flex-wrap mt-4 pt-4 divide-x divide-slate-100 border-t border-slate-100">
                {[{label:"Profile Views",val:form.stats.profileViews,c:"#3b82f6",icon:<FiEye size={10}/>},{label:"Project Views",val:form.stats.projectViews,c:"#10b981",icon:<FiCode size={10}/>},{label:"Followers",val:form.stats.followers,c:"#a855f7",icon:<FiUsers size={10}/>},{label:"Following",val:form.stats.following,c:"#06b6d4",icon:<FiUsers size={10}/>}].map(s=>(
                  <div key={s.label} className="flex flex-col items-center gap-0.5 px-4">
                    <span className="text-xl font-extrabold" style={{color:s.c}}>{s.val}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-0.5">{s.icon}{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-t border-slate-100">
              {[{k:"profile",l:"Profile"},{k:"jobs",l:"Applied Jobs"}].map(t=>(
                <button key={t.k} onClick={()=>setActiveTab(t.k)}
                  className="px-5 py-3 text-sm font-bold border-b-2 transition"
                  style={activeTab===t.k?{borderColor:"#3b82f6",color:"#3b82f6"}:{borderColor:"transparent",color:"#94a3b8"}}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activeTab==="jobs"&&<AppliedJobsTab token={token}/>}

      {activeTab==="profile"&&(
        <div className="max-w-[1128px] mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 relative z-10">
          {/* LEFT */}
          <div className="space-y-4">
            <SectionCard title="About" icon={<FiUser size={15}/>} onEdit={()=>openModal("about")} accent="#3b82f6">
              {form.personal.about?<p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{form.personal.about}</p>:<button onClick={()=>openModal("about")} className="text-sm text-blue-500 hover:underline font-semibold flex items-center gap-1.5"><FiPlus size={13}/>Add about / headline</button>}
            </SectionCard>

            <SectionCard title="Education" icon={<FiBook size={15}/>} onEdit={()=>openModal("education")} accent="#10b981">
              {form.education.length===0?<button onClick={()=>openModal("education")} className="text-sm text-emerald-500 hover:underline font-semibold flex items-center gap-1.5"><FiPlus size={13}/>Add education</button>
              :<div className="space-y-4">{form.education.map(ed=>(<div key={ed.id} className="flex gap-3"><div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50 border border-emerald-100"><FiBook size={16} className="text-emerald-500"/></div><div><p className="text-sm font-bold text-slate-800">{ed.college||"College"}</p><p className="text-sm text-slate-500">{ed.degree}{ed.branch?` — ${ed.branch}`:""}</p><p className="text-xs text-slate-400">{ed.board&&`${ed.board} · `}{ed.year}{ed.score?` · Score: ${ed.score}`:""}</p>{ed.achievements&&<p className="text-xs font-medium mt-0.5 text-emerald-600">🏆 {ed.achievements}</p>}</div></div>))}</div>}
            </SectionCard>

            <SectionCard title="Skills" icon={<FiAward size={15}/>} onEdit={()=>openModal("skills")} accent="#a855f7">
              {form.skills.length===0?<button onClick={()=>openModal("skills")} className="text-sm text-purple-500 hover:underline font-semibold flex items-center gap-1.5"><FiPlus size={13}/>Add skills</button>
              :<div className="flex flex-wrap gap-2">{form.skills.map(s=><ColorBadge key={s.id} name={s.name} color={skillColor(s.name)}/>)}<button onClick={()=>openModal("skills")} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 border-dashed border-purple-200 text-purple-500 hover:bg-purple-50 transition"><FiPlus size={11}/>Add more</button></div>}
            </SectionCard>

            <SectionCard title="Experience" icon={<FiBriefcase size={15}/>} onEdit={()=>openModal("experience")} accent="#f97316">
              {form.fresher?<div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400"/><p className="text-sm text-slate-600 font-semibold">Fresher — open to first opportunities</p></div>
              :form.experience.filter(e=>e.company).length===0?<button onClick={()=>openModal("experience")} className="text-sm text-orange-500 hover:underline font-semibold flex items-center gap-1.5"><FiPlus size={13}/>Add experience</button>
              :<div className="space-y-4">{form.experience.filter(e=>e.company).map(ex=>(<div key={ex.id} className="flex gap-3"><div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-orange-50 border border-orange-100"><FiBriefcase size={16} className="text-orange-500"/></div><div><p className="text-sm font-bold text-slate-800">{ex.role}</p><p className="text-sm text-slate-500">{ex.company}</p><p className="text-xs text-slate-400">{ex.from}{ex.from&&" – "}{ex.current?"Present":ex.to}</p>{ex.description&&<p className="text-xs text-slate-400 mt-0.5">{ex.description}</p>}</div></div>))}</div>}
            </SectionCard>

            <SectionCard title="Projects" icon={<FiCode size={15}/>} onEdit={()=>openModal("projects")} accent="#06b6d4">
              {form.projects.filter(p=>p.title).length===0?<button onClick={()=>openModal("projects")} className="text-sm text-cyan-500 hover:underline font-semibold flex items-center gap-1.5"><FiPlus size={13}/>Add a project</button>
              :<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {form.projects.filter(p=>p.title).map(pr=>(<div key={pr.id} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 hover:shadow-md hover:scale-[1.02] transition-all">{pr.imageUrl?<img src={pr.imageUrl} alt={pr.title} className="h-36 w-full object-cover"/>:<div className="h-36 flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-50"><FiCode size={32} className="text-cyan-200"/></div>}<div className="p-4"><p className="text-sm font-bold text-slate-800">{pr.title}</p>{pr.daysToComplete&&<p className="text-xs font-bold text-cyan-500 flex items-center gap-1 mt-0.5"><FiClock size={10}/>{pr.daysToComplete} days to build</p>}{pr.description&&<p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{pr.description}</p>}{pr.techStack&&<div className="flex flex-wrap gap-1 mt-2">{pr.techStack.split(",").filter(Boolean).map(t=><span key={t} className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500">{t.trim()}</span>)}</div>}<div className="flex gap-3 mt-3">{pr.liveUrl&&<a href={pr.liveUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 flex items-center gap-1 hover:underline font-semibold"><FiExternalLink size={11}/>Live</a>}{pr.githubUrl&&<a href={pr.githubUrl} target="_blank" rel="noreferrer" className="text-xs text-slate-500 flex items-center gap-1 hover:underline font-semibold"><FiGithub size={11}/>Code</a>}</div></div></div>))}
                <button onClick={()=>openModal("projects")} className="h-36 rounded-xl font-bold border-2 border-dashed border-cyan-200 text-cyan-500 hover:bg-cyan-50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-sm"><FiPlus/>Add Project</button>
              </div>}
            </SectionCard>

            <SectionCard title="Preferred Job Settings" icon={<FiBriefcase size={15}/>} onEdit={()=>openModal("preferred")} accent="#eab308">
              {!(form.preferred.stream||form.preferred.workMode)?<button onClick={()=>openModal("preferred")} className="text-sm text-yellow-500 hover:underline font-semibold flex items-center gap-1.5"><FiPlus size={13}/>Add job preferences</button>
              :<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{[["Stream",form.preferred.stream],["Category",form.preferred.category],["Subcategory",form.preferred.subcategory],["Work Mode",form.preferred.workMode],["Locations",form.preferred.locations],["Salary",form.preferred.salary]].filter(([,v])=>v).map(([k,v])=>(<div key={k}><p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-0.5">{k}</p><p className="text-sm text-slate-700 font-bold">{v}</p></div>))}</div>}
            </SectionCard>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-4">
            {/* Profile strength */}
            <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Profile Strength</h3>
              <div className="relative h-2.5 rounded-full mb-3 overflow-hidden bg-slate-100">
                <div className="h-full rounded-full transition-all duration-700" style={{width:`${completion.value}%`,background:"linear-gradient(90deg,#3b82f6,#8b5cf6)"}}/>
              </div>
              <div className="flex justify-between text-xs mb-3">
                <span className="text-slate-400">{completion.value}% complete</span>
                <span className="font-bold" style={{color:completion.value===100?"#10b981":completion.value>=70?"#3b82f6":"#94a3b8"}}>{completion.value===100?"All Star 🎉":completion.value>=70?"Strong":"Keep going"}</span>
              </div>
              <div className="space-y-2">{Object.entries(completion.checks).map(([k,done])=>(<div key={k} className="flex items-center gap-2 text-xs"><span className={`h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 ${done?"bg-emerald-100 text-emerald-600":"bg-slate-100 text-slate-400"}`}>{done?<FiCheck size={9}/>:<FiX size={9}/>}</span><span className={done?"text-slate-400 line-through":"text-slate-600"}>{k}</span></div>))}</div>
            </div>

            {/* Resume */}
            <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><FiFileText size={14} className="text-orange-500"/>Resume</h3>
              {form.resume.fileName
                ?<div className="rounded-xl p-3 flex items-center gap-3 mb-3 bg-slate-50 border border-slate-200"><div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-50 border border-red-100"><FiFileText size={18} className="text-red-500"/></div><div className="flex-1 min-w-0"><p className="text-xs font-bold text-slate-700 truncate">{form.resume.fileName}</p><p className="text-xs text-slate-400">{form.resume.size}</p>{form.resume.updatedAt&&<p className="text-xs text-slate-300">{new Date(form.resume.updatedAt).toLocaleDateString()}</p>}</div></div>
                :<p className="text-xs text-slate-400 italic mb-3">No resume uploaded yet</p>}
              <div className="flex gap-2 flex-wrap">
                <button onClick={()=>resumeInputRef.current?.click()} disabled={uploadingResume}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-orange-500 bg-orange-50 border border-orange-200 hover:bg-orange-100 transition disabled:opacity-60 min-w-[60px]">
                  {uploadingResume?"…":"⬆ Upload"}
                </button>
                {form.resume.fileName&&(
                  <button onClick={viewResume}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-blue-500 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition min-w-[60px]">
                    👁 View PDF
                  </button>
                )}
                <Link to="/student/resume-builder" className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition text-center min-w-[60px]">
                  ✏️ Build
                </Link>
              </div>
            </div>

            <RecentUsersSection token={token} onFollowChange={action=>{setForm(p=>({...p,stats:{...p.stats,following:Math.max(0,p.stats.following+(action==="followed"?1:-1))}}));}}/>
            <FollowSuggestions token={token} onFollowChange={action=>{setForm(p=>({...p,stats:{...p.stats,following:Math.max(0,p.stats.following+(action==="followed"?1:-1))}}));}}/>

            {/* Social links */}
            {[form.personal.linkedin,form.personal.github,form.personal.twitter,form.personal.website,form.personal.instagram,form.personal.youtube].some(Boolean)&&(
              <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><FiLink size={14} className="text-cyan-500"/>Social Links</h3>
                <div className="space-y-2.5">
                  {[{u:form.personal.linkedin,icon:<FiLinkedin size={14}/>,l:"LinkedIn",c:"#3b82f6"},{u:form.personal.github,icon:<FiGithub size={14}/>,l:"GitHub",c:"#1e293b"},{u:form.personal.twitter,icon:<FiTwitter size={14}/>,l:"Twitter",c:"#06b6d4"},{u:form.personal.instagram,icon:<FiInstagram size={14}/>,l:"Instagram",c:"#ec4899"},{u:form.personal.youtube,icon:<FiYoutube size={14}/>,l:"YouTube",c:"#ef4444"},{u:form.personal.website,icon:<FiGlobe size={14}/>,l:"Website",c:"#a855f7"}].filter(s=>s.u).map(s=>(
                    <a key={s.l} href={s.u} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold hover:underline" style={{color:s.c}}>{s.icon}{s.l}</a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODALS ──────────────────────────────────────────────────────── */}
      <AboutModal open={modal==="about"} onClose={closeModal} value={form.personal.about} onSave={v=>{setPersonal("about",v);setDirty(true);}}/>
      <SkillsModal open={modal==="skills"} onClose={closeModal} skills={form.skills} onChange={skills=>{setForm(p=>({...p,skills}));setDirty(true);}}/>
      <ProjectsModal open={modal==="projects"} onClose={closeModal} projects={form.projects} onChange={projects=>{setForm(p=>({...p,projects}));setDirty(true);}}/>
      <AvatarModal open={modal==="avatar"} onClose={closeModal} currentUrl={form.personal.avatarUrl} onUpload={url=>{setPersonal("avatarUrl",url);setDirty(true);}} onUrlSelect={url=>{setPersonal("avatarUrl",url);setDirty(true);}}/>
      <CoverModal open={modal==="cover"} onClose={closeModal} onSelect={url=>{setPersonal("coverPhoto",url);setDirty(true);}}/>
      <EducationModal open={modal==="education"} onClose={closeModal} education={form.education} onChange={ed=>{setForm(p=>({...p,education:ed}));setDirty(true);}}/>
      <PreferredModal open={modal==="preferred"} onClose={closeModal} preferred={form.preferred} onChange={pref=>{setForm(p=>({...p,preferred:pref}));setDirty(true);}}/>

      {/* Personal Info Modal */}
      <Modal open={modal==="hero"} onClose={closeModal} title="Edit Personal Details" wide>
        <div className="grid grid-cols-2 gap-3">
          <Inp label="Full Name *" value={form.personal.fullName} onChange={e=>setPersonal("fullName",e.target.value)} placeholder="Full Name" className="col-span-2"/>
          <div className="col-span-2 flex flex-col gap-1.5"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Designation</label><select value={form.personal.designation} onChange={e=>setPersonal("designation",e.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white outline-none focus:border-blue-400">{DESIGNATION_OPTIONS.map(d=><option key={d}>{d}</option>)}</select></div>
          <Inp label="Phone" value={form.personal.phone} onChange={e=>setPersonal("phone",e.target.value)} placeholder="10-digit number"/>
          <Inp label="Email" value={form.personal.email} readOnly/>
          <Inp label="Date of Birth" type="date" value={form.personal.dob} onChange={e=>setPersonal("dob",e.target.value)}/>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gender</label><select value={form.personal.gender} onChange={e=>setPersonal("gender",e.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white outline-none focus:border-blue-400">{["Male","Female","Non-binary","Prefer not to say"].map(g=><option key={g}>{g}</option>)}</select></div>
          <ComboInput label="State" value={form.personal.state} onChange={v=>{setPersonal("state",v);setPersonal("city","");}} options={INDIAN_STATES} placeholder="Type or select state"/>
          <ComboInput label="City" value={form.personal.city} onChange={v=>setPersonal("city",v)} options={citySuggestions} placeholder="Type or select city"/>
          <Inp label="Street Address" value={form.personal.address} onChange={e=>setPersonal("address",e.target.value)} placeholder="House no, street…" className="col-span-2"/>
          <Inp label="LinkedIn URL" value={form.personal.linkedin} onChange={e=>setPersonal("linkedin",e.target.value)} placeholder="https://linkedin.com/in/…" className="col-span-2"/>
          <Inp label="GitHub" value={form.personal.github} onChange={e=>setPersonal("github",e.target.value)} placeholder="https://github.com/…"/>
          <Inp label="Portfolio" value={form.personal.portfolio} onChange={e=>setPersonal("portfolio",e.target.value)} placeholder="Portfolio URL"/>
          <Inp label="Twitter / X" value={form.personal.twitter} onChange={e=>setPersonal("twitter",e.target.value)} placeholder="https://twitter.com/…"/>
          <Inp label="Instagram" value={form.personal.instagram} onChange={e=>setPersonal("instagram",e.target.value)} placeholder="https://instagram.com/…"/>
          <Inp label="YouTube" value={form.personal.youtube} onChange={e=>setPersonal("youtube",e.target.value)} placeholder="Channel URL"/>
          <Inp label="Personal Website" value={form.personal.website} onChange={e=>setPersonal("website",e.target.value)} placeholder="https://yoursite.com"/>
        </div>
        <button onClick={()=>{closeModal();toast("Personal details updated! Don't forget to Save.","info");}} className="w-full py-2.5 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 shadow-sm">Done</button>
      </Modal>

      {/* Experience Modal */}
      <Modal open={modal==="experience"} onClose={closeModal} title="Edit Experience" wide>
        <label className="flex items-center gap-2.5 text-sm cursor-pointer p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
          <input type="checkbox" checked={form.fresher} onChange={()=>{setForm(p=>({...p,fresher:!p.fresher}));setDirty(true);}} className="accent-blue-500 w-4 h-4"/>
          <span className="font-bold">I'm a fresher</span><span className="text-xs text-slate-400 ml-auto">No prior work experience</span>
        </label>
        {!form.fresher&&(
          <div className="space-y-4">
            {form.experience.map(ex=>(
              <div key={ex.id} className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50">
                <div className="grid grid-cols-2 gap-3">
                  <Inp label="Company" value={ex.company} onChange={e=>{setForm(p=>({...p,experience:p.experience.map(x=>x.id===ex.id?{...x,company:e.target.value}:x)}));setDirty(true);}} placeholder="Company name"/>
                  <Inp label="Role / Title" value={ex.role} onChange={e=>{setForm(p=>({...p,experience:p.experience.map(x=>x.id===ex.id?{...x,role:e.target.value}:x)}));setDirty(true);}} placeholder="e.g. Software Engineer"/>
                  <Inp label="From" value={ex.from} onChange={e=>{setForm(p=>({...p,experience:p.experience.map(x=>x.id===ex.id?{...x,from:e.target.value}:x)}));setDirty(true);}} placeholder="Jan 2022"/>
                  <div className="space-y-1.5">
                    <Inp label="To" value={ex.to} disabled={ex.current} onChange={e=>{setForm(p=>({...p,experience:p.experience.map(x=>x.id===ex.id?{...x,to:e.target.value}:x)}));setDirty(true);}} placeholder={ex.current?"Present":"Dec 2023"}/>
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer"><input type="checkbox" checked={ex.current} onChange={e=>{setForm(p=>({...p,experience:p.experience.map(x=>x.id===ex.id?{...x,current:e.target.checked}:x)}));setDirty(true);}} className="accent-blue-500"/>Currently working here</label>
                  </div>
                  <Txta label="Description" value={ex.description} onChange={e=>{setForm(p=>({...p,experience:p.experience.map(x=>x.id===ex.id?{...x,description:e.target.value}:x)}));setDirty(true);}} className="col-span-2 h-20 w-full" placeholder="What did you work on?"/>
                </div>
                <button onClick={()=>{setForm(p=>({...p,experience:p.experience.filter(x=>x.id!==ex.id)}));setDirty(true);}} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"><FiTrash2 size={11}/>Remove</button>
              </div>
            ))}
            <button onClick={()=>{setForm(p=>({...p,experience:[...p.experience,{id:`ex_${Date.now()}`,company:"",role:"",from:"",to:"",current:false,description:""}]}));setDirty(true);}} className="w-full py-3 rounded-2xl border-2 border-dashed border-blue-200 text-sm text-blue-500 font-bold hover:bg-blue-50 transition">+ Add Experience</button>
          </div>
        )}
        <button onClick={closeModal} className="w-full py-2.5 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 shadow-sm">Done</button>
      </Modal>

      {/* Sticky Save Bar */}
      {dirty&&(
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm shadow-lg">
          <div className="max-w-[1128px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-amber-500 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"/>Unsaved changes</span>
            <div className="flex gap-2">
              <button onClick={handleDiscard} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition">Discard</button>
              <button onClick={save} disabled={saving} className="px-6 py-2 rounded-xl text-white text-sm font-bold bg-blue-500 hover:bg-blue-600 disabled:opacity-60 flex items-center gap-2 transition shadow-sm">
                <FiSave size={13}/>{saving?"Saving…":"Save Profile"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

