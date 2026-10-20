# SOLUÇÃO: Janela Vazia no Electron

## PROBLEMA
Ao executar o .exe gerado, aparece apenas uma janela vazia/preta sem o jogo.

## CAUSA
O Vite estava gerando caminhos absolutos (/assets/...) em vez de relativos (./assets/...), 
o que impede o Electron de encontrar os arquivos CSS e JavaScript.

## SOLUÇÃO APLICADA ✅

### 1. Configuração do Vite atualizada
Adicionado `base: './'` no vite.config.js para gerar caminhos relativos.

### 2. Verificação dos arquivos
O index.html agora usa:
```html
<script type="module" src="./assets/index-xxx.js"></script>
<link rel="stylesheet" href="./assets/index-xxx.css">
```

## COMO TESTAR

### Passo 1: Testar no navegador
1. Abra `dist/index.html` no navegador
2. O jogo deve funcionar normalmente
3. Se funcionar no navegador, o problema é no Electron

### Passo 2: Testar o Electron localmente
1. Execute: `test-electron.bat`
2. Isso roda o Electron sem empacotar
3. Se funcionar aqui, o problema é no empacotamento

### Passo 3: Verificar arquivos
Após o build, verifique se existe:
```
electron/
├── main.js
├── preload.js
├── package.json
└── dist/
    ├── index.html
    └── assets/
        ├── index-xxx.js
        └── index-xxx.css
```

### Passo 4: Rebuild completo
```cmd
# Na pasta raiz do projeto
rmdir /s /q electron\dist
build-windows.bat
```

## DIAGNÓSTICO AVANÇADO

### Se ainda não funcionar:

1. **Verificar console do Electron**
   - Execute `test-electron.bat`
   - Pressione Ctrl+Shift+I para abrir DevTools
   - Veja se há erros no console

2. **Verificar caminhos**
   - Abra `electron/dist/index.html` no navegador
   - Deve funcionar igual ao `dist/index.html`

3. **Verificar permissões**
   - Execute como Administrador
   - Desative o antivírus temporariamente

4. **Limpar cache**
   ```cmd
   cd electron
   rmdir /s /q node_modules
   rmdir /s /q dist
   rmdir /s /q release
   npm install
   ```

## ERROS COMUNS

### "Failed to load resource"
- Os arquivos não foram copiados corretamente
- Execute o build novamente

### "Not allowed to load local resource"
- Problema de permissão no Windows
- Execute como Administrador

### Janela preta sem conteúdo
- Caminhos dos assets estão incorretos
- Verifique se `base: './'` está no vite.config.js

### Janela fecha imediatamente
- Erro no JavaScript
- Abra o DevTools (Ctrl+Shift+I) e veja o console

## SOLUÇÃO RÁPIDA

Se nada funcionar, tente:

```cmd
# 1. Limpar tudo
rmdir /s /q node_modules
rmdir /s /q electron\node_modules
rmdir /s /q electron\dist
rmdir /s /q electron\release
rmdir /s /q dist

# 2. Reinstalar
npm install
cd electron
npm install
cd ..

# 3. Rebuild
build-windows.bat
```

## CONTATO

Se ainda tiver problemas:
1. Execute `test-electron.bat`
2. Pressione Ctrl+Shift+I
3. Copie os erros do console
4. Envie para análise

---

**O problema principal foi corrigido!** 
Agora o Vite gera caminhos relativos que funcionam no Electron.
