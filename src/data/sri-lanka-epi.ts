/**
 * Sri Lanka National Immunisation Schedule (EPI)
 *
 * Based on the Sri Lanka Expanded Programme on Immunisation schedule.
 * Ages are expressed in weeks from birth.
 */

export interface EPIScheduleEntry {
  vaccineName: string;
  dueAgeWeeks: number;
}

export const sriLankaEPISchedule: EPIScheduleEntry[] = [
  // Birth dose
  { vaccineName: "BCG", dueAgeWeeks: 0 },
  { vaccineName: "OPV 0", dueAgeWeeks: 0 },
  { vaccineName: "Hepatitis B (Birth)", dueAgeWeeks: 0 },

  // 2 months (8 weeks)
  { vaccineName: "OPV 1", dueAgeWeeks: 8 },
  { vaccineName: "Pentavalent 1", dueAgeWeeks: 8 },

  // 4 months (16 weeks)
  { vaccineName: "OPV 2", dueAgeWeeks: 16 },
  { vaccineName: "Pentavalent 2", dueAgeWeeks: 16 },

  // 6 months (24 weeks)
  { vaccineName: "OPV 3", dueAgeWeeks: 24 },
  { vaccineName: "Pentavalent 3", dueAgeWeeks: 24 },

  // 9 months (39 weeks)
  { vaccineName: "MMR 1", dueAgeWeeks: 39 },

  // 12 months (52 weeks)
  { vaccineName: "Japanese Encephalitis", dueAgeWeeks: 52 },

  // 18 months (78 weeks)
  { vaccineName: "MMR 2", dueAgeWeeks: 78 },
  { vaccineName: "OPV Booster", dueAgeWeeks: 78 },
  { vaccineName: "DPT Booster", dueAgeWeeks: 78 },

  // 3 years (156 weeks)
  { vaccineName: "Japanese Encephalitis 2", dueAgeWeeks: 156 },

  // 5 years (260 weeks)
  { vaccineName: "DT", dueAgeWeeks: 260 },
];

/**
 * Compute the due date for a vaccine given the patient's date of birth.
 */
export function computeDueDate(dateOfBirth: string | Date, dueAgeWeeks: number): string {
  const dob = new Date(dateOfBirth);
  const due = new Date(dob.getTime() + dueAgeWeeks * 7 * 24 * 60 * 60 * 1000);
  return due.toISOString().split("T")[0];
}
