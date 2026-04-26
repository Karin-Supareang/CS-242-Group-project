import os
import datetime
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from models.user import User
from models.assignment import Assignment

class GoogleCalendarManager:
    def __init__(self):
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        self.calendar_name = "Smart Academic Plan"

    def _get_credentials(self, user: User):
        if not user.google_access_token or not user.google_refresh_token:
            return None
        return Credentials(
            token=user.google_access_token,
            refresh_token=user.google_refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=self.client_id,
            client_secret=self.client_secret
        )

    def _get_or_create_calendar(self, service):
        """ค้นหาปฏิทินที่ชื่อ Smart Academic Plan ถ้าไม่มีให้สร้างใหม่"""
        page_token = None
        calendar_id = None
        while True:
            calendar_list = service.calendarList().list(pageToken=page_token).execute()
            for entry in calendar_list['items']:
                if entry['summary'] == self.calendar_name:
                    calendar_id = entry['id']
                    break
            page_token = calendar_list.get('nextPageToken')
            if not page_token or calendar_id:
                break

        if not calendar_id:
            calendar = {'summary': self.calendar_name, 'timeZone': 'Asia/Bangkok'}
            created_calendar = service.calendars().insert(body=calendar).execute()
            calendar_id = created_calendar['id']

        return calendar_id

    def sync_assignment(self, user: User, assignment: Assignment) -> str | None:
        """สร้างหรืออัปเดต Event ลงใน Google Calendar"""
        creds = self._get_credentials(user)
        if not creds:
            return None

        try:
            service = build('calendar', 'v3', credentials=creds)
            calendar_id = self._get_or_create_calendar(service)

            estimated_hours = assignment.estimated_time if assignment.estimated_time else 1
            end_time = assignment.deadline
            start_time = end_time - datetime.timedelta(hours=estimated_hours)

            # ตั้งค่าแจ้งเตือน (หน่วยเป็นนาทีก่อนที่กิจกรรมจะเริ่ม)
            reminders = [
                {'method': 'popup', 'minutes': 24 * 60}, # แจ้งล่วงหน้า 1 วัน (ก่อนเวลาเริ่ม)
                {'method': 'popup', 'minutes': 0},       # แจ้งตอนเวลาเริ่มกิจกรรม
            ]
            
            # ถ้ายังทำไม่เสร็จ (percentage < 100) ให้แจ้งเตือนอีเมลเพิ่ม
            if assignment.percentage is None or assignment.percentage < 100:
                reminders.append({'method': 'email', 'minutes': 12 * 60})

            event_body = {
                'summary': f"[{assignment.status.upper()}] {assignment.title}",
                'description': assignment.description or "No description provided.",
                'start': {'dateTime': start_time.isoformat() + 'Z', 'timeZone': 'Asia/Bangkok'},
                'end': {'dateTime': end_time.isoformat() + 'Z', 'timeZone': 'Asia/Bangkok'},
                'reminders': {'useDefault': False, 'overrides': reminders},
                # เปลี่ยนสี: ถ้าทำเสร็จแล้ว (100%) ให้เป็นสีเขียว (id: 2) ถ้ายังไม่เสร็จเป็นสีแดง (id: 11)
                'colorId': '2' if (assignment.percentage is not None and assignment.percentage == 100) else '11'
            }

            if assignment.google_event_id:
                try:
                    event = service.events().update(calendarId=calendar_id, eventId=assignment.google_event_id, body=event_body).execute()
                    return event['id']
                except HttpError as e:
                    if e.resp.status == 404: # กรณีผู้ใช้เผลอลบ Event เองในปฏิทิน ให้สร้างใหม่
                        event = service.events().insert(calendarId=calendar_id, body=event_body).execute()
                        return event['id']
            else:
                event = service.events().insert(calendarId=calendar_id, body=event_body).execute()
                return event['id']
        except Exception as e:
            print(f"Error syncing with Google Calendar: {e}")
            return None

    def delete_event(self, user: User, event_id: str):
        """ลบ Event ออกจาก Google Calendar"""
        creds = self._get_credentials(user)
        if creds and event_id:
            try:
                service = build('calendar', 'v3', credentials=creds)
                calendar_id = self._get_or_create_calendar(service)
                service.events().delete(calendarId=calendar_id, eventId=event_id).execute()
            except Exception:
                pass # ข้ามไปถ้าเกิด Error (เช่น Event โดนลบไปแล้ว)