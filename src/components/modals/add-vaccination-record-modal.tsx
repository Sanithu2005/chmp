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
import { createVaccinationRecord } from "@/lib/actions";
import { useRouter } from "next/navigation";

export function AddVaccinationRecordModal({
  children,
  patientId,
}: {
  children: React.ReactNode;
  patientId: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createVaccinationRecord(formData);
      setOpen(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create vaccination record");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Vaccination</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="patientId" value={patientId} />
          <div>
            <Label htmlFor="vaccineName">Vaccine Name</Label>
            <Input id="vaccineName" name="vaccineName" placeholder="e.g. MMR, Polio, Hepatitis B" required />
          </div>
          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input id="dueDate" name="dueDate" type="date" required />
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
