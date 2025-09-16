"use client";

import React, { useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCreateCategoria, useUpdateCategoria } from "../hooks/useCategorias";
import { Categoria } from "@/types";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Categoria | null;
}

const CategoriaFormDialog: React.FC<Props> = ({ open, onOpenChange, initialData }) => {
    const isEdit = !!initialData?.id;

    const [form, setForm] = React.useState({
        name: "",
    });

    const { mutate: createItem, isPending: creating } = useCreateCategoria();
    const { mutate: updateItem, isPending: updating } = useUpdateCategoria();

    useEffect(() => {
        if (open) {
            if (initialData) {
                setForm({
                    name: initialData.name ?? "",
                });
            } else {
                setForm({ name: "" });
            }
        }
    }, [open, initialData]);

    const handleSubmit = () => {
        if (!form.name?.trim()) return;

        const payload = { ...form };
        if (isEdit && initialData) {
            updateItem({ id: initialData.id, data: payload }, { onSuccess: () => onOpenChange(false) });
        } else {
            createItem(payload, { onSuccess: () => onOpenChange(false) });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Nome</Label>
                        <Input
                            value={form.name}
                            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                            placeholder="Ex.: Operacional"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button className="cursor-pointer" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button className="cursor-pointer" onClick={handleSubmit} disabled={creating || updating}>
                        {isEdit ? "Salvar alterações" : "Criar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CategoriaFormDialog;