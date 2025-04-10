
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
        <Calendar
          mode={mode}
          selected={selected || date}
          onSelect={onSelect || setDate}
          initialFocus={initialFocus}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}
