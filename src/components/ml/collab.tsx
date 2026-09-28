import { useNavigate } from "@tanstack/react-router";
import { Disc3, Music2 } from "lucide-react";
import { Sheet } from "./ui";
import { DrawerList, DrawerOptionRow } from "./drawer-list";

/**
 * Start a collab: the kind list in a bottom drawer, the same shared option rows the wizard used.
 * Choosing a kind is a drawer, not a screen (owner, 28 Sep 2026) — every "+ new" across the app
 * opens a drawer, so /collab/new no longer has a Kind step of its own.
 */
export function CollabKindSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const go = (type: "project" | "band") => {
    onClose();
    void navigate({ to: "/collab/new", search: { type } });
  };
  return (
    <Sheet open={open} onClose={onClose} title="Start a collab">
      <DrawerList label="What you are starting">
        <DrawerOptionRow
          option={{
            value: "project",
            label: "Project",
            hint: "One piece of work — a single, an EP, a film score — that ends",
            icon: Disc3,
          }}
          onClick={() => go("project")}
        />
        <DrawerOptionRow
          option={{
            value: "band",
            label: "Band",
            hint: "An ongoing group of talent, with a public band page",
            icon: Music2,
          }}
          onClick={() => go("band")}
        />
      </DrawerList>
    </Sheet>
  );
}
