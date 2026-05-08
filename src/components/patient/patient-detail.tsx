"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Baby,
  Calendar,
  Pill,
  TrendingUp,
  Syringe,
  Pencil,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { ageLabel } from "@/lib/utils";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { BabyThemedBg } from "@/components/layout/baby-themed-bg";
import { Footer } from "@/components/layout/footer";
import { AddPrescriptionModal } from "@/components/modals/add-prescription-modal";
import { AddGrowthRecordModal } from "@/components/modals/add-growth-record-modal";
import { AddVaccinationRecordModal } from "@/components/modals/add-vaccination-record-modal";
import { AdministerVaccineModal } from "@/components/modals/administer-vaccine-modal";
import { EditPatientModal } from "@/components/modals/edit-patient-modal";
import { EditAppointmentModal } from "@/components/modals/edit-appointment-modal";
import { EditPrescriptionModal } from "@/components/modals/edit-prescription-modal";
import { EditGrowthRecordModal } from "@/components/modals/edit-growth-record-modal";
import { ConfirmDeleteModal } from "@/components/modals/confirm-delete-modal";
import { CompleteAppointmentModal } from "@/components/modals/complete-appointment-modal";
import {
  confirmAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  deletePrescription,
  deleteGrowthRecord,
  deletePatient,
  generateVisitSummary,
} from "@/lib/actions";
import VaccinationSchedule from "@/components/parent/vaccination-schedule";
import AiGrowthAnalysisCard from "@/components/patient/ai-growth-analysis-card";
import VisitSummaryCard from "@/components/patient/visit-summary-card";
import dynamic from "next/dynamic";

const GrowthChart = dynamic(() => import("@/components/parent/growth-chart"), {
  ssr: false,
});

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Props = {
  userRole: string;
  userMedicalRole?: string;
  userName: string;
  patient: {
    id: string;
    name: string;
    dateOfBirth: string;
    gender: string;
    bloodType: string | null;
    image: string | null;
  };
  appointments: {
    id: string;
    date: string;
    time: string;
    type: string;
    status: string;
    notes: string | null;
    doctorName: string;
  }[];
  prescriptions: {
    id: string;
    medication: string;
    dosage: string;
    status: string;
    startDate: string;
    endDate: string | null;
    doctorName: string;
  }[];
  growthRecords: {
    id: string;
    date: string;
    weightKg: number;
    heightCm: number;
    ageInWeeks: number;
    weightForAgeZScore: number | null;
    heightForAgeZScore: number | null;
  }[];
  vaccinations: {
    id: string;
    dueDate: string;
    administeredDate: string | null;
    batchNumber: string | null;
    clinic: string | null;
    vaccineName: string;
  }[];
  visitSummaries: {
    id: string;
    appointmentId: string;
    summary: string;
    createdAt: string;
    doctorName: string;
  }[];
};

