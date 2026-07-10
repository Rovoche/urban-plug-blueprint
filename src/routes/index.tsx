import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  component: Discovery,
});

type MultiQ = { kind: "multi"; options: string[]; hasNote?: boolean; notePlaceholder?: string };
type TextQ = { kind: "text"; placeholder: string };
type Question = {
  id: string;
  section: string;
  title: string;
  subtitle?: string;
  examples?: string[];
} & (MultiQ | TextQ);

const QUESTIONS: Question[] = [
  {
    id: "vision",
    section: "01 · The Vision",
    title: "Where do you see Urban Plug in the next 1–2 years?",
    kind: "multi",
    options: [
      "Shortlets & stays",
      "Complete travel platform",
      "Lifestyle & experiences brand",
      "Still evolving",
    ],
    hasNote: true,
    notePlaceholder: "Tell us more about the vision you're building.",
  },
  {
    id: "journey",
    section: "02 · Customer Journey",
    title:
      "When someone discovers Urban Plug on TikTok or Instagram, what happens between that first message and a confirmed booking?",
    kind: "text",
    placeholder: "Walk us through the full flow, in your own words…",
  },
  {
    id: "challenges",
    section: "03 · Current Challenges",
    title: "What part of the process currently takes the most time or feels hardest to manage?",
    kind: "multi",
    options: [
      "Replying enquiries",
      "Explaining services repeatedly",
      "Checking availability",
      "Following up potential clients",
      "Managing different services",
      "Other",
    ],
    hasNote: true,
    notePlaceholder: "Tell us more.",
  },
  {
    id: "structure",
    section: "04 · Building Structure",
    title:
      "You mentioned wanting Urban Plug to feel more ready and structured before taking the next step. What does that structured version of the brand look like to you?",
    examples: [
      "more properties",
      "clearer services",
      "stronger branding",
      "smoother customer experience",
      "better systems",
    ],
    kind: "text",
    placeholder: "Describe the structured version of Urban Plug…",
  },
  {
    id: "foundation",
    section: "05 · Website Foundation",
    title: "For the first version of the website, what should customers be able to explore?",
    kind: "multi",
    options: [
      "Shortlets",
      "Travel packages",
      "Visa support",
      "Concierge services",
      "Experiences",
      "Reviews/testimonials",
      "Other",
    ],
  },
  {
    id: "inspiration",
    section: "06 · Inspiration",
    title: "Are there any brands, websites, apps, or digital experiences you admire?",
    subtitle:
      "Not to copy them, but to understand the feeling and experience you want Urban Plug to create.",
    kind: "text",
    placeholder: "Share names, links, or the feeling they give you…",
  },
];

const WEB3FORMS_KEY = "9f61bf2c-e2c4-4c3b-b629-ab559adc329d";

type Answers = Record<string, { selected?: string[]; note?: string; text?: string }>;

function Discovery() {
  const [stage, setStage] = useState<"hero" | "quiz" | "done" | "error">("hero");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (stage === "quiz") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stage, step]);

  const total = QUESTIONS.length;
  const progress = useMemo(() => ((step + 1) / total) * 100, [step, total]);

  const current = QUESTIONS[step];
  const cur = answers[current?.id] || {};

  const toggle = (opt: string) => {
    const selected = new Set(cur.selected || []);
    if (selected.has(opt)) selected.delete(opt);
    else selected.add(opt);
    setAnswers({ ...answers, [current.id]: { ...cur, selected: Array.from(selected) } });
  };

  const setNote = (v: string) =>
    setAnswers({ ...answers, [current.id]: { ...cur, note: v } });
  const setText = (v: string) =>
    setAnswers({ ...answers, [current.id]: { ...cur, text: v } });

  const submit = async () => {
    setSubmitting(true);
    const format = (id: string) => {
      const a = answers[id] || {};
      if (a.text != null) return a.text || "—";
      const sel = (a.selected || []).join(", ") || "—";
      return a.note ? `${sel}\n\nNotes: ${a.note}` : sel;
    };
    const message = [
      "Urban Plug Discovery Response",
      "",
      "Vision:",
      format("vision"),
      "",
      "Customer Journey:",
      format("journey"),
      "",
      "Current Challenges:",
      format("challenges"),
      "",
      "Building Structure:",
      format("structure"),
      "",
      "Website Foundation:",
      format("foundation"),
      "",
      "Inspiration:",
      format("inspiration"),
    ].join("\n");

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: "New Urban Plug Discovery Response",
          from_name: "Urban Plug Discovery",
          message,
          vision: format("vision"),
          customer_journey: format("journey"),
          current_challenges: format("challenges"),
          building_structure: format("structure"),
          website_foundation: format("foundation"),
          inspiration: format("inspiration"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data as { success?: boolean }).success !== false) {
        setStage("done");
      } else {
        setStage("error");
      }
    } catch {
      setStage("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Ornaments />
      <main className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-5 pb-32 pt-10 sm:px-8 sm:pt-16">
        <Header />

        {stage === "hero" && <Hero onBegin={() => setStage("quiz")} />}

        {stage === "quiz" && current && (
          <QuestionCard
            key={current.id}
            q={current}
            answers={cur}
            step={step}
            total={total}
            progress={progress}
            onToggle={toggle}
            onNote={setNote}
            onText={setText}
            onPrev={() => (step === 0 ? setStage("hero") : setStep(step - 1))}
            onNext={() => (step === total - 1 ? submit() : setStep(step + 1))}
            submitting={submitting}
          />
        )}

        {stage === "done" && <ThankYou />}
        {stage === "error" && (
          <ErrorState onRetry={() => setStage("quiz")} />
        )}

        <Footer />
      </main>
      <FloatingPill />
    </div>
  );
}

