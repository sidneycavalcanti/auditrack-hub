"use client";

import React, { useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuditorias, useCreateAuditoria, useUpdateAuditoria } from "../hooks/useAuditorias";
import { useLojas } from "../../lojas/hooks/useLojas";
import { useUsuarios } from "../../usuarios/hooks/useUsuarios";
import { Auditoria, Loja, User } from "@/types";

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
        data: '',
        horaInicial: '',
        horaFinal: '',
    });

    const { data: lojasResp } = useLojas({ limit: 100 });
    const { data: usuariosResp } = useUsuarios({ limit: 100 });

    const lojas = (lojasResp as any)?.data as Loja[] || [];
    const usuarios = (usuariosResp as any)?.users as User[] || [];

    const { mutate: createAuditoria, isPending: creating } = useCreateAuditoria();
    const { mutate: updateAuditoria, isPending: updating } = useUpdateAuditoria();

    useEffect(() => {
        if (open) {
            if (initialData) {
                setForm({
                    lojaId: initialData.lojaId,
                    usuarioId: initialData.usuarioId,
                    data: initialData.data?.slice(0, 10),
                    horaInicial: initialData.horaInicial || '',
                    horaFinal: initialData.horaFinal || '',
                });
            } else {
                setForm({ lojaId: undefined, usuarioId: undefined, data: '', horaInicial: '', horaFinal: '' });
            }
        }
    }, [open, initialData]);

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
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Editar Auditoria' : 'Nova Auditoria'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Loja</Label>
                        <Select
                            value={form.lojaId ? String(form.lojaId) : ''}
                            onValueChange={(v) => setForm((s) => ({ ...s, lojaId: Number(v) }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a loja" />
                            </SelectTrigger>
                            <SelectContent>
                                {lojas.map((l) => (
                                    <SelectItem key={l.id} value={String(l.id)}>{l.descricao}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Auditor</Label>
                        <Select
                            value={form.usuarioId ? String(form.usuarioId) : ''}
                            onValueChange={(v) => setForm((s) => ({ ...s, usuarioId: Number(v) }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o auditor" />
                            </SelectTrigger>
                            <SelectContent>
                                {usuarios.map((u) => (
                                    <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Data</Label>
                        <Input type="date" value={form.data || ''} onChange={(e) => setForm((s) => ({ ...s, data: e.target.value }))} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Hora Inicial</Label>
                            <Input type="time" value={form.horaInicial || ''} onChange={(e) => setForm((s) => ({ ...s, horaInicial: e.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Hora Final</Label>
                            <Input type="time" value={form.horaFinal || ''} onChange={(e) => setForm((s) => ({ ...s, horaFinal: e.target.value }))} />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={creating || updating}>{isEdit ? 'Salvar alterações' : 'Criar auditoria'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AuditoriaFormDialog;