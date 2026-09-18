/**
 * Learn (§7.15). Rendered from the same table the answer engine uses, so a definition shown here
 * and a definition returned by a question can never disagree.
 */
import { Link, useParams } from "react-router-dom";

import { CONCEPTS, CONCEPT_TERMS, categoryCopy, resolveConcept } from "../copy";
import { AppShell, Section } from "../components/shell";

export function LearnIndexPage() {
  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink">Learn</h1>
      <p className="prose-column mt-2 text-sm text-muted">
        These definitions are vetted text stored with the product. They are answered without a model
        call, so the interface and the answer engine always agree.
      </p>
      <Section title="Terms">
        <ul className="flex flex-col gap-2">
          {CONCEPT_TERMS.map((term) => (
            <li key={term}>
              <Link to={`/learn/${encodeURIComponent(term)}`}>{term}</Link>
            </li>
          ))}
        </ul>
      </Section>
    </AppShell>
  );
}

export function LearnTermPage() {
  const { term = "" } = useParams();
  const resolved = resolveConcept(decodeURIComponent(term));
  const entry = resolved ? CONCEPTS[resolved] : undefined;

  if (!entry || !resolved) {
    return (
      <AppShell>
        <h1 className="text-xl font-semibold text-ink">We don't have that term</h1>
        <p className="prose-column mt-2 text-sm text-muted">
          Nothing in the glossary matches “{term}”. Rather than paraphrase an answer we don't have,
          here is the list of terms we do.
        </p>
        <p className="mt-2">
          <Link to="/learn">All terms</Link>
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink">{resolved}</h1>
      <p className="prose-column mt-3 text-sm text-ink">{entry.definition}</p>
      {entry.categories.length > 0 ? (
        <Section title="Findings this explains">
          <ul className="flex flex-col gap-1 text-sm">
            {entry.categories.map((category) => (
              <li key={category}>{categoryCopy(category).label}</li>
            ))}
          </ul>
        </Section>
      ) : null}
      <p className="mt-4 text-sm">
        <Link to="/learn">All terms</Link>
      </p>
    </AppShell>
  );
}
