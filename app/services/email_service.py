import logging
import resend

from app.core.config import settings

logger = logging.getLogger(__name__)


WELCOME_HTML = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:60px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 30px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;padding:12px 24px;">
                    <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:1px;">TRADEMIND</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#1a1a2e;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:48px 40px 36px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <div style="width:64px;height:64px;background:linear-gradient(135deg,#6366f1,#a78bfa);border-radius:16px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
                      <span style="font-size:32px;line-height:1;">&#x1F4C8;</span>
                    </div>
                    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.3px;">
                      Добро пожаловать, {name}!
                    </h1>
                    <p style="color:#94a3b8;margin:10px 0 0;font-size:15px;line-height:1.5;">
                      Ваш аккаунт успешно создан
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 24px;">
                      Рады приветствовать вас в <strong style="color:#e2e8f0;">TradeMind</strong> &mdash; 
                      AI-платформе для профессионального анализа торговых решений.
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:rgba(99,102,241,0.08);border-radius:12px;padding:20px;border:1px solid rgba(99,102,241,0.15);">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="40" valign="top" style="padding:0 16px 0 0;">
                                <span style="font-size:20px;line-height:1;">&#x1F4DD;</span>
                              </td>
                              <td>
                                <h3 style="color:#e2e8f0;margin:0 0 4px;font-size:15px;font-weight:600;">Дневник сделок</h3>
                                <p style="color:#94a3b8;margin:0;font-size:14px;line-height:1.5;">
                                  Записывайте и структурируйте каждую сделку
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;"></td>
                      </tr>
                      <tr>
                        <td style="background:rgba(139,92,246,0.08);border-radius:12px;padding:20px;border:1px solid rgba(139,92,246,0.15);">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="40" valign="top" style="padding:0 16px 0 0;">
                                <span style="font-size:20px;line-height:1;">&#x1F916;</span>
                              </td>
                              <td>
                                <h3 style="color:#e2e8f0;margin:0 0 4px;font-size:15px;font-weight:600;">AI-анализ</h3>
                                <p style="color:#94a3b8;margin:0;font-size:14px;line-height:1.5;">
                                  Получайте глубинный разбор ошибок и паттернов
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;"></td>
                      </tr>
                      <tr>
                        <td style="background:rgba(167,139,250,0.08);border-radius:12px;padding:20px;border:1px solid rgba(167,139,250,0.15);">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="40" valign="top" style="padding:0 16px 0 0;">
                                <span style="font-size:20px;line-height:1;">&#x1F3E6;</span>
                              </td>
                              <td>
                                <h3 style="color:#e2e8f0;margin:0 0 4px;font-size:15px;font-weight:600;">Дашборд</h3>
                                <p style="color:#94a3b8;margin:0;font-size:14px;line-height:1.5;">
                                  Отслеживайте метрики и прогресс в реальном времени
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <div style="text-align:center;margin:36px 0 0;">
                      <a href="{frontend_url}/app"
                         style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;
                                padding:16px 48px;border-radius:12px;font-size:16px;font-weight:700;letter-spacing:0.3px;
                                box-shadow:0 4px 14px rgba(99,102,241,0.4);">
                        Перейти в дашборд
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background:#111827;padding:24px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
                    <p style="color:#64748b;font-size:13px;margin:0 0 6px;line-height:1.5;">
                      TradeMind AI &mdash; ваш персональный AI-ассистент в трейдинге
                    </p>
                    <p style="color:#475569;font-size:12px;margin:0;">
                      Если вы не создавали аккаунт, просто проигнорируйте это письмо
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_welcome_email(to_email: str, name: str) -> bool:
    if not settings.resend_api_key:
        logger.warning("RESEND_API_KEY not configured — skipping welcome email")
        return False

    try:
        resend.api_key = settings.resend_api_key

        params: resend.Emails.SendParams = {
            "from": settings.resend_from_email,
            "to": [to_email],
            "subject": "Добро пожаловать в TradeMind!",
            "html": WELCOME_HTML.format(
                name=name or "Trader",
                frontend_url=settings.frontend_url.rstrip("/"),
            ),
        }

        resend.Emails.send(params)
        logger.info("Welcome email sent to %s", to_email)
        return True

    except Exception as e:
        logger.error("Failed to send welcome email to %s: %s", to_email, e)
        return False
