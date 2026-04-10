"use client";

import Link from "next/link";
import {
  Plus,
  Calendar,
  Baby,
  Pill,
  TrendingUp,
  Syringe,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { AddPatientModal } from "@/components/modals/add-patient-modal";
import { AddAppointmentModal } from "@/components/modals/add-appointment-modal";

// ─── Prop types ────────────────────────────────────────────────────────────────
type Child = {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string | null;
};

type Appointment = {
  id: string;
  date: string;
  time: string;
  type: string;
  status: string;
  notes: string | null;
  doctorName: string;
};

type Prescription = {
  id: string;
  medication: string;
  dosage: string;
  status: string;
  startDate: string;
  endDate: string | null;
  doctorName: string;
};

type GrowthRecord = {
  id: string;
  date: string;
  weightKg: number;
  heightCm: number;
  ageInWeeks: number;
};

type VaccinationRecord = {
  id: string;
  status: string;
  dueDate: string;
  administeredDate: string | null;
  batchNumber: string | null;
  clinic: string | null;
  vaccineName: string;
  vaccineDescription: string | null;
  recommendedAgeWeeks: number;
};

type DoctorRef = { id: string; name: string; email: string };

type Props = {
  user: { name: string; email: string };
  children: Child[];
  primaryChild: Child | null;
  appointments: Appointment[];
  prescriptions: Prescription[];
  growthRecords: GrowthRecord[];
  vaccinations: VaccinationRecord[];
  doctors: DoctorRef[];
};

function ageLabel(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const weeks = Math.floor(
    (now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  const months = Math.floor(weeks / 4.33);
  if (months < 24) return `${months} month${months !== 1 ? "s" : ""}`;
  return `${Math.floor(months / 12)} years`;
}

function isWithinDays(dateStr: string, days: number): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= -1 && diffDays <= days; // -1 grace for "today"
}

function formatDateRelative(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays} days`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ParentDashboard({
  user,
  children,
  primaryChild,
  appointments,
  prescriptions,
  growthRecords,
  vaccinations,
  doctors,
}: Props) {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  // ─── Derived summary data ───────────────────────────────────────────────────
  const upcomingSoon = appointments.filter(
    (a) => a.status === "upcoming" && isWithinDays(a.date, 7)
  );
  const pendingAppointments = appointments.filter((a) => a.status === "pending");
  const dueVaccines = vaccinations.filter(
    (v) => v.status === "due_this_week" || v.status === "overdue"
  );
  const administeredCount = vaccinations.filter((v) => v.status === "administered").length;
  const nextAppointment = appointments
    .filter((a) => a.status === "upcoming")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  const latestGrowth = growthRecords.at(-1);
  const activeMeds = prescriptions.filter((p) => p.status === "active");

  const hasAlerts = pendingAppointments.length > 0 || dueVaccines.length > 0 || upcomingSoon.length > 0;

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30">
      <DashboardHeader
        subtitle="Parent Portal"
        userName={user.name}
        userRole="Parent"
        onLogout={handleLogout}
      />

      <main className="flex-1 space-y-6 p-4 sm:p-6 md:p-8 max-w-5xl mx-auto w-full">
        {/* No children */}
        {!primaryChild ? (
          <Card className="flex flex-col items-center justify-center py-20 text-center">
            <Baby className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold">No children registered yet</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Register your child to start tracking their health.
            </p>
            <div className="mt-6">
              <AddPatientModal userRole="parent">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Child
                </Button>
              </AddPatientModal>
            </div>
          </Card>
        ) : (
          <>
            {/* ── Child Hero ─────────────────────────────────────────────── */}
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div
                className="p-6 sm:p-8"
                style={{
                  background:
                    "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent)",
                }}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                  <div className="flex-1 min-w-0">
                    {/* Child selector */}
                    {children.length > 1 && (
                      <div className="mb-3">
                        <select
                          value={primaryChild.id}
                          onChange={(e) =>
                            router.push(`/parent?child=${e.target.value}`)
                          }
                          className="h-8 rounded-md border border-input bg-background px-2 pr-8 text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {children.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <h2 className="text-3xl font-bold tracking-tight">
                      <Link
                        href={`/patients/${primaryChild.id}`}
                        className="hover:underline hover:text-primary transition-colors"
                      >
                        {primaryChild.name}
                      </Link>
                    </h2>
                    <div className="flex flex-wrap gap-3 mt-4">
                      <StatPill label="Age" value={ageLabel(primaryChild.dateOfBirth)} />
                      <StatPill
                        label="Gender"
                        value={
                          primaryChild.gender.charAt(0).toUpperCase() +
                          primaryChild.gender.slice(1)
                        }
                      />
                      <StatPill label="Blood Type" value={primaryChild.bloodType ?? "Unknown"} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/20">
                      <Baby className="h-10 w-10 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/patients/${primaryChild.id}`}>
                          Full history <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <AddPatientModal userRole="parent">
                        <Button variant="outline" size="sm">
                          <Plus className="mr-1 h-3.5 w-3.5" /> Add Child
                        </Button>
                      </AddPatientModal>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Quick Stats ────────────────────────────────────────────── */}
            <div className="grid gap-4 grid-cols-3">
              <MiniStat
                icon={<Calendar className="h-4 w-4 text-sky-500" />}
                label="Upcoming Visits"
                value={appointments.filter((a) => a.status === "upcoming").length}
              />
              <MiniStat
                icon={<Syringe className="h-4 w-4 text-emerald-500" />}
                label="Vaccines Given"
                value={`${administeredCount}/${vaccinations.length}`}
              />
              <MiniStat
                icon={<Pill className="h-4 w-4 text-primary" />}
                label="Active Meds"
                value={activeMeds.length}
              />
            </div>

            {/* ── Alerts ─────────────────────────────────────────────────── */}
            {hasAlerts && (
              <div className="space-y-3">
                {pendingAppointments.length > 0 && (
                  <AlertCard
                    icon={<Clock className="h-5 w-5 text-amber-500" />}
                    title="Appointment awaiting confirmation"
                    description={`${pendingAppointments.length} appointment${pendingAppointments.length > 1 ? "s" : ""} with ${pendingAppointments[0].doctorName} pending pediatrician confirmation.`}
                    tone="amber"
                  />
                )}
                {upcomingSoon.length > 0 && (
                  <AlertCard
                    icon={<Calendar className="h-5 w-5 text-sky-500" />}
                    title="Visit coming up"
                    description={`${upcomingSoon.length} appointment${upcomingSoon.length > 1 ? "s" : ""} in the next 7 days.`}
                    tone="sky"
                  />
                )}
                {dueVaccines.length > 0 && (
                  <AlertCard
                    icon={<AlertTriangle className="h-5 w-5 text-rose-500" />}
                    title={`${dueVaccines.length} vaccine${dueVaccines.length > 1 ? "s" : ""} due`}
                    description={`${dueVaccines.map((v) => v.vaccineName).join(", ")} — schedule a visit.`}
                    tone="rose"
                  />
                )}
              </div>
            )}

            {/* ── Summary Grid ───────────────────────────────────────────── */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Next Visit */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-sky-500" />
                      Next Visit
                    </CardTitle>
                    <AddAppointmentModal
                      userRole="parent"
                      patients={children}
                      doctors={doctors}
                      defaultPatientId={primaryChild?.id}
                    >
                      <Button variant="ghost" size="sm" className="h-8 gap-1">
                        <Plus className="h-3.5 w-3.5" /> Book
                      </Button>
                    </AddAppointmentModal>
                  </div>
                </CardHeader>
                <CardContent>
                  {nextAppointment ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{nextAppointment.doctorName}</p>
                          <p className="text-sm text-muted-foreground">
                            {nextAppointment.type}
                          </p>
                        </div>
                        <Badge variant="default">{formatDateRelative(nextAppointment.date)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {nextAppointment.date} at {nextAppointment.time}
                      </p>
                      {nextAppointment.notes && (
                        <p className="text-xs text-muted-foreground italic bg-muted/50 rounded-md p-2">
                          {nextAppointment.notes}
                        </p>
                      )}
                    </div>
                  ) : (
                    <EmptyState icon={<Calendar />} message="No upcoming visits." />
                  )}
                </CardContent>
              </Card>

              {/* Vaccination Progress */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Syringe className="h-4 w-4 text-emerald-500" />
                    Vaccination Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="font-semibold">
                        {administeredCount} of {vaccinations.length}
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{
                          width: `${vaccinations.length > 0 ? (administeredCount / vaccinations.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  {dueVaccines.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/30 p-3">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        {dueVaccines.length} vaccine{dueVaccines.length > 1 ? "s" : ""} due
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                        {dueVaccines.map((v) => v.vaccineName).join(", ")}
                      </p>
                    </div>
                  )}
                  <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
                    <Link href={`/patients/${primaryChild.id}?tab=vaccinations`}>
                      View full schedule
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Latest Growth */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-violet-500" />
                    Latest Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {latestGrowth ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-muted/50 p-3 text-center">
                          <p className="text-xs text-muted-foreground">Weight</p>
                          <p className="text-xl font-bold">{latestGrowth.weightKg} kg</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3 text-center">
                          <p className="text-xs text-muted-foreground">Height</p>
                          <p className="text-xl font-bold">{latestGrowth.heightCm} cm</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Recorded at {latestGrowth.ageInWeeks} weeks old
                      </p>
                      <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
                        <Link href={`/patients/${primaryChild.id}?tab=growth`}>
                          View growth chart
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <EmptyState icon={<TrendingUp />} message="No growth records yet." />
                  )}
                </CardContent>
              </Card>

              {/* Active Medications */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Pill className="h-4 w-4 text-primary" />
                    Active Medications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeMeds.length > 0 ? (
                    <div className="space-y-3">
                      {activeMeds.slice(0, 3).map((med) => (
                        <div
                          key={med.id}
                          className="flex items-start justify-between gap-3 rounded-lg border p-3"
                        >
                          <div>
                            <p className="font-medium text-sm">{med.medication}</p>
                            <p className="text-xs text-muted-foreground">{med.dosage}</p>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {med.status}
                          </Badge>
                        </div>
                      ))}
                      {activeMeds.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{activeMeds.length - 3} more
                        </p>
                      )}
                      <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
                        <Link href={`/patients/${primaryChild.id}?tab=medications`}>
                          View all medications
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <EmptyState icon={<Pill />} message="No active medications." />
                  )}
                </CardContent>
              </Card>
            </div>


          </>
        )}
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-background/60 px-3 py-2 backdrop-blur-sm">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">{icon}</div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

function AlertCard({
  icon,
  title,
  description,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone: "amber" | "sky" | "rose";
}) {
  const toneClasses = {
    amber: "border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300",
    sky: "border-sky-200 bg-sky-50 text-sky-800 dark:bg-sky-950/20 dark:border-sky-900/30 dark:text-sky-300",
    rose: "border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-300",
  };

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${toneClasses[tone]}`}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-sm opacity-90 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-2 text-muted-foreground/40 [&_svg]:h-8 [&_svg]:w-8">{icon}</div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
