import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTranslation } from 'react-i18next';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [healthCenters, setHealthCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateCenter, setShowCreateCenter] = useState(false);
  const [newCenter, setNewCenter] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    type: 'clinic',
    location: '',
    services: '',
    specialties: '',
    workingHours: '',
    description: '',
    doctors: []
  });
  const [showAddDoctors, setShowAddDoctors] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    specialty: '',
    email: '',
    phone: '',
    workingHours: '',
    experience: '',
    education: '',
    description: ''
  });
  const [analytics, setAnalytics] = useState({
    topDoctors: [],
    topSpecialties: [],
    monthlyStats: [],
    userGrowth: []
  });
  // state للتحكم في عرض "المزيد"
  const [showMoreDoctors, setShowMoreDoctors] = useState(false);
  const [showMoreSpecialties, setShowMoreSpecialties] = useState(false);
  const [showMoreUsers, setShowMoreUsers] = useState(false);
  const [showMoreCenters, setShowMoreCenters] = useState(false);
  const [newCenterNewTime, setNewCenterNewTime] = useState({ day: '', from: '', to: '' });
  const [newCenterWorkTimes, setNewCenterWorkTimes] = useState([]);
  const [newService, setNewService] = useState({ name: '', price: '' });
  const [newCenterServices, setNewCenterServices] = useState([]);
  const [doctorWorkTimes, setDoctorWorkTimes] = useState([]);
  const [doctorNewTime, setDoctorNewTime] = useState({ day: '', from: '', to: '' });
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  
  // دالة مساعدة لمسار الصور والوثائق
  const getImageUrl = (img) => {
    if (!img) return null;
    
    // إذا كان المسار يبدأ بـ /uploads/ أو يحتوي على uploads
    if (img.startsWith('/uploads/') || img.includes('uploads/')) {
      return (process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com') + (img.startsWith('/') ? img : '/' + img);
    }
    
    // إذا كان URL كامل
    if (img.startsWith('http')) return img;
    
    // إذا كان اسم ملف فقط (بدون مسار)
    if (img && !img.includes('/') && !img.includes('http')) {
      return `${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/uploads/${img}`;
    }
    
    console.log('🔍 getImageUrl - img:', img);
    return null;
  };
  
  // حالة اليوم المختار في التقويم
  const [selectedDate, setSelectedDate] = useState('');
  // حالة التقويم
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth()); // 0-11
  // حساب أيام الشهر
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const daysArr = Array.from({length: daysInMonth}, (_,i)=>i+1);
  // دالة تنسيق التاريخ yyyy-mm-dd
  const formatDate = (y, m, d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  // دالة لجلب المواعيد حسب اليوم المختار
  const filteredAppointments = selectedDate
    ? appointments.filter(a => a.date === selectedDate)
    : [];

  useEffect(() => {
    console.log('🔍 تحميل AdminDashboard...');
    
    // التحقق من المستخدم
    const checkUser = () => {
      const savedUser = localStorage.getItem('user');
      console.log('👤 المستخدم المحفوظ:', savedUser);
      
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        console.log('📊 بيانات المستخدم:', userData);
        
        if (userData.user_type === 'admin') {
          console.log('✅ المستخدم أدمن - جلب البيانات...');
          fetchData();
          return;
        } else {
          console.log('❌ المستخدم ليس أدمن:', userData.user_type);
        }
      } else {
        console.log('❌ لا يوجد مستخدم محفوظ');
      }
      
      console.log('🔄 إعادة توجيه لصفحة تسجيل دخول الأدمن...');
      navigate('/admin-login');
    };

    checkUser();
  }, [navigate]);

  const fetchData = async () => {
    console.log('📡 جلب البيانات من الخادم...');
    setLoading(true);
    setError('');
    
    try {
      // جلب البيانات الحقيقية من قاعدة البيانات
      const [usersRes, doctorsRes, appointmentsRes, healthCentersRes] = await Promise.all([
              fetch((process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com') + '/users'),
      fetch((process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com') + '/admin/doctors'),
      fetch((process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com') + '/appointments'),
      fetch((process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com') + '/health-centers')
      ]);

      console.log('📊 استجابة المستخدمين:', usersRes?.status);
      console.log('📊 استجابة الأطباء:', doctorsRes?.status);
      console.log('📊 استجابة المواعيد:', appointmentsRes?.status);
      console.log('📊 استجابة المراكز الصحية:', healthCentersRes?.status);

      // جلب المستخدمين
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        console.log('✅ تم جلب المستخدمين:', usersData.length);
        console.log('📊 بيانات المستخدمين:', usersData);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } else {
        console.log('❌ فشل في جلب المستخدمين:', usersRes.status);
        setUsers([]);
      }

      // جلب الأطباء
      if (doctorsRes.ok) {
        const doctorsData = await doctorsRes.json();
        console.log('✅ تم جلب الأطباء:', doctorsData.length);
        console.log('📊 بيانات الأطباء:', doctorsData);
        
        // تشخيص الوثائق لكل طبيب
        doctorsData.forEach((doctor, index) => {
          console.log(`🔍 الطبيب ${index + 1} (${doctor.name}):`, {
            image: doctor.image,
            idFront: doctor.idFront,
            idBack: doctor.idBack,
            syndicateFront: doctor.syndicateFront,
            syndicateBack: doctor.syndicateBack
          });
          
          // تشخيص URLs
          console.log(`🔗 URLs للطبيب ${doctor.name}:`, {
            imageUrl: getImageUrl(doctor.image),
            idFrontUrl: getImageUrl(doctor.idFront),
            idBackUrl: getImageUrl(doctor.idBack),
            syndicateFrontUrl: getImageUrl(doctor.syndicateFront),
            syndicateBackUrl: getImageUrl(doctor.syndicateBack)
          });
        });
        
        setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
      } else {
        console.log('❌ فشل في جلب الأطباء:', doctorsRes.status);
        setDoctors([]);
      }

      // جلب المواعيد
      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        console.log('✅ تم جلب المواعيد:', appointmentsData.length);
        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      } else {
        console.log('❌ فشل في جلب المواعيد:', appointmentsRes.status);
        setAppointments([]);
      }

      // جلب المراكز الصحية
      if (healthCentersRes.ok) {
        const healthCentersData = await healthCentersRes.json();
        console.log('✅ تم جلب المراكز الصحية:', healthCentersData.length);
        setHealthCenters(Array.isArray(healthCentersData) ? healthCentersData : []);
      } else {
        console.log('❌ فشل في جلب المراكز الصحية:', healthCentersRes.status);
        setHealthCenters([]);
      }

      setLoading(false);
      
      // جلب التحليل بعد جلب البيانات الأساسية
      fetchAnalytics();
    } catch (error) {
      console.error('❌ خطأ في جلب البيانات:', error);
      setError('فشل في الاتصال بالخادم');
      setUsers([]);
      setDoctors([]);
      setAppointments([]);
      setHealthCenters([]);
      setLoading(false);
    }
  };

    const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    logout();
    navigate('/admin-login');
  };

  const approveDoctor = async (doctorId) => {
    const doctor = doctors.find(d => d._id === doctorId || d.id === doctorId);
    if (!doctor) return;
    
    const confirmMessage = `هل أنت متأكد من الموافقة على الطبيب:\n\n` +
      `الاسم: ${doctor.name}\n` +
      `البريد الإلكتروني: ${doctor.email}\n` +
      `التخصص: ${doctor.specialty}\n\n` +
      `⚠️ تأكد من مراجعة جميع الوثائق المرفقة قبل الموافقة.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/doctors/${doctorId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        fetchData(); // إعادة تحميل البيانات
        alert('✅ تم الموافقة على الطبيب بنجاح\nسيتم إرسال إشعار للطبيب بالبريد الإلكتروني');
      } else {
        alert('❌ ' + t('error_approving_doctor'));
      }
    } catch (error) {
      console.error('خطأ في الموافقة على الطبيب:', error);
              alert('❌ ' + t('error_approving_doctor') + ' - ' + t('error_server_connection'));
    }
  };

  const rejectDoctor = async (doctorId) => {
    const doctor = doctors.find(d => d._id === doctorId || d.id === doctorId);
    if (!doctor) return;
    
    const confirmMessage = `هل أنت متأكد من رفض الطبيب:\n\n` +
      `الاسم: ${doctor.name}\n` +
      `البريد الإلكتروني: ${doctor.email}\n` +
      `التخصص: ${doctor.specialty}\n\n` +
      `⚠️ سيتم إرسال إشعار للطبيب برفض الطلب.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/doctors/${doctorId}/reject`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          fetchData(); // إعادة تحميل البيانات
        alert('❌ تم رفض الطبيب بنجاح\nسيتم إرسال إشعار للطبيب بالبريد الإلكتروني');
        } else {
        alert('❌ ' + t('error_rejecting_doctor'));
        }
      } catch (error) {
        console.error('خطأ في رفض الطبيب:', error);
              alert('❌ ' + t('error_rejecting_doctor') + ' - ' + t('error_server_connection'));
    }
  };

  // دالة البحث
  const filteredData = () => {
    console.log('🔍 filteredData - البيانات الحالية:', {
      users: users.length,
      doctors: doctors.length,
      appointments: appointments.length,
      searchTerm
    });
    
    if (!searchTerm) {
      console.log('✅ إرجاع البيانات الأصلية بدون فلترة');
      return { users, doctors, appointments };
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    const filteredUsers = users.filter(user => 
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.phone?.includes(searchTerm)
    );
    
    const filteredDoctors = doctors.filter(doctor => 
      doctor.name?.toLowerCase().includes(searchLower) ||
      doctor.email?.toLowerCase().includes(searchLower) ||
      doctor.specialty?.toLowerCase().includes(searchLower)
    );
    
    const filteredAppointments = appointments.filter(appointment => 
      appointment.user_name?.toLowerCase().includes(searchLower) ||
      appointment.doctor_name?.toLowerCase().includes(searchLower)
    );
    
    console.log('🔍 البيانات المفلترة:', {
      users: filteredUsers.length,
      doctors: filteredDoctors.length,
      appointments: filteredAppointments.length
    });
    
    return { users: filteredUsers, doctors: filteredDoctors, appointments: filteredAppointments };
  };

  // دالة جلب التحليل
  const fetchAnalytics = async () => {
    try {
      // جلب جميع الأطباء والمواعيد لحساب الإحصائيات الحقيقية
      const [doctorsResponse, appointmentsResponse] = await Promise.all([
                          fetch((process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com') + '/admin/doctors'),
        fetch((process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com') + '/appointments')
      ]);

      if (doctorsResponse.ok && appointmentsResponse.ok) {
        const doctors = await doctorsResponse.json();
        const appointments = await appointmentsResponse.json();

        // حساب أفضل الأطباء حسب عدد المواعيد
        const doctorAppointmentCounts = {};
        appointments.forEach(apt => {
          const doctorId = apt.doctorId;
          if (doctorId) {
            doctorAppointmentCounts[doctorId] = (doctorAppointmentCounts[doctorId] || 0) + 1;
          }
        });

        const topDoctors = doctors
          .filter(doc => doc.status === 'approved')
          .map(doc => ({
            name: doc.name || doc.first_name,
            appointments: doctorAppointmentCounts[doc._id] || 0,
            specialty: doc.specialty || doc.category_ar || 'غير محدد'
          }))
          .sort((a, b) => b.appointments - a.appointments)
          .slice(0, 5);

        // حساب أفضل التخصصات
        const specialtyStats = {};
        doctors.forEach(doc => {
          if (doc.status === 'approved') {
            const specialty = doc.specialty || doc.category_ar || 'غير محدد';
            if (!specialtyStats[specialty]) {
              specialtyStats[specialty] = { count: 0, appointments: 0 };
            }
            specialtyStats[specialty].count++;
            specialtyStats[specialty].appointments += doctorAppointmentCounts[doc._id] || 0;
          }
        });

        const topSpecialties = Object.entries(specialtyStats)
          .map(([specialty, stats]) => ({
            specialty,
            count: stats.count,
            appointments: stats.appointments
          }))
          .sort((a, b) => b.appointments - a.appointments)
          .slice(0, 5);

        // حساب الإحصائيات الشهرية (آخر 3 أشهر)
        const monthlyStats = [];
        const now = new Date();
        for (let i = 2; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = date.toLocaleDateString('ar-EG', { month: 'long' });
          
          const monthDoctors = doctors.filter(doc => {
            const docDate = new Date(doc.createdAt || doc.created_at);
            return docDate.getMonth() === date.getMonth() && docDate.getFullYear() === date.getFullYear();
          });

          const monthAppointments = appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate.getMonth() === date.getMonth() && aptDate.getFullYear() === date.getFullYear();
          });

          monthlyStats.push({
            month: monthName,
            users: Math.floor(Math.random() * 50) + 20, // بيانات تجريبية للمستخدمين
            doctors: monthDoctors.length,
            appointments: monthAppointments.length
          });
        }

        setAnalytics({
          topDoctors,
          topSpecialties,
          monthlyStats,
          userGrowth: [] // سيتم إضافة هذا لاحقاً إذا لزم الأمر
        });
      } else {
        // بيانات تجريبية للتحليل في حالة فشل الاتصال
        setAnalytics({
          topDoctors: [
            { name: 'د. محمد حسن', appointments: 45, specialty: 'طب عام' },
            { name: 'د. سارة أحمد', appointments: 38, specialty: 'أمراض القلب' },
            { name: 'د. علي محمود', appointments: 32, specialty: 'طب الأطفال' }
          ],
          topSpecialties: [
            { specialty: 'طب عام', count: 15, appointments: 120 },
            { specialty: 'أمراض القلب', count: 8, appointments: 95 },
            { specialty: 'طب الأطفال', count: 12, appointments: 87 }
          ],
          monthlyStats: [
            { month: 'يناير', users: 45, doctors: 8, appointments: 156 },
            { month: 'فبراير', users: 67, doctors: 12, appointments: 234 },
            { month: 'مارس', users: 89, doctors: 15, appointments: 312 }
          ],
          userGrowth: []
        });
      }
    } catch (error) {
      console.error('خطأ في جلب التحليل:', error);
      // بيانات تجريبية في حالة الخطأ
      setAnalytics({
        topDoctors: [
          { name: 'د. محمد حسن', appointments: 45, specialty: 'طب عام' },
          { name: 'د. سارة أحمد', appointments: 38, specialty: 'أمراض القلب' },
          { name: 'د. علي محمود', appointments: 32, specialty: 'طب الأطفال' }
        ],
        topSpecialties: [
          { specialty: 'طب عام', count: 15, appointments: 120 },
          { specialty: 'أمراض القلب', count: 8, appointments: 95 },
          { specialty: 'طب الأطفال', count: 12, appointments: 87 }
        ],
        monthlyStats: [
          { month: 'يناير', users: 45, doctors: 8, appointments: 156 },
          { month: 'فبراير', users: 67, doctors: 12, appointments: 234 },
          { month: 'مارس', users: 89, doctors: 15, appointments: 312 }
        ],
        userGrowth: []
      });
    }
  };

  // دالة إضافة طبيب إلى المميزين
  const featureDoctor = async (doctorId) => {
    console.log('⭐ إضافة طبيب إلى المميزين:', doctorId);
    
    if (window.confirm('هل تريد إضافة هذا الطبيب إلى المميزين؟')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/doctors/${doctorId}/feature`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('📡 استجابة إضافة المميز:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ تم إضافة الطبيب إلى المميزين:', data);
          fetchData(); // إعادة تحميل البيانات
          alert('تم إضافة الطبيب إلى المميزين بنجاح');
        } else {
          const errorData = await response.json();
          console.error('❌ فشل في إضافة الطبيب إلى المميزين:', errorData);
          alert(`${t('error_adding_featured_doctor')}: ${errorData.error || t('unknown_error')}`);
        }
      } catch (error) {
        console.error('❌ خطأ في إضافة الطبيب إلى المميزين:', error);
        alert(t('error_adding_featured_doctor') + ' - ' + t('error_server_connection'));
      }
    }
  };

  // دالة إزالة طبيب من المميزين
  const unfeatureDoctor = async (doctorId) => {
    console.log('❌ إزالة طبيب من المميزين:', doctorId);
    
    if (window.confirm('هل تريد إزالة هذا الطبيب من المميزين؟')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/doctors/${doctorId}/unfeature`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('📡 استجابة إزالة المميز:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ تم إزالة الطبيب من المميزين:', data);
          fetchData(); // إعادة تحميل البيانات
          alert('تم إزالة الطبيب من المميزين بنجاح');
        } else {
          const errorData = await response.json();
          console.error('❌ فشل في إزالة الطبيب من المميزين:', errorData);
          alert(`${t('error_removing_featured_doctor')}: ${errorData.error || t('unknown_error')}`);
        }
      } catch (error) {
        console.error('❌ خطأ في إزالة الطبيب من المميزين:', error);
        alert(t('error_removing_featured_doctor') + ' - ' + t('error_server_connection'));
      }
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/users/${userId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          fetchData(); // إعادة تحميل البيانات
          alert(t('user_deleted_successfully'));
        } else {
          alert(t('error_deleting_user'));
        }
      } catch (error) {
        console.error('خطأ في حذف المستخدم:', error);
        alert(t('error_deleting_user') + ' - ' + t('error_server_connection'));
      }
    }
  };

  const deleteDoctor = async (doctorId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطبيب؟')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/doctors/${doctorId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          fetchData(); // إعادة تحميل البيانات
          alert(t('doctor_deleted_successfully'));
        } else {
          alert(t('error_deleting_doctor'));
        }
      } catch (error) {
        console.error('خطأ في حذف الطبيب:', error);
        alert(t('error_deleting_doctor') + ' - ' + t('error_server_connection'));
      }
    }
  };

  const createHealthCenter = async (e) => {
    e.preventDefault();
    
    if (!newCenter.name || !newCenter.email || !newCenter.password || !newCenter.phone) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const response = await fetch((process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com') + '/health-centers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newCenter,
          services: newCenterServices,
          workTimes: newCenterWorkTimes,
          doctors: newCenter.doctors.map(doctor => ({
            name: doctor.name,
            specialty: doctor.specialty,
            experience: doctor.experience,
            education: doctor.education,
            workingHours: doctor.workingHours,
            description: doctor.description,
            phone: doctor.phone,
            email: doctor.email
          }))
        }),
      });

      if (response.ok) {
        const createdCenter = await response.json();
        setHealthCenters([...healthCenters, createdCenter]);
        setNewCenter({
          name: '',
          email: '',
          password: '',
          phone: '',
          type: 'clinic',
          location: '',
          services: '',
          specialties: '',
          workingHours: '',
          description: '',
          doctors: []
        });
        setShowCreateCenter(false);
        alert('تم إنشاء المركز الصحي بنجاح');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'فشل في إنشاء المركز الصحي');
      }
    } catch (error) {
      console.error('خطأ في إنشاء المركز الصحي:', error);
      alert('حدث خطأ في إنشاء المركز الصحي');
    }
  };

  const deleteHealthCenter = async (centerId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المركز الصحي؟')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/health-centers/${centerId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setHealthCenters(healthCenters.filter(center => center._id !== centerId));
          alert('تم حذف المركز الصحي بنجاح');
        } else {
          alert('فشل في حذف المركز الصحي');
        }
      } catch (error) {
        console.error('خطأ في حذف المركز الصحي:', error);
        alert('حدث خطأ في حذف المركز الصحي');
      }
    }
  };

  const addDoctorToCenter = async (e) => {
    e.preventDefault();
    
    if (!newDoctor.name || !newDoctor.specialty || !newDoctor.email) {
      alert('يرجى ملء الحقول المطلوبة (الاسم، التخصص، البريد الإلكتروني)');
      return;
    }

    // إضافة الطبيب للمركز المحلي (قبل إنشاء المركز)
    const doctorToAdd = {
      _id: `temp-${Date.now()}`,
      name: newDoctor.name,
      specialty: newDoctor.specialty,
      experience: newDoctor.experience,
      education: newDoctor.education,
      workingHours: newDoctor.workingHours,
      description: newDoctor.description,
      phone: newDoctor.phone,
      email: newDoctor.email,
      workTimes: doctorWorkTimes,
    };

    setNewCenter({
      ...newCenter,
      doctors: [...newCenter.doctors, doctorToAdd]
    });

    setNewDoctor({
      name: '',
      specialty: '',
      email: '',
      phone: '',
      workingHours: '',
      experience: '',
      education: '',
      description: ''
    });

    alert('تم إضافة الطبيب للمركز بنجاح');
    setDoctorWorkTimes([]);
    setDoctorNewTime({ day: '', from: '', to: '' });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(90deg, #7c4dff 0%, #00bcd4 100%)',
        color: 'white',
        fontSize: '1.2rem'
      }}>
        <div>جاري التحميل...</div>
      </div>
    );
  }

  // معالجة الأخطاء
  if (error) {
    return (
      <div style={{
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(90deg, #7c4dff 0%, #00bcd4 100%)',
        color: 'white',
        fontSize: '1.2rem'
      }}>
        <div style={{textAlign: 'center', maxWidth: '500px'}}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>⚠️</div>
          <h2>حدث خطأ</h2>
          <p style={{marginBottom: '1rem'}}>{error}</p>
          <button 
            onClick={fetchData}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            🔄 إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:'100vh', background:'#f7fafd'}}>
      {/* Header */}
      <div style={{background:'linear-gradient(90deg, #7c4dff 0%, #00bcd4 100%)', color:'white', padding:'1rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1 style={{margin:0, fontWeight:900}}>لوحة تحكم الأدمن</h1>
        <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
          <span>مرحباً، {user?.name || 'مدير النظام'}</span>
          <button onClick={() => navigate('/')} style={{background:'rgba(255,255,255,0.2)', border:'none', color:'white', padding:'0.5rem 1rem', borderRadius:8, cursor:'pointer'}}>
            الصفحة الرئيسية
          </button>
          <button onClick={handleLogout} style={{background:'rgba(255,255,255,0.2)', border:'none', color:'white', padding:'0.5rem 1rem', borderRadius:8, cursor:'pointer'}}>
            تسجيل خروج
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#fff3cd',
          color: '#856404',
          padding: '1rem 2rem',
          borderBottom: '1px solid #ffeaa7',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div style={{background:'white', padding:'1rem 2rem', borderBottom:'1px solid #e0e0e0'}}>
        <div style={{display:'flex', gap:'1rem', alignItems:'center', marginBottom:'1rem'}}>
          <input
            type="text"
            placeholder="البحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              fontSize: 16
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                background: '#e53935',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1rem',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              مسح البحث
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{background:'white', padding:'1rem 2rem', borderBottom:'1px solid #e0e0e0'}}>
        <div style={{display:'flex', gap:'1rem', flexWrap: 'wrap'}}>
          {[
            {id: 'overview', label: 'نظرة عامة'},
            {id: 'analytics', label: 'التحليل'},
            {id: 'users', label: 'المستخدمين'},
            {id: 'doctors', label: 'الأطباء'},
            {id: 'featured', label: 'المميزين'},
            {id: 'pending', label: 'المعلقين'},
            {id: 'health-centers', label: '🏥 المراكز الصحية'},
            {id: 'appointments', label: 'المواعيد'}
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? '#7c4dff' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#333',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                transition: 'all 0.3s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{padding:'2rem'}}>
        {activeTab === 'overview' && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'1.5rem'}}>
            <div style={{gridColumn:'1 / -1', display:'flex', justifyContent:'flex-end', marginBottom:'1rem'}}>
              <button 
                onClick={fetchData}
                style={{
                  background:'#1976d2',
                  color:'white',
                  border:'none',
                  borderRadius:8,
                  padding:'0.5rem 1.2rem',
                  cursor:'pointer',
                  fontSize:'1rem',
                  fontWeight:'bold',
                  boxShadow:'0 2px 8px #1976d222'
                }}
              >
                🔄 تحديث البيانات
              </button>
            </div>
            <div style={{background:'white', padding:'2rem', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
              <h3 style={{color:'#7c4dff', marginBottom:'1rem'}}>إجمالي المستخدمين</h3>
              <div style={{fontSize:'2rem', fontWeight:'bold', color:'#333'}}>
                {(() => {
                  const count = filteredData().users.length;
                  console.log('📊 عرض عدد المستخدمين:', count);
                  return count;
                })()}
              </div>
            </div>
            <div style={{background:'white', padding:'2rem', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
              <h3 style={{color:'#00bcd4', marginBottom:'1rem'}}>إجمالي الأطباء</h3>
              <div style={{fontSize:'2rem', fontWeight:'bold', color:'#333'}}>
                {(() => {
                  const count = filteredData().doctors.length;
                  console.log('📊 عرض عدد الأطباء:', count);
                  return count;
                })()}
              </div>
            </div>
            <div style={{background:'white', padding:'2rem', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
              <h3 style={{color:'#4caf50', marginBottom:'1rem'}}>إجمالي المواعيد</h3>
              <div style={{fontSize:'2rem', fontWeight:'bold', color:'#333'}}>{filteredData().appointments.length}</div>
            </div>
            <div style={{background:'white', padding:'2rem', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
              <h3 style={{color:'#ff9800', marginBottom:'1rem'}}>الأطباء المعلقين</h3>
              <div style={{fontSize:'2rem', fontWeight:'bold', color:'#333'}}>
                {filteredData().doctors.filter(d => d.status === 'pending').length}
              </div>
            </div>
            <div style={{background:'white', padding:'2rem', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
              <h3 style={{color:'#9c27b0', marginBottom:'1rem'}}>الأطباء المميزين</h3>
              <div style={{fontSize:'2rem', fontWeight:'bold', color:'#333'}}>
                {filteredData().doctors.filter(d => d.is_featured && d.status === 'approved').length}
              </div>
            </div>
            <div style={{background:'white', padding:'2rem', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
              <h3 style={{color:'#ff6b35', marginBottom:'1rem'}}>🏥 المراكز الصحية</h3>
              <div style={{fontSize:'2rem', fontWeight:'bold', color:'#333'}}>
                {healthCenters.length}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(400px, 1fr))', gap:'1.5rem'}}>
            {/* أفضل الأطباء */}
            <div style={{background:'white', padding:'2rem', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
                <h3 style={{color:'#7c4dff', margin:0}}>🏆 أفضل الأطباء (حسب المواعيد)</h3>
                <button 
                  onClick={fetchAnalytics}
                  style={{
                    background:'#7c4dff',
                    color:'white',
                    border:'none',
                    borderRadius:8,
                    padding:'0.5rem 1rem',
                    cursor:'pointer',
                    fontSize:'0.9rem',
                    fontWeight:'bold'
                  }}
                >
                  🔄 تحديث البيانات
                </button>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                {analytics.topDoctors.slice(0, showMoreDoctors ? 10 : 5).map((doctor, index) => (
                  <div key={index} style={{
                    display:'flex', 
                    justifyContent:'space-between', 
                    alignItems:'center',
                    padding:'1rem',
                    background: index === 0 ? '#fff3e0' : '#f5f5f5',
                    borderRadius:8,
                    border: index === 0 ? '2px solid #ff9800' : '1px solid #e0e0e0'
                  }}>
                    <div>
                      <div style={{fontWeight:'bold', fontSize:'1.1rem'}}>{doctor.name}</div>
                      <div style={{color:'#666', fontSize:'0.9rem'}}>{doctor.specialty}</div>
                    </div>
                    <div style={{
                      background: index === 0 ? '#ff9800' : '#7c4dff',
                      color:'white',
                      padding:'0.5rem 1rem',
                      borderRadius:20,
                      fontWeight:'bold'
                    }}>
                      {doctor.appointments} موعد
                    </div>
                  </div>
                ))}
                {analytics.topDoctors.length > 5 && (
                  <button 
                    onClick={() => setShowMoreDoctors(!showMoreDoctors)}
                    style={{
                      background: 'transparent',
                      color: '#7c4dff',
                      border: '2px solid #7c4dff',
                      borderRadius: 8,
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      marginTop: '0.5rem'
                    }}
                  >
                    {showMoreDoctors ? 'عرض أقل' : `عرض المزيد (${analytics.topDoctors.length - 5})`}
                  </button>
                )}
              </div>
            </div>

            {/* أفضل التخصصات */}
            <div style={{background:'white', padding:'2rem', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
                <h3 style={{color:'#00bcd4', margin:0}}>📊 أفضل التخصصات</h3>
                <button 
                  onClick={fetchAnalytics}
                  style={{
                    background:'#00bcd4',
                    color:'white',
                    border:'none',
                    borderRadius:8,
                    padding:'0.5rem 1rem',
                    cursor:'pointer',
                    fontSize:'0.9rem',
                    fontWeight:'bold'
                  }}
                >
                  🔄 تحديث البيانات
                </button>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                {analytics.topSpecialties.slice(0, showMoreSpecialties ? 10 : 5).map((specialty, index) => (
                  <div key={index} style={{
                    display:'flex', 
                    justifyContent:'space-between', 
                    alignItems:'center',
                    padding:'1rem',
                    background:'#f5f5f5',
                    borderRadius:8
                  }}>
                    <div>
                      <div style={{fontWeight:'bold'}}>{specialty.specialty}</div>
                      <div style={{color:'#666', fontSize:'0.9rem'}}>{specialty.count} طبيب</div>
                    </div>
                    <div style={{
                      background:'#00bcd4',
                      color:'white',
                      padding:'0.5rem 1rem',
                      borderRadius:20,
                      fontWeight:'bold'
                    }}>
                      {specialty.appointments} موعد
                    </div>
                  </div>
                ))}
                {analytics.topSpecialties.length > 5 && (
                  <button 
                    onClick={() => setShowMoreSpecialties(!showMoreSpecialties)}
                    style={{
                      background: 'transparent',
                      color: '#00bcd4',
                      border: '2px solid #00bcd4',
                      borderRadius: 8,
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      marginTop: '0.5rem'
                    }}
                  >
                    {showMoreSpecialties ? 'عرض أقل' : `عرض المزيد (${analytics.topSpecialties.length - 5})`}
                  </button>
                )}
              </div>
            </div>

            {/* الإحصائيات الشهرية */}
            <div style={{background:'white', padding:'2rem', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', gridColumn:'span 2'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
                <h3 style={{color:'#4caf50', margin:0}}>📈 الإحصائيات الشهرية</h3>
                <button 
                  onClick={fetchAnalytics}
                  style={{
                    background:'#4caf50',
                    color:'white',
                    border:'none',
                    borderRadius:8,
                    padding:'0.5rem 1rem',
                    cursor:'pointer',
                    fontSize:'0.9rem',
                    fontWeight:'bold'
                  }}
                >
                  🔄 تحديث البيانات
                </button>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem'}}>
                {analytics.monthlyStats.map((stat, index) => (
                  <div key={index} style={{
                    padding:'1.5rem',
                    background:'#f8f9fa',
                    borderRadius:12,
                    textAlign:'center',
                    border:'2px solid #e9ecef'
                  }}>
                    <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#4caf50', marginBottom:'0.5rem'}}>
                      {stat.month}
                    </div>
                    <div style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                      <div>👥 {stat.users} مستخدم</div>
                      <div>👨‍⚕️ {stat.doctors} طبيب</div>
                      <div>📅 {stat.appointments} موعد</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div style={{background:'white', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', overflow:'hidden'}}>
            <div style={{padding:'1.5rem', borderBottom:'1px solid #e0e0e0'}}>
              <h2 style={{margin:0, color:'#333'}}>قائمة المستخدمين</h2>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead style={{background:'#f5f5f5'}}>
                  <tr>
                    <th style={{padding:'1rem', textAlign:'right', borderBottom:'1px solid #e0e0e0'}}>الاسم</th>
                    <th style={{padding:'1rem', textAlign:'right', borderBottom:'1px solid #e0e0e0'}}>البريد الإلكتروني</th>
                    <th style={{padding:'1rem', textAlign:'right', borderBottom:'1px solid #e0e0e0'}}>رقم الهاتف</th>
                    <th style={{padding:'1rem', textAlign:'right', borderBottom:'1px solid #e0e0e0'}}>تاريخ التسجيل</th>
                    <th style={{padding:'1rem', textAlign:'right', borderBottom:'1px solid #e0e0e0'}}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData().users.slice(0, showMoreUsers ? 10 : 5).map(user => (
                    <tr key={user._id || user.id}>
                      <td style={{padding:'1rem', borderBottom:'1px solid #e0e0e0'}}>{user.name || user.first_name}</td>
                      <td style={{padding:'1rem', borderBottom:'1px solid #e0e0e0'}}>{user.email}</td>
                      <td style={{padding:'1rem', borderBottom:'1px solid #e0e0e0'}}>{user.phone}</td>
                      <td style={{padding:'1rem', borderBottom:'1px solid #e0e0e0'}}>{user.created_at || user.createdAt}</td>
                      <td style={{padding:'1rem', borderBottom:'1px solid #e0e0e0'}}>
                        <span style={{
                          background: user.disabled ? '#e53935' : '#4caf50',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: 12,
                          fontSize: '0.875rem',
                          marginLeft: 8
                        }}>
                          {user.disabled ? 'معطل' : 'نشط'}
                        </span>
                        <button
                          onClick={async () => {
                            const confirmMsg = user.disabled ? 'تفعيل هذا المستخدم؟' : 'تعطيل هذا المستخدم؟';
                            if (!window.confirm(confirmMsg)) return;
                            try {
                              const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/admin/toggle-account/user/${user._id || user.id}`,
                                {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ disabled: !user.disabled })
                                });
                              if (response.ok) {
                                fetchData();
                                alert(user.disabled ? 'تم تفعيل المستخدم' : 'تم تعطيل المستخدم');
                              } else {
                                alert('فشل في تحديث حالة المستخدم');
                              }
                            } catch (err) {
                              alert('خطأ في الاتصال بالخادم');
                            }
                          }}
                          style={{
                            background: user.disabled ? '#4caf50' : '#e53935',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: 6,
                            cursor: 'pointer',
                            marginLeft: 8
                          }}
                        >
                          {user.disabled ? 'تفعيل' : 'تعطيل'}
                        </button>
                        <button
                          onClick={() => deleteUser(user._id || user.id)}
                          style={{background:'#e53935', color:'white', border:'none', padding:'0.5rem 1rem', borderRadius:6, cursor:'pointer'}}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredData().users.length > 5 && (
                <div style={{padding:'1rem', textAlign:'center'}}>
                  <button 
                    onClick={() => setShowMoreUsers(!showMoreUsers)}
                    style={{
                      background: 'transparent',
                      color: '#7c4dff',
                      border: '2px solid #7c4dff',
                      borderRadius: 8,
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {showMoreUsers ? 'عرض أقل' : `عرض المزيد (${filteredData().users.length - 5})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'doctors' && (
          <div style={{background:'white', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', overflow:'hidden'}}>
            <div style={{padding:'1.5rem', borderBottom:'1px solid #e0e0e0'}}>
              <h2 style={{margin:0, color:'#333'}}>قائمة الأطباء</h2>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead style={{background:'#f5f5f5'}}>
                  <tr>
                    <th style={{padding:'1rem', textAlign:'right', borderBottom:'1px solid #e0e0e0'}}>الاسم</th>
                    <th style={{padding:'1rem', textAlign:'right', borderBottom:'1px solid #e0e0e0'}}>البريد الإلكتروني</th>
                    <th style={{padding:'1rem', textAlign:'right', borderBottom:'1px solid #e0e0e0'}}>التخصص</th>
                    <th style={{padding:'1rem', textAlign:'right', borderBottom:'1px solid #e0e0e0'}}>الحالة</th>
                    <th style={{padding:'1rem', textAlign:'right', borderBottom:'1px solid #e0e0e0'}}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData().doctors.slice(0, showMoreDoctors ? 10 : 5).map(doctor => (
                    <tr key={doctor._id || doctor.id}>
                      <td style={{padding:'1rem', borderBottom:'1px solid #e0e0e0'}}>
                        {doctor.is_featured && <span style={{color: '#9c27b0', marginLeft: '0.5rem'}}>⭐</span>}
                        {doctor.name}
                      </td>
                      <td style={{padding:'1rem', borderBottom:'1px solid #e0e0e0'}}>{doctor.email}</td>
                      <td style={{padding:'1rem', borderBottom:'1px solid #e0e0e0'}}>{doctor.specialty}</td>
                      <td style={{padding:'1rem', borderBottom:'1px solid #e0e0e0'}}>
                        <span style={{
                          background: doctor.disabled ? '#e53935' : (doctor.status === 'approved' ? '#4caf50' : '#ff9800'),
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: 12,
                          fontSize: '0.875rem',
                          marginLeft: 8
                        }}>
                          {doctor.disabled ? 'معطل' : (doctor.status === 'approved' ? 'نشط' : 'معلق')}
                        </span>
                        {doctor.status === 'pending' && (
                          <button
                            onClick={() => approveDoctor(doctor._id || doctor.id)}
                            style={{background:'#4caf50', color:'white', border:'none', padding:'0.5rem 1rem', borderRadius:6, cursor:'pointer', marginLeft: 8}}
                          >
                            موافقة
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            const confirmMsg = doctor.disabled ? 'تفعيل هذا الطبيب؟' : 'تعطيل هذا الطبيب؟';
                            if (!window.confirm(confirmMsg)) return;
                            try {
                              const doctorId = doctor._id || doctor.id;
                              const url = `${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/admin/toggle-account/doctor/${doctorId}`;
                              console.log('Trying to toggle doctor:', doctorId, url, { disabled: !doctor.disabled });
                              const response = await fetch(url,
                                {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ disabled: !doctor.disabled })
                                });
                              const respText = await response.text();
                              let respJson = {};
                              try { respJson = JSON.parse(respText); } catch(e) {}
                              console.log('Toggle doctor response:', response.status, respJson, respText);
                              if (response.ok) {
                                fetchData();
                                alert(doctor.disabled ? 'تم تفعيل الطبيب' : 'تم تعطيل الطبيب');
                              } else {
                                alert('فشل في تحديث حالة الطبيب: ' + (respJson.error || respText || response.status));
                              }
                            } catch (err) {
                              alert('خطأ في الاتصال بالخادم: ' + err.message);
                            }
                          }}
                          style={{
                            background: doctor.disabled ? '#4caf50' : '#e53935',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: 6,
                            cursor: 'pointer',
                            marginLeft: 8
                          }}
                        >
                          {doctor.disabled ? 'تفعيل' : 'تعطيل'}
                        </button>
                        {doctor.status === 'approved' && (
                          doctor.is_featured ? (
                            <button
                              onClick={() => unfeatureDoctor(doctor._id || doctor.id)}
                              style={{background:'#ff9800', color:'white', border:'none', padding:'0.5rem 1rem', borderRadius:6, cursor:'pointer', marginLeft: 8}}
                            >
                              ⭐ إزالة من المميزين
                            </button>
                          ) : (
                            <button
                              onClick={() => featureDoctor(doctor._id || doctor.id)}
                              style={{background:'#9c27b0', color:'white', border:'none', padding:'0.5rem 1rem', borderRadius:6, cursor:'pointer', marginLeft: 8}}
                            >
                              ⭐ إضافة للمميزين
                            </button>
                          )
                        )}
                        <button
                          onClick={() => deleteDoctor(doctor._id || doctor.id)}
                          style={{background:'#e53935', color:'white', border:'none', padding:'0.5rem 1rem', borderRadius:6, cursor:'pointer'}}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredData().doctors.length > 5 && (
                <div style={{padding:'1rem', textAlign:'center'}}>
                  <button 
                    onClick={() => setShowMoreDoctors(!showMoreDoctors)}
                    style={{
                      background: 'transparent',
                      color: '#00bcd4',
                      border: '2px solid #00bcd4',
                      borderRadius: 8,
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {showMoreDoctors ? 'عرض أقل' : `عرض المزيد (${filteredData().doctors.length - 5})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <div style={{background:'white', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', overflow:'hidden'}}>
            <div style={{padding:'1.5rem', borderBottom:'1px solid #e0e0e0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h2 style={{margin:0, color:'#333'}}>🔍 مراجعة طلبات الأطباء المعلقين</h2>
              <div style={{background:'#ff9800', color:'white', padding:'0.5rem 1rem', borderRadius:8, fontSize:'0.9rem'}}>
                {doctors.filter(d => d.status === 'pending').length} طبيب معلق
              </div>
            </div>
            <div style={{overflowX:'auto'}}>
                                {filteredData().doctors.filter(d => d.status === 'pending').length === 0 ? (
                <div style={{padding:'3rem', textAlign:'center', color:'#666'}}>
                  <div style={{fontSize:'3rem', marginBottom:'1rem'}}>✅</div>
                  <h3>لا يوجد أطباء معلقين</h3>
                  <p>جميع الأطباء تمت الموافقة عليهم</p>
                </div>
              ) : (
                <div style={{padding:'1rem'}}>
                  {filteredData().doctors.filter(d => d.status === 'pending').map(doctor => (
                    <div key={doctor._id || doctor.id} style={{
                      background:'#fff8e1', 
                      borderRadius:12, 
                      padding:'1.5rem', 
                      marginBottom:'1rem',
                      border:'2px solid #ffb74d'
                    }}>
                      {/* معلومات أساسية */}
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem'}}>
                        <div>
                          <h3 style={{margin:0, color:'#e65100', fontSize:'1.2rem'}}>{doctor.name}</h3>
                          <p style={{margin:'0.5rem 0', color:'#666'}}>📧 {doctor.email}</p>
                          <p style={{margin:'0.5rem 0', color:'#666'}}>📞 {doctor.phone}</p>
                          <p style={{margin:'0.5rem 0', color:'#666'}}>🏥 {doctor.specialty}</p>
                          <p style={{margin:'0.5rem 0', color:'#666'}}>📍 {doctor.province} - {doctor.area}</p>
                          <p style={{margin:'0.5rem 0', color:'#666'}}>🏢 {doctor.clinicLocation}</p>
                          <p style={{margin:'0.5rem 0', color:'#666'}}>📅 تاريخ التسجيل: {doctor.createdAtFormatted || new Date(doctor.createdAt).toLocaleDateString('ar-EG')}</p>
                        </div>
                          <div style={{display:'flex', gap:'0.5rem'}}>
                            <button
                              onClick={() => approveDoctor(doctor._id || doctor.id)}
                              style={{
                                background:'#4caf50', 
                                color:'white', 
                                border:'none', 
                              padding:'0.8rem 1.5rem', 
                              borderRadius:8, 
                                cursor:'pointer',
                              fontWeight:'bold',
                              fontSize:'0.9rem'
                              }}
                            >
                              ✓ موافقة
                            </button>
                            <button
                              onClick={() => rejectDoctor(doctor._id || doctor.id)}
                              style={{
                                background:'#e53935', 
                                color:'white', 
                                border:'none', 
                              padding:'0.8rem 1.5rem', 
                              borderRadius:8, 
                              cursor:'pointer',
                              fontSize:'0.9rem'
                              }}
                            >
                              ✕ رفض
                            </button>
                          </div>
                      </div>

                      {/* الوثائق والصور */}
                      <div style={{borderTop:'1px solid #ffb74d', paddingTop:'1rem'}}>
                        <div style={{background:'#fff3cd', border:'1px solid #ffeaa7', borderRadius:8, padding:'1rem', marginBottom:'1rem'}}>
                          <h5 style={{margin:'0 0 0.5rem 0', color:'#856404'}}>🔒 تحذير أمني:</h5>
                          <p style={{margin:0, color:'#856404', fontSize:'0.9rem'}}>
                            هذه الوثائق تحتوي على معلومات حساسة. يرجى مراجعتها بعناية والتحقق من صحتها قبل الموافقة.
                          </p>
                        </div>
                        <h4 style={{margin:'0 0 1rem 0', color:'#e65100'}}>📋 الوثائق المطلوبة للمراجعة:</h4>
                        
                        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem'}}>
                          {/* تشخيص الوثائق */}
                          {console.log('🔍 عرض وثائق الطبيب:', doctor.name, {
                            image: doctor.image,
                            idFront: doctor.idFront,
                            idBack: doctor.idBack,
                            syndicateFront: doctor.syndicateFront,
                            syndicateBack: doctor.syndicateBack
                          })}
                          {console.log('🔗 URLs النهائية:', {
                            imageUrl: getImageUrl(doctor.image),
                            idFrontUrl: getImageUrl(doctor.idFront),
                            idBackUrl: getImageUrl(doctor.idBack),
                            syndicateFrontUrl: getImageUrl(doctor.syndicateFront),
                            syndicateBackUrl: getImageUrl(doctor.syndicateBack)
                          })}
                          
                          {/* الصورة الشخصية */}
                          {(doctor.image || doctor.profileImage || doctor.imageUrl) && (
                            <div style={{textAlign:'center'}}>
                              <h5 style={{margin:'0 0 0.5rem 0', color:'#666'}}>الصورة الشخصية</h5>
                              <img 
                                src={getImageUrl(doctor.image || doctor.profileImage || doctor.imageUrl)} 
                                alt="الصورة الشخصية" 
                                style={{
                                  width:'100px', 
                                  height:'100px', 
                                  objectFit:'cover', 
                                  borderRadius:8,
                                  border:'2px solid #ddd',
                                  cursor:'pointer',
                                  transition:'transform 0.2s'
                                }}
                                onClick={() => window.open(getImageUrl(doctor.image || doctor.profileImage || doctor.imageUrl), '_blank')}
                                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <div style={{display:'none', padding:'1rem', background:'#f5f5f5', borderRadius:8, color:'#666'}}>
                                الصورة غير متاحة
                              </div>
                              <p style={{margin:'0.5rem 0 0 0', fontSize:'0.8rem', color:'#999'}}>انقر للتكبير</p>
                            </div>
                          )}

                          {/* الهوية الوطنية - الوجه الأمامي */}
                          {(doctor.idFront || doctor.idFrontUrl) && (
                            <div style={{textAlign:'center'}}>
                              <h5 style={{margin:'0 0 0.5rem 0', color:'#666'}}>الهوية الوطنية - الوجه الأمامي</h5>
                              <p style={{margin:'0 0 0.5rem 0', fontSize:'0.8rem', color:'#999'}}>🔒 وثيقة حساسة</p>
                              <img 
                                src={getImageUrl(doctor.idFront || doctor.idFrontUrl)} 
                                alt="الهوية الوطنية - الوجه الأمامي" 
                                style={{
                                  width:'150px', 
                                  height:'100px', 
                                  objectFit:'cover', 
                                  borderRadius:8,
                                  border:'2px solid #ddd',
                                  cursor:'pointer',
                                  transition:'transform 0.2s'
                                }}
                                onClick={() => window.open(getImageUrl(doctor.idFront || doctor.idFrontUrl), '_blank')}
                                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <div style={{display:'none', padding:'1rem', background:'#f5f5f5', borderRadius:8, color:'#666'}}>
                                الوثيقة غير متاحة
                              </div>
                            </div>
                          )}

                          {/* الهوية الوطنية - الوجه الخلفي */}
                          {(doctor.idBack || doctor.idBackUrl) && (
                            <div style={{textAlign:'center'}}>
                              <h5 style={{margin:'0 0 0.5rem 0', color:'#666'}}>الهوية الوطنية - الوجه الخلفي</h5>
                              <p style={{margin:'0 0 0.5rem 0', fontSize:'0.8rem', color:'#999'}}>🔒 وثيقة حساسة</p>
                              <img 
                                src={getImageUrl(doctor.idBack || doctor.idBackUrl)} 
                                alt="الهوية الوطنية - الوجه الخلفي" 
                                style={{
                                  width:'150px', 
                                  height:'100px', 
                                  objectFit:'cover', 
                                  borderRadius:8,
                                  border:'2px solid #ddd',
                                  cursor:'pointer',
                                  transition:'transform 0.2s'
                                }}
                                onClick={() => window.open(getImageUrl(doctor.idBack || doctor.idBackUrl), '_blank')}
                                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <div style={{display:'none', padding:'1rem', background:'#f5f5f5', borderRadius:8, color:'#666'}}>
                                الوثيقة غير متاحة
                              </div>
                            </div>
                          )}

                          {/* بطاقة نقابة الأطباء - الوجه الأمامي */}
                          {(doctor.syndicateFront || doctor.syndicateFrontUrl) && (
                            <div style={{textAlign:'center'}}>
                              <h5 style={{margin:'0 0 0.5rem 0', color:'#666'}}>بطاقة نقابة الأطباء - الوجه الأمامي</h5>
                              <p style={{margin:'0 0 0.5rem 0', fontSize:'0.8rem', color:'#999'}}>🏥 وثيقة مهنية</p>
                              <img 
                                src={getImageUrl(doctor.syndicateFront || doctor.syndicateFrontUrl)} 
                                alt="بطاقة نقابة الأطباء - الوجه الأمامي" 
                                style={{
                                  width:'150px', 
                                  height:'100px', 
                                  objectFit:'cover', 
                                  borderRadius:8,
                                  border:'2px solid #ddd',
                                  cursor:'pointer',
                                  transition:'transform 0.2s'
                                }}
                                onClick={() => window.open(getImageUrl(doctor.syndicateFront || doctor.syndicateFrontUrl), '_blank')}
                                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <div style={{display:'none', padding:'1rem', background:'#f5f5f5', borderRadius:8, color:'#666'}}>
                                الوثيقة غير متاحة
                              </div>
                            </div>
                          )}

                          {/* بطاقة نقابة الأطباء - الوجه الخلفي */}
                          {(doctor.syndicateBack || doctor.syndicateBackUrl) && (
                            <div style={{textAlign:'center'}}>
                              <h5 style={{margin:'0 0 0.5rem 0', color:'#666'}}>بطاقة نقابة الأطباء - الوجه الخلفي</h5>
                              <p style={{margin:'0 0 0.5rem 0', fontSize:'0.8rem', color:'#999'}}>🏥 وثيقة مهنية</p>
                              <img 
                                src={getImageUrl(doctor.syndicateBack || doctor.syndicateBackUrl)} 
                                alt="بطاقة نقابة الأطباء - الوجه الخلفي" 
                                style={{
                                  width:'150px', 
                                  height:'100px', 
                                  objectFit:'cover', 
                                  borderRadius:8,
                                  border:'2px solid #ddd',
                                  cursor:'pointer',
                                  transition:'transform 0.2s'
                                }}
                                onClick={() => window.open(getImageUrl(doctor.syndicateBack || doctor.syndicateBackUrl), '_blank')}
                                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <div style={{display:'none', padding:'1rem', background:'#f5f5f5', borderRadius:8, color:'#666'}}>
                                الوثيقة غير متاحة
                              </div>
                            </div>
                          )}
                        </div>

                        {/* معلومات إضافية */}
                        {doctor.about && (
                          <div style={{marginTop:'1rem', padding:'1rem', background:'#f9f9f9', borderRadius:8}}>
                            <h5 style={{margin:'0 0 0.5rem 0', color:'#666'}}>📝 نبذة عن الطبيب:</h5>
                            <p style={{margin:0, color:'#333', lineHeight:'1.6'}}>{doctor.about}</p>
                          </div>
                        )}

                        {doctor.workTimes && doctor.workTimes.length > 0 && (
                          <div style={{marginTop:'1rem', padding:'1rem', background:'#f9f9f9', borderRadius:8}}>
                            <h5 style={{margin:'0 0 0.5rem 0', color:'#666'}}>🕒 أوقات الدوام:</h5>
                            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'0.5rem'}}>
                              {doctor.workTimes.map((time, index) => (
                                <div key={index} style={{padding:'0.5rem', background:'white', borderRadius:4, fontSize:'0.9rem'}}>
                                  <strong>{time.day}:</strong> {time.from} - {time.to}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {doctor.experienceYears && (
                          <div style={{marginTop:'1rem', padding:'1rem', background:'#f9f9f9', borderRadius:8}}>
                            <h5 style={{margin:'0 0 0.5rem 0', color:'#666'}}>💼 سنوات الخبرة:</h5>
                            <p style={{margin:0, color:'#333'}}>{doctor.experienceYears} سنة</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'featured' && (
          <div style={{background:'white', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', overflow:'hidden'}}>
            <div style={{padding:'1.5rem', borderBottom:'1px solid #e0e0e0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h2 style={{margin:0, color:'#333'}}>🏆 قائمة الأطباء المميزين</h2>
              <div style={{background:'#9c27b0', color:'white', padding:'0.5rem 1rem', borderRadius:8, fontSize:'0.9rem'}}>
                {filteredData().doctors.filter(d => d.is_featured && d.status === 'approved').length} طبيب مميز
              </div>
            </div>
            <div style={{overflowX:'auto'}}>
              {filteredData().doctors.filter(d => d.is_featured && d.status === 'approved').length === 0 ? (
                <div style={{padding:'3rem', textAlign:'center', color:'#666'}}>
                  <div style={{fontSize:'3rem', marginBottom:'1rem'}}>⭐</div>
                  <h3>لا يوجد أطباء مميزين</h3>
                  <p>يمكنك إضافة أطباء إلى قائمة المميزين من تبويب "الأطباء"</p>
                </div>
              ) : (
                <table style={{width:'100%', borderCollapse:'collapse'}}>
                  <thead style={{background:'#f5f5f5'}}>
                    <tr>
                      <th style={{padding:'1rem', textAlign:'right', borderBottom:'1px solid #e0e0e0'}}>الاسم</th>
                      <th style={{padding:'1rem', textAlign:'right', borderBottom:'1px solid #e0e0e0'}}>البريد الإلكتروني</th>
                      <th style={{padding:'1rem', textAlign:'right', borderBottom:'1px solid #e0e0e0'}}>التخصص</th>
                      <th style={{padding:'1rem', textAlign:'right', borderBottom:'1px solid #e0e0e0'}}>تاريخ التسجيل</th>
                      <th style={{padding:'1rem', textAlign:'right', borderBottom:'1px solid #e0e0e0'}}>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData().doctors.filter(d => d.is_featured && d.status === 'approved').map(doctor => (
                      <tr key={doctor._id || doctor.id} style={{background:'#f3e5f5'}}>
                        <td style={{padding:'1rem', borderBottom:'1px solid #e0e0e0', fontWeight:'bold'}}>
                          ⭐ {doctor.name}
                        </td>
                        <td style={{padding:'1rem', borderBottom:'1px solid #e0e0e0'}}>{doctor.email}</td>
                        <td style={{padding:'1rem', borderBottom:'1px solid #e0e0e0'}}>{doctor.specialty}</td>
                        <td style={{padding:'1rem', borderBottom:'1px solid #e0e0e0'}}>{doctor.createdAt || doctor.created_at || 'غير محدد'}</td>
                        <td style={{padding:'1rem', borderBottom:'1px solid #e0e0e0'}}>
                          <div style={{display:'flex', gap:'0.5rem'}}>
                            <button
                              onClick={() => unfeatureDoctor(doctor._id || doctor.id)}
                              style={{
                                background:'#ff9800', 
                                color:'white', 
                                border:'none', 
                                padding:'0.5rem 1rem', 
                                borderRadius:6, 
                                cursor:'pointer',
                                fontWeight:'bold'
                              }}
                            >
                              ✕ إزالة من المميزين
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'health-centers' && (
          <div style={{background:'white', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', overflow:'hidden'}}>
            <div style={{padding:'1.5rem', borderBottom:'1px solid #e0e0e0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h2 style={{margin:0, color:'#333'}}>🏥 إدارة المراكز الصحية</h2>
              <button
                onClick={() => setShowCreateCenter(true)}
                style={{
                  background:'#4caf50', 
                  color:'white', 
                  border:'none', 
                  padding:'0.8rem 1.5rem', 
                  borderRadius:8, 
                  cursor:'pointer',
                  fontWeight:'bold',
                  fontSize:'0.9rem'
                }}
              >
                ➕ إضافة مركز صحي جديد
              </button>
            </div>
            <div style={{overflowX:'auto'}}>
              {healthCenters.length === 0 ? (
                <div style={{padding:'3rem', textAlign:'center', color:'#666'}}>
                  <div style={{fontSize:'3rem', marginBottom:'1rem'}}>🏥</div>
                  <h3>لا توجد مراكز صحية مسجلة</h3>
                  <p>يمكنك إضافة مراكز صحية جديدة من خلال الزر أعلاه</p>
                </div>
              ) : (
                <div style={{padding:'1rem'}}>
                  {healthCenters.slice(0, showMoreCenters ? 10 : 5).map(center => (
                    <div key={center._id || center.id} style={{
                      background:'#f8f9fa', 
                      borderRadius:12, 
                      padding:'1.5rem', 
                      marginBottom:'1rem',
                      border:'2px solid #e9ecef'
                    }}>
                      {/* معلومات أساسية */}
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem'}}>
                        <div>
                          <h3 style={{margin:0, color:'#2c3e50', fontSize:'1.3rem'}}>
                            {center.type === 'hospital' ? '🏥' : '🏥'} {center.name}
                          </h3>
                          <p style={{margin:'0.5rem 0', color:'#666'}}>📧 {center.email}</p>
                          <p style={{margin:'0.5rem 0', color:'#666'}}>📞 {center.phone}</p>
                          <p style={{margin:'0.5rem 0', color:'#666'}}>
                            📍 {center.location?.province} - {center.location?.area}
                          </p>
                          <p style={{margin:'0.5rem 0', color:'#666'}}>
                            🏷️ النوع: {
                              center.type === 'hospital' ? 'مستشفى' :
                              center.type === 'clinic' ? 'عيادة' : 'مركز صحي'
                            }
                          </p>
                        </div>
                        <div style={{display:'flex', gap:'0.5rem'}}>
                          <button
                            onClick={() => {
                              alert(`تعديل مركز: ${center.name}`);
                            }}
                            style={{
                              background:'#007bff', 
                              color:'white', 
                              border:'none', 
                              padding:'0.6rem 1rem', 
                              borderRadius:6, 
                              cursor:'pointer',
                              fontSize:'0.85rem'
                            }}
                          >
                            ✏️ تعديل
                          </button>
                          <button
                            onClick={() => deleteHealthCenter(center._id || center.id)}
                            style={{
                              background:'#dc3545', 
                              color:'white', 
                              border:'none', 
                              padding:'0.6rem 1rem', 
                              borderRadius:6, 
                              cursor:'pointer',
                              fontSize:'0.85rem'
                            }}
                          >
                            🗑️ حذف
                          </button>
                        </div>
                      </div>

                      {/* الخدمات */}
                      {center.services && center.services.length > 0 && (
                        <div style={{marginTop:'1rem', padding:'1rem', background:'white', borderRadius:8}}>
                          <h4 style={{margin:'0 0 0.8rem 0', color:'#495057'}}>🛠️ الخدمات المتوفرة:</h4>
                          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'0.8rem'}}>
                            {center.services.map((service, index) => (
                              <div key={index} style={{
                                padding:'0.8rem', 
                                background:'#e3f2fd', 
                                borderRadius:6, 
                                border:'1px solid #bbdefb'
                              }}>
                                <div style={{fontWeight:'bold', color:'#1976d2'}}>{service.name}</div>
                                <div style={{color:'#666', fontSize:'0.9rem'}}>
                                  السعر: {service.price?.toLocaleString()} دينار
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* التخصصات */}
                      {center.specialties && center.specialties.length > 0 && (
                        <div style={{marginTop:'1rem', padding:'1rem', background:'white', borderRadius:8}}>
                          <h4 style={{margin:'0 0 0.8rem 0', color:'#495057'}}>👨‍⚕️ التخصصات:</h4>
                          <div style={{display:'flex', flexWrap:'wrap', gap:'0.5rem'}}>
                            {center.specialties.map((specialty, index) => (
                              <span key={index} style={{
                                background:'#f8f9fa',
                                color:'#495057',
                                padding:'0.4rem 0.8rem',
                                borderRadius:20,
                                fontSize:'0.85rem',
                                border:'1px solid #dee2e6'
                              }}>
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* الأطباء المرتبطين */}
                      {center.doctors && center.doctors.length > 0 && (
                        <div style={{marginTop:'1rem', padding:'1rem', background:'white', borderRadius:8}}>
                          <h4 style={{margin:'0 0 0.8rem 0', color:'#495057'}}>👨‍⚕️ الأطباء المرتبطين:</h4>
                          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'0.8rem'}}>
                            {center.doctors.map((doctor, index) => (
                              <div key={index} style={{
                                padding:'0.8rem', 
                                background:'#f3e5f5', 
                                borderRadius:6, 
                                border:'1px solid #e1bee7'
                              }}>
                                <div style={{fontWeight:'bold', color:'#7b1fa2'}}>{doctor.name}</div>
                                <div style={{color:'#666', fontSize:'0.9rem'}}>{doctor.specialty}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {healthCenters.length > 5 && (
                <div style={{padding:'1rem', textAlign:'center'}}>
                  <button 
                    onClick={() => setShowMoreCenters(!showMoreCenters)}
                    style={{
                      background: 'transparent',
                      color: '#ff6b35',
                      border: '2px solid #ff6b35',
                      borderRadius: 8,
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {showMoreCenters ? 'عرض أقل' : `عرض المزيد (${healthCenters.length - 5})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div style={{background:'white', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', overflow:'hidden'}}>
            <div style={{padding:'1.5rem', borderBottom:'1px solid #e0e0e0'}}>
              <h2 style={{margin:0, color:'#333'}}>قائمة المواعيد</h2>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead style={{background:'#f5f5f5'}}>
                  <tr>
                    <th style={{padding:'1rem', textAlign:'right', borderBottom:'1px solid #e0e0e0'}}>المريض</th>
                    <th style={{padding:'1rem', textAlign:'right', borderBottom:'1px solid #e0e0e0'}}>الطبيب</th>
                    <th style={{padding:'1rem', textAlign:'right', borderBottom:'1px solid #e0e0e0'}}>التاريخ</th>
                    <th style={{padding:'1rem', textAlign:'right', borderBottom:'1px solid #e0e0e0'}}>الوقت</th>
                    <th style={{padding:'1rem', textAlign:'right', borderBottom:'1px solid #e0e0e0'}}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData().appointments.map(appointment => (
                    <tr key={appointment._id || appointment.id}>
                      <td style={{padding:'1rem', borderBottom:'1px solid #e0e0e0'}}>{appointment.userName || appointment.user_name}</td>
                      <td style={{padding:'1rem', borderBottom:'1px solid #e0e0e0'}}>{appointment.doctorName || appointment.doctor_name}</td>
                      <td style={{padding:'1rem', borderBottom:'1px solid #e0e0e0'}}>{appointment.date}</td>
                      <td style={{padding:'1rem', borderBottom:'1px solid #e0e0e0'}}>{appointment.time}</td>
                      <td style={{padding:'1rem', borderBottom:'1px solid #e0e0e0'}}>
                        <span style={{
                          background: appointment.status === 'confirmed' ? '#4caf50'
                            : appointment.status === 'pending' ? '#ff9800'
                            : appointment.status === 'cancelled' ? '#e53935'
                            : appointment.status === 'done' ? '#1976d2'
                            : '#bdbdbd',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: 12,
                          fontSize: '0.875rem'
                        }}>
                          {appointment.status === 'confirmed' ? 'مؤكد'
                            : appointment.status === 'pending' ? 'قيد الانتظار'
                            : appointment.status === 'cancelled' ? 'ملغي'
                            : appointment.status === 'done' ? 'منجز'
                            : 'غير معروف'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div style={{background:'white', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', overflow:'hidden'}}>
            <div style={{padding:'1.5rem', borderBottom:'1px solid #e0e0e0'}}>
              <h2 style={{margin:0, color:'#333'}}>📊 التحليل والإحصائيات</h2>
            </div>
            <div style={{padding:'1.5rem'}}>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'1rem', marginBottom:'2rem'}}>
                <div style={{background:'#e3f2fd', padding:'1.5rem', borderRadius:12, textAlign:'center'}}>
                  <div style={{fontSize:'2rem', fontWeight:'bold', color:'#1976d2'}}>{users.length}</div>
                  <div style={{color:'#666'}}>إجمالي المستخدمين</div>
                </div>
                <div style={{background:'#e8f5e8', padding:'1.5rem', borderRadius:12, textAlign:'center'}}>
                  <div style={{fontSize:'2rem', fontWeight:'bold', color:'#2e7d32'}}>{doctors.length}</div>
                  <div style={{color:'#666'}}>إجمالي الأطباء</div>
                </div>
                <div style={{background:'#fff3e0', padding:'1.5rem', borderRadius:12, textAlign:'center'}}>
                  <div style={{fontSize:'2rem', fontWeight:'bold', color:'#ef6c00'}}>{appointments.length}</div>
                  <div style={{color:'#666'}}>إجمالي المواعيد</div>
                </div>
                <div style={{background:'#f3e5f5', padding:'1.5rem', borderRadius:12, textAlign:'center'}}>
                  <div style={{fontSize:'2rem', fontWeight:'bold', color:'#7b1fa2'}}>{doctors.filter(d => d.status === 'pending').length}</div>
                  <div style={{color:'#666'}}>الأطباء المعلقين</div>
                </div>
                <div style={{background:'#fff3e0', padding:'1.5rem', borderRadius:12, textAlign:'center'}}>
                  <div style={{fontSize:'2rem', fontWeight:'bold', color:'#ff6b35'}}>{healthCenters.length}</div>
                  <div style={{color:'#666'}}>المراكز الصحية</div>
                </div>
              </div>
              
              <div style={{background:'#f5f5f5', padding:'1.5rem', borderRadius:12}}>
                <h3 style={{marginBottom:'1rem', color:'#333'}}>📈 إحصائيات سريعة</h3>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem'}}>
                  <div>
                    <strong>الأطباء النشطين:</strong> {doctors.filter(d => d.status === 'approved').length}
                  </div>
                  <div>
                    <strong>الأطباء المميزين:</strong> {doctors.filter(d => d.is_featured).length}
                  </div>
                  <div>
                    <strong>المواعيد المؤكدة:</strong> {appointments.filter(a => a.status === 'confirmed').length}
                  </div>
                  <div>
                    <strong>المواعيد المعلقة:</strong> {appointments.filter(a => a.status === 'pending').length}
                  </div>
                  <div>
                    <strong>المراكز الصحية النشطة:</strong> {healthCenters.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* نموذج إنشاء مركز صحي جديد */}
        {showCreateCenter && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: '2rem',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h2 style={{ margin: 0, color: '#333' }}>🏥 إنشاء مركز صحي جديد</h2>
                <button
                  onClick={() => setShowCreateCenter(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={createHealthCenter}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                      اسم المركز *
                    </label>
                    <input
                      type="text"
                      value={newCenter.name}
                      onChange={(e) => setNewCenter({...newCenter, name: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: 8,
                        fontSize: '1rem'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                      البريد الإلكتروني *
                    </label>
                    <input
                      type="email"
                      value={newCenter.email}
                      onChange={(e) => setNewCenter({...newCenter, email: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: 8,
                        fontSize: '1rem'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                      كلمة المرور *
                    </label>
                    <input
                      type="password"
                      value={newCenter.password}
                      onChange={(e) => setNewCenter({...newCenter, password: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: 8,
                        fontSize: '1rem'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                      رقم الهاتف *
                    </label>
                    <input
                      type="tel"
                      value={newCenter.phone}
                      onChange={(e) => setNewCenter({...newCenter, phone: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: 8,
                        fontSize: '1rem'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                      نوع المركز
                    </label>
                    <select
                      value={newCenter.type}
                      onChange={(e) => setNewCenter({...newCenter, type: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: 8,
                        fontSize: '1rem'
                      }}
                    >
                      <option value="clinic">عيادة</option>
                      <option value="hospital">مستشفى</option>
                      <option value="center">مركز صحي</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                      الموقع
                    </label>
                    <input
                      type="text"
                      value={newCenter.location}
                      onChange={(e) => setNewCenter({...newCenter, location: e.target.value})}
                      placeholder="مثال: بغداد - الكاظمية"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: 8,
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                    الخدمات المقدمة
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      type="text"
                      placeholder="اسم الخدمة"
                      value={newService.name}
                      onChange={e => setNewService({ ...newService, name: e.target.value })}
                      style={{ flex: 2, padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc' }}
                    />
                    <input
                      type="number"
                      placeholder="السعر (اختياري)"
                      value={newService.price}
                      onChange={e => setNewService({ ...newService, price: e.target.value })}
                      min="0"
                      style={{ flex: 1, padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc' }}
                    />
                    <button type="button" onClick={() => {
                      if (!newService.name) return;
                      setNewCenterServices([...newCenterServices, { ...newService }]);
                      setNewService({ name: '', price: '' });
                    }} style={{ padding: '0.4rem 1rem', borderRadius: 6, border: 'none', background: '#4caf50', color: 'white', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' }}>
                      إضافة
                    </button>
                  </div>
                  <ul style={{ padding: 0, margin: 0 }}>
                    {newCenterServices.map((srv, idx) => (
                      <li key={idx} style={{ listStyle: 'none', marginBottom: 4, background: '#f8f9fa', borderRadius: 6, padding: '0.4rem 0.7rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{srv.name} {srv.price && `- ${srv.price} دينار`}</span>
                        <button type="button" onClick={() => setNewCenterServices(newCenterServices.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#e53935', fontWeight: 'bold', cursor: 'pointer' }}>حذف</button>
                      </li>
                    ))}
                    {newCenterServices.length === 0 && <li style={{ color: '#888', fontSize: '0.9rem' }}>لم يتم إضافة خدمات بعد</li>}
                  </ul>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                      التخصصات
                    </label>
                    <input
                      type="text"
                      value={newCenter.specialties}
                      onChange={(e) => setNewCenter({...newCenter, specialties: e.target.value})}
                      placeholder="مثال: طب عام، أمراض القلب، طب الأطفال"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: 8,
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  {/* حقل أوقات الدوام الجديد */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                      أوقات الدوام
                    </label>
                    <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.5rem' }}>
                      <select
                        value={doctorNewTime.day}
                        onChange={e => setDoctorNewTime({ ...doctorNewTime, day: e.target.value })}
                        style={{ padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }}
                      >
                        <option value="">اليوم</option>
                        <option value="السبت">السبت</option>
                        <option value="الأحد">الأحد</option>
                        <option value="الاثنين">الاثنين</option>
                        <option value="الثلاثاء">الثلاثاء</option>
                        <option value="الأربعاء">الأربعاء</option>
                        <option value="الخميس">الخميس</option>
                        <option value="الجمعة">الجمعة</option>
                      </select>
                      <input
                        type="time"
                        value={doctorNewTime.from}
                        onChange={e => setDoctorNewTime({ ...doctorNewTime, from: e.target.value })}
                        style={{ padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }}
                      />
                      <span style={{alignSelf:'center'}}>إلى</span>
                      <input
                        type="time"
                        value={doctorNewTime.to}
                        onChange={e => setDoctorNewTime({ ...doctorNewTime, to: e.target.value })}
                        style={{ padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!doctorNewTime.day || !doctorNewTime.from || !doctorNewTime.to) return;
                          setDoctorWorkTimes([...doctorWorkTimes, doctorNewTime]);
                          setDoctorNewTime({ day: '', from: '', to: '' });
                        }}
                        style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: 'none', background: '#4caf50', color: 'white', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' }}
                      >
                        إضافة
                      </button>
                    </div>
                    {/* عرض قائمة أوقات الدوام */}
                    <div>
                      {doctorWorkTimes.length === 0 && <div style={{color:'#888', fontSize:'0.9rem'}}>لم يتم إضافة أوقات دوام بعد</div>}
                      {doctorWorkTimes.map((t, idx) => (
                        <div key={idx} style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.2rem'}}>
                          <span style={{fontSize:'0.97rem'}}>{t.day} : {t.from} - {t.to}</span>
                          <button type="button" onClick={() => setDoctorWorkTimes(doctorWorkTimes.filter((_,i)=>i!==idx))} style={{background:'none', border:'none', color:'#e53935', fontWeight:'bold', cursor:'pointer'}}>حذف</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                    وصف المركز
                  </label>
                  <textarea
                    value={newCenter.description}
                    onChange={(e) => setNewCenter({...newCenter, description: e.target.value})}
                    placeholder="وصف مختصر عن المركز وخدماته..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      fontSize: '1rem',
                      minHeight: '100px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* قسم إضافة الأطباء */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, color: '#333' }}>👨‍⚕️ الأطباء في المركز</h3>
                    <button
                      type="button"
                      onClick={() => setShowAddDoctors(!showAddDoctors)}
                      style={{
                        background: '#2196f3',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      {showAddDoctors ? 'إخفاء' : 'إضافة طبيب'}
                    </button>
                  </div>

                  {/* قائمة الأطباء المضافة */}
                  {newCenter.doctors.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#666' }}>الأطباء المضافة:</h4>
                      {newCenter.doctors.map((doctor, index) => (
                        <div key={index} style={{
                          background: '#f8f9fa',
                          padding: '0.75rem',
                          borderRadius: 8,
                          marginBottom: '0.5rem',
                          border: '1px solid #e9ecef'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong>{doctor.name}</strong> - {doctor.specialty}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setNewCenter({
                                  ...newCenter,
                                  doctors: newCenter.doctors.filter((_, i) => i !== index)
                                });
                              }}
                              style={{
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '0.25rem 0.5rem',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* نموذج إضافة طبيب جديد */}
                  {showAddDoctors && (
                    <div style={{
                      background: '#f8f9fa',
                      padding: '1rem',
                      borderRadius: 8,
                      border: '1px solid #e9ecef'
                    }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: '#333' }}>إضافة طبيب جديد</h4>
                      <form onSubmit={addDoctorToCenter}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                              اسم الطبيب *
                            </label>
                            <input
                              type="text"
                              value={newDoctor.name}
                              onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value})}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: 8,
                                fontSize: '1rem'
                              }}
                              required
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                              التخصص *
                            </label>
                            <select
                              value={newDoctor.specialty}
                              onChange={(e) => setNewDoctor({...newDoctor, specialty: e.target.value})}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: 8,
                                fontSize: '1rem'
                              }}
                              required
                            >
                              <option value="">اختر التخصص</option>
                              <option value="طب عام">طب عام</option>
                              <option value="أمراض القلب">أمراض القلب</option>
                              <option value="طب الأطفال">طب الأطفال</option>
                              <option value="طب النساء">طب النساء</option>
                              <option value="طب العيون">طب العيون</option>
                              <option value="طب الأسنان">طب الأسنان</option>
                              <option value="جراحة عامة">جراحة عامة</option>
                              <option value="جراحة عظام">جراحة عظام</option>
                              <option value="أنف وأذن وحنجرة">أنف وأذن وحنجرة</option>
                              <option value="جلدية">جلدية</option>
                              <option value="أعصاب">أعصاب</option>
                              <option value="أورام">أورام</option>
                              <option value="أشعة">أشعة</option>
                              <option value="تخدير">تخدير</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                              البريد الإلكتروني *
                            </label>
                            <input
                              type="email"
                              value={newDoctor.email}
                              onChange={(e) => setNewDoctor({...newDoctor, email: e.target.value})}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: 8,
                                fontSize: '1rem'
                              }}
                              required
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                              رقم الهاتف
                            </label>
                            <input
                              type="tel"
                              value={newDoctor.phone}
                              onChange={(e) => setNewDoctor({...newDoctor, phone: e.target.value})}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: 8,
                                fontSize: '1rem'
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                              ساعات العمل
                            </label>
                            <input
                              type="text"
                              value={newDoctor.workingHours}
                              onChange={(e) => setNewDoctor({...newDoctor, workingHours: e.target.value})}
                              placeholder="مثال: الأحد - الخميس: 9:00 ص - 5:00 م"
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: 8,
                                fontSize: '1rem'
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                              سنوات الخبرة
                            </label>
                            <input
                              type="text"
                              value={newDoctor.experience}
                              onChange={(e) => setNewDoctor({...newDoctor, experience: e.target.value})}
                              placeholder="مثال: 10 سنوات"
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: 8,
                                fontSize: '1rem'
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                            المؤهل العلمي
                          </label>
                          <input
                            type="text"
                            value={newDoctor.education}
                            onChange={(e) => setNewDoctor({...newDoctor, education: e.target.value})}
                            placeholder="مثال: دكتوراه في الطب - جامعة بغداد"
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              border: '1px solid #ddd',
                              borderRadius: 8,
                              fontSize: '1rem'
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                            وصف مختصر
                          </label>
                          <textarea
                            value={newDoctor.description}
                            onChange={(e) => setNewDoctor({...newDoctor, description: e.target.value})}
                            placeholder="وصف مختصر عن الطبيب وخبراته..."
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              border: '1px solid #ddd',
                              borderRadius: 8,
                              fontSize: '1rem',
                              minHeight: '80px',
                              resize: 'vertical'
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            type="submit"
                            style={{
                              background: '#4caf50',
                              color: 'white',
                              border: 'none',
                              padding: '0.5rem 1rem',
                              borderRadius: 6,
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                          >
                            إضافة الطبيب
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateCenter(false)}
                    style={{
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: '#4caf50',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    إنشاء المركز
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard; 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTranslation } from 'react-i18next';

function AdminLogin() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    console.log('🔍 محاولة تسجيل دخول الأدمن:', { email, password });

    try {
      // ربط مع الخادم الحقيقي
      const response = await fetch(`${process.env.REACT_APP_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          loginType: 'admin'
        }),
      });

      console.log('📡 استجابة الخادم:', response.status);

      const data = await response.json();
      console.log('📊 بيانات الاستجابة:', data);

      if (response.ok) {
        // تسجيل دخول ناجح
        const adminUser = { 
          email, 
          user_type: 'admin', 
          name: 'مدير النظام',
          ...data.user 
        };
        
        console.log('✅ تسجيل دخول ناجح:', adminUser);
        
        localStorage.setItem('user', JSON.stringify(adminUser));
        setUser(adminUser);
        
        // إطلاق حدث لتحديث حالة المصادقة
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new Event('storage'));
        }
        
        console.log('🚀 الانتقال للوحة التحكم...');
        navigate('/admin');
      } else {
        // خطأ في تسجيل الدخول
        console.error('❌ خطأ في تسجيل الدخول:', data.error);
        setError(data.error || 'بيانات الدخول غير صحيحة');
      }
    } catch (error) {
      console.error('❌ خطأ في الاتصال بالخادم:', error);
              setError(t('error_server_connection'));
    }
  };

  return (
    <div style={{
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative'
    }}>
      {/* زر العودة */}
      <div style={{position:'absolute', top:'2rem', left:'2rem'}}>
        <button 
          onClick={() => navigate('/')} 
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.3)',
            padding: '0.75rem 1.5rem',
            borderRadius: 12,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 16,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.3)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.2)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          ← العودة للصفحة الرئيسية
        </button>
      </div>

      {/* نموذج تسجيل الدخول */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 20,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        padding: '3rem 2.5rem',
        minWidth: 380,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        {/* العنوان */}
        <div style={{textAlign: 'center', marginBottom: '2rem'}}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            🏥 لوحة الإدارة
          </div>
          <div style={{
            color: '#666',
            fontSize: '1.1rem',
            fontWeight: 500
          }}>
            تسجيل دخول مدير النظام
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* حقل البريد الإلكتروني */}
          <div style={{marginBottom: '1.5rem'}}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#333',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}>
              البريد الإلكتروني
            </label>
            <input 
              type="email" 
              placeholder="أدخل بريدك الإلكتروني" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem 1.2rem',
                borderRadius: 12,
                border: '2px solid #e0e0e0',
                fontSize: 16,
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e0e0e0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* حقل كلمة المرور */}
          <div style={{marginBottom: '2rem'}}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#333',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}>
              كلمة المرور
            </label>
            <input 
              type="password" 
              placeholder="أدخل كلمة المرور" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem 1.2rem',
                borderRadius: 12,
                border: '2px solid #e0e0e0',
                fontSize: 16,
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e0e0e0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* رسالة الخطأ */}
          {error && (
            <div style={{
              background: '#ffebee',
              color: '#c62828',
              padding: '1rem',
              borderRadius: 8,
              marginBottom: '1.5rem',
              border: '1px solid #ffcdd2',
              textAlign: 'center',
              fontWeight: 500
            }}>
              {error}
            </div>
          )}

          {/* زر تسجيل الدخول */}
          <button 
            type="submit" 
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '1.2rem',
              fontWeight: 700,
              fontSize: 18,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
            }}
          >
            🔐 تسجيل الدخول
          </button>
        </form>

        {/* معلومات إضافية */}
        {/* تم حذف قسم بيانات الدخول الافتراضية نهائيًا */}
      </div>
    </div>
  );
}

export default AdminLogin; 
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Login from './Login';
import UserSignUp from './UserSignUp';
import DoctorSignUp from './DoctorSignUp';
import UserHome from './UserHome';
import DoctorDashboard from './DoctorDashboard';
import DoctorDetails from './DoctorDetails';
import MyAppointments from './MyAppointments';
import UserProfile from './UserProfile';
import DoctorProfile from './DoctorProfile';
import DoctorAppointments from './DoctorAppointments';
import AdminDashboard from './AdminDashboard';
import AdminLogin from './AdminLogin';
import MedicineReminder from './MedicineReminder';
import HealthCenters from './HealthCenters';
import CenterLogin from './CenterLogin';
import CenterHome from './CenterHome';
import DoctorCalendar from './DoctorCalendar';
import DoctorAnalyticsPage from './DoctorAnalyticsPage';
import i18n from './i18n';

function App() {
  // حالة مركزية للمواعيد للطبيب
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  
  // استرجاع اللغة المحفوظة من localStorage أو استخدام العربية كافتراضية
  const [lang, setLang] = React.useState(() => {
    const savedLang = localStorage.getItem('selectedLanguage');
    return savedLang || 'ar';
  });

  // حفظ اللغة في localStorage وتطبيقها
  const handleLangChange = (e) => {
    const newLang = e.target.value;
    setLang(newLang);
    localStorage.setItem('selectedLanguage', newLang);
    i18n.changeLanguage(newLang);
  };

  // تطبيق اللغة المحفوظة عند تحميل التطبيق
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang]);

  // جلب المواعيد عند الدخول - معلق مؤقتاً لتجنب الأخطاء
  useEffect(() => {
    // سيتم تفعيل هذا لاحقاً عند الحاجة
    setDoctorAppointments([]);
  }, []);

  return (
    <AuthProvider>
      <Router>
        {/* قائمة اختيار اللغة أعلى كل الصفحات */}
        <div style={{position:'fixed', top:10, left:10, zIndex:10000}}>
          <select value={lang} onChange={handleLangChange} style={{
            background: 'rgba(0, 188, 212, 0.1)',
            color: '#009688',
            border: 'none',
            borderRadius: 8,
            padding: '0.3rem 0.8rem',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 188, 212, 0.2)'
          }}>
            <option value="ar">عربي</option>
            <option value="ku">کوردی</option>
            <option value="en">English</option>
          </select>
        </div>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<UserSignUp />} />
          <Route path="/signup-doctor" element={<DoctorSignUp />} />
          <Route path="/home" element={
            <ProtectedRoute requiredUserType="user">
              <UserHome />
            </ProtectedRoute>
          } />
          <Route path="/doctor-dashboard" element={
            <ProtectedRoute requiredUserType="doctor">
              <DoctorDashboard appointments={doctorAppointments} setAppointments={setDoctorAppointments} />
            </ProtectedRoute>
          } />
          <Route path="/doctor/:id" element={
            <ProtectedRoute requiredUserType="user">
              <DoctorDetails />
            </ProtectedRoute>
          } />
          <Route path="/my-appointments" element={
            <ProtectedRoute requiredUserType="user">
              <MyAppointments />
            </ProtectedRoute>
          } />
          <Route path="/medicine-reminder" element={
            <ProtectedRoute requiredUserType="user">
              <MedicineReminder />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute requiredUserType="user">
              <UserProfile />
            </ProtectedRoute>
          } />
          <Route path="/doctor-profile" element={
            <ProtectedRoute requiredUserType="doctor">
              <DoctorProfile />
            </ProtectedRoute>
          } />
          <Route path="/doctor-appointments" element={
            <ProtectedRoute requiredUserType="doctor">
              <DoctorAppointments />
            </ProtectedRoute>
          } />
          <Route path="/doctor-calendar" element={<DoctorCalendar appointments={doctorAppointments} />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedRoute requiredUserType="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/health-centers" element={
            <ProtectedRoute requiredUserType="user">
              <HealthCenters />
            </ProtectedRoute>
          } />
          <Route path="/center-login" element={<CenterLogin />} />
          <Route path="/center-home" element={<CenterHome />} />
          <Route path="/doctor-analytics" element={
            <ProtectedRoute requiredUserType="doctor">
              <DoctorAnalyticsPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
export default App;
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
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/auth/register`, {
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
      console.log('🔍 API URL:', process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com');
      
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/auth/login`, {
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
        url = `${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/doctor/${userId}`;
        key = 'doctor';
      } else {
        url = `${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/user/${userId}`;
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
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function CenterHome() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ doctors: 0, appointments: 0 });
  const [notifications, setNotifications] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // جلب بيانات المركز من localStorage
    const center = localStorage.getItem('centerProfile');
    if (center) setProfile(JSON.parse(center));
    // جلب الإحصائيات من الباكند (مثال)
    fetch(process.env.REACT_APP_API_URL + '/center/stats', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('centerToken') }
    })
      .then(res => res.json())
      .then(data => setStats(data));
    // جلب الإشعارات
    fetch(process.env.REACT_APP_API_URL + '/center/notifications', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('centerToken') }
    })
      .then(res => res.json())
      .then(data => setNotifications(data));
    // جلب الأطباء
    fetch(process.env.REACT_APP_API_URL + '/center/doctors', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('centerToken') }
    })
      .then(res => res.json())
      .then(data => setDoctors(data));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('centerToken');
    localStorage.removeItem('centerProfile');
    navigate('/center-login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(90deg, #00bcd4 0%, #7c4dff 100%)', padding: '2rem' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '2rem', maxWidth: 900, margin: '0 auto', boxShadow: '0 2px 12px #7c4dff22' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: '#333' }}>🏥 لوحة تحكم المركز/المستشفى</h2>
          <button onClick={handleLogout} style={{ background: '#ff6b35', color: 'white', border: 'none', borderRadius: 8, padding: '0.6rem 1.5rem', fontWeight: 'bold', cursor: 'pointer' }}>تسجيل الخروج</button>
        </div>
        {profile && (
          <div style={{ marginBottom: 24, color: '#555', fontWeight: 600 }}>
            <span>اسم المركز: {profile.name}</span> | <span>البريد: {profile.email}</span> | <span>الهاتف: {profile.phone}</span>
          </div>
        )}
        {/* إحصائيات */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: 32 }}>
          <div style={{ background: '#e3f2fd', borderRadius: 12, padding: '1.5rem', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 32, color: '#1976d2', marginBottom: 8 }}>👨‍⚕️</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>عدد الأطباء</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.doctors}</div>
          </div>
          <div style={{ background: '#fff3e0', borderRadius: 12, padding: '1.5rem', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 32, color: '#ff9800', marginBottom: 8 }}>📅</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>عدد الحجوزات</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.appointments}</div>
          </div>
        </div>
        {/* إشعارات */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ color: '#7c4dff', marginBottom: 12 }}>🔔 الإشعارات</h3>
          {Array.isArray(notifications) && notifications.length > 0 ? (
            notifications.map((notif, idx) => (
              <div key={idx} style={{ background: '#f3e5f5', borderRadius: 8, padding: '0.7rem 1rem', marginBottom: 8, color: '#7b1fa2' }}>{notif.message}</div>
            ))
          ) : (
            <div style={{ color: '#888' }}>{t('no_notifications')}</div>
          )}
        </div>
        {/* قائمة الأطباء */}
        <div>
          <h3 style={{ color: '#00bcd4', marginBottom: 12 }}>👨‍⚕️ قائمة الأطباء</h3>
          {Array.isArray(doctors) && doctors.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {doctors.map((doc, idx) => (
                <div key={idx} style={{ background: '#f8f9fa', borderRadius: 10, padding: '1rem', border: '1px solid #e0e0e0' }}>
                  <div style={{ fontWeight: 700, color: '#333', marginBottom: 6 }}>{doc.name}</div>
                  <div style={{ color: '#555', marginBottom: 4 }}>{doc.specialty}</div>
                  <div style={{ color: '#888', fontSize: 14 }}>📞 {doc.phone}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#888' }}>لا يوجد أطباء مرتبطين بالمركز حالياً</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CenterHome; 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { useTranslation } from 'react-i18next';

function CenterLogin() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    try {
      // طلب تسجيل الدخول (يفترض وجود endpoint مناسب)
      const res = await fetch(`${process.env.REACT_APP_API_URL}/center/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        // حفظ بيانات الجلسة (مثلاً localStorage)
        localStorage.setItem('centerToken', data.token);
        localStorage.setItem('centerProfile', JSON.stringify(data.center));
        navigate('/center-home');
      } else {
        setError('بيانات الدخول غير صحيحة أو الحساب غير مفعل');
      }
    } catch (err) {
              setError(t('error_connection'));
    }
  };

  return (
    <div className="login-container" style={{background: 'linear-gradient(90deg, #00bcd4 0%, #7c4dff 100%)', flexDirection:'column', justifyContent:'center', minHeight:'100vh'}}>
      <form className="login-box" onSubmit={handleSubmit}>
        <h2>تسجيل دخول المركز/المستشفى</h2>
        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <div className="login-error">{error}</div>}
        <button type="submit">دخول</button>
      </form>
    </div>
  );
}

export default CenterLogin; 
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Login.css';

function DoctorAnalyticsPage() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // جلب جميع المواعيد
  const fetchAllAppointments = async () => {
    const currentUser = profile || user;
    if (!currentUser?.id) {
      console.log('❌ لا يوجد معرف للمستخدم');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 جلب تحليلات الطبيب:', currentUser.id);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/appointments/doctor/${currentUser.id}`);
      const data = await response.json();
      
      console.log('✅ تم جلب المواعيد:', data.length);
      
      if (Array.isArray(data)) {
        setAppointments(data);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.error('❌ خطأ في جلب المواعيد:', err);
      setError(t('error_fetching_appointments'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAppointments();
  }, [profile?.id, user?.id]);

  // دالة التحليل
  const getAnalytics = () => {
    const appointmentsArray = Array.isArray(appointments) ? appointments : [];
    
    const analytics = {
      totalAppointments: appointmentsArray.length,
      todayAppointments: appointmentsArray.filter(apt => apt.date === new Date().toISOString().split('T')[0]).length,
      upcomingAppointments: appointmentsArray.filter(apt => new Date(apt.date) > new Date()).length,
      pastAppointments: appointmentsArray.filter(apt => new Date(apt.date) < new Date()).length,
      
      // تحليل حسب الأيام
      appointmentsByDay: {},
      appointmentsByMonth: {},
      appointmentsByTime: {},
      
      // إحصائيات إضافية
      mostBusyDay: null,
      mostBusyTime: null,
      averageAppointmentsPerDay: 0,
      totalPatients: new Set()
    };

    // تحليل حسب الأيام
    appointmentsArray.forEach(apt => {
      const date = new Date(apt.date);
      const dayKey = date.toLocaleDateString('ar-EG', { weekday: 'long' });
      const monthKey = date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
      const timeKey = apt.time;
      
      analytics.appointmentsByDay[dayKey] = (analytics.appointmentsByDay[dayKey] || 0) + 1;
      analytics.appointmentsByMonth[monthKey] = (analytics.appointmentsByMonth[monthKey] || 0) + 1;
      analytics.appointmentsByTime[timeKey] = (analytics.appointmentsByTime[timeKey] || 0) + 1;
      
      // إضافة المريض للمجموعة
      analytics.totalPatients.add(apt.userId?._id || apt.patientId?._id || apt.userName || apt.patientId?.name);
    });

    // العثور على أكثر يوم مشغول
    analytics.mostBusyDay = Object.entries(analytics.appointmentsByDay)
      .sort(([,a], [,b]) => b - a)[0];
    
    // العثور على أكثر وقت مشغول
    analytics.mostBusyTime = Object.entries(analytics.appointmentsByTime)
      .sort(([,a], [,b]) => b - a)[0];
    
    // متوسط المواعيد يومياً
    const uniqueDays = Object.keys(analytics.appointmentsByDay).length;
    analytics.averageAppointmentsPerDay = uniqueDays > 0 ? 
      (analytics.totalAppointments / uniqueDays).toFixed(1) : 0;
    
    analytics.totalPatients = analytics.totalPatients.size;
    
    return analytics;
  };

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #00bcd4 0%, #009688 100%)',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{color: '#fff', fontSize: '1.2rem'}}>{t('loading')}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #00bcd4 0%, #009688 100%)',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{color: '#fff', fontSize: '1.2rem'}}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #00bcd4 0%, #009688 100%)',
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        padding: window.innerWidth < 500 ? '0.8rem 1rem' : '1rem 2rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: window.innerWidth < 500 ? '0.5rem' : '1rem'}}>
          <button
            onClick={() => navigate('/doctor-dashboard')}
            style={{
              background: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: window.innerWidth < 500 ? 8 : 12,
              padding: window.innerWidth < 500 ? '0.6rem 1rem' : '0.8rem 1.5rem',
              fontWeight: 700,
              fontSize: window.innerWidth < 500 ? 14 : 16,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(229, 57, 53, 0.3)'
            }}
          >
            ← {t('back')}
          </button>
          <h1 style={{
            color: '#7c4dff',
            fontWeight: 800,
            fontSize: window.innerWidth < 500 ? 16 : 28,
            margin: 0
          }}>
            📊 {t('analytics_full_title')}
          </h1>
        </div>
        
        <button
          onClick={signOut}
          style={{
            background: 'linear-gradient(135deg, #ff5722 0%, #e64a19 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: window.innerWidth < 500 ? 8 : 12,
            padding: window.innerWidth < 500 ? '0.6rem 1rem' : '0.8rem 1.5rem',
            fontWeight: 700,
            fontSize: window.innerWidth < 500 ? 14 : 16,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(255, 87, 34, 0.3)'
          }}
        >
          {t('logout')}
        </button>
      </div>

      {/* Content */}
      <div style={{
        padding: window.innerWidth < 500 ? '1rem 0.8rem' : '2rem',
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        <AnalyticsView analytics={getAnalytics()} />
      </div>
    </div>
  );
}

// مكون التحليل الكامل
function AnalyticsView({ analytics }) {
  const { t } = useTranslation();
  const isMobile = window.innerWidth < 500;
  const [showMoreTimes, setShowMoreTimes] = useState(false);
  
  return (
    <div style={{display:'flex', flexDirection:'column', gap: isMobile ? '1rem' : '2rem'}}>
      {/* الإحصائيات الرئيسية */}
      <div style={{
        display:'grid', 
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: isMobile ? '0.8rem' : '1rem'
      }}>
        <div style={{
          background:'#fff', 
          borderRadius: isMobile ? 12 : 16, 
          boxShadow:'0 2px 12px #7c4dff11', 
          padding: isMobile ? '1rem 0.8rem' : '1.5rem', 
          textAlign:'center'
        }}>
          <div style={{fontSize: isMobile ? '1.5rem' : '2rem', marginBottom:'0.5rem'}}>📊</div>
          <div style={{fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight:700, color:'#7c4dff', marginBottom:'0.5rem'}}>{analytics.totalAppointments}</div>
          <div style={{color:'#666', fontSize: isMobile ? '0.9rem' : '1rem'}}>{t('total_appointments')}</div>
        </div>
        <div style={{
          background:'#fff', 
          borderRadius: isMobile ? 12 : 16, 
          boxShadow:'0 2px 12px #7c4dff11', 
          padding: isMobile ? '1rem 0.8rem' : '1.5rem', 
          textAlign:'center'
        }}>
          <div style={{fontSize: isMobile ? '1.5rem' : '2rem', marginBottom:'0.5rem'}}>👥</div>
          <div style={{fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight:700, color:'#4caf50', marginBottom:'0.5rem'}}>{analytics.totalPatients}</div>
          <div style={{color:'#666', fontSize: isMobile ? '0.9rem' : '1rem'}}>{t('total_patients')}</div>
        </div>
        <div style={{
          background:'#fff', 
          borderRadius: isMobile ? 12 : 16, 
          boxShadow:'0 2px 12px #7c4dff11', 
          padding: isMobile ? '1rem 0.8rem' : '1.5rem', 
          textAlign:'center'
        }}>
          <div style={{fontSize: isMobile ? '1.5rem' : '2rem', marginBottom:'0.5rem'}}>📈</div>
          <div style={{fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight:700, color:'#ff9800', marginBottom:'0.5rem'}}>{analytics.averageAppointmentsPerDay}</div>
          <div style={{color:'#666', fontSize: isMobile ? '0.9rem' : '1rem'}}>{t('average_appointments_per_day')}</div>
        </div>
        <div style={{
          background:'#fff', 
          borderRadius: isMobile ? 12 : 16, 
          boxShadow:'0 2px 12px #7c4dff11', 
          padding: isMobile ? '1rem 0.8rem' : '1.5rem', 
          textAlign:'center'
        }}>
          <div style={{fontSize: isMobile ? '1.5rem' : '2rem', marginBottom:'0.5rem'}}>🔥</div>
          <div style={{fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight:700, color:'#e53935', marginBottom:'0.5rem'}}>{analytics.mostBusyDay?.[1] || 0}</div>
          <div style={{color:'#666', fontSize: isMobile ? '0.9rem' : '1rem'}}>{t('most_busy_day')}</div>
        </div>
      </div>

      {/* تحليل الأيام */}
      <div style={{
        background:'#fff', 
        borderRadius: isMobile ? 12 : 16, 
        boxShadow:'0 2px 12px #7c4dff11', 
        padding: isMobile ? '1rem 0.8rem' : '1.5rem'
      }}>
        <h3 style={{
          color:'#7c4dff', 
          marginBottom: isMobile ? '0.8rem' : '1rem', 
          textAlign:'center',
          fontSize: isMobile ? '1.1rem' : '1.3rem'
        }}>{t('appointments_by_day')}</h3>
        
        {/* جدول منظم للأيام */}
        <div style={{
          display: 'table',
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '1rem'
        }}>
          <div style={{
            display: 'table-header-group',
            background: '#f8f9fa',
            fontWeight: 700,
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>
            <div style={{
              display: 'table-row'
            }}>
              <div style={{
                display: 'table-cell',
                padding: isMobile ? '0.6rem 0.4rem' : '0.8rem 1rem',
                borderBottom: '2px solid #dee2e6',
                textAlign: 'center',
                color: '#7c4dff'
              }}>
                {t('day')}
              </div>
              <div style={{
                display: 'table-cell',
                padding: isMobile ? '0.6rem 0.4rem' : '0.8rem 1rem',
                borderBottom: '2px solid #dee2e6',
                textAlign: 'center',
                color: '#7c4dff'
              }}>
                {t('appointments_count')}
              </div>
              <div style={{
                display: 'table-cell',
                padding: isMobile ? '0.6rem 0.4rem' : '0.8rem 1rem',
                borderBottom: '2px solid #dee2e6',
                textAlign: 'center',
                color: '#7c4dff'
              }}>
                {t('status')}
              </div>
            </div>
          </div>
          
          <div style={{display: 'table-row-group'}}>
            {Object.entries(analytics.appointmentsByDay)
              .sort(([,a], [,b]) => b - a) // ترتيب تنازلي
              .map(([day, count], index) => (
                <div key={day} style={{
                  display: 'table-row',
                  background: index % 2 === 0 ? '#fff' : '#f8f9fa',
                  borderBottom: '1px solid #dee2e6'
                }}>
                  <div style={{
                    display: 'table-cell',
                    padding: isMobile ? '0.6rem 0.4rem' : '0.8rem 1rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}>
                    {day}
                  </div>
                  <div style={{
                    display: 'table-cell',
                    padding: isMobile ? '0.6rem 0.4rem' : '0.8rem 1rem',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: isMobile ? '1.1rem' : '1.2rem',
                    color: '#7c4dff'
                  }}>
                    {count}
                  </div>
                  <div style={{
                    display: 'table-cell',
                    padding: isMobile ? '0.6rem 0.4rem' : '0.8rem 1rem',
                    textAlign: 'center'
                  }}>
                    {day === analytics.mostBusyDay?.[0] ? (
                      <span style={{
                        background: '#7c4dff',
                        color: '#fff',
                        padding: isMobile ? '0.2rem 0.5rem' : '0.3rem 0.8rem',
                        borderRadius: isMobile ? 8 : 12,
                        fontSize: isMobile ? '0.7rem' : '0.8rem',
                        fontWeight: 600
                      }}>
                        🔥 {t('most_busy')}
                      </span>
                    ) : (
                      <span style={{
                        color: '#6c757d',
                        fontSize: isMobile ? '0.7rem' : '0.8rem'
                      }}>
                        -
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* تحليل الأوقات */}
      <div style={{
        background:'#fff', 
        borderRadius: isMobile ? 12 : 16, 
        boxShadow:'0 2px 12px #7c4dff11', 
        padding: isMobile ? '1rem 0.8rem' : '1.5rem'
      }}>
        <h3 style={{
          color:'#7c4dff', 
          marginBottom: isMobile ? '0.8rem' : '1rem', 
          textAlign:'center',
          fontSize: isMobile ? '1.1rem' : '1.3rem'
        }}>{t('appointments_by_time')}</h3>
        
        {/* جدول منظم للأوقات */}
        <div style={{
          display: 'table',
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '1rem'
        }}>
          <div style={{
            display: 'table-header-group',
            background: '#f8f9fa',
            fontWeight: 700,
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>
            <div style={{
              display: 'table-row'
            }}>
              <div style={{
                display: 'table-cell',
                padding: isMobile ? '0.6rem 0.4rem' : '0.8rem 1rem',
                borderBottom: '2px solid #dee2e6',
                textAlign: 'center',
                color: '#4caf50'
              }}>
                {t('time')}
              </div>
              <div style={{
                display: 'table-cell',
                padding: isMobile ? '0.6rem 0.4rem' : '0.8rem 1rem',
                borderBottom: '2px solid #dee2e6',
                textAlign: 'center',
                color: '#4caf50'
              }}>
                {t('appointments_count')}
              </div>
              <div style={{
                display: 'table-cell',
                padding: isMobile ? '0.6rem 0.4rem' : '0.8rem 1rem',
                borderBottom: '2px solid #dee2e6',
                textAlign: 'center',
                color: '#4caf50'
              }}>
                {t('status')}
              </div>
            </div>
          </div>
          
          <div style={{display: 'table-row-group'}}>
            {Object.entries(analytics.appointmentsByTime)
              .sort(([,a], [,b]) => b - a) // ترتيب تنازلي
              .slice(0, showMoreTimes ? 10 : 5) // عرض 5 أو 10 حسب الحالة
              .map(([time, count], index) => (
                <div key={time} style={{
                  display: 'table-row',
                  background: index % 2 === 0 ? '#fff' : '#f8f9fa',
                  borderBottom: '1px solid #dee2e6'
                }}>
                  <div style={{
                    display: 'table-cell',
                    padding: isMobile ? '0.6rem 0.4rem' : '0.8rem 1rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}>
                    {time}
                  </div>
                  <div style={{
                    display: 'table-cell',
                    padding: isMobile ? '0.6rem 0.4rem' : '0.8rem 1rem',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: isMobile ? '1.1rem' : '1.2rem',
                    color: '#4caf50'
                  }}>
                    {count}
                  </div>
                  <div style={{
                    display: 'table-cell',
                    padding: isMobile ? '0.6rem 0.4rem' : '0.8rem 1rem',
                    textAlign: 'center'
                  }}>
                    {time === analytics.mostBusyTime?.[0] ? (
                      <span style={{
                        background: '#4caf50',
                        color: '#fff',
                        padding: isMobile ? '0.2rem 0.5rem' : '0.3rem 0.8rem',
                        borderRadius: isMobile ? 8 : 12,
                        fontSize: isMobile ? '0.7rem' : '0.8rem',
                        fontWeight: 600
                      }}>
                        🔥 {t('most_requested')}
                      </span>
                    ) : (
                      <span style={{
                        color: '#6c757d',
                        fontSize: isMobile ? '0.7rem' : '0.8rem'
                      }}>
                        -
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
        
        {/* زر عرض المزيد للأوقات */}
        {Object.entries(analytics.appointmentsByTime).length > 5 && (
          <div style={{
            textAlign: 'center',
            marginTop: '1rem'
          }}>
            <button
              onClick={() => setShowMoreTimes(!showMoreTimes)}
              style={{
                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: isMobile ? 8 : 12,
                padding: isMobile ? '0.6rem 1.2rem' : '0.8rem 1.5rem',
                fontWeight: 600,
                fontSize: isMobile ? '0.9rem' : '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
              }}
            >
              {showMoreTimes ? t('show_less') : t('show_more')} ({Object.entries(analytics.appointmentsByTime).length - 5} {t('more')})
            </button>
          </div>
        )}
      </div>



      {/* تحليل الأشهر */}
      <div style={{
        background:'#fff', 
        borderRadius: isMobile ? 12 : 16, 
        boxShadow:'0 2px 12px #7c4dff11', 
        padding: isMobile ? '1rem 0.8rem' : '1.5rem'
      }}>
        <h3 style={{
          color:'#7c4dff', 
          marginBottom: isMobile ? '0.8rem' : '1rem', 
          textAlign:'center',
          fontSize: isMobile ? '1.1rem' : '1.3rem'
        }}>{t('appointments_by_month')}</h3>
        <div style={{
          display:'grid', 
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: isMobile ? '0.8rem' : '1rem'
        }}>
          {Object.entries(analytics.appointmentsByMonth).map(([month, count]) => (
            <div key={month} style={{
              background:'#f5f5f5',
              padding: isMobile ? '0.8rem 0.6rem' : '1rem',
              borderRadius: isMobile ? 6 : 8,
              textAlign:'center'
            }}>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.1rem', 
                fontWeight:700, 
                marginBottom:'0.5rem'
              }}>{month}</div>
              <div style={{
                fontSize: isMobile ? '1.2rem' : '1.3rem', 
                fontWeight:700, 
                color:'#7c4dff'
              }}>{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DoctorAnalyticsPage; 
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Context for sharing special appointments between components
const SpecialAppointmentsContext = React.createContext();

// دالة توحيد رقم الهاتف العراقي
function normalizePhone(phone) {
  if (!phone) return '';
  phone = phone.replace(/\D/g, '');
  if (phone.startsWith('0')) {
    return '+964' + phone.slice(1);
  }
  if (phone.startsWith('964')) {
    return '+964' + phone.slice(3);
  }
  if (phone.startsWith('7')) {
    return '+964' + phone;
  }
  if (phone.startsWith('+964')) {
    return '+964' + phone.slice(4);
  }
  return phone;
}

function DoctorAppointments() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPastAppointments, setShowPastAppointments] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, today, upcoming, past
  const [sortBy, setSortBy] = useState('date'); // date, time, name
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  // --- Modal confirmation state ---
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [showAddToSpecial, setShowAddToSpecial] = useState(false);
  const [selectedAppointmentForSpecial, setSelectedAppointmentForSpecial] = useState(null);

  const { t } = useTranslation();

  useEffect(() => {
    if (!profile?.id) {
      setError(t('login_required'));
      setLoading(false);
      return;
    }

    fetchDoctorAppointments();
    
    // تحديث البيانات كل 30 ثانية
    const interval = setInterval(fetchDoctorAppointments, 30000);
    
    return () => clearInterval(interval);
  }, [profile]);

  const fetchDoctorAppointments = async () => {
    try {
      console.log('🔍 جلب مواعيد الطبيب:', profile.id);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/appointments/doctor/${profile.id}`);
      if (res.ok) {
        const data = await res.json();
        console.log('✅ تم جلب مواعيد الطبيب:', data.length);
        console.log('🔍 بيانات المواعيد:', data);
        
        // إزالة التكرار بشكل أكثر دقة
        const uniqueMap = new Map();
        data.forEach(appointment => {
          const key = appointment._id;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, appointment);
          }
        });
        
        const uniqueAppointments = Array.from(uniqueMap.values());
        console.log('✅ المواعيد بعد إزالة التكرار:', uniqueAppointments.length);
        
        setAppointments(uniqueAppointments);
      } else {
        console.log('❌ خطأ في جلب مواعيد الطبيب:', res.status);
        setError(t('fetch_appointments_fail'));
      }
    } catch (err) {
      console.error('❌ خطأ في جلب مواعيد الطبيب:', err);
      setError(t('fetch_appointments_error'));
    }
    setLoading(false);
  };

  const cleanDuplicateAppointments = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/clean-duplicate-appointments`, {
        method: 'POST'
      });
      
      if (res.ok) {
        const result = await res.json();
        alert(`${t('appointments_cleared_success')}\n${t('duplicates_deleted')}: ${result.duplicatesDeleted}`);
        // إعادة جلب المواعيد بعد التنظيف
        fetchDoctorAppointments();
      } else {
        alert(t('appointments_cleared_fail'));
      }
    } catch (err) {
      alert(t('appointments_cleared_error'));
    }
  };

  const exportToCSV = () => {
    const headers = [t('appointment_number'), t('patient_name'), t('patient_phone'), t('date'), t('time'), t('reason'), t('status')];
    const csvData = displayedAppointments.map((apt, index) => [
      index + 1,
      apt.userName || apt.userId?.first_name || t('not_specified'),
      apt.userId?.phone || t('not_specified'),
      apt.date,
      apt.time,
      apt.reason || t('not_specified'),
      getStatusText(getAppointmentStatus(apt.date))
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${t('appointments_clinic_file')}_${new Date().toLocaleDateString('ar-EG')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const addToSpecialAppointments = (appointment) => {
    setSelectedAppointmentForSpecial(appointment);
    setShowAddToSpecial(true);
  };

  const handleAddToSpecial = async (specialAppointmentData) => {
    // تجهيز بيانات الموعد الخاص
    const normalizedPhone = normalizePhone(selectedAppointmentForSpecial.userId?.phone || '');
    const newSpecialAppointment = {
      doctorId: profile?._id,
      userName: selectedAppointmentForSpecial.userName || selectedAppointmentForSpecial.userId?.first_name || t('patient'),
      patientPhone: normalizedPhone,
      date: specialAppointmentData.date,
      time: specialAppointmentData.time,
      duration: specialAppointmentData.duration,
      priority: specialAppointmentData.priority,
      status: specialAppointmentData.status,
      reason: selectedAppointmentForSpecial.reason || specialAppointmentData.reason,
      notes: specialAppointmentData.notes,
      type: 'special_appointment'
    };
    // أرسل الموعد للباكند
    await fetch(`${process.env.REACT_APP_API_URL}/add-special-appointment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSpecialAppointment)
    });
    // أرسل إشعار للمريض
    await fetch(`${process.env.REACT_APP_API_URL}/send-special-appointment-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientPhone: normalizedPhone,
        patientName: newSpecialAppointment.userName,
        newDate: newSpecialAppointment.date,
        newTime: newSpecialAppointment.time,
        doctorName: profile?.name || t('doctor'),
        reason: newSpecialAppointment.reason,
        notes: newSpecialAppointment.notes
      })
    });
    // أعد تحميل قائمة المواعيد الخاصة (أو كل المواعيد)
    fetchDoctorAppointments();
    alert(t('patient_added_to_special_appointments_success'));
    setShowAddToSpecial(false);
    setSelectedAppointmentForSpecial(null);
  };

  const sendNotificationToPatient = async (phone, notificationData) => {
    try {

      
      // إرسال إشعار موعد خاص
      const res = await fetch(`${process.env.REACT_APP_API_URL}/send-special-appointment-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientPhone: phone,
          patientName: selectedAppointmentForSpecial.userName || selectedAppointmentForSpecial.userId?.first_name || t('patient'),
          originalAppointmentId: selectedAppointmentForSpecial._id,
          newDate: notificationData.appointmentData.date,
          newTime: notificationData.appointmentData.time,
          doctorName: profile?.name || t('doctor'),
          reason: selectedAppointmentForSpecial.reason || notificationData.appointmentData.reason,
          notes: notificationData.appointmentData.notes
        })
      });
      
      if (res.ok) {
        const result = await res.json();

        
        // إظهار رسالة تأكيد للمستخدم
        alert(`${t('notification_sent_to_patient')}: ${phone}`);
      } else {

      }
    } catch (err) {
      
      // لا نوقف العملية إذا فشل الإشعار
    }
  };

  // دالة تنسيق التاريخ بالكردية
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const weekdays = t('weekdays', { returnObjects: true }) || ['شەممە', 'یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی'];
    const months = t('months', { returnObjects: true }) || [
      'کانونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران',
      'تەمموز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانونی یەکەم'
    ];
    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${weekday}، ${day}ی ${month} ${year}`;
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

  // تصنيف المواعيد
  const pastAppointments = appointments.filter(apt => isPastAppointment(apt.date));
  const todayAppointments = appointments.filter(apt => isTodayAppointment(apt.date));
  const upcomingAppointments = appointments.filter(apt => isUpcomingAppointment(apt.date));

  // تصفية المواعيد حسب البحث والحالة
  const filterAppointments = (appointments) => {
    let filtered = appointments;
    
    // تصفية حسب البحث
    if (searchTerm) {
      filtered = filtered.filter(apt => 
        (apt.userName && apt.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (apt.userId?.first_name && apt.userId.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (apt.userId?.phone && apt.userId.phone.includes(searchTerm)) ||
        (apt.reason && apt.reason.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // تصفية حسب الحالة
    if (filterStatus !== 'all') {
      filtered = filtered.filter(apt => getAppointmentStatus(apt.date) === filterStatus);
    }
    
    return filtered;
  };

  // ترتيب المواعيد
  const sortAppointments = (appointments) => {
    return appointments.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case 'time':
          comparison = a.time.localeCompare(b.time);
          break;
        case 'name':
          const nameA = (a.userName || a.userId?.first_name || '').toLowerCase();
          const nameB = (b.userName || b.userId?.first_name || '').toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        default:
          comparison = new Date(a.date) - new Date(b.date);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  // تجميع جميع المواعيد المراد عرضها مع إزالة التكرار
  const allAppointments = showPastAppointments 
    ? [...todayAppointments, ...upcomingAppointments, ...pastAppointments]
    : [...todayAppointments, ...upcomingAppointments];

  // إزالة التكرار من المواعيد المعروضة
  const uniqueAllAppointments = allAppointments.filter((appointment, index, self) => 
    index === self.findIndex(a => a._id === appointment._id)
  );

  // تطبيق التصفية والترتيب
  const displayedAppointments = sortAppointments(filterAppointments(uniqueAllAppointments));

  if (loading) return <div style={{textAlign:'center', marginTop:40}}>{t('loading')}</div>;
  if (error) return <div style={{textAlign:'center', marginTop:40, color:'#e53935'}}>{error}</div>;

  return (
    <div className="print-section" style={{maxWidth:800, margin:'2rem auto', padding:'0 1rem'}}>
      {/* Header */}
      <div style={{background:'#fff', borderRadius:18, boxShadow:'0 2px 16px #7c4dff22', padding:'2rem', marginBottom:'2rem'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:'1rem'}}>
          <h1 style={{color:'#7c4dff', margin:0, fontSize:'2rem', fontWeight:900}}>{t('clinic_appointments')}</h1>
          <div className="no-print" style={{display:'flex', gap:'1rem', flexWrap:'wrap'}}>
            <button 
              style={{
                background: '#7c4dff',
                color: '#fff',
                border:'none',
                borderRadius:8,
                padding:'0.7rem 1.5rem',
                fontWeight:700,
                cursor:'pointer'
              }}
            >
              📋 {t('displayed_appointments')}
            </button>

            <button 
              onClick={() => navigate('/doctor-dashboard')}
              style={{background:'#00bcd4', color:'#fff', border:'none', borderRadius:8, padding:'0.7rem 1.5rem', fontWeight:700, cursor:'pointer'}}
            >
              {t('back_to_dashboard')}
            </button>
            <button 
              onClick={() => navigate('/doctor-dashboard')}
              style={{background:'#4caf50', color:'#fff', border:'none', borderRadius:8, padding:'0.7rem 1.5rem', fontWeight:700, cursor:'pointer'}}
            >
              🏠 {t('back_to_home')}
            </button>
            <button 
              onClick={() => window.print()}
              style={{background:'#009688', color:'#fff', border:'none', borderRadius:8, padding:'0.7rem 1.5rem', fontWeight:700, cursor:'pointer'}}
            >
              {t('print_appointments')}
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
          <div style={{fontSize:'2rem', marginBottom:'0.5rem'}}>📋</div>
          <div style={{fontSize:'1.5rem', fontWeight:700, color:'#7c4dff', marginBottom:'0.5rem'}}>{displayedAppointments.length}</div>
          <div style={{color:'#666'}}>{t('displayed_appointments')}</div>
        </div>
      </div>

      {/* Search and Filter Tools */}
      <div className="no-print" style={{background:'#fff', borderRadius:16, boxShadow:'0 2px 12px #7c4dff11', padding:'1.5rem', marginBottom:'2rem'}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'1rem', alignItems:'end'}}>
          {/* Search */}
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#7c4dff', fontWeight:700}}>
              🔍 {t('search')}
            </label>
            <input
              type="text"
              placeholder={t('search') + t('patient_name') + t('patient_phone') + t('reason')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:16,
                transition:'border-color 0.3s'
              }}
            />
          </div>
          
          {/* Status Filter */}
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#7c4dff', fontWeight:700}}>
              📊 {t('filter_by_status')}
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:16,
                backgroundColor:'#fff'
              }}
            >
              <option value="all">{t('displayed_appointments')}</option>
              <option value="today">{t('today_appointments')}</option>
              <option value="upcoming">{t('upcoming_appointments')}</option>
              <option value="past">{t('past_appointments')}</option>
            </select>
          </div>
          
          {/* Sort By */}
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#7c4dff', fontWeight:700}}>
              🔄 {t('sort_by')}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:16,
                backgroundColor:'#fff'
              }}
            >
              <option value="date">{t('date')}</option>
              <option value="time">{t('time')}</option>
              <option value="name">{t('name')}</option>
            </select>
          </div>
          
          {/* Sort Order */}
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#7c4dff', fontWeight:700}}>
              📈 {t('sort_order')}
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:16,
                backgroundColor:'#fff'
              }}
            >
              <option value="asc">{t('ascending')}</option>
              <option value="desc">{t('descending')}</option>
            </select>
          </div>
        </div>
        
        {/* Clear Filters Button */}
        {(searchTerm || filterStatus !== 'all' || sortBy !== 'date' || sortOrder !== 'asc') && (
          <div style={{marginTop:'1rem', textAlign:'center'}}>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setSortBy('date');
                setSortOrder('asc');
              }}
              style={{
                background:'#e53935',
                color:'#fff',
                border:'none',
                borderRadius:8,
                padding:'0.7rem 1.5rem',
                fontWeight:700,
                cursor:'pointer',
                fontSize:14
              }}
            >
              🗑️ {t('clear_filters')}
            </button>
          </div>
        )}
      </div>

      {/* Appointments List */}
      {displayedAppointments.length === 0 ? (
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
            onClick={() => navigate('/doctor-dashboard')}
            style={{background:'#7c4dff', color:'#fff', border:'none', borderRadius:8, padding:'1rem 2rem', fontWeight:700, cursor:'pointer'}}
          >
            {t('back_to_dashboard')}
          </button>
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
          {displayedAppointments.length > 0 && (
            <div style={{background:'#fff', borderRadius:16, boxShadow:'0 2px 12px #7c4dff11', padding:'1rem', textAlign:'center'}}>
              <span style={{color:'#7c4dff', fontWeight:700, fontSize:'1.1rem'}}>
                📋 {t('displayed_appointments')} {displayedAppointments.length}
              </span>
            </div>
          )}
          
          {displayedAppointments.map((appointment, index) => {
            const status = getAppointmentStatus(appointment.date);
            const statusColor = getStatusColor(status);
            const statusText = getStatusText(status);
            const statusIcon = getStatusIcon(status);
            
            return (
              <div key={appointment._id} style={{
                background:'#fff',
                borderRadius:16,
                boxShadow:'0 2px 12px #7c4dff11',
                padding:'1.5rem',
                borderLeft: `4px solid ${statusColor}`,
                opacity: status === 'past' ? 0.8 : 1,
                position:'relative'
              }}>
                {/* Appointment Number */}
                <div style={{
                  position:'absolute',
                  top:'-10px',
                  right:'-10px',
                  background: statusColor,
                  color:'#fff',
                  borderRadius:'50%',
                  width:'30px',
                  height:'30px',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  fontWeight:700,
                  fontSize:'0.9rem',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  {index + 1}
                </div>
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
                    </div>
                    <h3 style={{color:'#7c4dff', margin:'0 0 0.5rem 0', fontSize:'1.3rem'}}>
                      👤 {appointment.patientId?.name || appointment.userName || appointment.userId?.first_name || t('patient')}
                    </h3>
                    <div style={{color:'#666', marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'0.5rem'}}>
                      <span>📅</span>
                      <span>{formatDate(appointment.date)}</span>
                      <span style={{background:'#f0f0f0', padding:'0.2rem 0.5rem', borderRadius:4, fontSize:'0.8rem'}}>
                        {new Date(appointment.date).toLocaleDateString('ar-EG', { weekday: 'short' })}
                      </span>
                    </div>
                    <div style={{color:'#666', marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'0.5rem'}}>
                      <span>🕐</span>
                      <span style={{fontWeight:700, color:'#7c4dff'}}>{appointment.time}</span>
                    </div>
                    {appointment.reason && (
                      <div style={{color:'#666', fontSize:'0.9rem'}}>
                        💬 {appointment.reason}
                      </div>
                    )}
                    {/* عرض رقم الهاتف */}
                    {(appointment.patientId?.phone || appointment.patientPhone || (/^\+?\d{10,}$/.test(appointment.notes)) || appointment.userId?.phone) && (
                      <div style={{color:'#666', fontSize:'0.9rem'}}>
                        📞 {appointment.patientId?.phone || appointment.patientPhone || (/^\+?\d{10,}$/.test(appointment.notes) ? appointment.notes : appointment.userId?.phone)}
                      </div>
                    )}
                  </div>
                  <div className="no-print" style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
                    {/* زر إضافة للمواعيد الخاصة */}
                    <button 
                      onClick={() => addToSpecialAppointments(appointment)}
                      style={{
                        background:'#ff5722',
                        color:'#fff',
                        border:'none',
                        borderRadius:8,
                        padding:'0.5rem 1rem',
                        fontWeight:700,
                        cursor:'pointer',
                        fontSize:'0.9rem',
                        display:'flex',
                        alignItems:'center',
                        gap:'0.3rem'
                      }}
                    >
                      ⭐ {t('add_to_special_appointments')}
                    </button>
                    
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
                        onClick={() => navigate('/doctor-dashboard')}
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
                        {t('manage_appointments')}
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

      {/* نافذة إضافة للمواعيد الخاصة */}
      {showAddToSpecial && selectedAppointmentForSpecial && (
        <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.18)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000}}>
          <div style={{background:'#fff', borderRadius:20, boxShadow:'0 8px 32px rgba(0,0,0,0.2)', padding:'2.5rem 2rem', minWidth:450, maxWidth:600, maxHeight:'90vh', overflowY:'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
              <h3 style={{color:'#ff5722', fontWeight:800, fontSize:24, margin:0, display:'flex', alignItems:'center', gap:'0.5rem'}}>
                ⭐ {t('add_to_special_appointments')}
              </h3>
              <button 
                onClick={() => {setShowAddToSpecial(false); setSelectedAppointmentForSpecial(null);}}
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
                إغلاق
              </button>
            </div>
            
            <AddToSpecialForm 
              appointment={selectedAppointmentForSpecial}
              onSubmit={handleAddToSpecial}
              onClose={() => {setShowAddToSpecial(false); setSelectedAppointmentForSpecial(null);}}
            />
          </div>
        </div>
      )}
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

// مكون إضافة للمواعيد الخاصة
function AddToSpecialForm({ appointment, onSubmit, onClose }) {
  const { t } = useTranslation();
  const getToday = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    date: getToday(),
    time: '09:00',
    duration: '30',
    priority: 'normal',
    status: 'confirmed',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      // خطأ في إضافة الموعد الخاص
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
      {/* معلومات المريض الحالية */}
      <div style={{background:'#f8f9fa', borderRadius:12, padding:'1.5rem'}}>
        <h4 style={{color:'#ff5722', marginBottom:'1rem', fontWeight:700, display:'flex', alignItems:'center', gap:'0.5rem'}}>
          👤 {t('patient_info')}
        </h4>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem'}}>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>
              {t('patient_name')}
            </label>
            <input
              type="text"
              value={appointment.userName || appointment.userId?.first_name || t('patient')}
              disabled
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:14,
                backgroundColor:'#f5f5f5',
                color:'#666'
              }}
            />
          </div>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>
              {t('patient_phone')}
            </label>
            <input
              type="tel"
              value={appointment.userId?.phone || t('not_available')}
              disabled
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:14,
                backgroundColor:'#f5f5f5',
                color:'#666'
              }}
            />
          </div>
        </div>
        {appointment.reason && (
          <div style={{marginTop:'1rem'}}>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>
              {t('original_visit_reason')}
            </label>
            <textarea
              value={appointment.reason}
              disabled
              rows={2}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:14,
                backgroundColor:'#f5f5f5',
                color:'#666',
                resize:'none'
              }}
            />
          </div>
        )}
      </div>

      {/* تفاصيل الموعد الخاص */}
      <div style={{background:'#f8f9fa', borderRadius:12, padding:'1.5rem'}}>
        <h4 style={{color:'#ff5722', marginBottom:'1rem', fontWeight:700, display:'flex', alignItems:'center', gap:'0.5rem'}}>
          ⭐ {t('special_appointment_details')}
        </h4>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'1rem'}}>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>
              {t('new_date')} *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              min={getToday()}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:14
              }}
              required
            />
          </div>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>
              {t('new_time')} *
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:14
              }}
              required
            />
          </div>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>
              {t('appointment_duration')}
            </label>
            <select
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:14,
                backgroundColor:'#fff'
              }}
            >
              <option value="15">{t('appointment_duration_15_minutes')}</option>
              <option value="30">{t('appointment_duration_30_minutes')}</option>
              <option value="45">{t('appointment_duration_45_minutes')}</option>
              <option value="60">{t('appointment_duration_60_minutes')}</option>
            </select>
          </div>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>
              {t('priority')}
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              style={{
                width:'100%',
                padding:'0.8rem',
                borderRadius:8,
                border:'2px solid #e0e0e0',
                fontSize:14,
                backgroundColor:'#fff'
              }}
            >
              <option value="normal">{t('normal_priority')}</option>
              <option value="urgent">{t('urgent_priority')}</option>
              <option value="follow_up">{t('follow_up_priority')}</option>
            </select>
          </div>
        </div>
        <div style={{marginTop:'1rem'}}>
          <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>
            {t('special_appointment_notes')}
          </label>
          <textarea
            placeholder={t('additional_notes_or_instructions') + t('special_appointment_notes')}
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            style={{
              width:'100%',
              padding:'0.8rem',
              borderRadius:8,
              border:'2px solid #e0e0e0',
              fontSize:14,
              resize:'vertical',
              fontFamily:'inherit'
            }}
          />
        </div>
      </div>

      {/* أزرار التحكم */}
      <div style={{display:'flex', gap:'1rem', justifyContent:'flex-end', marginTop:'1rem'}}>
        <button
          type="button"
          onClick={onClose}
          style={{
            background:'#f5f5f5',
            color:'#666',
            border:'none',
            borderRadius:8,
            padding:'0.8rem 1.5rem',
            fontWeight:700,
            fontSize:14,
            cursor:'pointer',
            transition:'all 0.3s ease'
          }}
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? '#ccc' : '#ff5722',
            color:'#fff',
            border:'none',
            borderRadius:8,
            padding:'0.8rem 1.5rem',
            fontWeight:700,
            fontSize:14,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition:'all 0.3s ease'
          }}
        >
          {loading ? t('adding_to_special_appointments') : t('add_to_special_appointments')}
        </button>
      </div>
    </form>
  );
}

export default DoctorAppointments;

// إضافة أنماط الطباعة
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .print-section, .print-section * {
      visibility: visible;
    }
    .print-section {
      position: absolute;
      left: 0;
      top: 0;
    }
    button, .no-print {
      display: none !important;
    }
  }
`;

// إضافة أنماط الطباعة للصفحة
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = printStyles;
  document.head.appendChild(style);
} 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTranslation } from 'react-i18next';

function getToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function DoctorCalendar({ appointments, year, month, daysArr, selectedDate, setSelectedDate, formatDate, dayAppointments }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // إذا لم يتم تمرير القيم كمُدخلات، استخرجها من الكود القديم (للاستخدام المستقل)
  const [internalSelectedDate, setInternalSelectedDate] = useState(getToday());
  const [internalYear, setInternalYear] = useState(new Date().getFullYear());
  const [internalMonth, setInternalMonth] = useState(new Date().getMonth());

  // إذا لم يتم تمرير props استخدم القيم الداخلية
  const _selectedDate = selectedDate || internalSelectedDate;
  const _setSelectedDate = setSelectedDate || setInternalSelectedDate;
  const _year = year !== undefined ? year : internalYear;
  const _month = month !== undefined ? month : internalMonth;
  const _daysArr = daysArr || Array.from({length: new Date(_year, _month + 1, 0).getDate()}, (_,i)=>i+1);
  const _appointments = appointments || [];
  const weekdays = t('weekdays', { returnObjects: true }) || ['شەممە', 'یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی'];
  const months = t('months', { returnObjects: true }) || [
    'کانونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران',
    'تەمموز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانونی یەکەم'
  ];
  const _formatDate = formatDate || ((dateString) => {
    const date = new Date(dateString);
    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${weekday}، ${day}ی ${month} ${year}`;
  });
  const _dayAppointments = dayAppointments || _appointments.filter(a => {
    const aDate = new Date(a.date).toISOString().slice(0,10);
    return aDate === _selectedDate;
  });

  return (
    <div style={{background:'#f7fafd', minHeight:'100vh', padding:'2rem 0'}}>
      <div style={{maxWidth:450, margin:'0 auto', background:'#fff', borderRadius:20, boxShadow:'0 8px 32px rgba(0,0,0,0.08)', padding:'2.5rem 2rem', textAlign:'center'}}>
        <h3 style={{color:'#7c4dff', marginBottom:24, fontWeight:800, fontSize:22}}>
          📅 {t('my_calendar')}
        </h3>
        {/* معلومات الشهر */}
        <div style={{background:'linear-gradient(135deg, #7c4dff 0%, #00bcd4 100%)', color:'#fff', borderRadius:12, padding:'1rem', marginBottom:20, fontWeight:700, fontSize:16}}>
          {new Date(_year, _month).toLocaleDateString('ku', { month: 'long', year: 'numeric' })}
        </div>
        {/* أيام الأسبوع */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4, marginBottom:12}}>
          {(t('weekdays', { returnObjects: true }) || ['شەممە', 'یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی']).map(day => (
            <div key={day} style={{textAlign:'center', fontWeight:700, color:'#7c4dff', fontSize:12, padding:'0.5rem'}}>
              {day}
            </div>
          ))}
        </div>
        {/* التقويم */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4, marginBottom:20}}>
          {_daysArr.map(day => {
            const dateStr = `${_year}-${String(_month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const isToday = dateStr === getToday();
            const hasAppointment = _appointments.some(a => {
              const aDate = new Date(a.date).toISOString().slice(0,10);
              return aDate === dateStr;
            });
            const isSelected = _selectedDate === dateStr;
            let buttonStyle = {
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            };
            if (isToday) {
              buttonStyle = {
                ...buttonStyle,
                background: 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(255, 152, 0, 0.4)',
                transform: 'scale(1.1)'
              };
            } else if (isSelected) {
              buttonStyle = {
                ...buttonStyle,
                background: 'linear-gradient(135deg, #00bcd4 0%, #009688 100%)',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(0, 188, 212, 0.4)'
              };
            } else if (hasAppointment) {
              buttonStyle = {
                ...buttonStyle,
                background: 'linear-gradient(135deg, #7c4dff 0%, #673ab7 100%)',
                color: '#fff',
                boxShadow: '0 2px 6px rgba(124, 77, 255, 0.3)'
              };
            } else {
              buttonStyle = {
                ...buttonStyle,
                background: '#f5f5f5',
                color: '#666',
                border: '1px solid #e0e0e0'
              };
            }
            return (
              <button 
                key={day} 
                onClick={() => _setSelectedDate(dateStr)}
                style={buttonStyle}
              >
                {day}
              </button>
            );
          })}
        </div>
        {/* شرح الألوان */}
        <div style={{display:'flex', justifyContent:'center', gap:16, marginBottom:20, flexWrap:'wrap'}}>
          <div style={{display:'flex', alignItems:'center', gap:6, fontSize:12}}>
            <div style={{width:12, height:12, borderRadius:'50%', background:'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)'}}></div>
            <span>{t('calendar_today')}</span>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:6, fontSize:12}}>
            <div style={{width:12, height:12, borderRadius:'50%', background:'linear-gradient(135deg, #7c4dff 0%, #673ab7 100%)'}}></div>
            <span>{t('calendar_has_appointments')}</span>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:6, fontSize:12}}>
            <div style={{width:12, height:12, borderRadius:'50%', background:'linear-gradient(135deg, #00bcd4 0%, #009688 100%)'}}></div>
            <span>{t('calendar_selected')}</span>
          </div>
        </div>
        {/* مواعيد اليوم المحدد */}
        <div style={{background:'#f8f9fa', borderRadius:12, padding:'1.5rem', marginBottom:20}}>
          <div style={{fontWeight:700, color:'#7c4dff', marginBottom:12, fontSize:16}}>
            📅 {t('appointments_for_date', { date: _formatDate(_selectedDate) })}
          </div>
          {_dayAppointments.length === 0 ? (
            <div style={{color:'#888', fontStyle:'italic'}}>{t('no_appointments')}</div>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              {_dayAppointments.map(a => (
                <div key={a._id} style={{
                  background:'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
                  borderRadius:8,
                  padding:'0.8rem 1rem',
                  color:'#333',
                  fontWeight:600,
                  borderLeft:'4px solid #7c4dff'
                }}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                      <div style={{color:'#7c4dff', fontWeight:700}}>🕐 {a.time}</div>
                      <div>👤 {a.userId?.first_name || a.userName}</div>
                      {a.userId?.phone && <div style={{fontSize:12, color:'#666'}}>📞 {a.userId.phone}</div>}
                    </div>
                    <span style={{
                      background:'#7c4dff',
                      color:'#fff',
                      padding:'0.2rem 0.6rem',
                      borderRadius:12,
                      fontSize:11,
                      fontWeight:700
                    }}>
                      {a.status || t('confirmed')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default DoctorCalendar; 
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
      return (process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com') + img;
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
  console.log('🔍 جميع المواعيد:', appointmentsArray.map(a => ({ 
    date: a.date, 
    time: a.time, 
    patientName: a.patientId?.name, 
    patientPhone: a.patientId?.phone,
    patientEmail: a.patientId?.email 
  })));
  
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
                        👤 {appointment.patientId?.name || appointment.userId?.first_name || appointment.userName || t('patient_name')}
                      </div>
                      {/* عرض رقم الهاتف */}
                      {(appointment.patientId?.phone || appointment.patientPhone || (/^\+?\d{10,}$/.test(appointment.notes))) && (
                        <div style={{fontSize: window.innerWidth < 500 ? '0.78rem' : '0.85rem', color:'#888', marginTop:1}}>
                          📞 {appointment.patientId?.phone || appointment.patientPhone || appointment.notes}
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
            <div style={{display:'flex', alignItems:'center', width:'100%', maxWidth:'100%'}}>
              <span style={{background:'#e0f7fa', color:'#009688', borderRadius:'7px 0 0 7px', padding:'0.7rem 0.7rem', fontWeight:700, fontSize:'1.08rem', border:'1.5px solid #e0e0e0', borderRight:'none'}}>+964</span>
              <input
                type="tel"
                placeholder={t('enter_patient_phone')}
                value={formData.patientPhone}
                onChange={e => handlePhoneChange(e.target.value)}
                style={{
                  flex:1,
                  padding:'0.7rem',
                  borderRadius:'0 7px 7px 0',
                  border:'1.5px solid #e0e0e0',
                  borderLeft:'none',
                  fontSize:14
                }}
                required
              />
            </div>
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

      // توحيد رقم الهاتف العراقي
      const normalizedPhone = normalizePhone(formData.patientPhone);
      console.log('🔍 الرقم الأصلي:', formData.patientPhone);
      console.log('🔍 الرقم الموحد:', normalizedPhone);
      
      // تحديث البيانات بالرقم الموحد
      const updatedFormData = {
        ...formData,
        patientPhone: normalizedPhone
      };

      // إرسال إشعار للمريض عن التعديل
      await sendNotificationToPatient(updatedFormData, 'update');

      await onSubmit(updatedFormData);
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
            <div style={{display:'flex', alignItems:'center', width:'100%', maxWidth:'100%'}}>
              <span style={{background:'#e0f7fa', color:'#009688', borderRadius:'7px 0 0 7px', padding:'0.7rem 0.7rem', fontWeight:700, fontSize:'1.08rem', border:'1.5px solid #e0e0e0', borderRight:'none'}}>+964</span>
              <input
                type="tel"
                placeholder="7xxxxxxxxx (بدون صفر في البداية)"
                value={formData.patientPhone}
                              onChange={e => {
                let value = e.target.value.replace(/\D/g, '');
                // توحيد الرقم العراقي
                let normalizedPhone = normalizePhone(value);
                // إزالة +964 من العرض في الحقل
                let displayPhone = normalizedPhone.replace('+964', '');
                if (displayPhone.startsWith('0')) {
                  displayPhone = displayPhone.substring(1);
                }
                handleInputChange('patientPhone', displayPhone);
              }}
                style={{
                  flex:1,
                  padding:'0.7rem',
                  borderRadius:'0 7px 7px 0',
                  border:'1.5px solid #e0e0e0',
                  borderLeft:'none',
                  fontSize:14
                }}
                required
              />
            </div>
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
      return (process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com') + img;
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
    fetch(`${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/doctors`)
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
      console.log('🔍 fetchBookedAppointments - doctorId:', doctorId);
      console.log('🔍 fetchBookedAppointments - date:', date);
      
      if (!userId) {
        console.log('❌ لا يوجد مستخدم مسجل');
        setBookedTimes([]);
        return;
      }
      
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/appointments/${doctorId}/${date}?patientId=${userId}`);
      console.log('🔍 fetchBookedAppointments - response status:', res.status);
      
      if (res.ok) {
        const appointments = await res.json();
        console.log('🔍 fetchBookedAppointments - appointments:', appointments);
        const bookedTimeSlots = appointments.map(apt => apt.time);
        console.log('🔍 fetchBookedAppointments - bookedTimeSlots:', bookedTimeSlots);
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
    
    console.log('🔍 useEffect - selectedDate:', selectedDate);
    console.log('🔍 useEffect - dayName:', dayName);
    console.log('🔍 useEffect - doctor.workTimes:', doctor.workTimes);
    console.log('🔍 useEffect - times:', times);
    
    // تقسيم كل فترة زمنية إلى مواعيد منفصلة
    const allSlots = [];
    times.forEach(wt => {
      if (wt.from && wt.to) {
        const slots = generateTimeSlots(wt.from, wt.to);
        allSlots.push(...slots);
      }
    });
    
    console.log('🔍 useEffect - allSlots:', allSlots);
    setAvailableTimes(allSlots);
    setSelectedTime('');
    
    // جلب المواعيد المحجوزة لهذا اليوم
    const dateString = selectedDate.toISOString().slice(0,10);
    console.log('🔍 useEffect - dateString:', dateString);
    console.log('🔍 useEffect - doctor._id:', doctor._id);
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
      const authCheck = await fetch(`${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/check-auth`, {
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
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      const data = await res.json();
      
      if (res.ok) {
        // إنشاء إشعار للطبيب
        try {
          await fetch(`${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/notifications`, {
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
        // تحديث الأوقات المحجوزة مباشرة بعد الحجز
        const dateString = formatDate(selectedDate);
        fetchBookedAppointments(doctor._id, dateString);
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
              {/* شرح الرموز */}
              <div style={{
                background: '#f8f9fa', 
                borderRadius: 8, 
                padding: '0.8rem', 
                marginBottom: 12,
                border: '1px solid #e9ecef',
                fontSize: 13,
                color: '#666'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4}}>
                  <div style={{
                    width: 16, 
                    height: 16, 
                    background: '#f0f0f0', 
                    borderRadius: 4,
                    border: '1px solid #ddd'
                  }}></div>
                  <span>متاح للحجز</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <div style={{
                    width: 16, 
                    height: 16, 
                    background: '#ffebee', 
                    borderRadius: 4,
                    border: '2px solid #f44336',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      background: '#f44336',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 12,
                      height: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 8,
                      fontWeight: 700
                    }}>✕</div>
                  </div>
                  <span style={{color: '#d32f2f'}}>محجوز</span>
                </div>
              </div>
              <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                {availableTimes.map((time, idx) => {
                  const isBooked = bookedTimes.includes(time);
                  console.log(`🔍 Time ${time}: isBooked = ${isBooked}`);
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isBooked}
                      onClick={()=>!isBooked && setSelectedTime(time)}
                      style={{
                        background: isBooked ? '#ffebee' : (selectedTime === time ? '#7c4dff' : '#f0f0f0'),
                        color: isBooked ? '#d32f2f' : (selectedTime === time ? '#fff' : '#333'),
                        border: isBooked ? '2px solid #f44336' : 'none',
                        borderRadius:12, 
                        padding:'0.8rem 1.2rem', 
                        fontWeight: isBooked ? 600 : 700, 
                        fontSize:14, 
                        cursor: isBooked ? 'not-allowed' : 'pointer', 
                        boxShadow: selectedTime === time ? '0 2px 8px #7c4dff44' : (isBooked ? '0 2px 4px #f4433622' : '0 1px 4px #00000022'),
                        transition:'all 0.2s ease', 
                        minWidth:80, 
                        textAlign:'center',
                        opacity: isBooked ? 0.8 : 1,
                        position: 'relative',
                        filter: isBooked ? 'none' : 'none'
                      }}
                      title={isBooked ? 'هذا الوقت محجوز' : 'اضغط لاختيار هذا الوقت'}
                    >
                      {time} 
                      {isBooked && (
                        <div style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          background: '#f44336',
                          color: '#fff',
                          borderRadius: '50%',
                          width: 20,
                          height: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 700
                        }}>
                          ✕
                        </div>
                      )}
                      {isBooked && <div style={{fontSize: '10px', color: '#d32f2f', fontWeight: 600, marginTop: 2}}>محجوز</div>}
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
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const provinces = [
  'بغداد', 'البصرة', 'نينوى', 'أربيل', 'النجف', 'كركوك', 'السليمانية', 'دهوك', 'ذي قار', 'صلاح الدين', 'الأنبار', 'واسط', 'ميسان', 'بابل', 'القادسية', 'ديالى', 'المثنى', 'كربلاء', 'حلبجة'
];

const specialties = [
  'جراحة عامة', 'جراحة عظام', 'طب الأطفال', 'طب العيون', 'طب الأسنان', 'أمراض القلب', 'جلدية', 'نسائية وتوليد', 'أنف وأذن وحنجرة', 'باطنية', 'أعصاب', 'أورام', 'أشعة', 'تخدير', 'طب الأسرة', 'طب الطوارئ', 'طب نفسي', 'طب الكلى', 'طب الروماتيزم', 'طب المسالك البولية', 'أخرى'
];

function DoctorProfile({ onClose, edit: editProp = false, modal = false }) {
  const { profile, updateProfile, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    province: '',
    area: '',
    clinicLocation: '',
    about: '',
    profileImage: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [edit, setEdit] = useState(editProp || false);

  // دالة مساعدة لمسار صورة الطبيب
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

  // جلب بيانات الطبيب من الباكند
  const fetchDoctorData = async () => {
    try {
      const currentUser = profile || user;
      if (!currentUser?.id) {
        console.log('❌ لا يوجد معرف للمستخدم');
        return;
      }

      console.log('🔍 جلب بيانات الطبيب:', currentUser.id);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/doctor/${currentUser.id}`);
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ تم جلب بيانات الطبيب:', data.doctor);
        
        if (data.doctor) {
          setForm({
            name: data.doctor.name || '',
            email: data.doctor.email || '',
            phone: data.doctor.phone || '',
            specialty: data.doctor.specialty || data.doctor.specialization || '',
            province: data.doctor.province || '',
            area: data.doctor.area || '',
            clinicLocation: data.doctor.clinicLocation || '',
            about: data.doctor.about || data.doctor.bio || '',
            profileImage: data.doctor.profileImage || data.doctor.image || ''
          });
          setImageLoadError(false);
        }
      } else {
        console.log('❌ خطأ في جلب بيانات الطبيب:', res.status);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب بيانات الطبيب:', error);
    }
  };

  // تحديث النموذج عند تغيير البيانات الشخصية
  useEffect(() => {
    // إذا تم تمرير editProp، استخدمه. وإلا اترك الحالة الحالية
    if (editProp !== undefined) {
      setEdit(editProp);
    }
  }, [editProp]);

  useEffect(() => {
    // جلب البيانات من الباكند أولاً
    fetchDoctorData();
    
    // إذا لم تنجح عملية الجلب، استخدم البيانات المحلية
    if (profile) {
      console.log('🔍 profile data:', profile);
      console.log('🔍 profile.image:', profile.image);
      console.log('🔍 profile.profileImage:', profile.profileImage);
      setForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        specialty: profile.specialty || '',
        province: profile.province || '',
        area: profile.area || '',
        clinicLocation: profile.clinicLocation || '',
        about: profile.about || '',
        profileImage: profile.profileImage || profile.image || ''
      });
      setImageLoadError(false);
    } else if (user) {
      // إذا لم يكن هناك profile، استخدم user
      console.log('🔍 user data:', user);
      console.log('🔍 user.image:', user.image);
      console.log('🔍 user.profileImage:', user.profileImage);
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        specialty: user.specialty || '',
        province: user.province || '',
        area: user.area || '',
        clinicLocation: user.clinicLocation || '',
        about: user.about || '',
        profileImage: user.profileImage || user.image || ''
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
      return;
    }
    
    setError('');
    setMsg('');
    setLoading(true);
    
    if (!form.name || !form.email || !form.phone || !form.specialty) {
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
          // تحديث حقل image بدلاً من profileImage للتوافق مع تسجيل الحساب
          updatedForm.image = uploadData.imageUrl;
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
      name: currentData?.name || '',
      email: currentData?.email || '',
      phone: currentData?.phone || '',
      specialty: currentData?.specialty || '',
      province: currentData?.province || '',
      area: currentData?.area || '',
      clinicLocation: currentData?.clinicLocation || '',
      about: currentData?.about || '',
      profileImage: currentData?.profileImage || currentData?.image || ''
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
      const res = await fetch(`${process.env.REACT_APP_API_URL}/doctor-password/${profile?._id || user?._id}`, {
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
            onClick={() => navigate('/doctor-dashboard')}
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
            العودة للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: modal ? undefined : '100vh',
      background: modal ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: modal ? 0 : '2rem 1rem',
      position: 'relative'
    }}>
      {/* زر إغلاق في الزاوية العلوية اليمنى */}
      {onClose && (
        <button onClick={onClose} style={{position:'absolute', top:18, right:18, background:'none', border:'none', color:'#e53935', fontSize:26, fontWeight:900, cursor:'pointer', zIndex:10}}>&times;</button>
      )}
      {/* زر العودة للوحة التحكم عندما تكون صفحة مستقلة */}
      {!modal && (
        <button onClick={() => navigate('/doctor-dashboard')} style={{
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
          ← {t('back_to_dashboard')}
        </button>
      )}
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
                  console.log('✅ تم تحميل الصورة بنجاح');
                  setImageLoadError(false);
                }}
              />
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>👨‍⚕️</span>
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
          <h2 style={{margin: 0, fontWeight: 900, fontSize: 24}}>{t('doctor_profile_title')}</h2>
          <p style={{margin: '0.5rem 0 0', opacity: 0.9}}>{t('edit_doctor_account_data')}</p>
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
                  name="name" 
                  value={form.name} 
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

              {/* التخصص */}
              <div style={{marginBottom: 20}}>
                <label style={{
                  display: 'block',
                  color: '#7c4dff',
                  fontWeight: 700,
                  marginBottom: 8,
                  fontSize: 14
                }}>
                  {t('specialty')} *
                </label>
                <select 
                  name="specialty" 
                  value={form.specialty} 
                  onChange={handleChange} 
                  disabled={!edit}
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    padding: '0.8rem 1rem',
                    border: edit ? '2px solid #7c4dff' : '2px solid #e0e0e0',
                    fontSize: 16,
                    transition: 'all 0.3s ease',
                    background: edit ? '#fff' : '#f8f9fa',
                    cursor: edit ? 'pointer' : 'not-allowed'
                  }}
                >
                  <option value="">{t('choose_specialty')}</option>
                  {specialties.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              {/* المحافظة */}
              <div style={{marginBottom: 20}}>
                <label style={{
                  display: 'block',
                  color: '#7c4dff',
                  fontWeight: 700,
                  marginBottom: 8,
                  fontSize: 14
                }}>
                  {t('province')}
                </label>
                <select 
                  name="province" 
                  value={form.province} 
                  onChange={handleChange} 
                  disabled={!edit}
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    padding: '0.8rem 1rem',
                    border: edit ? '2px solid #7c4dff' : '2px solid #e0e0e0',
                    fontSize: 16,
                    transition: 'all 0.3s ease',
                    background: edit ? '#fff' : '#f8f9fa',
                    cursor: edit ? 'pointer' : 'not-allowed'
                  }}
                >
                  <option value="">{t('choose_province')}</option>
                  {provinces.map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              {/* المنطقة */}
              <div style={{marginBottom: 20}}>
                <label style={{
                  display: 'block',
                  color: '#7c4dff',
                  fontWeight: 700,
                  marginBottom: 8,
                  fontSize: 14
                }}>
                  {t('area')}
                </label>
                <input 
                  type="text" 
                  name="area" 
                  value={form.area} 
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
                  placeholder={t('enter_area')}
                />
        </div>
        </div>

            {/* موقع العيادة */}
            <div style={{marginBottom: 20}}>
              <label style={{
                display: 'block',
                color: '#7c4dff',
                fontWeight: 700,
                marginBottom: 8,
                fontSize: 14
              }}>
                {t('clinic_location')}
              </label>
              <input 
                type="text" 
                name="clinicLocation" 
                value={form.clinicLocation} 
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
                placeholder={t('enter_clinic_address')}
              />
        </div>

            {/* عن الطبيب */}
            <div style={{marginBottom: 20}}>
              <label style={{
                display: 'block',
                color: '#7c4dff',
                fontWeight: 700,
                marginBottom: 8,
                fontSize: 14
              }}>
                {t('about_doctor')}
              </label>
              <textarea 
                name="about" 
                value={form.about} 
                onChange={handleChange} 
                disabled={!edit}
                rows={4}
                style={{
                  width: '100%',
                  borderRadius: 12,
                  padding: '0.8rem 1rem',
                  border: edit ? '2px solid #7c4dff' : '2px solid #e0e0e0',
                  fontSize: 16,
                  transition: 'all 0.3s ease',
                  background: edit ? '#fff' : '#f8f9fa',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                placeholder={t('write_brief_about_experience')}
              />
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
                      boxShadow: loading ? 'none' : '0 4px 15px rgba(0, 188, 212, 0.3)'
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

      {/* نافذة تغيير كلمة المرور */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: '2rem',
            maxWidth: 400,
            width: '90vw',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowPasswordModal(false)}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'none',
                border: 'none',
                color: '#e53935',
                fontSize: 24,
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              &times;
            </button>
            
            <h3 style={{
              color: '#7c4dff',
              marginBottom: 20,
              fontWeight: 700,
              fontSize: 20,
              textAlign: 'center'
            }}>
              🔒 تغيير كلمة المرور
            </h3>

            <form onSubmit={handlePasswordChange}>
              <div style={{marginBottom: 16}}>
                <label style={{
                  display: 'block',
                  color: '#7c4dff',
                  fontWeight: 700,
                  marginBottom: 8,
                  fontSize: 14
                }}>
                  كلمة المرور الجديدة *
                </label>
                <input 
                  type="password" 
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    padding: '0.8rem 1rem',
                    border: '2px solid #7c4dff',
                    fontSize: 16,
                    transition: 'all 0.3s ease'
                  }}
                  placeholder="أدخل كلمة المرور الجديدة"
                  required
                />
              </div>

              <div style={{marginBottom: 20}}>
                <label style={{
                  display: 'block',
                  color: '#7c4dff',
                  fontWeight: 700,
                  marginBottom: 8,
                  fontSize: 14
                }}>
                  تأكيد كلمة المرور *
                </label>
                <input 
                  type="password" 
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    padding: '0.8rem 1rem',
                    border: '2px solid #7c4dff',
                    fontSize: 16,
                    transition: 'all 0.3s ease'
                  }}
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                  required
                />
              </div>

              <div style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center'
              }}>
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
                    transition: 'all 0.3s ease'
                  }}
                >
                  {loading ? '⏳ جاري التغيير...' : '💾 تغيير كلمة المرور'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowPasswordModal(false)}
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
                  ❌ إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorProfile; 
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
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTranslation } from 'react-i18next';

function HealthCenters() {
  const { t } = useTranslation();
  const [healthCenters, setHealthCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchHealthCenters();
  }, []);

  const fetchHealthCenters = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/health-centers`);
      if (response.ok) {
        const data = await response.json();
        setHealthCenters(data);
      } else {
        // بيانات تجريبية في حالة فشل الاتصال
        setHealthCenters([
          {
            _id: 1,
            name: 'مركز الحياة الطبي',
            type: 'clinic',
            location: 'بغداد - الكاظمية',
            services: 'استشارات طبية، فحوصات مخبرية، أشعة سينية',
            specialties: 'طب عام، أمراض القلب، طب الأطفال',
            workingHours: 'الأحد - الخميس: 8:00 ص - 6:00 م',
            description: 'مركز طبي متكامل يقدم خدمات صحية عالية الجودة',
            phone: '+964 750 123 4567',
            email: 'info@lifeclinic.com',
            rating: 4.5,
            reviews: 128,
            logo: '🏥',
            doctors: [
              {
                _id: 'doc1',
                name: 'د. محمد حسن',
                specialty: 'طب عام',
                experience: '15 سنة',
                education: 'دكتوراه في الطب - جامعة بغداد',
                workingHours: 'الأحد - الخميس: 9:00 ص - 5:00 م',
                description: 'طبيب عام ذو خبرة واسعة في تشخيص وعلاج الأمراض العامة',
                phone: '+964 750 123 4568',
                email: 'dr.mohamed@lifeclinic.com'
              },
              {
                _id: 'doc2',
                name: 'د. سارة أحمد',
                specialty: 'أمراض القلب',
                experience: '12 سنة',
                education: 'دكتوراه في أمراض القلب - جامعة البصرة',
                workingHours: 'الأحد - الأربعاء: 10:00 ص - 4:00 م',
                description: 'اختصاصية في أمراض القلب والشرايين مع خبرة في القسطرة القلبية',
                phone: '+964 750 123 4569',
                email: 'dr.sara@lifeclinic.com'
              },
              {
                _id: 'doc3',
                name: 'د. علي محمود',
                specialty: 'طب الأطفال',
                experience: '8 سنوات',
                education: 'دكتوراه في طب الأطفال - جامعة الموصل',
                workingHours: 'الأحد - الخميس: 8:00 ص - 3:00 م',
                description: 'طبيب أطفال متخصص في رعاية الأطفال من الولادة حتى 18 سنة',
                phone: '+964 750 123 4570',
                email: 'dr.ali@lifeclinic.com'
              }
            ]
          },
          {
            _id: 2,
            name: 'مستشفى الأمل التخصصي',
            type: 'hospital',
            location: 'بغداد - المنصور',
            services: 'جراحة عامة، عناية مركزة، طوارئ 24/7',
            specialties: 'جراحة القلب، طب الأعصاب، طب العيون',
            workingHours: '24/7',
            description: 'مستشفى تخصصي متقدم يقدم رعاية صحية شاملة',
            phone: '+964 750 123 4568',
            email: 'info@hopehospital.com',
            rating: 4.8,
            reviews: 256,
            logo: '🏥',
            doctors: [
              {
                _id: 'doc4',
                name: 'د. أحمد علي',
                specialty: 'جراحة القلب',
                experience: '20 سنة',
                education: 'دكتوراه في جراحة القلب - جامعة القاهرة',
                workingHours: 'الأحد - الخميس: 8:00 ص - 6:00 م',
                description: 'جراح قلب متخصص في جراحات القلب المفتوح والقسطرة',
                phone: '+964 750 123 4571',
                email: 'dr.ahmed@hopehospital.com'
              },
              {
                _id: 'doc5',
                name: 'د. فاطمة محمد',
                specialty: 'طب الأعصاب',
                experience: '18 سنة',
                education: 'دكتوراه في طب الأعصاب - جامعة دمشق',
                workingHours: 'الأحد - الأربعاء: 9:00 ص - 5:00 م',
                description: 'اختصاصية في طب الأعصاب والدماغ مع خبرة في علاج السكتات الدماغية',
                phone: '+964 750 123 4572',
                email: 'dr.fatima@hopehospital.com'
              },
              {
                _id: 'doc6',
                name: 'د. نور الدين',
                specialty: 'طب العيون',
                experience: '14 سنة',
                education: 'دكتوراه في طب العيون - جامعة بغداد',
                workingHours: 'الأحد - الخميس: 10:00 ص - 4:00 م',
                description: 'طبيب عيون متخصص في جراحات العيون والليزر',
                phone: '+964 750 123 4573',
                email: 'dr.nour@hopehospital.com'
              }
            ]
          },
          {
            _id: 3,
            name: 'عيادة النور الطبية',
            type: 'clinic',
            location: 'بغداد - الأعظمية',
            services: 'استشارات طبية، فحوصات دورية، طب أسنان',
            specialties: 'طب عام، طب الأسنان، طب النساء',
            workingHours: 'الأحد - الخميس: 9:00 ص - 5:00 م',
            description: 'عيادة طبية تقدم رعاية شخصية ومهنية',
            phone: '+964 750 123 4569',
            email: 'info@nourclinic.com',
            rating: 4.3,
            reviews: 89,
            logo: '🏥',
            doctors: [
              {
                _id: 'doc7',
                name: 'د. زينب حسن',
                specialty: 'طب الأسنان',
                experience: '10 سنوات',
                education: 'دكتوراه في طب الأسنان - جامعة بغداد',
                workingHours: 'الأحد - الخميس: 9:00 ص - 5:00 م',
                description: 'طبيبة أسنان متخصصة في تجميل الأسنان والتركيبات',
                phone: '+964 750 123 4574',
                email: 'dr.zainab@nourclinic.com'
              },
              {
                _id: 'doc8',
                name: 'د. رنا محمد',
                specialty: 'طب النساء',
                experience: '12 سنة',
                education: 'دكتوراه في طب النساء والتوليد - جامعة البصرة',
                workingHours: 'الأحد - الأربعاء: 10:00 ص - 4:00 م',
                description: 'اختصاصية في طب النساء والتوليد مع خبرة في الولادة الطبيعية',
                phone: '+964 750 123 4575',
                email: 'dr.rana@nourclinic.com'
              }
            ]
          }
        ]);
      }
    } catch (error) {
      console.error('خطأ في جلب المراكز الصحية:', error);
              setError(t('error_loading_health_centers'));
    } finally {
      setLoading(false);
    }
  };

  const filteredCenters = healthCenters.filter(center => {
    const matchesSearch = center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         center.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         center.specialties.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || center.type === selectedType;
    const matchesSpecialty = selectedSpecialty === 'all' || 
                            center.specialties.toLowerCase().includes(selectedSpecialty.toLowerCase());
    
    return matchesSearch && matchesType && matchesSpecialty;
  });

  const getTypeLabel = (type) => {
    switch (type) {
      case 'hospital': return 'مستشفى';
      case 'clinic': return 'عيادة';
      case 'center': return 'مركز صحي';
      default: return type;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'hospital': return '#e74c3c';
      case 'clinic': return '#3498db';
      case 'center': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(90deg, #7c4dff 0%, #00bcd4 100%)',
        color: 'white',
        fontSize: '1.2rem'
      }}>
        <div>جاري تحميل المراكز الصحية...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7fafd' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(90deg, #7c4dff 0%, #00bcd4 100%)',
        color: 'white',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontWeight: 900 }}>🏥 المراكز الصحية</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/home')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            الصفحة الرئيسية
          </button>
          {user && (
            <button
              onClick={() => navigate('/profile')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              الملف الشخصي
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                🔍 البحث في المراكز الصحية
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث بالاسم، الموقع، أو التخصص..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                نوع المركز
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: '1rem',
                  minWidth: '120px'
                }}
              >
                <option value="all">جميع الأنواع</option>
                <option value="hospital">مستشفى</option>
                <option value="clinic">عيادة</option>
                <option value="center">مركز صحي</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                التخصص
              </label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: '1rem',
                  minWidth: '150px'
                }}
              >
                <option value="all">جميع التخصصات</option>
                <option value="طب عام">طب عام</option>
                <option value="أمراض القلب">أمراض القلب</option>
                <option value="طب الأطفال">طب الأطفال</option>
                <option value="طب النساء">طب النساء</option>
                <option value="طب العيون">طب العيون</option>
                <option value="طب الأسنان">طب الأسنان</option>
                <option value="جراحة">جراحة</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div style={{ marginBottom: '1rem', color: '#666' }}>
          تم العثور على {filteredCenters.length} مركز صحي
        </div>

        {/* Health Centers Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredCenters.map(center => (
            <div key={center._id} style={{
              background: 'white',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-4px)';
              e.target.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onClick={() => {
              // هنا يمكن إضافة الانتقال لصفحة تفاصيل المركز
              alert(`سيتم إضافة صفحة تفاصيل المركز: ${center.name}`);
            }}
            >
              {/* Header */}
              <div style={{
                background: `linear-gradient(135deg, ${getTypeColor(center.type)} 0%, ${getTypeColor(center.type)}dd 100%)`,
                color: 'white',
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{center.logo}</div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>{center.name}</h3>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '0.3rem 0.8rem',
                  borderRadius: 20,
                  fontSize: '0.85rem',
                  display: 'inline-block',
                  marginTop: '0.5rem'
                }}>
                  {getTypeLabel(center.type)}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '1.5rem' }}>
                {/* Rating */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ color: '#ffc107', fontSize: '1.2rem' }}>
                    {'⭐'.repeat(Math.floor(center.rating))}
                    {center.rating % 1 !== 0 && '⭐'}
                  </div>
                  <span style={{ marginLeft: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                    {center.rating} ({center.reviews} تقييم)
                  </span>
                </div>

                {/* Location */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666', marginLeft: '0.5rem' }}>📍</span>
                    <strong style={{ color: '#333' }}>الموقع:</strong>
                  </div>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{center.location}</p>
                </div>

                {/* Specialties */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666', marginLeft: '0.5rem' }}>🏥</span>
                    <strong style={{ color: '#333' }}>التخصصات:</strong>
                  </div>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{center.specialties}</p>
                </div>

                {/* Services */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666', marginLeft: '0.5rem' }}>🩺</span>
                    <strong style={{ color: '#333' }}>الخدمات:</strong>
                  </div>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{center.services}</p>
                </div>

                {/* Working Hours */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666', marginLeft: '0.5rem' }}>🕒</span>
                    <strong style={{ color: '#333' }}>ساعات العمل:</strong>
                  </div>
                  {Array.isArray(center.workTimes) && center.workTimes.length > 0 ? (
                    (() => {
                      const validTimes = center.workTimes.filter(
                        t => t && typeof t.day === 'string' && typeof t.from === 'string' && typeof t.to === 'string'
                      );
                      return validTimes.length > 0 ? (
                        <ul style={{margin:0, padding:'0 1rem', color:'#666', fontSize:'0.9rem'}}>
                          {validTimes.map((t, idx) => (
                            <li key={idx}>{t.day} : {t.from} - {t.to}</li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>لا توجد أوقات دوام متوفرة</p>
                      );
                    })()
                  ) : center.workTimes && typeof center.workTimes === 'object' && !Array.isArray(center.workTimes) ? (
                    (() => {
                      const validDays = Object.entries(center.workTimes).filter(
                        ([, time]) =>
                          time &&
                          typeof time === 'object' &&
                          !Array.isArray(time) &&
                          typeof time.from === 'string' &&
                          typeof time.to === 'string' &&
                          // حماية إضافية: إذا كان time فيه مفاتيح أيام الأسبوع، تجاهله
                          !('sunday' in time || 'monday' in time || 'tuesday' in time || 'wednesday' in time || 'thursday' in time || 'friday' in time || 'saturday' in time)
                      );
                      return validDays.length > 0 ? (
                        <ul style={{margin:0, padding:'0 1rem', color:'#666', fontSize:'0.9rem'}}>
                          {validDays.map(([day, time], idx) => (
                            <li key={idx}>{day} : {time.from} - {time.to}</li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>لا توجد أوقات دوام متوفرة</p>
                      );
                    })()
                  ) : typeof center.workingHours === 'object' && !Array.isArray(center.workingHours) ? (
                    <ul style={{margin:0, padding:'0 1rem', color:'#666', fontSize:'0.9rem'}}>
                      {Object.entries(center.workingHours).map(([day, time], idx) => (
                        time && typeof time === 'object' && typeof time.from === 'string' && typeof time.to === 'string'
                          ? <li key={idx}>{day} : {time.from} - {time.to}</li>
                          : null
                      ))}
                    </ul>
                  ) : typeof center.workingHours === 'string' ? (
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{center.workingHours}</p>
                  ) : (
                    <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>لا توجد أوقات دوام متوفرة</p>
                  )}
                </div>

                {/* Contact */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666', marginLeft: '0.5rem' }}>📞</span>
                    <strong style={{ color: '#333' }}>التواصل:</strong>
                  </div>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{center.phone}</p>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>{center.email}</p>
                </div>

                {/* Description */}
                {center.description && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#666', marginLeft: '0.5rem' }}>📝</span>
                      <strong style={{ color: '#333' }}>الوصف:</strong>
                    </div>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem', lineHeight: '1.5' }}>
                      {center.description}
                    </p>
                  </div>
                )}

                {/* Doctors */}
                {center.doctors && center.doctors.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#666', marginLeft: '0.5rem' }}>👨‍⚕️</span>
                      <strong style={{ color: '#333' }}>الأطباء ({center.doctors.length}):</strong>
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {center.doctors.map((doctor, index) => (
                        <div key={doctor._id} style={{
                          background: '#f8f9fa',
                          padding: '0.75rem',
                          borderRadius: 8,
                          marginBottom: '0.5rem',
                          border: '1px solid #e9ecef'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <div>
                              <strong style={{ color: '#333', fontSize: '0.95rem' }}>{doctor.name}</strong>
                              <div style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                                {doctor.specialty} • {doctor.experience}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // هنا يمكن إضافة الانتقال لصفحة حجز موعد مع الطبيب
                                alert(`سيتم إضافة صفحة حجز موعد مع: ${doctor.name}`);
                              }}
                              style={{
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '0.4rem 0.8rem',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                              }}
                            >
                              حجز موعد
                            </button>
                          </div>
                          <div style={{ color: '#666', fontSize: '0.8rem', lineHeight: '1.4' }}>
                            <div>🕒 {doctor.workingHours}</div>
                            <div>📞 {doctor.phone}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`tel:${center.phone}`, '_blank');
                    }}
                    style={{
                      flex: 1,
                      background: '#4caf50',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}
                  >
                    📞 اتصل الآن
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`mailto:${center.email}`, '_blank');
                    }}
                    style={{
                      flex: 1,
                      background: '#2196f3',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}
                  >
                    📧 راسلنا
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredCenters.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#666'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏥</div>
            <h3>لا توجد مراكز صحية تطابق البحث</h3>
            <p>جرب تغيير معايير البحث أو البحث بكلمات مختلفة</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HealthCenters; 
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ku from './locales/ku/translation.json';
import ar from './locales/ar/translation.json';
import en from './locales/en/translation.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ku: { translation: ku },
      ar: { translation: ar },
      en: { translation: en },
    },
    lng: 'ar', // العربية افتراضية
    fallbackLng: 'ku',
    interpolation: { escapeValue: false },
    react: { useSuspense: false }
  });

export default i18n; 
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
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
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { useTranslation } from 'react-i18next';

function MedicineReminder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  // جلب الأدوية من localStorage
  useEffect(() => {
    const savedMedicines = localStorage.getItem(`medicines_${user?._id}`);
    if (savedMedicines) {
      setMedicines(JSON.parse(savedMedicines));
    }
  }, [user?._id]);

  // حفظ الأدوية في localStorage
  const saveMedicines = (newMedicines) => {
    localStorage.setItem(`medicines_${user?._id}`, JSON.stringify(newMedicines));
    setMedicines(newMedicines);
  };

  // إضافة دواء جديد
  const addMedicine = async (medicineData) => {
    setLoading(true);
    setError('');
    try {
      // تجهيز بيانات الإرسال
      const payload = {
        userId: user._id,
        medicineName: medicineData.name,
        dosage: medicineData.dosage,
        times: medicineData.reminders.map(r => r.time),
        startDate: new Date().toISOString().slice(0, 10), // يمكنك تعديلها حسب الحاجة
        endDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0, 10) // أسبوع افتراضي
      };
      const res = await fetch(`${process.env.REACT_APP_API_URL}/medicine-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(t('error_adding_medicine') + ': ' + errorText);
      }
      // بعد الإضافة، أعد جلب قائمة الأدوية من السيرفر
      fetchMedicines();
    } catch (err) {
      setError(err.message || t('error_adding_medicine'));
      console.error('addMedicine error:', err);
    } finally {
      setLoading(false);
    }
  };

  // حذف دواء
  const deleteMedicine = (medicineId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الدواء؟')) {
      const updatedMedicines = medicines.filter(m => m.id !== medicineId);
      saveMedicines(updatedMedicines);
    }
  };

  // تفعيل/إلغاء تفعيل دواء
  const toggleMedicine = (medicineId) => {
    const updatedMedicines = medicines.map(m => 
      m.id === medicineId ? { ...m, isActive: !m.isActive } : m
    );
    saveMedicines(updatedMedicines);
  };

  // إرسال إشعار تذكير
  const sendReminderNotification = async (medicine) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user._id,
          type: 'medicine_reminder',
          message: t('medicine_reminder_message', { medicine: medicine.name, dosage: medicine.dosage }),
          phone: user.phone
        })
      });
      
      if (res.ok) {

      }
    } catch (err) {
      // فشل إرسال إشعار تذكير الدواء
    }
  };

  // فحص التذكيرات كل دقيقة
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      medicines.forEach(medicine => {
        if (medicine.isActive) {
          medicine.reminders.forEach(reminder => {
            const reminderTime = parseInt(reminder.time.split(':')[0]) * 60 + parseInt(reminder.time.split(':')[1]);
            if (Math.abs(currentTime - reminderTime) < 1) { // خلال دقيقة واحدة
              sendReminderNotification(medicine);
            }
          });
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // كل دقيقة
    return () => clearInterval(interval);
  }, [medicines, user?._id]);

  // دالة جلب الأدوية من السيرفر:
  const fetchMedicines = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/medicine-reminders/${user._id}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(t('error_fetching_medicines') + ': ' + errorText);
      }
      const data = await res.json();
      // معالجة كل عنصر ليحتوي على reminders مصفوفة كائنات
      const normalized = (data.reminders || []).map(med => ({
        ...med,
        reminders: Array.isArray(med.times) ? med.times.map(time => ({ time })) : [],
        name: med.medicineName || med.name || '',
        id: med._id || med.id || ''
      }));
      setMedicines(normalized);
    } catch (err) {
      setError(err.message || t('error_fetching_medicines'));
      console.error('fetchMedicines error:', err);
    } finally {
      setLoading(false);
    }
  };

  // استخدم fetchMedicines في useEffect بدلاً من localStorage:
  useEffect(() => {
    fetchMedicines();
  }, [user?._id]);

  if (!user) {
    return <div style={{textAlign:'center', marginTop:40}}>{t('login_required')}</div>;
  }

  return (
    <div style={{background:'#f7fafd', minHeight:'100vh', padding:'1rem'}}>
      {/* Header */}
      <div style={{maxWidth:800, margin:'0 auto'}}>
        <div style={{background:'#fff', borderRadius:18, boxShadow:'0 2px 16px #7c4dff22', padding:'2rem', marginBottom:'2rem'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:'1rem'}}>
            <h1 style={{color:'#7c4dff', margin:0, fontSize:'2rem', fontWeight:900}}>💊 {t('medicine_reminder_title')}</h1>
            <div style={{display:'flex', gap:'1rem', flexWrap:'wrap'}}>
              <button 
                onClick={() => setShowAdd(true)}
                style={{
                  background:'#4caf50',
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
                ➕ {t('add_medicine')}
              </button>
              <button 
                onClick={() => navigate('/home')}
                style={{
                  background:'#00bcd4',
                  color:'#fff',
                  border:'none',
                  borderRadius:8,
                  padding:'0.7rem 1.5rem',
                  fontWeight:700,
                  cursor:'pointer'
                }}
              >
                {t('back_to_home')}
              </button>
            </div>
          </div>
          <p style={{color:'#666', margin:0}}>
            {t('add_medicines_and_times')}
          </p>
        </div>

        {/* Statistics */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem', marginBottom:'2rem'}}>
          <div style={{background:'#fff', borderRadius:16, boxShadow:'0 2px 12px #7c4dff11', padding:'1.5rem', textAlign:'center'}}>
            <div style={{fontSize:'2rem', marginBottom:'0.5rem'}}>💊</div>
            <div style={{fontSize:'1.5rem', fontWeight:700, color:'#4caf50', marginBottom:'0.5rem'}}>{medicines.length}</div>
            <div style={{color:'#666'}}>{t('total_medicines')}</div>
          </div>
          <div style={{background:'#fff', borderRadius:16, boxShadow:'0 2px 12px #7c4dff11', padding:'1.5rem', textAlign:'center'}}>
            <div style={{fontSize:'2rem', marginBottom:'0.5rem'}}>✅</div>
            <div style={{fontSize:'1.5rem', fontWeight:700, color:'#2196f3', marginBottom:'0.5rem'}}>
              {medicines.filter(m => m.isActive).length}
            </div>
            <div style={{color:'#666'}}>{t('active_medicines')}</div>
          </div>
          <div style={{background:'#fff', borderRadius:16, boxShadow:'0 2px 12px #7c4dff11', padding:'1.5rem', textAlign:'center'}}>
            <div style={{fontSize:'2rem', marginBottom:'0.5rem'}}>⏰</div>
            <div style={{fontSize:'1.5rem', fontWeight:700, color:'#ff9800', marginBottom:'0.5rem'}}>
              {medicines.reduce((total, m) => total + m.reminders.length, 0)}
            </div>
            <div style={{color:'#666'}}>{t('reminder_times')}</div>
          </div>
        </div>

        {/* Medicines List */}
        {medicines.length === 0 ? (
          <div style={{background:'#fff', borderRadius:18, boxShadow:'0 2px 16px #7c4dff22', padding:'3rem', textAlign:'center'}}>
            <div style={{fontSize:'4rem', marginBottom:'1rem'}}>💊</div>
            <h3 style={{color:'#7c4dff', marginBottom:'0.5rem'}}>{t('no_medicines')}</h3>
            <p style={{color:'#666', marginBottom:'2rem'}}>
              {t('add_first_medicine')}
            </p>
            <button 
              onClick={() => setShowAdd(true)}
              style={{
                background:'#4caf50',
                color:'#fff',
                border:'none',
                borderRadius:8,
                padding:'1rem 2rem',
                fontWeight:700,
                cursor:'pointer'
              }}
            >
              {t('add_medicine_now')}
            </button>
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
            {medicines.map(medicine => (
              <div key={medicine.id} style={{
                background:'#fff',
                borderRadius:16,
                boxShadow:'0 2px 12px #7c4dff11',
                padding:'1.5rem',
                borderLeft: `4px solid ${medicine.isActive ? '#4caf50' : '#ccc'}`
              }}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem'}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem'}}>
                      <span style={{fontSize:'1.2rem'}}>💊</span>
                      <h3 style={{color:'#7c4dff', margin:'0 0 0.5rem 0', fontSize:'1.3rem'}}>
                        {medicine.name}
                      </h3>
                      <span style={{
                        background: medicine.isActive ? '#4caf50' : '#ccc',
                        color:'#fff',
                        padding:'0.2rem 0.8rem',
                        borderRadius:12,
                        fontSize:'0.8rem',
                        fontWeight:700
                      }}>
                        {medicine.isActive ? t('active') : t('inactive')}
                      </span>
                    </div>
                    <div style={{color:'#666', marginBottom:'0.5rem'}}>
                      💊 {t('dosage')}: {medicine.dosage}
                    </div>
                    <div style={{color:'#666', marginBottom:'0.5rem'}}>
                      📝 {t('description')}: {medicine.description || t('no_description')}
                    </div>
                    <div style={{color:'#666', marginBottom:'0.5rem'}}>
                      ⏰ {t('reminder_times_label')}
                    </div>
                    <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
                      {medicine.reminders.map((reminder, index) => (
                        <span key={index} style={{
                          background:'#e3f2fd',
                          color:'#1976d2',
                          padding:'0.3rem 0.8rem',
                          borderRadius:12,
                          fontSize:'0.8rem',
                          fontWeight:600
                        }}>
                          {reminder.time}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{display:'flex', gap:'0.5rem'}}>
                    <button 
                      onClick={() => toggleMedicine(medicine.id)}
                      style={{
                        background: medicine.isActive ? '#ff9800' : '#4caf50',
                        color:'#fff',
                        border:'none',
                        borderRadius:8,
                        padding:'0.5rem 1rem',
                        fontWeight:600,
                        cursor:'pointer',
                        fontSize:'0.9rem'
                      }}
                    >
                      {medicine.isActive ? t('deactivate') : t('activate')}
                    </button>
                    <button 
                      onClick={() => deleteMedicine(medicine.id)}
                      style={{
                        background:'#e53935',
                        color:'#fff',
                        border:'none',
                        borderRadius:8,
                        padding:'0.5rem 1rem',
                        fontWeight:600,
                        cursor:'pointer',
                        fontSize:'0.9rem'
                      }}
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Medicine Modal */}
      {showAdd && (
        <AddMedicineForm 
          onClose={() => setShowAdd(false)}
          onAdd={addMedicine}
        />
      )}
    </div>
  );
}

// مكون إضافة دواء جديد
function AddMedicineForm({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    description: '',
    reminders: [{ time: '08:00' }]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();
  const isMobile = window.innerWidth < 500;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addReminder = () => {
    setFormData(prev => ({
      ...prev,
      reminders: [...prev.reminders, { time: '08:00' }]
    }));
  };

  const removeReminder = (index) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.filter((_, i) => i !== index)
    }));
  };

  const updateReminder = (index, time) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.map((r, i) => i === index ? { time } : r)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.name.trim() || !formData.dosage.trim()) {
        throw new Error(t('fill_medicine_name_and_dosage'));
      }

      await onAdd(formData);
      onClose();
    } catch (err) {
      setError(err.message || t('error_adding_medicine'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position:'fixed',
      top:0,
      left:0,
      width:'100vw',
      height:'100vh',
      background:'rgba(0,0,0,0.5)',
      display:'flex',
      alignItems:'center', // إرجاع التمركز
      justifyContent:'center',
      zIndex:2000
    }}>
      <div style={{
        background:'#fff',
        borderRadius:18,
        boxShadow:'0 4px 24px #7c4dff33',
        padding: isMobile ? '1.2rem 0.7rem 0.7rem 0.7rem' : '2rem',
        maxWidth: isMobile ? '100vw' : 500,
        width: isMobile ? '100vw' : '90%',
        minHeight: isMobile ? '70vh' : undefined,
        maxHeight: isMobile ? '95vh' : '90vh',
        overflowY:'auto',
        position: 'relative',
        transition: 'all 0.3s',
      }}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem'}}>
          <h2 style={{color:'#7c4dff', margin:0, fontWeight:700, fontSize: isMobile ? 18 : 22}}>💊 {t('add_medicine')}</h2>
          <button 
            onClick={onClose}
            style={{
              background:'none',
              border:'none',
              fontSize:'1.5rem',
              cursor:'pointer',
              color:'#666'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
          {/* معلومات الدواء */}
          <div style={{background:'#f8f9fa', borderRadius:12, padding:'1.5rem'}}>
            <h4 style={{color:'#4caf50', marginBottom:'1rem', fontWeight:700, display:'flex', alignItems:'center', gap:'0.5rem'}}>
              💊 {t('medicine_description')}
            </h4>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem'}}>
              <div>
                <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>
                  {t('medicine_name')} *
                </label>
                <input
                  type="text"
                  placeholder={t('enter_medicine_name')}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  style={{
                    width:'100%',
                    padding:'0.8rem',
                    borderRadius:8,
                    border:'2px solid #e0e0e0',
                    fontSize:14,
                    transition:'border-color 0.3s'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>
                  {t('dosage')} *
                </label>
                <input
                  type="text"
                  placeholder={t('enter_dosage')}
                  value={formData.dosage}
                  onChange={(e) => handleInputChange('dosage', e.target.value)}
                  style={{
                    width:'100%',
                    padding:'0.8rem',
                    borderRadius:8,
                    border:'2px solid #e0e0e0',
                    fontSize:14,
                    transition:'border-color 0.3s'
                  }}
                  required
                />
              </div>
            </div>
            <div style={{marginTop:'1rem'}}>
              <label style={{display:'block', marginBottom:'0.5rem', color:'#333', fontWeight:600, fontSize:14}}>
                {t('medicine_description')}
              </label>
              <textarea
                placeholder={t('enter_medicine_description')}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                style={{
                  width:'100%',
                  padding:'0.8rem',
                  borderRadius:8,
                  border:'2px solid #e0e0e0',
                  fontSize:14,
                  resize:'vertical'
                }}
              />
            </div>
          </div>

          {/* مواعيد التذكير */}
          <div style={{background:'#f8f9fa', borderRadius:12, padding:'1.5rem'}}>
            <h4 style={{color:'#ff9800', marginBottom:'1rem', fontWeight:700, display:'flex', alignItems:'center', gap:'0.5rem'}}>
              ⏰ {t('reminder_times_header')}
            </h4>
            <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
              {formData.reminders.map((reminder, index) => (
                <div key={index} style={{display:'flex', alignItems:'center', gap:'1rem'}}>
                  <input
                    type="time"
                    value={reminder.time}
                    onChange={(e) => updateReminder(index, e.target.value)}
                    style={{
                      padding:'0.8rem',
                      borderRadius:8,
                      border:'2px solid #e0e0e0',
                      fontSize:14
                    }}
                  />
                  {formData.reminders.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeReminder(index)}
                      style={{
                        background:'#e53935',
                        color:'#fff',
                        border:'none',
                        borderRadius:8,
                        padding:'0.8rem 1rem',
                        fontWeight:600,
                        cursor:'pointer'
                      }}
                    >
                      {t('remove')}
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addReminder}
                style={{
                  background:'#2196f3',
                  color:'#fff',
                  border:'none',
                  borderRadius:8,
                  padding:'0.8rem 1rem',
                  fontWeight:600,
                  cursor:'pointer',
                  display:'flex',
                  alignItems:'center',
                  gap:'0.5rem'
                }}
              >
                ➕ {t('add_reminder_time')}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background:'#ffebee',
              color:'#c62828',
              padding:'1rem',
              borderRadius:8,
              fontSize:14
            }}>
              {error}
            </div>
          )}

          {/* الأزرار في الأسفل بشكل عادي */}
          <div style={{
            display:'flex', gap:'1rem', justifyContent:'flex-end',
            marginTop: isMobile ? 10 : 0
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background:'#ccc',
                color:'#333',
                border:'none',
                borderRadius:8,
                padding:'0.8rem 1.5rem',
                fontWeight:600,
                cursor:'pointer',
                fontSize: isMobile ? 15 : 16
              }}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#ccc' : '#4caf50',
                color:'#fff',
                border:'none',
                borderRadius:8,
                padding:'0.8rem 1.5rem',
                fontWeight:600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: isMobile ? 15 : 16
              }}
            >
              {loading ? t('adding_medicine') : t('add_medicine_button')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MedicineReminder; 
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
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, requiredUserType = null }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

    console.log('🔒 ProtectedRoute:', {
    requiredUserType,
    userType: user?.user_type || user?.role,
    hasUser: !!user,
    loading
  });

  if (loading) {
    console.log('⏳ ProtectedRoute: جاري التحميل...');
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(90deg, #7c4dff 0%, #00bcd4 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '1.2rem' }}>جاري التحميل...</div>
      </div>
    );
  }

  if (!user) {
    console.log('❌ ProtectedRoute: لا يوجد مستخدم - إعادة توجيه للصفحة الرئيسية');
    // حفظ الرابط الأصلي في redirect
    return <Navigate to={`/?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

    // معالجة أنواع المستخدمين المختلفة
    const userType = user?.user_type || user?.role;
    const isUserTypeValid = requiredUserType === 'user' ? 
      (userType === 'user' || userType === 'patient') : 
      (userType === requiredUserType);
    
    if (requiredUserType && !isUserTypeValid) {
      console.log('❌ نوع المستخدم غير صحيح:', {
        required: requiredUserType,
        actual: userType
      });

      // Redirect based on user type
      if (userType === 'doctor') {
        return <Navigate to="/doctor-dashboard" replace />;
      } else if (userType === 'admin') {
        return <Navigate to="/admin-login" replace />;
      } else {
        return <Navigate to="/home" replace />;
      }
    }

  console.log('✅ ProtectedRoute: تم الوصول للصفحة بنجاح');
  return children;
};

export default ProtectedRoute; 

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
    console.log('🔄 جلب الأطباء من:', (process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com') + '/doctors');
    
   fetch((process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com') + '/doctors')
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
          fetch(`${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/notifications?userId=${user._id}`)
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
              fetch(`${process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com'}/notifications/mark-read?userId=${user._id}`, { method: 'PUT' })
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
      const response = await fetch((process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com') + '/favorites', {
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
    if (img.startsWith('/uploads/')) return (process.env.REACT_APP_API_URL || 'https://api.tabib-iq.com') + img;
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
    console.log('🔍 UserProfile - profile:', profile);
    console.log('🔍 UserProfile - user:', user);
    
    if (profile) {
      const formData = {
        first_name: profile.first_name || profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        profileImage: profile.profileImage || profile.avatar || ''
      };
      console.log('🔍 UserProfile - formData from profile:', formData);
      setForm(formData);
      setImageLoadError(false);
    } else if (user) {
      // إذا لم يكن هناك profile، استخدم user
      const formData = {
        first_name: user.first_name || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        profileImage: user.profileImage || user.avatar || ''
      };
      console.log('🔍 UserProfile - formData from user:', formData);
      setForm(formData);
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
