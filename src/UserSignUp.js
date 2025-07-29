import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function UserSignUp() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {

    if (success) {
      navigate('/');
    }
  }, [success, navigate]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.phone || !form.password || !form.confirm) {
      setError('يرجى ملء جميع الحقول');
      return;
    }
    if (form.password !== form.confirm) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }
    try {
      const res = await fetch(process.env.REACT_APP_API_URL + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          first_name: form.name,
          phone: form.phone
        })
      });
      const data = await res.json();
              setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #00bcd4 0%, #009688 100%)',
      minHeight: '100vh',
      position: 'relative',
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
      <div style={{position:'relative', zIndex:1}}>
        <form className="login-box" onSubmit={handleSubmit}>
          <h2>تسجيل مستخدم جديد</h2>
          <input
            type="text"
            name="name"
            placeholder="الاسم الكامل"
            value={form.name}
            onChange={handleChange}
          />
          <input
            type="email"
            name="email"
            placeholder="البريد الإلكتروني"
            value={form.email}
            onChange={handleChange}
          />
          <div style={{display:'flex', alignItems:'center', width:'100%', maxWidth:'100%'}}>
            <span style={{background:'#e0f7fa', color:'#009688', borderRadius:'10px 0 0 10px', padding:'0.9rem 0.9rem', fontWeight:700, fontSize:'1.08rem', border:'1.5px solid #b2dfdb', borderRight:'none'}}>+964</span>
            <input
              type="text"
              name="phone"
              placeholder="رقم الهاتف (بدون الصفر)"
              value={form.phone}
              onChange={handleChange}
              style={{borderRadius:'0 12px 12px 0', borderLeft:'none', flex:1, minWidth:0}}
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
              <div>يجب أن يكون الرقم يحتوي على واتساب للتواصل مع الطبيب</div>
              <div style={{fontSize: '0.8rem', marginTop: 4, opacity: 0.8}}>
                <strong>تێبینی گرنگ:</strong> ژمارەکە دەبێت واتساپی تێدابێت بۆ پەیوەندی لەگەڵ دکتۆر
              </div>
            </div>
          </div>
          <input
            type="password"
            name="password"
            placeholder="كلمة المرور"
            value={form.password}
            onChange={handleChange}
          />
          <input
            type="password"
            name="confirm"
            placeholder="تأكيد كلمة المرور"
            value={form.confirm}
            onChange={handleChange}
          />
          {error && <div className="login-error">{error}</div>}
          <button type="submit">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" style={{marginLeft: 6}} xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4v16m8-8H4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            تسجيل
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserSignUp; 