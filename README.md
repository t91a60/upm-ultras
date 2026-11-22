<div align="center">

# UPM Ultras

**Oficjalna strona Ultras Polonia Międzyrzecze.**

[Odwiedź stronę](https://t91a60.github.io/upm-ultras/) · [Uruchom lokalnie](#start-lokalny) · [Zgłoś problem](https://github.com/t91a60/upm-ultras/issues)
</div>

Polskojęzyczna strona informacyjna grupy kibicowskiej: aktualności, zdjęcia z trybun i informacje dla osób, które chcą dołączyć. Witryna jest statyczna, ma układ dostosowany do telefonów i nie wymaga własnego backendu.

## Co znajduje się na stronie

- manifest i aktualności grupy;
- galeria zdjęć z trybun;
- sekcja sklepu z wlepkami;
- informacje dla osób chcących dołączyć;
- FAQ oraz dane kontaktowe;
- responsywna nawigacja i usprawnienia dla linków zewnętrznych;
- service worker oraz manifest dla podstawowej obsługi offline.

## Technologie

| Obszar | Technologia |
| --- | --- |
| Widok | Semantyczny HTML, CSS i moduły JavaScript |
| Narzędzia | Vite 8, Tailwind CSS v4, Prettier |
| Testy i lint | Vitest, ESLint, JSDOM |
| Grafika | Sharp (`npm run convert-images`) |
| Hosting | GitHub Pages |

## Start lokalny

Użyj Node.js 22, zgodnie z workflow CI. Repozytorium zawiera plik blokady zależności, dlatego do instalacji użyj `npm ci`.

```bash
git clone https://github.com/t91a60/upm-ultras.git
cd upm-ultras
npm ci
npm run dev
```

Vite poda adres lokalnego serwera w terminalu, zwykle `http://localhost:5173`.

## Polecenia

```bash
npm run lint             # sprawdza JavaScript
npm test                 # uruchamia testy jednostkowe
npm run build            # tworzy produkcyjny katalog dist/
npm run convert-images   # optymalizuje obrazy
npm run optimize         # obrazy + build
npm run preview          # podgląd produkcyjnego buildu
```

## Struktura projektu

```text
index.html          zawartość i sekcje strony
style.css           style witryny
app.js              inicjalizacja modułów
nav.js              zachowanie nawigacji
links.js            bezpieczna obsługa linków zewnętrznych
ui.js               animacje wejścia i fallbacki obrazów
public/             manifest, service worker, 404 i pliki SEO
scripts/            optymalizacja obrazów
__tests__/          testy nawigacji i linków
```

## Wdrożenie

Konfiguracja Vite używa ścieżki bazowej `/upm-ultras/`. Push do `main` przechodzi przez lint, testy i build, a workflow wdrożeniowy publikuje wynik na [GitHub Pages](https://t91a60.github.io/upm-ultras/).

## Licencja

Metadane projektu w `package.json` wskazują licencję ISC, ale repozytorium nie zawiera osobnego pliku `LICENSE`. Przed ponownym wykorzystaniem kodu, tekstów lub materiałów graficznych należy najpierw potwierdzić zasady ich użycia.
