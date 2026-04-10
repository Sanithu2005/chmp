"use client";

import { useState } from "react";
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

export function AddAppointmentModal({
  children,
  userRole,
  patients,
  doctors,
  defaultPatientId,
}: {
  children: React.ReactNode;
  userRole: string;
  patients: Patient[];
  doctors: Doctor[];
  defaultPatientId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
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

  function handleDoctorChange(doctorId: string) {
    setSelectedDoctor(doctorId);
    setAvailableSlots([]);
    setSelectedSlot("");
    if (doctorId && selectedDate) {
      fetchSlots(doctorId, selectedDate);
    }
  }

  function handleDateChange(date: string) {
    setSelectedDate(date);
    setAvailableSlots([]);
    setSelectedSlot("");
    if (selectedDoctor && date) {
      fetchSlots(selectedDoctor, date);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    // Inject the selected slot as time
    formData.set("time", selectedSlot);
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

          <div>
            <Label htmlFor="doctorId">Pediatrician</Label>
            <select
              id="doctorId"
              name="doctorId"
              required
              className={selectClass}
              value={selectedDoctor}
              onChange={(e) => handleDoctorChange(e.target.value)}
            >
              <option value="">Select pediatrician</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
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
            <Button type="submit" disabled={pending || !selectedSlot}>
              {pending ? "Booking..." : "Book Appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
