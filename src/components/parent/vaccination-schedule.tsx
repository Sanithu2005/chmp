import { CheckCircle2, Clock, AlertCircle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

type Props = {
  vaccinations: VaccinationRecord[];
};

const statusConfig = {
  administered: {
    icon: CheckCircle2,
    label: "Administered",
    variant: "success" as const,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  upcoming: {
    icon: Clock,
    label: "Upcoming",
    variant: "info" as const,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
  due_this_week: {
    icon: Calendar,
    label: "Due This Week",
    variant: "warning" as const,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  overdue: {
    icon: AlertCircle,
    label: "Overdue",
    variant: "destructive" as const,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
};

export default function VaccinationSchedule({ vaccinations }: Props) {
  const administered = vaccinations.filter((v) => v.status === "administered");
  const pending = vaccinations.filter((v) => v.status !== "administered");

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex justify-between mb-2 text-sm">
          <span className="font-medium">Vaccination Progress</span>
          <span className="text-muted-foreground">
            {administered.length} / {vaccinations.length} completed
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
            style={{
              width: vaccinations.length
                ? `${(administered.length / vaccinations.length) * 100}%`
                : "0%",
            }}
          />
        </div>
      </div>

      {/* Vaccination list */}
      <div className="space-y-3">
        {vaccinations.map((v) => {
          const config = statusConfig[v.status as keyof typeof statusConfig] ?? statusConfig.upcoming;
          const Icon = config.icon;
          return (
            <div
              key={v.id}
              className="flex items-start gap-4 rounded-xl border bg-card p-4 transition-all hover:shadow-sm"
            >
              <div className={`rounded-full p-2 ${config.bg} shrink-0`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{v.vaccineName}</p>
                    {v.vaccineDescription && (
                      <p className="text-xs text-muted-foreground">{v.vaccineDescription}</p>
                    )}
                  </div>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Due: {v.dueDate}</span>
                  {v.administeredDate && <span>Given: {v.administeredDate}</span>}
                  {v.clinic && <span>At: {v.clinic}</span>}
                  {v.batchNumber && <span>Batch: {v.batchNumber}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
