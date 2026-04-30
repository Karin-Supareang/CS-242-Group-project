import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class EmailManager:
    """
    Class สำหรับจัดการการส่งข้อความผ่าน Email (SMTP)
    """
    def __init__(self):
        # ค่าเริ่มต้นสำหรับ Gmail SMTP
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.sender_email = os.getenv("SENDER_EMAIL")
        self.sender_password = os.getenv("SENDER_PASSWORD")

    async def send_email(self, to_email: str, subject: str, body: str):
        """
        ฟังก์ชันสำหรับส่งอีเมล
        """
        if not self.sender_email or not self.sender_password:
            print("ไม่ได้ตั้งค่า SENDER_EMAIL และ SENDER_PASSWORD ในไฟล์ .env (ข้ามการส่งอีเมล)")
            return

        msg = MIMEMultipart()
        msg['From'] = self.sender_email
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain', 'utf-8')) # ใส่ utf-8 รองรับภาษาไทย

        try:
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.sender_email, self.sender_password)
            server.send_message(msg)
            server.quit()
            print(f"ส่งอีเมลแจ้งเตือนไปยัง {to_email} สำเร็จ")
        except Exception as e:
            print(f"เกิดข้อผิดพลาดในการส่งอีเมลไปยัง {to_email}: {e}")
