import type { Role } from './mock';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ForumCategory {
  id: string;
  title: string;
  description: string;
  icon: string;              // lucide icon name
  accessRoles: Role[];       // empty = everyone
  isReadOnly: boolean;       // only admin can post new threads
}

export interface ForumThread {
  id: string;
  categoryId: string;
  title: string;
  authorLogin: string;
  authorRole: Role;
  createdAt: string;
  isPinned: boolean;
  isLocked: boolean;
  views: number;
}

export interface ForumPost {
  id: string;
  threadId: string;
  authorLogin: string;
  authorRole: Role;
  createdAt: string;
  body: string;              // plain text (multiline)
  likes: number;
  isOp: boolean;             // original post (first in thread)
  quotedPostId?: string;     // quoted post reference
  editedAt?: string;         // set when post is edited
}

// ─── Categories ─────────────────────────────────────────────────────────────

export const forumCategories: ForumCategory[] = [
  {
    id: 'c-general',
    title: 'Общий чат',
    description: 'Знакомства, вопросы о клубе, общение участников',
    icon: 'message-square',
    accessRoles: [],
    isReadOnly: false,
  },
  {
    id: 'c-expertise',
    title: 'Экспертиза и атрибуция',
    description: 'Определение монет, помощь с атрибуцией, экспертные оценки',
    icon: 'scan-search',
    accessRoles: [],
    isReadOnly: false,
  },
  {
    id: 'c-deals',
    title: 'Сделки и переговоры',
    description: 'Обсуждение сделок, поиск партнёров. Только для дилеров',
    icon: 'scale',
    accessRoles: ['dealer', 'admin'],
    isReadOnly: false,
  },
  {
    id: 'c-numizmatika',
    title: 'Нумизматика',
    description: 'История монет, редкости, литература, каталоги и исследования',
    icon: 'book-open',
    accessRoles: [],
    isReadOnly: false,
  },
  {
    id: 'c-tech',
    title: 'Хранение и реставрация',
    description: 'Чистка, консервация, капсулы, сейфы, советы по хранению',
    icon: 'shield',
    accessRoles: [],
    isReadOnly: false,
  },
  {
    id: 'c-announce',
    title: 'Объявления',
    description: 'Официальные объявления администрации клуба',
    icon: 'bell',
    accessRoles: [],
    isReadOnly: true,
  },
];

// ─── Threads ─────────────────────────────────────────────────────────────────

