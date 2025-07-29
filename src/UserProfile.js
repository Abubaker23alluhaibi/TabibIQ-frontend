import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function UserProfile() {
  const { profile, updateProfile, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  
  
  const [form, setForm] = useState({
    first_name: '',
    email: '',
    phone: '',
    profileImage: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [edit, setEdit] = useState(false);

  // دالة مساعدة لمسار صورة المستخدم
  const getImageUrl = img => {
    if (!img) return null;
    if (img.startsWith('/uploads/')) return process.env.REACT_APP_API_URL + img;
    if (img.startsWith('http')) return img;
    return null;
  };
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // إضافة console.log للتأكد من حالة edit (معلق مؤقتاً)
  // console.log('🔍 UserProfile - edit state:', edit);

  // تحديث النموذج عند تغيير البيانات الشخصية
  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        profileImage: profile.profileImage || profile.avatar || ''
      });
      setImageLoadError(false);
    } else if (user) {
      // إذا لم يكن هناك profile، استخدم user
      setForm({
        first_name: user.first_name || '',
        email: user.email || '',
        phone: user.phone || '',
        profileImage: user.profileImage || user.avatar || ''
      });
      setImageLoadError(false);
    }
  }, [profile, user]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        alert(t('image_type_error'));
        return;
      }
      
      // التحقق من حجم الملف (أقل من 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(t('image_size_error'));
        return;
      }

      setSelectedImage(file);
      setImageLoadError(false);
      
      // إنشاء معاينة للصورة
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async e => {
    e.preventDefault();
    
    // إذا لم يكن في وضع التعديل، لا تفعل شيئاً
    if (!edit) {
      console.log('🔍 handleSave - ليس في وضع التعديل، تم تجاهل الطلب - UserProfile');
      return;
    }
    
    setError('');
    setMsg('');
    setLoading(true);
    
    if (!form.first_name || !form.email || !form.phone) {
      setError(t('fill_required_fields'));
      setLoading(false);
      return;
    }

    try {
      let updatedForm = { ...form };
      
      // إذا كان هناك صورة جديدة، ارفعها أولاً
      if (selectedImage) {
        const formData = new FormData();
        formData.append('image', selectedImage);
        
        const uploadRes = await fetch(`${process.env.REACT_APP_API_URL}/upload-profile-image`, {
          method: 'POST',
          body: formData
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          updatedForm.profileImage = uploadData.imageUrl;
        } else {
          throw new Error(t('image_upload_error'));
        }
      }

      const { error } = await updateProfile(updatedForm);
      if (error) {
        setError(error);
      } else {
        setMsg(t('profile_updated_successfully'));
        setEdit(false);
        setSelectedImage(null);
        setImagePreview(null);
        setImageLoadError(false);
      }
    } catch (err) {
      setError(err.message || t('error_saving_changes'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEdit(false);
    setError('');
    setMsg('');
    setSelectedImage(null);
    setImagePreview(null);
    setImageLoadError(false);
    const currentData = profile || user;
    setForm({
      first_name: currentData?.first_name || '',
      email: currentData?.email || '',
      phone: currentData?.phone || '',
      profileImage: currentData?.profileImage || currentData?.avatar || ''
    });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('كلمة المرور الجديدة غير متطابقة');
      setLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/user-password/${profile?._id || user?._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordForm.newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        setMsg('تم تغيير كلمة المرور بنجاح');
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(data.error || t('error_changing_password'));
      }
    } catch (err) {
              setError(t('error_changing_password'));
    } finally {
      setLoading(false);
    }
  };

  // إذا لم يكن هناك بيانات مستخدم، اعرض رسالة تحميل
  if (!profile && !user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f7fafd'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{color: '#7c4dff', fontSize: 48, marginBottom: 16}}>⏳</div>
          <h3 style={{color: '#333', marginBottom: 8}}>جاري تحميل البيانات...</h3>
          <p style={{color: '#666', marginBottom: 20}}>يرجى الانتظار قليلاً</p>
          <button 
            onClick={() => navigate('/home')}
            style={{
              background: '#7c4dff',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0.7rem 1.5rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem 1rem',
      position: 'relative'
    }}>
      {/* زر العودة للصفحة الرئيسية */}
      <button onClick={() => navigate('/home')} style={{
        position:'absolute', 
        top:18, 
        left:18, 
        background:'rgba(255,255,255,0.9)', 
        border:'none', 
        color:'#7c4dff', 
        fontSize:16, 
        fontWeight:700, 
        cursor:'pointer', 
        zIndex:10,
        padding: '0.5rem 1rem',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        ← العودة للصفحة الرئيسية
      </button>
      <div style={{
        maxWidth: 700,
        margin: '0 auto',
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #7c4dff 0%, #00bcd4 100%)',
          padding: '2rem',
          textAlign: 'center',
          color: '#fff'
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: 32,
            overflow: 'hidden',
            position: 'relative'
          }}>
            {(imagePreview || (form.profileImage && !imageLoadError)) ? (
              <img 
                src={imagePreview || getImageUrl(form.profileImage)}
                alt="الصورة الشخصية"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%'
                }}
                onError={(e) => {
                  console.log('❌ فشل تحميل الصورة:', e.target.src);
                  console.log('🔍 form.profileImage:', form.profileImage);
                  console.log('🔍 getImageUrl result:', getImageUrl(form.profileImage));
                  setImageLoadError(true);
                }}
                onLoad={() => {
                  setImageLoadError(false);
                }}
              />
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>👤</span>
            )}
            {edit && (
              <label style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: '#7c4dff',
                color: '#fff',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 12,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                📷
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
          <h2 style={{margin: 0, fontWeight: 900, fontSize: 24}}>{t('user_profile_title')}</h2>
          <p style={{margin: '0.5rem 0 0', opacity: 0.9}}>{t('edit_user_account_data')}</p>
        </div>
        {/* Form */}
        <div style={{padding: '2rem'}}>
          <form onSubmit={handleSave}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
              {/* الاسم الكامل */}
              <div style={{marginBottom: 20}}>
                <label style={{
                  display: 'block',
                  color: '#7c4dff',
                  fontWeight: 700,
                  marginBottom: 8,
                  fontSize: 14
                }}>
                  {t('full_name')} *
                </label>
                <input 
                  type="text" 
                  name="first_name" 
                  value={form.first_name} 
                  onChange={handleChange} 
                  disabled={!edit}
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    padding: '0.8rem 1rem',
                    border: edit ? '2px solid #7c4dff' : '2px solid #e0e0e0',
                    fontSize: 16,
                    transition: 'all 0.3s ease',
                    background: edit ? '#fff' : '#f8f9fa'
                  }}
                  placeholder={t('enter_full_name')}
                />
              </div>
              {/* البريد الإلكتروني */}
              <div style={{marginBottom: 20}}>
                <label style={{
                  display: 'block',
                  color: '#7c4dff',
                  fontWeight: 700,
                  marginBottom: 8,
                  fontSize: 14
                }}>
                  {t('email')} *
                </label>
                <input 
                  type="email" 
                  name="email" 
                  value={form.email} 
                  onChange={handleChange} 
                  disabled={!edit}
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    padding: '0.8rem 1rem',
                    border: edit ? '2px solid #7c4dff' : '2px solid #e0e0e0',
                    fontSize: 16,
                    transition: 'all 0.3s ease',
                    background: edit ? '#fff' : '#f8f9fa'
                  }}
                  placeholder={t('enter_email')}
                />
              </div>
              {/* رقم الهاتف */}
              <div style={{marginBottom: 20}}>
                <label style={{
                  display: 'block',
                  color: '#7c4dff',
                  fontWeight: 700,
                  marginBottom: 8,
                  fontSize: 14
                }}>
                  {t('phone')} *
                </label>
                <input 
                  type="text" 
                  name="phone" 
                  value={form.phone} 
                  onChange={handleChange} 
                  disabled={!edit}
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    padding: '0.8rem 1rem',
                    border: edit ? '2px solid #7c4dff' : '2px solid #e0e0e0',
                    fontSize: 16,
                    transition: 'all 0.3s ease',
                    background: edit ? '#fff' : '#f8f9fa'
                  }}
                  placeholder={t('enter_phone')}
                />
              </div>
            </div>
            {/* رسائل الحالة */}
            {error && (
              <div style={{
                background: '#ffebee',
                color: '#c62828',
                padding: '0.8rem',
                borderRadius: 8,
                marginBottom: 16,
                border: '1px solid #ffcdd2',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span>⚠️</span>
                {error}
              </div>
            )}
            {msg && (
              <div style={{
                background: '#e8f5e8',
                color: '#2e7d32',
                padding: '0.8rem',
                borderRadius: 8,
                marginBottom: 16,
                border: '1px solid #c8e6c9',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span>✅</span>
                {msg}
              </div>
            )}
            {/* أزرار التحكم */}
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              marginTop: 24,
              flexWrap: 'wrap'
            }}>
              {!edit ? (
                <>
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEdit(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #7c4dff 0%, #00bcd4 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      padding: '0.8rem 2rem',
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(124, 77, 255, 0.3)'
                    }}
                  >
                    ✏️ {t('edit_data')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowPasswordModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      padding: '0.8rem 2rem',
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(255, 152, 0, 0.3)'
                    }}
                  >
                    🔒 {t('change_password')}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    type="submit"
                    disabled={loading}
                    style={{
                      background: loading ? '#ccc' : 'linear-gradient(135deg, #00bcd4 0%, #009688 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      padding: '0.8rem 2rem',
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(0, 188, 212, 0.3)'
                    }}
                  >
                    {loading ? t('saving') : t('save_changes')}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCancel}
                    style={{
                      background: '#f5f5f5',
                      color: '#666',
                      border: '2px solid #e0e0e0',
                      borderRadius: 12,
                      padding: '0.8rem 2rem',
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    ❌ {t('cancel')}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UserProfile; 