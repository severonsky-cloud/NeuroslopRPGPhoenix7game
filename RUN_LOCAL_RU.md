# Локальный запуск Phoenix7 v3L1

## Windows

Самый простой способ:

```text
START_GAME_V3L_WINDOWS.bat
```

Откроется отдельное окно локального сервера и страница:

```text
http://localhost:8000/v3l.html
```

Не закрывай окно сервера во время игры.

## Ручной запуск без Python

Из корня репозитория:

```powershell
powershell -ExecutionPolicy Bypass -File tools/phoenix_server.ps1 -Port 8000
```

После этого открой:

```text
http://localhost:8000/v3l.html
```

## Запуск через Python

Если удобнее использовать Python:

```bash
py -m http.server 8000
```

или:

```bash
python -m http.server 8000
```

Затем открой `http://localhost:8000/v3l.html`.

## Разработка через Vite

```bash
npm install
npm run dev
```

Production-проверка:

```bash
npm run build
npm run preview
```

## Если игра не открывается

1. Закрой старые окна Phoenix7 local server.
2. Убедись, что порт 8000 свободен.
3. Снова запусти `START_GAME_V3L_WINDOWS.bat`.
4. Обнови страницу через Ctrl+F5.
5. Проверь, что открывается именно `/v3l.html`, а не старые `game.html` или `real3d.html`.

Three.js включён в репозиторий локально, поэтому интернет для загрузки движка не требуется.
