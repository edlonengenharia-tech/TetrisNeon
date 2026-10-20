# NEON TETRIS - GUIA SIMPLES

## COMO JOGAR (3 OPÇÕES)

### Opção 1: JOGAR NO NAVEGADOR (MAIS FÁCIL)
1. Duplo clique em: `jogar.bat`
2. O jogo abre automaticamente!

### Opção 2: CRIAR .EXE PARA WINDOWS
1. Duplo clique em: `build-windows.bat`
2. Aguarde o build (pode demorar 2-3 minutos)
3. O executável estará em: `electron\release\`

### Opção 3: CRIAR APK PARA ANDROID
1. Duplo clique em: `build-android.bat`
2. Siga as instruções na tela

---

## ANTES DE COMEÇAR

### Instale o Node.js:
1. Acesse: https://nodejs.org/
2. Baixe a versão LTS (botão verde)
3. Instale e reinicie o computador

### IMPORTANTE:
- Execute os scripts NA PASTA DO PROJETO
- NÃO execute em C:\Windows\System32
- Exemplo correto: C:\NeonTetris

---

## PROBLEMAS COMUNS

### "Node.js not found"
- Instale o Node.js: https://nodejs.org/
- Reinicie o computador

### "package.json not found"
- Você está na pasta errada
- Navegue até a pasta do projeto primeiro

### "Build failed" (Windows)
- Execute como Administrador
- Desative o antivírus temporariamente
- Verifique espaço em disco

---

## CONTROLES DO JOGO

- ← → : Mover peça
- ↑ : Rotacionar
- ↓ : Descer mais rápido
- ESPAÇO : Cair instantaneamente
- P : Pausar
- M : Ligar/Desligar som
- ENTER : Novo jogo

---

## ARQUIVOS

- jogar.bat = Abrir no navegador
- start-dev.bat = Servidor de desenvolvimento
- build-web.bat = Build versão web
- build-windows.bat = Criar .exe Windows
- build-android.bat = Setup Android

---

## APÓS BUILD WINDOWS

Vá até: `electron\release\`

Arquivos criados:
- NeonTetris-Portable.exe (versão portátil)
- Neon Tetris Setup 1.0.0.exe (instalador)

Execute o arquivo .exe para jogar!

---

DIVIRTA-SE! 🎮
