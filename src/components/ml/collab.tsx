import { useNavigate } from "@tanstack/react-router";
import {
  Disc3,
  Music2,
  Music4,
  SlidersHorizontal,
  Users,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Sheet } from "./ui";
import { DrawerList, DrawerOptionRow } from "./drawer-list";
import { COLLAB_TYPES, type CollabType } from "@/lib/collab-types";
import { collabTypeCopy } from "@/data/collab-types";

const icons: Record<CollabType, LucideIcon> = {
  band: Music2,
  duo: Users,
  collective: UsersRound,
  ensemble: Music4,
  production_team: SlidersHorizontal,
  crew: Wrench,
};

/**
 * Start a collaboration: the type list in a bottom drawer (owner, 28 Sep 2026: every "+ new" opens
 * a drawer). The six collaboration types (queue item 7, 4 Oct 2026) open the create screen; a
 * one-off project is proof of work, so it goes to Portfolio → add work as a project.
 */
export function CollabKindSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <Sheet open={open} onClose={onClose} title="Start a collaboration">
      <DrawerList label="What you are starting">
        {COLLAB_TYPES.map((type) => (
          <DrawerOptionRow
            key={type}
            option={{ value: type, ...collabTypeCopy[type], icon: icons[type] }}
            onClick={() => {
              onClose();
              void navigate({ to: "/bands/new", search: { type } });
            }}
          />
        ))}
        <DrawerOptionRow
          option={{
            value: "project",
            label: "One-off project",
            hint: "A single, an EP, a film score — add it to your Portfolio",
            icon: Disc3,
          }}
          onClick={() => {
            onClose();
            void navigate({ to: "/portfolio/new/$kind", params: { kind: "project" } });
          }}
        />
      </DrawerList>
    </Sheet>
  );
}
