"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AuditActionCategory, AuditResourceType } from "@/lib/auth/auditLog";

export default function AuditLogFilters({
  actors,
  action,
  resource,
  actor,
  sort,
}: {
  actors: string[];
  action: AuditActionCategory | "";
  resource: AuditResourceType | "";
  actor: string;
  sort: "asc" | "desc";
}) {
  const router = useRouter();
  const hasActiveFilters = Boolean(action || resource || actor);
  const [expanded, setExpanded] = useState(hasActiveFilters);

  // Draft values the selects edit locally — nothing is applied (no
  // navigation/refetch) until "החל סננים" is pressed, so browsing through
  // options doesn't refilter the list on every single change.
  const [draftAction, setDraftAction] = useState(action);
  const [draftResource, setDraftResource] = useState(resource);
  const [draftActor, setDraftActor] = useState(actor);
  const [draftSort, setDraftSort] = useState(sort);

  // Re-sync the draft when the applied filters change from outside this
  // component (Reset, browser back/forward) — adjusting state during render
  // rather than in an effect, per https://react.dev/learn/you-might-not-need-an-effect.
  const [prevApplied, setPrevApplied] = useState({ action, resource, actor, sort });
  if (
    prevApplied.action !== action ||
    prevApplied.resource !== resource ||
    prevApplied.actor !== actor ||
    prevApplied.sort !== sort
  ) {
    setPrevApplied({ action, resource, actor, sort });
    setDraftAction(action);
    setDraftResource(resource);
    setDraftActor(actor);
    setDraftSort(sort);
  }

  const isDirty =
    draftAction !== action || draftResource !== resource || draftActor !== actor || draftSort !== sort;

  function applyFilters() {
    const params = new URLSearchParams();
    if (draftAction) params.set("action", draftAction);
    if (draftResource) params.set("resource", draftResource);
    if (draftActor) params.set("actor", draftActor);
    params.set("sort", draftSort);
    // Replace, not push — applying filters shouldn't add a history entry,
    // or the back button just undoes filter changes instead of leaving the
    // page.
    router.replace(`/settings/audit-log?${params.toString()}`);
  }

  function resetFilters() {
    router.replace("/settings/audit-log");
  }

  return (
    <div className="audit-log-filters-card">
      <button
        type="button"
        className="audit-log-filters-toggle"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <span className="audit-log-filters-toggle-label">
          סינון
          {hasActiveFilters && (
            <span className="audit-log-filters-count">
              {[action, resource, actor].filter(Boolean).length}
            </span>
          )}
        </span>
        <span className={`audit-log-filters-chevron${expanded ? " open" : ""}`}>›</span>
      </button>

      {expanded && (
        <div className="overview-filters audit-log-filters">
          <div className="field">
            <label htmlFor="audit-action">סוג פעולה</label>
            <select
              id="audit-action"
              className={draftAction ? "filter-active" : undefined}
              value={draftAction}
              onChange={(e) => setDraftAction(e.target.value as AuditActionCategory | "")}
            >
              <option value="">הכול</option>
              <option value="create">יצירה</option>
              <option value="update">עריכה</option>
              <option value="delete">מחיקה</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="audit-resource">סוג רכיב</label>
            <select
              id="audit-resource"
              className={draftResource ? "filter-active" : undefined}
              value={draftResource}
              onChange={(e) => setDraftResource(e.target.value as AuditResourceType | "")}
            >
              <option value="">הכול</option>
              <option value="leave_type">סוגי בקשות יציאה</option>
              <option value="user">משתמשים</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="audit-actor">בוצע ע״י</label>
            <select
              id="audit-actor"
              className={draftActor ? "filter-active" : undefined}
              value={draftActor}
              onChange={(e) => setDraftActor(e.target.value)}
            >
              <option value="">כולם</option>
              {actors.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>מיון</label>
            <button
              type="button"
              className="btn ghost small sort-toggle"
              onClick={() => setDraftSort((s) => (s === "desc" ? "asc" : "desc"))}
            >
              {draftSort === "desc" ? "חדש לישן" : "ישן לחדש"}
            </button>
          </div>
          <div className="audit-log-filters-actions">
            <button
              type="button"
              className={`btn small${isDirty ? " active" : " ghost"}`}
              onClick={applyFilters}
              disabled={!isDirty}
            >
              החל סננים
            </button>
            <button
              type="button"
              className={`btn small filters-reset${hasActiveFilters ? " active" : " ghost"}`}
              onClick={resetFilters}
              disabled={!hasActiveFilters}
            >
              איפוס סינון
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
