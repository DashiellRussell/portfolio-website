import { isPlaceholder } from "@/lib/content/audit"

/**
 * Renders content copy, flagging unfilled placeholders in development so they
 * are impossible to miss while writing. In production the marker never renders
 * — the build fails first (see `audit.ts`).
 */
export function Copy({
  text,
  className = "",
  as: Tag = "span",
}: {
  text: string
  className?: string
  as?: "span" | "p" | "h1" | "h2" | "h3"
}) {
  if (isPlaceholder(text)) {
    return (
      <Tag
        className={`${className} border-l-2 border-dashed pl-3 italic`}
        style={{ borderColor: "var(--destructive)", color: "var(--muted-foreground)" }}
        data-placeholder="true"
      >
        <span
          className="label mr-2 not-italic"
          style={{ color: "var(--destructive)" }}
        >
          unwritten
        </span>
        {text.replace(/^TODO:\s*/, "")}
      </Tag>
    )
  }
  return <Tag className={className}>{text}</Tag>
}
