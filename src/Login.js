import React, { useState } from 'react';
import './Login.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';

function Login() {
  const [input, setInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [welcome, setWelcome] = useState(false);
  const [showSignupChoice, setShowSignupChoice] = useState(false);
  const [loginType, setLoginType] = useState('user'); // جديد: نوع الحساب
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect');
  const { signIn } = useAuth();
  const { t } = useTranslation();
  // أضف حالة للغة المختارة
  const [lang, setLang] = useState(i18n.language || 'ku');
  const [showContactModal, setShowContactModal] = useState(false);

  // دالة تغيير اللغة
  const handleLangChange = (e) => {
    const newLang = e.target.value;
    setLang(newLang);
    i18n.changeLanguage(newLang);
    // أزل إعادة تحميل الصفحة
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!input || !password) {
      setError(t('login.error_required'));
      return;
    }
    
    try {
      const { data, error } = await signIn(input, password, loginType);

      if (error) throw new Error(error);
      setWelcome(true);
      // استخراج redirect من الرابط إذا كان موجوداً
      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect');
      if (redirect) {
        navigate(redirect, { replace: true });
      } else if (loginType === 'doctor') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/home');
      }
    } catch (err) {
      // إذا كانت رسالة الخطأ هي الحساب مسجل كطبيب، استخدم الترجمة
              if (err.message && err.message.includes(t('registered_as_doctor'))) {
        setError(t('doctor_account_login_error'));
      } else {
        setError(err.message);
      }
    }
  };

  // دالة اختبار CORS
  const testCORS = async () => {
    try {
      console.log('🔍 Testing CORS...');
      
      // Test 1: Simple endpoint
      try {
        const response1 = await fetch(`${process.env.REACT_APP_API_URL || 'https://tabib-iq-backend-production.up.railway.app'}/cors-test`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response1.ok) {
          const data1 = await response1.json();
          console.log('✅ Simple CORS test successful:', data1);
        } else {
          console.log('❌ Simple CORS test failed:', response1.status);
        }
      } catch (error) {
        console.log('❌ Simple CORS test error:', error.message);
      }
      
      // Test 2: API endpoint
      try {
        const response2 = await fetch(`${process.env.REACT_APP_API_URL || 'https://tabib-iq-backend-production.up.railway.app'}/api/test-cors`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response2.ok) {
          const data2 = await response2.json();
          console.log('✅ API CORS test successful:', data2);
          alert('CORS test successful! Check console for details.');
        } else {
          console.log('❌ API CORS test failed:', response2.status);
          alert(`CORS test failed: ${response2.status}`);
        }
      } catch (error) {
        console.error('❌ API CORS test error:', error);
        alert(`CORS test error: ${error.message}`);
      }
      
    } catch (error) {
      console.error('❌ CORS test error:', error);
      alert(`CORS test error: ${error.message}`);
    }
  };

  return (
    <div className="login-container" style={{
      background: 'linear-gradient(135deg, #00bcd4 0%, #009688 100%)',
      minHeight: window.innerWidth < 500 ? '120vh' : '100vh',
      position: 'relative',
      flexDirection:'column',
      justifyContent:'flex-start',
      paddingTop:'3.5rem',
    }}>
      {/* رسالة إذا كان هناك redirect */}
      {redirect && (
        <div style={{
          background:'#fff3e0',
          color:'#e65100',
          borderRadius:12,
          padding:'1rem 1.2rem',
          fontWeight:700,
          fontSize:17,
          margin:'1.2rem auto 1.5rem auto',
          maxWidth:400,
          textAlign:'center',
          boxShadow:'0 2px 12px #ff980022',
        }}>
          {t('login_required')}
        </div>
      )}
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
      <div style={{position:'relative', zIndex:1, width:'100%'}}>
        <div style={{textAlign:'center', marginBottom:'2.2rem', padding:'0 1.2rem'}}>
          <img src="/logo192.png" alt="Logo" style={{width: window.innerWidth < 500 ? 64 : 90, height: window.innerWidth < 500 ? 64 : 90, borderRadius: '50%', background: '#fff', border: '5px solid #fff', boxShadow: '0 4px 18px #00968855, 0 1.5px 8px #00bcd433', marginBottom: window.innerWidth < 500 ? 8 : 12, marginTop: window.innerWidth < 500 ? 8 : 0, objectFit: 'cover'}} />
          <div style={{fontWeight:900, fontSize: '2rem', color:'#fff', letterSpacing:0.5, marginBottom:7, textShadow:'0 2px 8px #00968855'}}>{t('platform_name')}</div>
          <div style={{color:'#fff', fontSize:'1.15rem', fontWeight:600, textShadow:'0 1px 6px #7c4dff55'}}>{t('platform_desc')}</div>
        </div>
        <form className="login-box" onSubmit={handleSubmit}>
          <h2>{t('login_title')}</h2>
          {/* اختيار نوع الحساب بشكل عصري بدون إيموجيات */}
          <div style={{display:'flex', gap:12, marginBottom:18, justifyContent:'center', flexWrap:'wrap'}}>
            <div
              onClick={()=>setLoginType('user')}
              style={{
                cursor:'pointer',
                background: loginType==='user' ? 'linear-gradient(90deg,#7c4dff 0%,#00bcd4 100%)' : '#f3f6fa',
                color: loginType==='user' ? '#fff' : '#7c4dff',
                border: loginType==='user' ? '2.5px solid #00bcd4' : '2px solid #e0e0e0',
                borderRadius:14,
                padding:'1rem 1.8rem',
                fontWeight:800,
                fontSize:16,
                boxShadow: loginType==='user' ? '0 2px 12px #00bcd422' : 'none',
                display:'flex', alignItems:'center', gap:10,
                transition:'all 0.2s'
              }}
            >
              {t('user')}
              {loginType==='user' && <span style={{marginRight:8, fontSize:18}}>✓</span>}
            </div>
            <div
              onClick={()=>setLoginType('doctor')}
              style={{
                cursor:'pointer',
                background: loginType==='doctor' ? 'linear-gradient(90deg,#00bcd4 0%,#7c4dff 100%)' : '#f3f6fa',
                color: loginType==='doctor' ? '#fff' : '#00bcd4',
                border: loginType==='doctor' ? '2.5px solid #7c4dff' : '2px solid #e0e0e0',
                borderRadius:14,
                padding:'1rem 1.8rem',
                fontWeight:800,
                fontSize:16,
                boxShadow: loginType==='doctor' ? '0 2px 12px #7c4dff22' : 'none',
                display:'flex', alignItems:'center', gap:10,
                transition:'all 0.2s'
              }}
            >
              {t('doctor')}
              {loginType==='doctor' && <span style={{marginRight:8, fontSize:18}}>✓</span>}
            </div>
            <div
              onClick={()=>{
                alert(t('contact_info')+':\n\n📧 '+t('email')+': Tabibiqapp@gmail.com\n📱 '+t('whatsapp_number')+'\n\n'+t('we_are_here'));
              }}
              style={{
                cursor:'pointer',
                background: '#f3f6fa',
                color: '#ff6b35',
                border: '2px solid #e0e0e0',
                borderRadius:14,
                padding:'1rem 1.8rem',
                fontWeight:800,
                fontSize:16,
                display:'flex', alignItems:'center', gap:10,
                transition:'all 0.2s',
                position:'relative'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 107, 53, 0.1)';
                e.target.style.borderColor = '#ff6b35';
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#f3f6fa';
                e.target.style.borderColor = '#e0e0e0';
              }}
            >
              {t('health_center')}
              <span style={{
                position:'absolute',
                top:-8,
                right:-8,
                background:'#ff6b35',
                color:'white',
                borderRadius:'50%',
                width:20,
                height:20,
                fontSize:12,
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                fontWeight:'bold'
              }}>
                !
              </span>
            </div>
          </div>
          {(!input || !input.includes('@')) ? (
            <div style={{display:'flex', alignItems:'center', width:'100%', maxWidth:'100%'}}>
              <span style={{background:'#e0f7fa', color:'#009688', borderRadius:'10px 0 0 10px', padding:'0.9rem 0.9rem', fontWeight:700, fontSize:'1.08rem', border:'1.5px solid #b2dfdb', borderRight:'none'}}>+964</span>
              <input
                type="text"
                placeholder={t('phone_or_email_placeholder')}
                value={input}
                onChange={e => setInput(e.target.value)}
                autoComplete="username"
                style={{borderRadius:'0 12px 12px 0', borderLeft:'none', flex:1, minWidth:0}}
              />
            </div>
          ) : (
            <input
              type="text"
              placeholder={t('email_or_phone')}
              value={input}
              onChange={e => setInput(e.target.value)}
              autoComplete="username"
            />
          )}
          <input
            type="password"
            placeholder={t('password')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && <div className="login-error">{error}</div>}
          <button type="submit" style={{
            fontSize: window.innerWidth < 500 ? 15 : 18,
            padding: window.innerWidth < 500 ? '0.7rem 1.2rem' : '1rem 2.2rem',
            borderRadius: 12,
            fontWeight: 800,
            background: 'linear-gradient(90deg,#00bcd4 0%,#009688 100%)',
            color: '#fff',
            border: 'none',
            marginTop: 8,
            boxShadow: '0 2px 8px #00bcd422',
            width: '100%',
            maxWidth: 340,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            cursor: 'pointer'
          }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" style={{marginLeft: 6}} xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4v16m8-8H4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('login_button')}
          </button>
        </form>
        <div style={{textAlign: 'center', marginTop: '1.2rem'}}>
          <button
            type="button"
            className="signup-link-btn"
            onClick={() => setShowSignupChoice(true)}
          >
            {t('create_account')}
          </button>
        </div>
        {showSignupChoice && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #00968833', padding: '2.2rem 1.5rem', minWidth: 260, textAlign: 'center'}}>
              <h3 style={{marginBottom:18, color:'#7c4dff', fontWeight:800}}>{t('choose_account_type')}</h3>
              <div style={{display:'flex', gap:18, justifyContent:'center', marginBottom:18}}>
                <button
                  style={{background:'#7c4dff', color:'#fff', border:'none', borderRadius:12, padding:'0.9rem 2.2rem', fontWeight:700, fontSize:17, cursor:'pointer'}}
                  onClick={()=>{ setShowSignupChoice(false); navigate('/signup'); }}
                >
                  {t('user')}
                </button>
                <button
                  style={{background:'#00bcd4', color:'#fff', border:'none', borderRadius:12, padding:'0.9rem 2.2rem', fontWeight:700, fontSize:17, cursor:'pointer'}}
                  onClick={()=>{ setShowSignupChoice(false); navigate('/signup-doctor'); }}
                >
                  {t('doctor')}
                </button>
              </div>
              <button style={{background:'none', border:'none', color:'#888', cursor:'pointer', fontSize:15}} onClick={()=>setShowSignupChoice(false)}>{t('close')}</button>
            </div>
          </div>
        )}

        {/* زر اختبار CORS */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14, gap: 10 }}>
          <button
            type="button"
            onClick={testCORS}
            style={{
              width: '48%',
              maxWidth: 120,
              background: 'linear-gradient(90deg,#ff9800 0%,#ffb74d 100%)',
              color: '#fff',
              border: '2px solid #ff9800',
              borderRadius: 14,
              padding: window.innerWidth < 500 ? '0.45rem 0.7rem' : '0.7rem 1.5rem',
              fontWeight: 900,
              fontSize: window.innerWidth < 500 ? 11 : 14,
              cursor: 'pointer',
              boxShadow: '0 2px 12px #ff980022',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              letterSpacing: 0.2
            }}
          >
            اختبار CORS
          </button>
          
          <button
            type="button"
            onClick={async () => {
              try {
                console.log('🔍 Testing direct login...');
                
                // Test 1: Test login endpoint
                try {
                  const response1 = await fetch(`${process.env.REACT_APP_API_URL || 'https://tabib-iq-backend-production.up.railway.app'}/api/test-login`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      email: 'test@test.com',
                      password: 'test123',
                      loginType: 'user'
                    })
                  });
                  
                  if (response1.ok) {
                    const data1 = await response1.json();
                    console.log('✅ Test login endpoint successful:', data1);
                  } else {
                    console.log('❌ Test login endpoint failed:', response1.status);
                  }
                } catch (error) {
                  console.log('❌ Test login endpoint error:', error.message);
                }
                
                // Test 2: Actual login endpoint
                try {
                  const response2 = await fetch(`${process.env.REACT_APP_API_URL || 'https://tabib-iq-backend-production.up.railway.app'}/auth/login`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      email: 'test@test.com',
                      password: 'test123',
                      loginType: 'user'
                    })
                  });
                  
                  if (response2.ok) {
                    const data2 = await response2.json();
                    console.log('✅ Direct login test successful:', data2);
                    alert('Direct login test successful!');
                  } else {
                    console.log('❌ Direct login test failed:', response2.status);
                    alert(`Direct login test failed: ${response2.status}`);
                  }
                } catch (error) {
                  console.error('❌ Direct login test error:', error);
                  alert(`Direct login test error: ${error.message}`);
                }
              } catch (error) {
                console.error('❌ Direct login test error:', error);
                alert(`Direct login test error: ${error.message}`);
              }
            }}
            style={{
              width: '48%',
              maxWidth: 120,
              background: 'linear-gradient(90deg,#4caf50 0%,#66bb6a 100%)',
              color: '#fff',
              border: '2px solid #4caf50',
              borderRadius: 14,
              padding: window.innerWidth < 500 ? '0.45rem 0.7rem' : '0.7rem 1.5rem',
              fontWeight: 900,
              fontSize: window.innerWidth < 500 ? 11 : 14,
              cursor: 'pointer',
              boxShadow: '0 2px 12px #4caf5022',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              letterSpacing: 0.2
            }}
          >
            اختبار Login
          </button>
        </div>

        {/* زر تواصل معنا */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            style={{
              width: '100%',
              maxWidth: 260,
              background: 'linear-gradient(90deg,#fff 0%,#e0f7fa 100%)',
              color: '#00796b',
              border: '2px solid #00bcd4',
              borderRadius: 14,
              padding: window.innerWidth < 500 ? '0.45rem 0.7rem' : '0.7rem 1.5rem',
              fontWeight: 900,
              fontSize: window.innerWidth < 500 ? 13 : 16,
              cursor: 'pointer',
              boxShadow: '0 2px 12px #00bcd422',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              letterSpacing: 0.2
            }}
          >
            تواصل معنا
          </button>
        </div>

        {/* شاشة منبثقة لمعلومات التواصل */}
        {showContactModal && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.18)',
            zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 18,
              boxShadow: '0 4px 24px #00968833',
              padding: window.innerWidth < 500 ? '1.2rem 1.1rem' : '2.2rem 2.5rem',
              minWidth: 220,
              maxWidth: '90vw',
              textAlign: 'center',
              color: '#00796b',
              fontWeight: 800,
              fontSize: window.innerWidth < 500 ? 15 : 18
            }}>
              <div style={{marginBottom: 12, fontSize: window.innerWidth < 500 ? 16 : 20, fontWeight: 900}}>معلومات التواصل</div>
              <div style={{marginBottom: 10}}>
                <span style={{fontWeight:700}}>الإيميل:</span> <span style={{direction:'ltr'}}>Tabibiqapp@gmail.com</span>
              </div>
              <div style={{marginBottom: 18}}>
                <span style={{fontWeight:700}}>واتساب:</span> 
                <a
                  href="https://wa.me/9647769012619"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    direction:'ltr',
                    color:'#25d366',
                    textDecoration:'underline',
                    fontWeight:900,
                    cursor:'pointer'
                  }}
                  onMouseOver={e => e.target.style.textDecoration = 'underline'}
                  onMouseOut={e => e.target.style.textDecoration = 'underline'}
                >
                  +9647769012619
                </a>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                style={{
                  background:'#00bcd4', color:'#fff', border:'none', borderRadius:10,
                  padding: window.innerWidth < 500 ? '0.5rem 1.2rem' : '0.7rem 2.2rem',
                  fontWeight:800, fontSize: window.innerWidth < 500 ? 13 : 16, cursor:'pointer',
                  marginTop: 6
                }}
              >
                إغلاق
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Login;