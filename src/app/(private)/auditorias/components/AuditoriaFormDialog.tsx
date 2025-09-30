// src/app/(private)/auditorias/components/AuditoriaFormDialog.tsx
"use client";

import React, { useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateAuditoria, useUpdateAuditoria } from "../hooks/useAuditorias";
import { useLojas } from "../../lojas/hooks/useLojas";
import { useUsuarios } from "../../usuarios/hooks/useUsuarios";
import type { Auditoria, Loja, User } from "@/types";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

/** Util: formata Date -> "YYYY-MM-DD" (sem fuso/UTC) */
function dateToYMD(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
/** Util: "YYYY-MM-DD" -> Date (local) */
function ymdToDate(s?: string) {
    if (!s) return undefined;
    const [y, m, d] = s.split("-").map(Number);
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d);
}
/** Util: garante HH:mm:ss */
function ensureSeconds(t?: string | null) {
    if (!t) return "";
    return /^\d{2}:\d{2}:\d{2}$/.test(t) ? t : `${t}:00`;
}

interface AuditoriaFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Auditoria | null;
}

const AuditoriaFormDialog: React.FC<AuditoriaFormDialogProps> = ({
    open,
    onOpenChange,
    initialData,
}) => {
    const isEdit = !!initialData?.id;

    const [form, setForm] = React.useState<Partial<Auditoria>>({
        lojaId: undefined,
        usuarioId: undefined,
        data: "",
        horaInicial: "",
        horaFinal: "",
    });

    const [dateOpen, setDateOpen] = React.useState(false);

    // Carregamentos
    const { data: lojasResp } = useLojas({ limit: 100 });
    const { data: usuariosResp } = useUsuarios({ limit: 100 });

    const lojas: Loja[] =
        ((lojasResp as any)?.data as Loja[]) ??
        ((lojasResp as any)?.lojas as Loja[]) ??
        [];

    const lojaLabel = (l: any) => l?.descricao ?? l?.name ?? `Loja #${l?.id}`;

    // 🔧 FIX: ler a lista de usuários a partir de `data` (com fallback para `users`)
    const usuarios: User[] =
        ((usuariosResp as any)?.data as User[]) ??
        ((usuariosResp as any)?.users as User[]) ??
        [];

    const { mutate: createAuditoria, isPending: creating } = useCreateAuditoria();
    const { mutate: updateAuditoria, isPending: updating } = useUpdateAuditoria();

    useEffect(() => {
        if (!open) return;
        if (initialData) {
            setForm({
                lojaId: initialData.lojaId,
                usuarioId: initialData.usuarioId,
                data: initialData.data?.slice(0, 10),
                horaInicial: initialData.horaInicial || "",
                horaFinal: initialData.horaFinal || "",
            });
        } else {
            setForm({ lojaId: undefined, usuarioId: undefined, data: "", horaInicial: "", horaFinal: "" });
        }
    }, [open, initialData]);

    const selectedDate = ymdToDate(form.data);

    const handleSubmit = () => {
        if (!form.lojaId || !form.usuarioId || !form.data) return;

        const payload: Partial<Auditoria> = {
            lojaId: form.lojaId,
            usuarioId: form.usuarioId,
            data: form.data,
            horaInicial: form.horaInicial,
            horaFinal: form.horaFinal,
        };

        if (isEdit && initialData) {
            updateAuditoria({ id: initialData.id, data: payload }, { onSuccess: () => onOpenChange(false) });
        } else {
            createAuditoria(payload, { onSuccess: () => onOpenChange(false) });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Auditoria" : "Nova Auditoria"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Loja */}
                    <div className="grid gap-2">
                        <Label>Loja</Label>
                        <Select
                            value={form.lojaId ? String(form.lojaId) : ""}
                            onValueChange={(v) => setForm((s) => ({ ...s, lojaId: Number(v) }))}
                        >
                            <SelectTrigger className="cursor-pointer">
                                <SelectValue placeholder="Selecione a loja" />
                            </SelectTrigger>
                            <SelectContent>
                                {lojas.map((l) => (
                                    <SelectItem key={l.id} value={String(l.id)}>
                                        {lojaLabel(l)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Auditor */}
                    <div className="grid gap-2">
                        <Label>Auditor</Label>
                        <Select
                            value={form.usuarioId ? String(form.usuarioId) : ""}
                            onValueChange={(v) => setForm((s) => ({ ...s, usuarioId: Number(v) }))}
                        >
                            <SelectTrigger className="cursor-pointer">
                                <SelectValue placeholder="Selecione o auditor" />
                            </SelectTrigger>
                            <SelectContent>
                                {usuarios.map((u) => (
                                    <SelectItem key={u.id} value={String(u.id)}>
                                        {u.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Data + Horários */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4 ">
                        {/* Date Picker (Calendar + Popover) */}
                        <div className="flex-1 grid gap-2">
                            <Label htmlFor="date-picker">Data</Label>
                            <Popover open={dateOpen} onOpenChange={setDateOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        id="date-picker"
                                        className="justify-between font-normal cursor-pointer"
                                    >
                                        {selectedDate
                                            ? selectedDate.toLocaleDateString()
                                            : "Selecione a data"}
                                        <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        captionLayout="dropdown"
                                        onSelect={(d) => {
                                            if (d) {
                                                setForm((s) => ({ ...s, data: dateToYMD(d) }));
                                                setDateOpen(false);
                                            }
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex flex-row items-center justify-center  gap-2">
                            {/* Horário inicial */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="time-start">Hora Inicial</Label>
                                <Input
                                    id="time-start"
                                    type="time"
                                    step="1"
                                    value={form.horaInicial || ""}
                                    onChange={(e) =>
                                        setForm((s) => ({ ...s, horaInicial: e.target.value }))
                                    }
                                    className="bg-background appearance-none
                                    [&::-webkit-calendar-picker-indicator]:hidden
                                    [&::-webkit-calendar-picker-indicator]:appearance-none"
                                />
                            </div>

                            {/* Horário final */}
                            <div className="flex flex-col gap-2 ">
                                <Label htmlFor="time-end">Hora Final</Label>
                                <Input
                                    id="time-end"
                                    type="time"
                                    step="1"
                                    value={form.horaFinal || ""}
                                    onChange={(e) =>
                                        setForm((s) => ({ ...s, horaFinal: e.target.value }))
                                    }
                                    className="bg-background appearance-none
                                    [&::-webkit-calendar-picker-indicator]:hidden
                                    [&::-webkit-calendar-picker-indicator]:appearance-none"
                                />
                            </div>
                        </div>

                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer">
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={creating || updating} className="cursor-pointer">
                        {isEdit ? "Salvar alterações" : "Criar auditoria"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AuditoriaFormDialog;