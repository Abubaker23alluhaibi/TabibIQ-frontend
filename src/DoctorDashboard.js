import React, { useState, useEffect } from 'react';
import './Login.css';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { ar } from 'date-fns/locale';
import DoctorProfile from './DoctorProfile';
import DoctorCalendar from './DoctorCalendar';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

function getToday() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// دالة توحيد رقم الهاتف العراقي (فرونتند)
function normalizePhone(phone) {
  if (!phone) return '';
  
  let normalized = phone
    .replace(/\s+/g, '')         // يشيل الفراغات
    .replace(/[^+\d]/g, '');     // يشيل أي رموز غير رقمية ما عدا "+"
  
  // إذا كان الرقم يبدأ بـ +964، اتركه كما هو
  if (normalized.startsWith('+964')) {
    return normalized;
  }
  
  // إذا كان الرقم يبدأ بـ 00964، حوّله لـ +964
  if (normalized.startsWith('00964')) {
    return '+964' + normalized.substring(5);
  }
  
  // إذا كان الرقم يبدأ بـ 964، حوّله لـ +964
  if (normalized.startsWith('964')) {
    return '+964' + normalized.substring(3);
  }
  
  // إذا كان الرقم يبدأ بـ 0، حوّله لـ +964
  if (normalized.startsWith('0')) {
    return '+964' + normalized.substring(1);
  }
  
  // إذا كان الرقم 10 أرقام بدون مفتاح، أضف +964
  if (normalized.length === 10 && /^\d+$/.test(normalized)) {
    return '+964' + normalized;
  }
  
  // إذا كان الرقم 9 أرقام بدون مفتاح، أضف +964
  if (normalized.length === 9 && /^\d+$/.test(normalized)) {
    return '+964' + normalized;
  }
  
  return normalized;
}

function DoctorDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNotif, setShowNotif] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [showSpecialAppointments, setShowSpecialAppointments] = useState(false);
  const [showEditSpecial, setShowEditSpecial] = useState(false);
  const [selectedAppointmentForEdit, setSelectedAppointmentForEdit] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  // أضف حالة لإظهار المودال
  const [showContactModal, setShowContactModal] = useState(false);
  // أضف حالة لإظهار نافذة التقويم
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  // أضف حالتين للتحكم في إظهار المزيد
  const [showMoreTimes, setShowMoreTimes] = useState(false);
  const [showMoreReasons, setShowMoreReasons] = useState(false);
  // 1. أضف حالة state جديدة:
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [notePhone, setNotePhone] = useState('');
  const [noteValue, setNoteValue] = useState('');
  const { t } = useTranslation();
  const [showSidebar, setShowSidebar] = useState(false);

  // جلب إشعارات الدكتور
  useEffect(() => {
    if (!profile?.id) return;
    fetch(`${process.env.REACT_APP_API_URL}/notifications?doctorId=${profile.id}`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          setNotifications([]);
          setNotifCount(0);
          return;
        }
        setNotifications(data);
        setNotifCount(data.filter(n => !n.isRead).length);
      });
  }, [profile?._id, showNotif]);

  // تعليم كل الإشعارات كمقروءة عند فتح نافذة الإشعارات
  useEffect(() => {
    if (showNotif && profile?.id && notifCount > 0) {
      setNotifCount(0); // تصفير العداد فوراً
      fetch(`${process.env.REACT_APP_API_URL}/notifications/mark-read?doctorId=${profile.id}`, { method: 'PUT' });
    }
  }, [showNotif, profile?.id]);

  // دالة موحدة لجلب جميع مواعيد الطبيب
  const fetchAllAppointments = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/appointments/doctor/${profile.id}`);
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
              setError(t('error_fetching_appointments'));
      setLoading(false);
    }
  };

  // جلب المواعيد عند تحميل الصفحة
  useEffect(() => {
    fetchAllAppointments();
  }, [profile?.id]);

  // إعادة تحميل المواعيد عند التركيز على الصفحة
  useEffect(() => {
    const handleFocus = () => {
      if (profile?.id) {
        fetchAllAppointments();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [profile?.id]);

  // مراقبة التغييرات في localStorage للمواعيد الخاصة
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('specialAppointments');
      if (saved) {
        // إعادة تحميل المواعيد عند تغيير localStorage
        fetchAllAppointments();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [profile?.id]);

  // دالة لفتح نافذة الملاحظة:
  const openNoteModal = (phone) => {
    setNotePhone(phone);
    const saved = localStorage.getItem('phoneNote_' + phone) || '';
    setNoteValue(saved);
    setShowNoteModal(true);
  };

  // تحديث المواعيد كل دقيقة للتأكد من البيانات الحالية
  useEffect(() => {
    const interval = setInterval(() => {
      if (profile?.id) {
        fetchAllAppointments();
      }
    }, 60000); // كل دقيقة

    return () => clearInterval(interval);
  }, [profile?.id]);

  // مراقبة تغيير التاريخ وتحديث المواعيد تلقائياً
  useEffect(() => {
    const checkDateChange = () => {
      const currentDate = getToday();
      if (currentDate !== selectedDate) {
        setSelectedDate(currentDate);
        fetchAllAppointments();
      }
    };

    // فحص كل 30 ثانية للتأكد من تغيير التاريخ
    const dateInterval = setInterval(checkDateChange, 30000);
    
    return () => clearInterval(dateInterval);
  }, [selectedDate, profile?.id]);

  if (profile && profile.status === 'pending') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        background: '#f7fafd',
        padding: 0
      }}>
        <div
          style={{
            background: '#fff3e0',
            color: '#e65100',
            borderRadius: 16,
            boxShadow: '0 2px 16px #ff980022',
            padding: '1.5rem 1.2rem',
            fontWeight: 800,
            fontSize: 18,
            marginBottom: 32,
            width: '95%',
            maxWidth: 420,
            textAlign: 'center',
            position: 'fixed',
            left: '50%',
            bottom: 24,
            transform: 'translateX(-50%)',
            zIndex: 1000
          }}
        >
          {t('pending_account_message')}
        </div>
      </div>
    );
  }

  console.log('🔍 DoctorDashboard - profile:', profile);
  console.log('🔍 DoctorDashboard - loading:', loading);
  console.log('🔍 DoctorDashboard - error:', error);
  
  if (!profile || (!profile.id && !profile._id)) {
    console.log('❌ DoctorDashboard - No profile data');
    return <div style={{textAlign:'center', marginTop:40}}>{t('loading_doctor_data')}</div>;
  }

  // استخدم appointmentsArray دائماً
  const appointmentsArray = Array.isArray(appointments) ? appointments : [];

  // حساب عدد مواعيد اليوم
  const today = getToday();
  const todayAppointments = appointmentsArray.filter(a => a.date === today);
  const todayCount = todayAppointments.length;
  
  // إضافة console.log للتشخيص
  console.log('🔍 التاريخ الحالي:', today);
  console.log('🔍 مواعيد اليوم:', todayAppointments);
  console.log('🔍 جميع المواعيد:', appointmentsArray.map(a => ({ date: a.date, time: a.time, name: a.userId?.first_name || a.userName })));
  
  // حساب إحصائيات سريعة
  const totalAppointments = appointmentsArray.length;
  const upcomingAppointments = appointmentsArray.filter(a => new Date(a.date) > new Date(today));
  const pastAppointments = appointmentsArray.filter(a => new Date(a.date) < new Date(today));

  // أيام الشهر الحالي
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArr = Array.from({length: daysInMonth}, (_,i)=>i+1);

  const dayAppointments = appointmentsArray.filter(a => a.date === selectedDate);

  // دالة تنسيق التاريخ بالكردية
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const weekdays = t('weekdays', { returnObjects: true }) || ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const months = t('months', { returnObjects: true }) || [
      'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
      'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
    ];
    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${weekday}، ${day} ${month} ${year}`;
  };



  // عرّف specialAppointments كمصفوفة مشتقة من appointments:
  const specialAppointments = Array.isArray(appointments) ? appointments.filter(a => a.type === 'special_appointment') : [];

  // بعد إضافة موعد خاص، أعد تحميل القائمة وأظهر إشعار نجاح
  const handleAddSpecialAppointment = async (formData) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/add-special-appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        toast.success(t('special_appointment_added_successfully'));
        // إعادة تحميل جميع المواعيد
        fetchAllAppointments();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || t('error_adding_special_appointment'));
      }
    } catch (error) {
      toast.error(t('error_adding_special_appointment'));
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #00bcd4 0%, #009688 100%)',
      minHeight: '100vh',
      position: 'relative',
      paddingBottom: '4.5rem', // زيادة الفراغ السفلي
    }}>
      {/* خلفية إضافية للعمق */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(0, 188, 212, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0, 150, 136, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      {/* شريط علوي مبسط مع أزرار */}
      <div style={{
        background: 'rgba(255,255,255,0.97)',
        boxShadow: '0 2px 12px #00bcd422',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        padding: '0.4rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 48,
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{display:'flex', alignItems:'center', gap:7}}>
          <img src="/logo192.png" alt="Logo" style={{width: 32, height: 32, borderRadius: '50%', background: '#fff', border: '4px solid #fff', boxShadow: '0 2px 12px #00bcd455', objectFit: 'cover', marginRight: 4}} />
        </div>
        <div style={{display:'flex', alignItems:'center', gap:7}}>
          {/* زر الهامبرغر */}
          <button onClick={()=>{
            setShowSidebar(true);
            // إعادة تحميل المواعيد عند فتح القائمة
            fetchAllAppointments();
          }} style={{background:'none', border:'none', fontSize:28, color:'#7c4dff', cursor:'pointer', marginLeft:4}} title="القائمة">
            <span role="img" aria-label="menu">☰</span>
          </button>
          {/* أيقونة الإشعارات فقط */}
          <div style={{position:'relative', cursor:'pointer'}} onClick={()=>{
            setShowNotif(v=>!v);
            // إعادة تحميل المواعيد عند فتح الإشعارات
            fetchAllAppointments();
          }} title="الإشعارات">
            <span style={{fontSize:28, color:'#ff9800'}} role="img" aria-label="notifications">🔔</span>
            {notifCount > 0 && (
              <span style={{position:'absolute', top:-5, right:-5, background:'#e53935', color:'#fff', borderRadius:'50%', fontSize:13, fontWeight:700, padding:'2px 7px', minWidth:22, textAlign:'center'}}>{notifCount}</span>
            )}
          </div>
        </div>
        {/* القائمة الجانبية (Sidebar) */}
        {showSidebar && (
          <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.18)', zIndex:3000, display:'flex'}} onClick={()=>{
            setShowSidebar(false);
            // إعادة تحميل المواعيد عند إغلاق القائمة
            fetchAllAppointments();
          }}>
            <div style={{background:'#fff', width:260, height:'100%', boxShadow:'2px 0 16px #7c4dff22', padding:'2rem 1.2rem', display:'flex', flexDirection:'column', gap:18}} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>{
                setShowAdd(true); 
                setShowSidebar(false);
                // إعادة تحميل المواعيد عند فتح إضافة موعد خاص
                fetchAllAppointments();
              }} style={{background: 'linear-gradient(90deg,#ff9800 0%,#ff5722 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 1.2rem', fontWeight: 700, fontSize: 16, cursor: 'pointer', display:'flex', alignItems:'center', gap:8}}>
                <span role="img" aria-label="إضافة موعد خاص">⭐</span> {t('add_special_appointment')}
              </button>
              <button onClick={()=>{
                setShowContactModal(true); 
                setShowSidebar(false);
                // إعادة تحميل المواعيد عند فتح اتصل بنا
                fetchAllAppointments();
              }} style={{background: 'linear-gradient(90deg,#00bcd4 0%,#7c4dff 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 1.2rem', fontWeight: 700, fontSize: 16, cursor: 'pointer', display:'flex', alignItems:'center', gap:8}}>
                <span role="img" aria-label="اتصل بنا">📞</span> {t('contact_us')}
              </button>
              <button onClick={()=>{
                console.log('🔍 تم الضغط على الملف الشخصي');
                navigate('/doctor-profile'); 
                setShowSidebar(false);
                // إعادة تحميل المواعيد عند فتح الملف الشخصي
                fetchAllAppointments();
              }} style={{background: '#fff', color: '#7c4dff', border: '1.5px solid #7c4dff', borderRadius: 8, padding: '0.7rem 1.2rem', fontWeight: 700, fontSize: 16, cursor: 'pointer', display:'flex', alignItems:'center', gap:8}}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="#7c4dff" strokeWidth="2"/><path d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4" stroke="#7c4dff" strokeWidth="2"/></svg> {t('my_profile')}
              </button>
              <button onClick={()=>{
                signOut(); 
                setShowSidebar(false);
                // إعادة تحميل المواعيد عند تسجيل الخروج
                fetchAllAppointments();
              }} style={{background: '#e53935', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 1.2rem', fontWeight: 700, fontSize: 16, cursor: 'pointer', display:'flex', alignItems:'center', gap:8, marginTop: 18}}>
                <span role="img" aria-label="خروج">🚪</span> {t('logout')}
              </button>
            </div>
          </div>
        )}
      </div>
      <div style={{position:'relative', zIndex:1}}>
        <h2 style={{textAlign:'center', color:'#7c4dff', marginTop:30}}>{t('doctor_dashboard')}</h2>
        
        {/* الإحصائيات السريعة */}
        <div style={{maxWidth:700, margin:'1.5rem auto', padding:'0 1rem'}}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'1rem', marginBottom:'2rem'}}>
            <div style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 12px #7c4dff11', padding:'1rem', textAlign:'center'}}>
              <div style={{fontSize:'1.5rem', marginBottom:'0.5rem'}}>📅</div>
              <div style={{fontSize:'2.1rem', fontWeight:900, color:'#7c4dff', marginBottom:'0.3rem'}}>{totalAppointments}</div>
              <div style={{fontSize:'1.1rem', fontWeight:700, color:'#7c4dff'}}>{t('total_appointments')}</div>
            </div>
            <div style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 12px #7c4dff11', padding:'1rem', textAlign:'center'}}>
              <div style={{fontSize:'1.5rem', marginBottom:'0.5rem'}}>🎯</div>
              <div style={{fontSize:'2.1rem', fontWeight:900, color:'#ff9800', marginBottom:'0.3rem'}}>{todayCount}</div>
              <div style={{fontSize:'1.1rem', fontWeight:700, color:'#ff9800'}}>{t('today_appointments')}</div>
            </div>
            <div style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 12px #7c4dff11', padding:'1rem', textAlign:'center'}}>
              <div style={{fontSize:'1.5rem', marginBottom:'0.5rem'}}>⏰</div>
              <div style={{fontSize:'2.1rem', fontWeight:900, color:'#4caf50', marginBottom:'0.3rem'}}>{upcomingAppointments.length}</div>
              <div style={{fontSize:'1.1rem', fontWeight:700, color:'#4caf50'}}>{t('upcoming_appointments')}</div>
            </div>
            <div style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 12px #7c4dff11', padding:'1rem', textAlign:'center'}}>
              <div style={{fontSize:'1.5rem', marginBottom:'0.5rem'}}>📊</div>
              <div style={{fontSize:'2.1rem', fontWeight:900, color:'#e53935', marginBottom:'0.3rem'}}>{notifCount}</div>
              <div style={{fontSize:'1.1rem', fontWeight:700, color:'#e53935'}}>{t('new_notifications')}</div>
            </div>
          </div>
        </div>
        
        {/* أزرار المواعيد في الصفحة الرئيسية */}
        <div style={{maxWidth:700, margin:'1.5rem auto', padding:'0 1rem'}}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem'}}>
            {/* زر مواعيدي (تقويم) */}
            <button style={{
              background:'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)',
              color:'#fff',
              border:'none',
              borderRadius:12,
              padding:'1rem',
              fontWeight:700,
              fontSize:14,
              cursor:'pointer',
              boxShadow:'0 3px 15px rgba(255, 152, 0, 0.3)',
              display:'flex',
              flexDirection:'column',
              alignItems:'center',
              gap:8,
              transition:'all 0.3s ease',
              minHeight:90
            }} onClick={()=>{
          setShowCalendarModal(true);
          // إعادة تحميل المواعيد عند فتح التقويم
          fetchAllAppointments();
        }}>
              <div style={{fontSize:'1.8rem'}}>📅</div>
              <div style={{fontSize:14, fontWeight:700}}>{t('my_calendar')}</div>
              <div style={{fontSize:10, opacity:0.9}}>{t('view_calendar')}</div>
            </button>
            
            {/* زر جميع المواعيد */}
            <button 
              onClick={() => {
                navigate('/doctor-appointments');
                // إعادة تحميل المواعيد عند فتح جميع المواعيد
                fetchAllAppointments();
              }}
              style={{
                background:'linear-gradient(135deg, #7c4dff 0%, #00bcd4 100%)',
                color:'#fff',
                border:'none',
                borderRadius:12,
                padding:'1rem',
                fontWeight:700,
                fontSize:14,
                cursor:'pointer',
                transition:'all 0.3s ease',
                display:'flex',
                flexDirection:'column',
                alignItems:'center',
                gap:8,
                boxShadow:'0 3px 15px rgba(124, 77, 255, 0.3)',
                minHeight:90
              }}
            >
              <div style={{fontSize:'1.8rem'}}>📋</div>
              <div style={{fontSize:14, fontWeight:700}}>{t('all_appointments')}</div>
              <div style={{fontSize:10, opacity:0.9}}>{t('manage_all_appointments')}</div>
            </button>

            {/* زر التحليل */}
            <button 
              onClick={() => {
  navigate('/doctor-analytics');
}}
              style={{
                background:'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)',
                color:'#fff',
                border:'none',
                borderRadius:12,
                padding:'1rem',
                fontWeight:700,
                fontSize:14,
                cursor:'pointer',
                transition:'all 0.3s ease',
                display:'flex',
                flexDirection:'column',
                alignItems:'center',
                gap:8,
                boxShadow:'0 3px 15px rgba(156, 39, 176, 0.3)',
                minHeight:90
              }}
            >
              <div style={{fontSize:'1.8rem'}}>📊</div>
              <div style={{fontSize:14, fontWeight:700}}>{t('appointments_analysis')}</div>
              <div style={{fontSize:10, opacity:0.9}}>{t('statistics_and_analysis')}</div>
            </button>
          </div>
        </div>

        {/* مواعيد اليوم */}
        {todayCount > 0 && (
          <div style={{maxWidth:700, margin:'1.5rem auto', padding:'0 1rem'}}>
            <div style={{background:'#fff', borderRadius:16, boxShadow:'0 2px 12px #7c4dff11', padding:'1.5rem'}}>
              <h3 style={{color:'#7c4dff', marginBottom:'1rem', textAlign:'center', fontWeight:700}}>
                🎯 {t('today_appointments')} ({formatDate(today)})
              </h3>
              <div style={{display:'flex', flexDirection:'column', gap:'0.8rem'}}>
                {todayAppointments.map(appointment => (
                  <div key={appointment._id} style={{
                    background:'#f8fafd',
                    borderRadius:6,
                    padding: window.innerWidth < 500 ? '0.45rem 0.5rem' : '0.6rem 0.8rem',
                    borderLeft:'3px solid #7c4dff',
                    boxShadow:'0 1px 4px #7c4dff11',
                    display:'flex',
                    alignItems:'center',
                    gap: window.innerWidth < 500 ? 6 : 12,
                    minHeight: window.innerWidth < 500 ? 36 : 48,
                    position:'relative',
                    marginBottom:2
                  }}>
                    {/* شارة موعد خاص في الأعلى */}
                    {appointment.type === 'special_appointment' && (
                      <span style={{
                        position:'absolute',
                        top:5,
                        right:8,
                        background:'#f8fafd', // نفس لون البطاقة
                        color:'#a0aec0', // رمادي فاتح جدًا
                        borderRadius:4,
                        padding: window.innerWidth < 500 ? '0.07rem 0.32rem' : '0.09rem 0.5rem',
                        fontWeight:500,
                        fontSize: window.innerWidth < 500 ? '0.68rem' : '0.78rem',
                        letterSpacing:0.5,
                        zIndex:2,
                        border:'none',
                        boxShadow:'none'
                      }}>
                        {t('special_appointment')}
                      </span>
                    )}
                    <div style={{display:'flex', alignItems:'center', gap:6, flex:1}}>
                      <span style={{fontWeight:600, fontSize: window.innerWidth < 500 ? '0.95rem' : '1.1rem', color:'#222'}}>
                        🕐 {appointment.time}
                      </span>
                    </div>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{color:'#7c4dff', fontWeight:700, fontSize: window.innerWidth < 500 ? '0.95rem' : '1rem', marginBottom:2}}>
                        👤 {appointment.userId?.first_name || appointment.userName || t('patient_name')}
                      </div>
                      {/* عرض رقم الهاتف */}
                      {(appointment.patientPhone || (/^\+?\d{10,}$/.test(appointment.notes))) && (
                        <div style={{fontSize: window.innerWidth < 500 ? '0.78rem' : '0.85rem', color:'#888', marginTop:1}}>
                          📞 {appointment.patientPhone || appointment.notes}
                        </div>
                      )}
                      {appointment.reason && (
                        <div style={{fontSize: window.innerWidth < 500 ? '0.78rem' : '0.85rem', color:'#888', marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                          💬 {appointment.reason}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => navigate('/doctor-appointments')}
                      style={{
                        background:'#7c4dff',
                        color:'#fff',
                        border:'none',
                        borderRadius:5,
                        padding: window.innerWidth < 500 ? '0.22rem 0.5rem' : '0.3rem 0.7rem',
                        fontWeight:700,
                        cursor:'pointer',
                        fontSize: window.innerWidth < 500 ? '0.75rem' : '0.85rem',
                        marginLeft:6
                      }}
                    >
                      {t('manage')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* نافذة الإشعارات */}
        {showNotif && (
          <div style={{
            position:'fixed',
            top: window.innerWidth < 500 ? 0 : 70,
            right: window.innerWidth < 500 ? 0 : 20,
            left: window.innerWidth < 500 ? 0 : 'auto',
            width: window.innerWidth < 500 ? '100vw' : 'auto',
            background:'#fff',
            borderRadius: window.innerWidth < 500 ? 0 : 12,
            boxShadow:'0 2px 16px #7c4dff22',
            padding: window.innerWidth < 500 ? '1rem 0.5rem' : '1.2rem 1.5rem',
            zIndex:1000,
            minWidth: window.innerWidth < 500 ? undefined : 260,
            maxWidth: window.innerWidth < 500 ? '100vw' : 350,
            maxHeight: window.innerWidth < 500 ? '60vh' : undefined,
            overflowY: window.innerWidth < 500 ? 'auto' : undefined
          }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <h4 style={{margin:'0', color:'#7c4dff', fontSize: window.innerWidth < 500 ? 17 : 20}}>{t('notifications')}</h4>
              <button onClick={()=>setShowNotif(false)} style={{background:'none', border:'none', color:'#e53935', fontSize:22, fontWeight:900, cursor:'pointer', marginRight:2, marginTop:-2}}>&times;</button>
            </div>
            {notifications.length === 0 ? (
              <div style={{color:'#888', fontSize: window.innerWidth < 500 ? 14 : 15}}>{t('no_notifications')}</div>
            ) : notifications.map(n => (
              <div key={n._id} style={{background:'#f7fafd', borderRadius:8, padding: window.innerWidth < 500 ? '0.5rem 0.7rem' : '0.7rem 1rem', marginBottom:7, color:'#444', fontWeight:600, fontSize: window.innerWidth < 500 ? 13 : 15}}>
                {n.type === 'new_appointment' ? renderNewAppointmentNotification(n.message, t) : n.message}
                <div style={{fontSize: window.innerWidth < 500 ? 11 : 12, color:'#888', marginTop:4}}>{formatKurdishDateTime(n.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
        {/* نافذة إضافة موعد خاص */}
        {showAdd && (
          <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.18)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000}}>
            <div style={{background:'#fff', borderRadius:20, boxShadow:'0 8px 32px rgba(0,0,0,0.2)', padding:'2.5rem 2rem', minWidth:450, maxWidth:600, maxHeight:'90vh', overflowY:'auto'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
                <h3 style={{color:'#00bcd4', fontWeight:800, fontSize:24, margin:0}}>➕ {t('add_special_appointment')}</h3>
                <button 
                  onClick={()=>{
  setShowAdd(false);
  // إعادة تحميل المواعيد عند إغلاق نافذة الإضافة
  fetchAllAppointments();
}}
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
                  {t('close')}
                </button>
              </div>
              
              <AddSpecialAppointmentForm 
                onClose={()=>{
  setShowAdd(false);
  // إعادة تحميل المواعيد عند إغلاق نافذة الإضافة
  fetchAllAppointments();
}} 
                onAdd={(newAppointment) => {
                  const updatedAppointments = [newAppointment, ...appointments];
                  setAppointments(updatedAppointments);
                  localStorage.setItem('specialAppointments', JSON.stringify(updatedAppointments));
                  setShowAdd(false);
                }}
                profile={profile}
              />
            </div>
          </div>
        )}
        {/* نافذة المواعيد الخاصة */}
        {showSpecialAppointments && (
          <div style={{
            position:'fixed',
            top: 60, // نزّل النافذة للأسفل قليلاً
            left:0,
            width:'100vw',
            height:'calc(100vh - 60px)',
            background:'rgba(0,0,0,0.18)',
            display:'flex',
            alignItems:'flex-start',
            justifyContent:'center',
            zIndex:2000,
            overflowY:'auto',
            padding: window.innerWidth < 500 ? '0.5rem' : '2rem',
          }}>
            <div style={{
              background:'#fff',
              borderRadius:20,
              boxShadow:'0 8px 32px rgba(0,0,0,0.2)',
              padding: window.innerWidth < 500 ? '1.2rem 0.7rem' : '2.5rem 2rem',
              minWidth: window.innerWidth < 500 ? 180 : 320,
              maxWidth: window.innerWidth < 500 ? '98vw' : 1200,
              maxHeight:'90vh',
              overflowX: window.innerWidth < 500 ? 'auto' : 'visible',
              overflowY:'auto',
              width: window.innerWidth < 500 ? '98vw' : undefined,
              position:'relative',
              marginTop: 10,
            }}>
              {/* أزرار علوية: إغلاق وتسجيل خروج */}
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: window.innerWidth < 500 ? 10 : 18}}>
                <button onClick={()=>{
  setShowSpecialAppointments(false);
  // إعادة تحميل المواعيد عند إغلاق نافذة المواعيد الخاصة
  fetchAllAppointments();
}} style={{background:'#e53935', color:'#fff', border:'none', borderRadius:8, padding:'0.4rem 1.1rem', fontWeight:700, fontSize:15, cursor:'pointer'}}>
                  {t('close')}
                </button>
                <button onClick={signOut} style={{background:'#009688', color:'#fff', border:'none', borderRadius:8, padding:'0.4rem 1.1rem', fontWeight:700, fontSize:15, cursor:'pointer'}}>
                  {t('logout')}
                </button>
              </div>
              <div style={{overflowX: window.innerWidth < 500 ? 'auto' : 'visible'}}>
                <SpecialAppointmentsList 
                  appointments={specialAppointments} 
                  onDelete={(id) => {
                    const updatedAppointments = appointments.filter(apt => apt.id !== id);
                    setAppointments(updatedAppointments);
                    localStorage.setItem('specialAppointments', JSON.stringify(updatedAppointments));
                    // إعادة تحميل المواعيد من الخادم
                    fetchAllAppointments();
                  }}
                  onEdit={(appointment) => {
                    setSelectedAppointmentForEdit(appointment);
                    setShowEditSpecial(true);
                  }}
                  onOpenNote={openNoteModal}
                />
              </div>
            </div>
          </div>
        )}
        {/* نافذة تعديل الموعد الخاص */}
        {showEditSpecial && selectedAppointmentForEdit && (
          <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.18)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, overflowY:'auto', padding:'2rem'}}>
            <div style={{background:'#fff', borderRadius:20, boxShadow:'0 8px 32px rgba(0,0,0,0.2)', padding:'2.5rem 2rem', minWidth:450, maxWidth:600, maxHeight:'90vh', overflowY:'auto'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
                <h3 style={{color:'#ff5722', fontWeight:800, fontSize:24, margin:0, display:'flex', alignItems:'center', gap:'0.5rem'}}>
                  ✏️ {t('edit_special_appointment')}
                </h3>
                <button 
                  onClick={() => {
  setShowEditSpecial(false); 
  setSelectedAppointmentForEdit(null);
  // إعادة تحميل المواعيد عند إغلاق نافذة التعديل
  fetchAllAppointments();
}}
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
                  {t('close')}
                </button>
              </div>
              
              <EditSpecialAppointmentForm 
                appointment={selectedAppointmentForEdit}
                onSubmit={(updatedData) => {
                  const updatedAppointments = appointments.map(apt => 
                    apt.id === selectedAppointmentForEdit.id 
                      ? { ...apt, ...updatedData }
                      : apt
                  );
                  setAppointments(updatedAppointments);
                  localStorage.setItem('specialAppointments', JSON.stringify(updatedAppointments));
                  setShowEditSpecial(false);
                  setSelectedAppointmentForEdit(null);
                  alert(t('special_appointment_updated_successfully'));
                  // إعادة تحميل المواعيد من الخادم
                  fetchAllAppointments();
                }}
                onClose={() => {
  setShowEditSpecial(false); 
  setSelectedAppointmentForEdit(null);
  // إعادة تحميل المواعيد عند إغلاق نافذة التعديل
  fetchAllAppointments();
}}
              />
            </div>
          </div>
        )}


        {/* نافذة التواصل */}
        {showContactModal && (
          <div style={{
            position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.18)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3000
          }} onClick={()=>{
  setShowContactModal(false);
  // إعادة تحميل المواعيد عند إغلاق نافذة الاتصال
  fetchAllAppointments();
}}>
            <div style={{
              background:'#fff',
              borderRadius:18,
              boxShadow:'0 4px 24px #7c4dff33',
              padding: window.innerWidth < 500 ? '1.2rem 0.7rem' : '2.2rem 1.5rem',
              minWidth: window.innerWidth < 500 ? 180 : 260,
              maxWidth: window.innerWidth < 500 ? 240 : 350,
              textAlign:'center',
              position:'relative',
              width: window.innerWidth < 500 ? '90vw' : undefined
            }} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>{
  setShowContactModal(false);
  // إعادة تحميل المواعيد عند إغلاق نافذة الاتصال
  fetchAllAppointments();
}} style={{position:'absolute', top:10, left:10, background:'none', border:'none', color:'#e53935', fontSize:window.innerWidth < 500 ? 18 : 22, fontWeight:900, cursor:'pointer'}}>&times;</button>
              <h3 style={{color:'#00bcd4', marginBottom:14, fontWeight:800, fontSize:window.innerWidth < 500 ? 16 : 22}}>{t('contact_info_title')}</h3>
              <div style={{display:'flex', flexDirection:'column', gap:window.innerWidth < 500 ? 10 : 18}}>
                <button onClick={()=>window.open('mailto:tabibiqapp@gmail.com','_blank')} style={{background:'linear-gradient(90deg,#00bcd4 0%,#7c4dff 100%)', color:'#fff', border:'none', borderRadius:14, padding:window.innerWidth < 500 ? '0.6rem 0.7rem' : '1rem 1.2rem', fontWeight:800, fontSize:window.innerWidth < 500 ? 13 : 16, display:'flex', alignItems:'center', gap:8, boxShadow:'0 2px 12px #00bcd422', cursor:'pointer'}}>
                  <span style={{fontSize:window.innerWidth < 500 ? 16 : 22}}>📧</span> {t('email')}: tabibiqapp@gmail.com
                </button>
                <button onClick={()=>window.open('https://wa.me/9647769012619','_blank')} style={{background:'linear-gradient(90deg,#7c4dff 0%,#00bcd4 100%)', color:'#fff', border:'none', borderRadius:14, padding:window.innerWidth < 500 ? '0.6rem 0.7rem' : '1rem 1.2rem', fontWeight:800, fontSize:window.innerWidth < 500 ? 13 : 16, display:'flex', alignItems:'center', gap:8, boxShadow:'0 2px 12px #7c4dff22', cursor:'pointer'}}>
                  <span style={{fontSize:window.innerWidth < 500 ? 16 : 22}}>💬</span> {t('whatsapp')}: +964 776 901 2619
                </button>
              </div>
            </div>
          </div>
        )}
        {/* نافذة تقويم المواعيد المنبثقة */}
        {showCalendarModal && (
          <div style={{
            position:'fixed',
            top:0,
            left:0,
            width:'100vw',
            height:'100vh',
            background:'rgba(0,0,0,0.18)',
            display:'flex',
            alignItems:'flex-start',
            justifyContent:'center',
            zIndex:3000,
            overflowY:'auto',
          }}>
            <div style={{
              background:'#fff',
              borderRadius: window.innerWidth < 500 ? 12 : 20,
              boxShadow:'0 8px 32px rgba(0,0,0,0.2)',
              padding: window.innerWidth < 500 ? '1.2rem 0.5rem' : '2.5rem 2rem',
              minWidth: window.innerWidth < 500 ? '98vw' : 320,
              maxWidth: window.innerWidth < 500 ? '100vw' : 600,
              width: window.innerWidth < 500 ? '100vw' : '95vw',
              position:'relative',
              maxHeight:'85vh',
              overflowY:'auto',
              display:'flex',
              flexDirection:'column',
              marginTop: window.innerWidth < 500 ? 24 : 32
            }}>
              <button onClick={()=>{
  setShowCalendarModal(false);
  // إعادة تحميل المواعيد عند إغلاق نافذة التقويم
  fetchAllAppointments();
}} style={{
                position:'sticky',
                top:0,
                left:0,
                background:'none',
                border:'none',
                color:'#e53935',
                fontSize:22,
                fontWeight:900,
                cursor:'pointer',
                zIndex:10,
                alignSelf:'flex-start',
                marginBottom:8
              }}>&times;</button>
              <DoctorCalendar appointments={appointments} />
            </div>
          </div>
        )}
        {showNoteModal && (
          <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.18)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:4000}}>
            <div style={{background:'#fff', borderRadius:16, boxShadow:'0 8px 32px rgba(0,0,0,0.2)', padding:'2rem 1.5rem', minWidth:300, maxWidth:400, width:'95vw', position:'relative'}}>
              <button onClick={()=>{
  setShowNoteModal(false);
  // إعادة تحميل المواعيد عند إغلاق نافذة الملاحظة
  fetchAllAppointments();
}} style={{position:'absolute', top:10, left:10, background:'none', border:'none', color:'#e53935', fontSize:22, fontWeight:900, cursor:'pointer'}}>&times;</button>
              <h3 style={{color:'#7c4dff', marginBottom:18, fontWeight:700, fontSize:20}}>{t('patient_note')}</h3>
              {!notePhone ? (
                <div style={{marginBottom:14}}>
                  <input type="tel" placeholder={t('patient_phone')} value={notePhone} onChange={e=>setNotePhone(e.target.value)} style={{width:'100%', borderRadius:8, border:'1.5px solid #7c4dff', padding:'0.7rem', fontSize:15, marginBottom:8}} />
                  <button onClick={()=>{
                    const saved = localStorage.getItem('phoneNote_' + notePhone) || '';
                    setNoteValue(saved);
                    // إعادة تحميل المواعيد عند البحث عن الملاحظة
                    fetchAllAppointments();
                  }} style={{background:'#7c4dff', color:'#fff', border:'none', borderRadius:8, padding:'0.5rem 1.2rem', fontWeight:700, fontSize:15, cursor:'pointer'}}>{t('search')}</button>
                </div>
              ) : (
                <>
                  <div style={{color:'#888', fontSize:15, marginBottom:10}}>{t('patient_phone')}: <b>{notePhone}</b></div>
                  <textarea value={noteValue} onChange={e=>setNoteValue(e.target.value)} rows={5} style={{width:'100%', borderRadius:8, border:'1.5px solid #7c4dff', padding:'0.7rem', fontSize:15, marginBottom:14}} placeholder={t('patient_note') + '...'} />
                  <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
                    <button onClick={()=>{
                      localStorage.setItem('phoneNote_' + notePhone, noteValue);
                      setShowNoteModal(false);
                      // إعادة تحميل المواعيد عند حفظ الملاحظة
                      fetchAllAppointments();
                    }} style={{background:'#7c4dff', color:'#fff', border:'none', borderRadius:8, padding:'0.6rem 1.2rem', fontWeight:700, fontSize:15, cursor:'pointer'}}>{t('save_note')}</button>
                    {noteValue && (
                      <button onClick={()=>{
                        localStorage.removeItem('phoneNote_' + notePhone);
                        setNoteValue('');
                        setShowNoteModal(false);
                        // إعادة تحميل المواعيد عند حذف الملاحظة
                        fetchAllAppointments();
                      }} style={{background:'#e53935', color:'#fff', border:'none', borderRadius:8, padding:'0.6rem 1.2rem', fontWeight:700, fontSize:15, cursor:'pointer'}}>{t('delete_note')}</button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// مكون قائمة المواعيد الخاصة
function SpecialAppointmentsList({ appointments, onDelete, onEdit, onOpenNote }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // تصفية وترتيب المواعيد
  const filteredAppointments = appointments
    .filter(apt => {
      const matchesSearch = apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           apt.patientPhone.includes(searchTerm) ||
                           apt.reason.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.date) - new Date(b.date);
        case 'name':
          return a.patientName.localeCompare(b.patientName);
        case 'priority':
          const priorityOrder = { urgent: 3, follow_up: 2, normal: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return new Date(a.date) - new Date(b.date);
      }
    });

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'cancelled': return '#e53935';
      default: return '#666';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#e53935';
      case 'follow_up': return '#ff9800';
      case 'normal': return '#4caf50';
      default: return '#666';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'urgent': return 'عاجلة';
      case 'follow_up': return 'متابعة';
      case 'normal': return 'عادية';
      default: return 'عادية';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (appointments.length === 0) {
    return (
      <div style={{textAlign:'center', padding:'3rem'}}>
        <div style={{fontSize:'4rem', marginBottom:'1rem'}}>⭐</div>
        <h3 style={{color:'#ff5722', marginBottom:'0.5rem'}}>لا توجد مواعيد خاصة</h3>
        <p style={{color:'#666', marginBottom:'2rem'}}>لم يتم إضافة أي موعد خاص بعد</p>
        <button 
          onClick={() => window.location.reload()}
          style={{background:'#ff5722', color:'#fff', border:'none', borderRadius:8, padding:'1rem 2rem', fontWeight:700, cursor:'pointer'}}
        >
          إضافة موعد جديد
        </button>
      </div>
    );
  }

  return (
    <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
      {/* أدوات البحث والتصفية */}
      <div style={{background:'#f8f9fa', borderRadius:12, padding:'1.5rem'}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem', alignItems:'end'}}>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>🔍 البحث</label>
            <input
              type="text"
              placeholder="البحث بالاسم أو رقم الهاتف أو السبب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:14
              }}
            />
          </div>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>📊 تصفية حسب الحالة</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:14,
                backgroundColor:'#fff'
              }}
            >
              <option value="all">جميع المواعيد</option>
              <option value="confirmed">مؤكد</option>
              <option value="pending">في الانتظار</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>🔄 الترتيب حسب</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:14,
                backgroundColor:'#fff'
              }}
            >
              <option value="date">التاريخ</option>
              <option value="name">اسم المريض</option>
              <option value="priority">الأولوية</option>
            </select>
          </div>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'1rem'}}>
        <div style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', padding:'1rem', textAlign:'center'}}>
          <div style={{fontSize:'1.5rem', marginBottom:'0.5rem'}}>📊</div>
          <div style={{fontSize:'1.2rem', fontWeight:700, color:'#ff5722', marginBottom:'0.5rem'}}>{appointments.length}</div>
          <div style={{color:'#666', fontSize:'0.9rem'}}>إجمالي المواعيد</div>
        </div>
        <div style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', padding:'1rem', textAlign:'center'}}>
          <div style={{fontSize:'1.5rem', marginBottom:'0.5rem'}}>✅</div>
          <div style={{fontSize:'1.2rem', fontWeight:700, color:'#4caf50', marginBottom:'0.5rem'}}>
            {appointments.filter(apt => apt.status === 'confirmed').length}
          </div>
          <div style={{color:'#666', fontSize:'0.9rem'}}>مؤكد</div>
        </div>
        <div style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', padding:'1rem', textAlign:'center'}}>
          <div style={{fontSize:'1.5rem', marginBottom:'0.5rem'}}>⏳</div>
          <div style={{fontSize:'1.2rem', fontWeight:700, color:'#ff9800', marginBottom:'0.5rem'}}>
            {appointments.filter(apt => apt.status === 'pending').length}
          </div>
          <div style={{color:'#666', fontSize:'0.9rem'}}>في الانتظار</div>
        </div>
        <div style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', padding:'1rem', textAlign:'center'}}>
          <div style={{fontSize:'1.5rem', marginBottom:'0.5rem'}}>🚨</div>
          <div style={{fontSize:'1.2rem', fontWeight:700, color:'#e53935', marginBottom:'0.5rem'}}>
            {appointments.filter(apt => apt.priority === 'urgent').length}
          </div>
          <div style={{color:'#666', fontSize:'0.9rem'}}>عاجلة</div>
        </div>
      </div>

      {/* قائمة المواعيد */}
      <div style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', overflow:'hidden'}}>
        <div style={{background:'#f8f9fa', padding:'1rem', borderBottom:'1px solid #e0e0e0'}}>
          <span style={{color:'#333', fontWeight:700, fontSize:16}}>
            📋 المواعيد الخاصة ({filteredAppointments.length})
          </span>
        </div>
        <div style={{maxHeight:'400px', overflowY:'auto'}}>
          {filteredAppointments.length === 0 ? (
            <div style={{textAlign:'center', padding:'2rem', color:'#666'}}>
              لا توجد مواعيد تطابق البحث
            </div>
          ) : (
            filteredAppointments.map((appointment, index) => (
              <div key={appointment.id} style={{
                padding:'1.5rem',
                borderBottom:'1px solid #f0f0f0',
                background: index % 2 === 0 ? '#fff' : '#fafafa',
                position:'relative'
              }}>
                {/* شارة الموعد الخاص */}
                <div style={{
                  position:'absolute',
                  top:10,
                  left:10,
                  background:'#ff9800',
                  color:'#fff',
                  borderRadius:8,
                  padding:'0.2rem 0.8rem',
                  fontWeight:800,
                  fontSize:'0.9rem',
                  letterSpacing:1
                }}>
                  موعد خاص
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem'}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex', alignItems:'center', gap:'1rem', marginBottom:'0.5rem', flexWrap:'wrap'}}>
                      <h4 style={{color:'#333', margin:0, fontSize:'1.1rem', fontWeight:700}}>
                        👤 {appointment.patientName}
                        <button onClick={()=>onOpenNote(appointment.patientPhone || appointment.userId?.phone)} style={{marginRight:7, background:'none', border:'none', color:'#7c4dff', cursor:'pointer', fontSize:18}} title="ملاحظة الطبيب">📝</button>
                      </h4>
                      <span style={{
                        background: getStatusColor(appointment.status),
                        color:'#fff',
                        padding:'0.2rem 0.8rem',
                        borderRadius:12,
                        fontSize:'0.8rem',
                        fontWeight:700
                      }}>
                        {appointment.status === 'confirmed' ? 'مؤكد' : 
                         appointment.status === 'pending' ? 'في الانتظار' : 'ملغي'}
                      </span>
                      <span style={{
                        background: getPriorityColor(appointment.priority),
                        color:'#fff',
                        padding:'0.2rem 0.8rem',
                        borderRadius:12,
                        fontSize:'0.8rem',
                        fontWeight:700
                      }}>
                        {getPriorityText(appointment.priority)}
                      </span>
                    </div>
                    
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem', marginBottom:'0.5rem'}}>
                      <div style={{color:'#666', fontSize:'0.9rem'}}>
                        📞 {appointment.patientPhone}
                      </div>
                      <div style={{color:'#666', fontSize:'0.9rem'}}>
                        📅 {formatDate(appointment.date)}
                      </div>
                      <div style={{color:'#666', fontSize:'0.9rem'}}>
                        🕐 {appointment.time} ({appointment.duration} دقيقة)
                      </div>
                    </div>
                    
                    {appointment.reason && (
                      <div style={{color:'#333', fontSize:'0.9rem', marginBottom:'0.5rem'}}>
                        💬 {appointment.reason}
                      </div>
                    )}
                    
                    {appointment.notes && (
                      <div style={{color:'#666', fontSize:'0.8rem', fontStyle:'italic'}}>
                        📝 {appointment.notes}
                      </div>
                    )}
                  </div>
                  
                  <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
                    <button
                      onClick={() => onEdit(appointment)}
                      style={{
                        background:'#00bcd4',
                        color:'#fff',
                        border:'none',
                        borderRadius:6,
                        padding:'0.5rem 1rem',
                        fontWeight:700,
                        cursor:'pointer',
                        fontSize:'0.8rem'
                      }}
                    >
                      ✏️ تعديل
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('هل أنت متأكد من حذف هذا الموعد؟')) {
                          onDelete(appointment.id);
                        }
                      }}
                      style={{
                        background:'#e53935',
                        color:'#fff',
                        border:'none',
                        borderRadius:6,
                        padding:'0.5rem 1rem',
                        fontWeight:700,
                        cursor:'pointer',
                        fontSize:'0.8rem'
                      }}
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// مكون إضافة موعد خاص
function AddSpecialAppointmentForm({ onClose, onAdd, profile }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    date: getToday(),
    time: '09:00',
    reason: '',
    notes: '',
    priority: 'normal', // normal, urgent, follow-up
    duration: '30', // 15, 30, 45, 60 minutes
    status: 'confirmed' // confirmed, pending, cancelled
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUnregisteredPhone, setIsUnregisteredPhone] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // دالة فحص إذا كان الرقم غير مسجل (مبدئيًا: تحقق من عدم وجود userId)
  const checkPhoneRegistered = async (phone) => {
    if (!phone) return false;
    try {
      // توحيد الرقم قبل الفحص
      const normalizedPhone = normalizePhone(phone);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/check-phone-registered?phone=${normalizedPhone}`);
      const data = await res.json();
      return data.registered;
    } catch {
      return false;
    }
  };

  // عند تغيير رقم الهاتف، تحقق إذا كان مسجل
  const handlePhoneChange = async (value) => {
    console.log('🔍 الرقم المدخل:', value);
    
    // توحيد الرقم العراقي
    let normalizedPhone = normalizePhone(value);
    console.log('🔍 الرقم الموحد:', normalizedPhone);
    
    // إزالة +964 من العرض في الحقل
    let displayPhone = normalizedPhone.replace('+964', '');
    if (displayPhone.startsWith('0')) {
      displayPhone = displayPhone.substring(1);
    }
    console.log('🔍 الرقم للعرض:', displayPhone);
    
    handleInputChange('patientPhone', displayPhone);
    
    if (normalizedPhone.length >= 10) {
      const registered = await checkPhoneRegistered(normalizedPhone);
      console.log('🔍 هل الرقم مسجل:', registered);
      setIsUnregisteredPhone(!registered);
    } else {
      setIsUnregisteredPhone(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // توحيد رقم الهاتف العراقي
      const normalizedPhone = normalizePhone(formData.patientPhone);
      console.log('🔍 الرقم الأصلي:', formData.patientPhone);
      console.log('🔍 الرقم الموحد:', normalizedPhone);
      
      // تجهيز بيانات الموعد الخاص
      const specialAppointmentData = {
        userId: null, // يمكن ربطه لاحقاً إذا كان هناك مستخدم
        doctorId: profile?._id,
        userName: formData.patientName,
        doctorName: profile?.name || 'الطبيب',
        date: formData.date,
        time: formData.time,
        reason: formData.reason,
        notes: formData.notes, // الملاحظات الأصلية
        priority: formData.priority,
        duration: formData.duration,
        status: formData.status,
        patientPhone: normalizedPhone // دائماً نحفظ الرقم الموحد في patientPhone
      };
      // إرسال البيانات إلى الباكند
      const res = await fetch(`${process.env.REACT_APP_API_URL}/add-special-appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(specialAppointmentData)
      });
      const result = await res.json();
              if (!result.success) throw new Error(result.error || t('error_adding_special_appointment'));
      // إعادة جلب المواعيد للطبيب
      if (typeof window.fetchDoctorAppointments === 'function') {
        window.fetchDoctorAppointments();
      }
      alert('تم إضافة الموعد الخاص بنجاح!');
      onClose();
    } catch (err) {
              setError(t('error_adding_special_appointment') + ': ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.patientName.trim() && formData.patientPhone.trim() && formData.date && formData.time;

  return (
    <form onSubmit={handleSubmit} style={{
      display:'flex',
      flexDirection:'column',
      gap:'1.2rem',
      maxWidth:400,
      width:'100%',
      margin:'0 auto',
      background:'#fff',
      borderRadius:14,
      boxShadow:'0 2px 12px #00bcd422',
      padding:'1.2rem 1.1rem',
      fontSize:15
    }}>
      {/* معلومات المريض */}
      <div style={{background:'#f8f9fa', borderRadius:10, padding:'1rem', marginBottom:8}}>
        <h4 style={{color:'#00bcd4', marginBottom:'0.7rem', fontWeight:700, fontSize:18, display:'flex', alignItems:'center', gap:'0.5rem'}}>
          👤 {t('patient_info')}
        </h4>
        <div style={{display:'flex', flexDirection:'column', gap:'0.7rem'}}>
          <div>
            <label style={{display:'block', marginBottom:'0.3rem', color:'#333', fontWeight:600, fontSize:13}}>
              {t('patient_name')} *
            </label>
            <input
              type="text"
              placeholder={t('enter_patient_name')}
              value={formData.patientName}
              onChange={(e) => handleInputChange('patientName', e.target.value)}
              style={{
                width:'100%',
                padding:'0.7rem',
                borderRadius:7,
                border:'1.5px solid #e0e0e0',
                fontSize:14,
                transition:'border-color 0.3s'
              }}
              required
            />
          </div>
          <div>
            <label style={{display:'block', marginBottom:'0.3rem', color:'#333', fontWeight:600, fontSize:13}}>
              {t('patient_phone')} *
            </label>
            <input
              type="tel"
              placeholder={t('enter_patient_phone')}
              value={formData.patientPhone}
              onChange={e => handlePhoneChange(e.target.value)}
              style={{
                width:'100%',
                padding:'0.7rem',
                borderRadius:7,
                border:'1.5px solid #e0e0e0',
                fontSize:14
              }}
              required
            />
          </div>
        </div>
      </div>
      {/* باقي الحقول */}
      <div style={{display:'flex', flexDirection:'column', gap:'0.7rem'}}>
        <div>
          <label style={{display:'block', marginBottom:'0.3rem', color:'#333', fontWeight:600, fontSize:13}}>
            {t('date')} *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={e => handleInputChange('date', e.target.value)}
            style={{width:'100%', padding:'0.7rem', borderRadius:7, border:'1.5px solid #e0e0e0', fontSize:14}}
            required
          />
        </div>
        <div>
          <label style={{display:'block', marginBottom:'0.3rem', color:'#333', fontWeight:600, fontSize:13}}>
            {t('time')} *
          </label>
          <input
            type="time"
            value={formData.time}
            onChange={e => handleInputChange('time', e.target.value)}
            style={{width:'100%', padding:'0.7rem', borderRadius:7, border:'1.5px solid #e0e0e0', fontSize:14}}
            required
          />
        </div>
        <div>
          <label style={{display:'block', marginBottom:'0.3rem', color:'#333', fontWeight:600, fontSize:13}}>
            {t('reason')}
          </label>
          <input
            type="text"
            placeholder={t('reason_optional')}
            value={formData.reason}
            onChange={e => handleInputChange('reason', e.target.value)}
            style={{width:'100%', padding:'0.7rem', borderRadius:7, border:'1.5px solid #e0e0e0', fontSize:14}}
          />
        </div>
        {/* إظهار حقل الملاحظة فقط إذا كان الرقم مسجل */}
        {!isUnregisteredPhone && (
          <div>
            <label style={{display:'block', marginBottom:'0.3rem', color:'#333', fontWeight:600, fontSize:13}}>
              {t('notes')}
            </label>
            <textarea
              placeholder={isUnregisteredPhone ? 'إضافة رقم إذا كان غير مسجل' : t('notes_optional')}
              value={formData.notes}
              onChange={e => handleInputChange('notes', e.target.value)}
              style={{width:'100%', padding:'0.7rem', borderRadius:7, border:'1.5px solid #e0e0e0', fontSize:14, minHeight:50}}
            />
          </div>
        )}
      </div>
      <button type="submit" disabled={loading || !isFormValid} style={{
        background:'linear-gradient(90deg,#00bcd4 0%,#009688 100%)',
        color:'#fff',
        border:'none',
        borderRadius:8,
        padding:'0.9rem',
        fontWeight:700,
        fontSize:17,
        marginTop:10,
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow:'0 2px 8px #00bcd422',
        transition:'background 0.3s'
      }}>
        {loading ? t('saving') : t('save_appointment')}
      </button>
      {error && <div style={{color:'#e53935', fontWeight:600, marginTop:7, fontSize:14}}>{error}</div>}
    </form>
  );
}

// مكون تعديل الموعد الخاص
function EditSpecialAppointmentForm({ appointment, onSubmit, onClose }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    patientName: appointment.patientName || '',
    patientPhone: appointment.patientPhone || '',
    date: appointment.date || getToday(),
    time: appointment.time || '09:00',
    duration: appointment.duration || '30',
    priority: appointment.priority || 'normal',
    status: appointment.status || 'confirmed',
    reason: appointment.reason || '',
    notes: appointment.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // التحقق من صحة البيانات
      if (!formData.patientName.trim() || !formData.patientPhone.trim() || !formData.date || !formData.time) {
        throw new Error('يرجى ملء جميع الحقول المطلوبة');
      }

      // إرسال إشعار للمريض عن التعديل
      await sendNotificationToPatient(formData, 'update');

      await onSubmit(formData);
    } catch (err) {
              setError(err.message || t('error_updating_special_appointment'));
    } finally {
      setLoading(false);
    }
  };

  const sendNotificationToPatient = async (appointmentData, type = 'update') => {
    try {

      
      const message = type === 'update' 
        ? `تم تعديل موعدك الخاص إلى ${appointmentData.date} الساعة ${appointmentData.time}`
        : `تم تأكيد موعدك الخاص في ${appointmentData.date} الساعة ${appointmentData.time}`;
      
      const res = await fetch(`${process.env.REACT_APP_API_URL}/send-special-appointment-notification`, {
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientPhone: appointmentData.patientPhone,
          patientName: appointmentData.patientName,
          newDate: appointmentData.date,
          newTime: appointmentData.time,
          doctorName: 'الطبيب',
          reason: appointmentData.reason || 'موعد خاص',
          notes: appointmentData.notes || '',
          type: type
        })
      });
      
      if (res.ok) {
        const result = await res.json();

      } else {

      }
    } catch (err) {
      
      // لا نوقف العملية إذا فشل الإشعار
    }
  };

  const isFormValid = formData.patientName.trim() && formData.patientPhone.trim() && formData.date && formData.time;

  return (
    <form onSubmit={handleSubmit} style={{
      display:'flex',
      flexDirection:'column',
      gap:'1.2rem',
      maxWidth:400,
      width:'100%',
      margin:'0 auto',
      background:'#fff',
      borderRadius:14,
      boxShadow:'0 2px 12px #00bcd422',
      padding:'1.2rem 1.1rem',
      fontSize:15
    }}>
      {/* معلومات المريض */}
      <div style={{background:'#f8f9fa', borderRadius:10, padding:'1rem', marginBottom:8}}>
        <h4 style={{color:'#ff5722', marginBottom:'0.7rem', fontWeight:700, fontSize:18, display:'flex', alignItems:'center', gap:'0.5rem'}}>
          👤 معلومات المريض
        </h4>
        <div style={{display:'flex', flexDirection:'column', gap:'0.7rem'}}>
          <div>
            <label style={{display:'block', marginBottom:'0.3rem', color:'#333', fontWeight:600, fontSize:13}}>
              اسم المريض *
            </label>
            <input
              type="text"
              placeholder="أدخل اسم المريض"
              value={formData.patientName}
              onChange={(e) => handleInputChange('patientName', e.target.value)}
              style={{
                width:'100%',
                padding:'0.7rem',
                borderRadius:7,
                border:'1.5px solid #e0e0e0',
                fontSize:14,
                transition:'border-color 0.3s'
              }}
              required
            />
          </div>
          <div>
            <label style={{display:'block', marginBottom:'0.3rem', color:'#333', fontWeight:600, fontSize:13}}>
              رقم الهاتف *
            </label>
            <input
              type="tel"
              placeholder="7xxxxxxxxx (بدون صفر في البداية)"
              value={formData.patientPhone}
              onChange={e => {
                let value = e.target.value.replace(/\D/g, '');
                handleInputChange('patientPhone', value);
              }}
              style={{
                width:'100%',
                padding:'0.7rem',
                borderRadius:7,
                border:'1.5px solid #e0e0e0',
                fontSize:14
              }}
              required
            />
          </div>
        </div>
      </div>
      {/* باقي الحقول */}
      <div style={{display:'flex', flexDirection:'column', gap:'0.7rem'}}>
        <div>
          <label style={{display:'block', marginBottom:'0.3rem', color:'#333', fontWeight:600, fontSize:13}}>
            التاريخ *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={e => handleInputChange('date', e.target.value)}
            style={{width:'100%', padding:'0.7rem', borderRadius:7, border:'1.5px solid #e0e0e0', fontSize:14}}
            required
          />
        </div>
        <div>
          <label style={{display:'block', marginBottom:'0.3rem', color:'#333', fontWeight:600, fontSize:13}}>
            الوقت *
          </label>
          <input
            type="time"
            value={formData.time}
            onChange={e => handleInputChange('time', e.target.value)}
            style={{width:'100%', padding:'0.7rem', borderRadius:7, border:'1.5px solid #e0e0e0', fontSize:14}}
            required
          />
        </div>
        <div>
          <label style={{display:'block', marginBottom:'0.3rem', color:'#333', fontWeight:600, fontSize:13}}>
            سبب الموعد
          </label>
          <input
            type="text"
            placeholder="سبب الموعد (اختياري)"
            value={formData.reason}
            onChange={e => handleInputChange('reason', e.target.value)}
            style={{width:'100%', padding:'0.7rem', borderRadius:7, border:'1.5px solid #e0e0e0', fontSize:14}}
          />
        </div>
        <div>
          <label style={{display:'block', marginBottom:'0.3rem', color:'#333', fontWeight:600, fontSize:13}}>
            ملاحظات
          </label>
          <textarea
            placeholder="ملاحظات إضافية (اختياري)"
            value={formData.notes}
            onChange={e => handleInputChange('notes', e.target.value)}
            style={{width:'100%', padding:'0.7rem', borderRadius:7, border:'1.5px solid #e0e0e0', fontSize:14, minHeight:50}}
          />
        </div>
      </div>
      <button type="submit" disabled={loading || !isFormValid} style={{
        background:'linear-gradient(90deg,#ff5722 0%,#e53935 100%)',
        color:'#fff',
        border:'none',
        borderRadius:8,
        padding:'0.9rem',
        fontWeight:700,
        fontSize:17,
        marginTop:10,
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow:'0 2px 8px #e5393522',
        transition:'background 0.3s'
      }}>
        {loading ? 'جاري التحديث...' : '✏️ تحديث الموعد'}
      </button>
      {error && <div style={{color:'#e53935', fontWeight:600, marginTop:7, fontSize:14}}>{error}</div>}
    </form>
  );
}

export default DoctorDashboard;

 

// دالة تعريب التاريخ والوقت للإشعارات
function formatKurdishDateTime(dateString) {
  const date = new Date(dateString);
  const months = [
    'کانونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران',
    'تەمموز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانونی یەکەم'
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${date.getMonth()+1}/${year} ${hour}:${min}:${sec}`;
}

function renderNewAppointmentNotification(message, t) {
  // مثال: "تم حجز موعد جديد من قبل عثمان f;v في 2025-07-26 الساعة 08:00"
  const match = message.match(/من قبل (.+) في ([0-9\-]+) الساعة ([0-9:]+)/);
  if (match) {
    const [, name, date, time] = match;
    return t('notification_new_appointment', { name, date, time });
  }
  return message;
}