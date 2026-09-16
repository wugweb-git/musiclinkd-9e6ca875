import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar, Chip, Btn, BtnLink, SearchBar, Sheet } from "@/components/ml/ui";
import { VerifiedBadge } from "@/components/ml/ui";
import { Card, EmptyState, Label, StickyBar } from "@/components/ml/collab";
import { candidates, collabRoles, type CollabRole } from "@/data/collab";

export const Route = createFileRoute("/collab/new/collaborators")({
  head: () => ({
    meta: [
      { title: "Add collaborators — MusicLinkd" },
      {
        name: "description",
        content:
          "Search MusicLinkd by name, username, role, instrument or business and invite collaborators.",
      },
      { property: "og:title", content: "Add collaborators — MusicLinkd" },
      {
        property: "og:description",
        content: "Invite the people who'll work on this project with you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AddCollaborators,
});

const facets = ["All", "People", "Businesses", "Verified"];

function AddCollaborators() {
  const [query, setQuery] = useState("");
  const [facet, setFacet] = useState("All");
  const [invited, setInvited] = useState<Record<string, CollabRole>>({});
  const [rolePickerFor, setRolePickerFor] = useState<string | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates.filter((c) => {
      if (facet === "People" && c.business) return false;
      if (facet === "Businesses" && !c.business) return false;
      if (facet === "Verified" && !c.verified) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.instrument.toLowerCase().includes(q)
      );
    });
  }, [query, facet]);

  const count = Object.keys(invited).length;

  return (
    <Screen bottomNav={false}>
      <TopBar
        title="Add collaborators"
        subtitle="Step 2 of 2 · Invite people and set roles"
        back="/collab/new"
      />
      <div className="px-5 pt-4">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Name, username, role, instrument or business"
        />
      </div>
      <div className="rail mt-3 flex gap-2 overflow-x-auto px-5 no-scrollbar">
        {facets.map((f) => (
          <Chip key={f} active={f === facet} onClick={() => setFacet(f)}>
            {f}
          </Chip>
        ))}
      </div>

      <main className="mt-3 px-5">
        {list.length === 0 ? (
          <EmptyState
            title="No one matches that search"
            body="Try a different name, role or instrument — we never create duplicate profiles."
          />
        ) : (
          <div className="divide-y divide-border">
            {list.map((c) => {
              const role = invited[c.id];
              return (
                <div key={c.id} className="flex items-center gap-3 py-4">
                  <img src={c.photo} alt={c.name} className="h-11 w-11 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-sm">{c.name}</h3>
                      {c.verified ? <VerifiedBadge size={16} /> : null}
                    </div>
                    <p className="truncate text-1 text-muted-foreground">
                      {c.username} · {c.role} · {c.location}
                    </p>
                    {role ? (
                      <button
                        type="button"
                        onClick={() => setRolePickerFor(c.id)}
                        className="mt-1 text-1 font-semibold text-foreground"
                      >
                        Role: {role} · change
                      </button>
                    ) : null}
                  </div>
                  <Btn
                    variant={role ? "outline" : "primary"}
                    className="shrink-0 px-4"
                    onClick={() =>
                      role
                        ? setInvited((s) => {
                            const next = { ...s };
                            delete next[c.id];
                            return next;
                          })
                        : setRolePickerFor(c.id)
                    }
                  >
                    {role ? "Invited" : "Invite"}
                  </Btn>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <Label>Prefer a link?</Label>
          <Card>
            <p className="text-1 font-semibold">Invite by link</p>
            <p className="mb-3 text-1 text-muted-foreground">
              Anyone with the link can request to join. You approve every request, and you can
              disable the link at any time.
            </p>
            <div className="flex gap-2">
              <Btn variant="outline" className="flex-1">
                Copy Link
              </Btn>
              <Btn variant="ghost" className="flex-1">
                Disable Link
              </Btn>
            </div>
          </Card>
        </div>
      </main>

      <StickyBar>
        <div className="flex gap-3">
          <BtnLink to="/collab" variant="outline" className="flex-1 w-full">
            Save Draft
          </BtnLink>
          <BtnLink to="/collab/$id" params={{ id: "raat-ki-rani" }} className="flex-[2] w-full">
            {count ? `Create & invite ${count}` : "Create project"}
          </BtnLink>
        </div>
      </StickyBar>

      <Sheet
        open={rolePickerFor !== null}
        onClose={() => setRolePickerFor(null)}
        title="Select role"
      >
        <p className="mb-4 text-1 text-muted-foreground">
          Roles come from the MusicLinkd role taxonomy so credits stay consistent across the
          platform.
        </p>
        <div className="flex flex-wrap gap-2 pb-2">
          {collabRoles.map((r) => (
            <Chip
              key={r}
              onClick={() => {
                if (rolePickerFor) setInvited((s) => ({ ...s, [rolePickerFor]: r }));
                setRolePickerFor(null);
              }}
            >
              {r}
            </Chip>
          ))}
        </div>
      </Sheet>
    </Screen>
  );
}
