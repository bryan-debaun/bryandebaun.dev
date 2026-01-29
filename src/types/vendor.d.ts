declare module 'pixelmatch' {
    function pixelmatch(
        img1: Uint8Array | Buffer,
        img2: Uint8Array | Buffer,
        output: Uint8Array | null,
        width: number,
        height: number,
        options?: { threshold?: number; includeAA?: boolean }
    ): number

    export default pixelmatch
}

declare module 'pngjs' {
    export class PNG {
        constructor(opts?: { width?: number; height?: number; colorType?: number })
        width: number
        height: number
        data: Buffer
        static sync: {
            read(buf: Buffer): PNG
            write(png: PNG): Buffer
        }
    }
}
