import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { useTranslation } from 'react-i18next';

const provinces = [
  'بغداد', 'البصرة', 'نينوى', 'أربيل', 'النجف', 'كركوك', 'السليمانية', 'دهوك', 'ذي قار', 'صلاح الدين', 'الأنبار', 'واسط', 'ميسان', 'بابل', 'القادسية', 'ديالى', 'المثنى', 'كربلاء', 'حلبجة'
];
const specialties = [
  'جراحة عامة', 'جراحة عظام', 'طب الأطفال', 'طب العيون', 'طب الأسنان', 'أمراض القلب', 'جلدية', 'نسائية وتوليد', 'أنف وأذن وحنجرة', 'باطنية', 'أعصاب', 'أورام', 'أشعة', 'تخدير', 'طب الأسرة', 'طب الطوارئ', 'طب نفسي', 'طب الكلى', 'طب الروماتيزم', 'طب المسالك البولية', 'أخرى'
];

// استبدل جميع أسماء التخصصات والفئات بالنصوص الكردية
// const specialtiesGrouped = [
//   {
//     category: "پزیشکی گشتی و بنەڕەتی",
//     specialties: ["پزیشکی گشتی", "خێزان", "منداڵ", "ژن و لەدایکبوون", "فوریت", "پزیشکی پیران"]
//   },
//   {
//     category: "پسپۆری ناوخۆ",
//     specialties: ["باطنی", "نەخۆشی دڵ", "نەخۆشی سەروو سەفەر", "نەخۆشی هەزمەوەر", "کلی", "غدد و شەکر", "نەخۆشی خوێن", "نەخۆشی تووشبوو", "روماتیزم", "ئۆرام", "عەصاب", "دەروونی"]
//   },
//   {
//     category: "پسپۆری جەراحی",
//     specialties: ["جراحی گشتی", "جراحی عەظام", "جراحی عەصاب", "جراحی دڵ و سەروو سەفەر", "جراحی جوانکاری", "جراحی توێژینەوەی خوێن", "جراحی مەسالك", "جراحی منداڵ", "جراحی گوش و لووت و حەنجەرە", "جراحی دەندان و ڕوو و چاو"]
//   },
//   {
//     category: "پسپۆری سەر و قژ و دەندان",
//     specialties: ["چاو", "گوش و لووت و حەنجەرە", "دەندان", "جراحی ڕوو و چاو"]
//   },
//   {
//     category: "پسپۆری منداڵی ورد",
//     specialties: ["تازە لەدایکبوو", "دڵی منداڵ", "هەزمەوەری منداڵ", "عەصابی منداڵ"]
//   },
//   {
//     category: "پسپۆری پزیشکی یاریدەدەر",
//     specialties: ["تخدیر", "ئاشعە", "پزیشکی نوو", "پوست", "تاقیکردنەوە", "پزیشکی گەشەپێدەر", "وەرزشی", "پزیشکی یاسایی", "پزیشکی ئازار", "پزیشکی پیشەیی", "تەندروستی گشتی"]
//   },
//   {
//     category: "زانستە پزیشکییە یاریدەدەرەکان",
//     specialties: ["پرستاری", "خواردنی پزیشکی", "گەشەپێدانی جەستە", "دەرمانسازی", "ئاشعە", "تاقیکردنەوەی پزیشکی"]
//   }
// ];
// const allCategories = specialtiesGrouped.map(cat => cat.category);
// const allSubSpecialties = specialtiesGrouped.flatMap(cat => cat.specialties);

