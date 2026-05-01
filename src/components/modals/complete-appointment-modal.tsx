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
import { completeAppointmentWithActivities } from "@/lib/actions";
import { useRouter } from "next/navigation";

type Vaccination = {
  id: string;
  vaccineName: string;
  dueDate: string;
  administeredDate: string | null;
};

type Prescription = {
  id: string;
  medication: string;
  dosage: string;
  status: string;
};

type Props = {
  children: React.ReactNode;
  appointmentId: string;
  vaccinations: Vaccination[];
  prescriptions: Prescription[];
};

export function CompleteAppointmentModal({
  children,
  appointmentId,
  vaccinations,
  prescriptions,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [notes, setNotes] = useState("");
  const router = useRouter();

  const pendingVaccines = vaccinations.filter((v) => !v.administeredDate);
  const activePrescriptions = prescriptions.filter((p) => p.status === "active");

  const [selectedVaccines, setSelectedVaccines] = useState<Set<string>>(new Set());
  const [selectedPrescriptions, setSelectedPrescriptions] = useState<Set<string>>(new Set());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);

    const activities: {
      type: "vaccine_administered" | "prescription_started" | "prescription_continued" | "prescription_stopped" | "growth_measured" | "general_note" | "custom";
      description: string;
    }[] = [];

    selectedVaccines.forEach((vaccineId) => {
      const vaccine = pendingVaccines.find((v) => v.id === vaccineId);
      if (vaccine) {
        activities.push({
          type: "vaccine_administered",
          description: `Administered ${vaccine.vaccineName}`,
        });
      }
    });

    selectedPrescriptions.forEach((prescriptionId) => {
      const prescription = activePrescriptions.find((p) => p.id === prescriptionId);
      if (prescription) {
        activities.push({
          type: "prescription_continued",
          description: `Continued ${prescription.medication} (${prescription.dosage})`,
        });
      }
    });

    if (notes.trim()) {
      activities.push({
        type: "general_note",
        description: notes.trim(),
      });
    }

    try {
      await completeAppointmentWithActivities(appointmentId, activities);
      setOpen(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to complete appointment");
    } finally {
      setPending(false);
    }
  }

  const toggleVaccine = (id: string) => {
    setSelectedVaccines((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePrescription = (id: string) => {
    setSelectedPrescriptions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {pendingVaccines.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Vaccines Administered</Label>
              <div className="mt-2 space-y-2">
                {pendingVaccines.map((v) => (
                  <div key={v.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`vaccine-${v.id}`}
                      checked={selectedVaccines.has(v.id)}
                      onChange={() => toggleVaccine(v.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor={`vaccine-${v.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {v.vaccineName} <span className="text-muted-foreground">(due {v.dueDate})</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePrescriptions.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Medications Continued</Label>
              <div className="mt-2 space-y-2">
                {activePrescriptions.map((p) => (
                  <div key={p.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`prescription-${p.id}`}
                      checked={selectedPrescriptions.has(p.id)}
                      onChange={() => togglePrescription(p.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor={`prescription-${p.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {p.medication} <span className="text-muted-foreground">({p.dosage})</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="visit-notes" className="text-sm font-medium">
              Additional Notes / Actions
            </Label>
            <textarea
              id="visit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Discussed feeding, measured growth, provided anticipatory guidance..."
              className="mt-2 flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Completing..." : "Complete Visit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
