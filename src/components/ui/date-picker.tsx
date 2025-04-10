
import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  setDate: (date?: Date) => void
  mode?: "single" | "range" | "multiple"
  selected?: Date | Date[] | undefined
  onSelect?: (date?: Date | Date[]) => void 
  disabled?: boolean
  initialFocus?: boolean
}

export function DatePicker({
  date,
  setDate,
  mode = "single",
  selected,
  onSelect,
  disabled,
  initialFocus,
}: DatePickerProps) {
  // Function to handle the calendar's onSelect based on the mode
  const handleSelect = (value: Date | Date[] | undefined) => {
    if (onSelect) {
      onSelect(value);
    } else if (setDate) {
      // For single mode, we know value is a Date or undefined
      if (mode === "single") {
        setDate(value as Date | undefined);
      }
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        {mode === "single" && (
          <Calendar
            mode="single"
            selected={selected as Date || date}
            onSelect={handleSelect}
            initialFocus={initialFocus}
            disabled={disabled}
            className="pointer-events-auto"
          />
        )}
        {mode === "range" && (
          <Calendar
            mode="range"
            selected={selected as Date[] || (date ? [date] : undefined)}
            onSelect={handleSelect}
            initialFocus={initialFocus}
            disabled={disabled}
            className="pointer-events-auto"
          />
        )}
        {mode === "multiple" && (
          <Calendar
            mode="multiple"
            selected={selected as Date[] || (date ? [date] : undefined)}
            onSelect={handleSelect}
            initialFocus={initialFocus}
            disabled={disabled}
            className="pointer-events-auto"
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