export default function PatientDetail({
  userRole,
  userMedicalRole,
  userName,
  patient,
  appointments,
  prescriptions,
  growthRecords,
  vaccinations,
  visitSummaries,
}: Props) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<{
    type: string;
    id: string;
    name: string;
  } | null>(null);

  const [administerTarget, setAdministerTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [generatingSummaryId, setGeneratingSummaryId] = useState<string | null>(null);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "appointment") await deleteAppointment(deleteTarget.id);
      else if (deleteTarget.type === "prescription") await deletePrescription(deleteTarget.id);
      else if (deleteTarget.type === "growth") await deleteGrowthRecord(deleteTarget.id);
      else if (deleteTarget.type === "patient") {
        await deletePatient(deleteTarget.id);
        router.push(userRole === "medical_professional" ? "/medical-professional" : "/parent");
        return;
      }
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const isMedicalProfessional = userRole === "medical_professional";

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30">
      <DashboardHeader
        subtitle={isMedicalProfessional ? "Medical Professional Portal" : "Parent Portal"}
        userName={userName}
        userRole={isMedicalProfessional ? "Medical Professional" : "Parent"}
        onLogout={handleLogout}
      />

      <div className="relative flex-1">
        <BabyThemedBg />
        <main className="relative flex-1 space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {/* Back + Patient Hero */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={isMedicalProfessional ? "/medical-professional" : "/parent"}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Link>
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div
            className="p-6 sm:p-8"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent)",
            }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">{patient.name}</h2>
                <div className="flex flex-wrap gap-3 mt-4">
                  <StatPill label="Age" value={ageLabel(patient.dateOfBirth)} />
                  <StatPill
                    label="Gender"
                    value={patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                  />
                  <StatPill label="Blood Type" value={patient.bloodType ?? "Unknown"} />
                </div>
              </div>
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarImage src={patient.image ?? undefined} alt={patient.name} />
                <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                  {getInitials(patient.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            {!isMedicalProfessional && (
              <div className="flex gap-2 mt-6">
                <EditPatientModal patient={patient}>
                  <Button variant="outline" size="sm">
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                </EditPatientModal>
                <ConfirmDeleteModal
                  title="Delete Patient"
                  description={`Are you sure you want to delete ${patient.name}? This will remove all associated records and cannot be undone.`}
                  onConfirm={() =>
                    setDeleteTarget({ type: "patient", id: patient.id, name: patient.name })
                  }
                >
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                  </Button>
                </ConfirmDeleteModal>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="w-full md:w-auto grid grid-cols-4">
            <TabsTrigger value="appointments">
              <Calendar className="mr-2 h-4 w-4 hidden sm:inline" />
              Visits
            </TabsTrigger>
            <TabsTrigger value="medications">
              <Pill className="mr-2 h-4 w-4 hidden sm:inline" />
              Meds
            </TabsTrigger>
            <TabsTrigger value="growth">
              <TrendingUp className="mr-2 h-4 w-4 hidden sm:inline" />
              Growth
            </TabsTrigger>
            <TabsTrigger value="vaccinations">
              <Syringe className="mr-2 h-4 w-4 hidden sm:inline" />
              Vaccines
            </TabsTrigger>
          </TabsList>

          {/* APPOINTMENTS */}
          <TabsContent value="appointments" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                  <CardTitle>Appointments</CardTitle>
                  <CardDescription>All visits for {patient.name}.</CardDescription>
                </div>
                {isMedicalProfessional && userMedicalRole === "pediatrician" && (
                  <span className="text-xs text-muted-foreground">Confirm pending appointments below</span>
                )}
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <EmptyState icon={<Calendar />} message="No appointments yet." />
                ) : (
                  <div className="space-y-3">
                    {appointments.map((apt) => {
                      const summary = visitSummaries.find((s) => s.appointmentId === apt.id);
                      return (
                        <div key={apt.id} className="rounded-lg border">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
                            <div>
                              <p className="font-medium">{apt.doctorName}</p>
                              <p className="text-sm text-muted-foreground">
                                {apt.type} · {apt.date} · {apt.time}
                              </p>
                              {apt.notes && (
                                <p className="text-xs text-muted-foreground mt-1 italic">{apt.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={apt.status === "upcoming" ? "default" : apt.status === "completed" ? "success" : apt.status === "cancelled" ? "destructive" : "secondary"}
                              >
                                {apt.status}
                              </Badge>
                              {isMedicalProfessional && userMedicalRole === "pediatrician" && apt.status === "pending" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    await confirmAppointment(apt.id);
                                    router.refresh();
                                  }}
                                >
                                  Confirm
                                </Button>
                              )}
                              {isMedicalProfessional && userMedicalRole === "pediatrician" && apt.status === "upcoming" && (
                                <>
                                  <CompleteAppointmentModal
                                    appointmentId={apt.id}
                                    vaccinations={vaccinations}
                                    prescriptions={prescriptions}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    >
                                      Complete
                                    </Button>
                                  </CompleteAppointmentModal>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={async () => {
                                      await updateAppointmentStatus(apt.id, "cancelled");
                                      router.refresh();
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          {summary && (
                            <div className="border-t">
                              <VisitSummaryCard summary={summary} />
                            </div>
                          )}
                          {!summary && apt.status === "completed" && (
                            <div className="border-t p-4 bg-muted/30">
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                  Visit summary was not generated automatically.
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={generatingSummaryId === apt.id}
                                  onClick={async () => {
                                    setGeneratingSummaryId(apt.id);
                                    try {
                                      const result = await generateVisitSummary(apt.id);
                                      if (result) {
                                        router.refresh();
                                      } else {
                                        alert("Failed to generate summary. Please try again.");
                                      }
                                    } catch (err) {
                                      alert(err instanceof Error ? err.message : "Failed to generate summary");
                                    } finally {
                                      setGeneratingSummaryId(null);
                                    }
                                  }}
                                >
                                  {generatingSummaryId === apt.id ? "Generating..." : "Generate Summary"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PRESCRIPTIONS */}
          <TabsContent value="medications" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                  <CardTitle>Prescriptions</CardTitle>
                  <CardDescription>Medications for {patient.name}.</CardDescription>
                </div>
                {  isMedicalProfessional && (
                  <AddPrescriptionModal patients={[]} defaultPatientId={patient.id}>
                    <Button size="sm">
                      <Pill className="mr-2 h-4 w-4" /> Prescribe
                    </Button>
                  </AddPrescriptionModal>
                )}
              </CardHeader>
              <CardContent>
                {prescriptions.length === 0 ? (
                  <EmptyState icon={<Pill />} message="No prescriptions yet." />
                ) : (
                  <div className="space-y-3">
                    {prescriptions.map((rx) => (
                      <div
                        key={rx.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                            <Pill className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{rx.medication}</p>
                            <p className="text-sm text-muted-foreground">
                              {rx.dosage} · {rx.doctorName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Started: {rx.startDate}
                              {rx.endDate ? ` · Ends: ${rx.endDate}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={rx.status === "active" ? "success" : "warning"}
                          >
                            {rx.status}
                          </Badge>
                          {  isMedicalProfessional && (
                            <>
                              <EditPrescriptionModal prescription={rx}>
                                <Button variant="outline" size="sm">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </EditPrescriptionModal>
                              <ConfirmDeleteModal
                                title="Delete Prescription"
                                description="Remove this prescription permanently?"
                                onConfirm={() =>
                                  setDeleteTarget({ type: "prescription", id: rx.id, name: "" })
                                }
                              >
                                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </ConfirmDeleteModal>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* GROWTH */}
          <TabsContent value="growth" className="mt-6 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                  <CardTitle>Growth Charts</CardTitle>
                  <CardDescription>Weight and height over time.</CardDescription>
                </div>
                {  isMedicalProfessional && (
                  <AddGrowthRecordModal patients={[]} defaultPatientId={patient.id}>
                    <Button size="sm">
                      <TrendingUp className="mr-2 h-4 w-4" /> Record
                    </Button>
                  </AddGrowthRecordModal>
                )}
              </CardHeader>
              <CardContent>
                {growthRecords.length === 0 ? (
                  <EmptyState icon={<TrendingUp />} message="No growth records yet." />
                ) : (
                  <GrowthChart records={growthRecords} />
                )}
              </CardContent>
            </Card>

            {growthRecords.length > 0 && (
              <AiGrowthAnalysisCard
                patientId={patient.id}
                userRole={userRole as "parent" | "medical_professional"}
                growthRecords={growthRecords}
              />
            )}

            {growthRecords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Measurements History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 bg-muted/50 p-3 text-xs font-medium text-muted-foreground">
                      <div>Date</div>
                      <div>Age</div>
                      <div>Weight</div>
                      <div>Height</div>
                      <div className="text-right">Actions</div>
                    </div>
                    <div className="divide-y">
                      {[...growthRecords].reverse().map((r) => (
                        <div
                          key={r.id}
                          className="grid grid-cols-5 items-center p-3 text-sm hover:bg-muted/50"
                        >
                          <div>{r.date}</div>
                          <div className="text-muted-foreground">{r.ageInWeeks}w</div>
                          <div className="font-medium">{r.weightKg} kg</div>
                          <div className="font-medium">{r.heightCm} cm</div>
                          <div className="flex justify-end gap-2">
                            {  isMedicalProfessional && (
                              <>
                                <EditGrowthRecordModal record={r}>
                                  <Button variant="outline" size="sm">
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </EditGrowthRecordModal>
                                <ConfirmDeleteModal
                                  title="Delete Record"
                                  description="Remove this growth record permanently?"
                                  onConfirm={() =>
                                    setDeleteTarget({ type: "growth", id: r.id, name: "" })
                                  }
                                >
                                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </ConfirmDeleteModal>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* VACCINATIONS */}
          <TabsContent value="vaccinations" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                  <CardTitle>Vaccination Schedule</CardTitle>
                  <CardDescription>
                    Immunisation records for {patient.name}.
                  </CardDescription>
                </div>
                {isMedicalProfessional && (
                  <AddVaccinationRecordModal patientId={patient.id}>
                    <Button size="sm">
                      <Syringe className="mr-2 h-4 w-4" /> Add Record
                    </Button>
                  </AddVaccinationRecordModal>
                )}
              </CardHeader>
              <CardContent>
                {vaccinations.length === 0 ? (
                  <EmptyState icon={<Syringe />} message="No vaccination records yet." />
                ) : (
                  <VaccinationSchedule
                    vaccinations={vaccinations}
                    onAdminister={
                      isMedicalProfessional
                        ? (id) => {
                            const v = vaccinations.find((x) => x.id === id);
                            if (v) setAdministerTarget({ id, name: v.vaccineName });
                          }
                        : undefined
                    }
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      </div>

      {/* Administer vaccine modal */}
      {administerTarget && (
        <AdministerVaccineModal
          open
          onOpenChange={(open) => {
            if (!open) setAdministerTarget(null);
          }}
          recordId={administerTarget.id}
          vaccineName={administerTarget.name}
        />
      )}

      {/* Delete confirmation handler */}
      {deleteTarget && (
        <ConfirmDeleteModal
          title={`Delete ${deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1)}`}
          description="This action cannot be undone."
          open
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onConfirm={handleDelete}
        />
      )}
      <Footer />
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-background/60 px-3 py-2 backdrop-blur-sm">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 text-muted-foreground/40 [&_svg]:h-10 [&_svg]:w-10">
        {icon}
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
