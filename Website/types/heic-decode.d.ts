declare module 'heic-decode' {
  const decode: (args: { buffer: Buffer | ArrayBuffer | Uint8Array }) => Promise<{
    width: number
    height: number
    data: Uint8Array // RGBA
  }>
  export default decode
} 