# 🎮 Neon Tetris - Guia Rápido para Windows

## ⚡ Método Rápido (Recomendado)

### Passo 1: Instalar Node.js
1. Baixe o Node.js em: https://nodejs.org/
2. Instale a versão LTS (recomendada)
3. Reinicie o computador após instalar

### Passo 2: Baixar o Projeto
1. Extraia o projeto em uma pasta (ex: `C:\NeonTetris`)
2. **IMPORTANTE**: Não extraia em `C:\Windows\System32` ou outras pastas do sistema!

### Passo 3: Executar o Build
1. Abra a pasta do projeto
2. **Duplo clique** no arquivo `build-windows.bat`
3. Aguarde o processo completar (pode demorar alguns minutos)
4. O executável estará na pasta `electron\release\`

---

## 🔧 Método Manual (Alternativo)

Se o script automático não funcionar, siga estes passos:

### 1. Abrir Terminal na Pasta do Projeto
```cmd
# Navegue até a pasta do projeto
cd C:\Caminho\Para\NeonTetris
```

### 2. Instalar Dependências
```cmd
npm install
```

### 3. Build do Projeto Web
```cmd
npm run build
```

### 4. Configurar Electron
```cmd
cd electron
npm install
```

### 5. Copiar Arquivos
```cmd
xcopy /E /I ..\dist dist
```

### 6. Gerar Executável
```cmd
npm run build:win
```

---

## ❌ Problemas Comuns

### Erro: "Could not read package.json"
**Causa**: Você está executando o script na pasta errada

**Solução**:
1. Navegue até a pasta do projeto primeiro:
   ```cmd
   cd C:\Caminho\Para\NeonTetris
   ```
2. Depois execute o script:
   ```cmd
   build-windows.bat
   ```

### Erro: "Node.js não encontrado"
**Causa**: Node.js não está instalado ou não está no PATH

**Solução**:
1. Instale o Node.js: https://nodejs.org/
2. Reinicie o computador
3. Tente novamente

### Erro: "npm install failed"
**Causa**: Problema de conexão ou permissões

**Solução**:
1. Verifique sua conexão com a internet
2. Execute o terminal como administrador
3. Tente novamente

### Erro: "electron-builder failed"
**Causa**: Problema ao gerar o executável

**Solução**:
1. Execute como administrador
2. Desative temporariamente o antivírus
3. Tente o método alternativo:
   ```cmd
   cd electron
   npx electron-packager . "Neon Tetris" --platform=win32 --arch=x64 --out=release --overwrite
   ```

---

## 📋 Checklist Antes de Começar

- [ ] Node.js instalado (versão 18 ou superior)
- [ ] Projeto extraído em uma pasta normal (não em System32)
- [ ] Conexão com internet ativa
- [ ] Espaço em disco suficiente (~500MB)
- [ ] Antivírus não está bloqueando (ou adicione exceção)

---

## 🎯 Onde Encontrar o Executável

Após o build completar com sucesso:

```
NeonTetris\
└── electron\
    └── release\
        ├── Neon Tetris Setup 1.0.0.exe  (Instalador)
        └── Neon Tetris 1.0.0.exe        (Portátil)
```

---

## 🚀 Executando o Jogo

### Opção 1: Versão Portátil
1. Vá até `electron\release\`
2. Execute `Neon Tetris 1.0.0.exe`
3. Jogue!

### Opção 2: Instalador
1. Vá até `electron\release\`
2. Execute `Neon Tetris Setup 1.0.0.exe`
3. Siga as instruções de instalação
4. Execute o jogo pelo menu Iniciar ou atalho

---

## 🎮 Controles do Jogo

- **← →** Mover peça
- **↑** Rotacionar
- **↓** Descer mais rápido
- **Espaço** Cair instantaneamente
- **P** Pausar
- **M** Ligar/Desligar som
- **F11** Tela cheia

---

## 📞 Precisa de Ajuda?

Se ainda tiver problemas:

1. Verifique se está na pasta correta do projeto
2. Execute o terminal como administrador
3. Verifique se o Node.js está instalado: `node --version`
4. Leia o arquivo `GUIA-INSTALACAO.md` para mais detalhes

---

## 💡 Dica Importante

**NUNCA execute scripts em pastas do sistema como:**
- ❌ `C:\Windows\System32`
- ❌ `C:\Windows`
- ❌ `C:\Program Files`

**Sempre use uma pasta normal como:**
- ✅ `C:\NeonTetris`
- ✅ `C:\Users\SeuNome\Projetos\NeonTetris`
- ✅ `D:\Jogos\NeonTetris`

---

**Bom jogo!** 🎮✨
