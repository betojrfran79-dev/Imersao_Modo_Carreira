# 🚀 Guia de Distribuição e Atualização Automática
## Imersão Modo Carreira - EA FC & FC Mania

Este guia explica como disponibilizar o aplicativo para colegas de forma profissional, com **atualizações automáticas em segundo plano** sempre que você atualizar o código no GitHub.

---

### 🌟 Como funciona a arquitetura
1. **Você (Desenvolvedor)**: Altera arquivos, adiciona recursos ou ajusta estilos e dá `git push` no seu repositório GitHub.
2. **Colega (Usuário Final)**: Clica no atalho na Área de Trabalho dele. O inicializador (`INICIAR_VAULT.bat`) executa um `git pull` automático e silencioso em 2 segundos, atualiza o app e abre o navegador já com as novidades.
3. **Privacidade dos Saves**: O banco de dados da carreira (`career_vault.db`) está protegido no `.gitignore`. Ou seja, **o save de cada colega nunca é sobrescrito** pelas suas atualizações!

---

### 📦 Passo 1: Criar o Repositório no GitHub (Apenas você, uma vez)

1. Acesse o [GitHub](https://github.com/new) e crie um novo repositório:
   * **Repository name**: `imersao-modo-carreira` (ou o nome que preferir)
   * **Visibility**: Público ou Privado (se for público é mais fácil para os colegas clonarem sem login).
   * **Não marque** as opções de adicionar README ou .gitignore (já temos tudo pronto).
2. No seu computador, abra o terminal nesta pasta e execute os comandos:
   ```bash
   git branch -M main
   git add .
   git commit -m "Versao oficial de distribuicao com Auto-Updater"
   git remote add origin https://github.com/SEU_USUARIO/imersao-modo-carreira.git
   git push -u origin main
   ```

---

### 👥 Passo 2: Como o Colega Instala no Computador Dele (Apenas uma vez)

Você pode enviar para o seu colega um pequeno script `CLONAR_E_INSTALAR.bat` ou pedir para ele rodar:

```bat
git clone https://github.com/SEU_USUARIO/imersao-modo-carreira.git "%USERPROFILE%\Desktop\Imersao_Modo_Carreira"
cd /d "%USERPROFILE%\Desktop\Imersao_Modo_Carreira"
call INSTALAR_PRIMEIRA_VEZ.bat
```

O script `INSTALAR_PRIMEIRA_VEZ.bat` faz tudo automaticamente:
* Checa se o Python está presente (se não estiver, instala pelo Windows `winget`).
* Checa se o Git está instalado.
* Cria o ícone oficial **Imersão Modo Carreira - EA FC** na Área de Trabalho do colega com logo personalizado.

---

### 🔄 Passo 3: Como você envia atualizações para todos

Sempre que você consertar algo ou criar um recurso novo, você só precisa fazer isso:

```bash
git add .
git commit -m "Nova melhoria no scout"
git push
```

**Pronto!** Na próxima vez que o seu colega abrir o aplicativo pelo atalho da Área de Trabalho, o `INICIAR_VAULT.bat` vai puxar as atualizações sozinho antes de abrir o servidor.
