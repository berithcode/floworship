#!/usr/bin/env node
/**
 * check-apostila-consistency.mjs
 * Verifica consistência entre .apostila.md e _apostila.ts para uma lição
 *
 * Uso:
 *   node .agent/scripts/check-apostila-consistency.mjs L01
 *   node .agent/scripts/check-apostila-consistency.mjs --all
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const APOSTILA_DIR = resolve(process.cwd(), 'WikiProjeto', 'Apostila');
const SRC_DIR = resolve(process.cwd(), 'src', 'content', 'apostila');

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes('--all')) return { mode: 'all' };
  if (args.length > 0) return { mode: 'single', lessonId: args[0] };
  return { mode: 'single', lessonId: 'L01' };
}

function extractStepsFromMd(content) {
  const steps = [];
  const stepRegex = /^## (?:🔤|🅰️|🅱️|🅲️|🅳️|🅴️|🖼️|✍️|🧠|🎉|🏁| step)?\s*(\d+)[^\n]*\n/gmi;
  const lines = content.split('\n');

  let currentStep = null;
  for (const line of lines) {
    // Match step headers: "## Step N: ..." or "## N: ..." or "## Emoji Step N: ..."
    const stepMatch = line.match(/^## (?:.*?Step\s+)?(\d+)[^:]*:\s*(.+)/i)
      || line.match(/^## (\d+)\.\s*(.+)/);

    if (stepMatch) {
      if (currentStep) steps.push(currentStep);
      currentStep = {
        number: parseInt(stepMatch[1]),
        title: stepMatch[2].trim(),
        hasGreek: false,
        hasRepetitions: false,
        repetitions: 0,
        type: detectType(stepMatch[2]),
      };
    }

    if (currentStep) {
      // Check for Greek characters
      if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(line)) {
        currentStep.hasGreek = true;
      }
      // Check for repetition count
      const repMatch = line.match(/(\d+)\s*vezes?/i) || line.match(/×\s*(\d+)/);
      if (repMatch) {
        currentStep.hasRepetitions = true;
        currentStep.repetitions = parseInt(repMatch[1]);
      }
    }
  }
  if (currentStep) steps.push(currentStep);
  return steps;
}

function detectType(title) {
  const t = title.toLowerCase();
  if (t.includes('word intro') || t.includes('word_intro') || t.includes('palavra')) return 'word_intro';
  if (t.includes('alphabet trace') || t.includes('alphabet_trace') || t.includes('traço') || t.includes('trace')) return 'alphabet_trace';
  if (t.includes('write') || t.includes('escrita') || t.includes('prática')) return 'write_practice';
  if (t.includes('dictation') || t.includes('ditado')) return 'dictation';
  if (t.includes('read') || t.includes('leia')) return 'read_aloud';
  if (t.includes('pause') || t.includes('revisão')) return 'pause';
  if (t === 'intro') return 'intro';
  if (t.includes('abertura')) return 'intro';
  return 'unknown';
}

function extractStepsFromTs(content) {
  const steps = [];
  const stepRegex = /id:\s*['"]apostila-(\w+)-S(\d+)['"]/g;
  let match;

  while ((match = stepRegex.exec(content)) !== null) {
    const lessonId = match[1];
    const stepNum = parseInt(match[2]);

    // Find the type for this step
    const stepBlock = content.substring(match.index, match.index + 500);
    const typeMatch = stepBlock.match(/type:\s*['"](\w+)['"]/);
    const type = typeMatch ? typeMatch[1] : 'unknown';

    // Find writeRepetitions
    const repMatch = stepBlock.match(/writeRepetitions:\s*(\d+)/);
    const repetitions = repMatch ? parseInt(repMatch[1]) : 0;

    // Check for Greek in greekForm
    const greekMatch = stepBlock.match(/greekForm:\s*['"]([^'"]*)['"]/);
    const hasGreek = greekMatch ? /[\u0370-\u03FF\u1F00-\u1FFF]/.test(greekMatch[1]) : false;

    steps.push({
      number: stepNum,
      id: `apostila-${lessonId}-S${String(stepNum).padStart(2, '0')}`,
      type,
      hasGreek,
      hasRepetitions: repetitions > 0,
      repetitions,
    });
  }

  return steps;
}

function compareSteps(mdSteps, tsSteps, lessonId) {
  const issues = [];
  const mdStepCount = mdSteps.length;
  const tsStepCount = tsSteps.length;

  if (mdStepCount !== tsStepCount) {
    issues.push({
      type: 'COUNT_MISMATCH',
      message: `Número de steps: MD=${mdStepCount}, TS=${tsStepCount}`,
    });
  }

  // Compare by position
  const maxSteps = Math.max(mdStepCount, tsStepCount);
  for (let i = 0; i < maxSteps; i++) {
    const md = mdSteps[i];
    const ts = tsSteps[i];

    if (!md) {
      issues.push({ type: 'MISSING_IN_MD', message: `Step ${i + 1} existe no TS mas não no MD` });
      continue;
    }
    if (!ts) {
      issues.push({ type: 'MISSING_IN_TS', message: `Step ${i + 1} existe no MD mas não no TS` });
      continue;
    }

    // Type match
    if (md.type !== ts.type && md.type !== 'unknown') {
      issues.push({
        type: 'TYPE_MISMATCH',
        message: `Step ${i + 1}: MD type="${md.type}" vs TS type="${ts.type}"`,
      });
    }

    // Greek match
    if (md.hasGreek !== ts.hasGreek) {
      issues.push({
        type: 'GREEK_MISMATCH',
        message: `Step ${i + 1}: MD hasGreek=${md.hasGreek} vs TS hasGreek=${ts.hasGreek}`,
      });
    }

    // Repetitions match
    if (md.hasRepetitions && ts.hasRepetitions && md.repetitions !== ts.repetitions) {
      issues.push({
        type: 'REPETITION_MISMATCH',
        message: `Step ${i + 1}: MD rep=${md.repetitions} vs TS rep=${ts.repetitions}`,
      });
    }
  }

  return issues;
}

function checkMetadataConsistency(mdContent, tsContent, lessonId) {
  const issues = [];

  // Extract XP from MD
  const mdXpMatch = mdContent.match(/\*\*XP:\*\*\s*(\d+)/);
  const mdXp = mdXpMatch ? parseInt(mdXpMatch[1]) : null;

  // Extract XP from TS
  const tsXpMatch = tsContent.match(/xpReward:\s*(\d+)/);
  const tsXp = tsXpMatch ? parseInt(tsXpMatch[1]) : null;

  if (mdXp !== null && tsXp !== null && mdXp !== tsXp) {
    issues.push({ type: 'XP_MISMATCH', message: `XP: MD=${mdXp} vs TS=${tsXp}` });
  }

  // Extract page from MD
  const mdPageMatch = mdContent.match(/\*\*Página:\*\*\s*(\d+)/);
  const mdPage = mdPageMatch ? parseInt(mdPageMatch[1]) : null;

  // Extract page from TS
  const tsPageMatch = tsContent.match(/apostilaPdfPage:\s*(\d+)/);
  const tsPage = tsPageMatch ? parseInt(tsPageMatch[1]) : null;

  if (mdPage !== null && tsPage !== null && mdPage !== tsPage) {
    issues.push({ type: 'PAGE_MISMATCH', message: `Página: MD=${mdPage} vs TS=${tsPage}` });
  }

  return issues;
}

function main() {
  const { mode, lessonId } = parseArgs();
  const lessons = mode === 'all'
    ? readdirSync(APOSTILA_DIR).filter(f => f.endsWith('_apostila.ts')).map(f => f.replace('_apostila.ts', ''))
    : [lessonId];

  let totalIssues = 0;

  for (const id of lessons) {
    console.log(`\n=== Verificando consistência: ${id} ===`);

    const mdFile = join(APOSTILA_DIR, `${id}.apostila.md`);
    const tsFile = join(APOSTILA_DIR, `${id}_apostila.ts`);

    if (!existsSync(mdFile)) {
      console.log(`  ⚠ MD não encontrado: ${mdFile}`);
      continue;
    }
    if (!existsSync(tsFile)) {
      console.log(`  ⚠ TS não encontrado: ${tsFile}`);
      continue;
    }

    const mdContent = readFileSync(mdFile, 'utf-8');
    const tsContent = readFileSync(tsFile, 'utf-8');

    const mdSteps = extractStepsFromMd(mdContent);
    const tsSteps = extractStepsFromTs(tsContent);

    console.log(`  Steps no MD: ${mdSteps.length}`);
    console.log(`  Steps no TS: ${tsSteps.length}`);

    const stepIssues = compareSteps(mdSteps, tsSteps, id);
    const metaIssues = checkMetadataConsistency(mdContent, tsContent, id);
    const allIssues = [...metaIssues, ...stepIssues];

    if (allIssues.length === 0) {
      console.log(`  ✅ Consistente! Nenhuma divergência encontrada.`);
    } else {
      for (const issue of allIssues) {
        console.log(`  ❌ [${issue.type}] ${issue.message}`);
      }
      totalIssues += allIssues.length;
    }
  }

  if (totalIssues > 0) {
    console.log(`\n❌ Total de divergências: ${totalIssues}`);
    process.exit(1);
  } else {
    console.log(`\n✅ Todos os arquivos estão consistentes!`);
  }
}

main();