function Header() {
  return (
    <header className="mb-16 flex items-center justify-between">
      <div className="text-serif text-lg tracking-[0.3em] text-espresso">ROVOCHÉ</div>
      <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        Private Discovery
      </div>
    </header>
  );
}

function Hero({ onBegin }: { onBegin: () => void }) {
  return (
    <section className="animate-[fade-in_0.8s_ease-out] flex flex-1 flex-col justify-center py-8">
      <p className="mb-6 text-[10px] uppercase tracking-[0.4em] text-cocoa">
        Prepared for Urban Plug
      </p>
      <h1 className="text-serif text-[2.75rem] leading-[1.05] text-espresso sm:text-6xl">
        Urban Plug<br />
        <span className="italic text-cocoa">Brand Direction</span>
      </h1>
      <div className="my-8 h-px w-24 bg-cocoa/40" />
      <p className="text-serif text-xl italic text-cocoa sm:text-2xl">
        A considered beginning for what comes next.
      </p>
      <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
        Thank you for taking the time for this. The questions ahead are simple, but the
        answers matter: they will shape how we understand where Urban Plug stands today,
        where it is headed, and the kind of digital experience that can carry it there.
      </p>
      <div className="mt-12">
        <button
          onClick={onBegin}
          className="group inline-flex items-center gap-3 rounded-full bg-espresso px-8 py-4 text-[13px] uppercase tracking-[0.28em] text-ivory shadow-[var(--shadow-soft)] transition-all duration-500 hover:bg-cocoa hover:shadow-[var(--shadow-luxe)]"
        >
          Begin Discovery
          <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
        </button>
      </div>
      <p className="mt-10 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
        6 questions · about 5 minutes
      </p>
    </section>
  );
}

