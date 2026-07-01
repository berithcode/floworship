// .agent/scripts/generate-apostila-audio.mjs
// Gera áudios individuais para cada step da apostila (L01-L20)
// usando Piper TTS, SSML para grego, e transliteração fonética.
//
// Uso:
// node .agent/scripts/generate-apostila-audio.mjs --lesson L01
// node .agent/scripts/generate-apostila-audio.mjs --lesson L01 --step 3
// node .agent/scripts/generate-apostila-audio.mjs --check

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { glob } from 'glob';
import path from 'node:path';
import { argv } from 'node:process';
import { execSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';

const streamPipeline = promisify(pipeline);

const CHECK_MODE = argv.includes('--check');
const SPECIFIC_LESSON = argv.find(arg => arg.startsWith('--lesson='))?.split('=')[1];
const SPECIFIC_STEP = argv.find(arg => arg.startsWith('--step='))?.split('=')[1];

// Diretórios
const SOURCE_ROOT = path.join(import.meta.dirname, '../../WikiProjeto/Narração');
const OUTPUT_ROOT = path.join(import.meta.dirname, '../../public/audio/apostila');
const PIPER_BIN = path.join(import.meta.dirname, '../../WikiProjeto/Extruturador metodogico/Geração de audio piper/piper/piper.exe');
const PIPER_MODEL = path.join(import.meta.dirname, '../../WikiProjeto/Extruturador metodogico/Geração de audio piper/piper_voz/pt_BR-faber-medium.onnx');
const FFMPEG_BIN = 'ffmpeg'; // Assume que está no PATH

// Transliteração para grego (baseado no script existente)
const GREEK_LETTER_NAMES_PT = {
    "α": "alfa", "Α": "Alfa",
    "β": "beta", "Β": "Beta",
    "γ": "gama", "Γ": "Gama",
    "δ": "delta", "Δ": "Delta",
    "ε": "épsilon", "Ε": "Épsilon",
    "ζ": "zeta", "Ζ": "Zeta",
    "η": "eta", "Η": "Eta",
    "θ": "teta", "Θ": "Teta",
    "ι": "iota", "Ι": "Iota",
    "κ": "capa", "Κ": "Capa",
    "λ": "lambda", "Λ": "Lambda",
    "μ": "mi", "Μ": "Mi",
    "ν": "nu", "Ν": "Nu",
    "ξ": "xi", "Ξ": "Xi",
    "ο": "ômicron", "Ο": "Ômicron",
    "π": "pi", "Π": "Pi",
    "ρ": "rô", "Ρ": "Rô",
    "σ": "sigma", "ς": "sigma", "Σ": "Sigma",
    "τ": "tau", "Τ": "Tau",
    "υ": "ípsilon", "Υ": "Ípsilon",
    "φ": "fi", "Φ": "Fi",
    "χ": "chi", "Χ": "Chi",
    "ψ": "psi", "Ψ": "Psi",
    "ω": "ômega", "Ω": "Ômega",
};

const GREEK_WORDS_FONETICA = {
    "ἀγάπη": "agápe", "ἐγώ": "egó", "Ἰησοῦς": "Iesús",
    "λόγος": "logós", "θεός": "teós", "υἱός": "huiós",
    "ὁ": "ho", "ἡ": "he", "τὸ": "to",
    "τὸν": "ton", "καὶ": "caí", "ἐν": "en",
    "τῆς": "tes", "τῇ": "te", "ἦν": "en",
    "ἀρχῇ": "arjé", "πρὸς": "prós", "μονογενῆ": "monogené",
    "ἀνάστασις": "anástasis", "ζωή": "zoé", "εἰμί": "eimí",
    "εἶπεν": "êipen", "ἵνα": "hína", "ἰδού": "idú",
    "Ἐγώ": "Egó", "Εἰμι": "Eime", "Ἁγάπη": "Agápe",
    "Λόγος": "Logós", "Θεός": "Teós", "Υἱός": "Huiós",
    "Ἐν": "En", "Ἀρχῇ": "Arjé",
};

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function log(...args) {
    console.log('[generate-apostila-audio]', ...args);
}

function safetyTransliterate(text) {
    if (!text) return "";
    let result = text;
    
    // Substitui palavras gregas pela transliteração fonética
    for (const [greekWord, ptWord] of Object.entries(GREEK_WORDS_FONETICA)) {
        result = result.replace(new RegExp(greekWord, 'g'), ptWord);
    }
    
    // Substitui letras gregas isoladas (ex: "α" → "alfa")
    for (const [letter, name] of Object.entries(GREEK_LETTER_NAMES_PT)) {
        result = result.replace(new RegExp(`\\b${letter}\\b`, 'g'), name);
    }
    
    // Remove diacríticos gregos (para Piper TTS)
    return result
        .replace(/[\u0370-\u03ff\u1f00-\u1fff]/g, (char) => {
            const stripped = char.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return stripped in GREEK_LETTER_NAMES_PT ? GREEK_LETTER_NAMES_PT[stripped] : stripped;
        })
        .replace(/[\u0370-\u03ff\u1f00-\u1fff]/g, ''); // Remove sobras
}

function textToSSML(text) {
    let ssml = `<speak><p>${text}</p></speak>`;
    
    // Substitui palavras/letras gregas remanescentes por <say-as>
    return ssml.replace(/\[α-ωΑ-Ωἀ-ῼ]\\b/g, (match) => {
        const translit = GREEK_LETTER_NAMES_PT[match] || GREEK_WORDS_FONETICA[match] || match;
        return `<say-as interpret-as="characters">${translit}</say-as>`;
    });
}

function getLessonNumberFromFileName(fileName) {
    const match = fileName.match(/L(\d{2})/);
    return match ? parseInt(match[1], 10) : 0;
}

// ============================================================
// PIPELINE DE ÁUDIO
// ============================================================

async function ensureOutputDir(lessonNumber) {
    const lessonDir = path.join(OUTPUT_ROOT, `L${lessonNumber.toString().padStart(2, '0')}`);
    await mkdir(lessonDir, { recursive: true });
    return lessonDir;
}

async function generateAudioForStep(lessonNumber, stepNumber, narrationText, outputDir) {
    if (!narrationText || !narrationText.trim()) {
        log(`Step ${stepNumber} não possui narração. Pulando.`);
        return null;
    }

    const transliterated = safetyTransliterate(narrationText);
    const ssml = textToSSML(transliterated);
    const outputMp3 = path.join(outputDir, `Step${stepNumber.toString().padStart(2, '0')}.mp3`);

    if (CHECK_MODE) {
        log(`🔍 [CHECK] Step ${stepNumber}: "${narrationText.substring(0, 50)}..."`);
        return {
            step: stepNumber,
            text: narrationText,
            transliterated,
            ssml: ssml.substring(0, 200) + "...",
            outputMp3,
        };
    }

    log(`🎙️ Gerando áudio: Step ${stepNumber}...`);
    
    // Gera áudio com Piper TTS + SSML
    try {
        // Piper TTS usa texto puro (SSML não é suportado diretamente)
        // Portanto, usamos a transliteração fonética normalizada
        const tempWav = path.join(outputDir, `temp_step${stepNumber}.wav`);
        
        // Comando Piper
        const piperCmd = `
            "${PIPER_BIN}" 
            --model "${PIPER_MODEL}" 
            --output_file "${tempWav}" 
            --sentence_silence 0.5
        `;
        
        // Usa o texto transliterado diretamente (Piper não suporta SSML)
        const { stdout } = execSync(`echo "${transliterated}" | ${piperCmd}`, {
            shell: true,
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
            cwd: path.dirname(PIPER_BIN),
        });
        
        // Converte WAV → MP3 (64kbps)
        const ffmpegCmd = `
            "${FFMPEG_BIN}" -y -i "${tempWav}" 
            -codec:a libmp3lame -q:a 2 
            -b:a 64k "${outputMp3}"
        `;
        execSync(ffmpegCmd, { encoding: 'utf-8' });
        
        // Remove arquivo WAV temporário
        await import('node:fs/promises').then((fs) => fs.unlink(tempWav));
        
        log(`✅ Step ${stepNumber}: salvo em ${path.relative(OUTPUT_ROOT, outputMp3)}`);
        
        return {
            step: stepNumber,
            text: narrationText,
            duration: getAudioDuration(outputMp3),
            file: path.relative(OUTPUT_ROOT, outputMp3),
        };
    } catch (error) {
        log(`❌ Erro no Step ${stepNumber}: ${error.stderr || error.message}`);
        return null;
    }
}

function getAudioDuration(mp3Path) {
    try {
        const { stdout } = execSync(`
            "${FFMPEG_BIN}" -i "${mp3Path}" 2>&1 | 
            find "Duration"
        `, { encoding: 'utf-8', shell: true });
        
        const match = stdout.match(/Duration:\s*(\d+):(\d+):(\d+).(\d+)/);
        if (match) {
            const hours = parseInt(match[1], 10);
            const minutes = parseInt(match[2], 10);
            const seconds = parseInt(match[3], 10);
            return hours * 3600 + minutes * 60 + seconds;
        }
        return 0;
    } catch {
        return 0;
    }
}

async function processNarrationFile(narrationFilePath) {
    const content = await readFile(narrationFilePath, 'utf-8');
    const lessonNumber = getLessonNumberFromFileName(path.basename(narrationFilePath));
    const lessonDir = await ensureOutputDir(lessonNumber);
    const audioMetadata = [];
    
    const stepRegex = /## Step (\d+): (.+?)\n\*\*Narração \(PT\):\*\*\n> "(.+?)"/gs;
    let match;
    
    while ((match = stepRegex.exec(content)) !== null) {
        const stepNumber = parseInt(match[1], 10);
        const stepTitle = match[2];
        const narrationText = match[3].replace(/\\n/g, ' ').trim();
        
        // Pula se --step foi especificado e não é o step desejado
        if (SPECIFIC_STEP && stepNumber !== parseInt(SPECIFIC_STEP)) {
            continue;
        }
        
        const audioResult = await generateAudioForStep(lessonNumber, stepNumber, narrationText, lessonDir);
        if (audioResult) {
            audioMetadata.push({
                step: stepNumber,
                title: stepTitle,
                ...audioResult,
            });
        }
    }
    
    // Gera metadata.json
    const metadata = {
        lessonNumber,
        lessonId: `apostila-L${lessonNumber.toString().padStart(2, '0')}`,
        totalSteps: audioMetadata.length,
        steps: audioMetadata,
    };
    
    const metadataPath = path.join(lessonDir, 'metadata.json');
    if (!CHECK_MODE) {
        await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
        log(`✅ Metadata salvo: ${path.relative(OUTPUT_ROOT, metadataPath)}`);
    }
    
    return audioMetadata;
}

// ============================================================
// CLI
// ============================================================

async function main() {
    log('🔊 Gerador de Áudio para Apostila (Piper TTS + SSML)');
    log(CHECK_MODE ? '🔍 Modo de verificação (sem gerar áudios)' : '📝 Modo de geração');
    if (SPECIFIC_LESSON) {
        log(`📘 Lição específica: ${SPECIFIC_LESSON}`);
    }
    if (SPECIFIC_STEP) {
        log(`🎯 Step específico: ${SPECIFIC_STEP}`);
    }
    console.log('');
    
    // Verifica se Piper e FFmpeg estão disponíveis
    try {
        await Promise.all([
            import('node:fs/promises').then((fs) => fs.access(PIPER_BIN)),
            execSync(`${FFMPEG_BIN} -version`, { encoding: 'utf-8' }),
        ]);
    } catch (error) {
        log(`❌ Dependências não encontradas: ${error.message}`);
        log(`Certifique-se de que:
- Piper TTS está em: ${PIPER_BIN}
- FFmpeg está no PATH
- Modelo onnx está em: ${PIPER_MODEL}`);
        return;
    }
    
    // Encontra arquivos de narração
    const pattern = SPECIFIC_LESSON ? `L${SPECIFIC_LESSON.replace('L', '')}.narration.md` : '*.narration.md';
    const files = await glob(pattern, { cwd: SOURCE_ROOT });
    
    if (files.length === 0) {
        log(`❌ Nenhum arquivo .narration.md encontrado em ${SOURCE_ROOT}`);
        return;
    }
    
    let totalSteps = 0;
    let lessonsProcessed = 0;
    
    for (const file of files) {
        const filePath = path.join(SOURCE_ROOT, file);
        const lessonNumber = getLessonNumberFromFileName(file);
        
        if (!SPECIFIC_LESSON || file.startsWith(SPECIFIC_LESSON)) {
            log(`📖 Processando: ${file}...`);
            try {
                const steps = await processNarrationFile(filePath);
                totalSteps += steps.length;
                lessonsProcessed++;
            } catch (error) {
                log(`❌ Erro em ${file}: ${error.message}`);
            }
        }
    }
    
    console.log('');
    console.log('📊 Resumo:');
    console.log(`- Lições processadas: ${lessonsProcessed}`);
    console.log(`- Steps de áudio gerados: ${totalSteps}`);
    console.log('');
    console.log(CHECK_MODE ? '✅ Verificação concluída!' : '✅ Geração de áudio concluída!');
}

main().catch(console.error);