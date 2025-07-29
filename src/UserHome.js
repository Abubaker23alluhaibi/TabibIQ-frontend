
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import DoctorCard from './DoctorCard';
import './Login.css';
import { useTranslation } from 'react-i18next';

function UserHome() {
  const navigate = useNavigate();
  const { signOut, profile, user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [lang, setLang] = useState('AR');
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoriteDoctors, setFavoriteDoctors] = useState([]);
  const [suggestedDoctors, setSuggestedDoctors] = useState([]);
  const [province, setProvince] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  // 1. أضف حالة لإظهار المودال
  const [showContactModal, setShowContactModal] = useState(false);
  const { t } = useTranslation();
  const provinces = t('provinces', { returnObjects: true });
  // جلب التخصصات من الترجمة حسب اللغة
  const specialtiesGrouped = t('specialty_categories', { returnObjects: true }) || [];
  const allCategories = specialtiesGrouped.map(cat => cat.category);
  const allSubSpecialties = specialtiesGrouped.flatMap(cat => cat.specialties);

  // state جديد
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);

  // دالة اختيار من البحث
  function handleSearchSelect(value) {
    if (allCategories.includes(value)) {
      setSelectedCategory(value);
      setSelectedSpecialty("");
    } else if (allSubSpecialties.includes(value)) {
      setSelectedSpecialty(value);
      // حدد التخصص العام تلقائياً إذا كان التخصص الفرعي تابع له
      const parentCat = specialtiesGrouped.find(cat => cat.specialties.includes(value));
      if (parentCat) setSelectedCategory(parentCat.category);
    }
    setSearchValue("");
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  useEffect(() => {
    console.log('🔄 جلب الأطباء من:', (process.env.REACT_APP_API_URL || 'https://tabib-iq-backend-production.up.railway.app') + '/doctors');
    
   fetch((process.env.REACT_APP_API_URL || 'https://tabib-iq-backend-production.up.railway.app') + '/doctors')
      .then(res => {
        console.log('📊 استجابة جلب الأطباء:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('✅ تم جلب الأطباء:', data.length);
        // التأكد من أن البيانات مصفوفة
        const doctorsArray = Array.isArray(data) ? data : [];
        // استبعاد الأطباء المعطلين
        const enabledDoctors = doctorsArray.filter(doc => !doc.disabled);
        // فصل الأطباء المميزين عن العاديين
        const featuredDoctors = enabledDoctors.filter(doc => doc.is_featured && doc.status === 'approved');
        const regularDoctors = enabledDoctors.filter(doc => !doc.is_featured && doc.status === 'approved');
        // خلط الأطباء العاديين بشكل عشوائي
        const shuffledRegularDoctors = regularDoctors.sort(() => Math.random() - 0.5);
        // دمج الأطباء المميزين أولاً ثم العاديين
        const sortedDoctors = [...featuredDoctors, ...shuffledRegularDoctors];
        setSuggestedDoctors(sortedDoctors);
        setDoctors(sortedDoctors);
      })
      .catch(err => {
        console.error('❌ خطأ في جلب الأطباء:', err);
        setSuggestedDoctors([]);
        setDoctors([]);
      });
  }, []);

  // عدل منطق الفلترة ليأخذ بالحسبان التخصص العام والفرعي
  useEffect(() => {
    let filtered = suggestedDoctors;
    if (province) {
      filtered = filtered.filter(d => d.province === province);
    }
    if (selectedCategory) {
      // فلترة حسب التخصص العام (إذا كان الطبيب تخصصه الفرعي ضمن هذه الفئة)
      const cat = specialtiesGrouped.find(c => c.category === selectedCategory);
      if (cat) {
        filtered = filtered.filter(d => cat.specialties.includes(d.specialty));
      }
    }
    if (selectedSpecialty) {
      filtered = filtered.filter(d => d.specialty === selectedSpecialty);
    }
    if (search) {
      filtered = filtered.filter(d =>
        (d.name && d.name.toLowerCase().includes(search.toLowerCase())) ||
        (d.fullName && d.fullName.toLowerCase().includes(search.toLowerCase())) ||
        (d.name_ar && d.name_ar.toLowerCase().includes(search.toLowerCase())) ||
        (d.name_en && d.name_en.toLowerCase().includes(search.toLowerCase())) ||
        (d.name_ku && d.name_ku.toLowerCase().includes(search.toLowerCase())) ||
        (d.specialty && d.specialty.toLowerCase().includes(search.toLowerCase())) ||
        (d.specialty_ar && d.specialty_ar.toLowerCase().includes(search.toLowerCase())) ||
        (d.specialty_en && d.specialty_en.toLowerCase().includes(search.toLowerCase())) ||
        (d.specialty_ku && d.specialty_ku.toLowerCase().includes(search.toLowerCase())) ||
        (d.category && d.category.toLowerCase().includes(search.toLowerCase())) ||
        (d.category_ar && d.category_ar.toLowerCase().includes(search.toLowerCase())) ||
        (d.category_en && d.category_en.toLowerCase().includes(search.toLowerCase())) ||
        (d.category_ku && d.category_ku.toLowerCase().includes(search.toLowerCase()))
      );
    }
    setSuggestions(filtered.slice(0, 7));
  }, [search, selectedSpecialty, selectedCategory, province, suggestedDoctors]);

  // ربط البحث السريع مع الفلترة الفعلية
  useEffect(() => {
    setSearch(searchValue);
  }, [searchValue]);

  // تحميل الأطباء المفضلين
  useEffect(() => {
    if (user) {
      // loadFavoriteDoctors(); // معلق مؤقتاً حتى يتم إنشاء endpoint
    }
  }, [user]);

  // جلب إشعارات المستخدم
  useEffect(() => {
    if (!user?._id) return;
          fetch(`${process.env.REACT_APP_API_URL || 'https://tabib-iq-backend-production.up.railway.app'}/notifications?userId=${user._id}`)
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          console.log('❌ خطأ في جلب الإشعارات:', res.status);
          return [];
        }
      })
      .then(data => {
        if (!Array.isArray(data)) {
          setNotifications([]);
          setNotifCount(0);
          return;
        }
        setNotifications(data);
        setNotifCount(data.filter(n => !n.isRead).length);
      })
      .catch(err => {
        console.error('❌ خطأ في جلب الإشعارات:', err);
        setNotifications([]);
        setNotifCount(0);
      });
  }, [user?._id, showNotif]);

  // تعليم كل الإشعارات كمقروءة عند فتح نافذة الإشعارات
  useEffect(() => {
    if (showNotif && user?._id && notifCount > 0) {
      setNotifCount(0); // تصفير العداد فوراً
              fetch(`${process.env.REACT_APP_API_URL || 'https://tabib-iq-backend-production.up.railway.app'}/notifications/mark-read?userId=${user._id}`, { method: 'PUT' })
        .then(res => {
          if (!res.ok) {
            console.log('❌ خطأ في تحديث حالة قراءة الإشعارات:', res.status);
          }
        })
        .catch(err => {
          console.error('❌ خطأ في تحديث حالة قراءة الإشعارات:', err);
        });
    }
  }, [showNotif, user?._id]);
  const loadFavoriteDoctors = async () => {
    try {
      // معلق مؤقتاً - endpoint غير موجود
      return;
      
      // const response = await fetch('http://localhost:5000/api/favorites', {
      //   headers: {
      //     'Authorization': `Bearer ${user.access_token}`
      //   }
      //   });

      //   if (response.ok) {
      //     const { favorites } = await response.json();
      //     setFavoriteDoctors(favorites);
      //     setFavoriteIds(favorites.map(doc => doc.id));
      //   }
    } catch (error) {
      // Error loading favorites
    }
  };

  const toggleFavorite = async (doctorId) => {
    try {
      const response = await fetch((process.env.REACT_APP_API_URL || 'https://tabib-iq-backend-production.up.railway.app') + '/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({ doctor_id: doctorId })
      });

      if (response.ok) {
        setFavoriteIds(fav => [...fav, doctorId]);
        // إضافة الطبيب لقائمة المفضلين
        const doctor = doctors.find(d => d.id === doctorId);
        if (doctor) {
          setFavoriteDoctors(fav => [...fav, doctor]);
        }
      }
    } catch (error) {
      // Error toggling favorite
    }
  };

  // دالة مساعدة لمسار صورة الدكتور
  const getImageUrl = img => {
    if (!img) return 'https://randomuser.me/api/portraits/men/32.jpg';
    if (img.startsWith('/uploads/')) return (process.env.REACT_APP_API_URL || 'https://tabib-iq-backend-production.up.railway.app') + img;
    if (img.startsWith('http')) return img;
    return 'https://randomuser.me/api/portraits/men/32.jpg';
  };

  // دالة مساعدة للتصميم المتجاوب
  const isMobile = () => window.innerWidth <= 768;
  
  // دالة مساعدة لحجم الصورة
  const getImageSize = () => isMobile() ? 50 : 70;
  
  // دالة مساعدة لحجم الخط
  const getFontSize = (mobile, desktop) => isMobile() ? mobile : desktop;
  
  // دالة مساعدة للتباعد
  const getGap = (mobile, desktop) => isMobile() ? mobile : desktop;

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
    return `${day} ${month} ${year}، ${hour}:${min}`;
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

  function renderSpecialAppointmentNotification(message, t) {
    // مثال: "تم حجز موعد خاص لك مع الطبيب ابوبكر كسار بتاريخ 2025-07-26 الساعة 09:00"
    const match = message.match(/مع الطبيب (.+) بتاريخ ([0-9\-]+) الساعة ([0-9:]+)/);
    if (match) {
      const [, doctor, date, time] = match;
      return t('notification_special_appointment', { doctor, date, time });
    }
    return message;
  }

  const isRTL = lang === 'AR' || lang === 'KU';

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
        pointerEvents: 'none'
      }} />
      {/* الشريط العلوي العصري */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        boxShadow: '0 4px 20px rgba(0, 188, 212, 0.15)',
        borderBottomLeftRadius: 18, 
        borderBottomRightRadius: 18,
        padding: isMobile() ? '0.7rem 1rem' : '0.7rem 1.2rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        position: 'relative', 
        minHeight: 64,
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 188, 212, 0.1)'
      }}>
        {/* شعار مع أيقونة */}
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <img src="/logo192.png" alt="Logo" style={{width: isMobile() ? 38 : 44, height: isMobile() ? 38 : 44, borderRadius: '50%', background: '#fff', border: '4px solid #fff', boxShadow: '0 4px 16px #00bcd455', objectFit: 'cover', marginRight: 4}} />
          <span style={{color:'#009688', fontWeight:900, fontSize: isMobile() ? 20 : 24, letterSpacing:1, marginRight:4}}>{t('app_name')}</span>
        </div>
        {/* عناصر الزاوية: الهامبرغر ثم الإشعارات */}
        <div style={{display:'flex', alignItems:'center', gap:8, flexDirection: isRTL ? 'row-reverse' : 'row'}}>
          {/* زر الهامبرغر */}
          <button onClick={()=>setDrawerOpen(true)} style={{background:'none', border:'none', cursor:'pointer', padding:8, display:'flex', alignItems:'center'}}>
            <span style={{fontSize:28, color:'#009688', fontWeight:900}}>&#9776;</span>
          </button>
          {/* زر تنبيهات فقط */}
          <div style={{position:'relative'}}>
            <button style={{
              background: 'rgba(0, 188, 212, 0.1)', 
              border: 'none', 
              borderRadius: '50%', 
              width: isMobile() ? 34 : 38, 
              height: isMobile() ? 34 : 38, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: isMobile() ? 18 : 20, 
              cursor: 'pointer', 
              boxShadow: '0 2px 8px rgba(0, 188, 212, 0.2)',
              transition: 'all 0.3s ease'
            }} onClick={()=>setShowNotif(!showNotif)}>
              <svg width={isMobile() ? 20 : 22} height={isMobile() ? 20 : 22} fill="none" viewBox="0 0 24 24">
                <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z" stroke="#009688" strokeWidth="2"/>
              </svg>
            </button>
            {notifCount > 0 && <span style={{position:'absolute', top:2, right:2, background:'#e53935', color:'#fff', borderRadius:'50%', fontSize: isMobile() ? 10 : 12, minWidth: isMobile() ? 16 : 18, height: isMobile() ? 16 : 18, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700}}>{notifCount}</span>}
          </div>
        </div>
      </div> {/* نهاية الشريط العلوي */}
      {/* القائمة الجانبية (Drawer) */}
      {drawerOpen && (
        <div onClick={()=>setDrawerOpen(false)} style={{position:'fixed', top:0, left:isRTL ? 'unset' : 0, right:isRTL ? 0 : 'unset', width:'100vw', height:'100vh', background:'rgba(0,0,0,0.25)', zIndex:2000, display:'flex', justifyContent:isRTL ? 'flex-end' : 'flex-start'}}>
          <div onClick={e=>e.stopPropagation()} style={{width:260, height:'100%', background:'#fff', boxShadow:'0 2px 16px #00bcd422', padding:'2rem 1.2rem', display:'flex', flexDirection:'column', gap:18, direction:isRTL ? 'rtl' : 'ltr'}}>
            <button onClick={()=>setDrawerOpen(false)} style={{background:'none', border:'none', color:'#e53935', fontSize:26, fontWeight:900, alignSelf:isRTL ? 'flex-start' : 'flex-end', cursor:'pointer', marginBottom:8}}>&times;</button>
            <button onClick={() => {setShowContactModal(true); setDrawerOpen(false);}} style={{background:'linear-gradient(90deg,#00bcd4 0%,#7c4dff 100%)', color:'#fff', border:'none', borderRadius:12, padding:'0.7rem 1.1rem', fontWeight:800, fontSize:15, cursor:'pointer', boxShadow:'0 2px 8px #7c4dff22', display:'flex', alignItems:'center', gap:6}}><span style={{fontSize:18}}>📞</span>{t('contact_us')}</button>
            <button onClick={()=>{setShowFavorites(!showFavorites); setDrawerOpen(false);}} style={{background: showFavorites ? '#00bcd4' : 'rgba(0, 188, 212, 0.1)', border:'none', borderRadius:12, padding:'0.7rem 1.1rem', fontWeight:600, fontSize:15, cursor:'pointer', color: showFavorites ? '#fff' : '#009688', boxShadow:'0 2px 8px rgba(0, 188, 212, 0.2)', display:'flex', alignItems:'center', gap:6}}><span role="img" aria-label="favorites">❤️</span>{t('favorites')}</button>
            <button onClick={()=>{navigate('/profile'); setDrawerOpen(false);}} style={{background:'rgba(0, 188, 212, 0.1)', border:'none', borderRadius:12, padding:'0.7rem 1.1rem', fontWeight:600, fontSize:15, cursor:'pointer', color:'#009688', boxShadow:'0 2px 8px rgba(0, 188, 212, 0.2)', display:'flex', alignItems:'center', gap:6}}><svg width={20} height={20} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="#009688" strokeWidth="2"/><path d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4" stroke="#009688" strokeWidth="2"/></svg>{t('my_profile')}</button>
            <button onClick={handleLogout} style={{background:'linear-gradient(135deg, #00bcd4 0%, #009688 100%)', color:'#fff', border:'none', borderRadius:8, padding:'0.7rem 1.1rem', fontWeight:600, fontSize:15, cursor:'pointer', boxShadow:'0 2px 8px rgba(0, 188, 212, 0.3)'}}>{t('logout')}</button>
            <div style={{marginTop:12}}>
              <label style={{fontWeight:700, color:'#009688', marginBottom:4, display:'block'}}>{t('change_language')}</label>
              <select value={lang} onChange={e=>setLang(e.target.value)} style={{background:'rgba(0, 188, 212, 0.1)', color:'#009688', border:'none', borderRadius:8, padding:'0.3rem 0.8rem', fontWeight:700, fontSize:15, cursor:'pointer', boxShadow:'0 2px 8px rgba(0, 188, 212, 0.2)'}}>
                <option value="AR">AR</option>
                <option value="EN">EN</option>
                <option value="KU">KU</option>
              </select>
            </div>
          </div>
        </div>
      )}
      {/* زر المراكز الصحية أسفل الشريط العلوي */}
      <div style={{width:'100%', display:'flex', justifyContent:isMobile() ? 'center' : 'flex-end', margin:'1.2rem 0 1.5rem 0'}}>
        <button 
          onClick={()=>alert('سيتم إضافته قريبًا')}
          style={{
            background: 'rgba(255, 107, 53, 0.1)', 
            border: 'none', 
            borderRadius: 12, 
            padding: isMobile() ? '0.7rem 1.2rem' : '0.8rem 1.7rem', 
            fontWeight: 700, 
            fontSize: isMobile() ? 15 : 17, 
            cursor: 'pointer', 
            color: '#ff6b35',
            boxShadow: '0 2px 8px rgba(255, 107, 53, 0.2)',
            transition: 'all 0.3s ease',
            display:'flex', alignItems:'center', gap:8
          }}
        >
          <span role="img" aria-label="health centers" style={{marginLeft: 4}}>🏥</span>
          {t('health_centers')}
        </button>
      </div>
      {/* نافذة الإشعارات */}
      {showNotif && (
        <div style={{position:'fixed', top:70, right:20, background:'#fff', borderRadius:12, boxShadow:'0 2px 16px #7c4dff22', padding:'1.2rem 1.5rem', zIndex:1000, minWidth:300, maxWidth:400, maxHeight:'70vh', overflowY:'auto'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
            <h4 style={{margin:'0', color:'#7c4dff', display:'flex', alignItems:'center', gap:'0.5rem'}}>
              🔔 {t('notifications')} ({notifCount})
            </h4>
            <button onClick={()=>setShowNotif(false)} style={{background:'none', border:'none', color:'#e53935', fontSize:22, fontWeight:900, cursor:'pointer', marginRight:2, marginTop:-2}}>&times;</button>
          </div>
          {notifications.length === 0 ? (
            <div style={{color:'#888', textAlign:'center', padding:'2rem'}}>
              <div style={{fontSize:'2rem', marginBottom:'0.5rem'}}>🔔</div>
              {t('no_notifications_message')}
            </div>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:'0.8rem'}}>
              {notifications.map(n => (
                <div key={n._id} style={{
                  background: n.type === 'special_appointment' ? '#fff3e0' : 
                             n.type === 'medicine_reminder' ? '#e8f5e8' : '#f7fafd',
                  borderRadius: isMobile() ? 6 : 10,
                  padding: isMobile() ? '0.5rem 0.6rem' : '1rem',
                  border: n.type === 'special_appointment' ? '2px solid #ff9800' : 
                          n.type === 'medicine_reminder' ? '2px solid #4caf50' : '1px solid #e0e0e0',
                  position:'relative',
                  fontSize: isMobile() ? 12 : undefined
                }}>
                  {n.type === 'special_appointment' && (
                    <div style={{
                      position:'absolute',
                      top:'-8px',
                      right:'-8px',
                      background:'#ff9800',
                      color:'#fff',
                      borderRadius:'50%',
                      width:'24px',
                      height:'24px',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      fontSize:'12px',
                      fontWeight:700
                    }}>
                      ⭐
                    </div>
                  )}
                  {n.type === 'medicine_reminder' && (
                    <div style={{
                      position:'absolute',
                      top:'-8px',
                      right:'-8px',
                      background:'#4caf50',
                      color:'#fff',
                      borderRadius:'50%',
                      width:'24px',
                      height:'24px',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      fontSize:'12px',
                      fontWeight:700
                    }}>
                      💊
                    </div>
                  )}
                  <div style={{
                    color: n.type === 'special_appointment' ? '#e65100' : 
                           n.type === 'medicine_reminder' ? '#2e7d32' : '#444',
                    fontWeight: n.type === 'special_appointment' || n.type === 'medicine_reminder' ? 700 : 600,
                    fontSize: isMobile() ? 13 : (n.type === 'special_appointment' || n.type === 'medicine_reminder' ? 16 : 15),
                    lineHeight:1.4
                  }}>
                    {n.type === 'special_appointment'
                      ? renderSpecialAppointmentNotification(n.message, t)
                      : n.type === 'new_appointment'
                        ? renderNewAppointmentNotification(n.message, t)
                        : n.message}
                  </div>
                  <div style={{
                    fontSize:12,
                    color:'#888',
                    marginTop:8,
                    display:'flex',
                    alignItems:'center',
                    gap:'0.5rem'
                  }}>
                    <span>🕐</span>
                    {formatKurdishDateTime(n.createdAt)}
                  </div>
                  {n.type === 'special_appointment' && (
                    <div style={{
                      background:'#ff9800',
                      color:'#fff',
                      padding:'0.3rem 0.8rem',
                      borderRadius:12,
                      fontSize:12,
                      fontWeight:700,
                      marginTop:8,
                      display:'inline-block'
                    }}>
                      {t('special_appointment_label')}
                    </div>
                  )}
                  {n.type === 'medicine_reminder' && (
                    <div style={{
                      background:'#4caf50',
                      color:'#fff',
                      padding:'0.3rem 0.8rem',
                      borderRadius:12,
                      fontSize:12,
                      fontWeight:700,
                      marginTop:8,
                      display:'inline-block'
                    }}>
                      {t('medicine_reminder_label')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* مربع البحث السريع في الأعلى */}
      <div style={{
        maxWidth: 650, 
        margin: '1.5rem auto 0', 
        background: 'rgba(255, 255, 255, 0.95)', 
        borderRadius: 20, 
        boxShadow: '0 4px 20px rgba(0, 188, 212, 0.1)', 
        padding: isMobile() ? '1.5rem 1rem' : '2rem 1.5rem',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 188, 212, 0.1)'
      }}>
        <div style={{fontWeight: 900, fontSize: isMobile() ? 18 : 22, marginBottom: 14, color: '#009688', letterSpacing: 0.5}}>{t('quick_search_doctor')}</div>
        <div style={{display:'flex', gap:12, flexWrap:'wrap', marginBottom:10}}>
          {/* اختيار المحافظة */}
          <div style={{position:'relative', flex:1, minWidth:150}}>
            <span style={{position:'absolute', right:12, top:13, color:'#009688', fontSize: 18}} role="img" aria-label="province">🏛️</span>
            <select value={province} onChange={e=>setProvince(e.target.value)} style={{width:'100%', borderRadius:12, padding:'0.8rem 2.2rem 0.8rem 0.8rem', border:'1.5px solid rgba(0, 188, 212, 0.3)', fontSize:16, background: 'rgba(255, 255, 255, 0.9)'}}>
              <option value="">{t('choose_province')}</option>
              {provinces.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {/* قائمة التخصصات العامة */}
          <div style={{position:'relative', flex:1, minWidth:150}}>
            <span style={{position:'absolute', right:12, top:13, color:'#009688', fontSize: 18}} role="img" aria-label="category">📚</span>
            <select value={selectedCategory} onChange={e=>{setSelectedCategory(e.target.value); setSelectedSpecialty("");}} style={{width:'100%', borderRadius:12, padding:'0.8rem 2.2rem 0.8rem 0.8rem', border:'1.5px solid rgba(0, 188, 212, 0.3)', fontSize:16, background: 'rgba(255, 255, 255, 0.9)'}}>
              <option value="">{t('choose_specialty')}</option>
              {allCategories.map(cat=><option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          {/* قائمة التخصصات الفرعية */}
          <div style={{position:'relative', flex:1, minWidth:150}}>
            <span style={{position:'absolute', right:12, top:13, color:'#009688', fontSize: 18}} role="img" aria-label="specialty">🩺</span>
            <select value={selectedSpecialty} onChange={e=>setSelectedSpecialty(e.target.value)} style={{width:'100%', borderRadius:12, padding:'0.8rem 2.2rem 0.8rem 0.8rem', border:'1.5px solid rgba(0, 188, 212, 0.3)', fontSize:16, background: 'rgba(255, 255, 255, 0.9)'}}>
              <option value="">{t('choose_subspecialty')}</option>
              {(selectedCategory
                ? specialtiesGrouped.find(cat => cat.category === selectedCategory)?.specialties || []
                : allSubSpecialties
              ).map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        {/* حقل البحث السريع في سطر منفصل */}
        <div style={{position:'relative', maxWidth:400, margin:'0 auto 10px auto'}}>
          <span style={{position:'absolute', right:12, top:13, color:'#009688', fontSize: 18}} role="img" aria-label="search">🔍</span>
          <input value={searchValue} onChange={e=>setSearchValue(e.target.value)} placeholder={t('search_doctor_or_specialty')} style={{width:'100%', borderRadius:12, padding:'0.8rem 2.2rem 0.8rem 0.8rem', border:'1.5px solid rgba(0, 188, 212, 0.3)', fontSize:16, background: 'rgba(255, 255, 255, 0.9)'}} />
          {/* نتائج البحث السريع */}
          {searchValue && (
            <div style={{position: 'absolute', top: '110%', left: 0, right: 0, background: '#fff', borderRadius: 10, boxShadow: '0 4px 20px #00bcd422', zIndex: 100, maxHeight: 180, overflowY: 'auto', border: '1.5px solid #b2dfdb'}}>
              {[
                ...allCategories.filter(cat => cat.includes(searchValue)),
                ...allSubSpecialties.filter(s => s.includes(searchValue))
              ].slice(0,10).map(result => (
                <div
                  key={result}
                  style={{padding:'0.6rem 1rem', cursor:'pointer', borderBottom:'1px solid #e0f7fa'}}
                  onClick={() => handleSearchSelect(result)}
                >
                  {result}
                </div>
              ))}
              {([
                ...allCategories.filter(cat => cat.includes(searchValue)),
                ...allSubSpecialties.filter(s => s.includes(searchValue))
              ].length === 0) && (
                <div style={{padding:'0.6rem 1rem', color:'#888'}}>لا توجد نتائج</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* أيقونات الخدمات السريعة */}
      <div style={{
        maxWidth: 650,
        margin: '1rem auto 0',
        padding: '0 1rem',
        display: 'flex',
        justifyContent: 'center',
        gap: isMobile() ? '1rem' : '1.5rem'
      }}>
        {/* أيقونة تذكير الدواء */}
        <button 
          onClick={() => navigate('/medicine-reminder')}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '50%',
            width: isMobile() ? 50 : 60,
            height: isMobile() ? 50 : 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 188, 212, 0.2)',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 188, 212, 0.1)'
          }}
          onMouseEnter={(e) => {
            if (!isMobile()) {
              e.target.style.transform = 'translateY(-2px) scale(1.05)';
              e.target.style.boxShadow = '0 6px 20px rgba(0, 188, 212, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile()) {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 4px 16px rgba(0, 188, 212, 0.2)';
            }
          }}
        >
          <span style={{fontSize: isMobile() ? 20 : 24}} role="img" aria-label="medicine">💊</span>
        </button>
        
        {/* أيقونة المواعيد */}
        <button 
          onClick={() => navigate('/my-appointments')}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '50%',
            width: isMobile() ? 50 : 60,
            height: isMobile() ? 50 : 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 188, 212, 0.2)',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 188, 212, 0.1)'
          }}
          onMouseEnter={(e) => {
            if (!isMobile()) {
              e.target.style.transform = 'translateY(-2px) scale(1.05)';
              e.target.style.boxShadow = '0 6px 20px rgba(0, 188, 212, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile()) {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 4px 16px rgba(0, 188, 212, 0.2)';
            }
          }}
        >
          <span style={{fontSize: isMobile() ? 20 : 24}} role="img" aria-label="appointments">📅</span>
        </button>
      </div>

      {/* نتائج البحث - بدون تصميم */}
      {(suggestions.length > 0 && (searchValue || selectedCategory || selectedSpecialty || province)) && (
        <div style={{
          maxWidth: isMobile() ? 500 : 700, 
          margin: isMobile() ? '1rem auto' : '1.5rem auto', 
          padding: '0 1rem'
        }}>
          <div style={{display:'flex', flexWrap:'wrap', gap: isMobile() ? 8 : 18}}>
            {suggestions.map(doc => (
              <DoctorCard key={doc._id} doctor={doc} />
            ))}
          </div>
        </div>
      )}

      {/* أطباء مقترحون */}
      <div style={{
        maxWidth: isMobile() ? 500 : 700, 
        margin: isMobile() ? '1rem auto' : '1.5rem auto', 
        padding: '0 1rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
          color: '#fff',
          padding: isMobile() ? '0.6rem 1rem' : '0.8rem 1.2rem',
          borderRadius: 12,
          fontWeight: 800, 
          fontSize: isMobile() ? 16 : 18, 
          marginBottom: isMobile() ? 8 : 12,
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(255, 152, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          ⭐ {t('featured_doctors')}
        </div>
        <div style={{display:'flex', flexWrap:'wrap', gap: isMobile() ? 8 : 18}}>
          {Array.isArray(suggestedDoctors) && suggestedDoctors.length > 0 ? (
            suggestedDoctors.map((doc, index) => (
              <DoctorCard key={doc._id} doctor={doc} />
            ))
          ) : suggestedDoctors.length === 0 ? (
            <div style={{color:'#888', fontWeight:600, fontSize:16, marginTop:20, textAlign:'center', width:'100%'}}>
              {t('no_doctors_available') || 'لا يوجد أطباء متاحين حالياً'}
            </div>
          ) : (
            <div style={{color:'#888', fontWeight:600, fontSize:16, marginTop:20, textAlign:'center', width:'100%'}}>
              {t('loading_doctors') || 'جاري تحميل الأطباء...'}
            </div>
          )}
        </div>
      </div>


      {/* نافذة اختيار وقت الحجز */}
      {selectedDoctor && (
        <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.18)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000}}>
          <div style={{background:'#fff', borderRadius:18, boxShadow:'0 4px 24px #7c4dff33', padding:'2.2rem 1.5rem', minWidth:260, textAlign:'center', maxWidth:350}}>
            <h3 style={{color:'#7c4dff', marginBottom:18, fontWeight:700}}>{t('book_appointment_with')} {selectedDoctor.name}</h3>
            <div style={{marginBottom:12}}>
              <label style={{fontWeight:600, color:'#444'}}>{t('choose_day')}:</label>
              <select style={{width:'100%', borderRadius:8, padding:'.5rem', marginTop:4, marginBottom:8}}>
                <option>{t('sunday')}</option>
                <option>{t('monday')}</option>
                <option>{t('tuesday')}</option>
                <option>{t('wednesday')}</option>
                <option>{t('thursday')}</option>
                <option>{t('friday')}</option>
                <option>{t('saturday')}</option>
              </select>
              <label style={{fontWeight:600, color:'#444'}}>{t('choose_time')}:</label>
              <select style={{width:'100%', borderRadius:8, padding:'.5rem', marginTop:4}}>
                <option>{t('morning_10')}</option>
                <option>{t('morning_11')}</option>
                <option>{t('afternoon_12')}</option>
                <option>{t('evening_1')}</option>
                <option>{t('evening_2')}</option>
              </select>
            </div>
            <button style={{background:'#2979ff', color:'#fff', border:'none', borderRadius:10, padding:'0.7rem 1.2rem', fontWeight:600, fontSize:16, cursor:'pointer', marginTop:8}}>{t('confirm_appointment')}</button>
            <button style={{background:'none', border:'none', color:'#888', cursor:'pointer', fontSize:15, marginTop:10}} onClick={()=>setSelectedDoctor(null)}>{t('cancel')}</button>
          </div>
        </div>
      )}

      {/* نافذة التواصل */}
      {showContactModal && (
        <div style={{
          position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.18)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3000
        }} onClick={()=>setShowContactModal(false)}>
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
            <button onClick={()=>setShowContactModal(false)} style={{position:'absolute', top:10, left:10, background:'none', border:'none', color:'#e53935', fontSize:window.innerWidth < 500 ? 18 : 22, fontWeight:900, cursor:'pointer'}}>&times;</button>
            <h3 style={{color:'#00bcd4', marginBottom:14, fontWeight:800, fontSize:window.innerWidth < 500 ? 16 : 22}}>{t('contact_info')}</h3>
            <div style={{display:'flex', flexDirection:'column', gap:window.innerWidth < 500 ? 10 : 18}}>
              <button onClick={()=>window.open('mailto:tabibiqapp@gmail.com','_blank')} style={{background:'linear-gradient(90deg,#00bcd4 0%,#7c4dff 100%)', color:'#fff', border:'none', borderRadius:14, padding:window.innerWidth < 500 ? '0.6rem 0.7rem' : '1rem 1.2rem', fontWeight:800, fontSize:window.innerWidth < 500 ? 13 : 16, display:'flex', alignItems:'center', gap:8, boxShadow:'0 2px 12px #00bcd422', cursor:'pointer'}}>
                <span style={{fontSize:window.innerWidth < 500 ? 16 : 22}}>📧</span> {t('email')}
              </button>
              <button onClick={()=>window.open('https://wa.me/9647769012619','_blank')} style={{background:'linear-gradient(90deg,#7c4dff 0%,#00bcd4 100%)', color:'#fff', border:'none', borderRadius:14, padding:window.innerWidth < 500 ? '0.6rem 0.7rem' : '1rem 1.2rem', fontWeight:800, fontSize:window.innerWidth < 500 ? 13 : 16, display:'flex', alignItems:'center', gap:8, boxShadow:'0 2px 12px #7c4dff22', cursor:'pointer'}}>
                <span style={{fontSize:window.innerWidth < 500 ? 16 : 22}}>💬</span> {t('whatsapp')}: +964 776 901 2619
              </button>
            </div>
          </div>
        </div>
      )}
      {/* بعد أيقونات الأدوية والمواعيد مباشرة، أضف الزر في المنتصف */}
      <div style={{width:'100%', display:'flex', justifyContent:'center', margin:'1.5rem 0'}}>
        <button
          onClick={() => setShowQuickSearch(true)}
          style={{
            background: '#fff',
            border: '2px solid #00bcd4',
            borderRadius: '50%',
            width: 54,
            height: 54,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px #00bcd422',
            cursor: 'pointer',
            fontWeight: 900,
            fontSize: 26,
            color: '#00bcd4',
            transition: 'all 0.2s',
            margin: '0 auto'
          }}
          title="بحث سريع"
        >
          🔍
        </button>
      </div>
    </div>
  );
}

export default UserHome; 