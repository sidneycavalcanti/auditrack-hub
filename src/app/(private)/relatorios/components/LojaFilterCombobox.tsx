"use client";

import * as React from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { Loja } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  lojas: Loja[];
  value?: number;
  onValueChange: (value?: number) => void;
  placeholder?: string;
  allLabel?: string;
  widthClassName?: string;
};

export default function LojaFilterCombobox({
  lojas,
  value,
  onValueChange,
  placeholder = "Selecione a loja",
  allLabel,
  widthClassName = "w-[220px]",
}: Props) {
  const [open, setOpen] = React.useState(false);

  const lojasOrdenadas = React.useMemo(() => {
    return [...lojas].sort((a, b) => {
      const la = (a.descricao ?? a.name ?? `Loja ${a.id}`).trim();
      const lb = (b.descricao ?? b.name ?? `Loja ${b.id}`).trim();
      return la.localeCompare(lb, "pt-BR", { sensitivity: "base" });
    });
  }, [lojas]);

  const selectedLabel = React.useMemo(() => {
    if (value === undefined && allLabel) return allLabel;
    const found = lojasOrdenadas.find((l) => Number(l.id) === Number(value));
    return found ? found.descricao ?? found.name ?? `Loja ${found.id}` : placeholder;
  }, [value, allLabel, lojasOrdenadas, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(widthClassName, "justify-between cursor-pointer")}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0", widthClassName)}>
        <Command>
          <CommandInput placeholder="Buscar loja..." />
          <CommandList>
            <CommandEmpty>Nenhuma loja encontrada.</CommandEmpty>
            <CommandGroup>
              {allLabel ? (
                <CommandItem
                  value={allLabel}
                  onSelect={() => {
                    onValueChange(undefined);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === undefined ? "opacity-100" : "opacity-0")} />
                  {allLabel}
                </CommandItem>
              ) : null}
              {lojasOrdenadas.map((loja) => {
                const lojaLabel = loja.descricao ?? loja.name ?? `Loja ${loja.id}`;
                const isSelected = Number(loja.id) === Number(value);
                return (
                  <CommandItem
                    key={loja.id}
                    value={lojaLabel}
                    onSelect={() => {
                      onValueChange(Number(loja.id));
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                    {lojaLabel}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
