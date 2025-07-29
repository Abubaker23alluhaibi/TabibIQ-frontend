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