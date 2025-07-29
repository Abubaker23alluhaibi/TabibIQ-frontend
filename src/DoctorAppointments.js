import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Context for sharing special appointments between components
const SpecialAppointmentsContext = React.createContext();

// دالة توحيد رقم الهاتف العراقي
function normalizePhone(phone) {
  if (!phone) return '';
  phone = phone.replace(/\D/g, '');
  if (phone.startsWith('0')) {
    return '+964' + phone.slice(1);
  }
  if (phone.startsWith('964')) {
    return '+964' + phone.slice(3);
  }
  if (phone.startsWith('7')) {
    return '+964' + phone;
  }
  if (phone.startsWith('+964')) {
    return '+964' + phone.slice(4);
  }
  return phone;
}

function DoctorAppointments() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPastAppointments, setShowPastAppointments] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, today, upcoming, past
  const [sortBy, setSortBy] = useState('date'); // date, time, name
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  // --- Modal confirmation state ---
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [showAddToSpecial, setShowAddToSpecial] = useState(false);
  const [selectedAppointmentForSpecial, setSelectedAppointmentForSpecial] = useState(null);

  const { t } = useTranslation();

  useEffect(() => {
    if (!profile?.id) {
      setError(t('login_required'));
      setLoading(false);
      return;
    }

    fetchDoctorAppointments();
    
    // تحديث البيانات كل 30 ثانية
    const interval = setInterval(fetchDoctorAppointments, 30000);
    
    return () => clearInterval(interval);
  }, [profile]);

  const fetchDoctorAppointments = async () => {
    try {
      console.log('🔍 جلب مواعيد الطبيب:', profile.id);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/appointments/doctor/${profile.id}`);
      if (res.ok) {
        const data = await res.json();
        console.log('✅ تم جلب مواعيد الطبيب:', data.length);
        console.log('🔍 بيانات المواعيد:', data);
        
        // إزالة التكرار بشكل أكثر دقة
        const uniqueMap = new Map();
        data.forEach(appointment => {
          const key = appointment._id;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, appointment);
          }
        });
        
        const uniqueAppointments = Array.from(uniqueMap.values());
        console.log('✅ المواعيد بعد إزالة التكرار:', uniqueAppointments.length);
        
        setAppointments(uniqueAppointments);
      } else {
        console.log('❌ خطأ في جلب مواعيد الطبيب:', res.status);
        setError(t('fetch_appointments_fail'));
      }
    } catch (err) {
      console.error('❌ خطأ في جلب مواعيد الطبيب:', err);
      setError(t('fetch_appointments_error'));
    }
    setLoading(false);
  };

  const cleanDuplicateAppointments = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/clean-duplicate-appointments`, {
        method: 'POST'
      });
      
      if (res.ok) {
        const result = await res.json();
        alert(`${t('appointments_cleared_success')}\n${t('duplicates_deleted')}: ${result.duplicatesDeleted}`);
        // إعادة جلب المواعيد بعد التنظيف
        fetchDoctorAppointments();
      } else {
        alert(t('appointments_cleared_fail'));
      }
    } catch (err) {
      alert(t('appointments_cleared_error'));
    }
  };

  const exportToCSV = () => {
    const headers = [t('appointment_number'), t('patient_name'), t('patient_phone'), t('date'), t('time'), t('reason'), t('status')];
    const csvData = displayedAppointments.map((apt, index) => [
      index + 1,
      apt.userName || apt.userId?.first_name || t('not_specified'),
      apt.userId?.phone || t('not_specified'),
      apt.date,
      apt.time,
      apt.reason || t('not_specified'),
      getStatusText(getAppointmentStatus(apt.date))
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${t('appointments_clinic_file')}_${new Date().toLocaleDateString('ar-EG')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/appointments/${appointmentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAppointments(appointments.filter(apt => apt._id !== appointmentId));
        alert(t('appointment_cancelled_success'));
      } else {
        alert(t('appointment_cancelled_fail'));
      }
    } catch (err) {
      alert(t('appointment_cancelled_error'));
    }
    setShowConfirm(false);
    setSelectedAppointmentId(null);
  };

  const addToSpecialAppointments = (appointment) => {
    setSelectedAppointmentForSpecial(appointment);
    setShowAddToSpecial(true);
  };

  const handleAddToSpecial = async (specialAppointmentData) => {
    // تجهيز بيانات الموعد الخاص
    const normalizedPhone = normalizePhone(selectedAppointmentForSpecial.userId?.phone || '');
    const newSpecialAppointment = {
      doctorId: profile?._id,
      userName: selectedAppointmentForSpecial.userName || selectedAppointmentForSpecial.userId?.first_name || t('patient'),
      patientPhone: normalizedPhone,
      date: specialAppointmentData.date,
      time: specialAppointmentData.time,
      duration: specialAppointmentData.duration,
      priority: specialAppointmentData.priority,
      status: specialAppointmentData.status,
      reason: selectedAppointmentForSpecial.reason || specialAppointmentData.reason,
      notes: specialAppointmentData.notes,
      type: 'special_appointment'
    };
    // أرسل الموعد للباكند
    await fetch(`${process.env.REACT_APP_API_URL}/add-special-appointment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSpecialAppointment)
    });
    // أرسل إشعار للمريض
    await fetch(`${process.env.REACT_APP_API_URL}/send-special-appointment-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientPhone: normalizedPhone,
        patientName: newSpecialAppointment.userName,
        newDate: newSpecialAppointment.date,
        newTime: newSpecialAppointment.time,
        doctorName: profile?.name || t('doctor'),
        reason: newSpecialAppointment.reason,
        notes: newSpecialAppointment.notes
      })
    });
    // أعد تحميل قائمة المواعيد الخاصة (أو كل المواعيد)
    fetchDoctorAppointments();
    alert(t('patient_added_to_special_appointments_success'));
    setShowAddToSpecial(false);
    setSelectedAppointmentForSpecial(null);
  };

  const sendNotificationToPatient = async (phone, notificationData) => {
    try {

      
      // إرسال إشعار موعد خاص
      const res = await fetch(`${process.env.REACT_APP_API_URL}/send-special-appointment-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientPhone: phone,
          patientName: selectedAppointmentForSpecial.userName || selectedAppointmentForSpecial.userId?.first_name || t('patient'),
          originalAppointmentId: selectedAppointmentForSpecial._id,
          newDate: notificationData.appointmentData.date,
          newTime: notificationData.appointmentData.time,
          doctorName: profile?.name || t('doctor'),
          reason: selectedAppointmentForSpecial.reason || notificationData.appointmentData.reason,
          notes: notificationData.appointmentData.notes
        })
      });
      
      if (res.ok) {
        const result = await res.json();

        
        // إظهار رسالة تأكيد للمستخدم
        alert(`${t('notification_sent_to_patient')}: ${phone}`);
      } else {

      }
    } catch (err) {
      
      // لا نوقف العملية إذا فشل الإشعار
    }
  };

  // دالة تنسيق التاريخ بالكردية
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const weekdays = t('weekdays', { returnObjects: true }) || ['شەممە', 'یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی'];
    const months = t('months', { returnObjects: true }) || [
      'کانونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران',
      'تەمموز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانونی یەکەم'
    ];
    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${weekday}، ${day}ی ${month} ${year}`;
  };

  const isPastAppointment = (dateString) => {
    const appointmentDate = new Date(dateString);
    const today = new Date();
    
    // إصلاح مشكلة التاريخ - مقارنة التواريخ بدون الوقت
    const appointmentDateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return appointmentDateOnly < todayOnly;
  };

  const isTodayAppointment = (dateString) => {
    const appointmentDate = new Date(dateString);
    const today = new Date();
    
    // إصلاح مشكلة التاريخ - مقارنة التواريخ بدون الوقت
    const appointmentDateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return appointmentDateOnly.getTime() === todayOnly.getTime();
  };

  const isUpcomingAppointment = (dateString) => {
    const appointmentDate = new Date(dateString);
    const today = new Date();
    
    // إصلاح مشكلة التاريخ - مقارنة التواريخ بدون الوقت
    const appointmentDateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return appointmentDateOnly > todayOnly;
  };

  const getAppointmentStatus = (dateString) => {
    if (isPastAppointment(dateString)) return 'past';
    if (isTodayAppointment(dateString)) return 'today';
    return 'upcoming';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'past': return '#e53935';
      case 'today': return '#ff9800';
      case 'upcoming': return '#4caf50';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'past': return t('appointment_status_past');
      case 'today': return t('appointment_status_today');
      case 'upcoming': return t('appointment_status_upcoming');
      default: return '';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'past': return '📅';
      case 'today': return '🎯';
      case 'upcoming': return '⏰';
      default: return '📅';
    }
  };

  // تصنيف المواعيد
  const pastAppointments = appointments.filter(apt => isPastAppointment(apt.date));
  const todayAppointments = appointments.filter(apt => isTodayAppointment(apt.date));
  const upcomingAppointments = appointments.filter(apt => isUpcomingAppointment(apt.date));

  // تصفية المواعيد حسب البحث والحالة
  const filterAppointments = (appointments) => {
    let filtered = appointments;
    
    // تصفية حسب البحث
    if (searchTerm) {
      filtered = filtered.filter(apt => 
        (apt.userName && apt.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (apt.userId?.first_name && apt.userId.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (apt.userId?.phone && apt.userId.phone.includes(searchTerm)) ||
        (apt.reason && apt.reason.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // تصفية حسب الحالة
    if (filterStatus !== 'all') {
      filtered = filtered.filter(apt => getAppointmentStatus(apt.date) === filterStatus);
    }
    
    return filtered;
  };

  // ترتيب المواعيد
  const sortAppointments = (appointments) => {
    return appointments.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case 'time':
          comparison = a.time.localeCompare(b.time);
          break;
        case 'name':
          const nameA = (a.userName || a.userId?.first_name || '').toLowerCase();
          const nameB = (b.userName || b.userId?.first_name || '').toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        default:
          comparison = new Date(a.date) - new Date(b.date);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  // تجميع جميع المواعيد المراد عرضها مع إزالة التكرار
  const allAppointments = showPastAppointments 
    ? [...todayAppointments, ...upcomingAppointments, ...pastAppointments]
    : [...todayAppointments, ...upcomingAppointments];

  // إزالة التكرار من المواعيد المعروضة
  const uniqueAllAppointments = allAppointments.filter((appointment, index, self) => 
    index === self.findIndex(a => a._id === appointment._id)
  );

  // تطبيق التصفية والترتيب
  const displayedAppointments = sortAppointments(filterAppointments(uniqueAllAppointments));

  if (loading) return <div style={{textAlign:'center', marginTop:40}}>{t('loading')}</div>;
  if (error) return <div style={{textAlign:'center', marginTop:40, color:'#e53935'}}>{error}</div>;

  return (
    <div className="print-section" style={{maxWidth:800, margin:'2rem auto', padding:'0 1rem'}}>
      {/* Header */}
      <div style={{background:'#fff', borderRadius:18, boxShadow:'0 2px 16px #7c4dff22', padding:'2rem', marginBottom:'2rem'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:'1rem'}}>
          <h1 style={{color:'#7c4dff', margin:0, fontSize:'2rem', fontWeight:900}}>{t('clinic_appointments')}</h1>
          <div className="no-print" style={{display:'flex', gap:'1rem', flexWrap:'wrap'}}>
            <button 
              style={{
                background: '#7c4dff',
                color: '#fff',
                border:'none',
                borderRadius:8,
                padding:'0.7rem 1.5rem',
                fontWeight:700,
                cursor:'pointer'
              }}
            >
              📋 {t('displayed_appointments')}
            </button>

            <button 
              onClick={() => navigate('/doctor-dashboard')}
              style={{background:'#00bcd4', color:'#fff', border:'none', borderRadius:8, padding:'0.7rem 1.5rem', fontWeight:700, cursor:'pointer'}}
            >
              {t('back_to_dashboard')}
            </button>
            <button 
              onClick={() => navigate('/doctor-dashboard')}
              style={{background:'#4caf50', color:'#fff', border:'none', borderRadius:8, padding:'0.7rem 1.5rem', fontWeight:700, cursor:'pointer'}}
            >
              🏠 {t('back_to_home')}
            </button>
            <button 
              onClick={() => window.print()}
              style={{background:'#009688', color:'#fff', border:'none', borderRadius:8, padding:'0.7rem 1.5rem', fontWeight:700, cursor:'pointer'}}
            >
              {t('print_appointments')}
            </button>
          </div>
        </div>
        <p style={{color:'#666', margin:0}}>
          {showPastAppointments 
            ? t('all_appointments_with_doctors')
            : t('current_and_upcoming_appointments')
          }
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem', marginBottom:'2rem'}}>
        <div style={{background:'#fff', borderRadius:16, boxShadow:'0 2px 12px #7c4dff11', padding:'1.5rem', textAlign:'center'}}>
          <div style={{fontSize:'2rem', marginBottom:'0.5rem'}}>⏰</div>
          <div style={{fontSize:'1.5rem', fontWeight:700, color:'#4caf50', marginBottom:'0.5rem'}}>{upcomingAppointments.length}</div>
          <div style={{color:'#666'}}>{t('upcoming_appointments')}</div>
        </div>
        <div style={{background:'#fff', borderRadius:16, boxShadow:'0 2px 12px #7c4dff11', padding:'1.5rem', textAlign:'center'}}>
          <div style={{fontSize:'2rem', marginBottom:'0.5rem'}}>🎯</div>
          <div style={{fontSize:'1.5rem', fontWeight:700, color:'#ff9800', marginBottom:'0.5rem'}}>{todayAppointments.length}</div>
          <div style={{color:'#666'}}>{t('today_appointments')}</div>
        </div>
        <div style={{background:'#fff', borderRadius:16, boxShadow:'0 2px 12px #7c4dff11', padding:'1.5rem', textAlign:'center'}}>
          <div style={{fontSize:'2rem', marginBottom:'0.5rem'}}>📅</div>
          <div style={{fontSize:'1.5rem', fontWeight:700, color:'#e53935', marginBottom:'0.5rem'}}>{pastAppointments.length}</div>
          <div style={{color:'#666'}}>{t('past_appointments')}</div>
        </div>
        <div style={{background:'#fff', borderRadius:16, boxShadow:'0 2px 12px #7c4dff11', padding:'1.5rem', textAlign:'center'}}>
          <div style={{fontSize:'2rem', marginBottom:'0.5rem'}}>📋</div>
          <div style={{fontSize:'1.5rem', fontWeight:700, color:'#7c4dff', marginBottom:'0.5rem'}}>{displayedAppointments.length}</div>
          <div style={{color:'#666'}}>{t('displayed_appointments')}</div>
        </div>
      </div>

      {/* Search and Filter Tools */}
      <div className="no-print" style={{background:'#fff', borderRadius:16, boxShadow:'0 2px 12px #7c4dff11', padding:'1.5rem', marginBottom:'2rem'}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'1rem', alignItems:'end'}}>
          {/* Search */}
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#7c4dff', fontWeight:700}}>
              🔍 {t('search')}
            </label>
            <input
              type="text"
              placeholder={t('search') + t('patient_name') + t('patient_phone') + t('reason')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:16,
                transition:'border-color 0.3s'
              }}
            />
          </div>
          
          {/* Status Filter */}
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#7c4dff', fontWeight:700}}>
              📊 {t('filter_by_status')}
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:16,
                backgroundColor:'#fff'
              }}
            >
              <option value="all">{t('displayed_appointments')}</option>
              <option value="today">{t('today_appointments')}</option>
              <option value="upcoming">{t('upcoming_appointments')}</option>
              <option value="past">{t('past_appointments')}</option>
            </select>
          </div>
          
          {/* Sort By */}
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#7c4dff', fontWeight:700}}>
              🔄 {t('sort_by')}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:16,
                backgroundColor:'#fff'
              }}
            >
              <option value="date">{t('date')}</option>
              <option value="time">{t('time')}</option>
              <option value="name">{t('name')}</option>
            </select>
          </div>
          
          {/* Sort Order */}
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#7c4dff', fontWeight:700}}>
              📈 {t('sort_order')}
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:16,
                backgroundColor:'#fff'
              }}
            >
              <option value="asc">{t('ascending')}</option>
              <option value="desc">{t('descending')}</option>
            </select>
          </div>
        </div>
        
        {/* Clear Filters Button */}
        {(searchTerm || filterStatus !== 'all' || sortBy !== 'date' || sortOrder !== 'asc') && (
          <div style={{marginTop:'1rem', textAlign:'center'}}>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setSortBy('date');
                setSortOrder('asc');
              }}
              style={{
                background:'#e53935',
                color:'#fff',
                border:'none',
                borderRadius:8,
                padding:'0.7rem 1.5rem',
                fontWeight:700,
                cursor:'pointer',
                fontSize:14
              }}
            >
              🗑️ {t('clear_filters')}
            </button>
          </div>
        )}
      </div>

      {/* Appointments List */}
      {displayedAppointments.length === 0 ? (
        <div style={{background:'#fff', borderRadius:18, boxShadow:'0 2px 16px #7c4dff22', padding:'3rem', textAlign:'center'}}>
          <div style={{fontSize:'4rem', marginBottom:'1rem'}}>📅</div>
          <h3 style={{color:'#7c4dff', marginBottom:'0.5rem'}}>{t('no_appointments')}</h3>
          <p style={{color:'#666', marginBottom:'2rem'}}>
            {showPastAppointments 
              ? t('no_appointments_yet')
              : t('no_current_or_upcoming_appointments')
            }
          </p>
          <button 
            onClick={() => navigate('/doctor-dashboard')}
            style={{background:'#7c4dff', color:'#fff', border:'none', borderRadius:8, padding:'1rem 2rem', fontWeight:700, cursor:'pointer'}}
          >
            {t('back_to_dashboard')}
          </button>
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
          {displayedAppointments.length > 0 && (
            <div style={{background:'#fff', borderRadius:16, boxShadow:'0 2px 12px #7c4dff11', padding:'1rem', textAlign:'center'}}>
              <span style={{color:'#7c4dff', fontWeight:700, fontSize:'1.1rem'}}>
                📋 {t('displayed_appointments')} {displayedAppointments.length}
              </span>
            </div>
          )}
          
          {displayedAppointments.map((appointment, index) => {
            const status = getAppointmentStatus(appointment.date);
            const statusColor = getStatusColor(status);
            const statusText = getStatusText(status);
            const statusIcon = getStatusIcon(status);
            
            return (
              <div key={appointment._id} style={{
                background:'#fff',
                borderRadius:16,
                boxShadow:'0 2px 12px #7c4dff11',
                padding:'1.5rem',
                borderLeft: `4px solid ${statusColor}`,
                opacity: status === 'past' ? 0.8 : 1,
                position:'relative'
              }}>
                {/* Appointment Number */}
                <div style={{
                  position:'absolute',
                  top:'-10px',
                  right:'-10px',
                  background: statusColor,
                  color:'#fff',
                  borderRadius:'50%',
                  width:'30px',
                  height:'30px',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  fontWeight:700,
                  fontSize:'0.9rem',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  {index + 1}
                </div>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem'}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem'}}>
                      <span style={{fontSize:'1.2rem'}}>{statusIcon}</span>
                      <span style={{
                        background: statusColor,
                        color:'#fff',
                        padding:'0.2rem 0.8rem',
                        borderRadius:12,
                        fontSize:'0.8rem',
                        fontWeight:700
                      }}>
                        {statusText}
                      </span>
                    </div>
                    <h3 style={{color:'#7c4dff', margin:'0 0 0.5rem 0', fontSize:'1.3rem'}}>
                      👤 {appointment.patientId?.name || appointment.userName || appointment.userId?.first_name || t('patient')}
                    </h3>
                    <div style={{color:'#666', marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'0.5rem'}}>
                      <span>📅</span>
                      <span>{formatDate(appointment.date)}</span>
                      <span style={{background:'#f0f0f0', padding:'0.2rem 0.5rem', borderRadius:4, fontSize:'0.8rem'}}>
                        {new Date(appointment.date).toLocaleDateString('ar-EG', { weekday: 'short' })}
                      </span>
                    </div>
                    <div style={{color:'#666', marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'0.5rem'}}>
                      <span>🕐</span>
                      <span style={{fontWeight:700, color:'#7c4dff'}}>{appointment.time}</span>
                    </div>
                    {appointment.reason && (
                      <div style={{color:'#666', fontSize:'0.9rem'}}>
                        💬 {appointment.reason}
                      </div>
                    )}
                    {/* عرض رقم الهاتف */}
                    {(appointment.patientId?.phone || appointment.patientPhone || (/^\+?\d{10,}$/.test(appointment.notes)) || appointment.userId?.phone) && (
                      <div style={{color:'#666', fontSize:'0.9rem'}}>
                        📞 {appointment.patientId?.phone || appointment.patientPhone || (/^\+?\d{10,}$/.test(appointment.notes) ? appointment.notes : appointment.userId?.phone)}
                      </div>
                    )}
                  </div>
                  <div className="no-print" style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
                    {/* زر إضافة للمواعيد الخاصة */}
                    <button 
                      onClick={() => addToSpecialAppointments(appointment)}
                      style={{
                        background:'#ff5722',
                        color:'#fff',
                        border:'none',
                        borderRadius:8,
                        padding:'0.5rem 1rem',
                        fontWeight:700,
                        cursor:'pointer',
                        fontSize:'0.9rem',
                        display:'flex',
                        alignItems:'center',
                        gap:'0.3rem'
                      }}
                    >
                      ⭐ {t('add_to_special_appointments')}
                    </button>
                    
                    {status !== 'past' && (
                      <button 
                        onClick={() => {
                          setSelectedAppointmentId(appointment._id);
                          setShowConfirm(true);
                        }}
                        style={{
                          background:'#e53935',
                          color:'#fff',
                          border:'none',
                          borderRadius:8,
                          padding:'0.5rem 1rem',
                          fontWeight:700,
                          cursor:'pointer',
                          fontSize:'0.9rem'
                        }}
                      >
                        {t('cancel_appointment')}
                      </button>
                    )}
                    {status === 'past' && (
                      <button 
                        onClick={() => navigate('/doctor-dashboard')}
                        style={{
                          background:'#7c4dff',
                          color:'#fff',
                          border:'none',
                          borderRadius:8,
                          padding:'0.5rem 1rem',
                          fontWeight:700,
                          cursor:'pointer',
                          fontSize:'0.9rem'
                        }}
                      >
                        {t('manage_appointments')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <ConfirmModal 
        show={showConfirm} 
        onConfirm={() => selectedAppointmentId && cancelAppointment(selectedAppointmentId)} 
        onCancel={() => { setShowConfirm(false); setSelectedAppointmentId(null); }} 
      />

      {/* نافذة إضافة للمواعيد الخاصة */}
      {showAddToSpecial && selectedAppointmentForSpecial && (
        <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.18)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000}}>
          <div style={{background:'#fff', borderRadius:20, boxShadow:'0 8px 32px rgba(0,0,0,0.2)', padding:'2.5rem 2rem', minWidth:450, maxWidth:600, maxHeight:'90vh', overflowY:'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
              <h3 style={{color:'#ff5722', fontWeight:800, fontSize:24, margin:0, display:'flex', alignItems:'center', gap:'0.5rem'}}>
                ⭐ {t('add_to_special_appointments')}
              </h3>
              <button 
                onClick={() => {setShowAddToSpecial(false); setSelectedAppointmentForSpecial(null);}}
                style={{
                  background:'#e53935',
                  color:'#fff',
                  border:'none',
                  borderRadius:8,
                  padding:'0.5rem 1rem',
                  fontWeight:700,
                  fontSize:14,
                  cursor:'pointer'
                }}
              >
                إغلاق
              </button>
            </div>
            
            <AddToSpecialForm 
              appointment={selectedAppointmentForSpecial}
              onSubmit={handleAddToSpecial}
              onClose={() => {setShowAddToSpecial(false); setSelectedAppointmentForSpecial(null);}}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// --- Modal confirmation JSX ---
function ConfirmModal({ show, onConfirm, onCancel }) {
  const { t } = useTranslation();
  if (!show) return null;
  return (
    <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.18)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000}}>
      <div style={{background:'#fff', borderRadius:16, boxShadow:'0 4px 24px #7c4dff33', padding:'2.2rem 1.5rem', minWidth:260, textAlign:'center'}}>
        <div style={{fontSize:'2.2rem', marginBottom:10}}>⚠️</div>
        <h3 style={{color:'#e53935', marginBottom:18, fontWeight:700}}>{t('confirm_cancel_appointment')}</h3>
        <div style={{color:'#444', marginBottom:18}}>{t('are_you_sure_cancel')}</div>
        <div style={{display:'flex', gap:10, justifyContent:'center'}}>
          <button onClick={onConfirm} style={{background:'#e53935', color:'#fff', border:'none', borderRadius:8, padding:'0.7rem 1.5rem', fontWeight:700, fontSize:16, cursor:'pointer'}}>{t('confirm')}</button>
          <button onClick={onCancel} style={{background:'#eee', color:'#444', border:'none', borderRadius:8, padding:'0.7rem 1.5rem', fontWeight:700, fontSize:16, cursor:'pointer'}}>{t('cancel')}</button>
        </div>
      </div>
    </div>
  );
}

// مكون إضافة للمواعيد الخاصة
function AddToSpecialForm({ appointment, onSubmit, onClose }) {
  const { t } = useTranslation();
  const getToday = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    date: getToday(),
    time: '09:00',
    duration: '30',
    priority: 'normal',
    status: 'confirmed',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      // خطأ في إضافة الموعد الخاص
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
      {/* معلومات المريض الحالية */}
      <div style={{background:'#f8f9fa', borderRadius:12, padding:'1.5rem'}}>
        <h4 style={{color:'#ff5722', marginBottom:'1rem', fontWeight:700, display:'flex', alignItems:'center', gap:'0.5rem'}}>
          👤 {t('patient_info')}
        </h4>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem'}}>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>
              {t('patient_name')}
            </label>
            <input
              type="text"
              value={appointment.userName || appointment.userId?.first_name || t('patient')}
              disabled
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:14,
                backgroundColor:'#f5f5f5',
                color:'#666'
              }}
            />
          </div>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>
              {t('patient_phone')}
            </label>
            <input
              type="tel"
              value={appointment.userId?.phone || t('not_available')}
              disabled
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:14,
                backgroundColor:'#f5f5f5',
                color:'#666'
              }}
            />
          </div>
        </div>
        {appointment.reason && (
          <div style={{marginTop:'1rem'}}>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>
              {t('original_visit_reason')}
            </label>
            <textarea
              value={appointment.reason}
              disabled
              rows={2}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:14,
                backgroundColor:'#f5f5f5',
                color:'#666',
                resize:'none'
              }}
            />
          </div>
        )}
      </div>

      {/* تفاصيل الموعد الخاص */}
      <div style={{background:'#f8f9fa', borderRadius:12, padding:'1.5rem'}}>
        <h4 style={{color:'#ff5722', marginBottom:'1rem', fontWeight:700, display:'flex', alignItems:'center', gap:'0.5rem'}}>
          ⭐ {t('special_appointment_details')}
        </h4>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'1rem'}}>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>
              {t('new_date')} *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              min={getToday()}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:14
              }}
              required
            />
          </div>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>
              {t('new_time')} *
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:14
              }}
              required
            />
          </div>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>
              {t('appointment_duration')}
            </label>
            <select
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:14,
                backgroundColor:'#fff'
              }}
            >
              <option value="15">{t('appointment_duration_15_minutes')}</option>
              <option value="30">{t('appointment_duration_30_minutes')}</option>
              <option value="45">{t('appointment_duration_45_minutes')}</option>
              <option value="60">{t('appointment_duration_60_minutes')}</option>
            </select>
          </div>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>
              {t('priority')}
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:14,
                backgroundColor:'#fff'
              }}
            >
              <option value="normal">{t('normal_priority')}</option>
              <option value="urgent">{t('urgent_priority')}</option>
              <option value="follow_up">{t('follow_up_priority')}</option>
            </select>
          </div>
        </div>
        <div style={{marginTop:'1rem'}}>
          <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>
            {t('special_appointment_notes')}
          </label>
          <textarea
            placeholder={t('additional_notes_or_instructions') + t('special_appointment_notes')}
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            style={{
              width:'100%',
              padding:'0.8rem',
              borderRadius:8,
              border:'2px solid #e0e0e0',
              fontSize:14,
              resize:'vertical',
              fontFamily:'inherit'
            }}
          />
        </div>
      </div>

      {/* أزرار التحكم */}
      <div style={{display:'flex', gap:'1rem', justifyContent:'flex-end', marginTop:'1rem'}}>
        <button
          type="button"
          onClick={onClose}
          style={{
            background:'#f5f5f5',
            color:'#666',
            border:'none',
            borderRadius:8,
            padding:'0.8rem 1.5rem',
            fontWeight:700,
            fontSize:14,
            cursor:'pointer',
            transition:'all 0.3s ease'
          }}
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? '#ccc' : '#ff5722',
            color:'#fff',
            border:'none',
            borderRadius:8,
            padding:'0.8rem 1.5rem',
            fontWeight:700,
            fontSize:14,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition:'all 0.3s ease'
          }}
        >
          {loading ? t('adding_to_special_appointments') : t('add_to_special_appointments')}
        </button>
      </div>
    </form>
  );
}

export default DoctorAppointments;

// إضافة أنماط الطباعة
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .print-section, .print-section * {
      visibility: visible;
    }
    .print-section {
      position: absolute;
      left: 0;
      top: 0;
    }
    button, .no-print {
      display: none !important;
    }
  }
`;

// إضافة أنماط الطباعة للصفحة
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = printStyles;
  document.head.appendChild(style);
} 