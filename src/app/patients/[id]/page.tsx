import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  getPatientById,
  getChildAppointments,
  getChildPrescriptions,
  getChildGrowthRecords,
  getChildVaccinations,
  isParentOfPatient,
  getVisitSummariesForPatient,
} from "@/lib/queries";
import PatientDetail from "@/components/patient/patient-detail";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Patient Details — CHMP",
};

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/login");

  const patient = await getPatientById(id);
  if (!patient) redirect("/");

  // Parents can only view their linked children
  if (session.user.role === "parent") {
    const isLinked = await isParentOfPatient(session.user.id, id);
    if (!isLinked) redirect("/parent");
  }

  const [appointments, prescriptions, growthRecords, vaccinations, rawVisitSummaries] =
    await Promise.all([
      getChildAppointments(id),
      getChildPrescriptions(id),
      getChildGrowthRecords(id),
      getChildVaccinations(id),
      getVisitSummariesForPatient(id),
    ]);

  const visitSummaries = rawVisitSummaries.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <PatientDetail
      userRole={session.user.role}
      userMedicalRole={session.user.medicalRole as string | undefined}
      userName={session.user.name}
      patient={patient}
      appointments={appointments}
      prescriptions={prescriptions}
      growthRecords={growthRecords}
      vaccinations={vaccinations}
      visitSummaries={visitSummaries}
    />
  );
}
