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
import { updateAppointment } from "@/lib/actions";
import { useRouter } from "next/navigation";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function EditAppointmentModal({
  children,
  appointment,
}: {
  children: React.ReactNode;
  appointment: {
    id: string;
    date: string;
    time: string;
    type: string;
    notes: string | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateAppointment(appointment.id, formData);
      setOpen(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update appointment");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)} className="inline-block">
        {children}
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-date">Date</Label>
            <Input id="edit-date" name="date" type="date" defaultValue={appointment.date} required />
          </div>
          <div>
            <Label htmlFor="edit-time">Time</Label>
            <Input id="edit-time" name="time" type="time" defaultValue={appointment.time} required />
          </div>
          <div>
            <Label htmlFor="edit-type">Type</Label>
            <select id="edit-type" name="type" required className={selectClass} defaultValue={appointment.type}>
              <option value="Routine">Routine</option>
              <option value="Vaccination">Vaccination</option>
              <option value="Follow-up">Follow-up</option>
            </select>
          </div>
          <div>
            <Label htmlFor="edit-notes">Notes</Label>
            <Input id="edit-notes" name="notes" defaultValue={appointment.notes ?? ""} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
