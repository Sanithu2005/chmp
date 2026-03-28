"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  LogOut,
  Plus,
  Calendar,
  Heart,
  Baby,
  Pill,
  FileText,
  ChevronDown,
  TrendingUp,
  Syringe,
} from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AddPatientModal } from "@/components/modals/add-patient-modal";
import { AddAppointmentModal } from "@/components/modals/add-appointment-modal";
import { EditAppointmentModal } from "@/components/modals/edit-appointment-modal";
import VaccinationSchedule from "./vaccination-schedule";

// Lazy load Recharts to avoid SSR issues
const GrowthChart = dynamic(() => import("./growth-chart"), { ssr: false });

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
  const weeks = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 7));
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  const months = Math.floor(weeks / 4.33);
  if (months < 24) return `${months} month${months !== 1 ? "s" : ""}`;
  return `${Math.floor(months / 12)} years`;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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

  const latestGrowth = growthRecords.at(-1);
  const upcomingCount = appointments.filter((a) => a.status === "upcoming").length;
  const administeredCount = vaccinations.filter((v) => v.status === "administered").length;

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 shadow-sm sm:px-6">
        <div className="flex flex-1 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-semibold leading-none tracking-tight">CHMP Portal</h1>
            <p className="text-xs text-muted-foreground mt-1">Parent Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">Parent</span>
          </div>
          <ThemeToggle />
          <Avatar className="h-9 w-9 border">
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </header>

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
            {/* Child Hero */}
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div
                className="p-6 sm:p-8"
                style={{
                  background: "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent)",
                }}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                  <div className="flex-1 min-w-0">
                    {/* Child selector */}
                    {children.length > 1 && (
                      <div className="mb-3">
                        <select
                          value={primaryChild.id}
                          onChange={(e) => router.push(`/parent?child=${e.target.value}`)}
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
                      <Link href={`/patients/${primaryChild.id}`} className="hover:underline hover:text-primary transition-colors">
                        {primaryChild.name}
                      </Link>
                    </h2>
                    <div className="flex flex-wrap gap-3 mt-4">
                      <StatPill label="Age" value={ageLabel(primaryChild.dateOfBirth)} />
                      {latestGrowth && (
                        <>
                          <StatPill label="Weight" value={`${latestGrowth.weightKg} kg`} />
                          <StatPill label="Height" value={`${latestGrowth.heightCm} cm`} />
                        </>
                      )}
                      <StatPill label="Blood Type" value={primaryChild.bloodType ?? "Unknown"} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/20">
                      <Baby className="h-10 w-10 text-primary" />
                    </div>
                    <AddPatientModal userRole="parent">
                      <Button variant="outline" size="sm">
                        <Plus className="mr-1 h-3.5 w-3.5" /> Add Child
                      </Button>
                    </AddPatientModal>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid gap-4 grid-cols-3">
              <MiniStat icon={<Calendar className="h-4 w-4 text-sky-500" />} label="Upcoming Visits" value={upcomingCount} />
              <MiniStat icon={<Syringe className="h-4 w-4 text-emerald-500" />} label="Vaccines Given" value={`${administeredCount}/${vaccinations.length}`} />
              <MiniStat icon={<Pill className="h-4 w-4 text-primary" />} label="Active Meds" value={prescriptions.filter(p => p.status === "active").length} />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full md:w-auto grid grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="appointments">Visits</TabsTrigger>
                <TabsTrigger value="medications">Meds</TabsTrigger>
                <TabsTrigger value="vaccinations">Vaccines</TabsTrigger>
                <TabsTrigger value="growth">Growth</TabsTrigger>
              </TabsList>

              {/* OVERVIEW */}
              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-7">
                  <Card className="md:col-span-4 lg:col-span-5">
                    <CardHeader>
                      <CardTitle>Growth Trend</CardTitle>
                      <CardDescription>Weight and height progression over time.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {growthRecords.length < 2 ? (
                        <div className="flex flex-col items-center py-8 text-center">
                          <TrendingUp className="mb-2 h-8 w-8 text-muted-foreground/40" />
                          <p className="text-sm text-muted-foreground">
                            At least 2 records needed to show chart.
                          </p>
                        </div>
                      ) : (
                        <GrowthChart records={growthRecords} />
                      )}
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-3 lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <AddAppointmentModal userRole="parent" patients={children} doctors={doctors} defaultPatientId={primaryChild?.id}>
                        <Button className="w-full justify-start" variant="secondary">
                          <Calendar className="mr-2 h-4 w-4" />
                          Book Appointment
                        </Button>
                      </AddAppointmentModal>
                      <Button className="w-full justify-start" variant="secondary" asChild>
                        <Link href={`/patients/${primaryChild.id}`}>
                          <FileText className="mr-2 h-4 w-4" />
                          View Full History
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* APPOINTMENTS */}
              <TabsContent value="appointments" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div className="space-y-1">
                      <CardTitle>Appointments</CardTitle>
                      <CardDescription>All visits for {primaryChild.name}.</CardDescription>
                    </div>
                    <AddAppointmentModal userRole="parent" patients={children} doctors={doctors} defaultPatientId={primaryChild?.id}>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" /> Schedule
                      </Button>
                    </AddAppointmentModal>
                  </CardHeader>
                  <CardContent>
                    {appointments.length === 0 ? (
                      <EmptyState icon={<Calendar />} message="No appointments yet." />
                    ) : (
                      <div className="space-y-3">
                        {appointments.map((apt) => (
                          <div key={apt.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border p-4">
                            <div>
                              <p className="font-medium">{apt.doctorName}</p>
                              <p className="text-sm text-muted-foreground">
                                {apt.type} · {apt.date} · {apt.time}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={apt.status === "upcoming" ? "default" : "secondary"}>{apt.status}</Badge>
                              {apt.status === "upcoming" && (
                                <EditAppointmentModal appointment={apt}>
                                  <Button variant="outline" size="sm">Reschedule</Button>
                                </EditAppointmentModal>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* MEDICATIONS */}
              <TabsContent value="medications" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Medications</CardTitle>
                    <CardDescription>Active prescriptions for {primaryChild.name}.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {prescriptions.length === 0 ? (
                      <EmptyState icon={<Pill />} message="No prescriptions yet." />
                    ) : (
                      <div className="space-y-3">
                        {prescriptions.map((med) => (
                          <div key={med.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border p-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                                <Pill className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{med.medication}</p>
                                <p className="text-sm text-muted-foreground">{med.dosage} · {med.doctorName}</p>
                                <p className="text-xs text-muted-foreground mt-1">Started: {med.startDate}</p>
                              </div>
                            </div>
                            <Badge variant={med.status === "active" ? "success" : "warning"}>{med.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* VACCINATIONS */}
              <TabsContent value="vaccinations" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Vaccination Schedule</CardTitle>
                    <CardDescription>
                      Sri Lanka national immunisation schedule for {primaryChild.name}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {vaccinations.length === 0 ? (
                      <EmptyState icon={<Syringe />} message="No vaccination records yet." />
                    ) : (
                      <VaccinationSchedule vaccinations={vaccinations} />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* GROWTH */}
              <TabsContent value="growth" className="mt-6 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Growth Charts</CardTitle>
                    <CardDescription>Weight and height over time.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {growthRecords.length === 0 ? (
                      <EmptyState icon={<TrendingUp />} message="No growth records yet." />
                    ) : (
                      <GrowthChart records={growthRecords} />
                    )}
                  </CardContent>
                </Card>
                {/* Growth records table */}
                {growthRecords.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Measurements History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <div className="grid grid-cols-4 bg-muted/50 p-3 text-xs font-medium text-muted-foreground">
                          <div>Date</div>
                          <div>Age</div>
                          <div>Weight</div>
                          <div>Height</div>
                        </div>
                        <div className="divide-y">
                          {[...growthRecords].reverse().map((r) => (
                            <div key={r.id} className="grid grid-cols-4 items-center p-3 text-sm hover:bg-muted/50">
                              <div>{r.date}</div>
                              <div className="text-muted-foreground">{r.ageInWeeks}w</div>
                              <div className="font-medium">{r.weightKg} kg</div>
                              <div className="font-medium">{r.heightCm} cm</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}

// ─── Small reusable sub-components ───────────────────────────────────────────

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
        <div className="flex items-center justify-between mb-1">
          {icon}
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
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
