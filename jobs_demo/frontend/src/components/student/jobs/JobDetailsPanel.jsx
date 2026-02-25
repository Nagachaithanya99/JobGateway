import Card from "../../common/Card.jsx";

export default function JobDetailsPanel({ job }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card className="p-5 md:col-span-2">
        <h3 className="font-extrabold">Job Description</h3>
        <p className="text-slate-700 mt-2 leading-relaxed">{job.description}</p>

        <div className="mt-5 space-y-2 text-sm text-slate-700">
          <p><b>Category:</b> {job.category}</p>
          <p><b>Subcategory:</b> {job.subcategory}</p>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-extrabold">Summary</h3>
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          <p><b>Location:</b> {job.location}</p>
          <p><b>Salary:</b> {job.salary}</p>
          <p><b>Experience:</b> {job.exp}</p>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Shortlisting rule (profile 100%) will be enforced in next step.
        </p>
      </Card>
    </div>
  );
}
