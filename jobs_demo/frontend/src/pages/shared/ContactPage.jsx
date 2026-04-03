import { useEffect, useState } from "react";
import {
  FiArrowRight,
  FiClock,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiPhone,
  FiSend,
  FiUser,
} from "react-icons/fi";
import { getPublicContent } from "../../services/contentService.js";
import { showSweetToast } from "../../utils/sweetAlert.js";

export default function ContactPage({ embedded = false }) {
  const wrapCls = embedded
    ? "w-full overflow-x-hidden bg-transparent"
    : "w-full min-h-screen overflow-x-hidden bg-slate-50";

  const innerCls = "w-full";

  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [content, setContent] = useState({
    publicPages: [],
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await getPublicContent();
        if (!mounted) return;

        setContent({
          publicPages: Array.isArray(res?.publicPages) ? res.publicPages : [],
        });
      } catch {
        if (!mounted) return;

        setContent({
          publicPages: [],
        });
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const submit = (e) => {
    e.preventDefault();
    void showSweetToast("Message submitted (connect backend in next step).", "success");
    setForm({ name: "", email: "", message: "" });
  };

  const contactBlocks = content.publicPages
    .filter((x) => (x.pageSlug || "").toLowerCase() === "contact")
    .slice(0, 2);

  return (
    <div className={wrapCls}>
      <div className={innerCls}>
        {/* Hero Section */}
        <section className="relative flex min-h-[70vh] w-full items-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.18),_transparent_30%),linear-gradient(135deg,#031525_0%,#071d35_45%,#0b2447_100%)] text-white">
          <div className="absolute inset-0">
            <div className="absolute left-[-100px] top-[-80px] h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
            <div className="absolute bottom-[-80px] right-[10%] h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="absolute left-[35%] top-[45%] h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />
          </div>

          <div className="relative w-full px-4 py-16 sm:px-6 md:px-10 lg:px-16 xl:px-20">
            <div className="mx-auto grid max-w-[1600px] items-center gap-10 lg:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-sky-100 backdrop-blur-md sm:text-sm">
                  <FiMessageCircle className="text-sky-300" />
                  Let’s connect with our team
                </span>

                <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                  Contact{" "}
                  <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-orange-300 bg-clip-text text-transparent">
                    Us
                  </span>
                </h1>

                <p className="mt-6 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">
                  We’d love to hear from you. Whether you are a job seeker,
                  recruiter, or employer, our team is here to support you with
                  the right guidance and help.
                </p>

                <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-300 sm:text-base">
                  Reach out for account help, hiring assistance, job-related
                  questions, partnerships, or general support. We are committed
                  to making your experience smooth and professional.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href="#contact-form"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition duration-300 hover:scale-[1.03]"
                  >
                    Send Message
                    <FiArrowRight />
                  </a>

                  <a
                    href="mailto:support@jobportal.com"
                    className="inline-flex items-center gap-2 rounded-xl border border-orange-300/30 bg-orange-500/10 px-6 py-3 font-semibold text-orange-100 backdrop-blur-md transition duration-300 hover:bg-orange-500/20"
                  >
                    Email Support
                  </a>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-md">
                  <div className="mb-4 inline-flex rounded-2xl bg-sky-500/20 p-3 text-sky-300">
                    <FiMail size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Email Us</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    support@jobportal.com
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-md">
                  <div className="mb-4 inline-flex rounded-2xl bg-orange-500/20 p-3 text-orange-300">
                    <FiPhone size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Call Us</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    +91 90000 00000
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-md">
                  <div className="mb-4 inline-flex rounded-2xl bg-sky-500/20 p-3 text-sky-300">
                    <FiMapPin size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Address</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    India
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-md">
                  <div className="mb-4 inline-flex rounded-2xl bg-orange-500/20 p-3 text-orange-300">
                    <FiClock size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Working Hours</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    Mon - Sat : 9:00 AM - 6:00 PM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Public page blocks */}
        {contactBlocks.length > 0 && (
          <section className="w-full px-4 py-10 sm:px-6 md:px-10 lg:px-16 xl:px-20">
            <div className="mx-auto max-w-[1600px] grid gap-6 lg:grid-cols-2">
              {contactBlocks.map((block) => (
                <div
                  key={block.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-2xl font-extrabold text-slate-900">
                    {block.title}
                  </h3>
                  {block.subtitle ? (
                    <p className="mt-2 text-sm font-semibold text-sky-600">
                      {block.subtitle}
                    </p>
                  ) : null}
                  {block.description ? (
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {block.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main Contact Section */}
        <section
          id="contact-form"
          className="w-full px-4 py-10 sm:px-6 md:px-10 lg:px-16 xl:px-20"
        >
          <div className="mx-auto grid max-w-[1600px] gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            {/* Left info */}
            <div className="space-y-6">
              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-600">
                  Get In Touch
                </p>
                <h2 className="mt-3 text-3xl font-bold text-slate-900">
                  We are here to help
                </h2>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  Connect with us for job support, hiring inquiries, account
                  questions, or any general platform assistance.
                </p>

                <div className="mt-8 space-y-5">
                  <div className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl border border-orange-200 bg-orange-50">
                      <FiMail className="text-orange-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Email</p>
                      <p className="mt-1 text-sm text-slate-600">
                        support@jobportal.com
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl border border-orange-200 bg-orange-50">
                      <FiPhone className="text-orange-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Phone</p>
                      <p className="mt-1 text-sm text-slate-600">
                        +91 90000 00000
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl border border-orange-200 bg-orange-50">
                      <FiMapPin className="text-orange-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Address</p>
                      <p className="mt-1 text-sm text-slate-600">India</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl border border-sky-200 bg-sky-50">
                      <FiClock className="text-sky-700" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Availability</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Monday to Saturday
                      </p>
                      <p className="text-sm text-slate-500">
                        9:00 AM to 6:00 PM
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-xs text-slate-500">
                  Contact details can be edited from Admin Settings in next step.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-500">
                Send Us A Message
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
                We’d love to hear from you
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                Fill out the form below and our team will get back to you as soon
                as possible.
              </p>

              <form onSubmit={submit} className="mt-8 grid gap-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Name
                    </label>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-sky-400 focus-within:bg-white">
                      <FiUser className="text-sky-600" />
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        placeholder="Your name"
                        required
                        className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email
                    </label>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-sky-400 focus-within:bg-white">
                      <FiMail className="text-sky-600" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        placeholder="you@gmail.com"
                        required
                        className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Message
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    placeholder="Write your message..."
                    required
                    rows="7"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white placeholder:text-slate-400"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-xs text-slate-500">
                    Backend email sending will be connected in next step.
                  </p>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-orange-500 px-7 py-3.5 font-bold text-white shadow-lg transition duration-300 hover:scale-[1.02]"
                  >
                    Submit Message
                    <FiSend />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Extra support section */}
        <section className="w-full bg-slate-950 px-4 py-16 text-white sm:px-6 md:px-10 lg:px-16 xl:px-20">
          <div className="mx-auto max-w-[1600px]">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">
                Support Information
              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl xl:text-5xl">
                How can we help you?
              </h2>
              <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                Our support team is ready to assist candidates, recruiters, and
                employers with platform access, hiring questions, account issues,
                and general inquiries.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
                <h3 className="text-xl font-bold">For Job Seekers</h3>
                <p className="mt-3 leading-8 text-slate-300">
                  Get support for account creation, application issues, profile
                  updates, and finding the right opportunities.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
                <h3 className="text-xl font-bold">For Employers</h3>
                <p className="mt-3 leading-8 text-slate-300">
                  Contact us for job posting support, employer dashboard help,
                  recruitment assistance, and candidate management queries.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
                <h3 className="text-xl font-bold">General Support</h3>
                <p className="mt-3 leading-8 text-slate-300">
                  Reach out for partnerships, feedback, technical issues, or any
                  questions related to our platform and services.
                </p>
              </div>
            </div>
          </div>
        </section>

        {!embedded && (
          <section className="w-full px-4 py-8 text-center sm:px-6 md:px-10 lg:px-16 xl:px-20">
            <p className="text-xs text-slate-500">
              Public Contact page (Student layout uses the same component).
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
