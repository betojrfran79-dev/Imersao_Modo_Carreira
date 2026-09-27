# 🏆 Imersão Modo Carreira - EA FC

> **Plataforma de Persistência Histórica para o Modo Carreira do EA Sports FC**  
> *Compatibilidade Nativa com o Patch FC Mania (25.000+ Minifaces e 1.800+ Escudos)*

---

## 📌 Visão Geral do Projeto

O **Imersão Modo Carreira - EA FC** resolve a limitação do EA Sports FC onde os dados estatísticos são apagados a cada virada de temporada. Esta plataforma:

1. **Nunca Apaga Dados:** Mantém o histórico acumulado de todas as temporadas de um save em um banco de dados SQLite local (`career_vault.db`).
2. **Estatísticas do Técnico com Aproveitamento Real (3/1/0):**
   - Fórmula: `(Vitórias * 3 + Empates * 1) / (Total de Jogos * 3) * 100%`.
   - Histórico de todos os clubes treinados na carreira e galeria de títulos/conquistas.
3. **Continuidade de Atletas:**
   - Acompanha o jogador ano a ano (jogos, gols, assistências, notas médias, MOTMs e cartões), somando os totais históricos pelo clube.
4. **Integração Nativa com o Patch FC Mania:**
   - Lê a base de dados `FCM 26 v4.1 - 03-08-2026.db`.
   - Renderiza automaticamente as **25.132 minifaces (`heads/p{id}.png`)** e **1.883 escudos oficiais (`crest/l{id}.png`)**.
5. **Joias da Base (Youth Academy):**
   - Identifica promessas geradas pelo jogo, aplica o selo *"Joia da Base"* e gera avatares estilizados com as cores do clube.
6. **Hall da Fama Eterno & Raio-X de Confrontos (H2H):**
   - Maiores artilheiros e recordistas de toda a história do save.
   - Retrospecto acumulado contra qualquer clube enfrentado.

---

## 🚀 Como Iniciar

### Método 1: Pelo Executável (1 Clique)
Dê um duplo clique no arquivo:
👉 `INICIAR_VAULT.bat`

### Método 2: Pelo Terminal
```bash
py server.py
```

Acesse no navegador:
👉 **[http://localhost:8000](http://localhost:8000)**

---

## 🎮 Integração In-Game (Live Editor)

* O script Lua de sincronização está localizado em:  
  `lua/career_vault_sync.lua`
* Ao finalizar partidas ou temporadas, o script envia os dados diretamente para o servidor local na porta 8000 (`http://localhost:8000/api/sync/match` e `http://localhost:8000/api/sync/season`), registrando tudo sem intervenção manual.

---

## 📂 Estrutura de Arquivos

* `server.py`: Servidor HTTP multithreaded, API REST e streaming de imagens.
* `database.py`: Camada de banco de dados SQLite com schema relacional contínuo.
* `fcm_resolver.py`: Módulo que traduz IDs para nomes, minifaces e escudos do FC Mania.
* `index.html`: Interface Single Page Application moderna.
* `style.css`: Design System Dark Glassmorphism.
* `app.js`: Controlador do frontend com modais, gráficos e navegação.
* `lua/career_vault_sync.lua`: Script Lua para Live Editor.
* `seed_data.py`: Script de dados simulados com IDs oficiais do FC Mania.
* `_archive_v1/`: Backup da versão anterior do projeto.
