# Хрестики-нулики

Гра в хрестики-нулики на **Next.js 16 (App Router)** та
**[Porsche Design System](https://designsystem.porsche.com/) v4**.

## Запуск

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # продакшн-збірка
```

Потрібен Node 22+.

## Що вміє

- дошка 3×3 на двох гравців, індикатор поточного ходу;
- визначення переможця з підсвіткою виграшної лінії, визначення нічиї;
- рахунок X / нічиї / O, який зберігається між раундами;
- наступний раунд починає той, хто програв попередній;
- світла й темна теми — автоматично за системними налаштуваннями.

## Структура

| Шлях | Призначення |
|---|---|
| `lib/game.ts` | чиста логіка гри: виграшні лінії, визначення результату |
| `app/tic-tac-toe.tsx` | клієнтський компонент з UI та станом |
| `app/tic-tac-toe.module.css` | розкладка й клітинки поля на дизайн-токенах PDS |
| `app/layout.tsx` | `PorscheDesignSystemProvider` + `.scheme-light-dark` |
| `app/globals.css` | глобальні стилі PDS (змінні, шрифти, normalize) |

## Нотатки про Porsche Design System у Next.js

- Усі компоненти імпортуються з підпакету `@porsche-design-system/components-react/ssr` —
  він рендерить розмітку як Declarative Shadow DOM на сервері.
- Глобальний CSS підключається за явним шляхом
  `@import "@porsche-design-system/components-react/index.css"`. Скорочений
  варіант без `/index.css` Turbopack мовчки ігнорує — стилі просто не потрапляють
  у бандл.
- `next.config.ts` вимикає поліфіл `light-dark()` у Lightning CSS
  (`lightningCssFeatures.exclude`), бо на ньому ламається палітра PDS.
- Теми перемикаються лише класом `.scheme-*` — пропа `theme` в PDS v4 немає.
