import React, { useState, useEffect } from 'react';
import api from '../api.js';
import TaskCard from '../components/TaskCard.jsx';
import GanttChart from '../components/GanttChart.jsx';

export default function DashboardPage({ token, logout }) {
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('deadline'); // 'deadline', 'priority', 'calendar', 'gantt'
  
  // State สำหรับจัดการ Modal เพิ่ม/แก้ไขงาน
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', deadline: '', estimated_time: '', percentage: 0, status: 'pending'
  });

  useEffect(() => {
    if (token) fetchTasks();
  }, [token]);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/assignment/get/all');
      setTasks(response.data);
    } catch (err) {
      console.error('Error fetching tasks', err);
      if (err.response?.status === 401) logout();
    }
  };

  // ฟังก์ชันเปิดฟอร์มเพื่อ "เพิ่มงานใหม่"
  const openAddModal = () => {
    setCurrentTask(null);
    setFormData({ title: '', description: '', deadline: '', estimated_time: '', percentage: 0, status: 'pending' });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  // ฟังก์ชันเปิดฟอร์มเพื่อ "แก้ไขงาน"
  const openEditModal = (task) => {
    setCurrentTask(task);
    // แปลงเวลาให้เข้ากับช่อง input type="datetime-local"
    let formattedDeadline = '';
    if (task.deadline) {
      const d = new Date(task.deadline);
      formattedDeadline = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }
    setFormData({
      title: task.title, description: task.description || '', deadline: formattedDeadline, 
      estimated_time: task.estimated_time || '', percentage: task.percentage || 0, status: task.status || 'pending'
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  // ฟังก์ชันลบงาน
  const handleDelete = async (taskId) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบงานนี้?')) {
      try {
        await api.delete(`/assignment/delete/${taskId}`);
        fetchTasks(); // โหลดข้อมูลใหม่
      } catch (err) { alert('ลบงานไม่สำเร็จ'); }
    }
  };

  // ฟังก์ชันบันทึกข้อมูล (ใช้ได้ทั้ง Add และ Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        ...formData, 
        estimated_time: formData.estimated_time ? Number(formData.estimated_time) : null, 
        percentage: Number(formData.percentage) 
      };
      if (payload.percentage >= 100) payload.status = 'completed'; // ถ้าเต็ม 100% ให้สถานะเป็นเสร็จสิ้น

      let taskResponse;
      if (currentTask) { // Editing existing task
        taskResponse = await api.patch(`/assignment/update/${currentTask.task_id}`, payload);
      } else { // Creating new task
        taskResponse = await api.post('/assignment/post', payload);
      }

      // หลังจากสร้าง/อัปเดตงานแล้ว ถ้ามีไฟล์แนบมา ให้ทำการอัปโหลด
      const taskId = taskResponse.data.task_id;
      if (selectedFile && taskId) {
        const uploadFormData = new FormData();
        uploadFormData.append('task_id', taskId);
        uploadFormData.append('file', selectedFile);
        await api.post('/assignment/upload', uploadFormData);
      }

      setIsModalOpen(false);
      fetchTasks();
    } catch (err) { alert('บันทึกไม่สำเร็จ: ' + (err.response?.data?.detail || err.message)); }
  };

  const sortedByDeadline = [...tasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  const sortedByPriority = [...tasks].sort((a, b) => {
    if (a.priority === null) return 1;
    if (b.priority === null) return -1;
    return a.priority - b.priority;
  });

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
      {/* Sidebar เมนูด้านซ้าย */}
      <div style={{ width: '260px', backgroundColor: 'white', padding: '25px 20px', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 5px rgba(0,0,0,0.05)', zIndex: 10 }}>
        <h2 style={{ margin: '0 0 30px 0', color: '#1e293b', fontSize: '20px' }}>📚 Smart Academic Plan</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          <button onClick={() => setView('deadline')} style={view === 'deadline' ? activeMenuBtn : menuBtn}>📅 เรียงตาม Deadline</button>
          <button onClick={() => setView('priority')} style={view === 'priority' ? activeMenuBtn : menuBtn}>🔥 เรียงตาม Priority</button>
          <button onClick={() => setView('calendar')} style={view === 'calendar' ? activeMenuBtn : menuBtn}>🗓️ ปฏิทิน (เดือน)</button>
          <button onClick={() => setView('gantt')} style={view === 'gantt' ? activeMenuBtn : menuBtn}>📊 Gantt Chart (ตารางงาน)</button>
        </div>

        <button onClick={logout} style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: 'auto' }}>ออกจากระบบ (Logout)</button>
      </div>

      {/* Main Content พื้นที่แสดงข้อมูลด้านขวา */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button onClick={openAddModal} style={{ backgroundColor: '#10b981', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 2px 4px rgba(16,185,129,0.3)' }}>+ เพิ่มงานใหม่</button>
        </div>

      {/* มุมมอง Deadline */}
      {view === 'deadline' && (
        <div>
          <h3 style={{ color: '#334155' }}>งานทั้งหมด (เรียงตามกำหนดส่งใกล้สุด)</h3>
          {sortedByDeadline.length === 0 ? <p>ไม่มีงานในระบบ</p> : sortedByDeadline.map(t => <TaskCard key={t.task_id} task={t} onEdit={openEditModal} onDelete={handleDelete} />)}
        </div>
      )}

      {/* มุมมอง Priority */}
      {view === 'priority' && (
        <div>
          <h3 style={{ color: '#334155' }}>งานทั้งหมด (เรียงตามความด่วน)</h3>
          {sortedByPriority.length === 0 ? <p>ไม่มีงานในระบบ</p> : sortedByPriority.map(t => <TaskCard key={t.task_id} task={t} onEdit={openEditModal} onDelete={handleDelete} />)}
        </div>
      )}

      {/* มุมมอง Calendar แบบ List ของเดือน */}
      {view === 'calendar' && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Schedule (ปฏิทินงาน)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
            {sortedByDeadline.map(t => {
              if(!t.deadline) return null;
              const d = new Date(t.deadline);
              const isCompleted = t.percentage >= 100 || t.status === 'completed';
              return (
                <div key={t.task_id} style={{ border: `2px solid ${isCompleted ? '#10b981' : '#cbd5e1'}`, padding: '10px', borderRadius: '8px', backgroundColor: isCompleted ? '#ecfdf5' : '#f8fafc' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', color: isCompleted ? '#059669' : '#334155' }}>{d.getDate()}</div>
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>{d.toLocaleString('th-TH', { month: 'short', year: 'numeric' })}</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t.title}</div>
                  <div style={{ fontSize: '12px', color: '#ef4444' }}>{d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* มุมมอง Gantt Chart */}
      {view === 'gantt' && <GanttChart tasks={tasks} />}

      {/* Modal Popup สำหรับเพิ่ม/แก้ไขงาน */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '400px', maxWidth: '90%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0 }}>{currentTask ? '✏️ แก้ไขงาน' : '✨ เพิ่มงานใหม่'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div><label style={labelStyle}>ชื่องาน</label><input required name="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} style={inputStyle} /></div>
              <div><label style={labelStyle}>รายละเอียด</label><textarea name="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={inputStyle} rows="3" /></div>
              <div><label style={labelStyle}>กำหนดส่ง</label><input required type="datetime-local" name="deadline" value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} style={inputStyle} /></div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>ประเมินเวลา (ชั่วโมง)</label>
                  <input type="number" min="1" name="estimated_time" placeholder="ปล่อยว่างให้ AI ประเมิน" value={formData.estimated_time} onChange={(e) => setFormData({...formData, estimated_time: e.target.value})} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}><label style={labelStyle}>ความคืบหน้า (%)</label><input type="number" min="0" max="100" name="percentage" value={formData.percentage} onChange={(e) => setFormData({...formData, percentage: e.target.value})} style={inputStyle} /></div>
              </div>
              
              <div>
                <label style={labelStyle}>
                  {currentTask ? 'อัปโหลดไฟล์ใหม่ (ถ้าต้องการ)' : 'แนบไฟล์เพื่อให้ AI ประเมิน'}
                </label>
                <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} style={{...inputStyle, padding: '6px'}} />
              </div>

              <div><label style={labelStyle}>สถานะงาน</label>
                <select name="status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} style={inputStyle}>
                  <option value="pending">กำลังทำ (Pending)</option>
                  <option value="completed">เสร็จสิ้น (Completed)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>ยกเลิก</button>
                <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

const menuBtn = { padding: '12px 16px', cursor: 'pointer', border: 'none', borderRadius: '8px', backgroundColor: 'transparent', color: '#64748b', fontWeight: 'bold', textAlign: 'left', fontSize: '15px', transition: 'all 0.2s' };
const activeMenuBtn = { ...menuBtn, backgroundColor: '#eff6ff', color: '#3b82f6' };
const inputStyle = { width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'inherit' };
const labelStyle = { fontSize: '14px', fontWeight: 'bold', color: '#475569' };
