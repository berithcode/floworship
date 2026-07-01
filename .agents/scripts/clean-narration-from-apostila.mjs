// .agent/scripts/clean-narration-from-apostila.mjs (ajustado)
// Remove TODAS as marcações de **Narração (PT):** dos arquivos .apostila.md
// Preserva estruturas do step (## Step X: Título), **Exibição:**,
// campos de grego, e conteúdo pedagógico.
// Uso: node .agent/scripts/clean-narration-from-apostila.mjs [--check]

import { readFile, writeFile } from 'node:fs/promises';
import { glob } from 'glob';
import path from 'node:path';
import { argv } from 'node:process';

const CHECK_MODE = argv.includes('--check');
const ROOT = path.join(import.meta.dirname, '../../WikiProjeto/Apostila');

// Regex para capturar blocos de narração
const NARRATION_REGEX = /\*\*Narração \(PT\):\*\*\s*[>\s]*"[^\"]*"\s*$/gm;
const NARRATION_FIELD_REGEX = /\*\*Narração \(PT\):\*\*/;

async function cleanFile(filePath) {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    let cleanedLines = [];
    let changesMade = 0;
    let inNarrationBlock = false;

    // Mapeia índices de cabeçalhos de step
    const stepLineIndices = [];
    lines.forEach((line, index) => {
        if (line.startsWith('## ') && line.includes('Step')) {
            stepLineIndices.push(index);
        }
    });

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let pushLine = true;
        
        // Detecta início de bloco de narração (**Narração (PT):**)
        if (NARRATION_FIELD_REGEX.test(line)) {
            inNarrationBlock = true;
            pushLine = false;
            changesMade++;
            continue;
        }

        // Ignora linhas dentro do bloco de narração
        if (inNarrationBlock) {
            // Fim do bloco: próxima linha de step ou linha vazia significante
            const nextStepIndex = stepLineIndices.find(index => index > i);
            const isSignificantBlank = line.trim() === '' && i < lines.length - 1 && lines[i + 1].trim() !== '';
            
            if ((nextStepIndex && i === nextStepIndex - 1) || line.startsWith('---') || line.startsWith('## ') || isSignificantBlank) {
                inNarrationBlock = false;
            }
            pushLine = false;
            changesMade++;
            continue;
        }
        
        cleanedLines.push(line);
    }

    // Remove linhas vazias duplicadas resultantes da remoção
    const finalCleanedLines = [];
    let lastLineWasEmpty = false;
    for (const line of cleanedLines) {
        if (line.trim() === '') {
            if (!lastLineWasEmpty) {
                finalCleanedLines.push(line);
                lastLineWasEmpty = true;
            }
        } else {
            finalCleanedLines.push(line);
            lastLineWasEmpty = false;
        }
    }

    if (changesMade > 0) {
        const cleanedContent = finalCleanedLines.join('\n');
        if (!CHECK_MODE) {
            await writeFile(filePath, cleanedContent, 'utf-8');
            console.log(`✅ Limpo: ${path.relative(ROOT, filePath)} (${changesMade} alterações)`);
        } else {
            console.log(`🔍 Marcações encontradas: ${path.relative(ROOT, filePath)} (${changesMade} ocorrências)`);
        }
        return changesMade;
    }
    
    return 0;
}

async function main() {
    console.log('🧹 Limpando marcações de narração dos arquivos .apostila.md...');
    console.log(CHECK_MODE ? '🔍 Modo de verificação (sem alterar arquivos)' : '📝 Modo de escrita');
    console.log('');

    // Encontra todos os arquivos .apostila.md na pasta Apostila
    const files = await glob('**/*.apostila.md', { cwd: ROOT });
    let totalChanges = 0;
    let filesProcessed = 0;
    let filesWithChanges = 0;

    await Promise.all(
        files.map(async (file) => {
            const filePath = path.join(ROOT, file);
            try {
                const changes = await cleanFile(filePath);
                totalChanges += changes;
                if (changes > 0) filesWithChanges++;
                filesProcessed++;
            } catch (error) {
                console.error(`❌ Erro ao processar ${file}: ${error.message}`);
            }
        })
    );

    console.log('');
    console.log('📊 Resumo:');
    console.log(`- Arquivos processados: ${filesProcessed}`);
    console.log(`- Arquivos alterados: ${filesWithChanges}`);
    console.log(`- Marcações removidas: ${totalChanges}`);
    console.log('');
    console.log(CHECK_MODE ? '✅ Verificação concluída!' : '✅ Limpeza concluída!');
}

main().catch(console.error);