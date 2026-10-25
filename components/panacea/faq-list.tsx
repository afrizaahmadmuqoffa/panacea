"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function FaqList({ items }: { items: Array<{ q: string; a: string }> }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="faq-list">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <article key={item.q} className={`faq-item ${isOpen ? "is-open" : ""}`}>
            <h3>
              <button
                type="button"
                className="faq-question"
                aria-expanded={isOpen}
                aria-controls={`faq-a${index}`}
                id={`faq-q${index}`}
                onClick={() => setOpen(isOpen ? -1 : index)}
              >
                {item.q}
                <ChevronDown
                  aria-hidden="true"
                  style={{
                    width: 18,
                    height: 18,
                    flexShrink: 0,
                    transition: "transform .2s ease",
                    transform: isOpen ? "rotate(180deg)" : undefined,
                  }}
                />
              </button>
            </h3>
            <div
              className="faq-answer"
              id={`faq-a${index}`}
              role="region"
              aria-labelledby={`faq-q${index}`}
              hidden={!isOpen}
            >
              <p>{item.a}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