function QuestionCard({
  q,
  answers,
  step,
  total,
  progress,
  onToggle,
  onNote,
  onText,
  onPrev,
  onNext,
  submitting,
}: {
  q: Question;
  answers: { selected?: string[]; note?: string; text?: string };
  step: number;
  total: number;
  progress: number;
  onToggle: (o: string) => void;
  onNote: (v: string) => void;
  onText: (v: string) => void;
  onPrev: () => void;
  onNext: () => void;
  submitting: boolean;
}) {
  const canProceed =
    q.kind === "multi"
      ? (answers.selected?.length || 0) > 0
      : (answers.text || "").trim().length > 0;
  const isLast = step === total - 1;

  return (
    <section className="animate-[fade-in_0.5s_ease-out] flex flex-1 flex-col py-4">
      <div className="mb-10">
        <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          <span>
            Step {String(step + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-px w-full bg-border/60">
          <div
            className="h-px bg-espresso transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="mb-5 text-[11px] uppercase tracking-[0.35em] text-cocoa">{q.section}</p>
      <h2 className="text-serif text-3xl leading-tight text-espresso sm:text-4xl">{q.title}</h2>
      {q.subtitle && (
        <p className="mt-4 text-[15px] italic text-muted-foreground">{q.subtitle}</p>
      )}
      {q.examples && (
        <p className="mt-4 text-sm text-muted-foreground">
          Examples: {q.examples.join(" · ")}
        </p>
      )}

      <div className="mt-10 space-y-3">
        {q.kind === "multi" &&
          q.options.map((opt) => {
            const selected = answers.selected?.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onToggle(opt)}
                className={[
                  "group flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition-all duration-300",
                  selected
                    ? "border-espresso bg-espresso text-ivory shadow-[var(--shadow-soft)]"
                    : "border-border bg-card hover:border-cocoa/50 hover:bg-secondary/60",
                ].join(" ")}
              >
                <span className="text-[15px]">{opt}</span>
                <span
                  className={[
                    "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] transition",
                    selected ? "border-ivory bg-ivory text-espresso" : "border-border text-transparent",
                  ].join(" ")}
                >
                  ✓
                </span>
              </button>
            );
          })}

        {q.kind === "multi" && q.hasNote && (
          <textarea
            value={answers.note || ""}
            onChange={(e) => onNote(e.target.value)}
            placeholder={q.notePlaceholder}
            rows={4}
            className="mt-4 w-full resize-none rounded-2xl border border-border bg-card p-5 text-[15px] leading-relaxed text-espresso placeholder:text-muted-foreground/70 focus:border-cocoa focus:outline-none focus:ring-0"
          />
        )}

        {q.kind === "text" && (
          <textarea
            value={answers.text || ""}
            onChange={(e) => onText(e.target.value)}
            placeholder={q.placeholder}
            rows={7}
            className="w-full resize-none rounded-2xl border border-border bg-card p-5 text-[15px] leading-relaxed text-espresso placeholder:text-muted-foreground/70 focus:border-cocoa focus:outline-none focus:ring-0"
          />
        )}
      </div>

      <div className="mt-12 flex items-center justify-between gap-4">
        <button
          onClick={onPrev}
          className="text-[12px] uppercase tracking-[0.28em] text-muted-foreground transition hover:text-espresso"
        >
          ← {step === 0 ? "Intro" : "Previous"}
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed || submitting}
          className="group inline-flex items-center gap-3 rounded-full bg-espresso px-7 py-3.5 text-[12px] uppercase tracking-[0.28em] text-ivory shadow-[var(--shadow-soft)] transition-all duration-500 enabled:hover:bg-cocoa enabled:hover:shadow-[var(--shadow-luxe)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Sending…" : isLast ? "Submit Discovery" : "Continue"}
          <span className="transition-transform duration-500 group-enabled:group-hover:translate-x-1">
            →
          </span>
        </button>
      </div>
    </section>
  );
}

function ThankYou() {
  return (
    <section className="animate-[fade-in_0.8s_ease-out] flex flex-1 flex-col justify-center py-16 text-center">
      <p className="mb-6 text-[11px] uppercase tracking-[0.4em] text-cocoa">Received</p>
      <h2 className="text-serif text-5xl italic leading-tight text-espresso sm:text-6xl">
        Thank you
      </h2>
      <div className="mx-auto my-8 h-px w-24 bg-cocoa/40" />
      <p className="mx-auto max-w-lg text-[15px] leading-relaxed text-muted-foreground sm:text-base">
        What you've shared here will guide a proposal built specifically around Urban Plug,
        considered from the ground up rather than assembled from a template.
      </p>
    </section>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="animate-[fade-in_0.5s_ease-out] flex flex-1 flex-col justify-center py-16 text-center">
      <p className="mb-6 text-[11px] uppercase tracking-[0.4em] text-cocoa">A Brief Interruption</p>
      <h2 className="text-serif text-3xl italic text-espresso sm:text-4xl">
        Your response didn't go through
      </h2>
      <div className="mx-auto my-8 h-px w-24 bg-cocoa/40" />
      <p className="mx-auto max-w-md text-[15px] leading-relaxed text-muted-foreground">
        Please try again. If it happens a second time, reach us directly and we'll take it
        from there.
      </p>
      <div className="mt-10">
        <button
          onClick={onRetry}
          className="group inline-flex items-center gap-3 rounded-full bg-espresso px-7 py-3.5 text-[12px] uppercase tracking-[0.28em] text-ivory shadow-[var(--shadow-soft)] transition-all duration-500 hover:bg-cocoa hover:shadow-[var(--shadow-luxe)]"
        >
          Try again
          <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
        </button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-auto pt-24 text-center">
      <div className="divider-line mx-auto mb-8 w-40" />
      <p className="text-serif text-lg italic text-cocoa">Built on Rock.</p>
      <p className="text-serif text-lg italic text-cocoa">Crafted to Last.</p>
      <p className="mt-6 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
        ROVOCHÉ Studio · Est. 2024
      </p>
    </footer>
  );
}

function FloatingPill() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <a
        href="https://rovoche.com"
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-espresso/15 bg-ivory/85 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-espresso shadow-[var(--shadow-soft)] backdrop-blur-md transition hover:bg-ivory"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-cocoa" />
        Built by ROVOCHÉ
      </a>
    </div>
  );
}

function Ornaments() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-champagne/40 blur-[120px]" />
      <div className="absolute -right-40 top-1/2 h-[28rem] w-[28rem] rounded-full bg-accent/25 blur-[140px]" />
    </div>
  );
}
