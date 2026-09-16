"use client";

import {
  Bell,
  Zap,
  Calendar,
  ChartColumn,
  ChartPie,
  Clock,
  FileText,
  CircleHelp,
  Keyboard,
  LayoutDashboard,
  SquareKanban,
  LogOut,
  MessageSquare,
  Palette,
  Settings,
  SquareCheck,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";

const workspaceItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: SquareKanban, label: "Projects" },
  { icon: SquareCheck, label: "Tasks" },
  { icon: Calendar, label: "Calendar" },
  { icon: Users, label: "Team members" },
  { icon: MessageSquare, label: "Messages" },
  { icon: FileText, label: "Documents" },
  { icon: Bell, label: "Notifications" },
  { icon: Clock, label: "Time tracking" },
  { icon: Target, label: "Goals" },
];

const analyticsItems = [
  { icon: ChartColumn, label: "Overview" },
  { icon: TrendingUp, label: "Performance" },
  { icon: ChartPie, label: "Reports" },
  { icon: Zap, label: "Insights" },
];

const settingsItems = [
  { icon: Settings, label: "Preferences" },
  { icon: Palette, label: "Appearance" },
  { icon: Keyboard, label: "Keyboard shortcuts" },
  { icon: CircleHelp, label: "Help & support" },
  { icon: LogOut, label: "Sign out" },
];

export function CommandMenu01() {
  // Closed on mount: a Radix dialog open during the first render trips its focus trap under
  // Storybook's act() environment ("Should not already be working"). The button opens it.
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline">
        Open Command Menu
      </Button>

      {/* Our CommandDialog already renders a Command; the vendor copy nested a second one, which cmdk
          rejects at render ("Should not already be working"). */}
      <CommandDialog onOpenChange={setOpen} open={open}>
        <CommandInput className="h-12" placeholder="Type a command or search..." />
        <CommandList className="h-[320px] max-h-[320px]">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Workspace">
            {workspaceItems.map((item) => (
              <CommandItem key={item.label}>
                <item.icon className="mr-2 h-5 w-5" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Analytics">
            {analyticsItems.map((item) => (
              <CommandItem key={item.label}>
                <item.icon className="mr-2 h-5 w-5" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Settings">
            {settingsItems.map((item) => (
              <CommandItem key={item.label}>
                <item.icon className="mr-2 h-5 w-5" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
        <div className="flex h-12 items-center justify-end border-t px-3">
          <button
            className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
            onClick={() => setOpen(false)}
            type="button"
          >
            <span>Close</span>
            <Kbd className="ml-1">Esc</Kbd>
          </button>
        </div>
      </CommandDialog>
    </>
  );
}
