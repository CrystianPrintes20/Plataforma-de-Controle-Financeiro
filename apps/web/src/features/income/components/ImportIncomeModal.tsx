import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useAccounts } from "@/features/accounts";
import { useCategories } from "@/features/categories";
import { api } from "@shared/routes";
import { apiSend } from "@/shared/lib/api";
import { useToast } from "@/shared/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";

type ParsedRow = {
  row: number;
  data: Record<string, string>;
  error?: string;
};

const fixedHeaders = ["descricao", "mes", "ano", "valor", "dia_do_mes", "conta", "categoria"];
const monthHeaders = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

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

function parseDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00`);
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("/");
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return null;
}

function parseAmount(value: string | undefined | null) {
  if (typeof value !== "string") return null;
  let sanitized = value.replace(/[^\d,.-]/g, "");
  if (sanitized.includes(",") && sanitized.includes(".")) {
    sanitized = sanitized.replace(/\./g, "").replace(",", ".");
  } else if (sanitized.includes(",")) {
    sanitized = sanitized.replace(",", ".");
  }
  const amount = Number(sanitized);
  return Number.isNaN(amount) ? null : amount;
}

export function ImportIncomeModal() {
  const [open, setOpen] = useState(false);
  const [fixedYear, setFixedYear] = useState(String(new Date().getFullYear()));
  const [fixedDay, setFixedDay] = useState("10");
  const [fixedAccountId, setFixedAccountId] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const accountMap = useMemo(() => {
    return new Map(
      (accounts ?? []).map((account) => [account.name.trim().toLowerCase(), account.id])
    );
  }, [accounts]);

  const categoryMap = useMemo(() => {
    return new Map(
      (categories ?? []).map((category) => [category.name.trim().toLowerCase(), category.id])
    );
  }, [categories]);

  const expectedHeaders = fixedHeaders;

  const handleFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const { headers, rows } = parseCsv(text);
    const normalizedHeaders = headers.map((h) => h.replace(/\s+/g, "_"));
    const headerIndex = new Map(normalizedHeaders.map((h, index) => [h, index]));
    const isMatrix = monthHeaders.every((month) => headerIndex.has(month)) && headerIndex.has("ano");

    const parsedRows: ParsedRow[] = rows.map((rowValues, rowIndex) => {
      const data: Record<string, string> = {};
      if (isMatrix) {
        const nameIndex = headerIndex.get("receitas") ?? 0;
        data.descricao = rowValues[nameIndex] ?? "";
        monthHeaders.forEach((month) => {
          const index = headerIndex.get(month) ?? -1;
          data[month] = index >= 0 ? rowValues[index] ?? "" : "";
        });
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
          if (!data.descricao) error = "Descrição obrigatória";
          else if (monthValues.length === 0) error = "Sem valores mensais";
          else if (!data.ano || Number.isNaN(Number(data.ano))) error = "Ano obrigatório";
        } else {
          if (!data.descricao) error = "Descrição obrigatória";
          else if (!data.mes || Number.isNaN(Number(data.mes))) error = "Mês obrigatório";
          else if (!data.ano || Number.isNaN(Number(data.ano))) error = "Ano obrigatório";
          else if (!data.valor || parseAmount(data.valor) === null) error = "Valor inválido";
          else if (!data.dia_do_mes || Number.isNaN(Number(data.dia_do_mes))) {
            error = "Dia do mês inválido";
          } else if (!data.conta || !accountMap.has(data.conta.trim().toLowerCase())) {
            error = "Conta não encontrada";
          }
        }

      return { row: rowIndex + 2, data, error: error || undefined };
    });

    setParsed(parsedRows);
  };

  const handleDownloadTemplate = () => {
    const headers = expectedHeaders.join(";");
    const example = "Salário;1;2025;5000,00;10;PicPay;Salary";
    const blob = new Blob([`${headers}\n${example}\n`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "modelo-entradas.csv";
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
      if (!fixedAccountId) {
        toast({
          title: "Conta obrigatória",
          description: "Selecione a conta padrão para as entradas.",
          variant: "destructive",
        });
        return;
      }
        for (const row of validRows) {
          const isMatrixRow = monthHeaders.some((month) => row.data[month]);
          const accountId = Number(fixedAccountId);
          const categoryId = row.data.categoria
            ? categoryMap.get(row.data.categoria.trim().toLowerCase())
            : undefined;
          let amount = parseAmount(row.data.valor);
          const dayOfMonth = row.data.dia_do_mes ? Number(row.data.dia_do_mes) : Number(fixedDay);
          const yearValue = row.data.ano ? Number(row.data.ano) : Number(fixedYear);
          const monthValue = row.data.mes ? Number(row.data.mes) : null;

          if (
            (!isMatrixRow && amount === null) ||
            Number.isNaN(dayOfMonth) ||
            Number.isNaN(yearValue) ||
            Number.isNaN(accountId)
          ) {
            continue;
          }

          if (isMatrixRow) {
            if (Number.isNaN(yearValue)) continue;
            const monthValues = monthHeaders.map((month) => parseAmount(row.data[month] ?? ""));

            for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
              const value = monthValues[monthIndex];
              if (value === null) continue;
              await apiSend(
                api.income.entries.create.path,
                "POST",
                api.income.entries.create.responses[201],
                {
                  name: row.data.descricao,
                  amount: String(value),
                  dayOfMonth,
                  accountId,
                  categoryId,
                  month: monthIndex + 1,
                  year: yearValue,
                }
              );
            }
          } else if (monthValue !== null && Number.isFinite(monthValue)) {
            const monthIndex = monthValue - 1;
            if (monthIndex < 0 || monthIndex > 11) continue;
            await apiSend(
              api.income.entries.create.path,
              "POST",
              api.income.entries.create.responses[201],
              {
                name: row.data.descricao,
                amount: String(amount),
                dayOfMonth,
                accountId,
                categoryId,
                month: monthIndex + 1,
                year: yearValue,
              }
            );
          }
        }
        await queryClient.invalidateQueries({ queryKey: [api.income.entries.list.path] });
        await queryClient.invalidateQueries({ queryKey: [api.income.annual.get.path] });

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
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar entradas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Importar entradas</DialogTitle>
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
            <p className="text-xs text-muted-foreground">Usado apenas se o arquivo não tiver coluna "ano".</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Dia do mês</span>
            <Input
              type="number"
              min={1}
              max={28}
              value={fixedDay}
              onChange={(event) => setFixedDay(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Conta padrão</span>
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
            <p className="mb-2">Colunas obrigatórias: descricao; mes; ano; valor.</p>
            <p className="mb-2">Formato mensal exige coluna ANO: RECEITAS;ANO;JAN;FEV;...;DEZ.</p>
            <Button variant="ghost" className="p-0 h-auto" onClick={handleDownloadTemplate}>
              Baixar modelo
            </Button>
          </div>

          <div className="space-y-2">
            <Input
              type="file"
              accept=".csv"
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

          <div className="flex justify-end gap-2 pt-2">
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
