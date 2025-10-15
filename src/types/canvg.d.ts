// src/types/canvg.d.ts
declare module "canvg" {
    // assinatura mínima que usamos
    export class Canvg {
        static fromString(
            ctx: CanvasRenderingContext2D,
            svg: string,
            opts?: any
        ): Promise<Canvg>;
        render(): Promise<void>;
        resize(width: number, height: number, preset?: string): void;
        stop(): void;
    }

    // algumas builds exportam default
    const _default: typeof Canvg;
    export default _default;
}