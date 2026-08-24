"use client";

import { useMemo, useState } from "react";
import { localized, SECTIONS, setRendererContext } from "@/lib/questionnaire-renderer";

type AdminResponseViewerProps = {
  language: "ar" | "en";
  respondent: Record<string, string>;
  answers: Record<string, string | string[]>;
};

function makeReadOnly(html: string) {
  return html
    .replaceAll("<button ", "<button disabled ")
    .replaceAll("<input ", "<input disabled ")
    .replaceAll("<select ", "<select disabled ")
    .replaceAll("<textarea ", "<textarea disabled ");
}

export function AdminResponseViewer({ language, respondent, answers }: AdminResponseViewerProps) {
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));
  const renderedSections = useMemo(() => {
    setRendererContext(language, { meta: respondent, answers });
    return SECTIONS.map((section) => makeReadOnly(section.render()));
  }, [answers, language, respondent]);

  function toggleSection(index: number) {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function setAll(open: boolean) {
    setOpenSections(open ? new Set(SECTIONS.map((_, index) => index)) : new Set());
  }

  return (
    <section className="admin-response-viewer">
      <div className="admin-response-toolbar">
        <div>
          <h2>تفاصيل الإجابات</h2>
          <p>الاختيارات المحددة هي الإجابات التي أرسلها العميل.</p>
        </div>
        <div>
          <button type="button" onClick={() => setAll(true)}>فتح الكل</button>
          <button type="button" onClick={() => setAll(false)}>إغلاق الكل</button>
        </div>
      </div>

      <div className="admin-answer-sections">
        {SECTIONS.map((section, index) => {
          const isOpen = openSections.has(index);
          return (
            <article className={`admin-answer-section ${isOpen ? "open" : ""}`} key={section.id}>
              <button
                type="button"
                className="admin-answer-section-toggle"
                onClick={() => toggleSection(index)}
                aria-expanded={isOpen}
                aria-controls={`admin-answer-section-${section.id}`}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{localized(section.name, "ar")}</strong>
                <i aria-hidden="true">⌄</i>
              </button>
              {isOpen && (
                <div
                  id={`admin-answer-section-${section.id}`}
                  className="questionnaire-html admin-readonly-questionnaire"
                  dir={language === "ar" ? "rtl" : "ltr"}
                  dangerouslySetInnerHTML={{ __html: renderedSections[index] }}
                />
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
