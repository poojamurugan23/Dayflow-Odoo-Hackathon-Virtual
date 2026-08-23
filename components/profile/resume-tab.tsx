import { SectionEmpty } from "@/components/profile/field-row";

/**
 * Resume tab (SRS 3.3.1).
 *
 * The schema has no columns for these sections yet — `profiles` and
 * `private_info` carry no about/interests/skills/certification fields — so this
 * renders the structure from the wireframe with honest empty states rather than
 * inventing storage for it. Persisting resume content needs a schema change and
 * is not in this phase's scope.
 */
export function ResumeTab({ fullName }: { fullName: string }) {
  const firstName = fullName.split(" ")[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <Section title="About">
          <SectionEmpty>Nothing here yet — {firstName} hasn&apos;t written a bio.</SectionEmpty>
        </Section>

        <Section title="What I love about my job">
          <SectionEmpty>Not filled in yet.</SectionEmpty>
        </Section>

        <Section title="My interests and hobbies">
          <SectionEmpty>Not filled in yet.</SectionEmpty>
        </Section>
      </div>

      <div className="space-y-6">
        <Section title="Skills">
          <SectionEmpty>No skills added yet.</SectionEmpty>
        </Section>

        <Section title="Certification">
          <SectionEmpty>No certifications added yet.</SectionEmpty>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}
