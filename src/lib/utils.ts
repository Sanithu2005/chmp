import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ageLabel(dob: string | Date): string {
  const birth = new Date(dob);
  const now = new Date();

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthDays;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;

  const parts: string[] = [];

  if (years > 0) parts.push(`${years} year${years !== 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} month${months !== 1 ? "s" : ""}`);
  if (weeks > 0) parts.push(`${weeks} week${weeks !== 1 ? "s" : ""}`);
  if (remainingDays > 0) parts.push(`${remainingDays} day${remainingDays !== 1 ? "s" : ""}`);

  if (parts.length === 0) return "Newborn";

  return parts.join(", ");
}

export type ComputedVaccinationStatus = "upcoming" | "due_this_week" | "overdue" | "administered";

export function computeVaccinationStatus(
  dueDate: string,
  administeredDate: string | null,
): ComputedVaccinationStatus {
  if (administeredDate) return "administered";

  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (diffDays <= 7) return "due_this_week";
  return "upcoming";
}
