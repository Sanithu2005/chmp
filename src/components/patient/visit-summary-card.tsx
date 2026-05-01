"use client";

import { FileText, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type VisitSummary = {
  id: string;
  appointmentId: string;
  summary: string;
  createdAt: string;
  doctorName: string;
};

type Props = {
  summary: VisitSummary | null;
};

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  const listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 ml-2">
          {listItems}
        </ul>
      );
      listItems.length = 0;
      inList = false;
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed === "") {
      flushList();
      return;
    }

    // Heading
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h4 key={i} className="text-sm font-semibold mt-3 mb-1">
          {parseInline(trimmed.slice(3))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h4 key={i} className="text-sm font-semibold mt-3 mb-1">
          {parseInline(trimmed.slice(2))}
        </h4>
      );
      return;
    }

    // List item
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      listItems.push(
        <li key={i} className="text-sm">
          {parseInline(trimmed.slice(2))}
        </li>
      );
      return;
    }

    if (inList && !trimmed.startsWith("- ") && !trimmed.startsWith("* ")) {
      flushList();
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={i} className="text-sm leading-relaxed">
        {parseInline(trimmed)}
      </p>
    );
  });

  flushList();
  return elements;
}

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const raw = match[0];
    if (raw.startsWith("**") && raw.endsWith("**")) {
      parts.push(
        <strong key={match.index}>{raw.slice(2, -2)}</strong>
      );
    } else if (raw.startsWith("*") && raw.endsWith("*")) {
      parts.push(
        <em key={match.index}>{raw.slice(1, -1)}</em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export default function VisitSummaryCard({ summary }: Props) {
  if (!summary) return null;

  const formattedDate = new Date(summary.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-4 w-4 text-primary" />
        <span className="text-base font-semibold">Visit Summary</span>
        <Badge variant="outline" className="text-xs">
          <Sparkles className="mr-1 h-3 w-3" />
          AI Generated
        </Badge>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <span>By {summary.doctorName}</span>
        <span>·</span>
        <span>{formattedDate}</span>
      </div>
      <div className="space-y-2">
        {renderMarkdown(summary.summary)}
      </div>
    </div>
  );
}
