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
    if (img.startsWith('/uploads/')) return process.env.REACT_APP_API_URL + img;
    if (img.startsWith('http')) return img;
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
        fetch(process.env.REACT_APP_API_URL + '/users'),
        fetch(process.env.REACT_APP_API_URL + '/admin/doctors'),
        fetch(process.env.REACT_APP_API_URL + '/appointments'),
        fetch(process.env.REACT_APP_API_URL + '/health-centers')
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/doctors/${doctorId}/approve`, {
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/doctors/${doctorId}/reject`, {
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
                  fetch(process.env.REACT_APP_API_URL + '/admin/doctors'),
                  fetch(process.env.REACT_APP_API_URL + '/appointments')
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/doctors/${doctorId}/feature`, {
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/doctors/${doctorId}/unfeature`, {
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/users/${userId}`, {
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/doctors/${doctorId}`, {
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
      const response = await fetch(process.env.REACT_APP_API_URL + '/health-centers', {
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/health-centers/${centerId}`, {
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
                              const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/toggle-account/user/${user._id || user.id}`,
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
                              const url = `${process.env.REACT_APP_API_URL}/admin/toggle-account/doctor/${doctorId}`;
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