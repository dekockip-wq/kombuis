# Crisna se Kombuis – app

'n Klein web-app vir Crisna se kos-besigheid (etes en biltong). Sy gebruik dit net op haar iPhone, in Safari as tuisskerm-app. Die UI is in Afrikaans, en die code identifiers ook (`saldo`, `klante`, `stoor`, `teken`, …).

## Lêers
| Lêer | Wat | Raak aan? |
|---|---|---|
| `index.html` | net die raamwerk: head, ikone, 3 `div`s, script-tags | selde |
| `style.css` | alle CSS (tokens bo-aan) | ja |
| `app.js` | die hele app | ja — hier gebeur die werk |
| `wolk.js` | wolk-rugsteun (laai ná `app.js`) | ja |
| `lib/jspdf.umd.min.js` | jsPDF 2.5.1 (MIT), vir PDF-state | **nooit** |
| `sw.js` | service worker: app werk sonder internet | net `VERSIE` |
| `manifest.webmanifest`, `ikone/` | tuisskerm-ikoon en naam | selde |

Daar is geen build step en geen framework nie.

## Deploy
- Repo `dekockip-wq/kombuis`, branch **`gh-pages`**. `git push` beteken dit is live op https://crisna.farmsentinel.online/ (sedert 27 Sep 2026; die ou github.io-adres stuur daarheen aan).
- `CNAME` bly in die repo. Sonder dit verloor die site sy domein.
- **By elke deploy:**
  1. Verhoog `VERSIE` in `sw.js`.
  2. Verhoog die `?v=` agter `style.css`, `app.js` en `wolk.js` in `index.html`.

  Anders hou haar foon die ou weergawe.
- Die service worker gebruik "netwerk eerste". Met internet kry sy altyd die nuutste weergawe, en sonder internet die laaste kopie wat gekas is.
- `.nojekyll` bly in die repo.

## Werkreëls (belangrik)
1. **Doen altyd eers `git pull`** voor enige verandering. Op 26 Sep 2026 het 'n ou kopie van `index.html` die Geld-oortjie oorskryf. Dit is herstel, maar moet nooit weer gebeur nie.
2. Wysig lêers **in plek**. Moet hulle nooit vervang met 'n kopie van elders (Downloads, 'n chat, 'n ander sessie) sonder om eers te diff teen `HEAD` nie.
3. Klein commits, met Afrikaanse boodskappe.
4. Toets voor elke push: lig- en donkermodus, klant-skerm, Geld-oortjie, 'n PDF-staat in Afrikaans en Engels, en of die app aflyn laai. Toets oor `http://` (nie `file://` nie), anders werk die service worker nie.

## Data (moet nie breek nie)
- Alles is in `localStorage`, key `crisna_kombuis_v1`, op haar foon. **Moet nooit die key verander nie.**
- Nuwe velde gaan by via `migreer()` in `app.js`. Onbekende velde op `S` moet behoue bly.
- Rugsteun en herstel is JSON (Instellings).
- Wolk: `wolk.js` stuur die hele `S` na https://kombuis-api.farmsentinel.online (Cloudflare Worker + D1, eie repo `~/Claude/kombuis-api/`). Die kode sit in key `crisna_kombuis_wolk`, nooit in die repo nie. localStorage bly die hoofkopie. Uurlikse kopieë vir 90 dae in D1-tabel `kopie`.

## Struktuur (`app.js`)
- `LOGO`, `logoSvg`, `ikoonSvg`, `pdfLogo`, `pdfIkoon`, `pdfPad`: die logo as vektorpaaie.
- Skerms: `skermHuis`, `skermKlant`, `skermGeld`, `skermInstellings`. Uitleg gebeur met `teken()`, events met `bindAksies()` en `bindGeld()`.
- State: `maakPdf` (PDF) en `staatHtml` (voorskou). Engelse state kom van `TAAL.en` en `naamEn`.
- Geld: `geldData(maand)`, `S.uitgawes`, `S.inkomste` (kontantverkope), `S.kategoriee`.

## Merk / logo
- Woordmerk: "Crisna" in Fraunces 800 (donkerbruin), met "se Kombuis" in Fraunces italic 400 (roes) regs daaronder.
- Ikoon: 'n vet "C" met 'n houtlepel, room op 'n roes sirkel. Dit is `ikone/apple-touch-icon.png` (180×180).
- Die logo is as vektorpaaie in `LOGO` ingebou, so geen font-lêers is nodig nie.
- Die logo wys net as die besigheidsnaam presies `Crisna se Kombuis` is (`isStdNaam`). Anders wys dit teks.
- Engelse state gebruik die ikoon plus "Crisna's Hot Kitchen".
- Ontwerp-canvas: https://claude.ai/artifact/E37paAYvF92rspKkdMajZr

## Kleure (CSS tokens in `style.css`)
| Token | Lig | Donker | Gebruik |
|---|---|---|---|
| `--merk` | `#8E3B24` | `#E09A7C` | primêre knoppies, opsomming, skakels |
| `--ink` | `#2A1B14` | `#F2E9DD` | teks |
| `--ground` | `#F7F1E7` | `#17120F` | agtergrond |
| `--bet` | `#2F6B45` | `#84AE8E` | betalings, inkomste, wins |
| `--klei` | `#B3261E` | `#F08A7E` | uitgawes, verlies, gevaar |

In die PDF is roes `[142,59,36]` en betaling-groen `[47,107,69]`. Groen is net vir geld wat inkom, en roes is die merk.
