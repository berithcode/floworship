# Plano: Modo Transliterado no Leitor NT

## Objetivo
Adicionar um quinto modo de leitura ("Transliteração") que exibe:
- **Linha 1**: Texto grego
- **Linha 2**: Transliteração romanizada (via `strong.json:translit`)
- **Linha 3**: Tradução PT (opcional, toggle)

## Fontes de Dados
- **`strong.json`**: 5.624 entradas com campo `translit` (ex: `"translit": "agapao"`)
- **`nt_interlinear.json`**: Já contém transliterações para substantivos próprios (`glossSource: "translit"`)
- **Chave de busca**: `strongs_id` (ex: `G26`) → `strong.json[id].translit`

## Arquivos a Modificar

### 1. `src/features/reader/ntService.ts`
- Criar `Map<string, string>` para cache de transliterações (`translitByStrongsId`)
- Adicionar método `getTransliteration(strongsId: string): string | null`
- Modificar `getInterlinearTokens()` para incluir `translitPT` nos tokens quando disponível

### 2. `src/ui/pages/reader/components/InterlinearToken.tsx`
- Adicionar `translitPT?: string` em `InterlinearTokenData`
- Adicionar prop `showTranslit?: boolean`
- Quando `showTranslit` e `translitPT` existirem, exibir abaixo do grego:
  ```tsx
  <span className="text-[10px] text-secondary/70 italic font-medium">
    {token.translitPT}
  </span>
  ```

### 3. `src/ui/pages/reader/components/InterlinearVerse.tsx`
- Adicionar prop `showTranslit?: boolean`
- Passar para `InterlinearToken`

### 4. `src/ui/pages/reader/components/ReaderModeSelector.tsx`
- Adicionar `'transliteration'` ao tipo `ReaderMode`
- Adicionar config:
  ```ts
  transliteration: {
    label: 'Transliteração',
    shortLabel: 'Translit',
    icon: '🔤',
    description: 'Grego + transliteração romanizada',
  }
  ```

### 5. `src/ui/pages/reader/ReaderPage.tsx`
- Adicionar `showTranslit = readerMode === 'transliteration'`
- Passar para `InterlinearVerse`
- Ajustar lógica de `showGloss` e `showLemma` para o novo modo

## Fluxo de Dados
```
nt_text.json (tokens com strongs_id)
    ↓
ntService.getInterlinearTokens()
    ↓
Busca strong.json[strongs_id] → translit
    ↓
InterlinearToken { token, glossPT, translitPT }
    ↓
InterlinearToken.tsx renderiza:
  ἀγαπῶ     (grego)
  agapō      (transliteração)
  amo        (gloss PT)
```

## UX do Modo Transliterado
- **Visual**: Cards com 3 linhas por token (grego → translit → PT)
- **Fonte translit**: `text-[10px]`, `italic`, `text-secondary/70`
- **Legenda**: Mostrar descrição do modo no header
- **Fallback**: Se não houver transliteração, mostrar apenas grego + PT

## Verificação
1. Abrir Leitor → Selecionar João 1
2. Mudar para modo "Transliteração"
3. Verificar: Ἐν → en → em / ἀρχῇ → archē → princípio
4. Testar com substantivos próprios: Θεόν → theon → Deus
5. Build: `vite build` → `npx cap sync android` → `./gradlew assembleDebug`
6. Instalar APK no dispositivo
7. Commit + push
