/**
 * Corporate multi-recipient list import with row-level validation.
 * Runs in the browser; creates no order and submits nothing on its own.
 */

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { recipientTemplateCsv, validateRecipients, type ImportResult } from "@/lib/recipients";

export function RecipientImport({ onValidated }: { onValidated?: (result: ImportResult) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (file.size > 2_000_000) {
      toast.error("That file is larger than 2 MB. Please split the list.");
      return;
    }
    const isXlsx = /\.xlsx?$/i.test(file.name);
    if (isXlsx) {
      toast.error("Please save the sheet as CSV and upload it again.", {
        description: "Excel files can be exported with File → Save as → CSV.",
      });
      return;
    }

    setBusy(true);
    try {
      const text = await file.text();
      const validated = validateRecipients(text);
      setResult(validated);
      setFileName(file.name);
      onValidated?.(validated);
      track({
        name: "recipient_import",
        params: {
          rows: validated.totalRows,
          valid: validated.valid.length,
          errors: validated.issues.filter((i) => i.severity === "error").length,
        },
      });
    } catch {
      toast.error("That file could not be read. Please upload a plain CSV.");
    } finally {
      setBusy(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([recipientTemplateCsv()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "oasis-recipient-list-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const errors = result?.issues.filter((i) => i.severity === "error") ?? [];
  const warnings = result?.issues.filter((i) => i.severity === "warning") ?? [];

  return (
    <div className="rounded-sm border border-border bg-background p-6">
      <div className="flex flex-wrap items-start gap-4">
        <FileSpreadsheet className="size-6 shrink-0 text-gold" aria-hidden="true" />
        <div className="min-w-[16rem] flex-1">
          <h3 className="font-display text-lg">Multi-recipient dispatch list</h3>
          <p className="mt-1 text-[0.875rem] text-muted-foreground">
            Upload your recipient list as CSV. Every row is checked for a complete address, a valid PIN
            code, contact details, quantity and duplicates before anything is sent to our team.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={downloadTemplate}>
            <Download className="mr-2 size-4" aria-hidden="true" />
            Template
          </Button>
          <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
            <Upload className="mr-2 size-4" aria-hidden="true" />
            {busy ? "Checking…" : "Upload list"}
          </Button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        aria-label="Upload recipient list CSV"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />

      {result ? (
        <div className="mt-6 border-t border-border pt-6">
          <p className="text-[0.875rem]">
            <span className="font-medium">{fileName}</span> — {result.totalRows} rows read,{" "}
            {result.valid.length} ready, {result.rejected.length} needing correction, {result.totalQuantity}{" "}
            boxes in total.
          </p>

          {errors.length > 0 ? (
            <div className="mt-4">
              <p className="flex items-center gap-2 text-[0.875rem]">
                <AlertTriangle className="size-4 text-gold" aria-hidden="true" />
                Fix these rows and upload again:
              </p>
              <ul className="mt-3 max-h-56 space-y-1 overflow-auto text-[0.8125rem] text-muted-foreground">
                {errors.slice(0, 50).map((issue, index) => (
                  <li key={`${issue.row}-${issue.field}-${index}`}>
                    Row {issue.row} · {issue.field}: {issue.message}
                  </li>
                ))}
              </ul>
              {errors.length > 50 ? (
                <p className="mt-2 text-[0.8125rem] text-muted-foreground">
                  …and {errors.length - 50} more.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 flex items-center gap-2 text-[0.875rem]">
              <CheckCircle2 className="size-4 text-sage" aria-hidden="true" />
              Every row passed validation. Attach this list to your enquiry below and our team will confirm
              the schedule.
            </p>
          )}

          {warnings.length > 0 ? (
            <ul className="mt-4 max-h-40 space-y-1 overflow-auto text-[0.8125rem] text-muted-foreground">
              {warnings.slice(0, 20).map((issue, index) => (
                <li key={`w-${issue.row}-${index}`}>
                  Row {issue.row} · {issue.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
