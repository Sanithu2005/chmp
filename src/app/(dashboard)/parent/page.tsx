import { redirect } from "next/navigation";
import { headers } from "next/headers";
import ParentDashboard from "@/components/parent/parent-dashboard";
import { auth } from "@/lib/auth";
import {
  getParentChildren,
  getChildAppointments,
  getChildPrescriptions,
  getChildGrowthRecords,
  getChildVaccinations,
  getAllDoctors,
} from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parent Dashboard — CHMP",
  description: "Parent Portal for managing child health records",
};

export default async function ParentDashboardPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/login");
  if (session.user.role !== "parent") redirect("/doctor");

  const parentId = session.user.id;
  const children = await getParentChildren(parentId);
  const selectedChildId =
    typeof searchParams?.child === "string" ? searchParams.child : undefined;
  const primaryChild =
    children.find((c) => c.id === selectedChildId) ?? children[0] ?? null;

  const [appointments, prescriptions, growthRecords, vaccinations, doctors] =
    primaryChild
      ? await Promise.all([
          getChildAppointments(primaryChild.id),
          getChildPrescriptions(primaryChild.id),
          getChildGrowthRecords(primaryChild.id),
          getChildVaccinations(primaryChild.id),
          getAllDoctors(),
        ])
      : [[], [], [], [], await getAllDoctors()];

  return (
    <ParentDashboard
      user={{ name: session.user.name, email: session.user.email }}
      children={children}
      primaryChild={primaryChild}
      appointments={appointments}
      prescriptions={prescriptions}
      growthRecords={growthRecords}
      vaccinations={vaccinations}
      doctors={doctors}
    />
  );
}
