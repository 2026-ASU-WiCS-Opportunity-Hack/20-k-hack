"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, Upload, FileText, AlertCircle, CheckCircle2, X } from "lucide-react";
import { ClientCSVRow, downloadTemplate, parseCSV } from "@/lib/csv-utils";

interface ImportResult { success: number; failed: number; errors: string[] }
interface CSVImportExportProps {
  clients: Partial<ClientCSVRow>[];
  onImport: (rows: ClientCSVRow[]) => Promise<void>;
}

function ExportButton({ clients }: { clients: Partial<ClientCSVRow>[] }) {
  const [loading, setLoading] = useState(false);
  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients/export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `safecase_clients_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally { setLoading(false); }
  };
  return (
    <Button variant="outline" onClick={handleExport} disabled={loading}>
      <Download className="mr-2 h-4 w-4" />
      {loading ? "Exporting…" : `Export CSV (${clients.length})`}
    </Button>
  );
}

function ImportDialog({ onImport }: { onImport: (rows: ClientCSVRow[]) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ClientCSVRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null); setPreview([]); setParseErrors([]); setResult(null); setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f); setResult(null);
    const { data, errors } = await parseCSV(await f.text());
    setPreview(data.slice(0, 5));
    setParseErrors(errors);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true); setProgress(40);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/clients/import', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setProgress(100);
      setResult({ success: json.imported, failed: 0, errors: [] });
      await onImport([]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Import failed";
      setResult({ success: 0, failed: 0, errors: [message] });
    } finally { setImporting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Import CSV</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Clients from CSV</DialogTitle>
          <DialogDescription>Upload a CSV file to bulk-add clients.</DialogDescription>
        </DialogHeader>

        <button onClick={downloadTemplate} className="flex items-center gap-2 text-sm text-blue-600 hover:underline w-fit">
          <FileText className="h-4 w-4" />Download template CSV
        </button>

        <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => inputRef.current?.click()}>
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{file.name}</span>
              <Badge variant="secondary">{preview.length} rows preview</Badge>
              <button onClick={(e) => { e.stopPropagation(); reset(); }}>
                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload a .csv file</p>
            </div>
          )}
        </div>

        {parseErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside text-sm">
                {parseErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {preview.length > 0 && parseErrors.length === 0 && (
          <div className="overflow-x-auto rounded border text-sm">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Phone</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Language</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.phone}</td>
                    <td className="px-3 py-2">{row.email}</td>
                    <td className="px-3 py-2">{row.language}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-3 py-2 text-xs text-muted-foreground bg-muted/50">Showing first {preview.length} rows</p>
          </div>
        )}

        {importing && <Progress value={progress} className="h-2" />}

        {result && (
          <Alert variant={result.failed > 0 ? "destructive" : "default"}>
            {result.failed > 0 ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <AlertDescription>
              {result.failed > 0 ? `Import failed: ${result.errors.join(", ")}` : `Successfully imported ${result.success} clients!`}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={!file || parseErrors.length > 0 || importing || !!result}>
            {importing ? "Importing…" : "Import All Rows"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CSVImportExport({ clients, onImport }: CSVImportExportProps) {
  return (
    <div className="flex items-center gap-2">
      <ImportDialog onImport={onImport} />
      <ExportButton clients={clients} />
    </div>
  );
}