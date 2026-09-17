import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Screen, TopBar, Btn, Chip } from "@/components/ml/ui";
import { SegmentedField } from "@/components/ml/kit";
import { createCollab, listProjectTypes } from "@/lib/collabs.functions";
import { useAuth } from "@/hooks/use-auth";

/*
 * Starting a project: its name, what it is, and who can see it. Everything else — dates, money,
 * who does what — the people in it settle between themselves.
 */
export const Route = createFileRoute("/collab/new/")({
  head: () => ({
    meta: [
      { title: "Start a project | MusicLinkd" },
      {
        name: "description",
        content: "Name the project, say what it is, and invite the people making it with you.",
      },
      { property: "og:title", content: "Start a project | MusicLinkd" },
      { property: "og:description", content: "Start a project on MusicLinkd." },
    ],
  }),
  component: NewCollab,
});

function NewCollab() {
  const navigate = useNavigate();
  const { signedIn } = useAuth();
  const create = useServerFn(createCollab);
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [city, setCity] = useState("");
  const [who, setWho] = useState<"Only the people in it" | "Anyone on MusicLinkd">(
    "Only the people in it",
  );
  const [kind, setKind] = useState("");

  // What kind of project it is comes from the taxonomy, not from a list written here.
  const readTypes = useServerFn(listProjectTypes);
  const types = useQuery({ queryKey: ["project-types"], queryFn: () => readTypes() });

  const start = useMutation({
    mutationFn: () =>
      create({
        data: {
          name: name.trim(),
          ...(about.trim() ? { bio: about.trim() } : {}),
          ...(city.trim() ? { city: city.trim() } : {}),
          visibility: who === "Anyone on MusicLinkd" ? "public" : "private",
          ...(kind ? { projectType: kind } : {}),
        },
      }),
    onSuccess: ({ id }) => void navigate({ to: "/collab/$id", params: { id } }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't save. Try again."),
  });

  return (
    <Screen>
      <TopBar title="Start a project" subtitle="A room for one piece of work" back="/collab" />
      <form
        className="space-y-5 px-5 pt-4 pb-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim().length >= 2 && !start.isPending) start.mutate();
        }}
      >
        <div>
          <label htmlFor="collab-name" className="block text-1 font-semibold">
            What are you calling it
          </label>
          <input
            id="collab-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Monsoon EP"
            maxLength={80}
            className="mt-1.5 min-h-control w-full rounded-lg border border-border bg-card px-4 text-sm outline-none"
          />
        </div>

        <div>
          <p className="text-1 font-semibold">
            What kind <span className="font-normal text-muted-foreground">· optional</span>
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {(types.data ?? []).map((t) => (
              <Chip
                key={t.slug}
                active={kind === t.slug}
                onClick={() => setKind(kind === t.slug ? "" : t.slug)}
              >
                {t.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="collab-about" className="block text-1 font-semibold">
            What it is
          </label>
          <textarea
            id="collab-about"
            rows={3}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Four tracks, live drums, tracking in Bengaluru over the winter."
            maxLength={2000}
            className="mt-1.5 w-full resize-none rounded-lg border border-border bg-card p-4 text-sm outline-none"
          />
        </div>

        <div>
          <label htmlFor="collab-city" className="block text-1 font-semibold">
            Where <span className="font-normal text-muted-foreground">· optional</span>
          </label>
          <input
            id="collab-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Bengaluru"
            maxLength={80}
            className="mt-1.5 min-h-control w-full rounded-lg border border-border bg-card px-4 text-sm outline-none"
          />
        </div>

        <div>
          <p className="mb-1.5 text-1 font-semibold">Who can see it</p>
          <SegmentedField
            label="Who can see it"
            value={who}
            options={["Only the people in it", "Anyone on MusicLinkd"] as const}
            onChange={setWho}
          />
        </div>

        <Btn
          type="submit"
          className="w-full"
          disabled={name.trim().length < 2 || !signedIn}
          loading={start.isPending}
        >
          {signedIn ? "Start project" : "Sign in to start"}
        </Btn>
        <p className="text-1 text-muted-foreground">
          You can ask the people you are working with on the next screen. They join once they say yes.
        </p>
      </form>
    </Screen>
  );
}
