"use client";

import React, { useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loja } from "@/types";
import { useCreateLoja, useUpdateLoja } from "../hooks/useLojas";

interface LojaFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Loja | null;
}

const LojaFormDialog: React.FC<LojaFormDialogProps> = ({ open, onOpenChange, initialData }) => {
    const isEdit = !!initialData?.id;
    const [form, setForm] = React.useState({
        descricao: "",
        codigo: "",
        luc: "",
        piso: "",
        ativa: true,
    });

    const { mutate: createLoja, isPending: creating } = useCreateLoja();
    const { mutate: updateLoja, isPending: updating } = useUpdateLoja();

    useEffect(() => {
        if (open) {
            if (initialData) {
                setForm({
                    descricao: initialData.descricao || "",
                    codigo: initialData.codigo || "",
                    luc: initialData.luc || "",
                    piso: initialData.piso || "",
                    ativa: !!initialData.ativa,
                });
            } else {
                setForm({ descricao: "", codigo: "", luc: "", piso: "", ativa: true });
            }
        }
    }, [open, initialData]);

    const handleSubmit = () => {
        if (!form.descricao?.trim()) return;

        if (isEdit && initialData) {
            updateLoja(
                { id: initialData.id, data: { ...form } },
                { onSuccess: () => onOpenChange(false) }
            );
        } else {
            createLoja({ ...form }, { onSuccess: () => onOpenChange(false) });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Loja" : "Nova Loja"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="descricao">Descrição</Label>
                        <Input
                            id="descricao"
                            placeholder="Nome da loja"
                            value={form.descricao}
                            onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="codigo">Código</Label>
                        <Input
                            id="codigo"
                            placeholder="Código interno"
                            value={form.codigo}
                            onChange={(e) => setForm((s) => ({ ...s, codigo: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="luc">LUC</Label>
                            <Input
                                id="luc"
                                placeholder="Localização"
                                value={form.luc}
                                onChange={(e) => setForm((s) => ({ ...s, luc: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="piso">Piso</Label>
                            <Input
                                id="piso"
                                placeholder="Ex: Térreo"
                                value={form.piso}
                                onChange={(e) => setForm((s) => ({ ...s, piso: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                            <Label className="text-sm">Ativa</Label>
                            <p className="text-xs text-muted-foreground">Marque para ativar a loja</p>
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
                        {isEdit ? "Salvar alterações" : "Criar loja"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LojaFormDialog;