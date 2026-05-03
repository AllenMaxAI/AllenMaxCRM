"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval 
} from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

export interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date) => void
  className?: string
}

export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date())

  const nextMonth = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const prevMonth = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  const weekDays = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"]

  return (
    <div className={cn("p-6 bg-white dark:bg-slate-900 select-none relative z-[101]", className)} onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-2">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-slate-100">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all border-none cursor-pointer pointer-events-auto"
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all border-none cursor-pointer pointer-events-auto"
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 mb-4">
        {weekDays.map((day) => (
          <div key={day} className="text-center">
            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-500">
              {day}
            </span>
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          const isSelected = selected && isSameDay(day, selected)
          const isCurrentMonth = isSameMonth(day, monthStart)
          const isToday = isSameDay(day, new Date())

          return (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (isCurrentMonth) {
                  onSelect?.(day)
                }
              }}
              style={{ cursor: isCurrentMonth ? 'pointer' : 'default', pointerEvents: 'auto' }}
              className={cn(
                "h-11 w-11 flex items-center justify-center rounded-2xl text-sm font-bold transition-all relative group cursor-pointer pointer-events-auto border-none outline-none",
                !isCurrentMonth && "text-slate-200 dark:text-slate-700 opacity-20 cursor-default",
                isCurrentMonth && "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
                isSelected && "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 z-10",
                isToday && !isSelected && "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10"
              )}
            >
              {format(day, "d")}
              {isToday && !isSelected && (
                <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-blue-600" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
