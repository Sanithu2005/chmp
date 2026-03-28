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
import { updatePrescription } from "@/lib/actions";
import { useRouter } from "next/navigation";

export function EditPrescriptionModal({
  children,
  prescription,
}: {
  children: React.ReactNode;
  prescription: {
    id: string;
    medication: string;
    dosage: string;
    startDate: string;
    endDate: string | null;
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
      await updatePrescription(prescription.id, formData);
      setOpen(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update prescription");
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
          <DialogTitle>Edit Prescription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-med">Medication</Label>
            <Input id="edit-med" name="medication" defaultValue={prescription.medication} required />
          </div>
          <div>
            <Label htmlFor="edit-dosage">Dosage</Label>
            <Input id="edit-dosage" name="dosage" defaultValue={prescription.dosage} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-start">Start Date</Label>
              <Input id="edit-start" name="startDate" type="date" defaultValue={prescription.startDate} required />
            </div>
            <div>
              <Label htmlFor="edit-end">End Date</Label>
              <Input id="edit-end" name="endDate" type="date" defaultValue={prescription.endDate ?? ""} />
            </div>
          </div>
          <div>
            <Label htmlFor="edit-rx-notes">Notes</Label>
            <Input id="edit-rx-notes" name="notes" />
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
