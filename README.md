# Elfmeter-Spiel (Phaser)

Kleines Penalty/Elfmeter-Spiel mit Phaser 3 — keine externen Assets, alles per Graphics erzeugt.

Lokale Entwicklung

1. Öffne die Projektmappe im Terminal.
2. Starte einen einfachen statischen Server (empfohlen `http-server` via npm):

```powershell
npx http-server -c-1 .
# oder alternativ (wenn installiert):
# npx serve .
```

Dann `http://localhost:8080` öffnen (Port kann variieren).

GitHub Pages

Option A — `docs/`-Ordner:
- Lege die gebauten/öffentlichen Dateien in einen `docs/` Ordner im Repo und aktiviere GitHub Pages in den Repository-Einstellungen auf Branch `main` und Ordner `docs/`.

Option B — `gh-pages` Branch:
- Nutze das `gh-pages` npm-Paket: `npm i -D gh-pages` und konfiguriere ein Deploy-Skript, das die Produktionsdateien auf `gh-pages` pusht.

Hinweis: Dieses Projekt verwendet keine externen Bilder, es reicht also, den Projekt-Root oder `docs/` zu veröffentlichen.

Weitere Anpassungen
- Beherrschung, Torwartverhalten, UI und mobile Steuerung können leicht erweitert werden.
