/**
 * pdf-parse doesn't ship reliable first-party types, and the community
 * @types package for it has lagged behind before — this declares only
 * the shape we actually call, which is more trustworthy than pulling
 * in a third-party types package for one function.
 */
declare module "pdf-parse" {
  interface PdfParseResult {
    text: string;
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    version: string;
  }

  function pdfParse(dataBuffer: Buffer, options?: Record<string, unknown>): Promise<PdfParseResult>;

  export = pdfParse;
}
