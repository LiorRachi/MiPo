-- Marks whether an approved request of this type is a full day of missing
-- work (vacation, sick day, ...) or a partial one (יציאה מוקדמת, הגעה
-- מאוחרת) that still needs approval but isn't a whole-day absence.
-- Defaults true so every existing leave type keeps its current meaning.
alter table leave_types
  add column full_day boolean not null default true;
