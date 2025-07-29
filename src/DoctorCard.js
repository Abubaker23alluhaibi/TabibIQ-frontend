import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const DoctorCard = ({ doctor }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  // دالة مساعدة للتصميم المتجاوب
  const isMobile = () => window.innerWidth <= 768;
  
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
      return (process.env.REACT_APP_API_URL || 'https://tabib-iq-backend-production.up.railway.app') + img;
    }
    if (img.startsWith('http')) return img;
    // إرجاع شعار المشروع كصورة افتراضية
    return '/logo.png';
  };

  // دالة لإرجاع اسم التخصص حسب اللغة من كائن متعدد اللغات
  function getLocalizedName(obj) {
    if (obj && typeof obj === 'object') {
      const lang = i18n.language;
      if (lang === 'ku' && obj.name_ku) return obj.name_ku;
      if (lang === 'en' && obj.name_en) return obj.name_en;
      if (obj.name_ar) return obj.name_ar;
    }
    return typeof obj === 'string' ? obj : '';
  }

  const provinces = t('provinces', { returnObjects: true }) || [];
  const specialties = t('specialties', { returnObjects: true }) || [];

  return (
    <div style={{
      background: '#fff', 
      borderRadius: 12, 
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.03)', 
      padding: isMobile() ? '0.5rem' : '1.2rem', 
      minWidth: isMobile() ? 140 : 240, 
      maxWidth: isMobile() ? 160 : 280,
      flex: '1 1 140px', 
      cursor: 'pointer', 
      transition: 'all 0.3s ease',
      border: doctor.is_featured ? '2px solid #ff9800' : '1px solid rgba(0, 0, 0, 0.05)',
      position: 'relative',
      overflow: 'hidden',
      margin: isMobile() ? '0.25rem' : '0.4rem'
    }} 
    onMouseEnter={(e) => {
      if (!isMobile()) {
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.12), 0 3px 12px rgba(0, 0, 0, 0.06)';
      }
    }}
    onMouseLeave={(e) => {
      if (!isMobile()) {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)';
      }
    }}
    onClick={() => navigate(`/doctor/${doctor._id}`)}>
      
      {/* خلفية مميزة للأطباء المميزين */}
      {doctor.is_featured && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #ff9800, #ffb74d, #ff9800)',
          borderRadius: '14px 14px 0 0'
        }} />
      )}
      
                  {doctor.is_featured && (
              <div style={{
                position: 'absolute',
                top: isMobile() ? -4 : -8,
                right: isMobile() ? -4 : -8,
                background: 'linear-gradient(135deg, #ff9800, #ffb74d)',
                color: '#fff',
                borderRadius: '50%',
                width: isMobile() ? 18 : 32,
                height: isMobile() ? 18 : 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile() ? 9 : 14,
                fontWeight: 700,
                boxShadow: '0 3px 8px rgba(255, 152, 0, 0.4)',
                border: '2px solid #fff'
              }}>
                ⭐
              </div>
            )}
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile() ? '0.4rem' : '0.8rem',
        marginBottom: isMobile() ? '0.4rem' : '0.8rem'
      }}>
        <div style={{position: 'relative'}}>
          <img 
            src={getImageUrl(doctor)} 
            alt={doctor.name} 
            onError={(e) => {
              // إذا فشل تحميل الصورة الحقيقية، استخدم شعار المشروع
              e.target.src = '/logo.png';
            }}
            style={{
            width: isMobile() ? 32 : 60, 
            height: isMobile() ? 32 : 60, 
            borderRadius: '50%', 
            objectFit: 'cover', 
            border: doctor.is_featured ? '2px solid #ff9800' : '2px solid #7c4dff', 
            boxShadow: doctor.is_featured ? 
              '0 2px 8px rgba(255, 152, 0, 0.3)' : 
              '0 2px 8px rgba(124, 77, 255, 0.2)'
          }} />
                      {doctor.is_featured && (
              <div style={{
                position: 'absolute',
                bottom: -1,
                right: -1,
                background: '#ff9800',
                color: '#fff',
                borderRadius: '50%',
                width: isMobile() ? 10 : 18,
                height: isMobile() ? 10 : 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile() ? 6 : 10,
                fontWeight: 700,
                border: '1px solid #fff'
              }}>
                ⭐
              </div>
            )}
        </div>
        
        <div style={{flex: 1}}>
          <div style={{
            fontWeight: 700, 
            fontSize: isMobile() ? 12 : 18, 
            color: doctor.is_featured ? '#e65100' : '#2c3e50', 
            marginBottom: isMobile() ? 2 : 3,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexWrap: 'wrap'
          }}>
            {doctor.name}
            {doctor.is_featured && (
              <span style={{
                background: 'linear-gradient(135deg, #ff9800, #ffb74d)',
                color: '#fff',
                padding: isMobile() ? '0.05rem 0.3rem' : '0.2rem 0.6rem',
                borderRadius: 6,
                fontSize: isMobile() ? 7 : 10,
                fontWeight: 700,
                boxShadow: '0 1px 4px rgba(255, 152, 0, 0.3)'
              }}>
                ⭐ {t('featured')}
              </span>
            )}
          </div>
          <div style={{
            color: doctor.is_featured ? '#ff9800' : '#7c4dff', 
            fontWeight: 600, 
            fontSize: isMobile() ? 10 : 14, 
            marginBottom: isMobile() ? 2 : 3
          }}>
            {/* التخصص العام (category) والتخصص الفرعي (specialty) */}
            <span style={{fontWeight:700}}>{doctor.category}</span>
            {doctor.category && doctor.specialty && <span style={{margin: '0 4px', color:'#888'}}>|</span>}
            <span>{specialties[doctor.specialty] || doctor.specialty}</span>
          </div>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile() ? '0.2rem' : '0.8rem',
        marginBottom: isMobile() ? '0.4rem' : '0.8rem',
        padding: isMobile() ? '0.3rem' : '0.6rem',
        background: 'rgba(0, 188, 212, 0.05)',
        borderRadius: 6,
        border: '1px solid rgba(0, 188, 212, 0.1)'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: isMobile() ? 2 : 3}}>
          <span style={{fontSize: isMobile() ? 8 : 14}} role="img" aria-label="governorate">🏛️</span>
          <span style={{fontSize: isMobile() ? 8 : 12, color: '#666', fontWeight: 500}}>{provinces[doctor.province] || doctor.province}</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: isMobile() ? 2 : 3}}>
          <span style={{fontSize: isMobile() ? 8 : 14}} role="img" aria-label="area">📍</span>
          <span style={{fontSize: isMobile() ? 8 : 12, color: '#666', fontWeight: 500}}>{doctor.area}</span>
        </div>
      </div>
      
      {doctor.is_featured && (
        <div style={{
          background: 'linear-gradient(135deg, #ff9800, #ffb74d)',
          color: '#fff',
          padding: isMobile() ? '0.2rem 0.4rem' : '0.5rem 0.8rem',
          borderRadius: 6,
          fontSize: isMobile() ? 8 : 11,
          fontWeight: 700,
          textAlign: 'center',
          boxShadow: '0 2px 6px rgba(255, 152, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          🏆 {t('featured_doctor_verified')}
        </div>
      )}
    </div>
  );
};

export default DoctorCard; 