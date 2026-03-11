#!/usr/bin/env python3
import json
import sys
from typing import Any, Dict, List

import xlsxwriter
import unicodedata


DIAS: List[str] = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo",
]


def n(value: Any) -> float:
    try:
        if value is None:
            return 0.0
        return float(value)
    except Exception:
        return 0.0



def normalize_key(value: Any) -> str:
    text = str(value or "").strip().lower()
    return "".join(ch for ch in unicodedata.normalize("NFD", text) if unicodedata.category(ch) != "Mn")


def get_day_row(rows: Dict[str, Any], dia: str) -> Dict[str, Any]:
    if not isinstance(rows, dict):
        return {}
    direct = rows.get(dia)
    if isinstance(direct, dict):
        return direct
    target = normalize_key(dia)
    for key, value in rows.items():
        if normalize_key(key) == target and isinstance(value, dict):
            return value
    return {}
def month_name_pt(mes: int) -> str:
    meses = [
        "Janeiro",
        "Fevereiro",
        "Marco",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
    ]
    idx = mes - 1
    if 0 <= idx < len(meses):
        return meses[idx]
    return str(mes)


def write_header_row(ws: xlsxwriter.worksheet.Worksheet, row: int, values: List[Any], fmt: Any) -> None:
    for col, value in enumerate(values, start=1):
        ws.write(row, col, value, fmt)


def write_data_row(ws: xlsxwriter.worksheet.Worksheet, row: int, values: List[Any], fmt: Any) -> None:
    for col, value in enumerate(values, start=1):
        ws.write(row, col, value, fmt)


