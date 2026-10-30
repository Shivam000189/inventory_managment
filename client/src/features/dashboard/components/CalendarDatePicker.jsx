import { useState, useRef, useEffect, useMemo, useCallback } from "react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function CalendarDatePicker({ onSelectDate }) {
  const [isOpen, setIsOpen] = useState(false);
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [viewDate, setViewDate] = useState(() => new Date());
  const [preset, setPreset] = useState("today");
  const pickerRef = useRef(null);

  // Close on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const formatDateDisplay = useCallback((date) => {
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, []);

  const triggerLabel = useMemo(() => {
    const isToday =
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear();

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const isYesterday =
      selectedDate.getDate() === yesterday.getDate() &&
      selectedDate.getMonth() === yesterday.getMonth() &&
      selectedDate.getFullYear() === yesterday.getFullYear();

    if (preset === "7days") return "Last 7 Days";
    if (preset === "this_month") return `This Month (${MONTH_NAMES[today.getMonth()].slice(0, 3)})`;
    if (isToday) return `Today, ${formatDateDisplay(selectedDate)}`;
    if (isYesterday) return `Yesterday, ${formatDateDisplay(selectedDate)}`;
    return formatDateDisplay(selectedDate);
  }, [selectedDate, today, preset, formatDateDisplay]);

  // Navigate months
  const handlePrevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Preset handlers
  const handleSelectPreset = (key) => {
    setPreset(key);
    if (key === "today") {
      const now = new Date();
      setSelectedDate(now);
      setViewDate(now);
      onSelectDate?.({ preset: "today", date: now });
    } else if (key === "yesterday") {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      setSelectedDate(yest);
      setViewDate(yest);
      onSelectDate?.({ preset: "yesterday", date: yest });
    } else if (key === "7days") {
      const now = new Date();
      setSelectedDate(now);
      onSelectDate?.({ preset: "7days", date: now });
    } else if (key === "this_month") {
      const now = new Date();
      setSelectedDate(now);
      setViewDate(now);
      onSelectDate?.({ preset: "this_month", date: now });
    }
  };

  // Day click handler
  const handleSelectDay = (day, isCurrentMonth) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + (isCurrentMonth ? 0 : day > 15 ? -1 : 1), day);
    setSelectedDate(newDate);

    // Detect if today or yesterday
    const isToday =
      newDate.getDate() === today.getDate() &&
      newDate.getMonth() === today.getMonth() &&
      newDate.getFullYear() === today.getFullYear();

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const isYesterday =
      newDate.getDate() === yesterday.getDate() &&
      newDate.getMonth() === yesterday.getMonth() &&
      newDate.getFullYear() === yesterday.getFullYear();

    if (isToday) setPreset("today");
    else if (isYesterday) setPreset("yesterday");
    else setPreset("custom");

    onSelectDate?.({ preset: isToday ? "today" : "custom", date: newDate });
  };

  // Calendar matrix calculation
  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells = [];

    // Prev month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        key: `prev-${daysInPrevMonth - i}`,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        isCurrentMonth: true,
        key: `curr-${d}`,
      });
    }

    // Next month days to fill 42 cells (6 rows)
    const remaining = 42 - cells.length;
    for (let n = 1; n <= remaining; n++) {
      cells.push({
        day: n,
        isCurrentMonth: false,
        key: `next-${n}`,
      });
    }

    return cells;
  }, [viewDate]);

  return (
    <div className="overview-date-picker-wrap" ref={pickerRef}>
      <button
        type="button"
        className={`overview-date-selector ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="Click to change date or view calendar"
      >
        <span>{triggerLabel}</span>
        <svg
          className={`overview-date-chevron ${isOpen ? "rotate" : ""}`}
          viewBox="0 0 20 20"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 8 4 4 4-4" />
        </svg>
      </button>

      {isOpen && (
        <div className="overview-calendar-popover" role="dialog" aria-label="Calendar date selector">
          {/* Quick Presets */}
          <div className="calendar-presets">
            <button
              type="button"
              className={`calendar-preset-btn ${preset === "today" ? "active" : ""}`}
              onClick={() => handleSelectPreset("today")}
            >
              Today
            </button>
            <button
              type="button"
              className={`calendar-preset-btn ${preset === "yesterday" ? "active" : ""}`}
              onClick={() => handleSelectPreset("yesterday")}
            >
              Yesterday
            </button>
            <button
              type="button"
              className={`calendar-preset-btn ${preset === "7days" ? "active" : ""}`}
              onClick={() => handleSelectPreset("7days")}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              className={`calendar-preset-btn ${preset === "this_month" ? "active" : ""}`}
              onClick={() => handleSelectPreset("this_month")}
            >
              This Month
            </button>
          </div>

          {/* Month & Year Navigation */}
          <div className="calendar-month-nav">
            <button
              type="button"
              className="calendar-nav-arrow"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              title="Previous month"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            <span className="calendar-month-title">
              {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>

            <button
              type="button"
              className="calendar-nav-arrow"
              onClick={handleNextMonth}
              aria-label="Next month"
              title="Next month"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Day of Week Labels */}
          <div className="calendar-weekdays">
            {WEEKDAYS.map((wd) => (
              <span key={wd}>{wd}</span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="calendar-days-grid">
            {calendarCells.map((cell) => {
              const cellDate = new Date(
                viewDate.getFullYear(),
                viewDate.getMonth() + (cell.isCurrentMonth ? 0 : cell.day > 15 ? -1 : 1),
                cell.day
              );

              const isSelected =
                cellDate.getDate() === selectedDate.getDate() &&
                cellDate.getMonth() === selectedDate.getMonth() &&
                cellDate.getFullYear() === selectedDate.getFullYear();

              const isToday =
                cellDate.getDate() === today.getDate() &&
                cellDate.getMonth() === today.getMonth() &&
                cellDate.getFullYear() === today.getFullYear();

              return (
                <button
                  key={cell.key}
                  type="button"
                  className={`calendar-day-cell ${
                    !cell.isCurrentMonth ? "other-month" : ""
                  } ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectDay(cell.day, cell.isCurrentMonth)}
                  title={`${cell.day} ${MONTH_NAMES[cellDate.getMonth()]} ${cellDate.getFullYear()}`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Footer with Selected Date and Done button */}
          <div className="calendar-footer">
            <span className="calendar-selected-label">
              {formatDateDisplay(selectedDate)}
            </span>
            <div className="calendar-footer-actions">
              <button
                type="button"
                className="calendar-footer-btn today"
                onClick={() => handleSelectPreset("today")}
              >
                Reset
              </button>
              <button
                type="button"
                className="calendar-footer-btn apply"
                onClick={() => setIsOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

