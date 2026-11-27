import { spawn } from 'node:child_process';

function deliver(recipient, ticketId) {
  const message = [
    'To: ' + recipient,
    'Subject: MurdiliMax support request',
    'Message-ID: <support-' + ticketId + '@murdilimax.com>',
    '',
    'A new support request is waiting in the administrator inbox.',
    'https://murdilimax.com/admin.html',
    '',
  ].join('\n');
  return new Promise((resolve, reject) => {
    const child = spawn('/usr/sbin/sendmail', ['-i', '-t'], {
      stdio: ['pipe', 'ignore', 'ignore'], timeout: 15000, killSignal: 'SIGKILL',
    });
    child.once('error', reject);
    child.stdin.once('error', reject);
    child.once('close', code => code === 0 ? resolve() : reject(new Error('mail unavailable')));
    child.stdin.end(message);
  });
}

export async function sendPending(db, recipient, send = deliver) {
  if (!recipient || !/^[^\s@<>:,;]+@[^\s@<>:,;]+\.[^\s@<>:,;]+$/u.test(recipient)) return;
  const {rows} = await db.query(`UPDATE mm_support_tickets SET notify_after = NOW() + INTERVAL '15 minutes'
    WHERE id = (SELECT id FROM mm_support_tickets
      WHERE notify_after <= NOW() AND answered_at IS NULL
      ORDER BY notify_after LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING id`);
  if (!rows.length) return;
  const {id} = rows[0];
  await send(recipient, id);
  await db.query('UPDATE mm_support_tickets SET notify_after = NULL WHERE id = $1', [id]);
}

export function startSupportMail(db) {
  const recipient = process.env.SUPPORT_NOTIFY_TO;
  if (!recipient) return;
  const processNext = () => sendPending(db, recipient).catch(() => {
    console.warn('Support notification pending; will retry.');
  });
  void processNext();
  setInterval(processNext, 60000).unref();
}
