import DOMPurify from 'dompurify';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { MeetingProtocol } from './clubLogic';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export type ProtocolDocumentKind =
  | 'pdf'
  | 'docx'
  | 'legacy-doc'
  | 'image'
  | 'text'
  | 'unsupported';

export function detectProtocolKind(
  proto: Pick<MeetingProtocol, 'fileName' | 'fileType' | 'fileData'>
): ProtocolDocumentKind {
  const name = (proto.fileName || '').toLowerCase();
  const type = (proto.fileType || '').toLowerCase();
  const data = (proto.fileData || '').toLowerCase();

  if (
    type.includes('pdf') ||
    name.endsWith('.pdf') ||
    data.startsWith('data:application/pdf')
  ) {
    return 'pdf';
  }

  if (
    type.includes('wordprocessingml') ||
    type.includes('openxmlformats-officedocument.wordprocessingml') ||
    name.endsWith('.docx') ||
    data.startsWith('data:application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  ) {
    return 'docx';
  }

  if (
    type.includes('msword') ||
    name.endsWith('.doc') ||
    name.endsWith('.odt') ||
    name.endsWith('.rtf') ||
    data.startsWith('data:application/msword') ||
    data.startsWith('data:application/vnd.oasis.opendocument')
  ) {
    return 'legacy-doc';
  }

  if (
    type.includes('image') ||
    /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(name) ||
    data.startsWith('data:image/')
  ) {
    return 'image';
  }

  if (
    type.startsWith('text/') ||
    name.endsWith('.txt') ||
    name.endsWith('.md') ||
    name.endsWith('.csv') ||
    data.startsWith('data:text/')
  ) {
    return 'text';
  }

  // Fallback for raw plain text that wasn't wrapped in a data URL
  if (!data.startsWith('data:')) {
    return 'text';
  }

  return 'unsupported';
}

export function getProtocolFormatLabel(kind: ProtocolDocumentKind): string {
  switch (kind) {
    case 'pdf':
      return 'PDF';
    case 'docx':
      return 'Word (.docx)';
    case 'legacy-doc':
      return 'Dokument';
    case 'image':
      return 'Bild';
    case 'text':
      return 'Text';
    default:
      return 'Datei';
  }
}

export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  if (!dataUrl.startsWith('data:')) {
    return new TextEncoder().encode(dataUrl);
  }

  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) {
    throw new Error('Ungültiges Dateiformat (fehlende Daten).');
  }

  const header = dataUrl.slice(0, commaIndex).toLowerCase();
  const payload = dataUrl.slice(commaIndex + 1);

  if (header.includes(';base64')) {
    const cleanBase64 = payload.replace(/\s+/g, '');
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  const decoded = decodeURIComponent(payload);
  return new TextEncoder().encode(decoded);
}

export function decodePlainTextDataUrl(fileData: string): string {
  if (!fileData) return '';
  if (!fileData.startsWith('data:')) {
    return fileData;
  }

  const commaIndex = fileData.indexOf(',');
  if (commaIndex === -1) return fileData;

  const header = fileData.slice(0, commaIndex).toLowerCase();
  const payload = fileData.slice(commaIndex + 1);

  if (header.includes(';base64')) {
    const bytes = dataUrlToUint8Array(fileData);
    return new TextDecoder('utf-8').decode(bytes);
  }

  try {
    return decodeURIComponent(payload);
  } catch {
    return payload;
  }
}

export function createBlobUrlFromDataUrl(
  dataUrl: string,
  fallbackMime = 'application/octet-stream'
): string {
  const bytes = dataUrlToUint8Array(dataUrl);
  const mimeMatch = dataUrl.match(/^data:([^;,]+)/i);
  const mimeType = mimeMatch?.[1] || fallbackMime;
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type: mimeType });
  return URL.createObjectURL(blob);
}

function normalizeDocxHtml(cleanHtml: string): string {
  if (!cleanHtml || typeof DOMParser === 'undefined') {
    return cleanHtml;
  }

  const doc = new DOMParser().parseFromString(cleanHtml, 'text/html');
  const h1Elements = Array.from(doc.body.querySelectorAll('h1'));
  const pElements = Array.from(doc.body.querySelectorAll('p'));

  // Some Word documents accidentally apply "Heading 1" / "Überschrift 1" to every body line.
  // Convert those long/majority Heading 1 lines into clean paragraphs while preserving real section headings.
  const mostlyHeadings =
    h1Elements.length >= 4 &&
    (pElements.length === 0 || h1Elements.length > pElements.length * 2);

  h1Elements.forEach((h1) => {
    const text = (h1.textContent || '').replace(/\s+/g, ' ').trim();
    const hasEmbeddedImage = Boolean(h1.querySelector('img'));

    if (!text && !hasEmbeddedImage) {
      h1.remove();
      return;
    }

    const looksLikeSectionHeading =
      text.length <= 75 &&
      (/^(top\s+[ivx0-9]+|verschiedenes|anwesende|tagesordnung|protokoll|jahreshauptversammlung|narrenkreissitzung|präsidiumssitzung)/i.test(
        text
      ) ||
        (text.endsWith(':') && text.length <= 45));

    if (mostlyHeadings) {
      const replacement = doc.createElement(looksLikeSectionHeading ? 'h2' : 'p');
      replacement.innerHTML = h1.innerHTML;
      h1.replaceWith(replacement);
    } else if (text.length > 100 && !looksLikeSectionHeading) {
      const replacement = doc.createElement('p');
      replacement.innerHTML = h1.innerHTML;
      h1.replaceWith(replacement);
    }
  });

  return doc.body.innerHTML;
}

export async function convertDocxToSafeHtml(fileData: string): Promise<string> {
  const bytes = dataUrlToUint8Array(fileData);
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  );

  const result = await mammoth.convertToHtml({
    arrayBuffer: arrayBuffer as ArrayBuffer,
  });

  const cleanHtml = DOMPurify.sanitize(result.value, {
    USE_PROFILES: { html: true },
  });

  return normalizeDocxHtml(cleanHtml);
}

export function createPdfLoadingTask(fileData: string) {
  const bytes = dataUrlToUint8Array(fileData);
  return pdfjsLib.getDocument({
    data: bytes,
  });
}

