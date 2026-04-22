"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { markVaccineAdministered } from "@/lib/actions";
import { useRouter } from "next/navigation";

export function AdministerVaccineModal({
  open,
  onOpenChange,
  recordId,
  vaccineName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordId: string;
  vaccineName: string;
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const administeredDate = formData.get("administeredDate") as string;
    const batchNumber = (formData.get("batchNumber") as string) || undefined;
    const clinic = (formData.get("clinic") as string) || undefined;

    try {
      await markVaccineAdministered(recordId, administeredDate, batchNumber, clinic);
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to mark as administered");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Administer {vaccineName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="administeredDate">Date Administered</Label>
            <Input
              id="administeredDate"
              name="administeredDate"
              type="date"
              required
              defaultValue={today}
            />
          </div>
          <div>
            <Label htmlFor="batchNumber">Batch Number</Label>
            <Input id="batchNumber" name="batchNumber" placeholder="Optional" />
          </div>
          <div>
            <Label htmlFor="clinic">Clinic / Location</Label>
            <Input id="clinic" name="clinic" placeholder="Optional" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
