"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Clock,
  CheckCircle2,
  Pill,
  ChevronRight,
  Users,
  Calendar,
  AlertCircle,
  Stethoscope,
  Baby,
  Sparkles,
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
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { BabyThemedBg } from "@/components/layout/baby-themed-bg";
import { Footer } from "@/components/layout/footer";
import { ManageAvailabilityModal } from "@/components/modals/manage-availability-modal";
import { confirmAppointment } from "@/lib/actions";
import { ageLabel } from "@/lib/utils";
import AIPatientSearch from "@/components/medical-professional/ai-patient-search";

// ─── Prop types ────────────────────────────────────────────────────────────────

type Stats = {
  activePatients: number;
  todayAppointments: number;
  pendingConfirmations: number;
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

type AvailabilitySlot = {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type ParentRef = { id: string; name: string; email: string };

type Props = {
  user: { name: string; email: string };
  doctorId: string;
  medicalRole?: "pediatrician" | "midwife";
  stats: Stats;
  appointments: Appointment[];
  pendingAppointments: Appointment[];
  patients: Patient[];
  prescriptions: Prescription[];
  allPatients: Patient[];
  allParents: ParentRef[];
  availability: AvailabilitySlot[];
};

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function MedicalProfessionalDashboard({
  user,
  doctorId,
  medicalRole,
  stats,
  appointments,
  pendingAppointments,
  patients,
  prescriptions,
  allPatients,
  allParents,
  availability,
}: Props) {
  const router = useRouter();
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [patientSearchMode, setPatientSearchMode] = useState(false);
  const [aiSearchMode, setAiSearchMode] = useState(false);

  const isPediatrician = medicalRole === "pediatrician";
  const isMidwife = medicalRole === "midwife";

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) => a.date === todayStr && a.status === "upcoming");

  useEffect(() => {
    if (patientSearchQuery.trim().length === 0) {
      setPatientSearchResults([]);
      setPatientSearchMode(false);
      return;
    }
    const timer = setTimeout(() => {
      setPatientSearchLoading(true);
      fetch(`/api/patients/search?q=${encodeURIComponent(patientSearchQuery.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          setPatientSearchResults(data.patients ?? []);
          setPatientSearchMode(true);
        })
        .catch(() => {
          setPatientSearchResults([]);
          setPatientSearchMode(true);
        })
        .finally(() => setPatientSearchLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearchQuery]);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const handleConfirm = async (id: string) => {
    await confirmAppointment(id);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30">
      <DashboardHeader
        subtitle="Medical Professional Portal"
        userName={user.name}
        userRole={isPediatrician ? "Pediatrician" : isMidwife ? "Midwife" : "Medical Professional"}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="relative flex-1">
        <BabyThemedBg />
        <main className="relative flex-1 space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
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
              <p className="text-xs text-muted-foreground mt-1">
                {isPediatrician ? "Under your care" : "You have recorded data for"}
              </p>
            </CardContent>
          </Card>
          {isPediatrician && (
            <>
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
                    Pending Confirmations
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.pendingConfirmations}</div>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting your confirmation</p>
                </CardContent>
              </Card>
            </>
          )}
          {isMidwife && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Prescriptions
                  </CardTitle>
                  <Pill className="h-4 w-4 text-sky-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{prescriptions.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total issued</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Patients
                  </CardTitle>
                  <Stethoscope className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.activePatients}</div>
                  <p className="text-xs text-muted-foreground mt-1">You have recorded data for</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className={`grid w-full ${isPediatrician ? "grid-cols-3 md:w-[400px]" : "grid-cols-2 md:w-[300px]"}`}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            {isPediatrician && <TabsTrigger value="appointments">Appointments</TabsTrigger>}
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-7">
              <Card className={isPediatrician ? "md:col-span-4 lg:col-span-5" : "md:col-span-7"}>
                <CardHeader>
                  <CardTitle>
                    {isPediatrician ? "Today's Schedule" : "Patient Overview"}
                  </CardTitle>
                  <CardDescription>
                    {isPediatrician
                      ? todayAppointments.length === 0
                        ? "No appointments today."
                        : `You have ${todayAppointments.length} appointment${todayAppointments.length > 1 ? "s" : ""} today.`
                      : "Quick access to all registered patients."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isPediatrician ? (
                    todayAppointments.length === 0 ? (
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
                    )
                  ) : (
                    <div className="space-y-3">
                      {allPatients.slice(0, 5).map((patient) => (
                        <div
                          key={patient.id}
                          className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <Baby className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{patient.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {ageLabel(patient.dateOfBirth)} • {patient.gender}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/patients/${patient.id}`}>
                              View <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {isPediatrician && (
                <Card className="md:col-span-3 lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Weekly Availability</CardTitle>
                    <CardDescription>Your recurring schedule</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {availability.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No availability set.</p>
                    ) : (
                      availability.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{dayNames[slot.dayOfWeek]}</span>
                          <span className="text-muted-foreground">{slot.startTime} – {slot.endTime}</span>
                        </div>
                      ))
                    )}
                    <ManageAvailabilityModal doctorId={doctorId} availability={availability}>
                      <Button className="w-full" variant="outline">
                        <Calendar className="mr-2 h-4 w-4 text-amber-500" />
                        Manage Availability
                      </Button>
                    </ManageAvailabilityModal>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* PATIENTS */}
          <TabsContent value="patients" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                  <CardTitle>
                    {aiSearchMode
                      ? "AI Search"
                      : patientSearchMode
                        ? "Search Results"
                        : "My Patients"}
                  </CardTitle>
                  <CardDescription>
                    {aiSearchMode
                      ? "Search patients using natural language."
                      : patientSearchMode
                        ? `${patientSearchResults.length} result${patientSearchResults.length !== 1 ? "s" : ""} found.`
                        : `${patients.length} patient${patients.length !== 1 ? "s" : ""} under your care.`}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={aiSearchMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setAiSearchMode(!aiSearchMode);
                      setPatientSearchQuery("");
                      setPatientSearchMode(false);
                      setPatientSearchResults([]);
                    }}
                  >
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                    {aiSearchMode ? "Name Search" : "AI Search"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {aiSearchMode ? (
                  <AIPatientSearch />
                ) : (
                  <>
                    <div className="mb-6 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search all patients by name..."
                        className="pl-9 max-w-sm"
                        value={patientSearchQuery}
                        onChange={(e) => setPatientSearchQuery(e.target.value)}
                      />
                      {patientSearchMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2"
                          onClick={() => {
                            setPatientSearchQuery("");
                            setPatientSearchMode(false);
                            setPatientSearchResults([]);
                          }}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    {patientSearchLoading ? (
                      <div className="flex flex-col items-center py-10 text-center">
                        <Users className="mb-3 h-10 w-10 text-muted-foreground/40 animate-pulse" />
                        <p className="text-sm text-muted-foreground">Searching patients...</p>
                      </div>
                    ) : (
                      (() => {
                        const displayPatients = patientSearchMode ? patientSearchResults : patients;
                        return displayPatients.length === 0 ? (
                          <div className="flex flex-col items-center py-10 text-center">
                            <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                              {patientSearchMode ? "No patients found." : "No patients under your care yet."}
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-md border">
                            <div className="grid grid-cols-12 bg-muted/50 p-3 text-xs font-medium text-muted-foreground">
                              <div className="col-span-4">Patient</div>
                              <div className="col-span-4">Age</div>
                              <div className="col-span-1">Gender</div>
                              <div className="col-span-2">Blood Type</div>
                              <div className="col-span-1"></div>
                            </div>
                            <div className="divide-y">
                              {displayPatients.map((patient) => (
                                <div
                                  key={patient.id}
                                  className="grid grid-cols-12 items-center p-3 text-sm hover:bg-muted/50 transition-colors"
                                >
                                  <div className="col-span-4 font-medium min-w-0 truncate">
                                    <Link href={`/patients/${patient.id}`} className="hover:underline hover:text-primary transition-colors">
                                      {patient.name}
                                    </Link>
                                  </div>
                                  <div className="col-span-4 text-muted-foreground min-w-0 truncate">{ageLabel(patient.dateOfBirth)}</div>
                                  <div className="col-span-1 text-muted-foreground capitalize min-w-0 truncate">{patient.gender}</div>
                                  <div className="col-span-2 min-w-0">
                                    <Badge variant="outline" className="truncate">{patient.bloodType ?? "—"}</Badge>
                                  </div>
                                  <div className="col-span-1 text-right">
                                    <Button variant="ghost" size="sm" asChild>
                                      <Link href={`/patients/${patient.id}`}>
                                        View <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                      </Link>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* APPOINTMENTS (pediatrician only) */}
          {isPediatrician && (
            <TabsContent value="appointments" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div className="space-y-1">
                    <CardTitle>All Appointments</CardTitle>
                    <CardDescription>
                      {appointments.length} total appointment{appointments.length !== 1 ? "s" : ""}.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Pending confirmations */}
                  {pendingAppointments.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-amber-600">Pending Confirmation</h3>
                      {pendingAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4"
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
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                              Pending
                            </Badge>
                            <Button size="sm" onClick={() => handleConfirm(apt.id)}>
                              Confirm
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/patients/${apt.patientId}`}>
                                View <ChevronRight className="ml-1 h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* All appointments */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">All Appointments</h3>
                    {appointments.filter((a) => a.status !== "pending").length === 0 ? (
                      <div className="flex flex-col items-center py-6 text-center">
                        <Calendar className="mb-3 h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No confirmed appointments yet.</p>
                      </div>
                    ) : (
                      appointments
                        .filter((a) => a.status !== "pending")
                        .map((apt) => (
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
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/patients/${apt.patientId}`}>
                                  View <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}


        </Tabs>
      </main>
      </div>
      <Footer />
    </div>
  );
}
