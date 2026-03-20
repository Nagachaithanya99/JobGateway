import {
  FiArrowRight,
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiGlobe,
  FiHeart,
  FiLayers,
  FiMapPin,
  FiSearch,
  FiShield,
  FiStar,
  FiTarget,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
  FiZap,
} from "react-icons/fi";

const stats = [
  { label: "Active Job Seekers", value: "50K+" },
  { label: "Trusted Companies", value: "5K+" },
  { label: "Jobs Posted", value: "20K+" },
  { label: "Successful Placements", value: "12K+" },
];

const values = [
  {
    icon: FiHeart,
    title: "Candidate First",
    desc: "We focus on making job search easier, faster, and more transparent for every candidate using the platform.",
  },
  {
    icon: FiShield,
    title: "Trusted Hiring",
    desc: "We help create a secure and reliable hiring environment through verified opportunities and professional tools.",
  },
  {
    icon: FiZap,
    title: "Faster Process",
    desc: "From job posting to hiring, our platform reduces delays and helps both sides move forward quickly.",
  },
  {
    icon: FiTarget,
    title: "Better Matches",
    desc: "We aim to connect the right talent with the right company through smart search, filters, and clean workflows.",
  },
];

const features = [
  {
    icon: FiSearch,
    title: "Smart Job Search",
    desc: "Search jobs by role, location, salary, experience level, and company type with a smooth and professional experience.",
  },
  {
    icon: FiBriefcase,
    title: "Easy Job Posting",
    desc: "Employers can create and manage job listings efficiently, helping them attract quality candidates faster.",
  },
  {
    icon: FiUserCheck,
    title: "Application Tracking",
    desc: "Candidates can apply with confidence while recruiters track applications in a more organized way.",
  },
  {
    icon: FiBarChart2,
    title: "Hiring Insights",
    desc: "Get useful analytics and insights to understand job performance, candidate engagement, and recruitment growth.",
  },
  {
    icon: FiClock,
    title: "Time Saving Workflow",
    desc: "Automated and simplified processes help reduce manual work for both employers and job seekers.",
  },
  {
    icon: FiGlobe,
    title: "Accessible Everywhere",
    desc: "Our responsive platform works smoothly across desktop, tablet, and mobile devices for a modern hiring experience.",
  },
];

const steps = [
  {
    number: "01",
    title: "Build Your Profile",
    desc: "Create your professional profile, add your resume, showcase skills, and make yourself visible to employers.",
  },
  {
    number: "02",
    title: "Discover Opportunities",
    desc: "Explore jobs from trusted companies and use smart filters to find opportunities that match your goals.",
  },
  {
    number: "03",
    title: "Apply With Confidence",
    desc: "Submit applications easily and stay updated throughout the recruitment process.",
  },
  {
    number: "04",
    title: "Connect And Grow",
    desc: "Get shortlisted, attend interviews, and move one step closer to the right career opportunity.",
  },
];

const highlights = [
  "Clean and professional job portal design",
  "Designed for both candidates and recruiters",
  "Responsive layout for all screen sizes",
  "Modern blue and orange branded theme",
  "Scalable structure for future features",
  "Built for trust, speed, and usability",
];

