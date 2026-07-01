// .agent/scripts/generate-narration-from-apostila.mjs
// Lê cada .apostila.md, extrai/genera narração por step,
// e gera .narracao.md compatível com gerar_audio.py (formato [MARCADOR]).
//
// Uso:
//   node .agent/scripts/generate-narration-from-apostila.mjs          # Todas as lições
//   node .agent/scripts/generate-narration-from-apostila.mjs --lesson L01
//   node .agent/scripts/generate-narration-from-apostila.mjs --check

import { readFile, writeFile, access } from 'node:fs/promises';
import { glob } from 'glob';
import path from 'node:path';
import { argv } from 'node:process';

const CHECK_MODE = argv.includes('--check');
const SPECIFIC_LESSON = argv.find(arg => arg.startsWith('--lesson='))?.split('=')[1];
const SOURCE_ROOT = path.join(import.meta.dirname, '../../WikiProjeto/Apostila');
const TARGET_ROOT = path.join(import.meta.dirname, '../../WikiProjeto/Narração');

// Regex patterns
const STEP_HEADER_REGEX = /^## .*Step (\d+): (.+)$/;
const NARRATION_REGEX = /\*\*Narração(?: \(PT\))?:\*\*/;
const TYPE_REGEX = /\*\*Tipo:\*\*/;
const GREGO_REGEX = /\*\*Grego:\*\*\s*(.+)$/;
const TRANSLIT_REGEX = /\*\*Transliteração:\*\*\s*(.+)$/;
const PRONUNCIA_REGEX = /\*\*Pronúncia:\*\*\s*(.+)$/;
const SIGNIFICADO_REGEX = /\*\*Significado:\*\*\s*(.+)$/;
const INSTRUCAO_REGEX = /\*\*Instrução:\*\*\s*(.+)$/;
const REPETICOES_REGEX = /\*\*Repetições:\*\*\s*(.+)$/;
const ETIOLOGIA_REGEX = /Etiologia:.*\s*(.+)$/;
const CONTEXTO_REGEX = /\*\*Contexto Bíblico:\*\*/;
const TRACADO_REGEX = /\*\*Instrução de Traçado:\*\*/;

// Mapeia emojis para tipos
function detectStepType(line, title) {
    const t = title.toLowerCase();
    if (title === 'intro' || t.startsWith('intro')) return 'INTRODUCAO';
    if (title === 'pause' || t.startsWith('pause') || t.startsWith('revisão')) return 'PAUSA';
    if (t.startsWith('ditado') || t.includes('ditado') || t.startsWith('dictation')) return 'DITADO';
    if (t.includes('word_intro') || t.includes('word intro') || t.includes('palavra')) return 'EXPOSICAO';
    if (t.includes('alphabet_trace') || t.includes('alphabet trace') || t.includes('traço') || t.includes('demonstração')) return 'EXPOSICAO';
    if (t.includes('write_practice') || t.includes('write practice') || t.includes('escrita') || t.includes('prática')) return 'EXPOSICAO';
    if (t.includes('fim') || t.includes('conclusão')) return 'FINALIZACAO';
    return 'EXPOSICAO';
}

function generateNarrationForStep(stepType, title, fields) {
    const t = title.toLowerCase();
    
    // intro
    if (stepType === 'INTRODUCAO') {
        return `Bem-vindo à ${title}. Siga as instruções na apostila e acompanhe comigo.`;
    }
    
    // pause
    if (stepType === 'PAUSA') {
        return `Muito bem! Faça uma pausa e revise o que aprendeu. Compare sua escrita com o modelo na apostila. Quando estiver pronto, continue.`;
    }
    
    // ditado
    if (stepType === 'DITADO') {
        const translit = fields.transliteracao || '';
        if (translit) return `Escreva no papel: ${translit}.`;
        const cleanTitle = title.replace(/^(?:Ditado|dictation)\s*[—\-]\s*/, '').trim();
        return `Escreva no papel: ${cleanTitle}.`;
    }
    
    // word_intro
    if (t.includes('word_intro') || t.includes('word intro') || t.includes('apresentação')) {
        const grego = fields.grego || '';
        const translit = fields.transliteracao || '';
        const pronuncia = fields.pronuncia || '';
        const significado = fields.significado || '';
        const etiologia = fields.etiologia || '';
        let narracao = `Conheça a letra ${translit || title.replace(/Word [Ii]ntro(?:duction)?[ —]*/, '').trim()} (${grego}). `;
        if (pronuncia) narracao += `Sua pronúncia é ${pronuncia}. `;
        if (significado) narracao += `Significa ${significado}. `;
        if (etiologia) narracao += etiologia.replace(/^📜\s*/, '');
        return narracao;
    }
    
    // alphabet_trace
    if (t.includes('alphabet_trace') || t.includes('alphabet trace') || t.includes('traço')) {
        const grego = fields.grego || '';
        return `Observe a ordem dos traços da letra ${grego || 'desta letra'}. Acompanhe a animação na tela.`;
    }
    
    // write_practice
    if (t.includes('write_practice') || t.includes('write practice') || t.includes('escrita')) {
        return fields.instrucao_escrita || `Agora pratique a escrita desta letra na sua apostila. Mantenha o ritmo: uma letra por clique.`;
    }
    
    // finalização
    if (stepType === 'FINALIZACAO') {
        return `Parabéns! Você concluiu esta lição.`;
    }
    
    return '';
}

