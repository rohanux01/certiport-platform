"use client";

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

let pdfJsPromise: Promise<any> | null = null;

export async function getPdfJs(): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("PDF rendering is only available in browser");
  }

  if (window.pdfjsLib) {
    return window.pdfjsLib;
  }

  if (pdfJsPromise) {
    return pdfJsPromise;
  }

  pdfJsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[src*="pdf.min.js"]');
    if (existingScript) {
      const interval = setInterval(() => {
        if (window.pdfjsLib) {
          clearInterval(interval);
          resolve(window.pdfjsLib);
        }
      }, 50);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.onload = () => {
      const pdfjs = window.pdfjsLib;
      if (pdfjs) {
        pdfjs.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(pdfjs);
      } else {
        reject(new Error("pdfjsLib not found on window"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js from CDN"));
    document.head.appendChild(script);
  });

  return pdfJsPromise;
}

export interface RenderedPdfPage {
  dataUrl: string;
  totalPages: number;
  pageNumber: number;
  width: number;
  height: number;
  aspectRatio: number; // width / height
}

export async function renderPdfToDataUrl(
  source: File | ArrayBuffer,
  pageNumber = 1,
  scale = 2.0
): Promise<RenderedPdfPage> {
  const pdfjs = await getPdfJs();

  let arrayBuffer: ArrayBuffer;
  if (source instanceof File) {
    arrayBuffer = await source.arrayBuffer();
  } else {
    arrayBuffer = source;
  }

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const safePageNum = Math.max(1, Math.min(pageNumber, totalPages));

  const page = await pdf.getPage(safePageNum);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas 2d context");

  const renderContext = {
    canvasContext: ctx,
    viewport,
  };

  await page.render(renderContext).promise;

  return {
    dataUrl: canvas.toDataURL("image/png", 0.95),
    totalPages,
    pageNumber: safePageNum,
    width: viewport.width,
    height: viewport.height,
    aspectRatio: viewport.width / viewport.height,
  };
}

export function isPdf(file: File | string): boolean {
  if (typeof file === "string") {
    return file.toLowerCase().endsWith(".pdf");
  }
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}
