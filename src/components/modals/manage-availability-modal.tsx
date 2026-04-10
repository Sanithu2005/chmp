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
import { setDoctorAvailability } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Slot = { dayOfWeek: number; startTime: string; endTime: string };

type Props = {
  children: React.ReactNode;
  doctorId: string;
  availability: { id: string; doctorId: string; dayOfWeek: number; startTime: string; endTime: string }[];
};

export function ManageAvailabilityModal({ children, availability }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [slots, setSlots] = useState<Slot[]>(
    availability.map((a) => ({ dayOfWeek: a.dayOfWeek, startTime: a.startTime, endTime: a.endTime })),
  );
  const router = useRouter();

  function addSlot() {
    setSlots((prev) => [...prev, { dayOfWeek: 1, startTime: "09:00", endTime: "12:00" }]);
  }

  function removeSlot(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSlot(index: number, field: keyof Slot, value: string | number) {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await setDoctorAvailability(slots);
      setOpen(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save availability");
    } finally {
      setPending(false);
    }
  }

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Weekly Availability</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {slots.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No availability set. Add time blocks below.
            </p>
          )}
          <div className="space-y-3">
            {slots.map((slot, index) => (
              <div key={index} className="flex items-end gap-2 rounded-lg border p-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Day</Label>
                  <select
                    value={slot.dayOfWeek}
                    onChange={(e) => updateSlot(index, "dayOfWeek", parseInt(e.target.value))}
                    className={selectClass}
                  >
                    {dayNames.map((name, i) => (
                      <option key={i} value={i}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Start</Label>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(index, "startTime", e.target.value)}
                    className={selectClass}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">End</Label>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(index, "endTime", e.target.value)}
                    className={selectClass}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSlot(index)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addSlot} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add Time Block
          </Button>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save Availability"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