export const forumThreads: ForumThread[] = [
  // Объявления (pinned)
  {
    id: 't-ann-1',
    categoryId: 'c-announce',
    title: 'Правила форума клуба 4BOR. Читать обязательно!',
    authorLogin: 'admin',
    authorRole: 'admin',
    createdAt: '2024-01-15T09:00:00Z',
    isPinned: true,
    isLocked: true,
    views: 1240,
  },
  {
    id: 't-ann-2',
    categoryId: 'c-announce',
    title: 'Расписание аукционов на 2024–2025 год',
    authorLogin: 'admin',
    authorRole: 'admin',
    createdAt: '2024-02-01T10:00:00Z',
    isPinned: true,
    isLocked: false,
    views: 892,
  },
  {
    id: 't-ann-3',
    categoryId: 'c-announce',
    title: 'Новые правила верификации лотов с 1 июня 2024',
    authorLogin: 'admin',
    authorRole: 'admin',
    createdAt: '2024-05-20T12:00:00Z',
    isPinned: false,
    isLocked: false,
    views: 567,
  },

  // Общий чат
  {
    id: 't-gen-1',
    categoryId: 'c-general',
    title: 'Знакомства — расскажите о себе',
    authorLogin: 'admin',
    authorRole: 'admin',
    createdAt: '2024-01-16T09:00:00Z',
    isPinned: true,
    isLocked: false,
    views: 2100,
  },
  {
    id: 't-gen-2',
    categoryId: 'c-general',
    title: 'Как пользоваться платформой: гайд для новичков',
    authorLogin: 'admin',
    authorRole: 'admin',
    createdAt: '2024-01-20T10:00:00Z',
    isPinned: true,
    isLocked: false,
    views: 1550,
  },
  {
    id: 't-gen-3',
    categoryId: 'c-general',
    title: 'Ваши самые интересные находки этого сезона',
    authorLogin: 'ivan_numizmat',
    authorRole: 'dealer',
    createdAt: '2024-04-10T14:00:00Z',
    isPinned: false,
    isLocked: false,
    views: 780,
  },
  {
    id: 't-gen-4',
    categoryId: 'c-general',
    title: 'Клуб в прессе: упоминания и публикации',
    authorLogin: 'dealer_ivanov',
    authorRole: 'dealer',
    createdAt: '2024-05-01T11:00:00Z',
    isPinned: false,
    isLocked: false,
    views: 340,
  },
  {
    id: 't-gen-5',
    categoryId: 'c-general',
    title: 'Встреча дилеров в Москве — май 2024',
    authorLogin: 'ivan_numizmat',
    authorRole: 'dealer',
    createdAt: '2024-05-05T16:00:00Z',
    isPinned: false,
    isLocked: false,
    views: 210,
  },

  // Экспертиза
  {
    id: 't-exp-1',
    categoryId: 'c-expertise',
    title: 'Как отличить подделку чешуи от оригинала?',
    authorLogin: 'collector_petrov',
    authorRole: 'collector',
    createdAt: '2024-03-15T10:00:00Z',
    isPinned: true,
    isLocked: false,
    views: 1890,
  },
  {
    id: 't-exp-2',
    categoryId: 'c-expertise',
    title: 'Помогите определить монету — загадочный тип',
    authorLogin: 'collector_petrov',
    authorRole: 'collector',
    createdAt: '2024-05-12T13:00:00Z',
    isPinned: false,
    isLocked: false,
    views: 430,
  },
  {
    id: 't-exp-3',
    categoryId: 'c-expertise',
    title: 'Атрибуция дирхема — Сарай или провинция?',
    authorLogin: 'ivan_numizmat',
    authorRole: 'dealer',
    createdAt: '2024-05-08T09:00:00Z',
    isPinned: false,
    isLocked: false,
    views: 512,
  },
  {
    id: 't-exp-4',
    categoryId: 'c-expertise',
    title: 'Разновидности рублей 1898 года — как различать?',
    authorLogin: 'dealer_ivanov',
    authorRole: 'dealer',
    createdAt: '2024-04-22T15:00:00Z',
    isPinned: false,
    isLocked: false,
    views: 677,
  },

  // Сделки
  {
    id: 't-deal-1',
    categoryId: 'c-deals',
    title: 'Ищу партнёра по обмену уделами Ростова',
    authorLogin: 'dealer_ivanov',
    authorRole: 'dealer',
    createdAt: '2024-05-10T10:00:00Z',
    isPinned: false,
    isLocked: false,
    views: 190,
  },
  {
    id: 't-deal-2',
    categoryId: 'c-deals',
    title: 'Продаю коллекцию пятаков Екатерины II — оптом',
    authorLogin: 'ivan_numizmat',
    authorRole: 'dealer',
    createdAt: '2024-05-11T11:00:00Z',
    isPinned: false,
    isLocked: false,
    views: 302,
  },
  {
    id: 't-deal-3',
    categoryId: 'c-deals',
    title: 'Порядок работы с новыми контрагентами',
    authorLogin: 'admin',
    authorRole: 'admin',
    createdAt: '2024-02-10T09:00:00Z',
    isPinned: true,
    isLocked: false,
    views: 840,
  },

  // Нумизматика
  {
    id: 't-num-1',
    categoryId: 'c-numizmatika',
    title: 'Рекомендуемая литература по русской нумизматике',
    authorLogin: 'admin',
    authorRole: 'admin',
    createdAt: '2024-01-18T09:00:00Z',
    isPinned: true,
    isLocked: false,
    views: 2340,
  },
  {
    id: 't-num-2',
    categoryId: 'c-numizmatika',
    title: 'История чеканки монет в Золотой Орде',
    authorLogin: 'ivan_numizmat',
    authorRole: 'dealer',
    createdAt: '2024-04-05T14:00:00Z',
    isPinned: false,
    isLocked: false,
    views: 890,
  },
  {
    id: 't-num-3',
    categoryId: 'c-numizmatika',
    title: 'Загадки чешуи Смутного времени',
    authorLogin: 'dealer_ivanov',
    authorRole: 'dealer',
    createdAt: '2024-04-28T11:00:00Z',
    isPinned: false,
    isLocked: false,
    views: 620,
  },
  {
    id: 't-num-4',
    categoryId: 'c-numizmatika',
    title: 'Почему рубль Петра I такой разный?',
    authorLogin: 'collector_petrov',
    authorRole: 'collector',
    createdAt: '2024-05-09T16:00:00Z',
    isPinned: false,
    isLocked: false,
    views: 445,
  },

  // Хранение
  {
    id: 't-tech-1',
    categoryId: 'c-tech',
    title: 'Как правильно чистить серебро без потери патины?',
    authorLogin: 'collector_petrov',
    authorRole: 'collector',
    createdAt: '2024-03-20T10:00:00Z',
    isPinned: true,
    isLocked: false,
    views: 1670,
  },
  {
    id: 't-tech-2',
    categoryId: 'c-tech',
    title: 'Какие капсулы лучше: Leuchtturm или Volterra?',
    authorLogin: 'dealer_ivanov',
    authorRole: 'dealer',
    createdAt: '2024-04-14T13:00:00Z',
    isPinned: false,
    isLocked: false,
    views: 530,
  },
  {
    id: 't-tech-3',
    categoryId: 'c-tech',
    title: 'Влажность и температура хранения: оптимальные условия',
    authorLogin: 'ivan_numizmat',
    authorRole: 'dealer',
    createdAt: '2024-05-03T12:00:00Z',
    isPinned: false,
    isLocked: false,
    views: 398,
  },
];

