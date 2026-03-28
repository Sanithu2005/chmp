"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LogOut,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  Pill,
  FileText,
  ChevronRight,
  Activity,
  Users,
  Calendar,
  AlertCircle,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AddPatientModal } from "@/components/modals/add-patient-modal";
import { AddAppointmentModal } from "@/components/modals/add-appointment-modal";
import { AddPrescriptionModal } from "@/components/modals/add-prescription-modal";
import { AddGrowthRecordModal } from "@/components/modals/add-growth-record-modal";

// ─── Prop types (inferred from query return types) ───────────────────────────
type Stats = {
  activePatients: number;
  todayAppointments: number;
  pendingPrescriptions: number;
};

type Appointment = {
  id: string;
  patientId: string;
  date: string;
  time: string;
  type: string;
  status: string;
  notes: string | null;
  patientName: string;
  patientDob: string;
};

type Patient = {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string | null;
};

type Prescription = {
  id: string;
  patientId: string;
  medication: string;
  dosage: string;
  status: string;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  patientName: string;
};

type ParentRef = { id: string; name: string; email: string };

type Props = {
  user: { name: string; email: string };
  doctorId: string;
  stats: Stats;
  appointments: Appointment[];
  patients: Patient[];
  prescriptions: Prescription[];
  allPatients: Patient[];
  allParents: ParentRef[];
};

// Helper to compute age string from ISO date string
function ageLabel(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  const weeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
  if (weeks < 4) return `${weeks}w`;
  const months = Math.floor(weeks / 4.33);
  if (months < 24) return `${months} months`;
  return `${Math.floor(months / 12)} years`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function DoctorDashboard({
  user,
  doctorId,
  stats,
  appointments,
  patients,
  prescriptions,
  allPatients,
  allParents,
}: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) => a.date === todayStr);

  const filteredPatients = allPatients.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 shadow-sm sm:px-6">
        <div className="flex flex-1 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-semibold leading-none tracking-tight">CHMP Portal</h1>
            <p className="text-xs text-muted-foreground mt-1">Medical Professional</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">Pediatrician</span>
          </div>
          <ThemeToggle />
          <Avatar className="h-9 w-9 border">
            <AvatarImage src="" alt={user.name} />
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Patients
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activePatients}</div>
              <p className="text-xs text-muted-foreground mt-1">Under your care</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today&apos;s Appointments
              </CardTitle>
              <Calendar className="h-4 w-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.todayAppointments}</div>
              <p className="text-xs text-muted-foreground mt-1">Upcoming today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Prescriptions
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pendingPrescriptions}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:w-[500px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-7">
              <Card className="md:col-span-4 lg:col-span-5">
                <CardHeader>
                  <CardTitle>Today&apos;s Schedule</CardTitle>
                  <CardDescription>
                    {todayAppointments.length === 0
                      ? "No appointments today."
                      : `You have ${todayAppointments.length} appointment${todayAppointments.length > 1 ? "s" : ""} today.`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {todayAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <CheckCircle2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">All clear for today!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {todayAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border p-4 transition-all hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                              <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{apt.patientName}</p>
                              <p className="text-sm text-muted-foreground">
                                {ageLabel(apt.patientDob)} • {apt.type}
                              </p>
                            </div>
                          </div>
                          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-4">
                            <div className="text-sm font-medium">{apt.time}</div>
                            <Badge variant={apt.status === "upcoming" ? "default" : "secondary"}>
                              {apt.status === "upcoming" ? "Upcoming" : "Completed"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-3 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <AddPatientModal userRole="medical_professional" parents={allParents}>
                    <Button className="w-full justify-start" variant="outline">
                      <Plus className="mr-2 h-4 w-4 text-primary" />
                      New Patient
                    </Button>
                  </AddPatientModal>
                  <AddPrescriptionModal patients={allPatients}>
                    <Button className="w-full justify-start" variant="outline">
                      <Pill className="mr-2 h-4 w-4 text-sky-500" />
                      Prescribe Medication
                    </Button>
                  </AddPrescriptionModal>
                  <AddAppointmentModal userRole="medical_professional" patients={allPatients} doctors={[]} defaultDoctorId={doctorId}>
                    <Button className="w-full justify-start" variant="outline">
                      <Calendar className="mr-2 h-4 w-4 text-amber-500" />
                      Schedule Appointment
                    </Button>
                  </AddAppointmentModal>
                  <AddGrowthRecordModal patients={allPatients}>
                    <Button className="w-full justify-start" variant="outline">
                      <Activity className="mr-2 h-4 w-4 text-emerald-500" />
                      Record Growth Data
                    </Button>
                  </AddGrowthRecordModal>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* PATIENTS */}
          <TabsContent value="patients" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                  <CardTitle>Patient Directory</CardTitle>
                  <CardDescription>
                    {allPatients.length} patient{allPatients.length !== 1 ? "s" : ""} registered.
                  </CardDescription>
                </div>
                <AddPatientModal userRole="medical_professional" parents={allParents}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Patient
                  </Button>
                </AddPatientModal>
              </CardHeader>
              <CardContent>
                <div className="mb-6 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    className="pl-9 max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {filteredPatients.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No patients found.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 bg-muted/50 p-3 text-xs font-medium text-muted-foreground">
                      <div className="col-span-2">Patient</div>
                      <div>Age</div>
                      <div>Gender</div>
                      <div>Blood Type</div>
                    </div>
                    <div className="divide-y">
                      {filteredPatients.map((patient) => (
                        <div
                          key={patient.id}
                          className="grid grid-cols-5 items-center p-3 text-sm hover:bg-muted/50 transition-colors"
                        >
                          <div className="col-span-2 font-medium">
                            <Link href={`/patients/${patient.id}`} className="hover:underline hover:text-primary transition-colors">
                              {patient.name}
                            </Link>
                          </div>
                          <div className="text-muted-foreground">{ageLabel(patient.dateOfBirth)}</div>
                          <div className="text-muted-foreground capitalize">{patient.gender}</div>
                          <div>
                            <Badge variant="outline">{patient.bloodType ?? "—"}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* APPOINTMENTS */}
          <TabsContent value="appointments" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                  <CardTitle>All Appointments</CardTitle>
                  <CardDescription>
                    {appointments.length} total appointment{appointments.length !== 1 ? "s" : ""}.
                  </CardDescription>
                </div>
                <AddAppointmentModal userRole="medical_professional" patients={allPatients} doctors={[]} defaultDoctorId={doctorId}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Schedule New
                  </Button>
                </AddAppointmentModal>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <Calendar className="mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No appointments yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border p-4"
                      >
                        <div>
                          <p className="font-medium">{apt.patientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {apt.type} • {apt.date} • {apt.time}
                          </p>
                          {apt.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">{apt.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={apt.status === "upcoming" ? "default" : "secondary"}>
                            {apt.status === "upcoming" ? "Upcoming" : apt.status}
                          </Badge>
                          <Button variant="secondary" size="sm" asChild>
                            <Link href={`/patients/${apt.patientId}`}>Details</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PRESCRIPTIONS */}
          <TabsContent value="prescriptions" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                  <CardTitle>Prescriptions</CardTitle>
                  <CardDescription>
                    {prescriptions.length} prescription{prescriptions.length !== 1 ? "s" : ""} issued.
                  </CardDescription>
                </div>
                <AddPrescriptionModal patients={allPatients}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Prescription
                  </Button>
                </AddPrescriptionModal>
              </CardHeader>
              <CardContent>
                {prescriptions.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <Pill className="mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No prescriptions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.map((rx) => (
                      <div
                        key={rx.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                            <Pill className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{rx.patientName}</p>
                            <p className="text-sm text-muted-foreground">
                              {rx.medication} • {rx.dosage}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Started: {rx.startDate}
                              {rx.endDate ? ` · Ends: ${rx.endDate}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={rx.status === "active" ? "success" : "warning"}>
                            {rx.status}
                          </Badge>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/patients/${rx.patientId}`}>Manage</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
