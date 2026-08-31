import { useEffect } from "react";
import { Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TimePickerAMPMProps {
  value: string; // 24-hour format "HH:mm"
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TimePickerAMPM({ value, onChange, disabled, className }: TimePickerAMPMProps) {
  // Parse 24-hour format to 12-hour format
  const parseTime = (time24: string) => {
    if (!time24 || !time24.includes(":")) {
      return { hours: "9", minutes: "00", period: "AM" };
    }
    const [hours24, minutes] = time24.split(":").map(Number);
    const period = hours24 >= 12 ? "PM" : "AM";
    let hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;
    return { hours: hours12.toString(), minutes: minutes.toString().padStart(2, "0"), period };
  };

  // Convert 12-hour format back to 24-hour format
  const toTime24 = (hours: string, minutes: string, period: string) => {
    let hours24 = parseInt(hours);
    if (period === "PM" && hours24 !== 12) hours24 += 12;
    if (period === "AM" && hours24 === 12) hours24 = 0;
    return `${hours24.toString().padStart(2, "0")}:${minutes}`;
  };

  // Set initial value if empty
  useEffect(() => {
    if (!value || !value.includes(":")) {
      onChange("09:00");
    }
  }, []);

  const { hours, minutes, period } = parseTime(value);

  const handleHourChange = (newHour: string) => {
    onChange(toTime24(newHour, minutes, period));
  };

  const handleMinuteChange = (newMinute: string) => {
    onChange(toTime24(hours, newMinute, period));
  };

  const handlePeriodChange = (newPeriod: string) => {
    onChange(toTime24(hours, minutes, newPeriod));
  };

  const hourOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1 flex-1">
        <Select value={hours} onValueChange={handleHourChange} disabled={disabled}>
          <SelectTrigger className="w-[70px]">
            <SelectValue placeholder="Hr" />
          </SelectTrigger>
          <SelectContent>
            {hourOptions.map((hour) => (
              <SelectItem key={hour} value={hour}>
                {hour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">:</span>
        <Select value={minutes} onValueChange={handleMinuteChange} disabled={disabled}>
          <SelectTrigger className="w-[70px]">
            <SelectValue placeholder="Min" />
          </SelectTrigger>
          <SelectContent>
            {minuteOptions.map((min) => (
              <SelectItem key={min} value={min}>
                {min}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={handlePeriodChange} disabled={disabled}>
          <SelectTrigger className="w-[75px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Clock className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
