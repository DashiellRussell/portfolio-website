import type { Role } from "@/lib/content/types"
import { roleRange } from "@/lib/content/experiences"
import { Copy } from "./copy"

/**
 * Role progression within one organisation.
 *
 * Modelled on how a CV shows promotion: a single organisation with its
 * positions nested beneath it on one spine, newest first. Showing intern and
 * engineer as separate top-level entries would lose exactly the thing worth
 * showing — that it was a promotion.
 */
export function RoleTimeline({ roles }: { roles: Role[] }) {
  return (
    <ol className="relative">
      {/* The spine. Stops short of the last marker so it does not dangle. */}
      <span
        aria-hidden="true"
        className="absolute left-[5px] top-2 w-px"
        style={{ bottom: "1.5rem", background: "var(--border-strong)" }}
      />

      {roles.map((role, i) => {
        const current = role.end === null
        return (
          <li key={`${role.title}-${role.start}`} className="relative pl-8 pb-10 last:pb-0">
            {/* Marker. The current role is filled with the live accent. */}
            <span
              aria-hidden="true"
              className="absolute left-0 top-1.5 flex h-[11px] w-[11px] items-center justify-center rounded-full border"
              style={{
                borderColor: current ? "var(--accent)" : "var(--border-strong)",
                background: current ? "var(--accent)" : "var(--background)",
              }}
            />

            <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <Copy
                as="h3"
                text={role.title}
                className="text-[length:var(--step-1)] font-medium leading-snug"
              />
              {current ? <span className="label label-accent">Current</span> : null}
            </div>

            <p className="label mb-4">{roleRange(role)}</p>

            {role.bullets.length > 0 ? (
              <ul className="space-y-2">
                {role.bullets.map((b, j) => (
                  <li key={j} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-[0.7em] h-px w-3 shrink-0"
                      style={{ background: "var(--border-strong)" }}
                    />
                    <Copy
                      as="span"
                      text={b}
                      className="leading-relaxed text-[var(--muted-foreground)]"
                    />
                  </li>
                ))}
              </ul>
            ) : null}

            {/* Suppress a hanging index for the sole role in an org. */}
            {roles.length > 1 ? (
              <span className="sr-only">
                Position {roles.length - i} of {roles.length}
              </span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
