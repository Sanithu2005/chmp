import { redirect } from "next/navigation";
import { headers } from "next/headers";
import DoctorDashboard from "@/components/doctor/doctor-dashboard";
import { auth } from "@/lib/auth";
import {
  getDoctorStats,
  getDoctorAppointments,
  getDoctorPatients,
  getDoctorPrescriptions,
  getAllPatients,
  getAllParents,
} from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doctor Dashboard — CHMP",
  description: "Medical Professional Portal for CHMP",
};

export default async function DoctorDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "medical_professional") {
    redirect("/parent");
  }

  const doctorId = session.user.id;

  // Fetch all data in parallel
  const [stats, appointments, patients, prescriptions, allPatients, allParents] =
    await Promise.all([
      getDoctorStats(doctorId),
      getDoctorAppointments(doctorId),
      getDoctorPatients(doctorId),
      getDoctorPrescriptions(doctorId),
      getAllPatients(),
      getAllParents(),
    ]);

  return (
    <DoctorDashboard
      user={{ name: session.user.name, email: session.user.email }}
      doctorId={doctorId}
      stats={stats}
      appointments={appointments}
      patients={patients}
      prescriptions={prescriptions}
      allPatients={allPatients}
      allParents={allParents}
    />
  );
}
