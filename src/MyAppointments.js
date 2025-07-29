import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';

function MyAppointments() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPastAppointments, setShowPastAppointments] = useState(false);
  // --- Modal confirmation state ---
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const { t } = useTranslation();


  useEffect(() => {
    if (!user?.id) {
      setError(t('login_required'));
      setLoading(false);
      return;
    }

    fetchMyAppointments();
  }, [user]);



  const fetchMyAppointments = async () => {
    try {
              console.log('🔍 جلب مواعيد المستخدم:', user.id);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/appointments/patient/${user.id}`);
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ تم جلب المواعيد:', data.length);
        
        // إزالة التكرار بشكل أكثر دقة
        const uniqueMap = new Map();
        data.forEach(appointment => {
          // استخدام مزيج من البيانات كـ key للتأكد من عدم التكرار
          const key = `${appointment.doctorId}-${appointment.date}-${appointment.time}`;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, appointment);
          } else {
            // إذا كان هناك تكرار، احتفظ بالأحدث
            const existing = uniqueMap.get(key);
            if (new Date(appointment.createdAt) > new Date(existing.createdAt)) {
              uniqueMap.set(key, appointment);
            }
          }
        });
        
        const uniqueAppointments = Array.from(uniqueMap.values());
        console.log('✅ المواعيد بعد إزالة التكرار:', uniqueAppointments.length);
        
        // إذا كان هناك تكرار، اعرض تنبيه للمستخدم
        if (data.length > uniqueAppointments.length) {
          console.log('⚠️ تم إزالة', data.length - uniqueAppointments.length, 'موعد مكرر');
        }
        
        // تنظيف إضافي للتأكد من عدم وجود تكرار
        const finalUniqueAppointments = uniqueAppointments.filter((appointment, index, self) => {
          const key = `${appointment.doctorId}-${appointment.date}-${appointment.time}`;
          return self.findIndex(a => `${a.doctorId}-${a.date}-${a.time}` === key) === index;
        });
        
        console.log('✅ المواعيد النهائية:', finalUniqueAppointments.length);
        setAppointments(finalUniqueAppointments);
      } else {
        console.log('❌ خطأ في جلب المواعيد:', res.status);
        setError(t('fetch_appointments_fail'));
        setAppointments([]);
      }
    } catch (err) {
      console.error('❌ خطأ في جلب المواعيد:', err);
      setError(t('fetch_appointments_error'));
      setAppointments([]);
    }
    setLoading(false);
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



  const formatDate = (dateString, t) => {
    const date = new Date(dateString);
    // استخدم اللغة من i18n مباشرة
    const lang = i18n.language || 'ar';
    // اطبع اللغة الحالية واليوم الرقمي في الكونسول
    console.log('LANG:', lang, 'getDay:', date.getDay());

    let weekday = '';
    if (lang.startsWith('ku') && typeof t === 'function') {
      // ترتيب أيام الأسبوع في ملف الترجمة: ["شەممە", "یەکشەممە", "دووشەممە", "سێشەممە", "چوارشەممە", "پێنجشەممە", "هەینی"]
      // ترتيب getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
      // نحتاج: 0=یەکشەممە، 1=دووشەممە، ...، 5=هەینی، 6=شەممە
      const kuWeekdays = t('weekdays', { returnObjects: true });
      const map = [1,2,3,4,5,6,0]; // Sunday=>1, Monday=>2, ..., Saturday=>0
      weekday = kuWeekdays[map[date.getDay()]];
    } else {
      weekday = date.toLocaleDateString('ar-EG', { weekday: 'long' });
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${weekday}، ${day}-${month}-${year}`;
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

  // إزالة التكرار من المواعيد
  const removeDuplicates = (appointments) => {
    const uniqueMap = new Map();
    appointments.forEach(appointment => {
      // استخدام مزيج من البيانات كـ key للتأكد من عدم التكرار
      const key = `${appointment.doctorId}-${appointment.date}-${appointment.time}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, appointment);
      } else {
        // إذا كان هناك تكرار، احتفظ بالأحدث
        const existing = uniqueMap.get(key);
        if (new Date(appointment.createdAt) > new Date(existing.createdAt)) {
          uniqueMap.set(key, appointment);
        }
      }
    });
    return Array.from(uniqueMap.values());
  };

  // ترتيب المواعيد: اليوم أولاً، ثم الغد، ثم باقي المواعيد القادمة، ثم السابقة
  const sortAppointments = (appointments) => {
    return appointments.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // مواعيد اليوم أولاً
      const isTodayA = dateA.toDateString() === today.toDateString();
      const isTodayB = dateB.toDateString() === today.toDateString();
      
      if (isTodayA && !isTodayB) return -1;
      if (!isTodayA && isTodayB) return 1;
      
      // ثم ترتيب حسب التاريخ
      return dateA - dateB;
    });
  };

  // تجميع المواعيد (تم تنظيفها بالفعل في fetchMyAppointments)
  const allAppointments = appointments;
  const pastAppointments = allAppointments.filter(apt => isPastAppointment(apt.date));
  const todayAppointments = allAppointments.filter(apt => isTodayAppointment(apt.date));
  const upcomingAppointments = allAppointments.filter(apt => isUpcomingAppointment(apt.date));

  // تنظيف إضافي للتأكد من عدم وجود تكرار في العرض
  const uniqueDisplayedAppointments = (() => {
    console.log('📊 إحصائيات المواعيد:', {
      اليوم: todayAppointments.length,
      القادمة: upcomingAppointments.length,
      السابقة: pastAppointments.length,
      عرض_السابقة: showPastAppointments
    });
    
    // إذا كان المستخدم يريد رؤية مواعيد اليوم والقادمة فقط
    if (!showPastAppointments) {
      // عرض مواعيد اليوم والقادمة
      const currentAndUpcoming = [...todayAppointments, ...upcomingAppointments];
      
      const uniqueMap = new Map();
      currentAndUpcoming.forEach(appointment => {
        const key = `${appointment.doctorId}-${appointment.date}-${appointment.time}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, appointment);
        }
      });
      
      const result = sortAppointments(Array.from(uniqueMap.values()));
      console.log('📅 مواعيد اليوم والقادمة:', result.length);
      return result;
    }
    
    // إذا كان المستخدم يريد رؤية جميع المواعيد
    const allToDisplay = [...todayAppointments, ...upcomingAppointments, ...pastAppointments];
    
    const uniqueMap = new Map();
    allToDisplay.forEach(appointment => {
      const key = `${appointment.doctorId}-${appointment.date}-${appointment.time}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, appointment);
      }
    });
    
    const result = sortAppointments(Array.from(uniqueMap.values()));
    console.log('📅 جميع المواعيد:', result.length);
    return result;
  })();

  if (loading) return <div style={{textAlign:'center', marginTop:40}}>{t('loading')}</div>;
  if (error) return <div style={{textAlign:'center', marginTop:40, color:'#e53935'}}>{error}</div>;

  return (
    <div style={{maxWidth:800, margin:'2rem auto', padding:'0 1rem'}}>
      {/* Header */}
      <div style={{background:'#fff', borderRadius:18, boxShadow:'0 2px 16px #7c4dff22', padding:'2rem', marginBottom:'2rem'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:'1rem'}}>
          <h1 style={{color:'#7c4dff', margin:0, fontSize:'2rem', fontWeight:900}}>{t('my_appointments')}</h1>
          <div style={{display:'flex', gap:'1rem', flexWrap:'wrap'}}>
            <button 
              onClick={() => setShowPastAppointments(!showPastAppointments)}
              style={{
                background: showPastAppointments ? '#e53935' : '#7c4dff',
                color:'#fff',
                border:'none',
                borderRadius:8,
                padding:'0.7rem 1.5rem',
                fontWeight:700,
                cursor:'pointer',
                display:'flex',
                alignItems:'center',
                gap:'0.5rem'
              }}
            >
              {showPastAppointments ? t('hide_past') : t('show_past')}
              {pastAppointments.length > 0 && (
                <span style={{
                  background:'rgba(255,255,255,0.2)',
                  borderRadius:'50%',
                  padding:'0.2rem 0.5rem',
                  fontSize:'0.8rem',
                  minWidth:'20px',
                  textAlign:'center'
                }}>
                  {pastAppointments.length}
                </span>
              )}
            </button>

            <button 
              onClick={() => navigate('/home')}
              style={{background:'#00bcd4', color:'#fff', border:'none', borderRadius:8, padding:'0.7rem 1.5rem', fontWeight:700, cursor:'pointer'}}
            >
              {t('back_to_home')}
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
          <div style={{fontSize:'2rem', marginBottom:'0.5rem'}}>📅</div>
          <div style={{fontSize:'1.5rem', fontWeight:700, color:'#e53935', marginBottom:'0.5rem'}}>{pastAppointments.length}</div>
          <div style={{color:'#666'}}>{t('past_appointments')}</div>
        </div>
      </div>

      {/* Appointments List */}
      {uniqueDisplayedAppointments.length === 0 ? (
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
            onClick={() => navigate('/home')}
            style={{background:'#7c4dff', color:'#fff', border:'none', borderRadius:8, padding:'1rem 2rem', fontWeight:700, cursor:'pointer'}}
          >
            {t('book_now')}
          </button>
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
          {/* قسم مواعيد اليوم */}
          {todayAppointments.length > 0 && (
            <div style={{background:'#fff3e0', borderRadius:16, boxShadow:'0 2px 12px #ff980011', padding:'1.5rem', borderLeft:'4px solid #ff9800'}}>
              <div style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem'}}>
                <span style={{fontSize:'1.5rem'}}>🎯</span>
                <h3 style={{color:'#e65100', margin:0, fontSize:'1.3rem', fontWeight:700}}>
                  {t('today_appointments')} ({formatDate(new Date().toISOString().slice(0,10), t)})
                </h3>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:'0.8rem'}}>
                {todayAppointments.map(appointment => {
                  const isSpecial = appointment.type === 'special_appointment' || (appointment.reason && appointment.reason.includes('خاص'));
                  return (
                    <div key={`today-${appointment.doctorId}-${appointment.date}-${appointment.time}`} style={{
                      background:'#fff',
                      borderRadius:12,
                      padding:'1rem',
                      borderLeft:'3px solid #ff9800',
                      boxShadow:'0 1px 8px #ff980022'
                    }}>
                      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.5rem'}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.3rem'}}>
                            <span style={{fontSize:'1.1rem'}}>🎯</span>
                            <span style={{
                              background:'#ff9800',
                              color:'#fff',
                              padding:'0.2rem 0.6rem',
                              borderRadius:8,
                              fontSize:'0.8rem',
                              fontWeight:700
                            }}>
                              {t('today')}
                            </span>
                            {isSpecial && (
                              <span style={{fontSize:'1.2rem'}} title={t('special_appointment')}>⭐</span>
                            )}
                          </div>
                          <h4 style={{color:'#e65100', margin:'0 0 0.3rem 0', fontSize:'1.1rem'}}>
                            د. {appointment.doctorName || appointment.doctorId?.name || appointment.doctorId || 'دكتور غير محدد'}
                          </h4>
                          <div style={{color:'#666', fontSize:'0.9rem'}}>
                            🕐 {appointment.time}
                          </div>
                          {appointment.reason && (
                            <div style={{color:'#666', fontSize:'0.85rem', marginTop:'0.2rem'}}>
                              💬 {appointment.reason}
                            </div>
                          )}
                        </div>
                        <div style={{display:'flex', gap:'0.3rem'}}>
                          <button 
                            onClick={() => {
                              setSelectedAppointmentId(appointment._id);
                              setShowConfirm(true);
                            }}
                            style={{
                              background:'#e53935',
                              color:'#fff',
                              border:'none',
                              borderRadius:6,
                              padding:'0.4rem 0.8rem',
                              fontWeight:700,
                              cursor:'pointer',
                              fontSize:'0.8rem'
                            }}
                          >
                            {t('cancel_appointment')}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* باقي المواعيد */}
          {uniqueDisplayedAppointments.filter(apt => !isTodayAppointment(apt.date)).map(appointment => {
            const status = getAppointmentStatus(appointment.date);
            const statusColor = getStatusColor(status);
            const statusText = getStatusText(status);
            const statusIcon = getStatusIcon(status);
            // تحقق إذا كان الموعد خاص (مثلاً إذا كان appointment.type === 'special_appointment' أو السبب يحتوي على 'خاص')
            const isSpecial = appointment.type === 'special_appointment' || (appointment.reason && appointment.reason.includes('خاص'));
            return (
              <div key={`${appointment.doctorId}-${appointment.date}-${appointment.time}`} style={{
                background:'#fff',
                borderRadius:16,
                boxShadow:'0 2px 12px #7c4dff11',
                padding:'1.5rem',
                borderLeft: `4px solid ${statusColor}`,
                opacity: status === 'past' ? 0.8 : 1
              }}>
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
                      {isSpecial && (
                        <span style={{marginRight:8, fontSize:'1.3rem'}} title={t('special_appointment')}>⭐</span>
                      )}
                    </div>
                    <h3 style={{color:'#7c4dff', margin:'0 0 0.5rem 0', fontSize:'1.3rem'}}>
                      د. {appointment.doctorName || appointment.doctorId?.name || appointment.doctorId || 'دكتور غير محدد'}
                    </h3>
                    <div style={{color:'#666', marginBottom:'0.5rem'}}>
                      📅 {formatDate(appointment.date, t)}
                    </div>
                    <div style={{color:'#666', marginBottom:'0.5rem'}}>
                      🕐 {appointment.time}
                    </div>
                    {appointment.reason && (
                      <div style={{color:'#666', fontSize:'0.9rem'}}>
                        💬 {appointment.reason}
                      </div>
                    )}
                    {isSpecial && (
                      <div style={{marginTop:8, display:'flex', alignItems:'center', gap:6, color:'#e65100', fontWeight:700, fontSize:'1.08rem'}}>
                        <span style={{fontSize:'1.4rem'}}>⭐</span>
                        <span>{t('special_appointment')}</span>
                      </div>
                    )}
                  </div>
                  <div style={{display:'flex', gap:'0.5rem'}}>
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
                        onClick={() => navigate(`/doctor/${appointment.doctorId}`)}
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
                        {t('book_new_appointment')}
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

export default MyAppointments; 