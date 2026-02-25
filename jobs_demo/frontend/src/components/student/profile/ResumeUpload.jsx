import { useRef, useState } from "react";
import Button from "../../common/Button.jsx";

export default function ResumeUpload({ value, onChange }) {
  const ref = useRef(null);
  const [fileName, setFileName] = useState("");

  const pick = () => ref.current?.click();

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);

    // TEMP: store local fake url
    // next step: call uploadResume(file) and save returned URL
    onChange(`local://${f.name}`);
  };

  return (
    <div className="space-y-3">
      <h3 className="font-extrabold">Resume Upload</h3>

      <input ref={ref} type="file" accept=".pdf" className="hidden" onChange={onFile} />

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">Upload PDF resume</p>
          <p className="text-xs text-slate-500">{fileName || value || "No resume uploaded yet."}</p>
        </div>

        <Button onClick={pick}>Upload Resume</Button>
      </div>
    </div>
  );
}
