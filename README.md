# 🎮 Neon Tetris

Um jogo de Tetris com visual neon retrô, disponível para Web, Android e Windows!

## 🌟 Funcionalidades

- 🎨 Visual neon com efeitos de brilho e partículas
- 🔊 Sons sintetizados (Web Audio API)
- 📱 Interface responsiva (mobile e desktop)
- 🎮 Controles touch para mobile
- ⌨️ Controles de teclado para desktop
- 🏆 Sistema de High Score (salvo localmente)
- 👻 Ghost piece (preview de onde a peça vai cair)
- 📊 Níveis progressivos com velocidade crescente
- ⏸️ Pausa e controle de som

## 🎮 Controles

### Teclado (Desktop)
- `←` `→` - Mover peça
- `↑` - Rotacionar
- `↓` - Soft drop (descer mais rápido)
- `Espaço` - Hard drop (cair instantaneamente)
- `P` - Pausar/Retomar
- `M` - Ligar/Desligar som
- `Enter` - Iniciar novo jogo

### Touch (Mobile)
- Botões na tela para todas as ações
- Botão DROP para hard drop

## 📦 Como Compilar

### 🌐 Web (Browser)

```bash
# Instalar dependências
npm install

# Build para web
npm run build

# O resultado estará na pasta dist/
# Basta abrir dist/index.html no navegador
```

### 📱 Android (APK)

#### Pré-requisitos:
- Node.js 18+
- Android Studio instalado
- SDK Android configurado
- Java JDK 17+

#### Passos:

```bash
# 1. Instalar dependências do projeto web
npm install

# 2. Build do projeto web
npm run build

# 3. Instalar Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android

# 4. Inicializar Capacitor
npx cap init "Neon Tetris" "com.neontetris.app" --web-dir=dist

# 5. Adicionar plataforma Android
npx cap add android

# 6. Sincronizar arquivos web com Android
npx cap sync android

# 7. Abrir no Android Studio
npx cap open android

# 8. No Android Studio:
#    - Aguarde o Gradle sincronizar
#    - Build > Build Bundle(s) / APK(s) > Build APK(s)
#    - O APK estará em: android/app/build/outputs/apk/debug/
```

#### Para gerar APK de release (assinado):
```bash
# No Android Studio:
# Build > Generate Signed Bundle / APK
# Crie uma keystore ou use uma existente
# Selecione "release" como build variant
```

### 🖥️ Windows (.exe)

#### Pré-requisitos:
- Node.js 18+
- Windows 10/11

#### Passos:

```bash
# 1. Instalar dependências do projeto web
npm install

# 2. Build do projeto web
npm run build

# 3. Ir para a pasta do Electron
cd electron

# 4. Instalar dependências do Electron
npm install

# 5. Copiar o build para a pasta do Electron
# (Windows)
xcopy /E /I ..\dist dist

# (Linux/Mac)
cp -r ../dist ./dist

# 6. Build do executável Windows
npm run build:win

# O instalador estará em: electron/release/
# - Neon Tetris Setup X.X.X.exe (instalador)
# - Neon Tetris X.X.X.exe (portátil)
```

#### Alternativa com electron-packager (mais simples):
```bash
cd electron
npm install
npx electron-packager . "Neon Tetris" --platform=win32 --arch=x64 --out=release --overwrite
```

## 🔧 Estrutura do Projeto

```
neon-tetris/
├── src/
│   ├── App.tsx          # Componente principal do jogo
│   ├── sounds.ts        # Gerenciador de sons (Web Audio API)
│   ├── index.css        # Estilos com efeitos neon
│   └── main.tsx         # Entry point React
├── electron/
│   ├── main.js          # Processo principal do Electron
│   ├── preload.js       # Script de preload do Electron
│   └── package.json     # Configuração do Electron
├── capacitor.config.json # Configuração do Capacitor (Android)
├── index.html           # HTML principal
├── package.json         # Dependências do projeto
└── README.md            # Este arquivo
```

## 🎵 Sons

O jogo usa a Web Audio API para gerar sons sintetizados em tempo real:
- Som de movimento
- Som de rotação
- Som de drop
- Som de limpar linhas
- Som especial para Tetris (4 linhas)
- Som de level up
- Som de game over
- Som de início/pausa

## 🎨 Cores das Peças

- **I** - Cyan (#00ffff)
- **O** - Amarelo (#ffff00)
- **T** - Magenta (#ff00ff)
- **S** - Verde (#00ff00)
- **Z** - Vermelho (#ff0000)
- **J** - Azul (#0066ff)
- **L** - Laranja (#ff6600)

## 📊 Sistema de Pontuação

- 1 linha = 100 × nível
- 2 linhas = 300 × nível
- 3 linhas = 500 × nível
- 4 linhas (Tetris!) = 800 × nível
- Hard drop = 2 pontos por célula caída

## 🚀 Deploy

### Web (Vercel/Netlify)
```bash
npm run build
# Faça upload da pasta dist/
```

### PWA (Progressive Web App)
Para transformar em PWA, adicione um manifest.json e service worker.

## 📝 Licença

MIT License - Livre para uso pessoal e comercial.

## 🙏 Créditos

Desenvolvido com React, TypeScript, Tailwind CSS, Capacitor e Electron.

---

**Divirta-se jogando!** 🎮✨
