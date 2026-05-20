
export function getTelegramBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || '';
}

export function getTelegramAdminChatId() {
  return (
    process.env.TELEGRAM_ADMIN_CHAT_ID?.trim()
    || process.env.TELEGRAM_CHAT_ID?.trim()
    || process.env.CHAT_ID?.trim()
    || ''
  );
}

export function getTelegramConfigStatus() {
  return {
    botTokenConfigured: Boolean(getTelegramBotToken()),
    adminChatConfigured: Boolean(getTelegramAdminChatId()),
  };
}

export async function sendTelegramMessage(botToken: string, chatId: number | string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });

  if (response.ok) {
    return { ok: true, status: response.status, body: '' };
  }

  const body = await response.text().catch(() => '');
  return { ok: false, status: response.status, body };
}

export async function sendTelegramDocument(
  botToken: string,
  chatId: number | string,
  document: Blob,
  fileName: string,
  caption: string
) {
  const formData = new FormData();
  formData.append('chat_id', String(chatId));
  formData.append('caption', caption);
  formData.append('document', document, fileName);

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
    method: 'POST',
    body: formData,
  });

  if (response.ok) {
    return { ok: true, status: response.status, body: '' };
  }

  const body = await response.text().catch(() => '');
  return { ok: false, status: response.status, body };
}
