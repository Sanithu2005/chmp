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
import { updateGrowthRecord } from "@/lib/actions";
import { useRouter } from "next/navigation";

export function EditGrowthRecordModal({
  children,
  record,
}: {
  children: React.ReactNode;
  record: {
    id: string;
    date: string;
    weightKg: number;
    heightCm: number;
    ageInWeeks: number;
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
      await updateGrowthRecord(record.id, formData);
      setOpen(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update record");
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
          <DialogTitle>Edit Growth Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-gr-date">Date</Label>
            <Input id="edit-gr-date" name="date" type="date" defaultValue={record.date} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-gr-weight">Weight (kg)</Label>
              <Input id="edit-gr-weight" name="weightKg" type="number" step="0.01" defaultValue={record.weightKg} required />
            </div>
            <div>
              <Label htmlFor="edit-gr-height">Height (cm)</Label>
              <Input id="edit-gr-height" name="heightCm" type="number" step="0.1" defaultValue={record.heightCm} required />
            </div>
          </div>
          <div>
            <Label htmlFor="edit-gr-age">Age (weeks)</Label>
            <Input id="edit-gr-age" name="ageInWeeks" type="number" defaultValue={record.ageInWeeks} required />
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
