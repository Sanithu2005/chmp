"use client";

import { useState, useRef, useCallback } from "react";
import { Search, Sparkles, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ageLabel } from "@/lib/utils";

type Patient = {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string | null;
  image: string | null;
};

type Props = {
  onSelect?: (patient: Patient) => void;
};

export default function AIPatientSearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length === 0) {
      setResults([]);
      setActive(false);
      return;
    }

    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch("/api/ai/patient-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
        signal: controller.signal,
      });
      const data = await res.json();
      setResults(data.patients ?? []);
      setActive(true);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setResults([]);
      setActive(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      doSearch(query);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setActive(false);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Try: 'overdue for MMR' or 'female under 1 year'..."
          className="pl-9 pr-24"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClear}>
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => doSearch(query)}
            disabled={loading || query.trim().length === 0}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Search"}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analysing query...
        </div>
      )}

      {!loading && active && (
        <div className="space-y-2">
          {results.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              No patients match your query.
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
                {results.map((patient) => (
                  <div
                    key={patient.id}
                    className="grid grid-cols-12 items-center p-3 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <div className="col-span-4 font-medium min-w-0 truncate">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="hover:underline hover:text-primary transition-colors"
                      >
                        {patient.name}
                      </Link>
                    </div>
                    <div className="col-span-4 text-muted-foreground min-w-0 truncate">
                      {ageLabel(patient.dateOfBirth)}
                    </div>
                    <div className="col-span-1 text-muted-foreground capitalize min-w-0 truncate">
                      {patient.gender}
                    </div>
                    <div className="col-span-2 min-w-0">
                      <Badge variant="outline" className="truncate">
                        {patient.bloodType ?? "—"}
                      </Badge>
                    </div>
                    <div className="col-span-1 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/patients/${patient.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
