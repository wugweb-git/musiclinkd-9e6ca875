import { useState } from "react";
import { Btn, Chip, Sheet } from "./ui";

const groups: { label: string; options: string[] }[] = [
  {
    label: "Role",
    options: ["Singer", "Session Musician", "DJ", "Composer", "Engineer", "Producer"],
  },
  { label: "Language", options: ["Hindi", "Tamil", "Punjabi", "Marathi", "Telugu", "English"] },
  { label: "Genre", options: ["Hindi Film", "Indie", "Hip-Hop", "Carnatic", "Sufi", "Electronic"] },
  {
    label: "City / area",
    options: ["Mumbai", "Delhi NCR", "Bengaluru", "Chennai", "Kolkata", "Goa"],
  },
  { label: "Availability", options: ["Available now", "Within 2 weeks", "Selective"] },
  { label: "Experience level", options: ["Emerging", "Established", "Industry veteran"] },
];

const sorts = ["Most relevant", "Most active", "Nearest", "Most followed"];

export function FilterSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState<string[]>(["Singer", "Hindi", "Mumbai"]);
  const [sort, setSort] = useState("Most relevant");
  const [verified, setVerified] = useState(true);
  const [remote, setRemote] = useState(false);
  const [session, setSession] = useState(true);

  const toggle = (v: string) =>
    setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl">Refine search</h2>
        <button onClick={() => setSelected([])} className="text-xs font-semibold text-foreground">
          Clear all
        </button>
      </div>

      {groups.map((g) => (
        <div key={g.label} className="mb-5">
          <h3 className="mb-2 text-1 font-bold uppercase tracking-wide text-muted-foreground">
            {g.label}
          </h3>
          <div className="flex flex-wrap gap-2">
            {g.options.map((o) => (
              <Chip key={o} active={selected.includes(o)} onClick={() => toggle(o)}>
                {o}
              </Chip>
            ))}
          </div>
        </div>
      ))}

      <div className="mb-5 divide-y divide-border rounded-lg border border-border">
        <Toggle label="Verified professionals only" value={verified} onChange={setVerified} />
        <Toggle label="Remote / online available" value={remote} onChange={setRemote} />
        <Toggle label="Session musician available" value={session} onChange={setSession} />
      </div>

      <h3 className="mb-2 text-1 font-bold uppercase tracking-wide text-muted-foreground">
        Sort by
      </h3>
      <div className="mb-6 flex flex-wrap gap-2">
        {sorts.map((s) => (
          <Chip key={s} active={sort === s} onClick={() => setSort(s)}>
            {s}
          </Chip>
        ))}
      </div>

      <Btn className="w-full" onClick={onClose}>
        Apply filters · 248 results
      </Btn>
    </Sheet>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between px-4 py-4 text-left"
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className={`relative h-7 w-12 rounded-full transition-colors ${value ? "bg-primary" : "bg-border"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-card transition-all ${value ? "left-6" : "left-1"}`}
        />
      </span>
    </button>
  );
}
