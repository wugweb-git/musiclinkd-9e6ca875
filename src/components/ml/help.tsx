import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LinkProps } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import { LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import { Btn, BtnLink, Chip, Screen, Sheet, TopBar } from "@/components/ml/ui";
import { Card, EmptyState, Row, SegmentedField, StatusPill, type Tone } from "@/components/ml/kit";
import { useAuth } from "@/hooks/use-auth";
import {
  getMyHelpFeedback,
  giveHelpFeedback,
  listMySupportRequests,
  sendSupportRequest,
  type ContentBlock,
  type HelpCategory,
  type SitePage,
  type SupportStatus,
} from "@/lib/help.functions";

/*
 * Help centre blocks: a cms_pages body (guides and site pages), the "was this helpful" answer
 * under a guide, the contact-support sheet shared by the help index, every guide and /contact, and
 * the site-page screen (/about, /contact, /legal/*). The answer and the request need a signed-in
 * person — they are stored against their profile (help_feedback, support_requests).
 */

/** A cms_pages body: paragraphs, headings, lists, callouts and call-to-action buttons. */
export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        if (b.type === "heading")
          return (
            <h2 key={i} className="pt-1 text-2">
              {b.text}
            </h2>
          );
        if (b.type === "para")
          return (
            <p key={i} className="text-sm leading-relaxed text-muted-foreground">
              {b.text}
            </p>
          );
        if (b.type === "list")
          return (
            <ul key={i} className="space-y-2">
              {b.items.map((it) => (
                <li key={it} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                  <span className="min-w-0">{it}</span>
                </li>
              ))}
            </ul>
          );
        if (b.type === "callout")
          return (
            <Card key={i} className="bg-background">
              <p className="text-1 leading-relaxed">{b.text}</p>
            </Card>
          );
        return (
          <BtnLink key={i} {...(b.link as LinkProps)} className="w-full">
            {b.label}
          </BtnLink>
        );
      })}
    </div>
  );
}

/**
 * A site page (about, contact, legal-*): its title and last-updated date, the short version, then
 * its blocks. Unpublished or unreadable, it says the page isn't available. `children` follow the
 * body (Contact adds the support sheet).
 */
export function SitePageScreen({
  page,
  fallbackTitle,
  back,
  children,
}: {
  page: SitePage | null;
  fallbackTitle: string;
  back: string;
  children?: ReactNode;
}) {
  if (!page) {
    return (
      <Screen bottomNav={false}>
        <TopBar title={fallbackTitle} back={back} />
        <div className="px-5 pt-6">
          <EmptyState
            title="This page isn't available yet"
            body="It will show here once it's published. The help centre has guides and answers in the meantime."
          >
            <BtnLink to="/help" className="w-full">
              Back to Help
            </BtnLink>
          </EmptyState>
          {children ? <div className="pt-6">{children}</div> : null}
        </div>
      </Screen>
    );
  }

  return (
    <Screen bottomNav={false}>
      <TopBar title={page.title} subtitle={page.updated} back={back} />
      <main className="space-y-6 px-5 pb-12 pt-4">
        {page.summary ? (
          <p className="text-1 leading-relaxed text-muted-foreground">{page.summary}</p>
        ) : null}
        <ContentBlocks blocks={page.blocks} />
        {children}
      </main>
    </Screen>
  );
}

type Answer = "Yes" | "No";

/** "Was this helpful?" under a guide. One answer per person, which they can change. */
export function HelpFeedback({ slug }: { slug: string }) {
  const { signedIn } = useAuth();
  const qc = useQueryClient();
  const load = useServerFn(getMyHelpFeedback);
  const give = useServerFn(giveHelpFeedback);
  const key = ["help", "feedback", slug];
  const q = useQuery({
    queryKey: key,
    queryFn: () => load({ data: { slug } }),
    enabled: signedIn,
  });
  const save = useMutation({
    mutationFn: (helpful: boolean) => give({ data: { slug, helpful } }),
    onSuccess: (r) => {
      qc.setQueryData(key, r.helpful);
      toast.success("Thanks for the feedback");
    },
    onError: () => toast.error("That didn't save. Try again."),
  });

  if (!signedIn) return null;
  const current = save.isPending
    ? save.variables
      ? "Yes"
      : "No"
    : q.data === true
      ? "Yes"
      : q.data === false
        ? "No"
        : "";

  return (
    <section className="space-y-3 pt-2">
      <h2 className="text-sm">Was this helpful?</h2>
      <SegmentedField<Answer | "">
        label="Was this helpful?"
        value={current}
        options={["Yes", "No"]}
        onChange={(v) => save.mutate(v === "Yes")}
      />
    </section>
  );
}

