# SOLUÇÃO: Electron-Packager "Ok to proceed? (y)"

## PROBLEMA

Quando o script pergunta:
```
Need to install the following packages:
electron-packager@17.1.2
Ok to proceed? (y)
```

O script para esperando uma resposta, mas não recebe.

## SOLUÇÃO 1: Responder Manualmente

Quando aparecer a mensagem, digite `y` e pressione ENTER.

## SOLUÇÃO 2: Instalar Antes (Recomendado)

Abra o CMD na pasta do projeto e execute:

```cmd
cd electron
npm install --save-dev electron-packager
```

Depois execute o script novamente:
```cmd
build-windows-simple.bat
```

## SOLUÇÃO 3: Script Atualizado

O script `build-windows-simple.bat` já foi atualizado para usar:
```cmd
npx --yes electron-packager ...
```

O `--yes` responde automaticamente "sim" para instalar o pacote.

## SE AINDA NÃO FUNCIONAR

### Método Manual Completo:

1. Abra o CMD na pasta do projeto
2. Execute os comandos um por um:

```cmd
npm run build
cd electron
npm install
xcopy /E /I ..\dist dist
npx --yes electron-packager . "NeonTetris" --platform=win32 --arch=x64 --out=release --overwrite --asar
```

3. O executável estará em: `electron\release\NeonTetris-win32-x64\`

## ALTERNATIVA: Usar electron-builder

Se preferir usar electron-builder (gera instalador):

```cmd
cd electron
npm install
npm run dist
```

O instalador estará em: `electron\release\`

## ERROS COMUNS

### "Cannot find module 'electron'"
```cmd
cd electron
npm install
```

### "EACCES: permission denied"
Execute o CMD como Administrador

### "ENOENT: no such file or directory"
Verifique se a pasta `dist` existe dentro de `electron/`

### Build muito lento
É normal! O primeiro build baixa o Electron (~150MB)

## VERIFICAÇÃO FINAL

Após o build, você deve ter:

```
electron\
└── release\
    └── NeonTetris-win32-x64\
        ├── NeonTetris.exe  ← EXECUTE ESTE ARQUIVO
        ├── resources\
        └── ...
```

## DICAS

- O primeiro build é mais lento (baixa dependências)
- Builds seguintes são mais rápidos
- O executável final tem ~150-200MB
- Funciona em Windows 10/11 (64-bit)

---

Se ainda tiver problemas, verifique:
1. Node.js instalado: `node --version`
2. Na pasta correta: `dir package.json`
3. Espaço em disco: mínimo 1GB livre
