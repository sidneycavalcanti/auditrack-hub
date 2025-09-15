// src/app/(private)/usuarios/components/UsuarioFormDialog.tsx
"use client";

import React, { useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateUsuario, useUpdateUsuario } from "../hooks/useUsuarios";
import { User } from "@/types";
import { categoriaAPI } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

interface UsuarioFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: User | null;
}

const UsuarioFormDialog: React.FC<UsuarioFormDialogProps> = ({
    open,
    onOpenChange,
    initialData,
}) => {
    const isEdit = !!initialData?.id;

    const [form, setForm] = React.useState<
        Partial<User & { passwordConfirmation?: string }>
    >({
        name: "",
        username: "",
        password: "",
        passwordConfirmation: "",
        categoriaId: 0,
        situacao: true,
    });

    const { data: categoriasResp } = useQuery({
        queryKey: ["categorias"],
        queryFn: async () => {
            const response = await categoriaAPI.getAll({ limit: 100 });
            return response.data;
        },
        enabled: open,
    });

    const categorias = (categoriasResp as any)?.cats || [];

    const { mutate: createUsuario, isPending: creating } = useCreateUsuario();
    const { mutate: updateUsuario, isPending: updating } = useUpdateUsuario();

    useEffect(() => {
        if (open) {
            if (initialData) {
                setForm({
                    name: initialData.name || "",
                    username: initialData.username || "",
                    password: "",
                    passwordConfirmation: "",
                    categoriaId: initialData.categoriaId || 0,
                    situacao: initialData.situacao ?? true,
                });
            } else {
                setForm({
                    name: "",
                    username: "",
                    password: "",
                    passwordConfirmation: "",
                    categoriaId: 0,
                    situacao: true,
                });
            }
        }
    }, [open, initialData]);

    const handleSubmit = () => {
        if (!form.name || !form.username || !form.categoriaId) return;
        if (!isEdit && !form.password) return;
        if (form.password && form.password !== form.passwordConfirmation) return;

        const payload: any = {
            name: form.name,
            username: form.username,
            categoriaId: form.categoriaId,
            situacao: form.situacao,
        };

        if (form.password) {
            payload.password = form.password;
            payload.passwordConfirmation = form.passwordConfirmation;
        }

        if (isEdit && initialData) {
            updateUsuario(
                { id: initialData.id, data: payload },
                { onSuccess: () => onOpenChange(false) }
            );
        } else {
            createUsuario(payload, { onSuccess: () => onOpenChange(false) });
        }
    };

    const isFormValid =
        !!form.name &&
        !!form.username &&
        !!form.categoriaId &&
        (!isEdit ? !!form.password : true) &&
        (!form.password || form.password === form.passwordConfirmation);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Nome</Label>
                        <Input
                            value={form.name || ""}
                            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                            placeholder="Nome completo do usuário"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Nome de usuário</Label>
                        <Input
                            value={form.username || ""}
                            onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                            placeholder="Nome de usuário para login"
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
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>{isEdit ? "Nova senha (opcional)" : "Senha"}</Label>
                        <Input
                            type="password"
                            value={form.password || ""}
                            onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                            placeholder={isEdit ? "Nova senha (opcional)" : "Senha do usuário"}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Confirmação de senha</Label>
                        <Input
                            type="password"
                            value={form.passwordConfirmation || ""}
                            onChange={(e) =>
                                setForm((s) => ({ ...s, passwordConfirmation: e.target.value }))
                            }
                            placeholder="Confirme a senha"
                        />
                        {form.password && form.password !== form.passwordConfirmation && (
                            <p className="text-sm text-destructive">As senhas não coincidem</p>
                        )}
                    </div>

                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                            <Label className="text-sm">Usuário ativo</Label>
                            <p className="text-xs text-muted-foreground">Permite acesso ao sistema</p>
                        </div>
                        <Switch
                            className="cursor-pointer"
                            checked={!!form.situacao}
                            onCheckedChange={(checked) => setForm((s) => ({ ...s, situacao: checked }))}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button className="cursor-pointer" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button className="cursor-pointer" onClick={handleSubmit} disabled={creating || updating || !isFormValid}>
                        {isEdit ? "Salvar alterações" : "Criar usuário"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default UsuarioFormDialog;