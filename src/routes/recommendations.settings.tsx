import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SlidersHorizontal } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, EmptyState, Loading, Row, SegmentedField } from "@/components/ml/kit";
import { Field, SheetMultiSelect } from "@/components/ml/listing-form";
import { useAuth } from "@/hooks/use-auth";
import {
  clearRecommendationFeedback,
  getMyDiscoverySettings,
  saveMyDiscoverySettings,
} from "@/lib/discovery-settings.functions";
import type { Radius } from "@/lib/discovery-settings";
import { talentTypes, useTaxonomy } from "@/lib/taxonomy";
import { iconSize } from "@/lib/tokens";

/*
 * Discovery settings: what recommendations are based on — roles, genres, cities and how far away.
 * Stored in profiles.discovery_prefs.recommend (src/lib/discovery-settings.ts); every screen that
 * ranks by getMyRecommendations follows them, the swipe deck and the Discover and Home rails alike.
 */
export const Route = createFileRoute("/recommendations/settings")({
  head: () => ({
    meta: [
      { title: "Discovery settings | MusicLinkd" },
      {
        name: "description",
        content: "Choose the roles, genres, cities and distance MusicLinkd recommends people on.",
      },
      { property: "og:title", content: "Discovery settings | MusicLinkd" },
      { property: "og:description", content: "Control what your recommendations are based on." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecSettings,
});

const RADIUS_OPTIONS = ["Near me", "My city", "Anywhere"] as const;
type RadiusLabel = (typeof RADIUS_OPTIONS)[number];
const radiusToLabel: Record<Radius, RadiusLabel> = {
  near: "Near me",
  city: "My city",
  anywhere: "Anywhere",
};
const labelToRadius: Record<RadiusLabel, Radius> = {
  "Near me": "near",
  "My city": "city",
  Anywhere: "anywhere",
};

function RecSettings() {
  const { signedIn, loading } = useAuth();
  const { options } = useTaxonomy();
  const queryClient = useQueryClient();
  const load = useServerFn(getMyDiscoverySettings);
  const saveFn = useServerFn(saveMyDiscoverySettings);
  const clearFn = useServerFn(clearRecommendationFeedback);
  const stored = useQuery({
    queryKey: ["discovery-settings"],
    queryFn: () => load(),
    enabled: signedIn,
  });

  const [roles, setRoles] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [radius, setRadius] = useState<RadiusLabel>("Anywhere");
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!stored.data) return;
    setRoles(stored.data.roles);
    setGenres(stored.data.genres);
    setCities(stored.data.cities);
    setRadius(radiusToLabel[stored.data.radius]);
  }, [stored.data]);

  const roleOptions = talentTypes(options?.person_types ?? []).map((o) => ({
    value: o.slug,
    label: o.label,
  }));
  const genreOptions = (options?.genres ?? []).map((o) => ({ value: o.slug, label: o.label }));
  // profiles.city stores the city's name, so the name is what is kept.
  const cityOptions = (options?.cities ?? []).map((o) => ({
    value: o.label,
    label: o.label,
    ...(o.metadata?.state ? { hint: o.metadata.state } : {}),
  }));

  const save = async () => {
    setSaving(true);
    try {
      await saveFn({ data: { roles, genres, cities, radius: labelToRadius[radius] } });
      await queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      await queryClient.invalidateQueries({ queryKey: ["discovery-settings"] });
      toast("Discovery settings saved");
    } catch {
      toast.error("Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    setClearing(true);
    try {
      const { cleared } = await clearFn();
      await queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      await queryClient.invalidateQueries({ queryKey: ["discovery-settings"] });
      toast(
        cleared
          ? `${cleared} skipped ${cleared === 1 ? "person" : "people"} back in your recommendations`
          : "Nobody was skipped",
      );
    } catch {
      toast.error("Couldn't clear. Try again.");
    } finally {
      setClearing(false);
    }
  };

  let body;
  if (!loading && !signedIn) {
    body = (
      <EmptyState
        icon={<SlidersHorizontal size={iconSize.lg} aria-hidden />}
        title="Sign in to change discovery settings"
        body="Your settings are kept with your account."
        action={<BtnLink to="/welcome">Sign in</BtnLink>}
      />
    );
  } else if (!stored.data) {
    body = stored.isError ? (
      <EmptyState
        title="Couldn't load your settings"
        body="Check your connection and try again."
        action={
          <Btn variant="outline" onClick={() => void stored.refetch()}>
            Try again
          </Btn>
        }
      />
    ) : (
      <Loading rows={3} />
    );
  } else {
    body = (
      <>
        <Card className="space-y-4">
          <h2 className="text-sm">What we recommend on</h2>
          <Field
            label="Roles"
            id="rec-roles"
            hint="People with these roles. None picked means any role."
          >
            <SheetMultiSelect
              title="Roles"
              value={roles}
              options={roleOptions}
              onChange={setRoles}
              placeholder="Any role"
              max={10}
            />
          </Field>
          <Field
            label="Genres"
            id="rec-genres"
            hint="None picked means the genres on your profile."
          >
            <SheetMultiSelect
              title="Genres"
              value={genres}
              options={genreOptions}
              onChange={setGenres}
              placeholder="Genres on your profile"
              max={10}
            />
          </Field>
          <Field label="Cities" id="rec-cities" hint="None picked means your own city.">
            <SheetMultiSelect
              title="Cities"
              value={cities}
              options={cityOptions}
              onChange={setCities}
              placeholder="Your city"
              max={5}
            />
          </Field>
          <Field
            label="Radius"
            id="rec-radius"
            hint="Near me is your PIN code area. The cities you picked always count."
          >
            <SegmentedField
              label="Radius"
              value={radius}
              options={RADIUS_OPTIONS}
              onChange={setRadius}
            />
          </Field>
          <Btn className="w-full" onClick={() => void save()} loading={saving}>
            Save
          </Btn>
        </Card>

        <Card className="space-y-2">
          <h2 className="text-sm">Reset</h2>
          <p className="text-1 text-muted-foreground">
            Clearing feedback brings back everyone you skipped on the swipe deck.
            {stored.data.skipped.length ? ` You have skipped ${stored.data.skipped.length}.` : ""}
          </p>
          <Btn
            variant="outline"
            className="w-full"
            onClick={() => void clear()}
            loading={clearing}
            disabled={!stored.data.skipped.length}
          >
            Clear recommendation feedback
          </Btn>
        </Card>

        <div className="space-y-2">
          <Row title="Saved items" subtitle="Saved profiles, listings and spaces" to="/saved" />
          <Row
            title="Discover"
            subtitle="Browse everything without personalisation"
            to="/discover"
          />
        </div>
      </>
    );
  }

  return (
    <Screen bottomNav={false}>
      <TopBar title="Discovery settings" back="/recommendations/swipe" />
      <div className="space-y-4 px-5 pt-4 pb-8">{body}</div>
    </Screen>
  );
}
