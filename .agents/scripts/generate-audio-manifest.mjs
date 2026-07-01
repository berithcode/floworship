// .agent/scripts/generate-audio-manifest.mjs
// Gera public/audio/manifest.json mapeando steps da apostila → cues de áudio
// Uso: node .agent/scripts/generate-audio-manifest.mjs

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const AUDIO_ROOT = path.join(import.meta.dirname, '../../public/audio');
const APOSTILA_ROOT = path.join(import.meta.dirname, '../../WikiProjeto/Apostila');

async function countStepsInApostila(lessonId) {
    try {
        const content = await readFile(path.join(APOSTILA_ROOT, `${lessonId}.apostila.md`), 'utf-8');
        const stepMatches = [...content.matchAll(/^## .*Step (\d+):/gm)];
        return stepMatches.length;
    } catch {
        return 0;
    }
}

async function generateManifest() {
    const dirs = await readdir(AUDIO_ROOT, { withFileTypes: true });
    const lessonsManifest = {};

    for (const dir of dirs) {
        if (!dir.isDirectory()) continue;
        const lessonId = dir.name;
        if (!lessonId.startsWith('L')) continue;

        const cuePath = path.join(AUDIO_ROOT, lessonId, `${lessonId}.cues.json`);
        const mp3Path = path.join(AUDIO_ROOT, lessonId, `${lessonId}.mp3`);

        try {
            const [cueContent, stepCount] = await Promise.all([
                readFile(cuePath, 'utf-8'),
                countStepsInApostila(lessonId),
            ]);

            const cues = JSON.parse(cueContent);
            const file = `audio/${lessonId}/${lessonId}.mp3`;

            // Map cues to steps positionally (skip TITULO at start, FINALIZACAO at end)
            const stepCues = cues.cues.filter(c => c.marker !== 'TITULO' && c.marker !== 'FINALIZACAO');

            const stepsMap = {};
            for (let i = 0; i < stepCues.length && i < stepCount; i++) {
                const stepNum = i + 1;
                stepsMap[String(stepNum)] = {
                    start: stepCues[i].startTime,
                    end: stepCues[i].endTime,
                };
            }

            lessonsManifest[lessonId] = {
                file,
                duration: cues.duration,
                totalSteps: stepCount,
                steps: stepsMap,
            };

            console.log(`✅ ${lessonId}: ${Object.keys(stepsMap).length}/${stepCount} steps mapeados`);
        } catch (error) {
            console.error(`❌ ${lessonId}: ${error.message}`);
        }
    }

    const manifestPath = path.join(AUDIO_ROOT, 'manifest.json');
    await writeFile(manifestPath, JSON.stringify({
        version: '1.0',
        generatedAt: new Date().toISOString(),
        lessons: lessonsManifest,
    }, null, 2), 'utf-8');

    const totalSteps = Object.values(lessonsManifest).reduce((sum, l) => sum + Object.keys(l.steps).length, 0);
    console.log(`\n📊 Manifesto salvo: ${manifestPath}`);
    console.log(`- Lições: ${Object.keys(lessonsManifest).length}`);
    console.log(`- Steps com áudio: ${totalSteps}`);
}

generateManifest();