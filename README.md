# NEONRP v2 — instalacja

## Pakiet
Strona neonowa, backend Node.js, Discord OAuth2 i role admina, panel admina (kolejka BAN/KICK/WARN/UNBAN/ogłoszenia oraz logi), osobny panel gracza ze zgłoszeniami, bot Discord (`/neon-status`, `/neon-log`) i zasób FiveM `neonrp_bridge`.

## Uruchom stronę
Wymagany Node.js 18+:
```bash
npm install
```
Skopiuj `.env.example` do `.env`, uzupełnij dane i uruchom:
```bash
npm start
```
Otwórz http://localhost:3000. W Discord Developer Portal dodaj redirect URL `http://localhost:3000/auth/discord/callback`, włącz OAuth2 scopes `identify` oraz `guilds.members.read`, uzupełnij Client ID/Secret, Guild ID i ID ról adminów.

## Bot Discord
```bash
cd bot
npm install
```
Skopiuj `bot/.env.example` do `bot/.env`; wpisz token, Client ID, Guild ID, role adminów i kanał logów. Następnie `npm run register` i `npm start`. Bot wymaga uprawnień do wysyłania wiadomości w kanale logów.

## FiveM
Skopiuj `fivem/neonrp_bridge` do `resources` i dodaj do `server.cfg`:
```cfg
ensure neonrp_bridge
```
W `config.lua` ustaw ApiBase osiągalny z serwera FiveM i ten sam BridgeSecret co `NEONRP_BRIDGE_SECRET` w głównym `.env`.

## Uczciwy zakres / wymagane dalsze podłączenie
OAuth i sprawdzanie ról są zaimplementowane. Bot ma komendy status i log. Panel admina przyjmuje akcje do kolejki, a bridge obsługuje ogłoszenia, kick i warn. BAN w tej wersji tylko rozłącza gracza — nie jest trwały. UNBAN wymaga bazy banów. Lista graczy, profile postaci i zgłoszenia wymagają integracji z ESX/QBCore/ox_core i bazą danych. Zgłoszenia i logi są obecnie przechowywane tylko w pamięci procesu i znikają po restarcie.

Przed użyciem publicznym dodaj HTTPS, trwałą bazę danych, CSRF/rate limiting, walidację identyfikatorów, audyt, retry/deduplikację kolejki, trwały system banów i testy bezpieczeństwa. Sekretów nie publikuj ani nie wpisuj do plików frontendowych.
