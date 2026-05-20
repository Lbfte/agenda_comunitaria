import { useNavigate } from "react-router";

export type CalendarGridProps = {
  month: number;
  year: number;
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  calView: "month" | "week";
  eventDays: Record<number, boolean>;
};

const dayHeaders = ["D", "S", "T", "Q", "Q", "S", "S"];

export function CalendarGrid({ month, year, selectedDay, setSelectedDay, calView, eventDays }: CalendarGridProps) {
  const navigate = useNavigate();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getWeekRows = () => {
    const dayIndex = firstDay + selectedDay - 1;
    const weekStart = dayIndex - (dayIndex % 7);
    return [cells.slice(weekStart, weekStart + 7)];
  };

  const getMonthRows = () => {
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  };

  const rows = calView === "week" ? getWeekRows() : getMonthRows();

  return (
    <div className="px-7 lg:px-0 mb-4">
      <h3 className="text-[16px] text-white mb-2">Março, 2026</h3>

      {/* Day headers */}
      <div className="grid grid-cols-7 rounded-[4px] mb-1" style={{ background: "#222" }}>
        {dayHeaders.map((d, i) => {
          const isTuesday = i === 2;
          return (
            <div key={i} className="flex items-center justify-center h-[33px]">
              {isTuesday ? (
                <div className="w-[21px] h-[20px] rounded-full bg-[#7A8F6B] flex items-center justify-center">
                  <span className="text-[14px] text-[#1c1c1c]">{d}</span>
                </div>
              ) : (
                <span className="text-[14px] text-[rgba(255,255,255,0.57)]">{d}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Day grid */}
      <div className="rounded-[4px]" style={{ background: "#222" }}>
        {rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-7">
            {row.map((day, ci) => {
              if (day === undefined || day === null) {
                return <div key={ci} className="h-[38px]" />;
              }
              const isSelected = day === selectedDay;
              const hasEvent = eventDays[day];
              return (
                <button
                  key={ci}
                  onClick={() => setSelectedDay(day)}
                  className="h-[38px] flex items-center justify-center relative"
                >
                  {hasEvent && isSelected ? (
                    <div className="w-[35px] h-[27px] flex items-center justify-center">
                      <svg width="35" height="27" viewBox="0 0 35 27" fill="none">
                        <path d="M17.5 0L35 27H0L17.5 0Z" fill="#7A8F6B" />
                      </svg>
                      <span className="absolute text-[13px] text-[#1c1c1c]">{day}</span>
                    </div>
                  ) : (
                    <span className="text-[14px] text-[rgba(255,255,255,0.34)]">{day}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* + Tarefas button inside calendar */}
        <div className="flex justify-end px-2 pb-2 pt-1">
          <button
            onClick={() => navigate("/tasks")}
            className="h-[27px] px-4 rounded-[4px] bg-[#7A8F6B] flex items-center gap-1 active:scale-95 transition-transform"
          >
            <span className="text-[20px] text-white leading-none">+</span>
            <span className="text-[13px] text-white">Tarefas</span>
          </button>
        </div>
      </div>
    </div>
  );
}
