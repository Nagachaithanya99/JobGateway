import Card from "../../common/Card.jsx";
import Badge from "../../common/Badge.jsx";

export default function ProfileCompletion({ value }) {
  const tone = value >= 100 ? "green" : value >= 60 ? "orange" : "red";

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-extrabold text-lg">Profile Completion</p>
          <p className="text-sm text-slate-600">
            You must reach <b>100%</b> to get shortlisted.
          </p>
        </div>
        <Badge tone={tone}>{value}%</Badge>
      </div>

      <div className="mt-4 h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>

      <div className="mt-2 text-xs text-slate-500">
        Next step: enforce “Apply disabled until 100%” + backend validation.
      </div>
    </Card>
  );
}
