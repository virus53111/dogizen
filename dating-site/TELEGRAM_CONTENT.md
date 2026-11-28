# Telegram Content Engine

Target: @SinfulLiness only. One editorial post per day at 18:00–18:59 Europe/Riga, with seven rotating templates. Public articles, directory and date game only. No direct messages or profile publication.

## Enable on QDE

1. Confirm that @SinfulLiness is the intended channel or group. Add a dedicated bot (recommended), or the existing bot if appropriate. Grant only the rights required to post. For a channel, the bot must be an administrator with permission to post messages.
2. Store the bot token in the existing protected server environment, under MM_TELEGRAM_CONTENT_BOT_TOKEN. Do not commit the token, paste it into chat, or include it in logs. The authentication integration is unchanged.
3. Set MM_TELEGRAM_CONTENT_ENABLED=1 and restart the existing service using its normal deployment procedure.
4. Open /admin.html as the verified owner. The Telegram panel reports the configuration and recent delivery history. Configuration does not prove that the bot has permission to post: the first successful send confirms that.
5. Disable by setting MM_TELEGRAM_CONTENT_ENABLED=0 and restarting. No posts are sent by default.

The database ledger reserves a day before sending. A failed or uncertain send is not retried automatically, to avoid duplicate posts. After downtime the worker does not send missed posts in bulk. No extra services or subscriptions are required.
