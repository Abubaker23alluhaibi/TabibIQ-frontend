import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ar } from 'date-fns/locale';
// استيراد swiper/react بالطريقة الحديثة
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { useTranslation } from 'react-i18next';

function DoctorDetails() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [success, setSuccess] = useState('');
  const [booking, setBooking] = useState(false);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [bookedTimes, setBookedTimes] = useState([]);
  const { t } = useTranslation();
  const specialties = t('specialties', { returnObjects: true }) || [];
  const provinces = t('provinces', { returnObjects: true }) || [];
  const weekdays = t('weekdays', { returnObjects: true }) || ['شەممە', 'یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی'];
  const months = t('months', { returnObjects: true }) || [
    'کانونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران',
    'تەمموز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانونی یەکەم'
  ];
  const [showImageModal, setShowImageModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // دالة مساعدة لمسار صورة الدكتور
  const getImageUrl = (doctor) => {
    // التحقق من كلا الحقلين: image و profileImage
    const img = doctor.image || doctor.profileImage;
    if (!img) {
      // إرجاع شعار المشروع كصورة افتراضية
      return '/logo.png';
    }
    if (img.startsWith('/uploads/')) {
      // محاولة تحميل الصورة الحقيقية من الخادم
      return process.env.REACT_APP_API_URL + img;
    }
    if (img.startsWith('http')) return img;
    // إرجاع شعار المشروع كصورة افتراضية
    return '/logo.png';
  };

  // إضافة console.log لرؤية بيانات المستخدم
useEffect(() => {
  // console.log for debugging
}, [user, profile]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/doctors`)
      .then(res => res.json())
      .then(data => {
        const found = data.find(d => d._id === id);
        setDoctor(found);
        setLoading(false);
      })
      .catch(err => {
        setError(t('error_fetching_doctor_data'));
        setLoading(false);
      });
  }, [id]);

  // استخراج الأيام المتاحة من workTimes
  const getAvailableDays = () => {
    if (!doctor?.workTimes) return [];
    return doctor.workTimes.map(wt => wt.day).filter(Boolean);
  };

  // تقسيم الفترة الزمنية إلى مواعيد منفصلة كل 30 دقيقة
  const generateTimeSlots = (from, to) => {
    const slots = [];
    
    // التأكد من أن from و to هما strings
    if (typeof from !== 'string' || typeof to !== 'string') {
      
      return [];
    }
    
    try {
      const start = new Date(`2000-01-01 ${from}`);
      const end = new Date(`2000-01-01 ${to}`);
      
      while (start < end) {
        const timeString = start.toTimeString().slice(0, 5);
        slots.push(timeString);
        start.setMinutes(start.getMinutes() + 30); // كل 30 دقيقة
      }
    } catch (error) {
      
      return [];
    }
    
    return slots;
  };

  // جلب المواعيد المحجوزة لطبيب معين في تاريخ محدد
  const fetchBookedAppointments = async (doctorId, date) => {
    try {
      const userId = user?._id || user?.id;
      console.log('🔍 fetchBookedAppointments - user:', user);
      console.log('🔍 fetchBookedAppointments - userId:', userId);
      
      if (!userId) {
        console.log('❌ لا يوجد مستخدم مسجل');
        setBookedTimes([]);
        return;
      }
      
      const res = await fetch(`${process.env.REACT_APP_API_URL}/appointments/${doctorId}/${date}?patientId=${userId}`);
      if (res.ok) {
        const appointments = await res.json();
        const bookedTimeSlots = appointments.map(apt => apt.time);
        setBookedTimes(bookedTimeSlots);
      } else if (res.status === 401) {
        console.log('❌ يجب تسجيل الدخول أولاً');
        setBookedTimes([]);
      } else {
        console.log('❌ خطأ في جلب المواعيد المحجوزة:', res.status);
        setBookedTimes([]);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب المواعيد المحجوزة:', error);
      setBookedTimes([]);
    }
  };

  // عند اختيار يوم بالتقويم، أظهر الأوقات المتاحة لذلك اليوم
  useEffect(() => {
    if (!selectedDate || !doctor?.workTimes) {
      setAvailableTimes([]);
      setBookedTimes([]);
      return;
    }
    // ترتيب الأيام حسب جافاسكريبت: الأحد=0، الاثنين=1، ... السبت=6
    const weekDays = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const dayName = weekDays[selectedDate.getDay()];
    const times = doctor.workTimes.filter(wt => wt.day === dayName);
    
    
    
    // تقسيم كل فترة زمنية إلى مواعيد منفصلة
    const allSlots = [];
    times.forEach(wt => {
      if (wt.from && wt.to) {
        const slots = generateTimeSlots(wt.from, wt.to);
        allSlots.push(...slots);
      }
    });
    
    
    setAvailableTimes(allSlots);
    setSelectedTime('');
    
    // جلب المواعيد المحجوزة لهذا اليوم
    const dateString = selectedDate.toISOString().slice(0,10);
    fetchBookedAppointments(doctor._id, dateString);
  }, [selectedDate, doctor]);

  // تحديد الأيام المتاحة للتقويم
  const isDayAvailable = date => {
    // ترتيب الأيام حسب جافاسكريبت: الأحد=0، الاثنين=1، ... السبت=6
    const weekDays = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const dayName = weekDays[date.getDay()];
    return getAvailableDays().includes(dayName);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    
    const userId = user?.id || user?._id;
    console.log('🔍 handleBook - user:', user);
    console.log('🔍 handleBook - userId:', userId);
    
    // فحص البيانات قبل الإرسال
    if (!userId) {
      setSuccess('يجب تسجيل الدخول أولاً');
      return;
    }
    
    // فحص حالة تسجيل الدخول في قاعدة البيانات
    try {
      const authCheck = await fetch(`${process.env.REACT_APP_API_URL}/check-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId })
      });
      
      const authData = await authCheck.json();
      
      if (!authCheck.ok || !authData.authenticated) {
        console.log('❌ User not authenticated in database');
        setSuccess('يجب تسجيل الدخول أولاً - المستخدم غير موجود في قاعدة البيانات');
        return;
      }
      
      console.log('✅ User authenticated in database');
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
      setSuccess('خطأ في التحقق من تسجيل الدخول');
      return;
    }
    
    if (!selectedDate || !selectedTime) {
      setSuccess('يرجى اختيار التاريخ والوقت');
      return;
    }
    
    setBooking(true);
    setSuccess('');
    
    // إصلاح مشكلة التاريخ - استخدام التاريخ المحلي بدلاً من UTC
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const bookingData = {
      patientId: userId,
      doctorId: doctor._id,
      date: formatDate(selectedDate),
      time: selectedTime,
      type: 'consultation',
      notes: reason || '',
      symptoms: reason || ''
    };
    
    console.log('🔍 Booking data being sent:', bookingData);
    console.log('🔍 User object:', user);
    console.log('🔍 Profile object:', profile);
    
    
    
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      const data = await res.json();
      
      if (res.ok) {
        // إنشاء إشعار للطبيب
        try {
          await fetch(`${process.env.REACT_APP_API_URL}/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id || user._id,
              doctorId: doctor._id,
              title: 'موعد جديد',
              message: `تم حجز موعد جديد من قبل ${profile?.first_name || 'مستخدم'} في ${bookingData.date} الساعة ${bookingData.time}`,
              type: 'appointment'
            })
          });
          console.log('✅ تم إنشاء إشعار للطبيب بنجاح');
        } catch (notificationError) {
          console.error('❌ خطأ في إنشاء الإشعار:', notificationError);
          // لا نوقف العملية إذا فشل الإشعار
        }
        
        setSuccess('تم حجز الموعد بنجاح!');
        setSelectedDate(null);
        setSelectedTime('');
        setReason('');
      } else if (res.status === 401) {
        setSuccess('يجب تسجيل الدخول أولاً');
      } else {
        setSuccess(data.error || data.message || t('error_booking_appointment'));
      }
    } catch (err) {
      console.error('❌ خطأ في الحجز:', err);
      setSuccess(t('error_booking_appointment'));
    }
    setBooking(false);
  };

  if (loading) return <div style={{textAlign:'center', marginTop:40}}>جاري التحميل...</div>;
  if (error || !doctor) return <div style={{textAlign:'center', marginTop:40, color:'#e53935'}}>{error || 'لم يتم العثور على الطبيب'}</div>;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #00bcd4 0%, #009688 100%)',
      minHeight: '100vh',
      position: 'relative'
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
      {/* مودال تكبير الصورة */}
      {showImageModal && (
        <div onClick={()=>setShowImageModal(false)} style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000}}>
          <div style={{position:'relative', background:'none'}} onClick={e=>e.stopPropagation()}>
            <img 
              src={getImageUrl(doctor)} 
              alt={doctor.name} 
              onError={(e) => {
                // إذا فشل تحميل الصورة الحقيقية، استخدم شعار المشروع
                e.target.src = '/logo.png';
              }}
              style={{maxWidth:'90vw', maxHeight:'80vh', borderRadius:18, boxShadow:'0 4px 32px #0008'}} 
            />
            <button onClick={()=>setShowImageModal(false)} style={{position:'absolute', top:10, left:10, background:'#e53935', color:'#fff', border:'none', borderRadius:8, fontSize:22, fontWeight:900, padding:'0.2rem 0.8rem', cursor:'pointer'}}>×</button>
          </div>
        </div>
      )}
      <div style={{maxWidth:500, margin:'2rem auto', background:'#fff', borderRadius:18, boxShadow:'0 2px 16px #7c4dff22', padding:'2.5rem 2rem', position:'relative', zIndex:1}}>
        {/* زر نسخ رابط صفحة الدكتور */}
        <div style={{display:'flex', justifyContent:'flex-end', marginBottom:8}}>
          <button
            onClick={() => {
              if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(window.location.href)
                  .then(() => {
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  })
                  .catch(() => {
                    alert('تعذر النسخ تلقائياً. يرجى تحديد الرابط ونسخه يدوياً.');
                  });
              } else {
                // fallback: تحديد النص يدوياً
                const textArea = document.createElement("textarea");
                textArea.value = window.location.href;
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                  document.execCommand('copy');
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                } catch (err) {
                  alert('تعذر النسخ تلقائياً. يرجى تحديد الرابط ونسخه يدوياً.');
                }
                document.body.removeChild(textArea);
              }
            }}
            style={{background:'#e0f7fa', color:'#009688', border:'1.5px solid #b2dfdb', borderRadius:8, padding:'0.5rem 1.1rem', fontWeight:700, fontSize:15, cursor:'pointer', boxShadow:'0 2px 8px #00bcd422', display:'flex', alignItems:'center', gap:6}}
            title="نسخ رابط صفحة الدكتور"
          >
            <span style={{fontSize:18}}>🔗</span> نسخ رابط الصفحة
          </button>
        </div>
        {copySuccess && <div style={{color:'#00c853', textAlign:'center', fontWeight:700, marginBottom:8}}>تم نسخ الرابط!</div>}
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:12}}>
          {/* مستطيل ملون لاسم الطبيب والتخصص فقط */}
          <div style={{background:'linear-gradient(90deg,#7c4dff 0%,#00bcd4 100%)', borderRadius:16, padding:'1.2rem 1.5rem', marginBottom:18, width:'100%', maxWidth:340, boxShadow:'0 2px 12px #00bcd422', display:'flex', flexDirection:'column', alignItems:'center'}}>
            <div style={{fontWeight:900, fontSize:22, color:'#fff', marginBottom:6}}>{doctor.name}</div>
            <div style={{color:'#fff', fontWeight:700, fontSize:17, letterSpacing:0.5}}>{specialties[doctor.specialty] || doctor.specialty}</div>
          </div>
          {/* باقي المعلومات كما هي */}
          <img 
            src={getImageUrl(doctor)} 
            alt={doctor.name} 
            onError={(e) => {
              // إذا فشل تحميل الصورة الحقيقية، استخدم شعار المشروع
              e.target.src = '/logo.png';
            }}
            style={{width:90, height:90, borderRadius:'50%', objectFit:'cover', border:'3px solid #7c4dff', cursor:'pointer'}} 
            title="اضغط لتكبير الصورة" 
            onClick={()=>setShowImageModal(true)} 
          />
          <div style={{fontWeight:900, fontSize:26, color:'#222'}}>{doctor.name}</div>
          <div style={{color:'#7c4dff', fontWeight:700, fontSize:18}}>{specialties[doctor.specialty] || doctor.specialty}</div>
          <div style={{fontSize:16, color:'#888'}}>
            <span role="img" aria-label="governorate">🏛️</span> {provinces[doctor.province] || doctor.province} &nbsp;
            <span role="img" aria-label="area">📍</span> {doctor.area}
          </div>
          {doctor.clinicLocation && <div style={{color:'#444', fontSize:15, marginTop:6}}><b>{t('clinic_location_label')}:</b> {doctor.clinicLocation}</div>}
          {doctor.phone && <div style={{color:'#444', fontSize:15, marginTop:6}}><b>{t('phone_label')}:</b> {doctor.phone}</div>}
          {doctor.about && <div style={{color:'#333', fontSize:16, marginTop:18, textAlign:'center', lineHeight:1.8, background:'#f7fafd', borderRadius:10, padding:'1rem 0.7rem'}}><b>{t('about_doctor_label')}:</b><br/>{doctor.about}</div>}
        </div>
        {/* الأوقات المتاحة */}
        <div style={{marginTop:30}}>
          <div style={{fontWeight:700, fontSize:18, color:'#7c4dff', marginBottom:10}}>{t('choose_booking_day')}</div>
          {/* شريط أيام الأسبوع بالكردية */}
          <div style={{display:'flex', justifyContent:'space-between', margin:'0 0 6px 0', fontWeight:700, color:'#7c4dff', fontSize:15}}>
            {weekdays.map(day => (
              <div key={day} style={{width:'14.2%', textAlign:'center'}}>{day}</div>
            ))}
          </div>
          {/* اسم الشهر والسنة بالكردية */}
          {selectedDate && (
            <div style={{textAlign:'center', color:'#009688', fontWeight:800, fontSize:17, marginBottom:4}}>
              {months[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </div>
          )}
          {/* التقويم الشهري الافتراضي بدون تخصيص */}
          <DatePicker
            selected={selectedDate}
            onChange={date => setSelectedDate(date)}
            filterDate={isDayAvailable}
            placeholderText="اختر يوم متاح..."
            dateFormat="yyyy-MM-dd"
            minDate={new Date()}
            inline
            locale={ar}
          />
          {selectedDate && availableTimes.length > 0 && (
            <div style={{marginTop:18}}>
              <div style={{fontWeight:700, fontSize:16, color:'#7c4dff', marginBottom:8}}>اختر موعد الحجز:</div>
              <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                {availableTimes.map((time, idx) => {
                  const isBooked = bookedTimes.includes(time);
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isBooked}
                      onClick={()=>!isBooked && setSelectedTime(time)}
                      style={{
                        background: isBooked ? '#fafafa' : (selectedTime === time ? '#7c4dff' : '#f0f0f0'),
                        color: isBooked ? '#b0b0b0' : (selectedTime === time ? '#fff' : '#333'),
                        border: isBooked ? '1px solid #e8e8e8' : 'none',
                        borderRadius:12, padding:'0.8rem 1.2rem', fontWeight: isBooked ? 400 : 700, fontSize:14, 
                        cursor: isBooked ? 'not-allowed' : 'pointer', 
                        boxShadow: selectedTime === time ? '0 2px 8px #7c4dff44' : (isBooked ? 'none' : '0 1px 4px #00000022'),
                        transition:'all 0.2s ease', minWidth:80, textAlign:'center',
                        opacity: isBooked ? 0.25 : 1,
                        position: 'relative',
                        filter: isBooked ? 'grayscale(50%)' : 'none'
                      }}
                    >
                      {time} {isBooked && <span style={{fontSize: '11px', color: '#a0a0a0', fontWeight: 400}}>(محجوز)</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {/* نموذج الحجز */}
        <form onSubmit={handleBook} style={{marginTop:18, display:'flex', flexDirection:'column', gap:10}}>
          <input type="hidden" value={selectedDate ? selectedDate.toISOString().slice(0,10) : ''} />
          <input type="hidden" value={selectedTime} />
          <label>{t('reason_optional')}</label>
          <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={2} style={{padding:8, borderRadius:7, border:'2px solid #00bcd4', outline:'none', fontSize:16, minHeight:48, background:'#f7fafd'}} />
          <button type="submit" disabled={booking || !selectedDate || !selectedTime} style={{background:'#7c4dff', color:'#fff', border:'none', borderRadius:8, padding:'0.7rem 0', fontWeight:700, fontSize:17, cursor:'pointer', marginTop:8}}>
            {booking ? t('booking_in_progress') : t('book_appointment_button')}
          </button>
          {success && <div style={{color:'#00c853', fontWeight:700, marginTop:8}}>{success}</div>}
        </form>
      </div>
    </div>
  );
}

export default DoctorDetails; 