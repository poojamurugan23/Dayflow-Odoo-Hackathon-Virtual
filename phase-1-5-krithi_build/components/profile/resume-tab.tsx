import { SectionEmpty } from "@/components/profile/field-row";
import type { EmployeeDetail } from "@/lib/employees";

/**
 * Resume tab (SRS 3.3.1) — About, What I love about my job, My interests and
 * hobbies, Skills, Certification. Backed by the columns added in 0003.
 *
 * `canEdit` only changes the wording of the empty states: it invites the owner
 * to write something and tells everyone else there is nothing there yet.
 */
export function ResumeTab({
  employee,
  canEdit,
  isSelf,
}: {
  employee: EmployeeDetail;
  canEdit: boolean;
  isSelf: boolean;
}) {
  const firstName = employee.fullName.split(" ")[0];
  const who = isSelf ? "You haven't" : `${firstName} hasn't`;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <Section title="About">
          <Prose
            value={employee.about}
            empty={`${who} written a bio yet.`}
            hint={canEdit ? "Add one from Edit." : undefined}
          />
        </Section>

        <Section title="What I love about my job">
          <Prose value={employee.jobLove} empty={`${who} filled this in yet.`} />
        </Section>

        <Section title="My interests and hobbies">
          <Prose value={employee.interests} empty={`${who} filled this in yet.`} />
        </Section>
      </div>

      <div className="space-y-6">
        <Section title="Skills">
          <Chips
            items={employee.skills}
            empty={`No skills added yet.`}
            hint={canEdit ? "Add skills from Edit." : undefined}
          />
        </Section>

        <Section title="Certification">
          <Chips items={employee.certifications} empty="No certifications added yet." />
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

function Prose({
  value,
  empty,
  hint,
}: {
  value: string | null;
  empty: string;
  hint?: string;
}) {
  if (!value) {
    return (
      <SectionEmpty>
        {empty}
        {hint && <span className="mt-1 block text-xs text-muted-foreground/70">{hint}</span>}
      </SectionEmpty>
    );
  }
  return <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{value}</p>;
}

function Chips({ items, empty, hint }: { items: string[]; empty: string; hint?: string }) {
  if (items.length === 0) {
    return (
      <SectionEmpty>
        {empty}
        {hint && <span className="mt-1 block text-xs text-muted-foreground/70">{hint}</span>}
      </SectionEmpty>
    );
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
