const dayHeaders = ["D", "S", "T", "Q", "Q", "S", "S"];
const days = [15, 16, 17, 18, 19, 20];
const hours = ["0:00", "1:00", "2:00", "3:00", "4:00"];

export function WeekCalendar() {
  return (
    <div className="hidden lg:flex flex-1 flex-col h-full overflow-auto p-6 pt-24">
      {/* Header row: day labels */}
      <div
        className="grid rounded-t-[6px] border-b border-[#2a2a2a]"
        style={{ background: "#222", gridTemplateColumns: "70px repeat(6, 1fr)" }}
      >
        <div className="h-[48px] flex items-center justify-center">
          <span className="text-[14px] text-[rgba(255,255,255,0.35)]">D</span>
        </div>
        {dayHeaders.slice(0, 6).map((d, i) => {
          const isTuesday = i === 1;
          return (
            <div key={i} className="h-[48px] flex items-center justify-center border-l border-[#2a2a2a]">
              {isTuesday ? (
                <div className="w-[22px] h-[22px] rounded-full bg-[#7A8F6B] flex items-center justify-center">
                  <span className="text-[13px] text-[#1c1c1c]">{d}</span>
                </div>
              ) : (
                <span className="text-[14px] text-[rgba(255,255,255,0.45)]">{d}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Day numbers row */}
      <div
        className="grid border-b border-[#2a2a2a]"
        style={{ background: "rgba(34,34,34,0.6)", gridTemplateColumns: "70px repeat(6, 1fr)" }}
      >
        <div className="h-[60px] flex items-center justify-center">
          <span className="text-[14px] text-[rgba(255,255,255,0.45)]">H</span>
        </div>
        {days.map((d) => {
          const isMarked = d === 17;
          return (
            <div
              key={d}
              className="h-[60px] flex items-center justify-center border-l border-[#2a2a2a] relative"
            >
              {isMarked ? (
                <div className="relative w-[36px] h-[28px] flex items-center justify-center">
                  <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
                    <path d="M18 0L36 28H0L18 0Z" fill="#7A8F6B" />
                  </svg>
                  <span className="absolute text-[13px] text-[#1c1c1c]">{d}</span>
                </div>
              ) : (
                <span className="text-[16px] text-[rgba(255,255,255,0.7)]">{d}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Hour rows */}
      <div className="flex-1 flex flex-col">
        {hours.map((h, hi) => (
          <div
            key={h}
            className="grid flex-1 border-b border-[#2a2a2a] min-h-[76px]"
            style={{ gridTemplateColumns: "70px repeat(6, 1fr)" }}
          >
            <div className="flex items-center justify-center">
              <span className="text-[14px] text-[rgba(255,255,255,0.5)]">{h}</span>
            </div>
            {days.map((d) => (
              <div key={d} className="border-l border-[#2a2a2a] relative">
                {/* Event "aniversario" at d=16 hi=0 */}
                {d === 16 && hi === 0 && (
                  <div className="absolute inset-x-2 top-2 rounded-[4px] px-2 py-1.5" style={{ background: "rgba(122,143,107,0.55)" }}>
                    <p className="text-[11px] text-white leading-tight">aniversario..</p>
                    <p className="text-[8px] text-[rgba(255,255,255,0.7)] leading-tight">0:00-23:59</p>
                  </div>
                )}
                {/* Subtle triangle decorations */}
                {(d + hi) % 3 === 0 && (
                  <svg
                    className="absolute opacity-[0.08]"
                    style={{ top: "20%", left: "30%" }}
                    width="40"
                    height="32"
                    viewBox="0 0 40 32"
                    fill="none"
                  >
                    <path d="M20 0L40 32H0L20 0Z" fill="#7A8F6B" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
