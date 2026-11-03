import { auditActionCategory, type AuditActionCategory, type AuditLogEntry } from "@/lib/auth/auditLog";
import { formatShortDateHe, toIsraelDate } from "@/lib/utils/date";

const ACTION_LABELS: Record<string, string> = {
  "leave_type.create": "יצירת סוג בקשת יציאה",
  "leave_type.update": "עריכת סוג בקשת יציאה",
  "leave_type.delete": "מחיקת סוג בקשת יציאה",
  "user.create": "יצירת משתמש/ת",
  "user.update": "עריכת משתמש/ת",
  "user.delete": "מחיקת משתמש/ת",
};

const DETAIL_FIELD_LABELS: Record<string, string> = {
  label_he: "שם",
  display_name: "שם",
  email: "אימייל",
  role: "תפקיד",
};

function ActionIcon({ category }: { category: AuditActionCategory }) {
  if (category === "create") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    );
  }
  if (category === "delete") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  );
}

function formatDetailValue(key: string, value: unknown): string {
  if (key === "role") return value === "admin" ? "מנהל/ת" : "עובד/ת";
  return String(value);
}

function summarizeDetail(detail: Record<string, unknown> | null): string {
  if (!detail) return "";
  return Object.entries(detail)
    .filter(([key]) => key in DETAIL_FIELD_LABELS)
    .map(([key, value]) => `${DETAIL_FIELD_LABELS[key]}: ${formatDetailValue(key, value)}`)
    .join(" · ");
}

export default function AuditLogList({ entries }: { entries: AuditLogEntry[] }) {
  return (
    <div className="audit-log-list">
      {entries.map((entry) => {
        const category = auditActionCategory(entry.action);
        const detail = summarizeDetail(entry.detail);
        return (
          <div key={entry.id} className="audit-log-row">
            <span className={`audit-log-icon ${category}`}>
              <ActionIcon category={category} />
            </span>
            <div className="audit-log-body">
              <div className="audit-log-row-head">
                <span className="audit-log-action">
                  {ACTION_LABELS[entry.action] ?? entry.action}
                </span>
                <span className="audit-log-time">{formatShortDateHe(toIsraelDate(entry.created_at))}</span>
              </div>
              <div className="audit-log-meta">
                {entry.actor_name}
                {detail && ` · ${detail}`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
