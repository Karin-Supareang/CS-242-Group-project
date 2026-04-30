import os
import asyncio
from datetime import datetime, timedelta, timezone
from database import SessionLocal
from models.assignment import Assignment
from models.category import Category
from models.user import User
from services.EmailService import EmailManager

async def check_deadlines_and_notify():
    """
    Background Task สำหรับเช็ก Deadline ทุกๆ ต้นชั่วโมง (ตามเวลาไทย)
    """
    thai_tz = timezone(timedelta(hours=7))

    while True:
        db = SessionLocal()
        try:
            now_aware = datetime.now(thai_tz)
            now = now_aware.replace(tzinfo=None) # แปลงเป็น Naive datetime ให้ตรงกับ Database ป้องกัน Error
            
            # ดึง User ทั้งหมดมาจัด Priority (ไม่ว่าจะเปิดแจ้งเตือนหรือมีอีเมลหรือไม่)
            users = db.query(User).all()
            print(f"\n🔍 [Notification Job] เริ่มรันรอบใหม่เวลา {now.strftime('%H:%M:%S')} - พบ User ทั้งหมด {len(users)} คน")
            
            email_manager = EmailManager()

            for user in users:
                # ดึงงานทั้งหมดของ User
                all_assignments = db.query(Assignment).join(Assignment.categories).filter(
                    Category.user_id == user.user_id
                ).distinct().all()

                active_assignments = []
                for task in all_assignments:
                    if (task.percentage is not None and task.percentage >= 100) or task.status == 'completed':
                        task.priority = None # งานที่เสร็จแล้ว ให้ Priority เป็น None
                    else:
                        active_assignments.append(task)

                print(f"👤 User: {user.email} (Noti: {user.notification}) - พบงานที่กำลังทำ {len(active_assignments)} งาน")

                # 1. คำนวณและอัปเดต Priority เฉพาะงานที่ยังไม่เสร็จ (เปรียบเทียบจากเวลาทำงานที่เหลือจริงๆ)
                tasks_with_work = []
                for task in active_assignments:
                    est_hours = task.estimated_time if task.estimated_time else 1
                    work_percent_left = (100 - (task.percentage or 0)) / 100.0
                    hours_needed = est_hours * work_percent_left
                    tasks_with_work.append((hours_needed, task))
                
                # เรียงลำดับจากงานที่ต้องใช้เวลาทำเยอะสุดไปน้อยสุด (มากไปน้อย)
                tasks_with_work.sort(key=lambda x: x[0], reverse=True)
                
                for i, (hours_needed, task) in enumerate(tasks_with_work):
                    task.priority = i + 1 # ให้ priority ไล่จาก 1 ไปจนถึงจำนวนงานทั้งหมดที่มี

                # 2. เช็กเวลาและส่งแจ้งเตือนใกล้ Deadline (เฉพาะคนที่เปิด Noti และมี Email)
                if user.notification and user.email:
                    for task in active_assignments:
                        if not task.deadline:
                            print(f"  ⏩ ข้ามงาน '{task.title}' - ไม่มีกำหนดส่ง")
                            continue
                        
                        display_name = user.name or user.username or user.email.split('@')[0]
                        delta = task.deadline - now
                        hours_left = delta.total_seconds() / 3600.0
                        print(f"  ⏰ งาน '{task.title}' - เหลือเวลา {hours_left:.2f} ชั่วโมง")

                        subject = None
                        message = None
                        
                        # เช็กเงื่อนไขเวลา (ใช้ช่วงกว้าง 1 ชม. เพราะ loop รันทุก 1 ชม. จะได้ไม่ส่งซ้ำ)
                        if 23 <= hours_left <= 24:
                            subject = f"[แจ้งเตือน] งาน '{task.title}' จะถึงกำหนดส่งในอีก 1 วัน!"
                            message = f"สวัสดีคุณ {display_name},\n\nงาน '{task.title}' กำลังจะถึงกำหนดส่งในอีก 1 วัน!\n📅 กำหนดส่ง: {task.deadline.strftime('%d/%m/%Y %H:%M')}\n\nอย่าลืมเข้าไปจัดการงานให้เรียบร้อยนะครับ\n\nจากระบบ Smart Academic Plan"
                        elif 4 <= hours_left <= 6:
                            subject = f"[ด่วน] งาน '{task.title}' เหลือเวลาอีก 6 ชั่วโมงสุดท้าย!"
                            message = f"สวัสดีคุณ {display_name},\n\nงาน '{task.title}' เหลือเวลาอีก 6 ชั่วโมงสุดท้ายแล้ว! รีบจัดการให้เสร็จนะครับ!"
                        elif 2 <= hours_left <= 4:
                            subject = f"[ด่วนมาก] งาน '{task.title}' เหลือเวลาอีก 4 ชั่วโมงสุดท้าย!"
                            message = f"สวัสดีคุณ {display_name},\n\nงาน '{task.title}' เหลือเวลาอีก 4 ชั่วโมงสุดท้าย!"
                        elif 0 <= hours_left <= 2:
                            subject = f"[โคตรด่วน] งาน '{task.title}' เหลือเวลาอีก 2 ชั่วโมงสุดท้าย!!!"
                            message = f"สวัสดีคุณ {display_name},\n\nไฟลนก้นแล้ว! งาน '{task.title}' เหลือเวลาอีกแค่ 2 ชั่วโมงสุดท้าย! ปั่นด่วน!"

                        if subject and message:
                            print(f"    ✅ เข้าเงื่อนไขเตือน! กำลังพยายามส่งอีเมล: {subject}")
                            await email_manager.send_email(user.email, subject, message)
                        else:
                            print(f"    ❌ ไม่เข้าเงื่อนไขส่งอีเมล (เวลาที่เหลือไม่อยู่ในช่วง 1-2, 3-4, 5-6 หรือ 23-24 ชม.)")
                else:
                    print("  ⏩ ข้ามการแจ้งเตือน - User ปิดแจ้งเตือนหรือไม่มีอีเมล")
            
            # บันทึกการเปลี่ยนแปลง Priority ของงานทั้งหมดลง Database
            db.commit()
                        
        except Exception as e:
            print(f"Error in Notification Job: {e}")
        finally:
            db.close()
        
        env = os.getenv("APP_ENV", "production")
        if env == "development":
            print("✅ [Development Mode] Notification Job ทำงานเสร็จสิ้น รออีก 10 วินาทีเพื่อรันรอบถัดไป...")
            await asyncio.sleep(10)
        else:
            now_after = datetime.now(thai_tz)
            next_hour = (now_after + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)
            sleep_seconds = (next_hour - now_after).total_seconds()
            await asyncio.sleep(sleep_seconds)
