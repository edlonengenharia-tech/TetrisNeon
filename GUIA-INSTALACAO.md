# 🚀 Guia Rápido de Instalação

## 📱 Como criar o APK para Android

### Método 1: Usando o script automático (Linux/Mac)

```bash
chmod +x build-android.sh
./build-android.sh
```

### Método 2: Manual (Windows/Linux/Mac)

```bash
# 1. Instalar Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Inicializar
npx cap init "Neon Tetris" "com.neontetris.app" --web-dir=dist

# 3. Adicionar Android
npx cap add android

# 4. Sincronizar
npx cap sync

# 5. Abrir no Android Studio
npx cap open android
```

### No Android Studio:
1. Aguarde o Gradle sincronizar (pode demorar na primeira vez)
2. Vá em: **Build > Build Bundle(s) / APK(s) > Build APK(s)**
3. O APK estará em: `android/app/build/outputs/apk/debug/app-debug.apk`
4. Transfira para o celular e instale

### Para APK de produção (assinado):
1. No Android Studio: **Build > Generate Signed Bundle / APK**
2. Selecione "APK"
3. Crie uma nova keystore ou use uma existente
4. Selecione "release"
5. O APK assinado estará pronto para distribuição

---

## 🖥️ Como criar o .EXE para Windows

### Método 1: Usando o script automático (Windows)

```cmd
build-windows.bat
```

### Método 2: Manual (Windows/Linux/Mac)

```bash
# 1. Build do projeto web
npm run build

# 2. Ir para pasta do Electron
cd electron

# 3. Instalar dependências
npm install

# 4. Copiar arquivos web (Windows)
xcopy /E /I ..\dist dist

# Ou (Linux/Mac)
cp -r ../dist ./dist

# 5. Build do executável
npm run build:win
```

### O resultado estará em:
- `electron/release/Neon Tetris Setup X.X.X.exe` - Instalador
- `electron/release/Neon Tetris X.X.X.exe` - Versão portátil

---

## 🌐 Como rodar na Web

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# O site estará na pasta dist/
# Basta abrir dist/index.html no navegador
```

---

## 📋 Pré-requisitos

### Para Android:
- ✅ Node.js 18+ instalado
- ✅ Android Studio instalado
- ✅ SDK Android configurado
- ✅ Java JDK 17+ instalado
- ✅ Variável de ambiente ANDROID_HOME configurada

### Para Windows:
- ✅ Node.js 18+ instalado
- ✅ Windows 10 ou 11

### Para Web:
- ✅ Node.js 18+ instalado
- ✅ Navegador moderno (Chrome, Firefox, Edge, Safari)

---

## 🔧 Troubleshooting

### Android:
- **Erro de Gradle**: Verifique se o Android Studio está atualizado
- **SDK não encontrado**: Configure ANDROID_HOME nas variáveis de ambiente
- **Build lento**: Na primeira vez, o Gradle baixa muitas dependências

### Windows:
- **Erro no electron-builder**: Execute o terminal como administrador
- **Antivírus bloqueando**: Adicione exceção para a pasta do projeto
- **Ícone não aparece**: Crie um arquivo icon.png na pasta dist/

### Web:
- **Sons não tocam**: Alguns navegadores bloqueiam áudio até interação do usuário
- **Layout quebrado**: Use um navegador moderno e atualizado

---

## 📦 Tamanhos aproximados

- **Web**: ~150 KB (compactado)
- **Android APK**: ~15-20 MB
- **Windows EXE**: ~80-100 MB

---

## 🎮 Testando

### Web:
```bash
npm run dev
# Abra http://localhost:3000
```

### Android:
- Instale o APK no celular
- Toque para jogar
- Use os botões na tela

### Windows:
- Execute o .exe
- Use teclado para jogar
- F11 para tela cheia

---

## 📞 Suporte

Se tiver problemas:
1. Verifique se todos os pré-requisitos estão instalados
2. Leia o README.md completo
3. Verifique as mensagens de erro no terminal

---

**Bom jogo!** 🎮✨
