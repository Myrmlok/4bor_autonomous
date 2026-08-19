<?php
/**
 * Forum categories configuration
 * These are hardcoded as they define access control
 */

return [
    [
        'id' => 'c-announce',
        'name' => 'Объявления администрации',
        'description' => 'Важные новости и правила клуба',
        'icon' => 'megaphone',
        'accessRoles' => ['admin', 'dealer', 'collector']
    ],
    [
        'id' => 'c-general',
        'name' => 'Общий чат',
        'description' => 'Свободное общение участников',
        'icon' => 'message-circle',
        'accessRoles' => ['admin', 'dealer', 'collector']
    ],
    [
        'id' => 'c-expertise',
        'name' => 'Атрибуция и оценка',
        'description' => 'Помощь в определении монет',
        'icon' => 'search',
        'accessRoles' => ['admin', 'dealer', 'collector']
    ],
    [
        'id' => 'c-deals',
        'name' => 'Сделки и переговоры',
        'description' => 'Закрытый раздел для дилеров',
        'icon' => 'handshake',
        'accessRoles' => ['admin', 'dealer']
    ],
    [
        'id' => 'c-numizmatika',
        'name' => 'Нумизматика',
        'description' => 'Обсуждение монет и истории',
        'icon' => 'coins',
        'accessRoles' => ['admin', 'dealer', 'collector']
    ],
    [
        'id' => 'c-tech',
        'name' => 'Хранение и чистка',
        'description' => 'Вопросы сохранности коллекций',
        'icon' => 'shield',
        'accessRoles' => ['admin', 'dealer', 'collector']
    ]
];
