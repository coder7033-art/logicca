"use client";

import Image from "next/image";
import {
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  localized,
  SECTIONS,
  setRendererContext,
} from "@/lib/questionnaire-renderer";

type Language = "ar" | "en";
type AnswerValue = string | string[];
type Answers = Record<string, AnswerValue>;
type Respondent = {
  name: string;
  role: string;
  email: string;
  date: string;
};
type Draft = { meta: Respondent; answers: Answers };
type SubmissionReceipt = { reference: string; resetToken: string };
type ViewMode = "questions" | "review" | "success";
type SaveState = "saved" | "saving";

const STORAGE_KEY = "logicca_questionnaire_v5";
const SECTION_KEY = "logicca_questionnaire_section_v5";
const LANGUAGE_KEY = "logicca_questionnaire_language_v5";
const VISITED_KEY = "logicca_questionnaire_visited_v5";
const SUBMISSIONS_KEY = "logicca_questionnaire_submissions_v5";

const emptyDraft: Draft = {
  meta: { name: "", role: "", email: "", date: "" },
  answers: {},
};

const ui = {
  ar: {
    survey: "استبيان الأعمال والعمليات",
    project: "LOGICCA",
    draft: "مسودة محفوظة",
    local: "يتم حفظ إجاباتك تلقائيًا على هذا الجهاز",
    sections: "أقسام الاستبيان",
    section: "القسم",
    of: "من",
    answered: "إجابة مسجلة",
    language: "English",
    reset: "مسح الإجابات",
    resetting: "جارٍ المسح...",
    resetConfirm: "هل تريد مسح كل الإجابات وبيانات المشارك وأي نسخة مرسلة مرتبطة بهذه المسودة من قاعدة البيانات؟ لا يمكن التراجع عن ذلك.",
    resetError: "تعذر مسح النسخة من قاعدة البيانات الآن. لم يتم مسح إجاباتك من الجهاز، ويمكنك المحاولة مرة أخرى.",
    introTitle: "ساعدنا نفهم طريقة عملكم بدقة",
    intro: "أجب حسب الوضع الحالي. يمكنك الانتقال بين الأقسام في أي وقت والعودة لاستكمال الإجابات لاحقًا.",
    personTitle: "بيانات المشارك",
    personHint: "نحتاجها فقط للتواصل إذا احتجنا توضيحًا.",
    name: "الاسم",
    role: "المنصب / الإدارة",
    email: "البريد الإلكتروني للعمل",
    date: "التاريخ",
    required: "مطلوب",
    optional: "اختياري",
    namePlaceholder: "اكتب الاسم الكامل",
    rolePlaceholder: "مثال: مدير العمليات",
    emailPlaceholder: "name@company.com",
    previous: "السابق",
    next: "التالي",
    review: "مراجعة وإرسال",
    jump: "انتقل إلى قسم",
    saveLater: "محفوظ تلقائيًا",
    reviewTitle: "راجع الإجابات قبل الإرسال",
    reviewIntro: "يمكنك الرجوع لأي قسم للتعديل. عند الإرسال ستُحفظ النسخة النهائية بأمان.",
    respondent: "بيانات المشارك",
    surveySummary: "ملخص الاستبيان",
    recorded: "إجابات وبيانات مسجلة",
    edit: "تعديل",
    submit: "إرسال الاستبيان",
    submitting: "جارٍ الإرسال...",
    download: "تنزيل نسخة CSV",
    print: "حفظ PDF",
    identityError: "أكمل الاسم والبريد الإلكتروني الصحيح قبل الإرسال.",
    validationTitle: "تعذر إرسال الاستبيان",
    fixDetails: "تصحيح بيانات المشارك",
    nameError: "اكتب الاسم كاملًا — حرفان على الأقل.",
    emailError: "اكتب بريدًا إلكترونيًا صحيحًا، مثل name@company.com.",
    submitError: "تعذر الإرسال الآن. إجاباتك ما زالت محفوظة على جهازك ويمكنك تنزيل نسخة منها.",
    successKicker: "تم الاستلام",
    successTitle: "شكرًا، وصلتنا إجاباتك.",
    successCopy: "تم حفظ الاستبيان بنجاح. يمكنك الاحتفاظ بالرقم المرجعي أدناه أو تنزيل نسخة من الإجابات.",
    reference: "الرقم المرجعي",
    backToAnswers: "العودة إلى الإجابات",
    assistance: "هل تحتاج مساعدة؟",
    assistanceCopy: "يمكنك حفظ المسودة والعودة للرابط نفسه في أي وقت.",
    savedNow: "تم الحفظ الآن",
  },
  en: {
    survey: "Business & Operations Questionnaire",
    project: "LOGICCA",
    draft: "Draft saved",
    local: "Your answers are saved automatically on this device",
    sections: "Questionnaire sections",
    section: "Section",
    of: "of",
    answered: "recorded answers",
    language: "العربية",
    reset: "Clear answers",
    resetting: "Clearing...",
    resetConfirm: "Clear all answers, respondent details, and any submitted copy linked to this draft from the database? This cannot be undone.",
    resetError: "The database copy could not be cleared. Your answers remain on this device, so you can try again.",
    introTitle: "Help us understand how your business works",
    intro: "Answer based on current operations. You can move between sections at any time and return later.",
    personTitle: "Respondent details",
    personHint: "Used only if we need to clarify an answer.",
    name: "Name",
    role: "Role / Department",
    email: "Work email",
    date: "Date",
    required: "Required",
    optional: "Optional",
    namePlaceholder: "Full name",
    rolePlaceholder: "e.g. Operations Manager",
    emailPlaceholder: "name@company.com",
    previous: "Previous",
    next: "Next",
    review: "Review & submit",
    jump: "Jump to section",
    saveLater: "Saved automatically",
    reviewTitle: "Review before submitting",
    reviewIntro: "You can return to any section to make changes. Submitting securely saves the final response.",
    respondent: "Respondent details",
    surveySummary: "Questionnaire summary",
    recorded: "answers and details recorded",
    edit: "Edit",
    submit: "Submit questionnaire",
    submitting: "Submitting...",
    download: "Download CSV copy",
    print: "Save PDF",
    identityError: "Enter a name and valid work email before submitting.",
    validationTitle: "Questionnaire could not be submitted",
    fixDetails: "Correct respondent details",
    nameError: "Enter a full name with at least two characters.",
    emailError: "Enter a valid email address, such as name@company.com.",
    submitError: "We could not submit right now. Your answers remain saved on this device and can be downloaded.",
    successKicker: "Received",
    successTitle: "Thank you. Your answers are in.",
    successCopy: "The questionnaire was saved successfully. Keep the reference below or download a copy of the answers.",
    reference: "Reference",
    backToAnswers: "Back to answers",
    assistance: "Need help?",
    assistanceCopy: "Your draft is saved, so you can return using the same link at any time.",
    savedNow: "Saved just now",
  },
} as const;