function getInstrucaoEscrita(lines, startIdx, stepHeaderIdx) {
    // Procura "Instrução:" ou marcadores de linha
    for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('**Instrução:**')) {
            // Pega a próxima linha
            if (i + 1 < lines.length) {
                return lines[i + 1].replace(/["`]/g, '').trim();
            }
        }
        if (line.startsWith('```') && i + 1 < lines.length && i > stepHeaderIdx) {
            return lines[i + 1].replace(/["`]/g, '').trim();
        }
    }
    return '';
}

async function generateNarracaoForLesson(filePath) {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const fileName = path.basename(filePath);
    const lessonId = fileName.replace('.apostila.md', '');
    
    // Extract lesson metadata
    let lessonTitle = '';
    let lessonDesc = '';
    for (const line of lines) {
        if (line.startsWith('**Título:**')) lessonTitle = line.replace('**Título:**', '').trim();
        if (line.startsWith('**Descrição:**')) lessonDesc = line.replace('**Descrição:**', '').trim();
    }
    
    const narrationChunks = [];
    let currentStep = { number: 0, title: '', type: '', fields: {} };
    let existingNarration = '';
    let inNarrationBlock = false;
    let inContextBlock = false;
    let stepHeaderIdx = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Detect step header
        const stepMatch = line.match(STEP_HEADER_REGEX);
        if (stepMatch) {
            stepHeaderIdx = i;
            
            // Salva step anterior
            if (currentStep.number > 0) {
                let narration = existingNarration || generateNarrationForStep(currentStep.type, currentStep.title, currentStep.fields);
                if (narration) {
                    const markerType = currentStep.type;
                    narrationChunks.push({ marker: markerType, text: narration, step: currentStep.number, title: currentStep.title });
                }
            }
            
            currentStep = {
                number: parseInt(stepMatch[1], 10),
                title: stepMatch[2],
                type: detectStepType(line, stepMatch[2]),
                fields: {}
            };
            existingNarration = '';
            inNarrationBlock = false;
            inContextBlock = false;
            continue;
        }
        
        if (currentStep.number === 0) continue;
        
        // Detect narration field
        if (NARRATION_REGEX.test(line)) {
            inNarrationBlock = true;
            existingNarration = '';
            continue;
        }
        
        // Collect narration text
        if (inNarrationBlock) {
            if (line.startsWith('>') && line.includes('"')) {
                existingNarration = line.replace(/^>\s*"/, '').replace(/"$/, '').trim();
                inNarrationBlock = false;
            } else if (line.startsWith('>')) {
                existingNarration = line.replace(/^>\s*/, '').trim();
                inNarrationBlock = false;
            } else if (!line.trim() || line.startsWith('**') || line.startsWith('---')) {
                inNarrationBlock = false;
            }
            continue;
        }
        
        // Collect step fields
        const gregoMatch = line.match(GREGO_REGEX);
        if (gregoMatch) currentStep.fields.grego = gregoMatch[1].trim();
        
        const translitMatch = line.match(TRANSLIT_REGEX);
        if (translitMatch) currentStep.fields.transliteracao = translitMatch[1].trim();
        
        const pronMatch = line.match(PRONUNCIA_REGEX);
        if (pronMatch) currentStep.fields.pronuncia = pronMatch[1].trim();
        
        const signifMatch = line.match(SIGNIFICADO_REGEX);
        if (signifMatch) currentStep.fields.significado = signifMatch[1].trim();
        
        if (ETIOLOGIA_REGEX.test(line)) {
            currentStep.fields.etiologia = line.replace(/^- Etiologia:/, '').trim();
        }
        
        if (TRACADO_REGEX.test(line)) {
            currentStep.fields.tracado = true;
        }
        
        // Check for write practice instruction format
        if (line.startsWith('**Instrução:**') && i + 1 < lines.length) {
            currentStep.fields.instrucao_escrita = lines[i + 1].replace(/["`]/g, '').trim();
        }
    }
    
    // Salva último step
    if (currentStep.number > 0) {
        let narration = existingNarration || generateNarrationForStep(currentStep.type, currentStep.title, currentStep.fields);
        if (narration) {
            narrationChunks.push({ marker: currentStep.type, text: narration, step: currentStep.number, title: currentStep.title });
        }
    }
    
    if (narrationChunks.length === 0) {
        return null;
    }
    
    // Gera .narracao.md no formato [MARCADOR]
    let output = `# NARRAÇÃO GUIADA — ${lessonId}\n`;
    output += `# ${lessonTitle}\n\n`;
    output += `> Arquivo de áudio gerado a partir de ${fileName}\n`;
    output += `> Formato: texto corrido com marcadores [SEÇÃO] em linhas próprias\n\n`;
    
    // TITULO
    output += `[TITULO]\n${lessonTitle}\n\n`;
    
    // Steps
    for (const chunk of narrationChunks) {
        if (chunk.marker === 'INTRODUCAO') {
            output += `[INTRODUCAO]\n${chunk.text}\n\n`;
        } else if (chunk.marker === 'PAUSA') {
            output += `[PAUSA]\n${chunk.text}\n\n`;
        } else if (chunk.marker === 'DITADO') {
            output += `[DITADO]\n${chunk.text}\n\n`;
        } else if (chunk.marker === 'FINALIZACAO') {
            output += `[FINALIZACAO]\n${chunk.text}\n\n`;
        } else {
            // EXPOSICAO
            output += `[EXPOSICAO]\n${chunk.text}\n\n`;
        }
    }
    
    // FINALIZACAO
    output += `[FINALIZACAO]\n`;
    output += `Parabéns por completar ${lessonTitle}! Você concluiu esta lição da apostila Koiné.\n`;
    
    if (CHECK_MODE) {
        const totalMarkers = narrationChunks.length;
        console.log(`🔍 ${lessonId}: ${totalMarkers} marcadores, ${narrationChunks.filter(c => c.marker === 'EXPOSICAO').length} exposições, ${narrationChunks.filter(c => c.marker === 'DITADO').length} ditados`);
        return 0;
    }
    
    // Save .narracao.md
    const targetFileName = `${lessonId}.narracao.md`;
    const targetPath = path.join(TARGET_ROOT, targetFileName);
    await writeFile(targetPath, output, 'utf-8');
    console.log(`✅ ${targetFileName} (${narrationChunks.length} marcadores)`);
    return narrationChunks.length;
}

async function main() {
    console.log('🎤 Gerando arquivos .narracao.md a partir das apostilas...');
    console.log(CHECK_MODE ? '🔍 Modo de verificação' : '📝 Modo de escrita');
    if (SPECIFIC_LESSON) console.log(`📘 Lição: ${SPECIFIC_LESSON}`);
    console.log('');
    
    await import('node:fs').then((fs) => fs.promises.mkdir(TARGET_ROOT, { recursive: true }));
    
    const pattern = SPECIFIC_LESSON ? `${SPECIFIC_LESSON}.apostila.md` : '*.apostila.md';
    const files = await glob(pattern, { cwd: SOURCE_ROOT });
    
    if (files.length === 0) {
        console.error(`❌ Nenhum arquivo encontrado com padrão: ${pattern}`);
        return;
    }
    
    let totalMarkers = 0;
    let filesProcessed = 0;
    
    for (const file of files) {
        const filePath = path.join(SOURCE_ROOT, file);
        const markers = await generateNarracaoForLesson(filePath);
        if (markers !== null) {
            totalMarkers += markers;
            filesProcessed++;
        }
    }
    
    console.log('');
    console.log('📊 Resumo:');
    console.log(`- Lições processadas: ${filesProcessed}`);
    console.log(`- Marcadores totais: ${totalMarkers}`);
    console.log('');
    console.log(CHECK_MODE ? '✅ Verificação concluída!' : '✅ Narração gerada!');
}

main().catch(console.error);