const statusTone: Record<SupportStatus, Tone> = {
  open: "warn",
  answered: "good",
  closed: "neutral",
};
const statusLabel: Record<SupportStatus, string> = {
  open: "Open",
  answered: "Answered",
  closed: "Closed",
};

/**
 * "Contact support": a row that opens a sheet to send the team a request. `pageSlug` ties the
 * request to the guide it was sent from; `defaultTopic` preselects that guide's topic.
 */
export function ContactSupport({
  categories,
  pageSlug,
  defaultTopic,
}: {
  categories: HelpCategory[];
  pageSlug?: string;
  defaultTopic?: string;
}) {
  const { signedIn } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState(defaultTopic ?? "");
  const [message, setMessage] = useState("");
  const send = useServerFn(sendSupportRequest);
  const loadMine = useServerFn(listMySupportRequests);
  const mine = useQuery({
    queryKey: ["help", "support-requests"],
    queryFn: () => loadMine(),
    enabled: signedIn && open,
  });
  const submit = useMutation({
    mutationFn: () =>
      send({
        data: {
          topic: topic || "other",
          message: message.trim(),
          ...(pageSlug ? { pageSlug } : {}),
        },
      }),
    onSuccess: () => {
      setMessage("");
      void qc.invalidateQueries({ queryKey: ["help", "support-requests"] });
    },
    onError: () => toast.error("That didn't send. Try again."),
  });

  const topics = [
    ...categories.map((c) => ({ key: c.key, label: c.label })),
    { key: "other", label: "Something else" },
  ];
  const topicLabel = (key: string) => topics.find((t) => t.key === key)?.label ?? key;
  const close = () => {
    setOpen(false);
    submit.reset();
  };

  return (
    <>
      <Row
        icon={<LifeBuoy size={20} aria-hidden />}
        title="Contact support"
        subtitle="Send the team a request"
        onClick={() => setOpen(true)}
      />
      <Sheet open={open} onClose={close} title="Contact support">
        {!signedIn ? (
          <div className="space-y-4">
            <p className="text-1 text-muted-foreground">Sign in to send the team a request.</p>
            <BtnLink to="/welcome" className="w-full">
              Sign in
            </BtnLink>
          </div>
        ) : submit.isSuccess ? (
          <div className="space-y-4">
            <Card>
              <h3 className="text-2 leading-tight">Request sent</h3>
              <p className="mt-2 text-1 text-muted-foreground">
                The team has it. Its status shows here under Your requests.
              </p>
            </Card>
            <Btn className="w-full" onClick={close}>
              Done
            </Btn>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold">Topic</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {topics.map((t) => (
                  <Chip key={t.key} active={topic === t.key} onClick={() => setTopic(t.key)}>
                    {t.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="support-message" className="text-sm font-semibold">
                Message
              </label>
              <textarea
                id="support-message"
                rows={5}
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-2 w-full rounded-lg border border-input bg-background p-3 text-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Btn
              className="w-full"
              disabled={!topic || !message.trim()}
              loading={submit.isPending}
              onClick={() => submit.mutate()}
            >
              Send request
            </Btn>
          </div>
        )}

        {signedIn && mine.data?.length ? (
          <section className="mt-6 space-y-2">
            <h3 className="text-sm">Your requests</h3>
            {mine.data.map((r) => (
              <Card key={r.id} className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-semibold">{topicLabel(r.topic)}</p>
                  <StatusPill label={statusLabel[r.status]} tone={statusTone[r.status]} />
                </div>
                <p className="line-clamp-2 text-1 text-muted-foreground">{r.message}</p>
              </Card>
            ))}
          </section>
        ) : null}
      </Sheet>
    </>
  );
}