function nonEmptyCount(draft: Draft) {
  const answerCount = Object.values(draft.answers).filter((value) =>
    Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0,
  ).length;
  const metaCount = Object.values(draft.meta).filter((value) => value.trim().length > 0).length;
  return answerCount + metaCount;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function Chevron({ direction }: { direction: "next" | "previous" }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={`chevron chevron-${direction}`}>
      <path d="m7.5 4.5 5.5 5.5-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="check-icon">
      <path d="m4.5 10.2 3.2 3.2 7.8-7.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="reset-icon">
      <path d="M4.8 6.4A6.2 6.2 0 1 1 4 12.1" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4.8 3.5v3.2H8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function QuestionnaireApp() {
  const [language, setLanguage] = useState<Language>("ar");
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<ViewMode>("questions");
  const [meta, setMeta] = useState<Respondent>(emptyDraft.meta);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [renderDraft, setRenderDraft] = useState<Draft>({
    ...emptyDraft,
    meta: { ...emptyDraft.meta },
    answers: {},
  });
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [answeredCount, setAnsweredCount] = useState(0);
  const [identityError, setIdentityError] = useState(false);
  const [showIdentity, setShowIdentity] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState(false);
  const [reference, setReference] = useState("");
  const [ready, setReady] = useState(false);
  const draftRef = useRef<Draft>({ ...emptyDraft, meta: { ...emptyDraft.meta }, answers: {} });
  const submissionReceiptsRef = useRef<SubmissionReceipt[]>([]);
  const saveTimerRef = useRef<number | null>(null);
  const copy = ui[language];

  /* eslint-disable react-hooks/set-state-in-effect -- this effect hydrates the client-only local draft. */
  useEffect(() => {
    let loaded: Draft = {
      meta: { ...emptyDraft.meta, date: new Date().toISOString().slice(0, 10) },
      answers: {},
    };

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Draft>;
        loaded = {
          meta: { ...loaded.meta, ...(parsed.meta ?? {}) },
          answers: parsed.answers ?? {},
        };
      }

      const storedLanguage = window.localStorage.getItem(LANGUAGE_KEY);
      if (storedLanguage === "en" || storedLanguage === "ar") setLanguage(storedLanguage);

      const storedSection = Number(window.localStorage.getItem(SECTION_KEY));
      if (Number.isInteger(storedSection) && storedSection >= 0 && storedSection < SECTIONS.length) {
        setActiveIndex(storedSection);
      }

      const storedVisited = JSON.parse(window.localStorage.getItem(VISITED_KEY) ?? "[]") as number[];
      setVisited(new Set([0, ...storedVisited.filter((item) => Number.isInteger(item))]));

      const storedSubmissions = JSON.parse(window.localStorage.getItem(SUBMISSIONS_KEY) ?? "[]") as unknown;
      if (Array.isArray(storedSubmissions)) {
        submissionReceiptsRef.current = storedSubmissions.filter(
          (item): item is SubmissionReceipt =>
            Boolean(item) &&
            typeof item === "object" &&
            typeof (item as SubmissionReceipt).reference === "string" &&
            typeof (item as SubmissionReceipt).resetToken === "string",
        );
      }
    } catch {
      // A private browser mode can block local storage; the in-memory draft still works.
    }

    draftRef.current = loaded;
    setRenderDraft(loaded);
    setMeta(loaded.meta);
    setAnsweredCount(nonEmptyCount(loaded));
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  useEffect(() => () => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
  }, []);

  const section = SECTIONS[activeIndex];
  const sectionHtml = useMemo(() => {
    setRendererContext(language, renderDraft);
    return section.render();
  }, [language, renderDraft, section]);

  function persist() {
    setSaveState("saving");
    setAnsweredCount(nonEmptyCount(draftRef.current));
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftRef.current));
      window.localStorage.setItem(SECTION_KEY, String(activeIndex));
      window.localStorage.setItem(LANGUAGE_KEY, language);
      window.localStorage.setItem(VISITED_KEY, JSON.stringify([...visited]));
    } catch {
      // Keep the questionnaire usable when storage is unavailable.
    }
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => setSaveState("saved"), 350);
  }

  function setAnswer(key: string, value: AnswerValue, refresh = false) {
    draftRef.current = {
      ...draftRef.current,
      answers: { ...draftRef.current.answers, [key]: value },
    };
    persist();
    if (refresh) setRenderDraft(draftRef.current);
  }

  function updateMeta(key: keyof Respondent, value: string) {
    const next = { ...draftRef.current.meta, [key]: value };
    draftRef.current = { ...draftRef.current, meta: next };
    setMeta(next);
    if (identityError && next.name.trim().length >= 2 && isValidEmail(next.email)) {
      setIdentityError(false);
    }
    persist();
  }

  function handleQuestionClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const noteToggle = target.closest<HTMLElement>("[data-note-toggle]");
    if (noteToggle) {
      noteToggle.closest(".q")?.classList.toggle("note-open");
      return;
    }

    const choice = target.closest<HTMLButtonElement>("[data-choice]");
    if (choice?.dataset.choice && choice.dataset.v) {
      setAnswer(choice.dataset.choice, choice.dataset.v, true);
      return;
    }

    const service = target.closest<HTMLButtonElement>("[data-service]");
    if (service?.dataset.service && service.dataset.v) {
      setAnswer(`svc_${service.dataset.service}`, service.dataset.v, true);
    }
  }

  function handleQuestionInput(event: FormEvent<HTMLDivElement>) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (target.dataset.check && target instanceof HTMLInputElement) {
      const current = new Set(
        Array.isArray(draftRef.current.answers[target.dataset.check])
          ? (draftRef.current.answers[target.dataset.check] as string[])
          : [],
      );
      if (target.checked) current.add(target.value);
      else current.delete(target.value);
      setAnswer(target.dataset.check, [...current], true);
      return;
    }
    if (target.dataset.note) setAnswer(`${target.dataset.note}_note`, target.value);
    if (target.dataset.text) setAnswer(target.dataset.text, target.value);
  }

  function handleQuestionChange(event: FormEvent<HTMLDivElement>) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    if (target.dataset.text) setAnswer(target.dataset.text, target.value);
  }

  function goToSection(index: number) {
    const bounded = Math.max(0, Math.min(SECTIONS.length - 1, index));
    const nextVisited = new Set(visited).add(bounded);
    setRenderDraft(draftRef.current);
    setVisited(nextVisited);
    setActiveIndex(bounded);
    setShowIdentity(false);
    setMode("questions");
    setSubmitError(false);
    try {
      window.localStorage.setItem(SECTION_KEY, String(bounded));
      window.localStorage.setItem(VISITED_KEY, JSON.stringify([...nextVisited]));
    } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleLanguage() {
    const next = language === "ar" ? "en" : "ar";
    setRenderDraft(draftRef.current);
    setLanguage(next);
    try {
      window.localStorage.setItem(LANGUAGE_KEY, next);
    } catch {}
  }

  async function resetQuestionnaire() {
    if (!window.confirm(copy.resetConfirm)) return;

    setResetting(true);
    setResetError(false);

    try {
      if (submissionReceiptsRef.current.length > 0) {
        const response = await fetch("/api/submissions", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ submissions: submissionReceiptsRef.current }),
        });
        const result = (await response.json()) as { ok?: boolean };
        if (!response.ok || !result.ok) throw new Error("Database reset failed");
      }

      const freshDraft: Draft = {
        meta: { ...emptyDraft.meta, date: new Date().toISOString().slice(0, 10) },
        answers: {},
      };

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      draftRef.current = freshDraft;
      submissionReceiptsRef.current = [];
      setMeta(freshDraft.meta);
      setRenderDraft(freshDraft);
      setActiveIndex(0);
      setVisited(new Set([0]));
      setMode("questions");
      setIdentityError(false);
      setShowIdentity(false);
      setSubmitError(false);
      setSubmitting(false);
      setReference("");
      setAnsweredCount(nonEmptyCount(freshDraft));
      setSaveState("saved");

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(freshDraft));
        window.localStorage.setItem(SECTION_KEY, "0");
        window.localStorage.setItem(LANGUAGE_KEY, language);
        window.localStorage.setItem(VISITED_KEY, JSON.stringify([0]));
        window.localStorage.removeItem(SUBMISSIONS_KEY);
      } catch {
        // The in-memory questionnaire is still reset if local storage is unavailable.
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setResetError(true);
    } finally {
      setResetting(false);
    }
  }

  function openReview() {
    setMode("review");
    setSubmitError(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editRespondentDetails() {
    const invalidField = meta.name.trim().length < 2 ? "respondent-name" : "respondent-email";
    setRenderDraft(draftRef.current);
    setShowIdentity(true);
    setMode("questions");
    window.setTimeout(() => {
      const field = document.getElementById(invalidField);
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      field?.focus();
    }, 80);
  }

  function downloadCsv() {
    const rows: [string, string][] = [["Field", "Value"]];
    Object.entries(draftRef.current.meta).forEach(([key, value]) => rows.push([`respondent.${key}`, value]));
    Object.entries(draftRef.current.answers).forEach(([key, value]) =>
      rows.push([key, Array.isArray(value) ? value.join(" | ") : value]),
    );
    const csv = `\uFEFF${rows
      .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "LOGICCA_Questionnaire_Responses.csv";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  async function submitQuestionnaire() {
    const respondent = draftRef.current.meta;
    if (respondent.name.trim().length < 2 || !isValidEmail(respondent.email)) {
      setIdentityError(true);
      window.setTimeout(() => {
        document.getElementById("review-validation-error")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 50);
      return;
    }

    setSubmitting(true);
    setSubmitError(false);
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          language,
          respondent,
          answers: draftRef.current.answers,
          source: "client-questionnaire",
        }),
      });
      const result = (await response.json()) as { ok?: boolean; reference?: string; resetToken?: string };
      if (!response.ok || !result.ok || !result.reference || !result.resetToken) throw new Error("Submission failed");
      submissionReceiptsRef.current = [
        ...submissionReceiptsRef.current.filter((item) => item.reference !== result.reference),
        { reference: result.reference, resetToken: result.resetToken },
      ];
      try {
        window.localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissionReceiptsRef.current));
      } catch {
        // The submission still succeeds if this browser blocks local storage.
      }
      setReference(result.reference);
      setMode("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  }

  const progress = ((activeIndex + 1) / SECTIONS.length) * 100;
  const localizedSection = (value: unknown) => localized(value, language);
  const directionNext = language === "ar" ? "previous" : "next";
  const directionPrevious = language === "ar" ? "next" : "previous";
  const nameIsInvalid = identityError && meta.name.trim().length < 2;
  const emailIsInvalid = identityError && !isValidEmail(meta.email);

  if (!ready) {
    return (
      <div className="app-loading" aria-label="Loading">
        <Image src="/assets/logicca_logo.png" alt="LOGICCA" width={144} height={43} priority />
        <span />
      </div>
    );
  }

  return (
    <div className="questionnaire-app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-block">
            <Image src="/assets/logicca_logo.png" alt="LOGICCA" width={132} height={39} priority className="brand-logo" />
            <span className="brand-divider" />
            <div>
              <strong>{copy.survey}</strong>
              <small>{copy.project}</small>
            </div>
          </div>
          <div className="topbar-actions">
            <div className={`save-indicator ${saveState}`} role="status">
              <span className="save-dot"><CheckIcon /></span>
              <span>{saveState === "saved" ? copy.draft : "..."}</span>
            </div>
            <button
              type="button"
              className="reset-button"
              onClick={resetQuestionnaire}
              aria-label={copy.reset}
              aria-busy={resetting}
              disabled={resetting}
            >
              <ResetIcon />
              <span>{resetting ? copy.resetting : copy.reset}</span>
            </button>
            <button type="button" className="language-button" onClick={toggleLanguage}>
              <span className="language-mark">Aa</span>
              {copy.language}
            </button>
          </div>
        </div>
      </header>

      {resetError && <div className="reset-error-banner" role="alert">{copy.resetError}</div>}

      <div className="mobile-progress">
        <div><strong>{copy.section} {activeIndex + 1}</strong><span>{copy.of} {SECTIONS.length}</span></div>
        <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-head">
            <p>{copy.sections}</p>
            <span>{answeredCount} {copy.answered}</span>
          </div>
          <nav aria-label={copy.sections}>
            {SECTIONS.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className={`section-link ${activeIndex === index && mode === "questions" ? "active" : ""}`}
                onClick={() => goToSection(index)}
                aria-current={activeIndex === index && mode === "questions" ? "step" : undefined}
              >
                <span className="section-index">{visited.has(index) && index !== activeIndex ? <CheckIcon /> : String(index + 1).padStart(2, "0")}</span>
                <span>{localizedSection(item.name)}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-help">
            <strong>{copy.assistance}</strong>
            <p>{copy.assistanceCopy}</p>
          </div>
        </aside>

        <main className="main-content">
          {mode === "questions" && (
            <>
              <section className="intro-panel">
                <div>
                  <span className="eyebrow">{copy.project}</span>
                  <h1>{copy.introTitle}</h1>
                  <p>{copy.intro}</p>
                </div>
                <div className="section-progress-card" aria-label={`${copy.section} ${activeIndex + 1} ${copy.of} ${SECTIONS.length}`}>
                  <div><strong>{activeIndex + 1}</strong><span>/ {SECTIONS.length}</span></div>
                  <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
                </div>
              </section>

              {activeIndex === 0 || identityError || showIdentity ? (
                <section className={`respondent-card ${identityError ? "has-error" : ""}`}>
                  <div className="respondent-heading">
                    <div>
                      <h2>{copy.personTitle}</h2>
                      <p>{copy.personHint}</p>
                    </div>
                    {identityError && <div className="inline-error" role="alert">{copy.identityError}</div>}
                  </div>
                  <div className="respondent-grid">
                    <label className={`form-field ${nameIsInvalid ? "field-invalid" : ""}`}>
                      <span>{copy.name} <em>{copy.required}</em></span>
                      <input id="respondent-name" value={meta.name} onChange={(event) => updateMeta("name", event.target.value)} placeholder={copy.namePlaceholder} autoComplete="name" aria-invalid={nameIsInvalid} aria-describedby={nameIsInvalid ? "respondent-name-error" : undefined} />
                      {nameIsInvalid && <span className="field-error" id="respondent-name-error">{copy.nameError}</span>}
                    </label>
                    <label className="form-field">
                      <span>{copy.role} <small>{copy.optional}</small></span>
                      <input value={meta.role} onChange={(event) => updateMeta("role", event.target.value)} placeholder={copy.rolePlaceholder} autoComplete="organization-title" />
                    </label>
                    <label className={`form-field ${emailIsInvalid ? "field-invalid" : ""}`}>
                      <span>{copy.email} <em>{copy.required}</em></span>
                      <input id="respondent-email" type="email" value={meta.email} onChange={(event) => updateMeta("email", event.target.value)} placeholder={copy.emailPlaceholder} autoComplete="email" dir="ltr" aria-invalid={emailIsInvalid} aria-describedby={emailIsInvalid ? "respondent-email-error" : undefined} />
                      {emailIsInvalid && <span className="field-error" id="respondent-email-error">{copy.emailError}</span>}
                    </label>
                    <label className="form-field date-field">
                      <span>{copy.date} <small>{copy.optional}</small></span>
                      <input type="date" value={meta.date} onChange={(event) => updateMeta("date", event.target.value)} />
                    </label>
                  </div>
                </section>
              ) : (
                <div className="respondent-compact">
                  <span><CheckIcon /></span>
                  <div>
                    <strong>{meta.name || copy.personTitle}</strong>
                    <small dir="ltr">{meta.email || copy.personHint}</small>
                  </div>
                  <button type="button" onClick={() => setShowIdentity(true)}>{copy.edit}</button>
                </div>
              )}

              <div className="mobile-section-picker">
                <label htmlFor="section-picker">{copy.jump}</label>
                <select id="section-picker" value={activeIndex} onChange={(event: ChangeEvent<HTMLSelectElement>) => goToSection(Number(event.target.value))}>
                  {SECTIONS.map((item, index) => <option key={item.id} value={index}>{index + 1}. {localizedSection(item.name)}</option>)}
                </select>
              </div>

              <section className="section-heading">
                <span>{copy.section} {String(activeIndex + 1).padStart(2, "0")}</span>
                <h2>{localizedSection(section.title)}</h2>
                <p>{localizedSection(section.desc)}</p>
              </section>

              <div
                className="questionnaire-html"
                onClick={handleQuestionClick}
                onInputCapture={handleQuestionInput}
                onChangeCapture={handleQuestionChange}
                dangerouslySetInnerHTML={{ __html: sectionHtml }}
              />

              <div className="bottom-actions">
                <button type="button" className="button-secondary" disabled={activeIndex === 0} onClick={() => goToSection(activeIndex - 1)}>
                  <Chevron direction={directionPrevious} />
                  <span>{copy.previous}</span>
                </button>
                <span className="bottom-save"><CheckIcon /> {saveState === "saved" ? copy.savedNow : copy.saveLater}</span>
                {activeIndex < SECTIONS.length - 1 ? (
                  <button type="button" className="button-primary" onClick={() => goToSection(activeIndex + 1)}>
                    <span>{copy.next}</span>
                    <Chevron direction={directionNext} />
                  </button>
                ) : (
                  <button type="button" className="button-primary" onClick={openReview}>
                    <span>{copy.review}</span>
                    <Chevron direction={directionNext} />
                  </button>
                )}
              </div>
            </>
          )}

          {mode === "review" && (
            <section className="review-view">
              <span className="eyebrow">{copy.review}</span>
              <h1>{copy.reviewTitle}</h1>
              <p className="review-lead">{copy.reviewIntro}</p>

              {identityError && (
                <div className="review-validation" id="review-validation-error" role="alert" aria-live="assertive">
                  <span className="validation-mark" aria-hidden="true">!</span>
                  <div>
                    <strong>{copy.validationTitle}</strong>
                    <p>{copy.identityError}</p>
                  </div>
                  <button type="button" onClick={editRespondentDetails}>{copy.fixDetails}</button>
                </div>
              )}

              <div className="review-card">
                <div className="review-card-title">
                  <h2>{copy.respondent}</h2>
                  <button type="button" onClick={editRespondentDetails}>{copy.edit}</button>
                </div>
                <dl className="respondent-summary">
                  <div><dt>{copy.name}</dt><dd className={nameIsInvalid ? "summary-invalid" : ""}>{meta.name || "—"}</dd></div>
                  <div><dt>{copy.role}</dt><dd>{meta.role || "—"}</dd></div>
                  <div><dt>{copy.email}</dt><dd className={emailIsInvalid ? "summary-invalid" : ""} dir="ltr">{meta.email || "—"}</dd></div>
                  <div><dt>{copy.date}</dt><dd>{meta.date || "—"}</dd></div>
                </dl>
              </div>

              <div className="review-card">
                <div className="review-card-title">
                  <div><h2>{copy.surveySummary}</h2><p>{answeredCount} {copy.recorded}</p></div>
                </div>
                <div className="review-sections">
                  {SECTIONS.map((item, index) => (
                    <button type="button" key={item.id} onClick={() => goToSection(index)}>
                      <span className="review-section-number">{String(index + 1).padStart(2, "0")}</span>
                      <strong>{localizedSection(item.name)}</strong>
                      <span>{copy.edit}</span>
                    </button>
                  ))}
                </div>
              </div>

              {submitError && <div className="submission-error" role="alert">{copy.submitError}</div>}
              <div className="review-actions">
                <button type="button" className="button-primary submit-button" onClick={submitQuestionnaire} disabled={submitting}>
                  {submitting ? copy.submitting : copy.submit}
                </button>
                <button type="button" className="button-secondary" onClick={downloadCsv}>{copy.download}</button>
                <button type="button" className="button-quiet" onClick={() => window.print()}>{copy.print}</button>
              </div>
            </section>
          )}

          {mode === "success" && (
            <section className="success-view">
              <div className="success-mark"><CheckIcon /></div>
              <span className="eyebrow">{copy.successKicker}</span>
              <h1>{copy.successTitle}</h1>
              <p>{copy.successCopy}</p>
              <div className="reference-box"><span>{copy.reference}</span><strong dir="ltr">{reference}</strong></div>
              <div className="success-actions">
                <button type="button" className="button-primary" onClick={downloadCsv}>{copy.download}</button>
                <button type="button" className="button-secondary" onClick={() => setMode("review")}>{copy.backToAnswers}</button>
              </div>
            </section>
          )}
        </main>
      </div>

      <footer className="site-footer">
        <Image src="/assets/logicca_logo.png" alt="LOGICCA" width={100} height={30} />
        <span>© {new Date().getFullYear()} LOGICCA</span>
      </footer>
    </div>
  );
}
