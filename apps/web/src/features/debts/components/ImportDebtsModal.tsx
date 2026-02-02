import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useAccounts } from "@/features/accounts";
import { useToast } from "@/shared/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { api } from "@shared/routes";
import { apiSend } from "@/shared/lib/api";

type ParsedRow = {
  row: number;
  data: Record<string, string>;
  error?: string;
};

const expectedHeaders = [
  "descricao",
  "total",
  "restante",
  "juros",
  "vencimento",
  "pagamento_minimo",
  "status",
  "ano",
  "mes",
];

const monthHeaders = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const statusMap = new Map([
  ["active", "active"],
  ["ativo", "active"],
  ["ativa", "active"],
  ["pendente", "active"],
  ["paid", "paid"],
  ["pago", "paid"],
  ["paga", "paid"],
  ["defaulted", "defaulted"],
  ["inadimplente", "defaulted"],
  ["atrasado", "defaulted"],
  ["atrasada", "defaulted"],
]);

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

function parseDueDate(value: string | undefined | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{1,2}$/.test(trimmed)) {
    const day = Number(trimmed);
    return day >= 1 && day <= 31 ? day : null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(`${trimmed}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date.getDate();
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("/");
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date.getDate();
  }
  return null;
}

export function ImportDebtsModal({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [fixedYear, setFixedYear] = useState(String(new Date().getFullYear()));
  const [fixedAccountId, setFixedAccountId] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: accounts } = useAccounts();

  const parsedStatus = useMemo(() => statusMap, []);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const { headers, rows } = parseCsv(text);
    const normalizedHeaders = headers.map((h) => h.replace(/\s+/g, "_"));
    const headerIndex = new Map(normalizedHeaders.map((h, index) => [h, index]));
    const isMatrix = monthHeaders.every((month) => headerIndex.has(month)) && headerIndex.has("gastos");
    const statusIndex = headerIndex.get("status_current") ?? headerIndex.get("status");

    const parsedRows: ParsedRow[] = rows.map((rowValues, rowIndex) => {
      const data: Record<string, string> = {};
      if (isMatrix) {
        const nameIndex = headerIndex.get("gastos") ?? 0;
        data.descricao = rowValues[nameIndex] ?? "";
        monthHeaders.forEach((month) => {
          const index = headerIndex.get(month) ?? -1;
          data[month] = index >= 0 ? rowValues[index] ?? "" : "";
        });
        data.status = statusIndex !== undefined && statusIndex >= 0 ? rowValues[statusIndex] ?? "" : "";
      } else {
        expectedHeaders.forEach((header) => {
          const index = headerIndex.get(header) ?? -1;
          data[header] = index >= 0 ? rowValues[index] ?? "" : "";
        });
      }

      let error = "";
      if (isMatrix) {
        const monthValues = monthHeaders
          .map((month) => parseAmount(data[month] ?? ""))
          .filter((value) => value !== null) as number[];
        const status = data.status ? parsedStatus.get(data.status.trim().toLowerCase()) : undefined;
        if (!data.descricao) error = "Descrição obrigatória";
        else if (monthValues.length === 0) error = "Sem valores mensais";
        else if (data.status && !status) error = "Status inválido";
      } else {
        const total = parseAmount(data.total);
        const remaining = parseAmount(data.restante);
        const interest = parseAmount(data.juros);
        const dueDate = parseDueDate(data.vencimento);
        const minPayment = parseAmount(data.pagamento_minimo);
        const status = data.status ? parsedStatus.get(data.status.trim().toLowerCase()) : undefined;
        const monthValue = data.mes ? Number(data.mes) : NaN;

        if (!data.descricao) error = "Descrição obrigatória";
        else if (total === null) error = "Valor total inválido";
        else if (!data.mes || Number.isNaN(monthValue) || monthValue < 1 || monthValue > 12) error = "Mês inválido";
        else if (data.restante && remaining === null) error = "Saldo restante inválido";
        else if (data.juros && interest === null) error = "Juros inválidos";
        else if (data.vencimento && dueDate === null) error = "Vencimento inválido";
        else if (data.pagamento_minimo && minPayment === null) error = "Pagamento mínimo inválido";
        else if (data.status && !status) error = "Status inválido";
      }

      return { row: rowIndex + 2, data, error: error || undefined };
    });

    setParsed(parsedRows);
  };

  const handleDownloadTemplate = () => {
    const headers = expectedHeaders.join(";");
    const example = "Cartão Nubank;4500,00;3200,00;12,5;15;120,00;active;2023;8";
    const blob = new Blob([`${headers}\n${example}\n`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "modelo-dividas.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    const validRows = parsed.filter((row) => !row.error);
    if (validRows.length === 0) {
      toast({ title: "Sem dados válidos", description: "Revise o arquivo.", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    try {
      for (const row of validRows) {
        const isMatrixRow = monthHeaders.some((month) => row.data[month]);
        const status = row.data.status
          ? parsedStatus.get(row.data.status.trim().toLowerCase())
          : "active";
        const rowYear = row.data.ano ? Number(row.data.ano) : Number(fixedYear);
        if (Number.isNaN(rowYear)) continue;
        const accountId = fixedAccountId ? Number(fixedAccountId) : undefined;

        if (isMatrixRow) {
          const monthValues = monthHeaders.map((month) => parseAmount(row.data[month] ?? ""));
          const numericValues = monthValues.filter((value): value is number => value !== null);
          if (numericValues.length === 0) continue;
          for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
            const value = monthValues[monthIndex];
            if (value === null) continue;
            const remaining = status === "paid" ? 0 : value;
            await apiSend(api.debts.create.path, "POST", api.debts.create.responses[201], {
              name: row.data.descricao,
              totalAmount: String(value),
              remainingAmount: String(remaining),
              year: rowYear,
              month: monthIndex + 1,
              accountId,
              status,
            });
          }
        } else {
          const total = parseAmount(row.data.total);
          if (total === null) continue;
          const remaining = parseAmount(row.data.restante) ?? (status === "paid" ? 0 : total);
          const interestRate = parseAmount(row.data.juros);
          const dueDate = parseDueDate(row.data.vencimento);
          const minPayment = parseAmount(row.data.pagamento_minimo);
          const monthValue = row.data.mes ? Number(row.data.mes) : NaN;
          if (Number.isNaN(monthValue) || monthValue < 1 || monthValue > 12) continue;

          await apiSend(api.debts.create.path, "POST", api.debts.create.responses[201], {
            name: row.data.descricao,
            totalAmount: String(total),
            remainingAmount: String(remaining),
            interestRate: interestRate !== null ? String(interestRate) : undefined,
            dueDate: dueDate ?? undefined,
            minPayment: minPayment !== null ? String(minPayment) : undefined,
            status,
            year: rowYear,
            month: monthValue,
            accountId,
          });
        }
      }

      await queryClient.invalidateQueries({ queryKey: [api.debts.list.path] });
      await queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });

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
          Importar dívidas
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar dívidas</DialogTitle>
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
            <p className="text-xs text-muted-foreground">Usado apenas se o arquivo não tiver coluna \"ano\".</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Conta padrão (opcional)</span>
            <Select value={fixedAccountId} onValueChange={setFixedAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={String(account.id)}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border border-border/50 bg-muted/30 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Formato esperado (CSV)</p>
            <p className="mb-2">{expectedHeaders.join(" ; ")}</p>
            <p className="mb-2">Colunas obrigatórias: descricao; total; mes.</p>
            <p className="mb-2">Também aceita formato mensal: GASTOS;JAN;...;DEZ;STATUS CURRENT.</p>
            <p className="mb-2">Status aceitos: active, paid, defaulted, pendente (ou termos equivalentes).</p>
            <Button variant="ghost" className="p-0 h-auto" onClick={handleDownloadTemplate}>
              Baixar modelo
            </Button>
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
