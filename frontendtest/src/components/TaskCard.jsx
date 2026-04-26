import React from 'react';

export default function TaskCard({ task, onEdit, onDelete }) {
  const isCompleted = task.percentage >= 100 || task.status === 'completed';
  
  return (
    <div style={{ backgroundColor: 'white', borderLeft: `5px solid ${isCompleted ? '#10b981' : (task.priority === 1 ? '#ef4444' : '#3b82f6')}`, padding: '20px', marginBottom: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
      <div style={{ flex: '1 1 300px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: isCompleted ? '#64748b' : '#0f172a', textDecoration: isCompleted ? 'line-through' : 'none' }}>{task.title}</h4>
        <p style={{ margin: '0', fontSize: '14px', color: '#64748b' }}>{task.description || 'ไม่มีคำอธิบาย'}</p>
        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
          <button onClick={() => onEdit(task)} style={{ padding: '6px 12px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>แก้ไข</button>
          <button onClick={() => onDelete(task.task_id)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>ลบ</button>
        </div>
      </div>
      <div style={{ flex: '1 1 200px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '5px', fontSize: '14px' }}>
        <div style={{ color: isCompleted ? '#10b981' : '#ef4444', fontWeight: 'bold', marginBottom: '5px' }}>
          ⏰ {task.deadline ? new Date(task.deadline).toLocaleString('th-TH') : 'ไม่มีกำหนด'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>🔥 Priority: <strong style={{ color: task.priority === 1 ? '#ef4444' : '#333' }}>{task.priority ? `#${task.priority}` : '-'}</strong></span>
          <span>⏱️ ประเมินเวลา: <strong>{task.estimated_time || 1} ชม.</strong></span>
        </div>
        <div style={{ marginTop: '8px', backgroundColor: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${task.percentage || 0}%`, backgroundColor: isCompleted ? '#10b981' : '#3b82f6', height: '100%' }}></div>
        </div>
      </div>
    </div>
  );
}
