import { useEffect, useState } from "react";
import { FiTarget, FiUsers, FiBriefcase, FiTrendingUp, FiAward } from "react-icons/fi";
import { getPublicContent } from "../../services/contentService.js";
import { toAbsoluteMediaUrl } from "../../utils/media.js";

const stats = [
  { label: "Active Students", value: "50,000+", icon: FiUsers },
  { label: "Companies", value: "5,000+", icon: FiBriefcase },
  { label: "Jobs Posted", value: "10,000+", icon: FiTrendingUp },
  { label: "Success Rate", value: "95%", icon: FiAward },
];

const values = [
  {
    title: "Student First",
    desc:
      "We prioritize student success and provide personalized support at every step of their career journey.",
  },
  {
    title: "Quality Opportunities",
    desc:
      "We partner with reputable companies to ensure students access genuine and rewarding career opportunities.",
  },
  {
    title: "Continuous Growth",
    desc:
      "We provide resources for skill development and career advancement beyond just job placement.",
  },
];

export default function AboutPage({ embedded = false }) {
  // embedded = true => when used inside StudentLayout (already has container)
  const wrapCls = embedded ? "" : "bg-slate-50 min-h-screen";
  const innerCls = embedded ? "max-w-6xl mx-auto px-4 py-10" : "max-w-6xl mx-auto px-4 py-12";
  const [content, setContent] = useState({ banners: [], announcements: [], publicPages: [], blogs: [] });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getPublicContent();
        if (!mounted) return;
        setContent({
          banners: Array.isArray(res?.banners) ? res.banners : [],
          announcements: Array.isArray(res?.announcements) ? res.announcements : [],
          publicPages: Array.isArray(res?.publicPages) ? res.publicPages : [],
          blogs: Array.isArray(res?.blogs) ? res.blogs : [],
        });
      } catch {
        if (!mounted) return;
        setContent({ banners: [], announcements: [], publicPages: [], blogs: [] });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className={wrapCls}>
      <div className={innerCls}>
        {content.publicPages
          .filter((x) => (x.pageSlug || "").toLowerCase() === "about")
          .slice(0, 2)
          .map((block) => (
            <div key={block.id} className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xl font-extrabold text-slate-900">{block.title}</h3>
              {block.subtitle ? <p className="mt-1 text-sm font-semibold text-slate-600">{block.subtitle}</p> : null}
              {block.description ? <p className="mt-3 text-sm text-slate-700">{block.description}</p> : null}
            </div>
          ))}

        {content.banners[0]?.imageUrl ? (
          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <img src={toAbsoluteMediaUrl(content.banners[0].imageUrl)} alt="About banner" className="h-[220px] w-full object-cover" />
          </div>
        ) : null}

        {content.announcements.length ? (
          <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#F97316]">Platform Announcements</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {content.announcements.slice(0, 3).map((a) => (
                <a
                  key={a.id}
                  href={a.linkUrl || "#"}
                  target={a.linkUrl ? "_blank" : undefined}
                  rel={a.linkUrl ? "noreferrer" : undefined}
                  className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {a.title || a.description}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">
            About Us
          </h1>
          <p className="text-slate-600 mt-3 text-base md:text-lg">
            Connecting talented students with their dream careers
          </p>
        </div>

        {/* Mission */}
        <div className="mt-10 bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-10 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-orange-50 border border-orange-200 grid place-items-center">
            <FiTarget className="text-orange-600 text-2xl" />
          </div>

          <h2 className="mt-5 text-2xl md:text-3xl font-extrabold text-slate-900">
            Our Mission
          </h2>

          <p className="mt-4 max-w-3xl mx-auto text-slate-600 leading-relaxed">
            To empower students and fresh graduates with the tools, resources, and opportunities
            they need to launch successful careers. We bridge the gap between education and
            employment.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center"
              >
                <div className="mx-auto h-12 w-12 rounded-xl bg-orange-50 border border-orange-200 grid place-items-center">
                  <Icon className="text-orange-600 text-xl" />
                </div>
                <div className="mt-4 text-2xl font-extrabold text-slate-900">
                  {s.value}
                </div>
                <div className="mt-1 text-sm text-slate-600">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Values */}
        <div className="mt-12">
          <h2 className="text-center text-2xl md:text-3xl font-extrabold text-slate-900">
            Our Values
          </h2>

          <div className="mt-8 grid md:grid-cols-3 gap-5">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
              >
                <h3 className="font-extrabold text-slate-900">{v.title}</h3>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {content.blogs.length ? (
          <div className="mt-12">
            <h2 className="text-center text-2xl md:text-3xl font-extrabold text-slate-900">Latest Blogs</h2>
            <div className="mt-8 grid md:grid-cols-3 gap-5">
              {content.blogs.slice(0, 3).map((b) => (
                <article key={b.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {b.imageUrl ? <img src={toAbsoluteMediaUrl(b.imageUrl)} alt={b.title} className="h-36 w-full object-cover" /> : null}
                  <div className="p-4">
                    <h3 className="font-extrabold text-slate-900">{b.title}</h3>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-3">{b.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {!embedded && (
          <p className="text-center text-xs text-slate-500 mt-10">
            Public About page (Student layout uses the same component).
          </p>
        )}
      </div>
    </div>
  );
}
