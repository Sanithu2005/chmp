import { redirect } from "next/navigation";
import { headers } from "next/headers";
import MedicalProfessionalDashboard from "@/components/medical-professional/medical-professional-dashboard";
import { auth } from "@/lib/auth";
import {
  getDoctorStats,
  getDoctorAppointments,
  getDoctorPendingAppointments,
  getDoctorPatients,
  getDoctorPrescriptions,
  getDoctorAvailability,
  getMidwifeStats,
  getAllPatients,
  getAllParents,
} from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Medical Professional Dashboard — CHMP",
  description: "Medical Professional Portal for CHMP",
};

export default async function MedicalProfessionalDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "medical_professional") {
    redirect("/parent");
  }

  const doctorId = session.user.id;
  const medicalRole = session.user.medicalRole as "pediatrician" | "midwife" | undefined;

  // Common data for both roles
  const [patients, prescriptions, allPatients, allParents] = await Promise.all([
    getDoctorPatients(doctorId),
    getDoctorPrescriptions(doctorId),
    getAllPatients(),
    getAllParents(),
  ]);

  // Role-specific data
  let stats = { activePatients: 0, todayAppointments: 0, pendingConfirmations: 0 };
  let appointments: Awaited<ReturnType<typeof getDoctorAppointments>> = [];
  let pendingAppointments: Awaited<ReturnType<typeof getDoctorPendingAppointments>> = [];
  let availability: Awaited<ReturnType<typeof getDoctorAvailability>> = [];

  if (medicalRole === "pediatrician") {
    [stats, appointments, pendingAppointments, availability] = await Promise.all([
      getDoctorStats(doctorId),
      getDoctorAppointments(doctorId),
      getDoctorPendingAppointments(doctorId),
      getDoctorAvailability(doctorId),
    ]);
  } else if (medicalRole === "midwife") {
    stats = { ...(await getMidwifeStats(doctorId)), todayAppointments: 0, pendingConfirmations: 0 };
  }

  return (
    <MedicalProfessionalDashboard
      user={{ name: session.user.name, email: session.user.email }}
      doctorId={doctorId}
      medicalRole={medicalRole}
      stats={stats}
      appointments={appointments}
      pendingAppointments={pendingAppointments}
      patients={patients}
      prescriptions={prescriptions}
      allPatients={allPatients}
      allParents={allParents}
      availability={availability}
    />
  );
}
