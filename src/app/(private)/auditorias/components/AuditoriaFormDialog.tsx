"use client";

import React, { useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCreateAuditoria, useUpdateAuditoria } from "../hooks/useAuditorias";
import { useLojas } from "../../lojas/hooks/useLojas";
import { Auditoria } from "@/types";

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

    const [form, setForm] = React.useState({
        titulo: "",
        data: "",
        lojaId: 0 as number | string,
        status: "PENDENTE",
        observacoes: "",
        ativa: true,
    });

    const { data: lojasResp } = useLojas({ enabled: open });
    const lojas = (lojasResp as any)?.items ?? (lojasResp as any)?.lojas ?? [];

    const { mutate: createAuditoria, isPending: creating } = useCreateAuditoria();
    const { mutate: updateAuditoria, isPending: updating } = useUpdateAuditoria();

    useEffect(() => {
        if (open) {
            if (initialData) {
                setForm({
                    titulo: initialData.titulo ?? "",
                    data: initialData.data ? String(initialData.data).slice(0, 10) : "",
                    lojaId: initialData.lojaId ?? 0,
                    status: initialData.status ?? "PENDENTE",
                    observacoes: initialData.observacoes ?? "",
                    ativa: initialData.ativa ?? true,
                });
            } else {
                setForm({
                    titulo: "",
                    data: "",
                    lojaId: 0,
                    status: "PENDENTE",
                    observacoes: "",
                    ativa: true,
                });
            }
        }
    }, [open, initialData]);

    const handleSubmit = () => {
        if (!form.titulo?.trim() || !form.lojaId) return;

        const payload = {
            titulo: form.titulo,
            data: form.data || undefined,
            lojaId: Number(form.lojaId),
            status: form.status,
            observacoes: form.observacoes,
            ativa: form.ativa,
        };

        if (isEdit && initialData) {
            updateAuditoria(
                { id: initialData.id, data: payload },
                { onSuccess: () => onOpenChange(false) }
            );
        } else {
            createAuditoria(payload, { onSuccess: () => onOpenChange(false) });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Auditoria" : "Nova Auditoria"}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Título</Label>
                        <Input
                            value={form.titulo}
                            onChange={(e) => setForm((s) => ({ ...s, titulo: e.target.value }))}
                            placeholder="Ex.: Auditoria de Layout de Loja"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label>Data</Label>
                            <Input
                                type="date"
                                value={form.data}
                                onChange={(e) => setForm((s) => ({ ...s, data: e.target.value }))}
                            />
                        </div>

                        <div className="grid gap-2 sm:col-span-2">
                            <Label>Loja</Label>
                            <Select
                                value={form.lojaId ? String(form.lojaId) : ""}
                                onValueChange={(v) => setForm((s) => ({ ...s, lojaId: Number(v) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a loja" />
                                </SelectTrigger>
                                <SelectContent>
                                    {lojas.map((l: any) => (
                                        <SelectItem key={l.id} value={String(l.id)}>
                                            {l.descricao ?? l.nome ?? `Loja #${l.id}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select
                            value={form.status}
                            onValueChange={(v) => setForm((s) => ({ ...s, status: v }))}
                        >
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PENDENTE">Pendente</SelectItem>
                                <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
                                <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Observações</Label>
                        <Textarea
                            rows={4}
                            value={form.observacoes}
                            onChange={(e) => setForm((s) => ({ ...s, observacoes: e.target.value }))}
                            placeholder="Anotações gerais da auditoria..."
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                            <Label className="text-sm">Ativa</Label>
                            <p className="text-xs text-muted-foreground">Marque para manter a auditoria ativa</p>
                        </div>
                        <Switch
                            checked={form.ativa}
                            onCheckedChange={(v) => setForm((s) => ({ ...s, ativa: v }))}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={creating || updating}>
                        {isEdit ? "Salvar alterações" : "Criar auditoria"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AuditoriaFormDialog;