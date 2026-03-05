// src/app/(private)/relatorios/vendas/components/TabelaResumoVendas.tsx
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FunnelX, Search } from "lucide-react";
import { useLojas } from "@/app/(private)/lojas/hooks/useLojas";
import type { Loja } from "@/types";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useResumoMensalReport, type ResumoRow } from "../hooks/useRelatoriosAPI";
import LojaFilterCombobox from "../../components/LojaFilterCombobox";

const MONTHS = [
  { v: 1, n: "01" }, { v: 2, n: "02" }, { v: 3, n: "03" }, { v: 4, n: "04" },
  { v: 5, n: "05" }, { v: 6, n: "06" }, { v: 7, n: "07" }, { v: 8, n: "08" },
  { v: 9, n: "09" }, { v: 10, n: "10" }, { v: 11, n: "11" }, { v: 12, n: "12" },
];

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percent = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pct = (p: number, t: number) => (t > 0 ? p / t : 0);

export default function TabelaResumoVendas() {
  const { data: lojasResp } = useLojas({ limit: 500 });
  const lojas = (lojasResp?.data as Loja[]) ?? [];
  const anos = React.useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => now - i);
  }, []);

  const [formLojaId, setFormLojaId] = React.useState<number | undefined>();
  const [formMes, setFormMes] = React.useState<number | undefined>();
  const [formAno, setFormAno] = React.useState<number | undefined>();

  const [params, setParams] = React.useState<{ lojaId?: number; mes?: number; ano?: number } | null>(null);
  const enabled = !!params;

  const { data, isFetching } = useResumoMensalReport(
    params ? { lojaId: params.lojaId, mes: params.mes, ano: params.ano } : null,
    { enabled }
  );

  const rows = (data?.rows ?? []) as ResumoRow[];
  const lojaNome =
    (lojas.find((l) => l.id === params?.lojaId)?.descricao ??
      lojas.find((l) => l.id === params?.lojaId)?.name) ?? "-";

  const onBuscar = () => {
    if (!formLojaId || !formMes || !formAno) return;
    setParams({ lojaId: formLojaId, mes: formMes, ano: formAno });
  };
  const onLimpar = () => {
    setFormLojaId(undefined); setFormMes(undefined); setFormAno(undefined); setParams(null);
  };

  // === exportação: aproveitamos as mesmas rotinas que você já tinha ===
  const [exportFmt, setExportFmt] = React.useState<"xlsx" | "xls" | "pdf" | "">("");
  const canExport = enabled && !isFetching && rows.length > 0 && !!exportFmt;
  const tableRef = React.useRef<HTMLDivElement>(null);

  function toPrintable(r: ResumoRow) {
    const base = r.kind === "valor" ? r.data.geral.valor : r.data.geral.qtd;
    const m = r.kind === "valor" ? currency : new Intl.NumberFormat("pt-BR");
    const vM = r.kind === "valor" ? r.data.manha.valor : r.data.manha.qtd;
    const vT = r.kind === "valor" ? r.data.tarde.valor : r.data.tarde.qtd;
    const vN = r.kind === "valor" ? r.data.noite.valor : r.data.noite.qtd;
    const g  = base;

    return {
      ITEM: r.label,
      GERAL: r.kind === "valor" ? m.format(g) : String(g),
      "MANHÃ": r.kind === "valor" ? m.format(vM) : String(vM),
      "% MANHÃ": percent.format(pct(vM, g)),
      "TARDE": r.kind === "valor" ? m.format(vT) : String(vT),
      "% TARDE": percent.format(pct(vT, g)),
      "NOITE": r.kind === "valor" ? m.format(vN) : String(vN),
      "% NOITE": percent.format(pct(vN, g)),
    };
  }
  const printableRows = rows.map(toPrintable);

  async function handleExport() {
    if (!canExport) return;
    const hdr = {
      title: "RESUMO DO MAPA MENSAL DE VENDAS E FLUXOS",
      loja: `LOJA / NOME FANTASIA: ${lojaNome || "—"}`,
      periodo: `MÊS/ANO: ${String(params!.mes).padStart(2, "0")}/${params!.ano}`,
    };
    const base = `resumo-vendas_${String(params!.mes).padStart(2, "0")}-${params!.ano}_loja-${params!.lojaId}`;
    if (exportFmt === "xlsx") {
      const { default: exporter } = await import("./_exporters/exportResumoMensalXLSX");
      await exporter(printableRows, `${base}.xlsx`, hdr);
    } else if (exportFmt === "xls") {
      const { default: exporter } = await import("./_exporters/exportResumoMensalXLS");
      await exporter(printableRows, `${base}.xls`, hdr);
    } else if (exportFmt === "pdf") {
      if (tableRef.current) {
        const html2canvas = await import("html2canvas");
        const canvas = await html2canvas.default(tableRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });
        const { default: exporter } = await import("./_exporters/exportResumoMensalPDF");
        await exporter(printableRows, `${base}.pdf`, hdr, canvas);
      } else {
        const { default: exporter } = await import("./_exporters/exportResumoMensalPDF");
        await exporter(printableRows, `${base}.pdf`, hdr);
      }
    }
  }

  return (
    <>
      <Card className="bg-transparent mb-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-center">RESUMO DO MAPA MENSAL DE VENDAS E FLUXOS</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            {enabled ? (
              <div className="flex-1 flex flex-col justify-start w-full lg:mb-0 mb-2 text-xs text-muted-foreground">
                <div>LOJA / NOME FANTASIA: <span className="text-foreground">{lojaNome}</span></div>
                <div>MÊS/ANO: <span className="text-foreground">{String(params?.mes).padStart(2, "0")}/{params?.ano}</span></div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-start w-full lg:mb-0 mb-2 text-xs text-muted-foreground">
                <div>LOJA / NOME FANTASIA: <span className="text-foreground">--</span></div>
                <div>MÊS/ANO: <span className="text-foreground">--/----</span></div>
              </div>
            )}

            <div className="flex-1 flex flex-col md:flex-row w-full items-end justify-end gap-2">
              <div className="w-full space-y-1">
                <Label className="ml-1.5">Loja</Label>
                <LojaFilterCombobox
                  lojas={lojas}
                  value={formLojaId}
                  onValueChange={setFormLojaId}
                  placeholder="Selecione a loja"
                  widthClassName="w-full"
                />
              </div>
              <div className="w-full space-y-1">
                <Label className="ml-1.5">Mês</Label>
                <Select value={formMes ? String(formMes) : ""} onValueChange={(v) => setFormMes(v ? Number(v) : undefined)}>
                  <SelectTrigger className="w-full cursor-pointer"><SelectValue placeholder="Mês" /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => <SelectItem key={m.v} value={String(m.v)}>{m.n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full space-y-1">
                <Label className="ml-1.5">Ano</Label>
                <Select value={formAno ? String(formAno) : ""} onValueChange={(v) => setFormAno(v ? Number(v) : undefined)}>
                  <SelectTrigger className="w-full cursor-pointer"><SelectValue placeholder="Ano" /></SelectTrigger>
                  <SelectContent>
                    {anos.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex w-full items-center justify-end gap-2">
                <Button onClick={onBuscar} size="sm" disabled={!formLojaId || !formMes || !formAno} className="cursor-pointer">
                  <Search className="mr-2 h-4 w-4" /> Buscar
                </Button>
                <Button variant="outline" size="sm" title="Limpar" onClick={onLimpar} className="cursor-pointer">
                  <FunnelX />
                </Button>
              </div>

              <div className="flex gap-2 items-end">
                <div className="space-y-1">
                  <Label className="ml-1.5">Exportar como</Label>
                  <Select value={exportFmt} onValueChange={(v: any) => setExportFmt(v)}>
                    <SelectTrigger className="cursor-pointer"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                      <SelectItem value="xls">Excel 97–2003 (.xls)</SelectItem>
                      <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleExport} disabled={!canExport} variant="outline" size="sm" className="cursor-pointer">
                  <Download />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-md border" ref={tableRef}>
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-card shadow-card text-muted-foreground">
              <TableHead className="min-w-[220px] text-center py-1.5">ITEM</TableHead>
              <TableHead className="py-1.5">GERAL</TableHead>
              <TableHead className="py-1.5">MANHÃ</TableHead>
              <TableHead className="py-1.5">% MANHÃ</TableHead>
              <TableHead className="py-1.5">TARDE</TableHead>
              <TableHead className="py-1.5">% TARDE</TableHead>
              <TableHead className="py-1.5">NOITE</TableHead>
              <TableHead className="py-1.5">% NOITE</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!enabled && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Selecione Loja, Mês e Ano para carregar.
                </TableCell>
              </TableRow>
            )}

            {enabled && isFetching && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  <LoadingSpinner size="lg" text="Carregando..." />
                </TableCell>
              </TableRow>
            )}

            {enabled && !isFetching && rows.map((r) => {
              const base = r.kind === "valor" ? r.data.geral.valor : r.data.geral.qtd;
              const vM = r.kind === "valor" ? r.data.manha.valor : r.data.manha.qtd;
              const vT = r.kind === "valor" ? r.data.tarde.valor : r.data.tarde.qtd;
              const vN = r.kind === "valor" ? r.data.noite.valor : r.data.noite.qtd;
              const fmt = (x: number) => (r.kind === "valor" ? currency.format(x) : String(x));
              return (
                <TableRow key={r.label}>
                  <TableCell className="py-1 whitespace-nowrap">{r.label}</TableCell>
                  <TableCell className="py-1">{fmt(base)}</TableCell>
                  <TableCell className="py-1">{fmt(vM)}</TableCell>
                  <TableCell className="py-1">{percent.format(pct(vM, base))}</TableCell>
                  <TableCell className="py-1">{fmt(vT)}</TableCell>
                  <TableCell className="py-1">{percent.format(pct(vT, base))}</TableCell>
                  <TableCell className="py-1">{fmt(vN)}</TableCell>
                  <TableCell className="py-1">{percent.format(pct(vN, base))}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
