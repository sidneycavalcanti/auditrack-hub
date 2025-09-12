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
import { useCreateCadAvOperacional, useUpdateCadAvOperacional } from "../hooks/useCadAvOperacional";
import { CadAvOperacional } from "@/types";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: CadAvOperacional | null;
}

const CadAvOperacionalFormDialog: React.FC<Props> = ({ open, onOpenChange, initialData }) => {
    const isEdit = !!initialData?.id;
    const [form, setForm] = React.useState({
        titulo: "",
        descricao: "",
        ativo: true,
    });

    const { mutate: createItem, isPending: creating } = useCreateCadAvOperacional();
    const { mutate: updateItem, isPending: updating } = useUpdateCadAvOperacional();

    useEffect(() => {
        if (open) {
            if (initialData) {
                setForm({
                    titulo: initialData.titulo ?? "",
                    descricao: initialData.descricao ?? "",
                    ativo: initialData.ativo ?? true,
                });
            } else {
                setForm({ titulo: "", descricao: "", ativo: true });
            }
        }
    }, [open, initialData]);

    const handleSubmit = () => {
        if (!form.titulo?.trim()) return;

        const payload = { ...form };
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
                    <DialogTitle>{isEdit ? "Editar Avaliação Operacional" : "Nova Avaliação Operacional"}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Título</Label>
                        <Input
                            value={form.titulo}
                            onChange={(e) => setForm((s) => ({ ...s, titulo: e.target.value }))}
                            placeholder="Informe o título"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Descrição</Label>
                        <Textarea
                            rows={4}
                            value={form.descricao}
                            onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
                            placeholder="Descreva a avaliação operacional..."
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                            <Label className="text-sm">Ativo</Label>
                            <p className="text-xs text-muted-foreground">Disponibilizar este cadastro</p>
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

export default CadAvOperacionalFormDialog;