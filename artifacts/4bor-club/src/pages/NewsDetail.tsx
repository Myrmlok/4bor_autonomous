import React from 'react';
import { Link, useParams } from 'wouter';
import { ChevronLeft, Calendar } from 'lucide-react';
import { newsList } from '../data/mock';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Lock } from 'lucide-react';

// [STUB] Тела статей хранятся здесь в виде заглушек.
// При подключении бэкенда заменить на GET /api/news/:id
const ARTICLE_BODIES: Record<string, string[]> = {
  n1: [
    'Весенний аукцион 2024 завершился с рекордными показателями. Общий оборот торгов составил более 2,4 млн рублей — на 38% выше прошлогоднего результата.',
    'Наибольший интерес участников вызвали лоты из раздела «Российская Империя». Денга Ивана Грозного в отличном состоянии ушла за 47 000 ₽ при стартовой цене 15 000 ₽.',
    'В аукционе приняли участие 83 дилера из 14 городов России. Средний чек одной сделки вырос до 28 500 ₽. Следующий аукцион запланирован на осень — следите за объявлениями.',
    'Организаторы благодарят всех участников за активность и доверие к платформе. Все выигранные лоты будут отправлены в течение 5 рабочих дней.',
  ],
  n2: [
    'В раздел «Российская Империя» добавлено 34 новых лота от проверенных дилеров клуба.',
    'Особого внимания заслуживают монеты периода Петра I: медные пятаки 1720-х годов в состоянии VF и несколько серебряных полтин Екатерины I.',
    'Также представлены редкие разновидности рублей Николая II 1896–1915 годов из коллекции одного из старейших участников клуба. Цены — от 8 500 ₽.',
    'Для просмотра всех новых поступлений перейдите в раздел «Эксклюзивы от дилеров» и отфильтруйте по тематике.',
  ],
  n3: [
    'Администрация клуба публикует обновлённые правила работы закрытого раздела «Эксклюзивы».',
    '1. Доступ только для участников со статусом «Дилер». Коллекционеры могут запросить повышение статуса через личный кабинет.',
    '2. Лот считается зарезервированным сразу после подтверждения покупки. Отмена возможна только в течение 2 часов.',
    '3. Споры по сделкам рассматриваются модераторами в течение 48 часов. Решение модератора является окончательным.',
    '4. Запрещено перепродавать приобретённые лоты без выдержки не менее 30 дней.',
  ],
  n4: [
    'Открыты новые разделы по тематике «Металлопластика». Теперь в каталоге представлены четыре полноценные группы: иконы-складни, энколпионы, панагии и кресты-тельники.',
    'Все лоты прошли верификацию у двух независимых экспертов клуба. Материал: бронза, медь, серебро XII–XIX вв.',
    'Коллекционеры могут участвовать в аукционах этого раздела на общих основаниях. Стартовые цены — от 2 500 ₽.',
  ],
};

const DEFAULT_BODY = [
  'Полная версия статьи доступна участникам клуба. Свяжитесь с администратором для получения доступа к расширенному архиву новостей.',
];

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  if (user?.role === 'collector') {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-serif font-semibold mb-4">Раздел новостей закрыт</h1>
          <p className="text-muted-foreground mb-8">Новости клуба доступны только для дилеров.</p>
          <Link href="/"><Button variant="outline">На главную</Button></Link>
        </div>
      </div>
    );
  }

  const article = newsList.find(n => n.id === id);

  if (!article) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Link href="/news" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ChevronLeft className="w-4 h-4 mr-1" /> Все новости
        </Link>
        <p className="text-muted-foreground">Статья не найдена.</p>
      </div>
    );
  }

  const body = ARTICLE_BODIES[id] || DEFAULT_BODY;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/news" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8">
        <ChevronLeft className="w-4 h-4 mr-1" /> Все новости
      </Link>

      {/* Cover */}
      <div className="w-full aspect-[16/6] overflow-hidden bg-muted mb-8">
        <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 font-mono">
        <Calendar className="w-3.5 h-3.5" />
        {new Date(article.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>

      <h1 className="text-3xl font-serif font-semibold leading-tight mb-8 text-foreground">
        {article.title}
      </h1>

      {/* Body */}
      <div className="prose prose-neutral max-w-none space-y-5">
        {body.map((para, i) => (
          <p key={i} className="text-foreground/85 leading-relaxed text-[15px]">{para}</p>
        ))}
      </div>

      {/* [STUB] Комментарии — заглушка. При подключении бэкенда добавить POST /api/news/:id/comments */}
      <div className="mt-12 pt-8 border-t border-border/50">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Обсуждение</h2>
        <p className="text-sm text-muted-foreground italic">
          Раздел комментариев будет доступен после подключения к серверу.
        </p>
      </div>
    </div>
  );
}
