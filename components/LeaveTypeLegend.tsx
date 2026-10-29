import type { LeaveType } from "@/lib/leave";

export default function LeaveTypeLegend({
  leaveTypes,
  className,
}: {
  leaveTypes: LeaveType[];
  className: string;
}) {
  return (
    <div className={className}>
      {leaveTypes.map((lt) => (
        <span key={lt.id}>
          <span className={`dot ${lt.color_key}`} />
          {lt.label_he}
        </span>
      ))}
    </div>
  );
}
