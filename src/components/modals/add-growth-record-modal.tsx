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
import { createGrowthRecord } from "@/lib/actions";
import { useRouter } from "next/navigation";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Patient = { id: string; name: string };

export function AddGrowthRecordModal({
  children,
  patients,
  defaultPatientId,
}: {
  children: React.ReactNode;
  patients: Patient[];
  defaultPatientId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createGrowthRecord(formData);
      setOpen(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to record growth data");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Growth Data</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {defaultPatientId ? (
            <input type="hidden" name="patientId" value={defaultPatientId} />
          ) : (
            <div>
              <Label htmlFor="patientId">Patient</Label>
              <select id="patientId" name="patientId" required className={selectClass}>
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weightKg">Weight (kg)</Label>
              <Input id="weightKg" name="weightKg" type="number" step="0.01" required />
            </div>
            <div>
              <Label htmlFor="heightCm">Height (cm)</Label>
              <Input id="heightCm" name="heightCm" type="number" step="0.1" required />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
