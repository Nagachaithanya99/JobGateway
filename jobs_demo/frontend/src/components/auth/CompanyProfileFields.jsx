const inputClassName =
  "w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10";

function Field({ label, required, children }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-slate-600">
        {label}
        {required ? <span className="ml-1 text-[#f97316]">*</span> : null}
      </div>
      {children}
    </label>
  );
}

export default function CompanyProfileFields({ values, onChange, required = false }) {
  return (
    <div className="space-y-4">
      <Field label="Company Name" required={required}>
        <input
          className={inputClassName}
          type="text"
          name="companyName"
          placeholder="Your company name"
          value={values.companyName}
          onChange={onChange}
        />
      </Field>

      <Field label="Industry" required={required}>
        <input
          className={inputClassName}
          type="text"
          name="industry"
          placeholder="Technology, Finance, Healthcare..."
          value={values.industry}
          onChange={onChange}
        />
      </Field>

      <Field label="Phone" required={required}>
        <input
          className={inputClassName}
          type="tel"
          name="phone"
          placeholder="Company or HR contact number"
          value={values.phone}
          onChange={onChange}
        />
      </Field>

      <Field label="Location" required={required}>
        <input
          className={inputClassName}
          type="text"
          name="location"
          placeholder="City, State"
          value={values.location}
          onChange={onChange}
        />
      </Field>

      <Field label="Website">
        <input
          className={inputClassName}
          type="url"
          name="website"
          placeholder="https://yourcompany.com"
          value={values.website}
          onChange={onChange}
        />
      </Field>

      <Field label="About Company">
        <textarea
          className={`${inputClassName} min-h-32 resize-y`}
          name="about"
          placeholder="A short intro about your company"
          value={values.about}
          onChange={onChange}
        />
      </Field>
    </div>
  );
}
