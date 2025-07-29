import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // استرجاع بيانات المستخدم من localStorage عند تحميل الصفحة
    const savedUser = localStorage.getItem('user');
    const savedProfile = localStorage.getItem('profile');
    

    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('🔍 AuthContext - parsed userData:', userData);
        setUser(userData);
      } catch (error) {
        console.error('❌ AuthContext - Error parsing user data:', error);
      }
    }
    
    if (savedProfile) {
      try {
        const profileData = JSON.parse(savedProfile);
        console.log('🔍 AuthContext - parsed profileData:', profileData);
        setProfile(profileData);
      } catch (error) {
        console.error('❌ AuthContext - Error parsing profile data:', error);
      }
    }
    
    setLoading(false);

    // تحديث تلقائي عند أي تغيير في localStorage (مثلاً عند تسجيل دخول الأدمن)
    const handleStorage = () => {
      const newUser = localStorage.getItem('user');
      const newProfile = localStorage.getItem('profile');
      setUser(newUser ? JSON.parse(newUser) : null);
      setProfile(newProfile ? JSON.parse(newProfile) : null);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const signUp = async (email, password, userData) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'https://tabib-iq-backend-production.up.railway.app'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...userData })
      });
      
      const data = await res.json();

      if (res.ok) {
        return { data, error: null };
      } else {
        return { data: null, error: data.error };
      }
    } catch (error) {
      return { data: null, error: error.message };
    }
  };

  const signIn = async (email, password, loginType) => {
    try {
      console.log('🔍 تسجيل الدخول:', { email, loginType });
      console.log('🔍 API URL:', process.env.REACT_APP_API_URL);
      
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'https://tabib-iq-backend-production.up.railway.app'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, loginType })
      });
      
      console.log('🔍 استجابة تسجيل الدخول:', res.status);
      
      const data = await res.json();
      console.log('🔍 بيانات الاستجابة:', data);
      
      if (res.ok) {
        // حفظ بيانات المستخدم في localStorage
        const userData = data.user || data.doctor || data;
        console.log('🔍 بيانات المستخدم:', userData);
        
        // التأكد من وجود user_type
        if (!userData.user_type && userData.role) {
          userData.user_type = userData.role;
        }
        
        // التأكد من وجود id
        if (userData._id && !userData.id) {
          userData.id = userData._id;
        }
        
        // التأكد من وجود first_name
        if (userData.name && !userData.first_name) {
          userData.first_name = userData.name;
        }
        
        console.log('🔍 user_type النهائي:', userData.user_type);
        console.log('🔍 id النهائي:', userData.id);
        console.log('🔍 first_name النهائي:', userData.first_name);
        
        setUser(userData);
        setProfile(userData);
        
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('profile', JSON.stringify(userData));

        console.log('✅ تم تسجيل الدخول بنجاح');
        return { data, error: null };
      } else {
        console.log('❌ خطأ في تسجيل الدخول:', data.message || data.error);
        return { data: null, error: data.message || data.error };
      }
    } catch (error) {
      console.error('❌ خطأ في الاتصال:', error);
      return { data: null, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      // حذف البيانات من localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('profile');
      
      setUser(null);
      setProfile(null);
    } catch (error) {
      // Error signing out
    }
  };

  const updateProfile = async (updates) => {
    try {
      let url = '';
      let key = '';
      const currentUser = profile || user;
      
      console.log('🔍 updateProfile - currentUser:', currentUser);
      console.log('🔍 updateProfile - updates:', updates);
      
      if (!currentUser?.id && !currentUser?._id) {
        return { data: null, error: 'لا يمكن العثور على معرف المستخدم' };
      }
      
      const userId = currentUser.id || currentUser._id;
      
      if (currentUser.user_type === 'doctor') {
        url = `${process.env.REACT_APP_API_URL || 'https://tabib-iq-backend-production.up.railway.app'}/doctor/${userId}`;
        key = 'doctor';
      } else {
        url = `${process.env.REACT_APP_API_URL || 'https://tabib-iq-backend-production.up.railway.app'}/user/${userId}`;
        key = 'user';
      }
      
      console.log('🔍 updateProfile - URL:', url);
      console.log('🔍 updateProfile - Key:', key);
      
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      console.log('🔍 updateProfile - Response status:', res.status);
      
      const data = await res.json();
      
      console.log('🔍 updateProfile - Response data:', data);
  
      if (!res.ok) return { data: null, error: data.error };
      
      const updated = data[key] || data.user || data.doctor;
      if (updated) {
        setProfile(updated);
        setUser(updated);
        localStorage.setItem('profile', JSON.stringify(updated));
        localStorage.setItem('user', JSON.stringify(updated));
      }
      return { data: updated, error: null };
    } catch (error) {
      console.error('🔍 updateProfile - Error:', error);
      return { data: null, error: error.message };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    logout: signOut,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 