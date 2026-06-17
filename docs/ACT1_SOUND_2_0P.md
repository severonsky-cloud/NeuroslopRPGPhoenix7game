# Phoenix7 2.0P — Sound Integrated Act 1

Файл: `act1_sound_integrated.html`

## Что это

Безопасная надстройка над текущим Act 1 Loop:

```text
character creator
→ PhoenixAudio init
→ стартовый звук
→ Act 1 Loop в iframe
→ click/key hooks
→ quest update / quest complete monitoring
→ port ambience
```

## Что звучит

- кнопки редактора;
- старт игры;
- кнопки внутри Act 1 Loop;
- `J` — книга;
- `M` — карта;
- `Q` — доска задач;
- `I` — инвентарь / страница;
- изменение stage в сейве — quest update;
- рост счётчика выполненных задач — quest update;
- 4/4 задач — quest complete;
- портовая атмосфера после старта.

## Почему через wrapper

`act1_loop.html` уже большой и рабочий. Чтобы не сломать его, 2.0P подключает звук через родительский wrapper и same-origin iframe hooks.

Если автоподключение к iframe не сработает, сам `act1_loop.html` всё равно запускается.

## Запуск

```bash
py -m http.server 8000
```

Открыть:

```text
http://localhost:8000/act1_sound_integrated.html
```

## Следующий этап

2.0Q:

- сделать `act1_sound_integrated.html` главным launch target в `play.html`;
- перенести аудио-хуки внутрь `act1_loop.html` напрямую;
- добавить реальные WAV в `public/assets/audio/`;
- улучшить UI звуковых настроек;
- добавить ambience switch по ближайшей локации: Порт / Дорога / Форт / Красный Узел.
