// .agent/scripts/extract-narration.mjs (ajustado)
// Extrai as marcações de narração (**Narração (PT):**) dos arquivos .apostila.md
// e salva em arquivos .narration.md compatíveis com o gerador de áudio.
// Suporta dois formatos de entrada:
// 1. Formato antigo ([MARCADOR] + texto corrido) — Ex: C1-M01.narracao.md
// 2. Formato novo (## Step X + campos estruturados) — Ex: L01.apostila.md

import { readFile, writeFile } from 'node:fs/promises';
import { glob } from 'glob';
import path from 'node:path';
import { argv } from 'node:process';

const CHECK_MODE = argv.includes('--check');
const SOURCE_ROOT = path.join(import.meta.dirname, '../../WikiProjeto/Apostila');
const TARGET_ROOT = path.join(import.meta.dirname, '../../WikiProjeto/Narração');

// Regex para capturar blocos de narração no formato **Narração (PT):**
const NARRATION_FIELD_REGEX = /\*\*Narração \(PT\):\*\*/;
const STEP_HEADER_REGEX = /^## (?:\🏁|\🅰️|\🖋️|\✍️|\🧠|\🎉) Step (\d+): (.*)$/;

// Regex para capturar blocos no formato antigo ([MARCADOR])
const OLD_MARKER_REGEX = /^\[([A-Z_]+)\]$/;
const OLD_CONTENT_LINE = /^[^\[]/; // Linhas que não começam com "["

async function ensureTargetDir() {
    try {
        await import('node:fs').then((fs) => fs.promises.mkdir(TARGET_ROOT, { recursive: true }));
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
    }
}

async function extractFromOldFormat(filePath) {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    let extractedSteps = [];
    let currentMarker = '';
    let currentStep = { number: 0, title: '', narration: '' };
    let narrationBuffer = [];
    let stepCounter = 0;

    for (const line of lines) {
        // Detecta marcador antigo ([MARCADOR])
        const markerMatch = line.match(OLD_MARKER_REGEX);
        if (markerMatch) {
            // Salva o step anterior se tiver narração
            if (currentMarker && narrationBuffer.length > 0) {
                currentStep = {
                    number: ++stepCounter,
                    title: currentMarker.replace(/_/g, ' ').toLowerCase(),
                    narration: narrationBuffer.join(' ').replace(/\s+/g, ' ').trim(),
                };
                extractedSteps.push(currentStep);
                narrationBuffer = [];
            }
            currentMarker = markerMatch[1];
            continue;
        }
        
        // Coleta linhas de conteúdo (ignorando linhas com "[")
        if (OLD_CONTENT_LINE.test(line.trim()) && currentMarker) {
            const cleanLine = line.trim().replace(/\"/g, '').replace(/^>\s*/, '');
            if (cleanLine) narrationBuffer.push(cleanLine);
        }
    }
    
    // Salva o último step
    if (currentMarker && narrationBuffer.length > 0) {
        currentStep = {
            number: ++stepCounter,
            title: currentMarker.replace(/_/g, ' ').toLowerCase(),
            narration: narrationBuffer.join(' ').replace(/\s+/g, ' ').trim(),
        };
        extractedSteps.push(currentStep);
    }
    
    return extractedSteps;
}

async function extractFromNewFormat(filePath) {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    let extractedSteps = [];
    let currentStep = { number: 0, title: '', narration: '' };
    let inNarrationBlock = false;
    let narrativeLines = [];
    let stepCounter = 0;

    for (const line of lines) {
        // Detecta cabeçalho de step ("## Step X: Título")
        const stepMatch = line.match(STEP_HEADER_REGEX);
        if (stepMatch) {
            // Salva o step anterior se tiver narração
            if (currentStep.number > 0 && currentStep.narration) {
                extractedSteps.push(currentStep);
            }
            currentStep = {
                number: parseInt(stepMatch[1], 10),
                title: stepMatch[2],
                narration: '',
            };
            inNarrationBlock = false;
            stepCounter = currentStep.number;
            continue;
        }

        // Detecta início de bloco de narração
        if (NARRATION_FIELD_REGEX.test(line)) {
            inNarrationBlock = true;
            narrativeLines = [];
            continue;
        }

        // Coleta linhas de narração
        if (inNarrationBlock) {
            // Fim do bloco: linha vazia, próximo step, ou próximo campo
            if (!line.trim() || line.startsWith('## ') || line.startsWith('**') || line.startsWith('---')) {
                inNarrationBlock = false;
                currentStep.narration = narrativeLines.join(' ').replace(/\s+/g, ' ').trim();
                if (currentStep.narration) {
                    // Se não tiver número de step, usa um incremental
                    if (currentStep.number === 0) {
                        stepCounter++;
                        currentStep.number = stepCounter;
                    }
                    extractedSteps.push(currentStep);
                    currentStep = { number: 0, title: currentStep.title, narration: '' };
                }
            } else {
                const cleanLine = line.replace(/^>\s*"/, '').replace(/"$/, '').trim();
                if (cleanLine) narrativeLines.push(cleanLine);
            }
        }
    }

    // Salva o último step
    if (currentStep.number > 0 && currentStep.narration) {
        extractedSteps.push(currentStep);
    }

    return extractedSteps;
}

async function extractNarration(filePath) {
    const fileName = path.basename(filePath);
    let extractedSteps;
    
    // Detecta formato pelo nome do arquivo
    if (fileName.endsWith('.apostila.md')) {
        // Formato novo (L01.apostila.md → L01.narration.md)
        extractedSteps = await extractFromNewFormat(filePath);
    } else {
        // Formato antigo ([MARCADOR])
        extractedSteps = await extractFromOldFormat(filePath);
    }
    
    if (extractedSteps.length === 0) {
        return 0;
    }

    // Gera conteúdo para o .narration.md (formato unificado)
    let narrationContent = `# Narração: ${fileName.replace('.apostila.md', '.narration.md').replace('.narracao.md', '.narration.md').replace('.md', '')}\n\n`;
    extractedSteps.forEach((step) => {
        narrationContent += `## Step ${step.number}: ${step.title}\n**Narração (PT):**\n> "${step.narration}"\n\n`;
    });

    // Salva o arquivo
    const targetFileName = fileName.replace('.apostila.md', '.narration.md').replace('.narracao.md', '.narration.md');
    const targetFilePath = path.join(TARGET_ROOT, targetFileName);

    if (!CHECK_MODE) {
        await writeFile(targetFilePath, narrationContent, 'utf-8');
        console.log(`✅ Extraído: ${targetFileName} (${extractedSteps.length} steps)`);
    } else {
        console.log(`🔍 Narração detectada: ${targetFileName} (${extractedSteps.length} steps)`);
    }
    return extractedSteps.length;
}

async function main() {
    console.log('🎤 Extraindo narrações dos arquivos fonte...');
    console.log(CHECK_MODE ? '🔍 Modo de verificação (sem salvar arquivos)' : '📝 Modo de escrita');
    console.log('');
    
    await ensureTargetDir();
    
    // Encontra arquivos .apostila.md e arquivos antigos do diretório de geração
    const apostolFiles = await glob('**/*.apostila.md', { cwd: SOURCE_ROOT });
    const oldNarrationFiles = await glob('**/*.narracao.md', {
        cwd: path.join(import.meta.dirname, '../../WikiProjeto/Extruturador metodogico/Geração de audio piper'),
    });
    
    let totalSteps = 0;
    let filesProcessed = 0;
    let filesWithNarration = 0;

    // Processa arquivos novos (.apostila.md)
    await Promise.all(
        apostolFiles.map(async (file) => {
            const filePath = path.join(SOURCE_ROOT, file);
            try {
                const steps = await extractNarration(filePath);
                totalSteps += steps;
                if (steps > 0) filesWithNarration++;
                filesProcessed++;
            } catch (error) {
                console.error(`❌ Erro ao processar ${file}: ${error.message}`);
            }
        })
    );
    
    // Processa arquivos antigos (.narracao.md)
    await Promise.all(
        oldNarrationFiles.map(async (file) => {
            const filePath = path.join(import.meta.dirname, '../../WikiProjeto/Extruturador metodogico/Geração de audio piper', file);
            try {
                const steps = await extractNarration(filePath);
                totalSteps += steps;
                if (steps > 0) filesWithNarration++;
                filesProcessed++;
            } catch (error) {
                console.error(`❌ Erro ao processar ${file}: ${error.message}`);
            }
        })
    );

    console.log('');
    console.log('📊 Resumo:');
    console.log(`- Arquivos processados: ${filesProcessed}`);
    console.log(`- Arquivos com narração: ${filesWithNarration}`);
    console.log(`- Steps de narração extraídos: ${totalSteps}`);
    console.log('');
    console.log(CHECK_MODE ? '✅ Verificação concluída!' : '✅ Extração concluída!');
}

main().catch(console.error);