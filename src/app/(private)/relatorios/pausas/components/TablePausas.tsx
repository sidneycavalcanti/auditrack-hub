// src/app/(private)/relatorios/pausas/components/TablePausas.tsx
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Search, FunnelX, Download } from "lucide-react";

import { usePausas } from "../hooks/usePausas";
import { useLojas } from "@/app/(private)/lojas/hooks/useLojas";
import { useUsuarios } from "@/app/(private)/usuarios/hooks/useUsuarios";
import type { Loja, User } from "@/types";
import LoadingSpinner from "@/components/common/LoadingSpinner";

/* ================= helpers ================= */

const BR_DT = (iso?: string) => {
  if (!iso) return "--/--/----";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const BR_HM = (iso?: string) => {
  if (!iso) return "--:--";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const toStartISO = (ymd: string) => `${ymd}T00:00:00.000Z`;
const toEndISO   = (ymd: string) => `${ymd}T23:59:59.999Z`;

function minutesToHHMM(min?: number) {
  const m = Number(min || 0);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${pad2(h)}:${pad2(mm)}`;
}

/** Para Excel: minutos -> dias (Excel armazena tempo como fração do dia) */
const minutesToExcelTime = (min?: number) => (Number(min || 0) / 60) / 24;

/* ================= componente ================= */

export default function TablePausas() {
  // filtros do formulário
  const [lojaId, setLojaId] = React.useState<number | undefined>();
  const [usuarioId, setUsuarioId] = React.useState<number | undefined>();
  const [dateFrom, setDateFrom] = React.useState<string>(""); // "YYYY-MM-DD"
  const [dateTo, setDateTo] = React.useState<string>("");

  // regra pedida: habilita com (usuarioId) OU (lojaId+dateFrom+dateTo)
  const canSearch = !!usuarioId || (!!lojaId && !!dateFrom && !!dateTo);

  // params efetivos de busca
  const [params, setParams] = React.useState<{
    lojaId?: number;
    usuarioId?: number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  } | null>(null);

  const enabled = !!params;

  // dados auxiliares
  const { data: lojasResp } = useLojas({ limit: 1000 });
  const lojas = (lojasResp?.data as Loja[]) ?? [];

  const { data: usuariosResp } = useUsuarios({ limit: 2000 });
  const usuarios = (usuariosResp?.data as User[]) ?? [];

  // busca principal
  const { data, isFetching } = usePausas(params ?? {}, { enabled });
  const pausas = data?.data ?? [];

  const lojaNome =
    (lojas.find(l => l.id === params?.lojaId)?.descricao ??
     lojas.find(l => l.id === params?.lojaId)?.name) ?? "-";

  const usuarioNome =
    usuarios.find(u => u.id === (params?.usuarioId ?? 0))?.name ?? undefined;

  function onBuscar() {
    if (!canSearch) return;

    const p: any = {
      page: 1,
      limit: 4000,
    };

    if (usuarioId) p.usuarioId = usuarioId;

    if (lojaId) p.lojaId = lojaId;
    if (dateFrom) p.dateFrom = toStartISO(dateFrom);
    if (dateTo) p.dateTo = toEndISO(dateTo);

    setParams(p);
  }

  function onLimpar() {
    setLojaId(undefined);
    setUsuarioId(undefined);
    setDateFrom("");
    setDateTo("");
    setParams(null);
  }

  /* ================= Export (XLSX / PDF) ================= */

  type PrintableRow = {
    data: string;
    hora: string;
    loja: string;
    usuario: string;
    motivo: string;
    duracaoMin: number;
    duracaoHHMM: string;
    observacoes: string;
  };

  const printableRows: PrintableRow[] = React.useMemo(() => {
    if (!enabled) return [];
    return pausas.map((p: any) => {
      const dtISO = p.auditoria?.data ?? p.createdAt;
      const loja = p.auditoria?.loja?.name ?? p.auditoria?.loja?.descricao ?? "-";
      const usuario = p.auditoria?.usuario?.name ?? p.usuario?.name ?? `ID ${p.usuarioId ?? "-"}`;
      const motivo = p.motivoDepausa?.name ?? p.motivodepausa?.name ?? p.motivoName ?? "-";
      const obs = p.observacoes ?? p.obs ?? "";
      const min = Number(p.duracao ?? 0);

      return {
        data: BR_DT(dtISO),
        hora: BR_HM(dtISO),
        loja,
        usuario,
        motivo,
        duracaoMin: min,
        duracaoHHMM: minutesToHHMM(min),
        observacoes: obs,
      };
    });
  }, [enabled, pausas]);

  const totalMinutos = printableRows.reduce((acc, r) => acc + r.duracaoMin, 0);

  async function exportXLSX() {
    if (!printableRows.length) return;
    const ExcelJS = await import("exceljs");

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Pausas");

    // Cabeçalho textual
    const title = "RELATÓRIO DE PAUSAS";
    const meta1 =
      params?.usuarioId
        ? `USUÁRIO: ${usuarioNome ?? params?.usuarioId}`
        : `LOJA: ${lojaNome}`;
    const meta2 =
      params?.dateFrom || params?.dateTo
        ? `PERÍODO: ${params?.dateFrom?.slice(0, 10) ?? "--"} à ${params?.dateTo?.slice(0, 10) ?? "--"}`
        : "PERÍODO: —";

    ws.mergeCells("A1:H1");
    ws.getCell("A1").value = title;
    ws.getCell("A1").font = { name: "Arial", bold: true, size: 14 };
    ws.getCell("A1").alignment = { horizontal: "center" };

    ws.mergeCells("A2:H2");
    ws.getCell("A2").value = meta1;
    ws.getCell("A2").font = { name: "Arial", size: 10 };

    ws.mergeCells("A3:H3");
    ws.getCell("A3").value = meta2;
    ws.getCell("A3").font = { name: "Arial", size: 10 };

    ws.addRow([]);

    ws.columns = [
      { header: "DATA", key: "data", width: 12 },
      { header: "HORA", key: "hora", width: 8 },
      { header: "LOJA", key: "loja", width: 24 },
      { header: "USUÁRIO", key: "usuario", width: 24 },
      { header: "MOTIVO", key: "motivo", width: 22 },
      { header: "DURAÇÃO (min)", key: "duracaoMin", width: 14 },
      { header: "DURAÇÃO (HH:MM)", key: "duracaoFmt", width: 16 },
      { header: "OBSERVAÇÕES", key: "obs", width: 34 },
    ];

    // Cabeçalho da grade
    ws.getRow(5).font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(5).alignment = { horizontal: "center" };
    ws.getRow(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF212121" } };

    // Linhas
    for (const r of printableRows) {
      const row = ws.addRow({
        data: r.data,
        hora: r.hora,
        loja: r.loja,
        usuario: r.usuario,
        motivo: r.motivo,
        duracaoMin: r.duracaoMin,
        duracaoFmt: minutesToExcelTime(r.duracaoMin),
        obs: r.observacoes,
      });
      // Formatação: tempo em [h]:mm
      row.getCell("duracaoFmt").numFmt = "[h]:mm";
      // Inteiro em minutos
      row.getCell("duracaoMin").numFmt = "0";
    }

    // Rodapé com totais
    const totalRow = ws.addRow({
      data: "TOTAIS",
      duracaoMin: totalMinutos,
      duracaoFmt: minutesToExcelTime(totalMinutos),
    });
    totalRow.font = { bold: true };
    totalRow.getCell("duracaoFmt").numFmt = "[h]:mm";
    totalRow.getCell("duracaoMin").numFmt = "0";

    // Bordas nas linhas de dados (a partir do header da grade)
    ws.eachRow({ includeEmpty: false }, (row, idx) => {
      if (idx >= 5) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.font = { name: "Arial", size: 10 };
        });
      }
    });

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const base =
      params?.usuarioId
        ? `pausas_usuario-${params.usuarioId}`
        : `pausas_loja-${params?.lojaId ?? "all"}`;
    a.download = `${base}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPDF() {
    if (!printableRows.length) return;
    const { default: jsPDF } = await import("jspdf");
    const autoTableMod = await import("jspdf-autotable");
    const autoTable = (autoTableMod as any).default ?? (autoTableMod as any).autoTable;

    const doc = new jsPDF({ orientation: "l", unit: "pt", format: "a4" });

    const title = "RELATÓRIO DE PAUSAS";
    const meta1 =
      params?.usuarioId
        ? `USUÁRIO: ${usuarioNome ?? params?.usuarioId}`
        : `LOJA: ${lojaNome}`;
    const meta2 =
      params?.dateFrom || params?.dateTo
        ? `PERÍODO: ${params?.dateFrom?.slice(0, 10) ?? "--"} à ${params?.dateTo?.slice(0, 10) ?? "--"}`
        : "PERÍODO: —";

    const pageW = doc.internal.pageSize.getWidth();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(title, pageW / 2, 40, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(meta1, 20, 64);
    doc.text(meta2, 20, 80);

    const head = [["DATA", "HORA", "LOJA", "USUÁRIO", "MOTIVO", "DURAÇÃO", "OBSERVAÇÕES"]];
    const body = printableRows.map((r) => [
      r.data, r.hora, r.loja, r.usuario, r.motivo, r.duracaoHHMM, r.observacoes ?? ""
    ]);

    // Rodapé total
    body.push(["", "", "", "", "TOTAL", minutesToHHMM(totalMinutos), ""]);

    autoTable(doc, {
      head,
      body,
      startY: 100,
      styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
      headStyles: { fillColor: [33, 33, 33], textColor: 255 },
      columnStyles: { 2: { cellWidth: 140 }, 3: { cellWidth: 120 }, 6: { cellWidth: 180 } },
      margin: { left: 20, right: 20 },
    });

    const base =
      params?.usuarioId
        ? `pausas_usuario-${params.usuarioId}`
        : `pausas_loja-${params?.lojaId ?? "all"}`;
    doc.save(`${base}.pdf`);
  }

  /* ================= render ================= */

  return (
    <>
      <Card className="bg-transparent mb-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-center">Relatório de Pausas</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            {/* Identificação à esquerda */}
            {enabled ? (
              <div className="flex-1 text-xs text-muted-foreground">
                {params?.usuarioId ? (
                  <div>USUÁRIO: <span className="text-foreground">{usuarioNome ?? params.usuarioId}</span></div>
                ) : (
                  <div>LOJA: <span className="text-foreground">{lojaNome}</span></div>
                )}
                {(params?.dateFrom || params?.dateTo) && (
                  <div>
                    PERÍODO: <span className="text-foreground">
                      {(params?.dateFrom as string)?.slice(0, 10) ?? "--"} à {(params?.dateTo as string)?.slice(0, 10) ?? "--"}
                    </span>
                  </div>
                )}
              </div>
            ) : <div className="flex-1" />}

            {/* Filtros */}
            <div className="flex-1 flex flex-col lg:flex-row items-end justify-end gap-2">
              <div className="space-y-1">
                <Label className="ml-1.5">Usuário (opcional)</Label>
                <Select
                  value={usuarioId ? String(usuarioId) : ""}
                  onValueChange={(v) => setUsuarioId(v ? Number(v) : undefined)}
                >
                  <SelectTrigger className="cursor-pointer w-[220px]">
                    <SelectValue placeholder="Selecione o usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name || `Usuário ${u.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="ml-1.5">Loja</Label>
                <Select
                  value={lojaId ? String(lojaId) : ""}
                  onValueChange={(v) => setLojaId(v ? Number(v) : undefined)}
                >
                  <SelectTrigger className="cursor-pointer w-[220px]">
                    <SelectValue placeholder="Selecione a loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {lojas.map((l) => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        {l.descricao ?? l.name ?? `Loja ${l.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="ml-1.5">Data inicial</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-[160px]"
                />
              </div>

              <div className="space-y-1">
                <Label className="ml-1.5">Data final</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-[160px]"
                />
              </div>

              <div className="flex items-center justify-center gap-2">
                <Button onClick={onBuscar} disabled={!canSearch} size="sm" className="cursor-pointer">
                  <Search className="mr-2 h-4 w-4" /> Buscar
                </Button>
                <Button onClick={onLimpar} variant="outline" size="sm" className="cursor-pointer" title="Limpar filtros">
                  <FunnelX />
                </Button>
                <Button
                  onClick={exportXLSX}
                  disabled={!enabled || isFetching || !printableRows.length}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  title="Exportar XLSX"
                >
                  <Download className="mr-2 h-4 w-4" /> XLSX
                </Button>
                <Button
                  onClick={exportPDF}
                  disabled={!enabled || isFetching || !printableRows.length}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  title="Exportar PDF"
                >
                  <Download className="mr-2 h-4 w-4" /> PDF
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-card shadow-card text-muted-foreground">
              <TableHead className="py-1.5 text-center">DATA</TableHead>
              <TableHead className="py-1.5 text-center">HORA</TableHead>
              <TableHead className="py-1.5">LOJA</TableHead>
              <TableHead className="py-1.5">USUÁRIO</TableHead>
              <TableHead className="py-1.5">MOTIVO</TableHead>
              <TableHead className="py-1.5 text-right">DURAÇÃO</TableHead>
              <TableHead className="py-1.5">OBSERVAÇÕES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!enabled && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Selecione um usuário **ou** Loja + Período e clique em Buscar.
                </TableCell>
              </TableRow>
            )}

            {enabled && isFetching && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  <LoadingSpinner size="lg" text="Carregando..." />
                </TableCell>
              </TableRow>
            )}

            {enabled && !isFetching && printableRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhuma pausa encontrada.
                </TableCell>
              </TableRow>
            )}

            {enabled && !isFetching && printableRows.map((r, idx) => (
              <TableRow key={idx}>
                <TableCell className="py-1 text-center whitespace-nowrap">{r.data}</TableCell>
                <TableCell className="py-1 text-center whitespace-nowrap">{r.hora}</TableCell>
                <TableCell className="py-1">{r.loja}</TableCell>
                <TableCell className="py-1">{r.usuario}</TableCell>
                <TableCell className="py-1">{r.motivo}</TableCell>
                <TableCell className="py-1 text-right whitespace-nowrap">{r.duracaoHHMM}</TableCell>
                <TableCell className="py-1">{r.observacoes}</TableCell>
              </TableRow>
            ))}

            {enabled && !isFetching && printableRows.length > 0 && (
              <TableRow className="bg-muted/60 font-semibold">
                <TableCell colSpan={5}>TOTAL</TableCell>
                <TableCell className="text-right whitespace-nowrap">{minutesToHHMM(totalMinutos)}</TableCell>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}