export default function AboutPage() {
  return (
    <div className="w-full overflow-x-hidden bg-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="relative flex min-h-screen w-full items-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.18),_transparent_30%),linear-gradient(135deg,#031525_0%,#071d35_45%,#0b2447_100%)] text-white">
        <div className="absolute inset-0">
          <div className="absolute left-[-100px] top-[-80px] h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute bottom-[-80px] right-[10%] h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute left-[35%] top-[45%] h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />
        </div>

        <div className="relative w-full px-4 py-20 sm:px-6 md:px-10 lg:px-16 xl:px-20">
          <div className="mx-auto grid min-h-[80vh] max-w-[1600px] items-center gap-14 lg:grid-cols-2">
            {/* Left */}
            <div className="w-full">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-sky-100 backdrop-blur-md sm:text-sm">
                <FiGlobe className="text-sky-300" />
                Empowering careers. Connecting talent.
              </span>

              <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                About Our{" "}
                <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-orange-300 bg-clip-text text-transparent">
                  Job Portal
                </span>
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">
                We are building a modern hiring platform that connects job seekers
                with trusted employers through a simple, fast, and professional
                experience. Our goal is to make job searching easier, hiring
                smarter, and career growth more accessible for everyone.
              </p>

              <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-300 sm:text-base">
                Inspired by top professional hiring platforms, our portal is built
                to support students, freshers, experienced professionals,
                recruiters, and companies with a seamless experience that feels
                modern, reliable, and growth-focused.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="/jobs"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition duration-300 hover:scale-[1.03]"
                >
                  Explore Jobs
                  <FiArrowRight />
                </a>

                <a
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-orange-300/30 bg-orange-500/10 px-6 py-3 font-semibold text-orange-100 backdrop-blur-md transition duration-300 hover:bg-orange-500/20"
                >
                  Contact Us
                </a>
              </div>
            </div>

            {/* Right */}
            <div className="w-full">
              <div className="grid gap-4 sm:grid-cols-2">
                {stats.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/15"
                  >
                    <h3 className="text-3xl font-bold text-white sm:text-4xl">
                      {item.value}
                    </h3>
                    <p className="mt-2 text-sm text-slate-300 sm:text-base">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-md sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">
                  Why We Exist
                </p>
                <h3 className="mt-4 text-2xl font-bold leading-tight text-white sm:text-3xl">
                  To make hiring more accessible, reliable, and efficient for everyone.
                </h3>
                <p className="mt-4 text-sm leading-8 text-slate-300 sm:text-base">
                  We believe the right opportunity can change a life, and the right
                  candidate can transform a business. Our platform is built to
                  support both sides with trust, speed, and a modern digital
                  experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="w-full px-4 py-16 sm:px-6 md:px-10 lg:px-16 xl:px-20">
        <div className="mx-auto grid max-w-[1600px] gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-600">
              Who We Are
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl xl:text-5xl">
              A professional hiring platform for modern careers and smart recruitment
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              Our job portal is designed to close the gap between talent and
              opportunity. Whether someone is searching for a first job, looking
              for a better career move, or hiring the right employee for a
              growing company, our platform is built to simplify the journey.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
              We focus on professional design, better usability, trusted
              opportunities, fast workflows, and scalable hiring solutions that
              help both job seekers and employers succeed in one place.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900">Why Choose Us</h3>
            <div className="mt-6 space-y-4">
              {highlights.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="mt-1 rounded-full bg-orange-100 p-1.5 text-orange-600">
                    <FiCheckCircle size={16} />
                  </span>
                  <p className="text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission / Vision / Story */}
      <section className="w-full bg-gradient-to-b from-white to-sky-50/50 px-4 py-16 sm:px-6 md:px-10 lg:px-16 xl:px-20">
        <div className="mx-auto grid max-w-[1600px] gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-4 inline-flex rounded-2xl bg-sky-100 p-3 text-sky-700">
              <FiTarget size={24} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Our Mission</h3>
            <p className="mt-4 leading-8 text-slate-600">
              To create a trusted digital hiring platform where candidates can
              discover better opportunities and employers can connect with the
              right talent quickly and efficiently.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-4 inline-flex rounded-2xl bg-orange-100 p-3 text-orange-600">
              <FiStar size={24} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Our Vision</h3>
            <p className="mt-4 leading-8 text-slate-600">
              To become a leading job marketplace that powers professional
              growth, improves recruitment quality, and makes hiring more
              human, accessible, and transparent.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-4 inline-flex rounded-2xl bg-slate-100 p-3 text-slate-700">
              <FiLayers size={24} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Our Story</h3>
            <p className="mt-4 leading-8 text-slate-600">
              We believe the right opportunity can change a life and the right
              employee can transform a business. That belief is the foundation
              of everything we are building on this platform.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="w-full px-4 py-16 sm:px-6 md:px-10 lg:px-16 xl:px-20">
        <div className="mx-auto max-w-[1600px]">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-500">
              Our Core Values
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl xl:text-5xl">
              Principles that guide our platform
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              We are building more than a job board. We are building a trusted
              hiring ecosystem designed to support candidates, employers, and
              long-term professional growth.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {values.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="inline-flex rounded-2xl bg-gradient-to-br from-sky-100 to-orange-100 p-3 text-sky-700 transition group-hover:scale-105">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      {/* <section className="w-full bg-slate-950 px-4 py-16 text-white sm:px-6 md:px-10 lg:px-16 xl:px-20">
        <div className="mx-auto max-w-[1600px]">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">
              What We Offer
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl xl:text-5xl">
              Powerful tools for job seekers and employers
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              Our job portal helps users move from searching to hiring with less
              friction, better visibility, and a more professional digital experience.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-lg backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-orange-400/30"
                >
                  <div className="inline-flex rounded-2xl bg-gradient-to-br from-sky-500/20 to-orange-500/20 p-3 text-sky-300">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-5 text-2xl font-bold">{item.title}</h3>
                  <p className="mt-3 leading-8 text-slate-300">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section> */}

      {/* How it works */}
      <section className="w-full px-4 py-16 sm:px-6 md:px-10 lg:px-16 xl:px-20">
        <div className="mx-auto grid max-w-[1600px] items-start gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-600">
              How It Works
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl xl:text-5xl">
              A simple process from search to success
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              We keep the recruitment journey simple and effective. Candidates can
              discover jobs quickly, while employers can manage hiring in a more
              organized and efficient way.
            </p>
          </div>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-orange-500 text-lg font-bold text-white">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 leading-7 text-slate-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Impact */}
      <section className="w-full bg-gradient-to-r from-sky-50 via-white to-orange-50 px-4 py-16 sm:px-6 md:px-10 lg:px-16 xl:px-20">
        <div className="mx-auto max-w-[1600px]">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-500">
              Platform Impact
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl xl:text-5xl">
              Built to create real career opportunities
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              We want our platform to do more than just list jobs. We want it to
              support meaningful hiring outcomes, simplify decision-making, and
              help users move forward with confidence.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-4 inline-flex rounded-2xl bg-sky-100 p-3 text-sky-700">
                <FiTrendingUp size={22} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Career Growth</h3>
              <p className="mt-3 leading-7 text-slate-600">
                We help candidates move toward better opportunities with a more
                modern and accessible job search experience.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-4 inline-flex rounded-2xl bg-orange-100 p-3 text-orange-600">
                <FiUsers size={22} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Talent Connection</h3>
              <p className="mt-3 leading-7 text-slate-600">
                Employers can connect with skilled candidates faster through clean,
                focused, and organized recruitment tools.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-4 inline-flex rounded-2xl bg-slate-100 p-3 text-slate-700">
                <FiMapPin size={22} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Wider Reach</h3>
              <p className="mt-3 leading-7 text-slate-600">
                A strong digital platform helps opportunities reach more people
                across regions, industries, and experience levels.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full px-4 pb-20 pt-16 sm:px-6 md:px-10 lg:px-16 xl:px-20">
        <div className="mx-auto max-w-[1600px] overflow-hidden rounded-[32px] bg-gradient-to-r from-sky-600 via-blue-700 to-orange-500 p-8 text-white shadow-2xl md:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/80">
                Join Our Platform
              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Start your hiring and career journey with us
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-white/90 sm:text-lg">
                Whether you are searching for your next role or looking for the
                right talent for your company, our platform is designed to make
                the process faster, easier, and more professional.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 lg:justify-end">
              <a
                href="/jobs"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-sky-700 transition hover:bg-slate-100"
              >
                Browse Jobs
                <FiArrowRight />
              </a>
              <a
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20"
              >
                Create Account
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}