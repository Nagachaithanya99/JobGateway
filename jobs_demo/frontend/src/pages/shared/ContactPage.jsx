import { useEffect, useState } from "react";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import { getPublicContent } from "../../services/contentService.js";
import { toAbsoluteMediaUrl } from "../../utils/media.js";

export default function ContactPage({ embedded = false }) {
  const wrapCls = embedded ? "" : "bg-slate-50 min-h-screen";
  const innerCls = embedded ? "max-w-6xl mx-auto px-4 py-10" : "max-w-6xl mx-auto px-4 py-12";

  const [form, setForm] = useState({ name: "", email: "", message: "" });
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

  const submit = (e) => {
    e.preventDefault();
    // next step: connect backend/email service
    alert("Message submitted (connect backend in next step).");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className={wrapCls}>
      <div className={innerCls}>
        {content.publicPages
          .filter((x) => (x.pageSlug || "").toLowerCase() === "contact")
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
            <img src={toAbsoluteMediaUrl(content.banners[0].imageUrl)} alt="Contact banner" className="h-[220px] w-full object-cover" />
          </div>
        ) : null}

        {content.announcements.length ? (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#2563EB]">Platform Announcements</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {content.announcements.slice(0, 3).map((a) => (
                <a
                  key={a.id}
                  href={a.linkUrl || "#"}
                  target={a.linkUrl ? "_blank" : undefined}
                  rel={a.linkUrl ? "noreferrer" : undefined}
                  className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {a.title || a.description}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">
            Contact
          </h1>
          <p className="text-slate-600 mt-3 text-base md:text-lg">
            We’d love to hear from you
          </p>
        </div>

        <div className="mt-10 grid lg:grid-cols-3 gap-5">
          {/* Info */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900">Get in touch</h3>

            <div className="flex items-start gap-3 text-sm text-slate-700">
              <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-200 grid place-items-center">
                <FiMail className="text-orange-600" />
              </div>
              <div>
                <p className="font-bold">Email</p>
                <p className="text-slate-600">support@jobportal.com</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm text-slate-700">
              <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-200 grid place-items-center">
                <FiPhone className="text-orange-600" />
              </div>
              <div>
                <p className="font-bold">Phone</p>
                <p className="text-slate-600">+91 90000 00000</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm text-slate-700">
              <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-200 grid place-items-center">
                <FiMapPin className="text-orange-600" />
              </div>
              <div>
                <p className="font-bold">Address</p>
                <p className="text-slate-600">India</p>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Contact details can be edited from Admin Settings in next step.
            </p>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-900">Send a message</h3>

            <form onSubmit={submit} className="mt-5 grid md:grid-cols-2 gap-4">
              <div className="md:col-span-1">
                <label className="text-sm font-semibold text-slate-700">Name</label>
                <input
                  className="mt-1 w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="md:col-span-1">
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  className="mt-1 w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@gmail.com"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Message</label>
                <textarea
                  className="mt-1 w-full min-h-[140px] p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Write your message..."
                  required
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-orange-600 text-white font-extrabold hover:bg-orange-700 transition"
                >
                  Submit
                </button>
              </div>
            </form>

            <p className="text-xs text-slate-500 mt-3">
              Backend email sending will be connected in next step.
            </p>
          </div>
        </div>

        {!embedded && (
          <p className="text-center text-xs text-slate-500 mt-10">
            Public Contact page (Student layout uses the same component).
          </p>
        )}
      </div>
    </div>
  );
}
