import React from 'react';

export default function GanttChart({ tasks }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  // หาจำนวนวันในเดือนปัจจุบัน
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div style={{ overflowX: 'auto', marginTop: '20px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginTop: 0 }}>Gantt Chart (Timeline) ประจำเดือนนี้</h3>
      <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${daysInMonth}, minmax(30px, 1fr))`, gap: '2px', backgroundColor: '#e2e8f0', padding: '2px', borderRadius: '4px' }}>
        
        {/* ส่วนหัวตาราง (วันที่ 1 - สิ้นเดือน) */}
        <div style={{ fontWeight: 'bold', backgroundColor: '#f8fafc', padding: '10px', borderTopLeftRadius: '4px' }}>ชื่องาน</div>
        {daysArray.map(day => (
          <div key={day} style={{ textAlign: 'center', backgroundColor: '#f8fafc', padding: '10px 5px', fontSize: '12px', fontWeight: day === today.getDate() ? 'bold' : 'normal', color: day === today.getDate() ? 'red' : 'black' }}>
            {day}
          </div>
        ))}

        {/* ส่วนข้อมูลแถวงาน (Rows) */}
        {tasks.map(task => {
          if (!task.deadline) return null;
          const deadlineDate = new Date(task.deadline);
          // คำนวณวันเริ่มต้นโดยลบจำนวนชั่วโมงแทน (1 ชั่วโมง = 60*60*1000 มิลลิวินาที)
          const startDate = new Date(deadlineDate.getTime() - ((task.estimated_time || 1) * 60 * 60 * 1000));

          let colStart = startDate.getDate();
          let colEnd = deadlineDate.getDate();

          // ป้องกันแถบสีทะลุเดือน
          if (startDate.getMonth() < month || startDate.getFullYear() < year) colStart = 1;
          if (deadlineDate.getMonth() > month || deadlineDate.getFullYear() > year) colEnd = daysInMonth;
          if (startDate.getMonth() > month || deadlineDate.getMonth() < month) return null; // ไม่แสดงงานที่ไม่ได้อยู่ในเดือนนี้

          return (
            <React.Fragment key={task.task_id}>
              <div style={{ backgroundColor: 'white', padding: '8px', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderBottom: '1px solid #e2e8f0' }}>
                {task.title}
              </div>
              {/* ตัวแถบสีแนวยาว */}
              <div style={{ 
                gridColumn: `${colStart + 1} / span ${(colEnd - colStart) + 1}`, 
                backgroundColor: task.percentage >= 100 ? '#10b981' : (task.priority === 1 ? '#ef4444' : '#3b82f6'), 
                borderRadius: '4px',
                marginTop: '6px',
                marginBottom: '6px',
                height: '24px'
              }}></div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