// ─── Posts ────────────────────────────────────────────────────────────────────

export const forumPosts: ForumPost[] = [
  // t-ann-1: Правила форума
  {
    id: 'p1',
    threadId: 't-ann-1',
    authorLogin: 'admin',
    authorRole: 'admin',
    createdAt: '2024-01-15T09:00:00Z',
    isOp: true,
    likes: 34,
    body: `Добро пожаловать на форум клуба 4BOR!

Перед началом общения просим ознакомиться с основными правилами:

1. Уважайте других участников. Личные оскорбления, агрессия и провокации запрещены.
2. Соблюдайте тематику разделов. Вопросы по атрибуции — в «Экспертизу», объявления о продаже — в «Сделки».
3. Не публикуйте личные данные других участников без их согласия.
4. Реклама сторонних площадок и ресурсов без согласования с администрацией запрещена.
5. Администрация оставляет за собой право редактировать или удалять сообщения, нарушающие правила.

За систематические нарушения — предупреждение, затем ограничение доступа к форуму.

Приятного общения!`,
  },
  {
    id: 'p2',
    threadId: 't-ann-1',
    authorLogin: 'dealer_ivanov',
    authorRole: 'dealer',
    createdAt: '2024-01-15T14:30:00Z',
    isOp: false,
    likes: 8,
    body: 'Понял, принял. Спасибо за чёткое изложение правил.',
  },

  // t-ann-2: Расписание аукционов
  {
    id: 'p3',
    threadId: 't-ann-2',
    authorLogin: 'admin',
    authorRole: 'admin',
    createdAt: '2024-02-01T10:00:00Z',
    isOp: true,
    likes: 21,
    body: `Расписание аукционов на 2024–2025:

— Весенний аукцион: 15 мая 2024 (завершён)
— Летний аукцион: 20 июля 2024
— Осенний аукцион: 12 октября 2024
— Зимний аукцион: 14 декабря 2024
— Весенний аукцион 2025: 17 мая 2025

Заявки на участие принимаются за 2 недели до даты аукциона. Лоты добавляются в систему за 7 дней до начала торгов.`,
  },
  {
    id: 'p4',
    threadId: 't-ann-2',
    authorLogin: 'ivan_numizmat',
    authorRole: 'dealer',
    createdAt: '2024-02-01T12:00:00Z',
    isOp: false,
    likes: 5,
    body: 'Отличный календарь, удобно планировать. Будет ли летний аукцион с фокусом на Империю или снова смешанный?',
  },
  {
    id: 'p5',
    threadId: 't-ann-2',
    authorLogin: 'admin',
    authorRole: 'admin',
    createdAt: '2024-02-02T09:00:00Z',
    isOp: false,
    likes: 3,
    body: 'Летний аукцион планируется как тематический — акцент на Российской Империи и Уделах. Подробности ближе к июню.',
  },

  // t-gen-1: Знакомства
  {
    id: 'p6',
    threadId: 't-gen-1',
    authorLogin: 'admin',
    authorRole: 'admin',
    createdAt: '2024-01-16T09:00:00Z',
    isOp: true,
    likes: 15,
    body: 'Предлагаю каждому новому участнику написать немного о себе: как давно занимаетесь нумизматикой, какие периоды интересуют, что ищете на платформе. Начну первым: работаю с клубом с самого основания, специализируюсь на русской средневековой чешуе.',
  },
  {
    id: 'p7',
    threadId: 't-gen-1',
    authorLogin: 'dealer_ivanov',
    authorRole: 'dealer',
    createdAt: '2024-01-16T11:00:00Z',
    isOp: false,
    likes: 12,
    body: 'Привет всем! Дилер из Петербурга, коллекционирую уже 15 лет. Специализируюсь на Российской Империи — преимущественно медные Екатерины II и Павла I. Ищу редкие разновидности крестовиков и пятаков.',
  },
  {
    id: 'p8',
    threadId: 't-gen-1',
    authorLogin: 'collector_petrov',
    authorRole: 'collector',
    createdAt: '2024-01-16T13:00:00Z',
    isOp: false,
    likes: 9,
    body: 'Коллекционер из Москвы. Занимаюсь нумизматикой около 8 лет, начинал с советских юбилейных, но последние 4 года полностью ушёл в Средневековье — чешуя, уделы, домонгольские монеты. Рад оказаться в таком профессиональном сообществе!',
  },
  {
    id: 'p9',
    threadId: 't-gen-1',
    authorLogin: 'ivan_numizmat',
    authorRole: 'dealer',
    createdAt: '2024-01-17T08:30:00Z',
    isOp: false,
    likes: 7,
    body: 'Иван, Казань. Дилер, работаю в основном с материалом Поволжья — Золотая Орда, джучиды. Иногда попадается интересная пластика. Рад видеть здесь серьёзных людей, а не барахолку.',
  },

  // t-exp-1: Как отличить подделку
  {
    id: 'p10',
    threadId: 't-exp-1',
    authorLogin: 'collector_petrov',
    authorRole: 'collector',
    createdAt: '2024-03-15T10:00:00Z',
    isOp: true,
    likes: 28,
    body: `Тема, которая рано или поздно встаёт перед каждым. Делюсь своим опытом выявления новодельной чешуи.

Основные признаки подделки:
— Слишком ровный кружок, идеально центрированный — на оригиналах такого практически не бывает
— Острые края без следов обращения
— Неестественная патина: слишком равномерная или химически нанесённая (запах, реакция на ацетон)
— Рельеф "плывёт" — детали нечёткие, буквы смазаны
— Вес: оригинальная чешуя имеет нормативный вес, у подделок он часто отклоняется

Прошу коллег дополнить и поправить.`,
  },
  {
    id: 'p11',
    threadId: 't-exp-1',
    authorLogin: 'dealer_ivanov',
    authorRole: 'dealer',
    createdAt: '2024-03-15T12:00:00Z',
    isOp: false,
    likes: 18,
    body: `Отличный старт темы. Добавлю несколько пунктов:

Смотрите на гурт. На оригинальной чешуе гурт неровный, рваный — монету рубили ножницами из полосы. У современных подделок гурт часто ровный или со следами опиловки.

Ещё важен металл. Настоящее серебро XVI–XVII вв. содержало около 960 проб, со временем темнеет специфично — пятнами, по кристаллической структуре. Химическая патина ложится иначе.

И конечно — опыт. Возьмите в руки сотню оригиналов, и подделку почувствуете сразу.`,
  },
  {
    id: 'p12',
    threadId: 't-exp-1',
    authorLogin: 'ivan_numizmat',
    authorRole: 'dealer',
    createdAt: '2024-03-15T15:00:00Z',
    isOp: false,
    likes: 11,
    body: 'Добавлю про микроскоп. Поверхность оригинала имеет характерный рельеф от многовекового залегания в земле — микротрещины, кристаллы, следы коррозии. У новодела поверхность под увеличением выглядит "мёртвой", даже если нанесена искусственная патина.',
  },
  {
    id: 'p13',
    threadId: 't-exp-1',
    authorLogin: 'collector_petrov',
    authorRole: 'collector',
    createdAt: '2024-03-16T09:00:00Z',
    isOp: false,
    likes: 6,
    quotedPostId: 'p12',
    body: 'Про микроскоп — абсолютно верно. Пользуюсь USB-микроскопом за 3000 рублей и уже несколько раз он помог вовремя остановиться перед покупкой.',
  },

  // t-exp-2: Помогите определить
  {
    id: 'p14',
    threadId: 't-exp-2',
    authorLogin: 'collector_petrov',
    authorRole: 'collector',
    createdAt: '2024-05-12T13:00:00Z',
    isOp: true,
    likes: 3,
    body: `Коллеги, добрый день. Попалась монета, не могу уверенно атрибутировать. Параметры:

— Серебро, вес ~0.32г
— Диаметр ~11мм, форма неправильная, лопастная
— Аверс: буквы "КН" и что-то ниже — не читается
— Реверс: всадник, похоже на Московский тип, но всадник смотрит влево (нетипично для Ивана III)

Поверхность чёрная, патина естественная. Удар не центрирован, около трети легенды ушло за кружок.

Версии: Иван III переходный тип? Или удел какой-то?`,
  },
  {
    id: 'p15',
    threadId: 't-exp-2',
    authorLogin: 'ivan_numizmat',
    authorRole: 'dealer',
    createdAt: '2024-05-12T14:30:00Z',
    isOp: false,
    likes: 8,
    body: `Интересный вопрос. По описанию "КН" на аверсе — это может быть Кашинский удел, последний период. Всадник влево действительно характерен для ряда удельных дворов.

Попробуйте сверить с Гайдуковым, том 2. Там есть раздел по Кашинским монетам с подробными таблицами.

Если есть возможность — добавьте фото, даже телефонного качества, ещё лучше в косом свете.`,
  },
  {
    id: 'p16',
    threadId: 't-exp-2',
    authorLogin: 'dealer_ivanov',
    authorRole: 'dealer',
    createdAt: '2024-05-12T16:00:00Z',
    isOp: false,
    likes: 5,
    body: 'Поддерживаю версию про удел. Ещё может быть Серпухов или Боровск — там тоже встречаются нетипичные типы всадника. Вес 0.32г скорее говорит в пользу позднего удела, московская чешуя Ивана III была чуть тяжелее.',
  },

  // t-num-1: Литература
  {
    id: 'p17',
    threadId: 't-num-1',
    authorLogin: 'admin',
    authorRole: 'admin',
    createdAt: '2024-01-18T09:00:00Z',
    isOp: true,
    likes: 45,
    body: `Собираем список обязательной литературы для серьёзного изучения русской нумизматики.

**Основное:**
— Гайдуков П.Г. «Русские полуденьги, четверетцы и полушки XIV–XVII вв.» — библия по чешуе
— Мельникова А.С. «Русские монеты от Ивана Грозного до Петра I» — классика
— Корпус русских монет (КРМ) — академическое издание, все тома
— Биткин В.В. «Сводный каталог монет России» — незаменим для Империи

**По удельному периоду:**
— Орешников А.В. — старейший, но до сих пор актуальный
— Янин В.Л. «Денежно-весовые системы русского средневековья»

**Восток:**
— Федоров-Давыдов Г.А. — монеты Золотой Орды
— Марков А.К. — инвентарный каталог

Прошу коллег дополнять!`,
  },
  {
    id: 'p18',
    threadId: 't-num-1',
    authorLogin: 'ivan_numizmat',
    authorRole: 'dealer',
    createdAt: '2024-01-18T11:30:00Z',
    isOp: false,
    likes: 16,
    body: 'Добавлю по Востоку: Сингх «Монеты Средней Азии» незаменим для саманидов и газневидов. По Крыму — Ретовский О.Ф., хотя найти его сейчас сложно, но есть PDF-сканы.',
  },
  {
    id: 'p19',
    threadId: 't-num-1',
    authorLogin: 'collector_petrov',
    authorRole: 'collector',
    createdAt: '2024-01-19T08:00:00Z',
    isOp: false,
    likes: 9,
    body: 'Для начинающих ещё хочу добавить «Монеты России» Узденикова — хороший вводный каталог по Империи с фотографиями. И не забывайте про НЦ (Нумизматический Сборник ГИМ) — там масса интересных статей, часть уже оцифрована.',
  },

  // t-tech-1: Чистка серебра
  {
    id: 'p20',
    threadId: 't-tech-1',
    authorLogin: 'collector_petrov',
    authorRole: 'collector',
    createdAt: '2024-03-20T10:00:00Z',
    isOp: true,
    likes: 38,
    body: `Часто вижу на форумах убитые монеты после неудачной чистки. Делюсь методом, которым пользуюсь уже 6 лет без потерь.

**Принцип:** минимальное вмешательство. Цель — убрать активную коррозию и рыхлые отложения, сохранив патину.

**Что использую:**
1. Первый этап — ванна из дистиллированной воды, 24–48 ч. Размягчает почву и солевые отложения.
2. Механика — деревянная зубочистка, бамбуковая шпажка. Никаких металлических инструментов!
3. Для упорных отложений — 5% раствор лимонной кислоты, но только прицельно и не более 10 минут.
4. Финал — промывка дистиллятом, осушка без нагрева, хранение в инертной капсуле.

**Чего не делать никогда:** ультразвук, полировочные пасты, кислотные ванны целиком.`,
  },
  {
    id: 'p21',
    threadId: 't-tech-1',
    authorLogin: 'dealer_ivanov',
    authorRole: 'dealer',
    createdAt: '2024-03-20T12:00:00Z',
    isOp: false,
    likes: 14,
    body: 'Метод верный. Добавлю: для монет с карбонатными отложениями (белый налёт) хорошо работает триэтаноламин — наносить кисточкой, ждать 15–20 минут. Но только на серебро, медь этим не трогать.',
  },
  {
    id: 'p22',
    threadId: 't-tech-1',
    authorLogin: 'ivan_numizmat',
    authorRole: 'dealer',
    createdAt: '2024-03-21T09:00:00Z',
    isOp: false,
    likes: 10,
    body: 'А как быть с медными монетами в активной "бронзовой болезни"? Там обычная лимонная кислота не помогает, а хлорид продолжает разрушать монету.',
  },
  {
    id: 'p23',
    threadId: 't-tech-1',
    authorLogin: 'collector_petrov',
    authorRole: 'collector',
    createdAt: '2024-03-21T11:00:00Z',
    isOp: false,
    likes: 7,
    quotedPostId: 'p22',
    body: 'Бронзовая болезнь (хлорид меди) — отдельная история. Там нужна консервация: пропитка танином или бензотриазолом. Это уже серьёзная химия, лучше обратиться к реставратору для ценных экземпляров.',
  },

  // t-deal-1: Обмен уделами
  {
    id: 'p24',
    threadId: 't-deal-1',
    authorLogin: 'dealer_ivanov',
    authorRole: 'dealer',
    createdAt: '2024-05-10T10:00:00Z',
    isOp: true,
    likes: 4,
    body: `Ищу коллег для обмена монетами Ростовского удела (XIV–XV вв.).

Предлагаю: несколько тверских монет и ранние московские.
Интересует: Ростов, Ярославль, Углич — любые разновидности.

Качество не ниже F (допускаются дефекты поля, главное — читаемый тип). Цена вопроса — договорная или обмен 1:1 по каталогу.

Пишите в личку или здесь.`,
  },
  {
    id: 'p25',
    threadId: 't-deal-1',
    authorLogin: 'ivan_numizmat',
    authorRole: 'dealer',
    createdAt: '2024-05-10T12:00:00Z',
    isOp: false,
    likes: 2,
    body: 'Есть несколько ростовских, один хороший F+. Напишу подробнее в личке. Тверь интересует — есть что-то конкретное?',
  },

  // t-gen-3: Находки сезона
  {
    id: 'p26',
    threadId: 't-gen-3',
    authorLogin: 'ivan_numizmat',
    authorRole: 'dealer',
    createdAt: '2024-04-10T14:00:00Z',
    isOp: true,
    likes: 22,
    body: `Сезон только начался, а уже есть что показать. В марте с одного поля вышла редкая тверская чека без чёткой атрибуции — такое вижу второй раз в жизни. Отдал на экспертизу, жду результатов.

Коллеги, поделитесь своими находками! Интересны любые периоды.`,
  },
  {
    id: 'p27',
    threadId: 't-gen-3',
    authorLogin: 'dealer_ivanov',
    authorRole: 'dealer',
    createdAt: '2024-04-11T09:00:00Z',
    isOp: false,
    likes: 10,
    body: 'У меня в этом сезоне пока скромнее — несколько чешуй Михаила Фёдоровича с хорошим рельефом. Но главная радость: удалось выкупить небольшую коллекцию 60-х годов у наследников — там есть что поизучать.',
  },
];
