"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createAppointment } from "@/lib/actions";
import { useRouter } from "next/navigation";

type Patient = { id: string; name: string };
type Doctor = { id: string; name: string; email: string };

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function AddAppointmentModal({
  children,
  userRole,
  patients,
  defaultPatientId,
}: {
  children: React.ReactNode;
  userRole: string;
  patients: Patient[];
  defaultPatientId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<Doctor[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function fetchSlots(doctorId: string, date: string) {
    if (!doctorId || !date) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/available-slots?doctorId=${doctorId}&date=${date}`);
      const data = await res.json();
      setAvailableSlots(data.slots ?? []);
      setSelectedSlot("");
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => {
    if (debouncedQuery.trim().length === 0) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setSearching(true);
    fetch(`/api/pediatricians/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        setSearchResults(data.doctors ?? []);
        setShowDropdown(true);
      })
      .catch(() => {
        setSearchResults([]);
        setShowDropdown(false);
      })
      .finally(() => setSearching(false));
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelectDoctor(doctor: Doctor) {
    setSelectedDoctor(doctor);
    setSearchQuery(doctor.name);
    setShowDropdown(false);
    setAvailableSlots([]);
    setSelectedSlot("");
    if (selectedDate) {
      fetchSlots(doctor.id, selectedDate);
    }
  }

  function handleDateChange(date: string) {
    setSelectedDate(date);
    setAvailableSlots([]);
    setSelectedSlot("");
    if (selectedDoctor && date) {
      fetchSlots(selectedDoctor.id, date);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    formData.set("time", selectedSlot);
    if (selectedDoctor) {
      formData.set("doctorId", selectedDoctor.id);
    }
    try {
      await createAppointment(formData);
      setOpen(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create appointment");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="patientId">Child</Label>
            <select
              id="patientId"
              name="patientId"
              required
              className={selectClass}
              defaultValue={defaultPatientId || ""}
            >
              <option value="">Select child</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div ref={searchRef} className="relative">
            <Label htmlFor="doctorSearch">Pediatrician</Label>
            <input
              id="doctorSearch"
              type="text"
              placeholder="Search pediatricians by name..."
              required
              className={selectClass}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (selectedDoctor && e.target.value !== selectedDoctor.name) {
                  setSelectedDoctor(null);
                }
                setAvailableSlots([]);
                setSelectedSlot("");
              }}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              autoComplete="off"
            />
            {showDropdown && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-60 overflow-auto">
                {searching ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No pediatricians found.
                  </div>
                ) : (
                  searchResults.map((doctor) => (
                    <button
                      key={doctor.id}
                      type="button"
                      onClick={() => handleSelectDoctor(doctor)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <div className="font-medium">{doctor.name}</div>
                      <div className="text-xs text-muted-foreground">{doctor.email}</div>
                    </button>
                  ))
                )}
              </div>
            )}
            <input type="hidden" name="doctorId" value={selectedDoctor?.id ?? ""} />
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <input
              id="date"
              name="date"
              type="date"
              required
              className={selectClass}
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>

          <div>
            <Label>Available Time Slot</Label>
            {loadingSlots ? (
              <p className="text-sm text-muted-foreground py-2">Loading slots...</p>
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                {selectedDoctor && selectedDate
                  ? "No available slots for this date."
                  : "Select a pediatrician and date to see available slots."}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 mt-1">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-md border px-2 py-1.5 text-sm transition-colors ${
                      selectedSlot === slot
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
            {selectedSlot && (
              <input type="hidden" name="time" value={selectedSlot} />
            )}
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <select id="type" name="type" required className={selectClass}>
              <option value="Routine">Routine</option>
              <option value="Vaccination">Vaccination</option>
              <option value="Follow-up">Follow-up</option>
            </select>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <input
              id="notes"
              name="notes"
              placeholder="Optional notes"
              className={selectClass}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || !selectedSlot || !selectedDoctor}>
              {pending ? "Booking..." : "Book Appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