def write_payload_to_workbook(payload: Dict[str, Any], output_path: str) -> None:
    data = payload.get("data", {}) or {}
    loja_nome = payload.get("lojaNome") or f"Loja {data.get('lojaId', '')}"

    wb = xlsxwriter.Workbook(output_path)

    fmt_title = wb.add_format(
        {"bold": True, "align": "center", "valign": "vcenter", "font_name": "Arial", "font_size": 12}
    )
    fmt_hdr = wb.add_format(
        {
            "bold": True,
            "font_color": "white",
            "bg_color": "#222222",
            "border": 1,
            "align": "center",
            "valign": "vcenter",
            "font_name": "Arial",
            "text_wrap": True,
        }
    )
    fmt_data = wb.add_format({"border": 1, "align": "center", "valign": "vcenter", "font_name": "Arial"})
    fmt_total = wb.add_format(
        {"border": 1, "align": "center", "valign": "vcenter", "font_name": "Arial", "bold": True, "bg_color": "#EFEFEF"}
    )
    fmt_money = wb.add_format(
        {"border": 1, "align": "center", "valign": "vcenter", "font_name": "Arial", "num_format": 'R$ #,##0.00'}
    )

    ws_carta = wb.add_worksheet("Carta")
    ws_carta.set_column("B:J", 16)
    ws_carta.merge_range("B5:J5", "Auditoria de Loja")
    ws_carta.merge_range("B6:J6", str(loja_nome))
    ws_carta.merge_range(
        "B9:J12",
        f"Com base no trabalho realizado no mes de {month_name_pt(int(data.get('mes', 0)))} de {int(data.get('ano', 0))}, "
        "segue relatorio com os principais indicadores.",
    )

    ws_capa = wb.add_worksheet("Capa")
    ws_capa.set_column("A:J", 16)
    ws_capa.merge_range("A5:J5", "Relatorio de Auditoria do Lojista", fmt_title)
    ws_capa.merge_range("A8:J8", str(loja_nome), fmt_title)
    ws_capa.merge_range("A10:J10", f"{month_name_pt(int(data.get('mes', 0)))} / {int(data.get('ano', 0))}", fmt_title)

    ws_charts = wb.add_worksheet("Graficos")
    ws_charts.set_column("A:N", 15)
    ws_charts.merge_range("A1:N1", "Graficos - Relatorio de Auditoria", fmt_title)

    ws = wb.add_worksheet("Parte 1 - Tabelas e Graficos")
    ws.set_column("A:A", 3)
    ws.set_column("B:B", 24)
    ws.set_column("C:D", 14)
    ws.set_column("E:I", 12)
    ws.set_column("J:J", 3)

    ws.write("B1", "Plaza Shopping")
    ws.write("B2", "Auditoria")
    ws.write("B3", loja_nome)
    ws.write("B5", "Vendas")
    ws.write("B6", "Auditadas")
    ws.write("C6", "Declaradas")
    ws.write_number("B7", n(data.get("totalAuditado")), fmt_money)
    ws.write_number("C7", n(data.get("totalVendidoMes")), fmt_money)

    chart_ranges: Dict[str, Dict[str, Any]] = {}
    row = 9

    ws.merge_range(row, 1, row, 8, "1. Perfil de Clientes (Compradores)", fmt_title)
    row += 2
    s1_header = row
    write_header_row(
        ws,
        s1_header,
        ["Dia da semana", "Masculino", "Feminino", "Crianca", "Jovem", "Adulto", "Idoso", "Total"],
        fmt_hdr,
    )
    s1_start = s1_header + 1
    perfil = data.get("perfilClientesCompradores", {})
    perfil_rows = perfil.get("rows", {})
    for i, dia in enumerate(DIAS):
        r = get_day_row(perfil_rows, dia)
        write_data_row(
            ws,
            s1_start + i,
            [dia, n(r.get("masculino")), n(r.get("feminino")), n(r.get("crianca")), n(r.get("jovem")), n(r.get("adulto")), n(r.get("idoso")), n(r.get("total"))],
            fmt_data,
        )
    s1_total = s1_start + len(DIAS)
    p_total = perfil.get("totalGeral", {})
    write_data_row(
        ws,
        s1_total,
        ["Total", n(p_total.get("masculino")), n(p_total.get("feminino")), n(p_total.get("crianca")), n(p_total.get("jovem")), n(p_total.get("adulto")), n(p_total.get("idoso")), n(p_total.get("total"))],
        fmt_total,
    )
    s1_part = s1_total + 1
    part = perfil.get("participacaoPct") or {}
    write_data_row(
        ws,
        s1_part,
        [
            "Participacao %",
            f"{n(part.get('masculino')):.0f}%",
            f"{n(part.get('feminino')):.0f}%",
            f"{n(part.get('crianca')):.0f}%",
            f"{n(part.get('jovem')):.0f}%",
            f"{n(part.get('adulto')):.0f}%",
            f"{n(part.get('idoso')):.0f}%",
            f"{n(part.get('total')):.0f}%",
        ],
        fmt_total,
    )
    chart_ranges["perfil"] = {"header": s1_header, "start": s1_start, "end": s1_start + len(DIAS) - 1}
    row = s1_part + 3

    ws.merge_range(row, 1, row, 8, "2. Fluxo de Pessoas por Dia da Semana", fmt_title)
    row += 2
    s2_header = row
    write_header_row(
        ws,
        s2_header,
        ["Dia da semana", "Vendas realizadas", "Acompanhantes", "Vendas perdidas identificadas", "Possiveis vendas perdidas", "Trocas", "Outros", "Total"],
        fmt_hdr,
    )
    s2_start = s2_header + 1
    fluxo = data.get("fluxoPessoasPorDiaSemana", {})
    fluxo_rows = fluxo.get("rows", {})
    for i, dia in enumerate(DIAS):
        r = get_day_row(fluxo_rows, dia)
        write_data_row(
            ws,
            s2_start + i,
            [dia, n(r.get("vendasRealizadas")), n(r.get("acompanhantes")), n(r.get("vendasPerdidasIdentificadas")), n(r.get("possiveisVendasPerdidas")), n(r.get("trocas")), n(r.get("outros")), n(r.get("total"))],
            fmt_data,
        )
    s2_total = s2_start + len(DIAS)
    f_total = fluxo.get("totalGeral", {})
    write_data_row(
        ws,
        s2_total,
        ["Total", n(f_total.get("vendasRealizadas")), n(f_total.get("acompanhantes")), n(f_total.get("vendasPerdidasIdentificadas")), n(f_total.get("possiveisVendasPerdidas")), n(f_total.get("trocas")), n(f_total.get("outros")), n(f_total.get("total"))],
        fmt_total,
    )
    s2_part = s2_total + 1
    f_part = fluxo.get("participacaoPct") or {}
    write_data_row(
        ws,
        s2_part,
        [
            "Participacao %",
            f"{n(f_part.get('vendasRealizadas')):.0f}%",
            f"{n(f_part.get('acompanhantes')):.0f}%",
            f"{n(f_part.get('vendasPerdidasIdentificadas')):.0f}%",
            f"{n(f_part.get('possiveisVendasPerdidas')):.0f}%",
            f"{n(f_part.get('trocas')):.0f}%",
            f"{n(f_part.get('outros')):.0f}%",
            f"{n(f_part.get('total')):.0f}%",
        ],
        fmt_total,
    )
    chart_ranges["fluxo"] = {"header": s2_header, "start": s2_start, "end": s2_start + len(DIAS) - 1, "total": s2_total}
    row = s2_part + 3

    ws.merge_range(row, 1, row, 8, "3. Fluxo de Pessoas por Semana", fmt_title)
    row += 2
    s3_header = row
    write_header_row(
        ws,
        s3_header,
        ["Dia da semana", "1a semana", "2a semana", "3a semana", "4a semana", "5a semana", "6a semana", "Total"],
        fmt_hdr,
    )
    s3_start = s3_header + 1
    fsem = data.get("fluxoPessoasPorSemana", {})
    fsem_rows = fsem.get("rows", {})
    for i, dia in enumerate(DIAS):
        r = get_day_row(fsem_rows, dia)
        write_data_row(
            ws,
            s3_start + i,
            [dia, n(r.get("w1")), n(r.get("w2")), n(r.get("w3")), n(r.get("w4")), n(r.get("w5")), n(r.get("w6")), n(r.get("total"))],
            fmt_data,
        )
    s3_total = s3_start + len(DIAS)
    fs_total = fsem.get("totalGeral", {})
    write_data_row(
        ws,
        s3_total,
        ["Total", n(fs_total.get("w1")), n(fs_total.get("w2")), n(fs_total.get("w3")), n(fs_total.get("w4")), n(fs_total.get("w5")), n(fs_total.get("w6")), n(fs_total.get("total"))],
        fmt_total,
    )
    s3_part = s3_total + 1
    fs_part = fsem.get("participacaoPct") or {}
    write_data_row(
        ws,
        s3_part,
        [
            "Participacao %",
            f"{n(fs_part.get('w1')):.0f}%",
            f"{n(fs_part.get('w2')):.0f}%",
            f"{n(fs_part.get('w3')):.0f}%",
            f"{n(fs_part.get('w4')):.0f}%",
            f"{n(fs_part.get('w5')):.0f}%",
            f"{n(fs_part.get('w6')):.0f}%",
            f"{n(fs_part.get('total')):.0f}%",
        ],
        fmt_total,
    )
    chart_ranges["fsem"] = {"header": s3_header, "start": s3_start}
    row = s3_part + 3

    ws.merge_range(row, 1, row, 8, "4. Vendas Perdidas", fmt_title)
    row += 2
    s4_header = row
    write_header_row(
        ws,
        s4_header,
        ["Dia da semana", "Preco", "Falta de mercadoria", "Mod/cor/tamanho", "Forma de pagamento", "Atendimento", "Outros", "Total"],
        fmt_hdr,
    )
    s4_start = s4_header + 1
    perdas = data.get("vendasPerdidasPorDiaSemana", {})
    perdas_rows = perdas.get("rows", {})
    for i, dia in enumerate(DIAS):
        r = get_day_row(perdas_rows, dia)
        write_data_row(
            ws,
            s4_start + i,
            [dia, n(r.get("preco")), n(r.get("faltaMercadoria")), n(r.get("modCorTamanho")), n(r.get("formaPagamento")), n(r.get("atendimento")), n(r.get("outros")), n(r.get("total"))],
            fmt_data,
        )
    s4_total = s4_start + len(DIAS)
    p4_total = perdas.get("totalGeral", {})
    write_data_row(
        ws,
        s4_total,
        ["Total", n(p4_total.get("preco")), n(p4_total.get("faltaMercadoria")), n(p4_total.get("modCorTamanho")), n(p4_total.get("formaPagamento")), n(p4_total.get("atendimento")), n(p4_total.get("outros")), n(p4_total.get("total"))],
        fmt_total,
    )
    s4_part = s4_total + 1
    p4_part = perdas.get("participacaoPct") or {}
    write_data_row(
        ws,
        s4_part,
        [
            "Participacao %",
            f"{n(p4_part.get('preco')):.0f}%",
            f"{n(p4_part.get('faltaMercadoria')):.0f}%",
            f"{n(p4_part.get('modCorTamanho')):.0f}%",
            f"{n(p4_part.get('formaPagamento')):.0f}%",
            f"{n(p4_part.get('atendimento')):.0f}%",
            f"{n(p4_part.get('outros')):.0f}%",
            f"{n(p4_part.get('total')):.0f}%",
        ],
        fmt_total,
    )
    chart_ranges["perdas"] = {"header": s4_header, "start": s4_start, "end": s4_start + len(DIAS) - 1, "total": s4_total}
    row = s4_part + 3

    ws.merge_range(row, 1, row, 8, "5. Aproveitamento das Vendas - Fluxo de Pessoas x Numero de Vendas", fmt_title)
    row += 2
    s5_header = row
    write_header_row(ws, s5_header, ["Dia da semana", "Fluxo de pessoas", "Numero de vendas", "Aproveitamento %"], fmt_hdr)
    s5_start = s5_header + 1
    apv = data.get("aproveitamentoVendas", {})
    apv_rows = apv.get("rows", {})
    for i, dia in enumerate(DIAS):
        r = get_day_row(apv_rows, dia)
        write_data_row(ws, s5_start + i, [dia, n(r.get("fluxoPessoas")), n(r.get("numeroVendas")), f"{n(r.get('aproveitamento')):.2f}%"], fmt_data)
    s5_total = s5_start + len(DIAS)
    a_total = apv.get("totalGeral", {})
    write_data_row(ws, s5_total, ["Total", n(a_total.get("fluxoPessoas")), n(a_total.get("numeroVendas")), f"{n(a_total.get('aproveitamento')):.2f}%"], fmt_total)
    chart_ranges["aproveitamento"] = {"start": s5_start, "end": s5_start + len(DIAS) - 1}

    ws.freeze_panes(0, 0)

    col_chart = wb.add_chart({"type": "column"})
    r1 = chart_ranges["perfil"]
    col_chart.set_title({"name": "Perfil de clientes por genero"})
    col_chart.add_series(
        {
            "name": ["Parte 1 - Tabelas e Graficos", r1["header"], 2],
            "categories": ["Parte 1 - Tabelas e Graficos", r1["start"], 1, r1["end"], 1],
            "values": ["Parte 1 - Tabelas e Graficos", r1["start"], 2, r1["end"], 2],
        }
    )
    col_chart.add_series(
        {
            "name": ["Parte 1 - Tabelas e Graficos", r1["header"], 3],
            "categories": ["Parte 1 - Tabelas e Graficos", r1["start"], 1, r1["end"], 1],
            "values": ["Parte 1 - Tabelas e Graficos", r1["start"], 3, r1["end"], 3],
        }
    )
    ws_charts.insert_chart("A3", col_chart, {"x_scale": 1.1, "y_scale": 1.05})

    idade_chart = wb.add_chart({"type": "column"})
    idade_chart.set_title({"name": "Perfil de clientes por idade"})
    for col in [4, 5, 6, 7]:
        idade_chart.add_series(
            {
                "name": ["Parte 1 - Tabelas e Graficos", r1["header"], col],
                "categories": ["Parte 1 - Tabelas e Graficos", r1["start"], 1, r1["end"], 1],
                "values": ["Parte 1 - Tabelas e Graficos", r1["start"], col, r1["end"], col],
            }
        )
    ws_charts.insert_chart("H3", idade_chart, {"x_scale": 1.1, "y_scale": 1.05})

    r2 = chart_ranges["fluxo"]
    fluxo_pie = wb.add_chart({"type": "pie"})
    fluxo_pie.set_title({"name": "Fluxo de pessoas por grupo"})
    fluxo_pie.add_series(
        {
            "name": "Fluxo por grupo",
            "categories": ["Parte 1 - Tabelas e Graficos", r2["header"], 2, r2["header"], 7],
            "values": ["Parte 1 - Tabelas e Graficos", r2["total"], 2, r2["total"], 7],
            "data_labels": {"percentage": True},
        }
    )
    ws_charts.insert_chart("A23", fluxo_pie, {"x_scale": 1.1, "y_scale": 1.05})

    fluxo_bar = wb.add_chart({"type": "column"})
    fluxo_bar.set_title({"name": "Fluxo por dia da semana"})
    for col in [2, 3, 4, 5, 6, 7]:
        fluxo_bar.add_series(
            {
                "name": ["Parte 1 - Tabelas e Graficos", r2["header"], col],
                "categories": ["Parte 1 - Tabelas e Graficos", r2["start"], 1, r2["end"], 1],
                "values": ["Parte 1 - Tabelas e Graficos", r2["start"], col, r2["end"], col],
            }
        )
    ws_charts.insert_chart("H23", fluxo_bar, {"x_scale": 1.1, "y_scale": 1.05})

    r3 = chart_ranges["fsem"]
    fsem_chart = wb.add_chart({"type": "column"})
    fsem_chart.set_title({"name": "Fluxo de pessoas por semana"})
    for i, _dia in enumerate(DIAS):
        row_i = r3["start"] + i
        fsem_chart.add_series(
            {
                "name": ["Parte 1 - Tabelas e Graficos", row_i, 1],
                "categories": ["Parte 1 - Tabelas e Graficos", r3["header"], 2, r3["header"], 7],
                "values": ["Parte 1 - Tabelas e Graficos", row_i, 2, row_i, 7],
            }
        )
    ws_charts.insert_chart("A43", fsem_chart, {"x_scale": 1.1, "y_scale": 1.05})

    r4 = chart_ranges["perdas"]
    perdas_pie = wb.add_chart({"type": "pie"})
    perdas_pie.set_title({"name": "Vendas perdidas por grupo"})
    perdas_pie.add_series(
        {
            "name": "Perdas por grupo",
            "categories": ["Parte 1 - Tabelas e Graficos", r4["header"], 2, r4["header"], 7],
            "values": ["Parte 1 - Tabelas e Graficos", r4["total"], 2, r4["total"], 7],
            "data_labels": {"percentage": True},
        }
    )
    ws_charts.insert_chart("A63", perdas_pie, {"x_scale": 1.1, "y_scale": 1.05})

    perdas_bar = wb.add_chart({"type": "column"})
    perdas_bar.set_title({"name": "Vendas perdidas por dia"})
    for col in [2, 3, 4, 5, 6, 7]:
        perdas_bar.add_series(
            {
                "name": ["Parte 1 - Tabelas e Graficos", r4["header"], col],
                "categories": ["Parte 1 - Tabelas e Graficos", r4["start"], 1, r4["end"], 1],
                "values": ["Parte 1 - Tabelas e Graficos", r4["start"], col, r4["end"], col],
            }
        )
    ws_charts.insert_chart("H63", perdas_bar, {"x_scale": 1.1, "y_scale": 1.05})

    r5 = chart_ranges["aproveitamento"]
    apv_chart = wb.add_chart({"type": "column"})
    apv_chart.set_title({"name": "Fluxo de pessoas x vendas realizadas"})
    apv_chart.add_series(
        {
            "name": "Fluxo de pessoas",
            "categories": ["Parte 1 - Tabelas e Graficos", r5["start"], 1, r5["end"], 1],
            "values": ["Parte 1 - Tabelas e Graficos", r5["start"], 2, r5["end"], 2],
        }
    )
    apv_chart.add_series(
        {
            "name": "Numero de vendas",
            "categories": ["Parte 1 - Tabelas e Graficos", r5["start"], 1, r5["end"], 1],
            "values": ["Parte 1 - Tabelas e Graficos", r5["start"], 3, r5["end"], 3],
        }
    )
    ws_charts.insert_chart("A83", apv_chart, {"x_scale": 1.1, "y_scale": 1.05})

    wb.close()


def main() -> int:
    if len(sys.argv) != 3:
        sys.stderr.write("Uso: export_auditoria_xlsx_native.py <input_json> <output_xlsx>\n")
        return 2

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    try:
        with open(input_path, "r", encoding="utf-8") as f:
            payload = json.load(f)
        write_payload_to_workbook(payload, output_path)
        return 0
    except Exception as exc:
        sys.stderr.write(f"Erro ao gerar XLSX: {exc}\n")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())


