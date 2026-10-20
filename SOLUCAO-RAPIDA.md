# NEON TETRIS - SOLUÇÃO RÁPIDA

## PROBLEMA RESOLVIDO ✅

O problema da **janela vazia** foi causado por caminhos absolutos nos arquivos HTML.
Já foi corrigido! Agora o jogo funciona no Electron.

## COMO JOGAR (3 OPÇÕES)

### Opção 1: Jogar no Navegador (MAIS FÁCIL)
1. Duplo clique em: `jogar.bat`
2. O jogo abre no navegador
3. Divirta-se!

### Opção 2: Testar o Electron
1. Duplo clique em: `test-electron.bat`
2. Aguarde abrir a janela do jogo
3. Se funcionar, está tudo certo!

### Opção 3: Criar .EXE para Windows
1. Duplo clique em: `build-windows.bat`
2. Aguarde o build (2-5 minutos)
3. O executável estará em: `electron\release\NeonTetris-win32-x64\`
4. Execute: `NeonTetris.exe`

## SE AINDA NÃO FUNCIONAR

### Passo 1: Verificar arquivos
Duplo clique em: `verify-files.bat`

### Passo 2: Limpar e rebuild
```cmd
# Apagar pastas
rmdir /s /q dist
rmdir /s /q electron\dist
rmdir /s /q electron\release

# Rebuild
build-windows.bat
```

### Passo 3: Ver erros
1. Execute: `test-electron.bat`
2. Pressione: Ctrl+Shift+I
3. Veja os erros no console

## CONTROLES DO JOGO

- ← → : Mover peça
- ↑ : Rotacionar
- ↓ : Descer mais rápido
- ESPAÇO : Cair instantaneamente
- P : Pausar
- F11 : Tela cheia (no Electron)

## ARQUIVOS IMPORTANTES

- `jogar.bat` - Abrir no navegador
- `test-electron.bat` - Testar Electron
- `build-windows.bat` - Criar .exe
- `verify-files.bat` - Verificar arquivos
- `TROUBLESHOOTING.md` - Guia completo de problemas

## O QUE FOI CORRIGIDO

✅ Caminhos relativos no Vite (base: './')
✅ index.html simplificado
✅ Sons adicionados ao jogo
✅ Scripts de build corrigidos
✅ Verificação de arquivos criada

## PRECISA DE AJUDA?

1. Leia: `TROUBLESHOOTING.md`
2. Execute: `verify-files.bat`
3. Teste: `test-electron.bat`

---

**O jogo deve funcionar agora!** 🎮

Se ainda tiver problemas, execute `test-electron.bat` e pressione Ctrl+Shift+I para ver os erros.
