"use client";

import { useState, useRef } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updatePatient } from "@/lib/actions";
import { uploadPatientImage } from "@/lib/upload";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function EditPatientModal({
  children,
  patient,
}: {
  children: React.ReactNode;
  patient: {
    id: string;
    name: string;
    dateOfBirth: string;
    gender: string;
    bloodType: string | null;
    image: string | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [imageUrl, setImageUrl] = useState(patient.image);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patientId", patient.id);
      const result = await uploadPatientImage(formData);
      setImageUrl(result.url);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updatePatient(patient.id, formData);
      setOpen(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update patient");
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
          <DialogTitle>Edit Patient</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2">
                <AvatarImage src={imageUrl ?? undefined} alt={patient.name} />
                <AvatarFallback className="text-sm font-bold bg-primary text-primary-foreground">
                  {getInitials(patient.name)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            <div>
              <p className="text-sm font-medium">{patient.name}</p>
              <p className="text-xs text-muted-foreground">Tap camera to change photo</p>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-name">Full Name</Label>
            <Input id="edit-name" name="name" defaultValue={patient.name} required />
          </div>
          <div>
            <Label htmlFor="edit-dob">Date of Birth</Label>
            <Input id="edit-dob" name="dateOfBirth" type="date" defaultValue={patient.dateOfBirth} required />
          </div>
          <div>
            <Label htmlFor="edit-gender">Gender</Label>
            <select id="edit-gender" name="gender" required className={selectClass} defaultValue={patient.gender}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <Label htmlFor="edit-blood">Blood Type</Label>
            <select id="edit-blood" name="bloodType" className={selectClass} defaultValue={patient.bloodType ?? "Unknown"}>
              <option value="Unknown">Unknown</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
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
