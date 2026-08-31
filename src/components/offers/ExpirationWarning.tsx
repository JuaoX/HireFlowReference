import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock } from "lucide-react";
import { differenceInDays, isPast, isToday, isTomorrow } from "date-fns";

interface ExpirationWarningProps {
  expiresAt: string | null | undefined;
  state: string;
}

export const ExpirationWarning = ({ expiresAt, state }: ExpirationWarningProps) => {
  if (!expiresAt || state === "accepted" || state === "declined" || state === "expired") {
    return null;
  }

  const expirationDate = new Date(expiresAt);
  const daysUntilExpiry = differenceInDays(expirationDate, new Date());

  if (isPast(expirationDate)) {
    return (
      <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <div>
          <p className="text-sm font-medium text-destructive">This offer has expired</p>
          <p className="text-xs text-destructive/80">Expired on {expirationDate.toLocaleDateString()}</p>
        </div>
      </div>
    );
  }

  if (isToday(expirationDate)) {
    return (
      <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <div>
          <p className="text-sm font-medium text-destructive">Expires today</p>
          <p className="text-xs text-destructive/80">This offer will expire at the end of the day</p>
        </div>
      </div>
    );
  }

  if (isTomorrow(expirationDate)) {
    return (
      <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
        <AlertCircle className="h-4 w-4 text-orange-500" />
        <div>
          <p className="text-sm font-medium text-orange-500">Expires tomorrow</p>
          <p className="text-xs text-orange-500/80">Action required soon</p>
        </div>
      </div>
    );
  }

  if (daysUntilExpiry <= 7) {
    return (
      <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <Clock className="h-4 w-4 text-yellow-500" />
        <div>
          <p className="text-sm font-medium text-yellow-500">
            Expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? "day" : "days"}
          </p>
          <p className="text-xs text-yellow-500/80">Consider following up with the candidate</p>
        </div>
      </div>
    );
  }

  return null;
};

export const ExpirationBadge = ({ expiresAt, state }: ExpirationWarningProps) => {
  if (!expiresAt || state === "accepted" || state === "declined") {
    return null;
  }

  const expirationDate = new Date(expiresAt);
  const daysUntilExpiry = differenceInDays(expirationDate, new Date());

  if (isPast(expirationDate)) {
    return <Badge variant="destructive">Expired</Badge>;
  }

  if (daysUntilExpiry <= 3) {
    return <Badge variant="destructive">Expires in {daysUntilExpiry}d</Badge>;
  }

  if (daysUntilExpiry <= 7) {
    return <Badge variant="secondary">Expires in {daysUntilExpiry}d</Badge>;
  }

  return null;
};
