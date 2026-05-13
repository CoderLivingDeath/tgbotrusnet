export const CB = {
  CAT: 'cat_',
  FAQ: 'faq_',
  MENU: 'menu',
  SCENE_CAT: 'scene_cat_',
  SCENE_FAQ: 'scene_faq_',
  SCENE_MENU: 'scene_menu',

} as const;

export const COMMANDS = {
  SUPPORT: 'support',
  END: 'end',
  MENU: 'menu',
} as const;

export const MESSAGES = {
  NO_ACTIVE_CHAT: 'Нет активного чата. Используйте /support для начала чата.',
  USER_BANNED: 'Вы заблокированы. Обратитесь к администратору.',
  NO_OPERATORS: 'Нет доступных операторов. Попробуйте позже.',
  CHAT_ENDED: 'Чат завершён. Спасибо за обращение!',
  ERROR_GENERIC: 'Произошла ошибка. Попробуйте позже.',
} as const;