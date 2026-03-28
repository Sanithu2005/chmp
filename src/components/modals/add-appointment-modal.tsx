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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAppointment } from "@/lib/actions";
import { useRouter } from "next/navigation";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Patient = { id: string; name: string };
type Doctor = { id: string; name: string; email: string };

export function AddAppointmentModal({
  children,
  userRole,
  patients,
  doctors,
  defaultPatientId,
  defaultDoctorId,
}: {
  children: React.ReactNode;
  userRole: string;
  patients: Patient[];
  doctors: Doctor[];
  defaultPatientId?: string;
  defaultDoctorId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {userRole === "medical_professional" ? (
            <div>
              <Label htmlFor="patientId">Patient</Label>
              <select id="patientId" name="patientId" required className={selectClass} defaultValue={defaultPatientId || ""}>
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <Label htmlFor="patientId">Child</Label>
              <select id="patientId" name="patientId" required className={selectClass} defaultValue={defaultPatientId || ""}>
                <option value="">Select child</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {userRole === "parent" && (
            <div>
              <Label htmlFor="doctorId">Doctor</Label>
              <select id="doctorId" name="doctorId" required className={selectClass}>
                <option value="">Select doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.email})
                  </option>
                ))}
              </select>
            </div>
          )}
          {userRole === "medical_professional" && defaultDoctorId && (
            <input type="hidden" name="doctorId" value={defaultDoctorId} />
          )}

          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" required />
          </div>
          <div>
            <Label htmlFor="time">Time</Label>
            <Input id="time" name="time" type="time" required />
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
            <Input id="notes" name="notes" placeholder="Optional notes" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
