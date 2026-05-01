"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, TrendingDown, Info, Sparkles, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateGrowthAnalysis, type GrowthAnalysis } from "@/lib/actions";

type Props = {
  patientId: string;
  userRole: "parent" | "medical_professional";
  growthRecords: {
    id: string;
    date: string;
    weightKg: number;
    heightCm: number;
    ageInWeeks: number;
    weightForAgeZScore: number | null;
    heightForAgeZScore: number | null;
  }[];
};

export default function AiGrowthAnalysisCard({ patientId, userRole, growthRecords }: Props) {
  const [analysis, setAnalysis] = useState<GrowthAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalysis = async (force = false) => {
    if (growthRecords.length === 0) return;
    setLoading(true);
    try {
      const result = await generateGrowthAnalysis(patientId, userRole, force);
      setAnalysis(result);
    } catch {
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasZScores = growthRecords.some(
      (r) => r.weightForAgeZScore !== null || r.heightForAgeZScore !== null
    );
    if (!hasZScores) return;
    fetchAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, userRole]);

  if (growthRecords.length === 0) return null;

  const hasAnomalies = analysis && analysis.anomalies.length > 0;
  const generatedAt = analysis?.trajectoryCreatedAt
    ? new Date(analysis.trajectoryCreatedAt).toLocaleString()
    : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">AI Growth Analysis</CardTitle>
          {hasAnomalies && (
            <Badge variant="destructive" className="text-xs">
              {analysis.anomalies.length} anomaly{analysis.anomalies.length > 1 ? "ies" : "y"}
            </Badge>
          )}
          {!hasAnomalies && analysis && (
            <Badge variant="success" className="text-xs">
              Normal
            </Badge>
          )}
        </div>
        {analysis && !loading && (
          <Button variant="ghost" size="sm" onClick={() => fetchAnalysis(true)}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            Regenerate
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 animate-pulse" />
            Analysing growth data...
          </div>
        )}

        {!loading && analysis && (
          <>
            {/* Anomaly alerts */}
            {analysis.anomalies.length > 0 && (
              <div className="space-y-2">
                {analysis.anomalies.map((a, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${
                      a.severity === "risk"
                        ? "border-red-200 bg-red-50/50"
                        : "border-amber-200 bg-amber-50/50"
                    }`}
                  >
                    {a.severity === "risk" ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    ) : (
                      <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    )}
                    <div className="text-sm">
                      <span
                        className={`font-medium ${
                          a.severity === "risk" ? "text-red-700" : "text-amber-700"
                        }`}
                      >
                        {a.severity === "risk" ? "Risk: " : "Warning: "}
                      </span>
                      {a.message}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Combined AI Explanation */}
            {analysis.combinedExplanation && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    AI Analysis
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {analysis.combinedExplanation}
                </p>
              </div>
            )}

            {/* Z-score table */}
            {analysis.zScores.length > 0 && (
              <div className="rounded-md border overflow-hidden overflow-x-auto">
                <div className="min-w-[420px]">
                  <div className="grid grid-cols-6 gap-x-2 bg-muted/50 p-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    <div>Date</div>
                    <div className="text-right">Age</div>
                    <div className="text-right">Weight</div>
                    <div className="text-right">WFA Z</div>
                    <div className="text-right">Height</div>
                    <div className="text-right">HFA Z</div>
                  </div>
                  <div className="divide-y">
                    {analysis.zScores.map((z, idx) => (
                      <div key={idx} className="grid grid-cols-6 gap-x-2 items-center p-2 text-xs">
                        <div>{z.date}</div>
                        <div className="text-right text-muted-foreground">{z.ageInWeeks}w</div>
                        <div className="text-right">{z.weightKg} kg</div>
                        <div className="text-right">
                          <ZScoreBadge z={z.weightForAgeZScore} status={z.weightStatus} />
                        </div>
                        <div className="text-right">{z.heightCm} cm</div>
                        <div className="text-right">
                          <ZScoreBadge z={z.heightForAgeZScore} status={z.heightStatus} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Trajectory projection table */}
            {analysis.projectedRecords.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  6-Month Projection
                </h4>
                <div className="rounded-md border overflow-hidden">
                  <div className="grid grid-cols-5 bg-muted/50 p-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    <div>Age</div>
                    <div className="text-right">Proj. Weight</div>
                    <div className="text-right">Proj. Height</div>
                    <div className="text-right">W Z-Score</div>
                    <div className="text-right">H Z-Score</div>
                  </div>
                  <div className="divide-y">
                    {analysis.projectedRecords.map((r, idx) => (
                      <div key={idx} className="grid grid-cols-5 items-center p-2 text-xs">
                        <div className="text-muted-foreground">{r.ageInWeeks}w</div>
                        <div className="text-right font-medium">{r.projectedWeightKg.toFixed(2)} kg</div>
                        <div className="text-right font-medium">{r.projectedHeightCm.toFixed(1)} cm</div>
                        <div className="text-right">
                          <ZScoreBadge z={r.weightZScore} />
                        </div>
                        <div className="text-right">
                          <ZScoreBadge z={r.heightZScore} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Generated timestamp */}
            {generatedAt && (
              <p className="text-xs text-muted-foreground">
                Trajectory generated on {generatedAt}
              </p>
            )}
          </>
        )}

        {!loading && !analysis && (
          <p className="text-sm text-muted-foreground">
            Unable to generate analysis at this time.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ZScoreBadge({
  z,
  status,
}: {
  z: number | null;
  status?: "normal" | "warning" | "risk";
}) {
  if (z === null) return <span className="text-muted-foreground">—</span>;

  const derivedStatus =
    status ?? (Math.abs(z) >= 3 ? "risk" : Math.abs(z) >= 2 ? "warning" : "normal");

  const colorClass =
    derivedStatus === "risk"
      ? "text-red-600 bg-red-50"
      : derivedStatus === "warning"
        ? "text-amber-600 bg-amber-50"
        : "text-emerald-600 bg-emerald-50";

  return (
    <span className={`inline-block rounded px-1.5 py-0.5 font-medium ${colorClass}`}>
      {z > 0 ? "+" : ""}
      {z.toFixed(1)}
    </span>
  );
}
