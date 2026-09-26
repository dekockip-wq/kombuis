# Crisna se Kombuis – app

Single-file web app (`index.html`) vir Crisna se klein kos-besigheid (etes en biltong). Sy gebruik dit net op haar iPhone, via Safari as tuisskerm-app. Die UI is in Afrikaans, en die code identifiers ook (`saldo`, `klante`, `stoor`, `teken`, …).

## Deploy
- Repo `dekockip-wq/kombuis`, branch **`gh-pages`**. Daar is geen build step nie: `git push` beteken dit is live.
- GitHub Pages ontplooi binne ~30 s. Die CDN kan tot 10 min 'n ou kopie wys.
- `.nojekyll` bly in die repo.

## Werkreëls (belangrik)
1. **Doen altyd eers `git pull`** voor enige verandering. Op 26 Sep 2026 het 'n ou kopie van `index.html` die Geld-oortjie oorskryf. Dit is herstel uit git (`0330f7c`), maar moet nie weer gebeur nie.
2. Wysig `index.html` **in plek**. Moet dit nooit vervang met 'n lêer van elders (Downloads, 'n chat) sonder om eers te diff teen `HEAD` nie.
3. Klein commits, met Afrikaanse boodskappe.
4. Toets voor elke push: lig- en donkermodus, klant-skerm, Geld-oortjie, en 'n PDF-staat in Afrikaans en Engels.

## Data (moet nie breek nie)
- Alles is in `localStorage`, key `crisna_kombuis_v1`, op haar foon. **Moet nooit die key verander nie.**
- Nuwe velde gaan by via `migreer()`. Onbekende velde op `S` moet behoue bly.
- Rugsteun en herstel is JSON (Instellings).

## Struktuur (binne `index.html`)
- Eerste `<script>`: jsPDF 2.5.1 (UMD, inline). Moenie dit aanraak nie.
- Tweede `<script>`: die app.
  - `LOGO`, `logoSvg`, `ikoonSvg`, `pdfLogo`, `pdfIkoon`, `pdfPad`: die logo as vektorpaaie.
  - Skerms: `skermHuis`, `skermKlant`, `skermGeld`, `skermInstellings`. Uitleg gebeur met `teken()`, events met `bindAksies()` en `bindGeld()`.
  - State: `maakPdf` (PDF) en `staatHtml` (voorskou). Engelse state kom van `TAAL.en` en `naamEn`.

## Merk / logo
- Woordmerk: "Crisna" in Fraunces 800 (donkerbruin), met "se Kombuis" in Fraunces italic 400 (roes) regs daaronder.
- Ikoon: 'n vet "C" met 'n houtlepel, room op 'n roes sirkel. Die tuisskerm-ikoon is 'n 180×180 PNG (data-URI in `<head>`).
- Die logo is as vektorpaaie in `LOGO` ingebou, so geen font-lêers is nodig nie. Om dit te verander, moet die paaie opnuut uit Fraunces gegenereer word.
- Die logo wys net as die besigheidsnaam presies `Crisna se Kombuis` is (`isStdNaam`). Anders wys dit teks.
- Engelse state gebruik die ikoon plus "Crisna's Hot Kitchen".
- Ontwerp-canvas: https://claude.ai/artifact/E37paAYvF92rspKkdMajZr

## Kleure (CSS tokens)
| Token | Lig | Donker | Gebruik |
|---|---|---|---|
| `--merk` | `#8E3B24` | `#E09A7C` | primêre knoppies, opsomming, skakels |
| `--ink` | `#2A1B14` | `#F2E9DD` | teks |
| `--ground` | `#F7F1E7` | `#17120F` | agtergrond |
| `--bet` | `#2F6B45` | `#84AE8E` | betalings, inkomste, wins |
| `--klei` | `#B3261E` | `#F08A7E` | uitgawes, verlies, gevaar |

In die PDF is roes `[142,59,36]` en betaling-groen `[47,107,69]`. Groen is net vir geld wat inkom, en roes is die merk.
