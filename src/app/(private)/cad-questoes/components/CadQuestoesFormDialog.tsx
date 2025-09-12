"use client";

import React, { useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateCadQuestoes, useUpdateCadQuestoes } from "../hooks/useCadQuestoes";
import { useCategorias } from "../../categorias/hooks/useCategorias";
import { CadQuestao } from "@/types";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: CadQuestao | null;
}

const CadQuestoesFormDialog: React.FC<Props> = ({ open, onOpenChange, initialData }) => {
    const isEdit = !!initialData?.id;

    const [form, setForm] = React.useState({
        enunciado: "",
        categoriaId: 0 as number | string,
        descricao: "",
        ativo: true,
    });

    const { data: categoriasResp } = useCategorias({ enabled: open });
    const categorias = (categoriasResp as any)?.cats ?? (categoriasResp as any)?.items ?? [];

    const { mutate: createItem, isPending: creating } = useCreateCadQuestoes();
    const { mutate: updateItem, isPending: updating } = useUpdateCadQuestoes();

    useEffect(() => {
        if (open) {
            if (initialData) {
                setForm({
                    enunciado: initialData.enunciado ?? "",
                    categoriaId: initialData.categoriaId ?? 0,
                    descricao: (initialData as any).descricao ?? "",
                    ativo: (initialData as any).ativo ?? true,
                });
            } else {
                setForm({ enunciado: "", categoriaId: 0, descricao: "", ativo: true });
            }
        }
    }, [open, initialData]);

    const handleSubmit = () => {
        if (!form.enunciado?.trim() || !form.categoriaId) return;

        const payload = {
            enunciado: form.enunciado,
            categoriaId: Number(form.categoriaId),
            descricao: form.descricao,
            ativo: form.ativo,
        };

        if (isEdit && initialData) {
            updateItem({ id: initialData.id, data: payload }, { onSuccess: () => onOpenChange(false) });
        } else {
            createItem(payload, { onSuccess: () => onOpenChange(false) });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Questão" : "Nova Questão"}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Enunciado</Label>
                        <Input
                            value={form.enunciado}
                            onChange={(e) => setForm((s) => ({ ...s, enunciado: e.target.value }))}
                            placeholder="Digite o enunciado da questão"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Categoria</Label>
                        <Select
                            value={form.categoriaId ? String(form.categoriaId) : ""}
                            onValueChange={(v) => setForm((s) => ({ ...s, categoriaId: Number(v) }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {categorias.map((c: any) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name ?? c.descricao ?? `Categoria #${c.id}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Descrição (opcional)</Label>
                        <Textarea
                            rows={4}
                            value={form.descricao}
                            onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
                            placeholder="Detalhes, critérios, observações..."
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                            <Label className="text-sm">Ativa</Label>
                            <p className="text-xs text-muted-foreground">Disponibilizar esta questão</p>
                        </div>
                        <Switch
                            checked={form.ativo}
                            onCheckedChange={(v) => setForm((s) => ({ ...s, ativo: v }))}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={creating || updating}>
                        {isEdit ? "Salvar alterações" : "Criar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CadQuestoesFormDialog;