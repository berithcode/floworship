#!/usr/bin/env node
/**
 * build-apostila-pdf.mjs
 * Gera PDFs por BLOCO (não por lição individual)
 *
 * Blocos:
 *   1: L01-L06  → Alfabeto
 *   2: L07-L16  → Vocabulário
 *   3: L17-L20  → Frases do NT
 *
 * Uso:
 *   node .agent/scripts/build-apostila-pdf.mjs                    # todos os blocos
 *   node .agent/scripts/build-apostila-pdf.mjs --block 1          # só bloco 1
 *   node .agent/scripts/build-apostila-pdf.mjs --out-dir dist     # diretório de saída
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { resolve, basename, dirname, join } from 'path';
import { marked } from 'marked';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CSS_PATH = resolve(import.meta.dirname, '..', 'templates', 'apostila.css');
const APOSTILA_DIR = resolve(process.cwd(), 'WikiProjeto', 'Apostila');

const BLOCKS = [
  { id: 1, lessons: ['L01', 'L02', 'L03', 'L04', 'L05', 'L06'], title: 'Bloco 1 — Alfabeto', subtitle: 'Aprenda as vogais e consoantes do grego bíblico' },
  { id: 2, lessons: ['L07', 'L08', 'L09', 'L10', 'L11', 'L12', 'L13', 'L14', 'L15', 'L16'], title: 'Bloco 2 — Vocabulário Essencial', subtitle: 'As 50 palavras mais frequentes do Novo Testamento' },
  { id: 3, lessons: ['L17', 'L18', 'L19', 'L20'], title: 'Bloco 3 — Frases do NT', subtitle: 'Textos reais do Novo Testamento em grego' },
];

/* ─── Metadata filtering ─── */
const METADATA_PATTERNS = [
  /^\*\*Tipo:\*\*/i,
  /^\*\*Exibição:\*\*/i,
  /^\*\*Narração:\*\*/i,
  /^\*\*Repetições:\*\*/i,
  /^\*\*Instrução de Traçado:\*\*/i,
  /^\*\*Instrução:\*\*/i,
  /^> ⚠️/,
  /^```"[^"]*"```$/,
  /^```$/,
  /^📝 \*\*Tarefa:\*\*/,
  /^\*\*Detalhes Pedagógicos:\*\*/,
  /^\*\*Contexto Bíblico:\*\*/,
  /^\*\*Etologia:\*\*/,
];

function shouldRemoveLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  for (const pat of METADATA_PATTERNS) {
    if (pat.test(trimmed)) return true;
  }
  return false;
}

function filterMetadata(markdown) {
  const lines = markdown.split('\n');
  const result = [];
  let skipNextBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip lines matching metadata patterns
    if (shouldRemoveLine(line)) continue;

    // Skip empty code blocks that contain narration text
    if (trimmed === '```' && i > 0 && lines[i - 1].trim().startsWith('```')) continue;

    // Remove "- Etiologia: 📜 ..." bullet points
    if (/^- Etiologia:/.test(trimmed)) continue;

    result.push(line);
  }

  return result.join('\n');
}

/* ─── Cover page HTML ─── */
function buildCoverHTML(block) {
  return `
<div class="cover-page">
  <h1>Koine — Apostila</h1>
  <div class="subtitle">${block.title}</div>
  <p style="font-size:14pt;color:#444;margin-bottom:2em;">${block.subtitle}</p>
  <div class="date">Lições ${block.lessons[0]}–${block.lessons[block.lessons.length - 1]}</div>
  <div style="margin-top:3em;font-size:11pt;color:#666;">
    <p>${block.lessons.length} lições · Estudo guiado por voz</p>
    <p>Para uso com o aplicativo Koine</p>
  </div>
</div>`;
}

/* ─── HTML generation ─── */
function buildBlockHTML(markdown, css, block) {
  const filtered = filterMetadata(markdown);
  const html = marked.parse(filtered);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${block.title}</title>
  <style>${css}</style>
</head>
<body>
${buildCoverHTML(block)}
${html}
</body>
</html>`;
}

/* ─── PDF generation via Puppeteer ─── */
async function generatePDF(htmlPath, outPath, blockId) {
  const puppeteer = await import('puppeteer-core');
  const browser = await puppeteer.default.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(120000);
  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, {
    waitUntil: 'load',
  });

  await page.pdf({
    path: outPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '2cm',
      bottom: '2.5cm',
      left: '2cm',
      right: '2cm',
    },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="width:100%;font-size:9pt;color:#666;text-align:center;padding:0 2cm;">
        <span>Koine — Bloco ${blockId}</span>
        <span style="float:right;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
      </div>
    `,
  });

  await browser.close();
  console.log(`  PDF gerado: ${outPath}`);
}

/* ─── Main ─── */
async function main() {
  const args = process.argv.slice(2);
  let targetBlock = null;
  let outDir = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--block' && args[i + 1]) {
      targetBlock = parseInt(args[++i], 10);
    } else if (args[i] === '--out-dir' && args[i + 1]) {
      outDir = args[++i];
    }
  }

  if (!existsSync(APOSTILA_DIR)) {
    console.error(`Diretório de apostilas não encontrado: ${APOSTILA_DIR}`);
    process.exit(1);
  }

  let css = '';
  if (existsSync(CSS_PATH)) {
    css = readFileSync(CSS_PATH, 'utf-8');
  } else {
    console.warn('WARNING: apostila.css não encontrado, usando estilo básico');
    css = 'body { font-family: serif; font-size: 12pt; line-height: 1.6; }';
  }

  const blocks = targetBlock ? BLOCKS.filter(b => b.id === targetBlock) : BLOCKS;

  for (const block of blocks) {
    console.log(`\n═══ ${block.title} ═══`);

    // Concatenate all lesson markdowns
    let combinedMd = '';
    for (const lessonId of block.lessons) {
      const mdFile = join(APOSTILA_DIR, `${lessonId}.apostila.md`);
      if (!existsSync(mdFile)) {
        console.warn(`  AVISO: ${lessonId}.apostila.md não encontrado, pulando`);
        continue;
      }
      const md = readFileSync(mdFile, 'utf-8');
      combinedMd += md + '\n\n\\newpage\n\n';
    }

    if (!combinedMd.trim()) {
      console.error(`  ERRO: Nenhuma lição encontrada para o bloco ${block.id}`);
      continue;
    }

    const html = buildBlockHTML(combinedMd, css, block);

    const dir = outDir ? resolve(outDir) : APOSTILA_DIR;
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const htmlPath = join(dir, `bloco-${block.id}.html`);
    const pdfPath = join(dir, `bloco-${block.id}.apostila.pdf`);

    writeFileSync(htmlPath, html, 'utf-8');
    console.log(`  HTML temporário: ${htmlPath}`);

    await generatePDF(htmlPath, pdfPath, block.id);
  }

  console.log('\nConversão concluída!');
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