function DoctorSignUp() {
  // 2. أضف جميع useState هنا داخل المكون
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const { t } = useTranslation();
  const specialtiesGrouped = t('specialty_categories', { returnObjects: true });
  const specialties = t('specialties', { returnObjects: true }) || {};
  // بناء قائمة التخصصات كمصفوفة مفاتيح
  const specialtiesList = Object.keys(specialties).map(key => ({ key, label: specialties[key] }));
  const allCategories = specialtiesGrouped.map(cat => cat.category);
  const allSubSpecialties = specialtiesGrouped.flatMap(cat => cat.specialties);

  // دالة اختيار من البحث
  function handleSearchSelect(value) {
    if (allCategories.includes(value)) {
      setSelectedCategory(value);
      setSelectedSpecialty("");
      setForm(prev => ({...prev, specialty: ""}));
    } else if (allSubSpecialties.includes(value)) {
      setSelectedSpecialty(value);
      setForm(prev => ({...prev, specialty: value}));
      // حدد التخصص العام تلقائياً إذا كان التخصص الفرعي تابع له
      const parentCat = specialtiesGrouped.find(cat => cat.specialties.includes(value));
      if (parentCat) setSelectedCategory(parentCat.category);
    }
    setSearchValue("");
  }

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    specialty: '',
    province: '',
    area: '',
    clinicLocation: '',
    image: null,
    idFront: null,
    idBack: null,
    syndicateFront: null,
    syndicateBack: null,
    about: '',
    experienceYears: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [workTimes, setWorkTimes] = useState([]); // [{day, from, to}]
  const [newTime, setNewTime] = useState({day: '', from: '', to: ''});
  const [previewUrls, setPreviewUrls] = useState({
    image: null,
    idFront: null,
    idBack: null,
    syndicateFront: null,
    syndicateBack: null
  });
  const navigate = useNavigate();
  const weekDays = t('weekdays', { returnObjects: true });

  useEffect(() => {
    if (success) {
      // لا توجه تلقائياً، فقط أظهر رسالة انتظار الموافقة
    }
  }, [success]);

  const handleChange = e => {
    const { name, value, files } = e.target;
    setForm({
      ...form,
      [name]: files ? files[0] : value
    });
    
    // إنشاء معاينة للصور
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrls(prev => ({
            ...prev,
            [name]: e.target.result
          }));
        };
        reader.readAsDataURL(file);
      } else {
        // إذا كان ملف PDF، أظهر أيقونة PDF
        setPreviewUrls(prev => ({
          ...prev,
          [name]: 'pdf'
        }));
      }
    } else {
      // إزالة المعاينة إذا تم إزالة الملف
      setPreviewUrls(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleFirstStep = e => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.phone || !form.password || !form.confirm) {
      setError(t('fill_all_fields'));
      return;
    }
    if (form.password !== form.confirm) {
      setError(t('passwords_not_match'));
      return;
    }
    setStep(2);
  };

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirm: '',
      specialty: '',
      province: '',
      area: '',
      clinicLocation: '',
      image: null,
      idFront: null,
      idBack: null,
      syndicateFront: null,
      syndicateBack: null,
      about: '',
      experienceYears: ''
    });
    setPreviewUrls({
      image: null,
      idFront: null,
      idBack: null,
      syndicateFront: null,
      syndicateBack: null
    });
    setWorkTimes([]);
    setNewTime({day: '', from: '', to: ''});
  };

  const handleSecondStep = e => {
    e.preventDefault();
    setError('');
    // تحقق فقط من الحقول النصية المطلوبة في هذه الصفحة
    if (!form.province || !form.area || !form.clinicLocation) {
      setError('تکایە خانەکان پڕبکەوە (پارێزگا، ناوچە، ناونیشان)');
      return;
    }
    setStep(3);
  };

  const handleAddTime = () => {
    setError('');
    if (!newTime.day || !newTime.from || !newTime.to) {
      setError(t('choose_day_and_time'));
      return;
    }
    setWorkTimes([...workTimes, newTime]);
    setNewTime({day: '', from: '', to: ''});
  };

  const handleRemoveTime = idx => {
    setWorkTimes(workTimes.filter((_, i) => i !== idx));
  };

  const removePreview = (fieldName) => {
    setForm(prev => ({
      ...prev,
      [fieldName]: null
    }));
    setPreviewUrls(prev => ({
      ...prev,
      [fieldName]: null
    }));
  };

  const handleThirdStep = async (e) => {
    e.preventDefault();
    setError('');
    if (workTimes.length === 0) {
      setError(t('add_at_least_one_time'));
      return;
    }
    
    // التحقق من وجود الوثائق المطلوبة
    if (!form.image || !form.idFront || !form.idBack || !form.syndicateFront || !form.syndicateBack) {
      setError('يرجى رفع جميع الوثائق المطلوبة');
      return;
    }
    
    // تجهيز البيانات للإرسال
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('email', form.email);
    formData.append('phone', form.phone);
    formData.append('password', form.password);
    formData.append('specialty', form.specialty);
    formData.append('province', form.province);
    formData.append('area', form.area);
    formData.append('clinicLocation', form.clinicLocation);
    formData.append('about', form.about);
    if (form.experienceYears) formData.append('experienceYears', form.experienceYears);
    formData.append('workTimes', JSON.stringify(workTimes));
    
    // رفع الصور والوثائق
    if (form.image) formData.append('image', form.image);
    if (form.idFront) formData.append('idFront', form.idFront);
    if (form.idBack) formData.append('idBack', form.idBack);
    if (form.syndicateFront) formData.append('syndicateFront', form.syndicateFront);
    if (form.syndicateBack) formData.append('syndicateBack', form.syndicateBack);
    
    try {
      console.log('📤 إرسال بيانات الطبيب مع الوثائق...');
      const res = await fetch(process.env.REACT_APP_API_URL + '/auth/register-doctor', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (!res.ok) {
        console.error('❌ خطأ في تسجيل الطبيب:', data);
        throw new Error(data.error || t('error_occurred'));
      }
      
      console.log('✅ تم تسجيل الطبيب بنجاح:', data);
      setSuccess(true);
    } catch (err) {
      console.error('❌ خطأ في تسجيل الطبيب:', err);
      setError(err.message);
    }
  };

  // 1. أضف دالة الانتقال للخطوة الرابعة
  const handleFourthStep = (e) => {
    e.preventDefault();
    setError('');
    setStep(4);
  };

  return (
    <div className="login-container">
      <form className="login-box" onSubmit={step === 1 ? handleFirstStep : step === 2 ? handleSecondStep : step === 3 ? handleFourthStep : handleThirdStep} encType="multipart/form-data">
        {success ? (
          <div style={{
            background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
            color: '#00796b',
            borderRadius: 16,
            padding: '2rem 1.5rem',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: '1.1rem',
            boxShadow: '0 4px 20px #00bcd433',
            border: '2px solid #00bcd4',
            marginBottom: '1rem'
          }}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>✅</div>
            <div style={{marginBottom: '1rem', lineHeight: '1.6'}}>
              {t('doctor_signup_success')}<br/>
              <span style={{fontSize: '0.95rem', fontWeight: 600, color: '#00695c'}}>
                {t('doctor_signup_wait')}
              </span>
            </div>
            <button 
              onClick={resetForm} 
              style={{
                background: 'linear-gradient(135deg, #009688 0%, #00796b 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '0.8rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px #00968844',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              {t('register_another_doctor')}
            </button>
          </div>
        ) : (
          step === 1 ? (
            <div style={{maxWidth:400, margin:'0 auto', padding:'0 1rem'}}>
            <h2 style={{textAlign:'center', marginBottom:18}}>{t('doctor_signup_title')}</h2>
                <div style={{display:'flex', flexDirection:'column', gap:12, marginBottom:10}}>
                  <div>
                    <label style={{fontWeight:600, marginBottom:4, display:'block'}}>{t('full_name')}</label>
                    <input
                      type="text"
                      name="name"
                      placeholder={t('full_name')}
                      value={form.name}
                      onChange={handleChange}
                      style={{padding:'1rem 1.1rem', borderRadius:12, border:'1.5px solid #b2dfdb', width:'100%'}}
                    />
                  </div>
                  <div>
                    <label style={{fontWeight:600, marginBottom:4, display:'block'}}>{t('email')}</label>
                    <input
                      type="email"
                      name="email"
                      placeholder={t('email')}
                      value={form.email}
                      onChange={handleChange}
                      style={{padding:'1rem 1.1rem', borderRadius:12, border:'1.5px solid #b2dfdb', width:'100%'}}
                    />
                  </div>
                  <div style={{display:'flex', gap:8, alignItems:'center'}}>
                    <div style={{background:'#e0f7fa', borderRadius:10, border:'1.5px solid #b2dfdb', padding:'0.7rem 0.7rem', fontWeight:700, color:'#009688', fontSize:'1.08rem', minWidth:60, maxWidth:70}}>
                      +964
                    </div>
                    <input
                      type="text"
                      name="phone"
                      placeholder={t('phone_placeholder')}
                      value={form.phone}
                      onChange={handleChange}
                      style={{borderRadius:12, width:'100%', padding:'0.7rem 0.7rem', border:'1.5px solid #b2dfdb', fontSize:15}}
                    />
                  </div>
                  {/* ملاحظة مهمة حول رقم الواتساب */}
                  <div style={{
                    background: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    borderRadius: 8,
                    padding: '0.8rem',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    color: '#856404',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span style={{fontSize: '1.2rem'}}>📱</span>
                    <div>
                      <div style={{fontWeight: 700, marginBottom: 2}}>ملاحظة مهمة:</div>
                      <div>يجب أن يكون الرقم يحتوي على واتساب للتواصل مع المرضى</div>
                      <div style={{fontSize: '0.8rem', marginTop: 4, opacity: 0.8}}>
                        <strong>تێبینی گرنگ:</strong> ژمارەکە دەبێت واتساپی تێدابێت بۆ پەیوەندی لەگەڵ نەخۆشەکان
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={{fontWeight:600, marginBottom:4}}>{t('password')}</label>
                    <input
                      type="password"
                      name="password"
                      placeholder={t('password')}
                      value={form.password}
                      onChange={handleChange}
                      style={{marginBottom:10, padding:'1rem 1.1rem', borderRadius:12, border:'1.5px solid #b2dfdb', width:'100%'}}
                    />
                  </div>
                  <div>
                    <label style={{fontWeight:600, marginBottom:4}}>{t('confirm_password')}</label>
                    <input
                      type="password"
                      name="confirm"
                      placeholder={t('confirm_password')}
                      value={form.confirm}
                      onChange={handleChange}
                      style={{marginBottom:10, padding:'1rem 1.1rem', borderRadius:12, border:'1.5px solid #b2dfdb', width:'100%'}}
                    />
                  </div>
                </div>
                {error && <div className="login-error">{error}</div>}
                <button type="submit" style={{width:'100%', padding:'1.1rem', borderRadius:14, background:'linear-gradient(135deg, #00bcd4 0%, #009688 100%)', color:'#fff', fontWeight:800, fontSize:18, border:'none', marginTop:10, boxShadow:'0 2px 8px #00bcd433', letterSpacing:1}}>
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" style={{marginLeft: 6}} xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4v16m8-8H4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {t('next')}
                </button>
            </div>
          ) : step === 2 ? (
            <div style={{maxWidth:400, margin:'0 auto', padding:'0 1rem'}}>
              <h2 style={{textAlign:'center', marginBottom:18}}>{t('doctor_signup_title')}</h2>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                <div>
                  <label style={{fontWeight:600, marginBottom:4, display:'block'}}>{t('province')}</label>
                  <select
                    name="province"
                    value={form.province}
                    onChange={handleChange}
                    style={{padding:'1rem 1.1rem', borderRadius:12, border:'1.5px solid #b2dfdb', width:'100%'}}>
                    <option value="">{t('choose_province')}</option>
                    {provinces.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{fontWeight:600, marginBottom:4, display:'block'}}>{t('area_address')}</label>
                  <input
                    type="text"
                    name="area"
                    placeholder={t('area_address')}
                    value={form.area}
                    onChange={handleChange}
                    style={{padding:'1rem 1.1rem', borderRadius:12, border:'1.5px solid #b2dfdb', width:'100%'}}
                  />
                </div>
                <div>
                  <label style={{fontWeight:600, marginBottom:4, display:'block'}}>{t('clinic_location')}</label>
                  <input
                    type="text"
                    name="clinicLocation"
                    placeholder={t('clinic_location')}
                    value={form.clinicLocation}
                    onChange={handleChange}
                    style={{padding:'1rem 1.1rem', borderRadius:12, border:'1.5px solid #b2dfdb', width:'100%'}}
                  />
                </div>
                <div>
                  <label style={{fontWeight:600, marginBottom:4, display:'block'}}>{t('choose_category')}</label>
                  <select
                    value={selectedCategory}
                    onChange={e => { setSelectedCategory(e.target.value); }}
                    style={{padding:'1rem 1.1rem', borderRadius:12, border:'1.5px solid #b2dfdb', width:'100%'}}>
                    <option value="">{t('choose_category')}</option>
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{fontWeight:600, marginBottom:4, display:'block'}}>{t('choose_specialty')}</label>
                  <select
                    name="specialty"
                    value={form.specialty}
                    onChange={handleChange}
                    style={{padding: '1rem 1.1rem', borderRadius: 12, border: '1.5px solid #b2dfdb', width:'100%'}}>
                    <option value="">{t('choose_specialty')}</option>
                    {specialtiesList.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <input type="number" name="experienceYears" placeholder={t('experience_years')} value={form.experienceYears} onChange={handleChange} min={0} style={{width:'100%', padding:'1rem 1.1rem', borderRadius:12, border:'1.5px solid #b2dfdb'}} />
                </div>
              </div>
              {error && <div className="login-error">{error}</div>}
              <button type="submit" style={{width:'100%', padding:'1.1rem', borderRadius:14, background:'linear-gradient(135deg, #00bcd4 0%, #009688 100%)', color:'#fff', fontWeight:800, fontSize:18, border:'none', marginTop:10, boxShadow:'0 2px 8px #00bcd433', letterSpacing:1}}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" style={{marginLeft: 6}} xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4v16m8-8H4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t('next')}
              </button>
              <button type="button" className="signup-link-btn" style={{marginTop:8, width:'100%'}} onClick={()=>setStep(1)}>{t('back')}</button>
            </div>
          ) : step === 3 ? (
            <div style={{maxWidth:400, margin:'0 auto', padding:'0 1rem'}}>
              <h2 style={{textAlign:'center', marginBottom:18}}>{t('doctor_signup_title')}</h2>
                <div style={{marginBottom: 10}}>
                  <h4 style={{color:'#009688', marginBottom: 8, fontWeight:700}}>{t('weekly_work_times')}</h4>
                  <div style={{display:'flex', gap:6, marginBottom:8}}>
                    <select value={newTime.day} onChange={e=>setNewTime({...newTime, day: e.target.value})} style={{flex:2, borderRadius:8, padding:'.5rem'}}>
                      <option value="">{t('day')}</option>
                      {Array.isArray(weekDays) && weekDays.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                    <div style={{display:'flex', gap:8}}>
                      <div style={{flex:1, display:'flex', flexDirection:'column'}}>
                        <label style={{fontSize:13, color:'#009688', marginBottom:2}}>{t('from_time')}</label>
                        <input type="time" value={newTime.from} onChange={e=>setNewTime({...newTime, from: e.target.value})} style={{borderRadius:8, padding:'.7rem', width:'100%', fontSize:16}} />
                      </div>
                      <div style={{flex:1, display:'flex', flexDirection:'column'}}>
                        <label style={{fontSize:13, color:'#009688', marginBottom:2}}>{t('to_time')}</label>
                        <input type="time" value={newTime.to} onChange={e=>setNewTime({...newTime, to: e.target.value})} style={{borderRadius:8, padding:'.7rem', width:'100%', fontSize:16}} />
                      </div>
                    </div>
                    <button type="button" className="signup-link-btn" style={{padding:'0.5rem 1rem', fontSize:15}} onClick={handleAddTime}>{t('add')}</button>
                  </div>
                  <div style={{marginBottom:8}}>
                    {workTimes.length === 0 && <span style={{color:'#888', fontSize:14}}>{t('no_times_added')}</span>}
                    {workTimes.map((t, idx) => (
                      <div key={idx} style={{display:'flex', alignItems:'center', gap:8, background:'#e0f7fa', borderRadius:7, padding:'0.3rem 0.7rem', marginBottom:4}}>
                        <span style={{flex:2}}>{t.day}</span>
                        <span style={{flex:1, fontFamily:'monospace'}}>{t.from}</span>
                        <span style={{flex:1, fontFamily:'monospace'}}>{t.to}</span>
                        <button type="button" style={{background:'none', border:'none', color:'#e53935', fontWeight:700, cursor:'pointer', fontSize:18}} onClick={()=>handleRemoveTime(idx)}>&times;</button>
                      </div>
                    ))}
                  </div>
                </div>
                <textarea name="about" placeholder={t('about_optional')} value={form.about} onChange={handleChange} style={{borderRadius:10, border:'1.5px solid #b2dfdb', padding:'0.8rem 1rem', minHeight:70, marginBottom:10, resize:'vertical'}} />
                {error && <div className="login-error">{error}</div>}
                <button type="submit" style={{width:'100%', padding:'1.1rem', borderRadius:14, background:'linear-gradient(135deg, #00bcd4 0%, #009688 100%)', color:'#fff', fontWeight:800, fontSize:18, border:'none', marginTop:10, boxShadow:'0 2px 8px #00bcd433', letterSpacing:1}}>
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" style={{marginLeft: 6}} xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4v16m8-8H4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {t('next')}
                </button>
                <button type="button" className="signup-link-btn" style={{marginTop:8}} onClick={()=>setStep(2)}>{t('back')}</button>
            </div>
          ) : step === 4 ? (
            <div style={{maxWidth:400, margin:'0 auto', padding:'0 1rem'}}>
              <h2 style={{textAlign:'center', marginBottom:18}}>{t('doctor_signup_title')}</h2>
              <h3 style={{color:'#009688', marginBottom:14, fontWeight:800}}>{t('upload_documents')}</h3>
              <div style={{display:'flex', flexDirection:'column', gap:18, maxWidth:400, margin:'0 auto'}}>
                {/* صورة شخصية */}
                <div>
                  <label style={{textAlign: 'right', fontSize: 15, color: '#009688', marginBottom: 6, display:'block'}}>{t('personal_image')}</label>
                  <input type="file" name="image" accept="image/*" onChange={handleChange} style={{marginBottom: 6, width:'100%'}} />
                  {previewUrls.image && (
                    <div style={{marginBottom: 8, textAlign: 'center'}}>
                      <img src={previewUrls.image} alt={t('personal_image')} style={{width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid #7c4dff', cursor:'pointer'}} onClick={() => window.open(previewUrls.image, '_blank')} title="اضغط للتكبير" />
                      <button type="button" onClick={() => removePreview('image')} style={{background: '#e53935', color: '#fff', border: 'none', borderRadius: 5, padding: '0.3rem 0.8rem', marginTop: 5, fontSize: 12, cursor: 'pointer'}}>{t('remove')}</button>
                    </div>
                  )}
                </div>
                {/* صورة هوية أمامية */}
                <div>
                  <label style={{textAlign: 'right', fontSize: 15, color: '#009688', marginBottom: 6, display:'block'}}>{t('id_front')}</label>
                  <input type="file" name="idFront" accept="image/*,application/pdf" onChange={handleChange} style={{marginBottom: 6, width:'100%'}} />
                  {previewUrls.idFront && (
                    <div style={{marginBottom: 8, textAlign: 'center'}}>
                      {previewUrls.idFront === 'pdf' ? (
                        <div style={{background: '#f5f5f5', padding: '1rem', borderRadius: 8, border: '2px dashed #7c4dff'}}>
                          <div style={{fontSize: 24, marginBottom: 5}}>📄</div>
                          <div style={{fontSize: 12, color: '#666'}}>PDF</div>
                        </div>
                      ) : (
                        <img src={previewUrls.idFront} alt={t('id_front')} style={{width: 150, height: 100, borderRadius: 8, objectFit: 'cover', border: '2px solid #7c4dff', cursor:'pointer'}} onClick={() => window.open(previewUrls.idFront, '_blank')} title="اضغط للتكبير" />
                      )}
                      <button type="button" onClick={() => removePreview('idFront')} style={{background: '#e53935', color: '#fff', border: 'none', borderRadius: 5, padding: '0.3rem 0.8rem', marginTop: 5, fontSize: 12, cursor: 'pointer'}}>{t('remove')}</button>
                    </div>
                  )}
                </div>
                {/* صورة هوية خلفية */}
                <div>
                  <label style={{textAlign: 'right', fontSize: 15, color: '#009688', marginBottom: 6, display:'block'}}>{t('id_back')}</label>
                  <input type="file" name="idBack" accept="image/*,application/pdf" onChange={handleChange} style={{marginBottom: 6, width:'100%'}} />
                  {previewUrls.idBack && (
                    <div style={{marginBottom: 8, textAlign: 'center'}}>
                      {previewUrls.idBack === 'pdf' ? (
                        <div style={{background: '#f5f5f5', padding: '1rem', borderRadius: 8, border: '2px dashed #7c4dff'}}>
                          <div style={{fontSize: 24, marginBottom: 5}}>📄</div>
                          <div style={{fontSize: 12, color: '#666'}}>PDF</div>
                        </div>
                      ) : (
                        <img src={previewUrls.idBack} alt={t('id_back')} style={{width: 150, height: 100, borderRadius: 8, objectFit: 'cover', border: '2px solid #7c4dff', cursor:'pointer'}} onClick={() => window.open(previewUrls.idBack, '_blank')} title="اضغط للتكبير" />
                      )}
                      <button type="button" onClick={() => removePreview('idBack')} style={{background: '#e53935', color: '#fff', border: 'none', borderRadius: 5, padding: '0.3rem 0.8rem', marginTop: 5, fontSize: 12, cursor: 'pointer'}}>{t('remove')}</button>
                    </div>
                  )}
                </div>
                {/* صورة بطاقة النقابة أمامية */}
                <div>
                  <label style={{textAlign: 'right', fontSize: 15, color: '#009688', marginBottom: 6, display:'block'}}>{t('syndicate_front')}</label>
                  <input type="file" name="syndicateFront" accept="image/*,application/pdf" onChange={handleChange} style={{marginBottom: 6, width:'100%'}} />
                  {previewUrls.syndicateFront && (
                    <div style={{marginBottom: 8, textAlign: 'center'}}>
                      {previewUrls.syndicateFront === 'pdf' ? (
                        <div style={{background: '#f5f5f5', padding: '1rem', borderRadius: 8, border: '2px dashed #7c4dff'}}>
                          <div style={{fontSize: 24, marginBottom: 5}}>📄</div>
                          <div style={{fontSize: 12, color: '#666'}}>PDF</div>
                        </div>
                      ) : (
                        <img src={previewUrls.syndicateFront} alt={t('syndicate_front')} style={{width: 150, height: 100, borderRadius: 8, objectFit: 'cover', border: '2px solid #7c4dff', cursor:'pointer'}} onClick={() => window.open(previewUrls.syndicateFront, '_blank')} title="اضغط للتكبير" />
                      )}
                      <button type="button" onClick={() => removePreview('syndicateFront')} style={{background: '#e53935', color: '#fff', border: 'none', borderRadius: 5, padding: '0.3rem 0.8rem', marginTop: 5, fontSize: 12, cursor: 'pointer'}}>{t('remove')}</button>
                    </div>
                  )}
                </div>
                {/* صورة بطاقة النقابة خلفية */}
                <div>
                  <label style={{textAlign: 'right', fontSize: 15, color: '#009688', marginBottom: 6, display:'block'}}>{t('syndicate_back')}</label>
                  <input type="file" name="syndicateBack" accept="image/*,application/pdf" onChange={handleChange} style={{marginBottom: 6, width:'100%'}} />
                  {previewUrls.syndicateBack && (
                    <div style={{marginBottom: 8, textAlign: 'center'}}>
                      {previewUrls.syndicateBack === 'pdf' ? (
                        <div style={{background: '#f5f5f5', padding: '1rem', borderRadius: 8, border: '2px dashed #7c4dff'}}>
                          <div style={{fontSize: 24, marginBottom: 5}}>📄</div>
                          <div style={{fontSize: 12, color: '#666'}}>PDF</div>
                        </div>
                      ) : (
                        <img src={previewUrls.syndicateBack} alt={t('syndicate_back')} style={{width: 150, height: 100, borderRadius: 8, objectFit: 'cover', border: '2px solid #7c4dff', cursor:'pointer'}} onClick={() => window.open(previewUrls.syndicateBack, '_blank')} title="اضغط للتكبير" />
                      )}
                      <button type="button" onClick={() => removePreview('syndicateBack')} style={{background: '#e53935', color: '#fff', border: 'none', borderRadius: 5, padding: '0.3rem 0.8rem', marginTop: 5, fontSize: 12, cursor: 'pointer'}}>{t('remove')}</button>
                    </div>
                  )}
                </div>
              </div>
              {error && <div className="login-error">{error}</div>}
              <div style={{display:'flex', gap:12, marginTop:18, justifyContent:'center'}}>
                <button type="submit" style={{width:'100%', padding:'1.1rem', borderRadius:14, background:'linear-gradient(135deg, #00bcd4 0%, #009688 100%)', color:'#fff', fontWeight:800, fontSize:18, border:'none', marginTop:10, boxShadow:'0 2px 8px #00bcd433', letterSpacing:1}}>
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" style={{marginLeft: 6}} xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4v16m8-8H4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {t('next')}
                  </button>
                <button type="button" className="signup-link-btn" style={{marginTop:0}} onClick={()=>setStep(3)}>{t('back')}</button>
              </div>
            </div>
          ) : null
        )}
      </form>
    </div>
  );
}

export default DoctorSignUp; 