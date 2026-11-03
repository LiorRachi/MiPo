-- Adds 3 more selectable leave-type colors (see lib/leave/leaveTypeColors.ts
-- and the matching --leave-<key> tokens in app/globals.css).
alter table leave_types drop constraint leave_types_color_key_check;

alter table leave_types
  add constraint leave_types_color_key_check
    check (color_key in ('vacation', 'medical', 'other', 'green', 'teal', 'rose', 'red', 'yellow', 'indigo'));
