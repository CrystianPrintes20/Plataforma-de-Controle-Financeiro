import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useToast } from "@/shared/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { api, buildUrl } from "@shared/routes";
import { apiSend } from "@/shared/lib/api";
import { useInvestments } from "../hooks/use-investments";

const monthHeaders = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

type ParsedRow = {
  row: number;
  data: Record<string, string>;
  error?: string;
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function splitCsvLine(line: string, delimiter: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === "\"") {
      const next = line[i + 1];
      if (inQuotes && next === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === delimiter && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  return result.map((item) => item.trim());
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const delimiter = lines[0].includes(";") && !lines[0].includes(",") ? ";" : ",";
  const headers = splitCsvLine(lines[0], delimiter).map(normalizeHeader);
  const rows = lines.slice(1).map((line) => splitCsvLine(line, delimiter));
  return { headers, rows };
}

function parseAmount(value: string | undefined | null) {
  if (typeof value !== "string") return null;
  if (!value.trim()) return null;
  let sanitized = value.replace(/[^\d,.-]/g, "");
  if (sanitized.includes(",") && sanitized.includes(".")) {
    sanitized = sanitized.replace(/\./g, "").replace(",", ".");
  } else if (sanitized.includes(",")) {
    sanitized = sanitized.replace(",", ".");
  }
  const amount = Number(sanitized);
  return Number.isNaN(amount) ? null : amount;
}

export function ImportInvestmentsModal({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [fixedYear, setFixedYear] = useState("2025");
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: investments } = useInvestments();

  const investmentMap = useMemo(() => {
    return new Map(
      (investments ?? []).map((inv) => [inv.name.trim().toLowerCase(), inv.id])
    );
  }, [investments]);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const { headers, rows } = parseCsv(text);
    const headerIndex = new Map(headers.map((h, index) => [h, index]));
    const isMatrix = monthHeaders.every((month) => headerIndex.has(month));

    const parsedRows: ParsedRow[] = rows.map((rowValues, rowIndex) => {
      const data: Record<string, string> = {};
      const nameIndex = headerIndex.get("receitas_atuais") ?? headerIndex.get("receitas") ?? 1;
      data.nome = rowValues[nameIndex] ?? "";
      monthHeaders.forEach((month) => {
        const index = headerIndex.get(month) ?? -1;
        data[month] = index >= 0 ? rowValues[index] ?? "" : "";
      });

      let error = "";
      if (!isMatrix) error = "Formato inválido";
      else if (!data.nome) error = "Nome obrigatório";
      // Se não existir, será criado automaticamente na importação
      else {
        const monthValues = monthHeaders
          .map((month) => parseAmount(data[month] ?? ""))
          .filter((value) => value !== null) as number[];
        if (monthValues.length === 0) error = "Sem valores mensais";
      }

      return { row: rowIndex + 2, data, error: error || undefined };
    });

    setParsed(parsedRows);
  };

  const handleImport = async () => {
    const validRows = parsed.filter((row) => !row.error);
    if (validRows.length === 0) {
      toast({ title: "Sem dados válidos", description: "Revise o arquivo.", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    try {
      const yearValue = Number(fixedYear);
      if (Number.isNaN(yearValue)) {
        toast({ title: "Ano inválido", description: "Informe um ano válido.", variant: "destructive" });
        return;
      }

      for (const row of validRows) {
        const nameKey = row.data.nome.trim().toLowerCase();
        let investmentId = investmentMap.get(nameKey);

        let latestValue: number | null = null;
        for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
          const value = parseAmount(row.data[monthHeaders[monthIndex]] ?? "");
          if (value === null) continue;
          latestValue = value;
          if (!investmentId) {
            const created = await apiSend(
              api.investments.create.path,
              "POST",
              api.investments.create.responses[201],
              {
                name: row.data.nome.trim(),
                type: "other",
                initialAmount: String(value),
                currentValue: String(value),
              }
            );
            investmentId = created.id;
            investmentMap.set(nameKey, created.id);
          }
          await apiSend(api.investments.entries.create.path, "POST", api.investments.entries.create.responses[201], {
            investmentId,
            year: yearValue,
            month: monthIndex + 1,
            value: String(value),
          });
        }

        if (latestValue !== null) {
          const url = buildUrl(api.investments.update.path, { id: investmentId });
          await apiSend(url, "PUT", api.investments.update.responses[200], {
            currentValue: String(latestValue),
          });
        }
      }

      await queryClient.invalidateQueries({ queryKey: [api.investments.list.path] });
      await queryClient.invalidateQueries({ queryKey: [api.investments.entries.list.path] });
      toast({ title: "Importação concluída", description: `${validRows.length} registros importados.` });
      setParsed([]);
      setFileName("");
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao importar";
      toast({ title: "Erro na importação", description: message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={cn("gap-2", triggerClassName)}>
          <Upload className="h-4 w-4" />
          Importar histórico
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar investimentos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Ano padrão</span>
            <Select value={fixedYear} onValueChange={setFixedYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: new Date().getFullYear() - 2022 }, (_, i) => 2023 + i).map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border border-border/50 bg-muted/30 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Formato esperado (CSV)</p>
            <p className="mb-2">RECEITAS ATUAIS ; JAN ; FEV ; ... ; DEZ</p>
            <p className="mb-2">Se o investimento não existir, ele será criado automaticamente.</p>
          </div>

          <div className="space-y-2">
            <Input
              type="file"
              accept=".csv"
              className="w-full"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setFileName(file?.name ?? "");
                handleFile(file);
              }}
            />
            {fileName && <p className="text-xs text-muted-foreground">Arquivo: {fileName}</p>}
          </div>

          {parsed.length > 0 && (
            <div className="rounded-md border border-border/50 p-3 text-sm">
              <p className="font-medium mb-2">Resumo</p>
              <p>Linhas lidas: {parsed.length}</p>
              <p>Válidas: {parsed.filter((row) => !row.error).length}</p>
              <p>Com erro: {parsed.filter((row) => row.error).length}</p>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {parsed.filter((row) => row.error).slice(0, 3).map((row) => (
                  <p key={row.row}>
                    Linha {row.row}: {row.error}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={isImporting || parsed.length === 0}>
              {isImporting ? "Importando..." : "Importar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