export async function renderPdfPagesAsImages(
  fileData: string,
  scale = 1.6
): Promise<string[]> {
  const loadingTask = createPdfLoadingTask(fileData);
  const pdfDoc = await loadingTask.promise;
  const images: string[] = [];

  try {
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      await page.render({
        canvas,
        canvasContext: context,
        viewport,
      }).promise;

      images.push(canvas.toDataURL('image/png'));
    }
  } finally {
    await loadingTask.destroy();
  }

  return images;
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function printProtocolDocument(proto: MeetingProtocol): Promise<{
  ok: boolean;
  error?: string;
}> {
  const kind = detectProtocolKind(proto);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return {
      ok: false,
      error: 'Druckfenster wurde vom Browser blockiert. Bitte Pop-ups erlauben oder Datei herunterladen.',
    };
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="de">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(proto.title)} — Narrenkreis Bruchsal</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #334155; padding: 40px; text-align: center; }
        </style>
      </head>
      <body>
        <p>Dokument wird für den Druck aufbereitet…</p>
      </body>
    </html>
  `);

  let bodyContentHtml = '';

  try {
    if (kind === 'docx') {
      const safeDocxHtml = await convertDocxToSafeHtml(proto.fileData);
      bodyContentHtml = `<div class="docx-content">${safeDocxHtml || '<p>Dokument enthält keinen darstellbaren Text.</p>'}</div>`;
    } else if (kind === 'pdf') {
      const pageImages = await renderPdfPagesAsImages(proto.fileData, 1.8);
      if (pageImages.length === 0) {
        bodyContentHtml = `<p class="notice">Dieses PDF enthält keine druckbaren Seiten.</p>`;
      } else {
        bodyContentHtml = `<div class="pdf-pages">${pageImages
          .map(
            (src, idx) =>
              `<div class="pdf-page"><img src="${src}" alt="Seite ${idx + 1}" /></div>`
          )
          .join('')}</div>`;
      }
    } else if (kind === 'image') {
      bodyContentHtml = `<div class="image-content"><img src="${escapeHtml(proto.fileData)}" alt="${escapeHtml(proto.title)}" /></div>`;
    } else if (kind === 'text') {
      const text = decodePlainTextDataUrl(proto.fileData);
      bodyContentHtml = `<pre class="text-content">${escapeHtml(text)}</pre>`;
    } else {
      bodyContentHtml = `<p class="notice">Dieses Dateiformat (${escapeHtml(proto.fileName)}) kann nicht direkt als Text gedruckt werden. Bitte lade die Originaldatei über den Download-Button herunter.</p>`;
    }
  } catch (err) {
    console.error('Fehler beim Aufbereiten der Druckansicht:', err);
    bodyContentHtml = `<p class="notice">Das Dokument konnte nicht für den Druck aufbereitet werden. Bitte nutze den Download-Button.</p>`;
  }

  const formattedDate = proto.date
    ? new Date(proto.date).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(proto.title)} — Narrenkreis Bruchsal</title>
      <style>
        body {
          font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          color: #1e293b;
          line-height: 1.6;
          margin: 0;
          padding: 28px;
          background: #ffffff;
        }
        .header {
          border-bottom: 3px solid #b91c1c;
          padding-bottom: 14px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .title {
          font-size: 20px;
          font-weight: 800;
          color: #7f1d1d;
          margin: 0;
          letter-spacing: 0.4px;
        }
        .subtitle {
          font-size: 13px;
          color: #64748b;
          margin-top: 3px;
          font-weight: 600;
        }
        .meta-box {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 22px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
        }
        .meta-box td {
          padding: 8px 14px;
          font-size: 13px;
          border-bottom: 1px solid #e2e8f0;
        }
        .meta-label {
          font-weight: 700;
          color: #475569;
          width: 170px;
        }
        .text-content {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 12px;
          white-space: pre-wrap;
          background: #ffffff;
          padding: 20px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          line-height: 1.55;
        }
        .docx-content {
          background: #ffffff;
          padding: 24px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 14px;
          line-height: 1.65;
          color: #0f172a;
        }
        .docx-content h1, .docx-content h2, .docx-content h3 {
          color: #0f172a;
          margin-top: 1.1em;
          margin-bottom: 0.45em;
          line-height: 1.3;
        }
        .docx-content h1 { font-size: 20px; }
        .docx-content h2 { font-size: 17px; }
        .docx-content h3 { font-size: 15px; }
        .docx-content p { margin: 0 0 0.75em 0; }
        .docx-content ul, .docx-content ol { margin: 0 0 0.85em 0; padding-left: 1.4em; }
        .docx-content li { margin-bottom: 0.25em; }
        .docx-content table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 13px; }
        .docx-content th, .docx-content td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
        .docx-content th { background: #f1f5f9; font-weight: 700; }
        .docx-content img { max-width: 100%; height: auto; }
        .pdf-pages { display: flex; flex-direction: column; gap: 16px; }
        .pdf-page { page-break-after: always; text-align: center; }
        .pdf-page:last-child { page-break-after: auto; }
        .pdf-page img { max-width: 100%; height: auto; border: 1px solid #e2e8f0; }
        .image-content { text-align: center; }
        .image-content img { max-width: 100%; height: auto; border: 1px solid #e2e8f0; }
        .notice { padding: 16px; background: #fffbeb; border: 1px solid #fde68a; color: #92400e; border-radius: 6px; font-size: 13px; }
        .footer {
          margin-top: 28px;
          padding-top: 12px;
          border-top: 1px solid #cbd5e1;
          font-size: 11px;
          color: #64748b;
          display: flex;
          justify-content: space-between;
        }
        @media print {
          body { padding: 10mm; }
          .docx-content, .text-content { border: none; padding: 0; }
          .pdf-page img { border: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">Narrenkreis Bruchsal</h1>
          <div class="subtitle">Interessengemeinschaft Bruchsaler Karnevals- und Fastnachtsvereine</div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #64748b;">
          <strong>Offizielles Archiv-Dokument</strong><br>
          Ausdruck: ${new Date().toLocaleDateString('de-DE')}
        </div>
      </div>

      <table class="meta-box">
        <tr>
          <td class="meta-label">Dokumententitel:</td>
          <td><strong>${escapeHtml(proto.title)}</strong></td>
        </tr>
        <tr>
          <td class="meta-label">Sitzungsart:</td>
          <td>${escapeHtml(proto.meetingType)}</td>
        </tr>
        <tr>
          <td class="meta-label">Sitzungsdatum:</td>
          <td>${escapeHtml(formattedDate || proto.date)}</td>
        </tr>
        <tr>
          <td class="meta-label">Dateiname:</td>
          <td>${escapeHtml(proto.fileName)} (${formatSize(proto.fileSize)})</td>
        </tr>
        <tr>
          <td class="meta-label">Erfasst durch:</td>
          <td>${escapeHtml(proto.uploadedByUserName)}</td>
        </tr>
        ${
          proto.description
            ? `<tr><td class="meta-label">Notiz / Tagesordnung:</td><td>${escapeHtml(proto.description)}</td></tr>`
            : ''
        }
      </table>

      ${bodyContentHtml}

      <div class="footer">
        <span>Narrenkreis Bruchsal · 76646 Bruchsal · Protokollarchiv</span>
        <span>Zur Aufbewahrung im offiziellen Vereinsordner</span>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 350);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();

  return { ok: true };
}
