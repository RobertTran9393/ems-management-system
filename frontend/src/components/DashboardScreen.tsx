import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Award,
  UserPlus,
  Calendar,
  Building2,
  RefreshCw,
  BarChart3,
  Layers,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  Shield,
  GraduationCap,
  PieChart,
  BookOpen,
  Target,
  Sliders,
  CheckCheck,
  Save,
  Search,
  Filter,
  Briefcase,
  Calculator,
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export const ROLE_DISPLAY_MAP: Record<
  string,
  {
    label: string;
    shortLabel: string;
    badgeClass: string;
    desc: string;
    presets: { label: string; rev: number; newSt: number }[];
  }
> = {
  SALE: {
    label: 'Tư Vấn Tuyển Sinh (Sale)',
    shortLabel: 'Tư Vấn Tuyển Sinh',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    desc: 'Chỉ tiêu doanh số học phí & tuyển mới học viên',
    presets: [
      { label: '30Tr / 10 bé', rev: 30000000, newSt: 10 },
      { label: '50Tr / 15 bé', rev: 50000000, newSt: 15 },
      { label: '70Tr / 20 bé', rev: 70000000, newSt: 20 },
    ],
  },
  TEACHER: {
    label: 'Giáo Viên (Teacher)',
    shortLabel: 'Giáo Viên',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'Chỉ tiêu tái tục, doanh thu học phần & phụ huynh giới thiệu',
    presets: [
      { label: '20Tr / 6 bé', rev: 20000000, newSt: 6 },
      { label: '30Tr / 10 bé', rev: 30000000, newSt: 10 },
      { label: '50Tr / 15 bé', rev: 50000000, newSt: 15 },
    ],
  },
  ACADEMIC_AFFAIRS: {
    label: 'Giáo Vụ (Academic Affairs)',
    shortLabel: 'Giáo Vụ',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    desc: 'Chỉ tiêu duy trì sĩ số, chuyển đổi lớp & hỗ trợ tuyển sinh',
    presets: [
      { label: '15Tr / 5 bé', rev: 15000000, newSt: 5 },
      { label: '25Tr / 8 bé', rev: 25000000, newSt: 8 },
    ],
  },
  ACCOUNTANT: {
    label: 'Kế Toán (Accountant)',
    shortLabel: 'Kế Toán',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Chỉ tiêu đôn đốc công nợ & hỗ trợ thu ngân POS',
    presets: [
      { label: '10Tr / 3 bé', rev: 10000000, newSt: 3 },
      { label: '20Tr / 5 bé', rev: 20000000, newSt: 5 },
    ],
  },
  BRANCH_MANAGER: {
    label: 'Quản Lý Cơ Sở (Branch Manager)',
    shortLabel: 'Quản Lý Cơ Sở',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    desc: 'Chỉ tiêu doanh thu cơ sở & phát triển học sinh',
    presets: [
      { label: '80Tr / 25 bé', rev: 80000000, newSt: 25 },
      { label: '100Tr / 30 bé', rev: 100000000, newSt: 30 },
    ],
  },
  ADMIN: {
    label: 'Quản Trị Viên (Admin)',
    shortLabel: 'Quản Trị Viên',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    desc: 'Chỉ tiêu điều hành & giám sát hệ thống',
    presets: [
      { label: 'Không giao', rev: 0, newSt: 0 },
    ],
  },
};

export const DashboardScreen: React.FC = () => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [teacherScope, setTeacherScope] = useState<'mine' | 'all'>('mine');

  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeChartMetric, setActiveChartMetric] = useState<'revenue' | 'newStudents' | 'completedStudents'>('revenue');
  const [recentTab, setRecentTab] = useState<'orders' | 'newStudents' | 'completed'>('orders');

  // Target Settings Modal State (Global/Fallback)
  const [showTargetModal, setShowTargetModal] = useState<boolean>(false);
  const [editingTargetRev, setEditingTargetRev] = useState<number>(100000000);
  const [editingTargetNew, setEditingTargetNew] = useState<number>(30);
  const [savingTarget, setSavingTarget] = useState<boolean>(false);

  // Staff Target Assignment Modal State (Per Employee & Per Role)
  const [showStaffTargetModal, setShowStaffTargetModal] = useState<boolean>(false);
  const [staffTargetModalTab, setStaffTargetModalTab] = useState<'BY_ROLE' | 'BY_STAFF'>('BY_ROLE');
  const [staffTargetMonth, setStaffTargetMonth] = useState<number>(new Date().getMonth() + 1);
  const [staffTargetYear, setStaffTargetYear] = useState<number>(new Date().getFullYear());
  const [staffTargetBranchId, setStaffTargetBranchId] = useState<string>('all');
  const [staffTargetList, setStaffTargetList] = useState<any[]>([]);
  const [loadingStaffTargets, setLoadingStaffTargets] = useState<boolean>(false);
  const [savingStaffTargets, setSavingStaffTargets] = useState<boolean>(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>('');
  const [modalRoleFilter, setModalRoleFilter] = useState<string>('all');
  const [leaderboardRoleFilter, setLeaderboardRoleFilter] = useState<string>('all');
  const [appliedRoleToast, setAppliedRoleToast] = useState<string | null>(null);
  const [roleTargetInputs, setRoleTargetInputs] = useState<Record<string, { targetRevenue: number; targetNewStudents: number }>>({
    SALE: { targetRevenue: 50000000, targetNewStudents: 15 },
    TEACHER: { targetRevenue: 30000000, targetNewStudents: 10 },
    ACADEMIC_AFFAIRS: { targetRevenue: 20000000, targetNewStudents: 5 },
    ACCOUNTANT: { targetRevenue: 10000000, targetNewStudents: 3 },
    BRANCH_MANAGER: { targetRevenue: 80000000, targetNewStudents: 25 },
    ADMIN: { targetRevenue: 0, targetNewStudents: 0 },
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('ems_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        if (u.role === 'TEACHER') {
          setTeacherScope('mine');
        } else {
          setTeacherScope('all');
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [period, selectedDate, customStartDate, customEndDate, selectedBranchId, teacherScope]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ems_token');
      const params = new URLSearchParams();
      params.append('period', period);
      if (selectedDate) params.append('date', selectedDate);
      if (period === 'custom') {
        if (customStartDate) params.append('startDate', customStartDate);
        if (customEndDate) params.append('endDate', customEndDate);
      }
      if (selectedBranchId) params.append('branchId', selectedBranchId);

      // If user is teacher and scope is 'mine', pass teacherId
      if (currentUser?.role === 'TEACHER' && teacherScope === 'mine') {
        params.append('teacherId', currentUser.id);
      }

      const res = await fetch(`${API_BASE_URL}/api/dashboard/metrics?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();
      if (json.success) {
        setMetrics(json.data);
        if (json.data.branches) {
          setBranches(json.data.branches);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const isTeacher = currentUser?.role === 'TEACHER';
  const summary = metrics?.summary || {
    totalRevenue: 0,
    revenueGrowth: 0,
    totalOrderValue: 0,
    remainingDebt: 0,
    paymentCollectionRate: 100,
    activeStudentsCount: 0,
    activeEnrollmentsCount: 0,
    completedStudentsCount: 0,
    completedGrowth: 0,
    onTimeLevelUpCount: 0,
    newStudentsCount: 0,
    newStudentsGrowth: 0,
  };

  const targets = summary.targets || {
    periodTargetRevenue: 100000000,
    monthlyTargetRevenue: 100000000,
    revenueAchievementRate: 0,
    revenueRemaining: 100000000,
    periodTargetNewStudents: 30,
    monthlyTargetNewStudents: 30,
    newStudentsAchievementRate: 0,
    newStudentsRemaining: 30,
  };

  const handleOpenTargetModal = () => {
    setEditingTargetRev(targets.monthlyTargetRevenue || 100000000);
    setEditingTargetNew(targets.monthlyTargetNewStudents || 30);
    setShowTargetModal(true);
  };

  const handleSaveTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingTarget(true);
      const token = localStorage.getItem('ems_token');
      const res = await fetch(`${API_BASE_URL}/api/dashboard/targets`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          targetRevenue: editingTargetRev,
          targetNewStudents: editingTargetNew,
          isTeacherTarget: isTeacher && teacherScope === 'mine',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowTargetModal(false);
        fetchMetrics();
      } else {
        alert(data.message || 'Lỗi khi lưu chỉ tiêu');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingTarget(false);
    }
  };

  const fetchStaffTargets = async (m = staffTargetMonth, y = staffTargetYear, bId = staffTargetBranchId) => {
    try {
      setLoadingStaffTargets(true);
      const token = localStorage.getItem('ems_token');
      const params = new URLSearchParams();
      params.append('month', String(m));
      params.append('year', String(y));
      if (bId && bId !== 'all') params.append('branchId', bId);

      const res = await fetch(`${API_BASE_URL}/api/dashboard/staff-targets?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (json.success && json.data) {
        const list = json.data.staffTargets || [];
        setStaffTargetList(list);

        // Prepopulate role targets if any are set on staff
        setRoleTargetInputs((prev) => {
          const updated = { ...prev };
          list.forEach((st: any) => {
            const r = st.role;
            if (r) {
              if (!updated[r]) {
                updated[r] = { targetRevenue: 0, targetNewStudents: 0 };
              }
              if (Number(st.targetRevenue) > 0 && updated[r].targetRevenue === 0) {
                updated[r].targetRevenue = Number(st.targetRevenue);
              }
              if (Number(st.targetNewStudents) > 0 && updated[r].targetNewStudents === 0) {
                updated[r].targetNewStudents = Number(st.targetNewStudents);
              }
            }
          });
          return updated;
        });
      }
    } catch (e) {
      console.error('Failed to fetch staff targets:', e);
    } finally {
      setLoadingStaffTargets(false);
    }
  };

  const handleOpenStaffTargetModal = (tab: 'BY_ROLE' | 'BY_STAFF' = 'BY_ROLE') => {
    const d = new Date(selectedDate || Date.now());
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    setStaffTargetMonth(m);
    setStaffTargetYear(y);
    setStaffTargetBranchId(selectedBranchId);
    setStaffTargetModalTab(tab);
    setShowStaffTargetModal(true);
    fetchStaffTargets(m, y, selectedBranchId);
  };

  const handleUpdateRoleTargetInput = (role: string, field: 'targetRevenue' | 'targetNewStudents', val: number) => {
    setRoleTargetInputs((prev) => ({
      ...prev,
      [role]: {
        ...(prev[role] || { targetRevenue: 0, targetNewStudents: 0 }),
        [field]: val,
      },
    }));
  };

  const handleApplyRoleTarget = (role: string) => {
    const target = roleTargetInputs[role];
    if (!target) return;
    const rev = Number(target.targetRevenue) || 0;
    const newSt = Math.floor(Number(target.targetNewStudents)) || 0;

    let count = 0;
    setStaffTargetList((prev) =>
      prev.map((item) => {
        if (item.role === role) {
          count++;
          return {
            ...item,
            targetRevenue: rev,
            targetNewStudents: newSt,
          };
        }
        return item;
      })
    );

    const roleName = ROLE_DISPLAY_MAP[role]?.shortLabel || role;
    setAppliedRoleToast(`✓ Đã áp dụng ${rev.toLocaleString('vi-VN')} đ & ${newSt} bé cho ${count} nhân sự vị trí ${roleName}`);
    setTimeout(() => setAppliedRoleToast(null), 3000);
  };

  const handleApplyAllRoleTargets = () => {
    let totalCount = 0;
    setStaffTargetList((prev) =>
      prev.map((item) => {
        const target = roleTargetInputs[item.role];
        if (target && (target.targetRevenue > 0 || target.targetNewStudents > 0)) {
          totalCount++;
          return {
            ...item,
            targetRevenue: Number(target.targetRevenue) || 0,
            targetNewStudents: Math.floor(Number(target.targetNewStudents)) || 0,
          };
        }
        return item;
      })
    );

    setAppliedRoleToast(`✓ Đã áp dụng định mức theo từng vị trí cho toàn bộ ${totalCount} nhân sự!`);
    setTimeout(() => setAppliedRoleToast(null), 3000);
  };

  const handleUpdateStaffTarget = (userId: string, field: 'targetRevenue' | 'targetNewStudents' | 'note', val: any) => {
    setStaffTargetList((prev) =>
      prev.map((item) => {
        if (item.userId === userId) {
          return { ...item, [field]: val };
        }
        return item;
      })
    );
  };

  const handleApplyPreset = (rev: number, newSt: number, onlyRole?: string) => {
    setStaffTargetList((prev) =>
      prev.map((item) => {
        if (!onlyRole || item.role === onlyRole) {
          return { ...item, targetRevenue: rev, targetNewStudents: newSt };
        }
        return item;
      })
    );
  };

  const handleSaveStaffTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingStaffTargets(true);
      const token = localStorage.getItem('ems_token');
      const res = await fetch(`${API_BASE_URL}/api/dashboard/staff-targets/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          month: staffTargetMonth,
          year: staffTargetYear,
          targets: staffTargetList.map((st) => ({
            userId: st.userId,
            targetRevenue: Number(st.targetRevenue) || 0,
            targetNewStudents: Number(st.targetNewStudents) || 0,
            note: st.note || '',
          })),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowStaffTargetModal(false);
        fetchMetrics();
        alert(json.message || 'Đã cập nhật chỉ tiêu nhân viên thành công!');
      } else {
        alert(json.message || 'Có lỗi xảy ra khi lưu chỉ tiêu.');
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi mạng khi lưu chỉ tiêu');
    } finally {
      setSavingStaffTargets(false);
    }
  };

  const trendData: any[] = metrics?.trendData || [];
  const branchBreakdown: any[] = metrics?.branchBreakdown || [];
  const subjectBreakdown: any[] = metrics?.subjectBreakdown || [];
  const recentActivities = metrics?.recentActivities || { orders: [], newStudents: [], completedEnrollments: [] };

  // Calculate maximum values for relative chart bars
  const maxRevenue = Math.max(...trendData.map((d) => d.revenue), 1);
  const maxStudents = Math.max(...trendData.map((d) => Math.max(d.newStudents, d.completedStudents)), 1);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header & Role Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Dashboard Thống Kê Hoạt Động & Kinh Doanh
                {loading && <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />}
              </h1>
              <p className="text-xs text-slate-500">
                Hiển thị số liệu trực quan theo chuỗi thời gian, phân quyền theo vai trò nhân sự
              </p>
            </div>
          </div>
        </div>

        {/* Role & Scope Indicator */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-900 text-xs flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-semibold">
              {isTeacher
                ? `Giáo Viên: ${currentUser?.fullName || 'Đang đăng nhập'}`
                : `Quản Trị / Quản Lý: ${currentUser?.fullName || 'Toàn quyền'}`}
            </span>
          </div>

          <button
            type="button"
            onClick={fetchMetrics}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Controls Toolbar (Lọc Theo Ngày / Tuần / Tháng / Cơ Sở) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Period Selector Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setPeriod('day')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                period === 'day' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Hôm Nay (Ngày)
            </button>
            <button
              type="button"
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                period === 'week' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Theo Tuần
            </button>
            <button
              type="button"
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                period === 'month' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Theo Tháng
            </button>
            <button
              type="button"
              onClick={() => setPeriod('year')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                period === 'year' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Theo Năm
            </button>
            <button
              type="button"
              onClick={() => setPeriod('custom')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                period === 'custom' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Tùy Chọn
            </button>
          </div>

          {/* Date Picker & Range Display */}
          <div className="flex items-center gap-2">
            {period !== 'custom' ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-500">Mốc tham chiếu:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-slate-800 outline-none"
                />
                <span className="text-slate-400">đến</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-slate-800 outline-none"
                />
              </div>
            )}

            {/* Date Range Badge */}
            {metrics?.meta?.dateRangeFormatted && (
              <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200/60 hidden md:inline-block">
                {metrics.meta.dateRangeFormatted}
              </span>
            )}
          </div>

          {/* Branch / Center Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="all">🏢 Tất Cả Trung Tâm (Tổng Thể)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    📍 {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Teacher Scope Toggle if user is Teacher */}
            {isTeacher && (
              <div className="flex items-center bg-indigo-50 border border-indigo-200 p-0.5 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setTeacherScope('mine')}
                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition ${
                    teacherScope === 'mine' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-700 hover:text-indigo-900'
                  }`}
                >
                  Lớp Của Tôi
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherScope('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition ${
                    teacherScope === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-700 hover:text-indigo-900'
                  }`}
                >
                  Cả Trung Tâm
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2.1 THỰC HIỆN CHỈ TIÊU & TỶ LỆ ĐÃ ĐẠT (TARGETS & ACHIEVEMENT PROGRESS) */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600/10 text-indigo-700 flex items-center justify-center">
              <Target className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Theo Dõi Chỉ Tiêu & Tỷ Lệ Đã Đạt Kỳ Này
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isTeacher && (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenStaffTargetModal('BY_ROLE')}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Giao Theo Vị Trí</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenStaffTargetModal('BY_STAFF')}
                  className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Chi Tiết Nhân Sự</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleOpenTargetModal}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer bg-white shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Định Mức Chung</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Progress Card 1: Chỉ tiêu doanh số */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">Chỉ Tiêu Doanh Số</span>
                    {targets.isAggregatedFromStaff ? (
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                        Cộng dồn từ {targets.assignedStaffCount} nhân sự
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        Định mức mặc định
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Mục tiêu kỳ: <strong className="text-slate-700">{Number(targets.periodTargetRevenue).toLocaleString('vi-VN')} đ</strong>
                  </div>
                </div>
              </div>

              {/* Tỷ lệ đã đạt Badge */}
              <div className="text-right">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black border ${
                    targets.revenueAchievementRate >= 100
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : targets.revenueAchievementRate >= 70
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}
                >
                  {targets.revenueAchievementRate >= 100 && <CheckCheck className="w-3.5 h-3.5 mr-1" />}
                  Đã đạt {targets.revenueAchievementRate}%
                </span>
              </div>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60 flex items-center">
                <div
                  style={{ width: `${Math.min(100, targets.revenueAchievementRate)}%` }}
                  className={`h-full rounded-full transition-all duration-700 shadow-xs ${
                    targets.revenueAchievementRate >= 100
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : targets.revenueAchievementRate >= 70
                      ? 'bg-gradient-to-r from-indigo-500 to-blue-600'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}
                />
              </div>
            </div>

            {/* 3 Metrics breakdown footer */}
            <div className="grid grid-cols-3 pt-2 border-t border-slate-100 text-xs gap-2">
              <div>
                <span className="text-slate-400 text-[11px] block">Thực thu:</span>
                <strong className="text-indigo-600 font-bold">{Number(summary.totalRevenue).toLocaleString('vi-VN')} đ</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Chỉ tiêu:</span>
                <strong className="text-slate-800 font-bold">{Number(targets.periodTargetRevenue).toLocaleString('vi-VN')} đ</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[11px] block">
                  {targets.revenueRemaining > 0 ? 'Còn thiếu:' : 'Vượt mục tiêu:'}
                </span>
                <strong
                  className={`font-bold ${
                    targets.revenueRemaining > 0 ? 'text-amber-600' : 'text-emerald-600'
                  }`}
                >
                  {targets.revenueRemaining > 0
                    ? `${Number(targets.revenueRemaining).toLocaleString('vi-VN')} đ`
                    : `+${targets.revenueAchievementRate - 100}% 🎉`}
                </strong>
              </div>
            </div>
          </div>

          {/* Progress Card 2: Chỉ tiêu bé mới */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">Chỉ Tiêu Bé Mới</span>
                    {targets.isAggregatedFromStaff ? (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                        Cộng dồn từ {targets.assignedStaffCount} nhân sự
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        Định mức mặc định
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Mục tiêu kỳ: <strong className="text-slate-700">{targets.periodTargetNewStudents} bé</strong>
                  </div>
                </div>
              </div>

              {/* Tỷ lệ đã đạt Badge */}
              <div className="text-right">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black border ${
                    targets.newStudentsAchievementRate >= 100
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : targets.newStudentsAchievementRate >= 70
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}
                >
                  {targets.newStudentsAchievementRate >= 100 && <CheckCheck className="w-3.5 h-3.5 mr-1" />}
                  Đã đạt {targets.newStudentsAchievementRate}%
                </span>
              </div>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60 flex items-center">
                <div
                  style={{ width: `${Math.min(100, targets.newStudentsAchievementRate)}%` }}
                  className={`h-full rounded-full transition-all duration-700 shadow-xs ${
                    targets.newStudentsAchievementRate >= 100
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : targets.newStudentsAchievementRate >= 70
                      ? 'bg-gradient-to-r from-indigo-500 to-blue-600'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}
                />
              </div>
            </div>

            {/* 3 Metrics breakdown footer */}
            <div className="grid grid-cols-3 pt-2 border-t border-slate-100 text-xs gap-2">
              <div>
                <span className="text-slate-400 text-[11px] block">Đã tuyển:</span>
                <strong className="text-amber-600 font-bold">{summary.newStudentsCount} bé</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Chỉ tiêu:</span>
                <strong className="text-slate-800 font-bold">{targets.periodTargetNewStudents} bé</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[11px] block">
                  {targets.newStudentsRemaining > 0 ? 'Còn thiếu:' : 'Vượt mục tiêu:'}
                </span>
                <strong
                  className={`font-bold ${
                    targets.newStudentsRemaining > 0 ? 'text-amber-600' : 'text-emerald-600'
                  }`}
                >
                  {targets.newStudentsRemaining > 0
                    ? `${targets.newStudentsRemaining} bé`
                    : `+${targets.newStudentsAchievementRate - 100}% 🎉`}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. The 4 Hero KPI Cards (Yêu Cầu Trọng Tâm) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Doanh Thu */}
        <div className="bg-gradient-to-br from-indigo-50/80 via-white to-white rounded-2xl p-5 border border-indigo-100 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              {isTeacher && teacherScope === 'mine' ? 'Doanh Thu Lớp Của Cô' : 'Doanh Thu Thực Thu'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {Number(summary.totalRevenue).toLocaleString('vi-VN')} <span className="text-sm font-semibold text-slate-500">đ</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {summary.revenueGrowth >= 0 ? (
                <span className="inline-flex items-center text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/50">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +{summary.revenueGrowth}%
                </span>
              ) : (
                <span className="inline-flex items-center text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200/50">
                  <TrendingDown className="w-3 h-3 mr-0.5" /> {summary.revenueGrowth}%
                </span>
              )}
              <span className="text-slate-400">so với kỳ trước</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 text-[11px] text-slate-500 gap-1">
            <div>Tổng đơn: <strong className="text-slate-700">{Number(summary.totalOrderValue).toLocaleString('vi-VN')} đ</strong></div>
            <div>Tỷ lệ thu: <strong className="text-indigo-600">{summary.paymentCollectionRate}%</strong></div>
          </div>
        </div>

        {/* Card 2: Học Viên Đang Học */}
        <div className="bg-gradient-to-br from-emerald-50/80 via-white to-white rounded-2xl p-5 border border-emerald-100 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              {isTeacher && teacherScope === 'mine' ? 'Học Viên Cô Đang Dạy' : 'Số Học Viên Đang Học'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {summary.activeStudentsCount} <span className="text-sm font-semibold text-slate-500">bé</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
              <span className="inline-flex items-center text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/50">
                <CheckCircle2 className="w-3 h-3 mr-0.5" /> Active
              </span>
              <span>{summary.activeEnrollmentsCount} lượt khóa đang học</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
            <span>Trạng thái học tập:</span>
            <strong className="text-emerald-700 font-semibold">Theo lộ trình 24 buổi</strong>
          </div>
        </div>

        {/* Card 3: Học Viên Hoàn Tất Khóa */}
        <div className="bg-gradient-to-br from-purple-50/80 via-white to-white rounded-2xl p-5 border border-purple-100 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
              {isTeacher && teacherScope === 'mine' ? 'Bé Hoàn Tất (Lớp Cô)' : 'Hoàn Tất Khóa Trong Kỳ'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-600/10 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {summary.completedStudentsCount} <span className="text-sm font-semibold text-slate-500">học viên</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className="inline-flex items-center text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200/50">
                <Sparkles className="w-3 h-3 mr-0.5" /> {summary.onTimeLevelUpCount} đúng hạn
              </span>
              <span className="text-slate-400">đạt chuẩn lên khoá</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
            <span>Tỷ lệ chuẩn 3 tháng:</span>
            <strong className="text-purple-700 font-semibold">
              {summary.completedStudentsCount > 0
                ? `${Math.round((summary.onTimeLevelUpCount / summary.completedStudentsCount) * 100)}%`
                : '100%'}
            </strong>
          </div>
        </div>

        {/* Card 4: Học Viên Mới Trong Kỳ */}
        <div className="bg-gradient-to-br from-amber-50/80 via-white to-white rounded-2xl p-5 border border-amber-100 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              {isTeacher && teacherScope === 'mine' ? 'Bé Mới Lớp Cô' : 'Học Viên Mới Trong Kỳ'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-600/10 text-amber-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {summary.newStudentsCount} <span className="text-sm font-semibold text-slate-500">bé mới</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {summary.newStudentsGrowth >= 0 ? (
                <span className="inline-flex items-center text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/50">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +{summary.newStudentsGrowth}%
                </span>
              ) : (
                <span className="inline-flex items-center text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200/50">
                  <TrendingDown className="w-3 h-3 mr-0.5" /> {summary.newStudentsGrowth}%
                </span>
              )}
              <span className="text-slate-400">so với kỳ trước</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
            <span>Thưởng HV Mới (NEW_STUDENT_BONUS):</span>
            <strong className="text-amber-700 font-semibold">200.000 đ/bé</strong>
          </div>
        </div>
      </div>

      {/* 3.1 BẢNG TIẾN ĐỘ THỰC HIỆN CHỈ TIÊU TỪNG NHÂN VIÊN (STAFF TARGET LEADERBOARD) */}
      {metrics?.staffLeaderboard && metrics.staffLeaderboard.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Bảng Tiến Độ Thực Hiện Chỉ Tiêu Từng Nhân Viên
              </h2>
              <p className="text-xs text-slate-500">
                Chỉ tiêu của từng nhân sự được giao hàng tháng, số tổng hợp bên trên tự động cộng dồn từ danh sách này
              </p>
            </div>

            {!isTeacher && (
              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleOpenStaffTargetModal('BY_ROLE')}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Giao Chỉ Tiêu Theo Vị Trí</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenStaffTargetModal('BY_STAFF')}
                  className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Chỉnh Sửa Từng Nhân Sự</span>
                </button>
              </div>
            )}
          </div>

          {/* Role Filter Pills for Leaderboard */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            <span className="text-slate-400 font-medium text-[11px] shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Lọc theo vị trí:
            </span>
            <button
              type="button"
              onClick={() => setLeaderboardRoleFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                leaderboardRoleFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất Cả ({metrics.staffLeaderboard.length})
            </button>
            {Object.keys(ROLE_DISPLAY_MAP).map((rKey) => {
              const count = metrics.staffLeaderboard.filter((s: any) => s.role === rKey).length;
              if (count === 0) return null;
              const meta = ROLE_DISPLAY_MAP[rKey];
              return (
                <button
                  key={rKey}
                  type="button"
                  onClick={() => setLeaderboardRoleFilter(rKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                    leaderboardRoleFilter === rKey
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {meta.shortLabel} ({count})
                </button>
              );
            })}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Nhân Viên</th>
                  <th className="py-2.5 px-3">Chi Nhánh / Vai Trò</th>
                  <th className="py-2.5 px-3">Chỉ Tiêu Doanh Số</th>
                  <th className="py-2.5 px-3">Thực Thu & % Đạt</th>
                  <th className="py-2.5 px-3">Chỉ Tiêu Bé Mới</th>
                  <th className="py-2.5 px-3">Đã Tuyển & % Đạt</th>
                  <th className="py-2.5 px-3 text-center">Đánh Giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.staffLeaderboard
                  .filter((st: any) => leaderboardRoleFilter === 'all' || st.role === leaderboardRoleFilter)
                  .map((st: any, idx: number) => {
                  return (
                    <tr key={st.userId} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-700 border border-amber-300'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-700'
                              : idx === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-xs">{st.fullName}</div>
                            <div className="text-[10px] text-slate-400">ID: {st.userId.slice(-6)}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-700">{st.branchName || 'Trung tâm'}</div>
                        <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 ${
                          st.role === 'TEACHER' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                          {st.role === 'TEACHER' ? 'Giáo Viên' : st.role === 'BRANCH_MANAGER' ? 'Quản Lý Cơ Sở' : st.role}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {st.targetRevenue > 0 ? (
                          <span>{Number(st.targetRevenue).toLocaleString('vi-VN')} đ</span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa giao</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] gap-2">
                            <strong className="text-indigo-600 font-bold">{Number(st.actualRevenue).toLocaleString('vi-VN')} đ</strong>
                            <span className="font-black text-slate-700">{st.revenueRate}%</span>
                          </div>
                          <div className="w-24 sm:w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, st.revenueRate)}%` }}
                              className={`h-full rounded-full transition-all ${
                                st.revenueRate >= 100
                                  ? 'bg-emerald-500'
                                  : st.revenueRate >= 70
                                  ? 'bg-indigo-600'
                                  : 'bg-amber-500'
                              }`}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {st.targetNewStudents > 0 ? (
                          <span>{st.targetNewStudents} bé</span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa giao</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] gap-2">
                            <strong className="text-amber-600 font-bold">{st.actualNewStudents} bé</strong>
                            <span className="font-black text-slate-700">{st.newStudentsRate}%</span>
                          </div>
                          <div className="w-24 sm:w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, st.newStudentsRate)}%` }}
                              className={`h-full rounded-full transition-all ${
                                st.newStudentsRate >= 100
                                  ? 'bg-emerald-500'
                                  : st.newStudentsRate >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-rose-400'
                              }`}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          st.overallRate >= 100
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : st.overallRate >= 80
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                            : st.overallRate >= 50
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}>
                          {st.overallRate >= 100 ? '🏆 Vượt mức' : st.overallRate >= 80 ? '🌟 Đạt khá' : st.overallRate >= 50 ? '📈 Đang tiến bộ' : '⚡ Cần nỗ lực'} ({st.overallRate}%)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Interactive Trend Chart (Biểu Đồ Trực Quan Theo Chuỗi Thời Gian) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Biểu Đồ Diễn Biến & Xu Hướng Theo {period === 'day' ? 'Giờ Trong Ngày' : period === 'week' ? 'Thứ Trong Tuần' : period === 'year' ? 'Tháng Trong Năm' : 'Giai Đoạn'}
            </h2>
            <p className="text-xs text-slate-500">
              So sánh tương quan giữa Doanh thu thực thu, Học viên mới nhập học và Học viên hoàn tất khóa
            </p>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveChartMetric('revenue')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeChartMetric === 'revenue'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3 h-3" />
              <span>Doanh Thu</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveChartMetric('newStudents')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeChartMetric === 'newStudents'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3 h-3" />
              <span>HV Mới</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveChartMetric('completedStudents')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeChartMetric === 'completedStudents'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3 h-3" />
              <span>Hoàn Tất</span>
            </button>
          </div>
        </div>

        {/* Visual Chart Canvas */}
        {trendData.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 italic">Chưa có dữ liệu thống kê trong kỳ này</div>
        ) : (
          <div className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-12 gap-3 items-end min-h-[220px]">
              {trendData.map((d, idx) => {
                const revHeight = maxRevenue > 0 ? Math.max(12, Math.round((d.revenue / maxRevenue) * 160)) : 12;
                const stuHeight = maxStudents > 0 ? Math.max(12, Math.round((d[activeChartMetric === 'revenue' ? 'newStudents' : activeChartMetric] / maxStudents) * 160)) : 12;

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 group flex-1">
                    {/* Tooltip on hover */}
                    <div className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-600 transition whitespace-nowrap">
                      {activeChartMetric === 'revenue'
                        ? `${(d.revenue / 1000000).toFixed(1)}Tr`
                        : `${d[activeChartMetric]} bé`}
                    </div>

                    {/* Bar visualization */}
                    <div className="w-full max-w-[42px] h-[160px] bg-slate-100 rounded-xl flex items-end justify-center p-1 relative overflow-hidden group-hover:bg-slate-200/70 transition">
                      {activeChartMetric === 'revenue' ? (
                        <div
                          style={{ height: `${revHeight}px` }}
                          className="w-full bg-gradient-to-t from-indigo-600 to-blue-500 rounded-lg transition-all duration-500 group-hover:from-indigo-700 group-hover:to-blue-600 shadow-xs"
                        />
                      ) : activeChartMetric === 'newStudents' ? (
                        <div
                          style={{ height: `${stuHeight}px` }}
                          className="w-full bg-gradient-to-t from-amber-500 to-yellow-400 rounded-lg transition-all duration-500 shadow-xs"
                        />
                      ) : (
                        <div
                          style={{ height: `${stuHeight}px` }}
                          className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-lg transition-all duration-500 shadow-xs"
                        />
                      )}
                    </div>

                    {/* Time Label */}
                    <div className="text-[11px] font-semibold text-slate-600 text-center truncate max-w-[80px]">
                      {d.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chart Legend */}
            <div className="mt-6 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-indigo-600 inline-block" /> Doanh Thu Thực Thu
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Học Viên Mới
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-purple-600 inline-block" /> Học Viên Hoàn Tất
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                ⚡ Dữ liệu cập nhật thời gian thực từ giao dịch POS & sổ điểm danh
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Center Comparison & Subject Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Trung Tâm / Cơ Sở (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                So Sánh Hoạt Động Giữa Các Trung Tâm (Cơ Sở)
              </h3>
              <p className="text-xs text-slate-500">Phân tích hiệu quả tuyển sinh và doanh thu từng chi nhánh</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
              {branchBreakdown.length} Chi Nhánh
            </span>
          </div>

          <div className="space-y-3">
            {branchBreakdown.map((b) => {
              const revPercent = summary.totalRevenue > 0 ? Math.round((b.revenue / summary.totalRevenue) * 100) : 0;

              return (
                <div
                  key={b.branchId}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{b.branchName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                        {b.branchCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Đang học: <strong className="text-emerald-700">{b.activeStudents} bé</strong></span>
                      <span>•</span>
                      <span>Hoàn tất: <strong className="text-purple-700">{b.completedStudents} bé</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {Number(b.revenue).toLocaleString('vi-VN')} đ
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">{revPercent}% tổng doanh thu</div>
                    </div>
                    <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden shrink-0">
                      <div
                        style={{ width: `${revPercent}%` }}
                        className="bg-indigo-600 h-full rounded-full"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {branchBreakdown.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400 italic">Không có dữ liệu chi nhánh</div>
            )}
          </div>
        </div>

        {/* Right Column: Phân Bổ Môn Học & Học Phẩm (1 col) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-600" />
              Cơ Cấu Môn Học & Dịch Vụ
            </h3>
            <p className="text-xs text-slate-500">Tỷ trọng Toán Trí Tuệ vs Kỹ Năng Sống</p>
          </div>

          <div className="space-y-4 pt-1">
            {subjectBreakdown.map((s, idx) => {
              const colorClasses = [
                'bg-blue-600 text-blue-600',
                'bg-purple-600 text-purple-600',
                'bg-amber-600 text-amber-600',
              ][idx % 3];

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${colorClasses.split(' ')[0]}`} />
                      {s.name}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {Number(s.revenue).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${summary.totalRevenue > 0 ? Math.min(100, Math.round((s.revenue / summary.totalRevenue) * 100)) : 33}%`,
                      }}
                      className={`h-full rounded-full ${colorClasses.split(' ')[0]}`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Quy mô: {s.count} lượt</span>
                    <span>
                      {summary.totalRevenue > 0 ? `${Math.round((s.revenue / summary.totalRevenue) * 100)}%` : '0%'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              Mục Tiêu SRS v2.0
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Duy trì tỷ lệ lên khóa Toán Trí Tuệ &gt; 80% đúng hạn 3 tháng tiêu chuẩn để đảm bảo tối ưu hóa quỹ thưởng giáo viên.
            </p>
          </div>
        </div>
      </div>

      {/* 6. Recent Real-time Activity Streams */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Nhật Ký Giao Dịch & Hoạt Động Mới Nhất
            </h3>
            <p className="text-xs text-slate-500">Cập nhật nhanh các giao dịch thu tiền, học viên nhập học và tốt nghiệp</p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setRecentTab('orders')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                recentTab === 'orders' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Phiếu Thu Gần Đây ({recentActivities.orders?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setRecentTab('newStudents')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                recentTab === 'newStudents' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Học Viên Mới ({recentActivities.newStudents?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setRecentTab('completed')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                recentTab === 'completed' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hoàn Tất Khóa ({recentActivities.completedEnrollments?.length || 0})
            </button>
          </div>
        </div>

        {/* Orders Tab */}
        {recentTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-3 font-semibold">Mã Đơn / Phiếu Thu</th>
                  <th className="p-3 font-semibold">Học Viên</th>
                  <th className="p-3 font-semibold">Cơ Sở</th>
                  <th className="p-3 font-semibold text-right">Đã Thu</th>
                  <th className="p-3 font-semibold text-right">Tổng Đơn</th>
                  <th className="p-3 font-semibold text-center">Trạng Thái</th>
                  <th className="p-3 font-semibold">Thu Ngân</th>
                  <th className="p-3 font-semibold text-right">Thời Gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentActivities.orders?.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-indigo-600">{ord.orderCode}</td>
                    <td className="p-3 font-semibold text-slate-800">{ord.student?.fullName || 'Khách vãng lai'}</td>
                    <td className="p-3 text-slate-600">{ord.branch?.name}</td>
                    <td className="p-3 font-bold text-emerald-600 text-right">
                      {Number(ord.paidAmount).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-3 text-slate-700 text-right">
                      {Number(ord.finalTotal).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.paymentStatus === 'PAID' ? 'Đã thu 100%' : 'Thu theo đợt'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{ord.cashierName || 'Thu ngân quầy'}</td>
                    <td className="p-3 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(ord.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
                {(!recentActivities.orders || recentActivities.orders.length === 0) && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                      Chưa có đơn hàng phát sinh trong kỳ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* New Students Tab */}
        {recentTab === 'newStudents' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-3 font-semibold">Mã Học Viên</th>
                  <th className="p-3 font-semibold">Họ Và Tên</th>
                  <th className="p-3 font-semibold">Số Điện Thoại Phụ Huynh</th>
                  <th className="p-3 font-semibold">Khóa Đăng Ký</th>
                  <th className="p-3 font-semibold text-right">Ngày Nhập Học</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentActivities.newStudents?.map((st: any) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-indigo-600">{st.studentCode}</td>
                    <td className="p-3 font-bold text-slate-800">{st.fullName}</td>
                    <td className="p-3 text-slate-600 font-mono">{st.parentPhone || '—'}</td>
                    <td className="p-3 text-slate-700">{st.courseName || st.branch?.name || 'Chính khóa'}</td>
                    <td className="p-3 text-right text-slate-500 font-mono text-[11px]">
                      {new Date(st.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
                {(!recentActivities.newStudents || recentActivities.newStudents.length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                      Chưa có học viên mới trong kỳ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Completed Tab */}
        {recentTab === 'completed' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-3 font-semibold">Mã Học Viên</th>
                  <th className="p-3 font-semibold">Học Viên Tốt Nghiệp</th>
                  <th className="p-3 font-semibold">Khóa Đào Tạo</th>
                  <th className="p-3 font-semibold text-center">Tiêu Chuẩn Đúng Hạn</th>
                  <th className="p-3 font-semibold text-right">Ngày Hoàn Tất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentActivities.completedEnrollments?.map((enr: any) => (
                  <tr key={enr.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-indigo-600">{enr.student?.studentCode}</td>
                    <td className="p-3 font-bold text-slate-800">{enr.student?.fullName}</td>
                    <td className="p-3 text-slate-700">{enr.course?.name}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          enr.isOnTimeLevelUp
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {enr.isOnTimeLevelUp ? '⚡ Đạt 3 Tháng (Thưởng KPI)' : 'Hoàn thành thường'}
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-500 font-mono text-[11px]">
                      {enr.completionDate ? new Date(enr.completionDate).toLocaleDateString('vi-VN') : '—'}
                    </td>
                  </tr>
                ))}
                {(!recentActivities.completedEnrollments || recentActivities.completedEnrollments.length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                      Chưa có học viên hoàn tất khóa trong kỳ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7. Target Configuration Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Cài Đặt Chỉ Tiêu Tháng</h3>
                  <p className="text-[11px] text-slate-500">
                    {isTeacher && teacherScope === 'mine' ? 'Thiết lập chỉ tiêu cho Giáo viên' : 'Thiết lập chỉ tiêu toàn hệ thống/trung tâm'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTargetModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTargets} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chỉ Tiêu Doanh Số Tháng (VNĐ):
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000000"
                  value={editingTargetRev}
                  onChange={(e) => setEditingTargetRev(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:border-indigo-500 outline-none"
                  placeholder="Ví dụ: 100000000"
                  required
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Định dạng: {Number(editingTargetRev).toLocaleString('vi-VN')} đ/tháng
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chỉ Tiêu Học Viên Mới Tháng (Bé):
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingTargetNew}
                  onChange={(e) => setEditingTargetNew(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:border-indigo-500 outline-none"
                  placeholder="Ví dụ: 30"
                  required
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Định dạng: {editingTargetNew} bé mới/tháng
                </span>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-800 leading-relaxed">
                💡 Hệ thống sẽ tự động quy đổi chỉ tiêu theo Ngày (÷26 ngày), Tuần (÷4 tuần) hoặc Năm (×12) khi bạn chuyển bộ lọc thời gian tương ứng.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingTarget}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer transition disabled:opacity-50"
                >
                  {savingTarget ? 'Đang Lưu...' : 'Lưu Chỉ Tiêu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GIAO CHỈ TIÊU HÀNG THÁNG CHO TỪNG NHÂN VIÊN & VỊ TRÍ */}
      {showStaffTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold shadow-xs">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    Thiết Lập & Giao Chỉ Tiêu Hàng Tháng
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      Giao Theo Vị Trí & Nhân Sự
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Linh hoạt giao theo từng vị trí (Sale, Giáo viên, Giáo vụ...) hoặc điều chỉnh chi tiết từng nhân sự
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowStaffTargetModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 text-lg font-bold flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {/* Filter Bar: Month, Year, Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 shrink-0">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Tháng Áp Dụng:</label>
                <select
                  value={staffTargetMonth}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    setStaffTargetMonth(m);
                    fetchStaffTargets(m, staffTargetYear, staffTargetBranchId);
                  }}
                  className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>Tháng {m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Năm:</label>
                <select
                  value={staffTargetYear}
                  onChange={(e) => {
                    const y = Number(e.target.value);
                    setStaffTargetYear(y);
                    fetchStaffTargets(staffTargetMonth, y, staffTargetBranchId);
                  }}
                  className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>Năm {y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Chi Nhánh / Cơ Sở:</label>
                <select
                  value={staffTargetBranchId}
                  onChange={(e) => {
                    const bId = e.target.value;
                    setStaffTargetBranchId(bId);
                    fetchStaffTargets(staffTargetMonth, staffTargetYear, bId);
                  }}
                  className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                >
                  <option value="all">🏢 Tất Cả Chi Nhánh</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>📍 {b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Tìm Nhân Sự:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={staffSearchQuery}
                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên..."
                    className="w-full bg-white border border-slate-200 pl-8 pr-3 py-1.5 rounded-xl text-xs font-medium text-slate-800 outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            {/* Modal Tabs Switcher */}
            <div className="flex items-center justify-between border-b border-slate-200 shrink-0 gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStaffTargetModalTab('BY_ROLE')}
                  className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                    staffTargetModalTab === 'BY_ROLE'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Giao Theo Từng Vị Trí</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                    Nhanh & Chuẩn Hóa
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStaffTargetModalTab('BY_STAFF')}
                  className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                    staffTargetModalTab === 'BY_STAFF'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Chi Tiết Từng Nhân Viên ({staffTargetList.length})</span>
                </button>
              </div>

              {appliedRoleToast && (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{appliedRoleToast}</span>
                </div>
              )}
            </div>

            {/* TAB 1: GIAO CHỈ TIÊU THEO TỪNG VỊ TRÍ */}
            {staffTargetModalTab === 'BY_ROLE' && (
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 min-h-[300px]">
                <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200/80 p-3 rounded-2xl text-xs text-blue-900">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      Nhập định mức chỉ tiêu chung cho từng vị trí, sau đó bấm <strong>"Áp Dụng Cho Vị Trí"</strong> để gán tự động cho tất cả nhân sự thuộc vị trí đó.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyAllRoleTargets}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 shadow-xs transition cursor-pointer flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Áp Dụng Cho Tất Cả Vị Trí</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {Object.keys(ROLE_DISPLAY_MAP).map((rKey) => {
                    const roleMeta = ROLE_DISPLAY_MAP[rKey];
                    const staffInRole = staffTargetList.filter((s) => s.role === rKey);
                    const currentInput = roleTargetInputs[rKey] || { targetRevenue: 0, targetNewStudents: 0 };
                    const subtotalRev = (Number(currentInput.targetRevenue) || 0) * staffInRole.length;
                    const subtotalNew = (Number(currentInput.targetNewStudents) || 0) * staffInRole.length;

                    return (
                      <div
                        key={rKey}
                        className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs hover:border-indigo-300 transition"
                      >
                        {/* Role Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${roleMeta.badgeClass}`}>
                              {roleMeta.shortLabel}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              ({staffInRole.length} nhân sự)
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleApplyRoleTarget(rKey)}
                            disabled={staffInRole.length === 0}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            <CheckCheck className="w-3 h-3" />
                            <span>Áp Dụng ({staffInRole.length})</span>
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-500 leading-tight">
                          {roleMeta.desc}
                        </p>

                        {/* Inputs: Target Revenue & New Students */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                              Doanh Số / Người:
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1000000"
                              value={currentInput.targetRevenue}
                              onChange={(e) =>
                                handleUpdateRoleTargetInput(rKey, 'targetRevenue', Number(e.target.value))
                              }
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-indigo-700 outline-none focus:border-indigo-500"
                            />
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                              {Number(currentInput.targetRevenue || 0).toLocaleString('vi-VN')} đ
                            </span>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                              Bé Mới / Người:
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={currentInput.targetNewStudents}
                              onChange={(e) =>
                                handleUpdateRoleTargetInput(rKey, 'targetNewStudents', Number(e.target.value))
                              }
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-amber-700 outline-none focus:border-indigo-500"
                            />
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                              {currentInput.targetNewStudents || 0} học viên
                            </span>
                          </div>
                        </div>

                        {/* Presets */}
                        {roleMeta.presets && roleMeta.presets.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap pt-1">
                            <span className="text-[10px] text-slate-400 font-semibold mr-0.5">Gợi ý:</span>
                            {roleMeta.presets.map((p, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => {
                                  handleUpdateRoleTargetInput(rKey, 'targetRevenue', p.rev);
                                  handleUpdateRoleTargetInput(rKey, 'targetNewStudents', p.newSt);
                                }}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Role Subtotal calculation preview */}
                        <div className="bg-slate-50 p-2 rounded-xl text-[11px] flex items-center justify-between text-slate-600 font-medium border border-slate-100">
                          <span>Tổng {staffInRole.length} nhân sự vị trí này:</span>
                          <span className="font-bold text-slate-800">
                            <strong className="text-indigo-600">{subtotalRev.toLocaleString('vi-VN')} đ</strong> •{' '}
                            <strong className="text-amber-600">{subtotalNew} bé</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: CHI TIẾT TỪNG NHÂN VIÊN */}
            {staffTargetModalTab === 'BY_STAFF' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                {/* Role Filter & Quick Presets */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs shrink-0">
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Filter className="w-3 h-3" /> Lọc vị trí:
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalRoleFilter('all')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
                        modalRoleFilter === 'all'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Tất cả ({staffTargetList.length})
                    </button>
                    {Object.keys(ROLE_DISPLAY_MAP).map((rKey) => {
                      const count = staffTargetList.filter((s) => s.role === rKey).length;
                      if (count === 0) return null;
                      return (
                        <button
                          key={rKey}
                          type="button"
                          onClick={() => setModalRoleFilter(rKey)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition whitespace-nowrap cursor-pointer ${
                            modalRoleFilter === rKey
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {ROLE_DISPLAY_MAP[rKey]?.shortLabel || rKey} ({count})
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(0, 0)}
                      className="px-2 py-0.5 rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[10px] font-bold text-rose-700 cursor-pointer"
                    >
                      Xóa tất cả về 0
                    </button>
                  </div>
                </div>

                {/* Staff Target Table (Scrollable) */}
                <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl min-h-[250px]">
                  {loadingStaffTargets ? (
                    <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                      <span>Đang tải danh sách nhân viên và chỉ tiêu...</span>
                    </div>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold sticky top-0 z-10 uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Nhân Viên</th>
                          <th className="py-2.5 px-3">Chi Nhánh</th>
                          <th className="py-2.5 px-3 w-48">Chỉ Tiêu Doanh Số (VNĐ)</th>
                          <th className="py-2.5 px-3 w-32">Chỉ Tiêu Bé Mới</th>
                          <th className="py-2.5 px-3">Ghi Chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {staffTargetList
                          .filter((st) => {
                            if (modalRoleFilter !== 'all' && st.role !== modalRoleFilter) return false;
                            if (!staffSearchQuery) return true;
                            const q = staffSearchQuery.toLowerCase();
                            return (
                              st.fullName?.toLowerCase().includes(q) ||
                              st.phone?.includes(q) ||
                              st.branchName?.toLowerCase().includes(q)
                            );
                          })
                          .map((st) => {
                            const meta = ROLE_DISPLAY_MAP[st.role];
                            return (
                              <tr key={st.userId} className="hover:bg-indigo-50/20 transition">
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-slate-800 text-xs">{st.fullName}</div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                    <span>{st.phone || 'Chưa có SĐT'}</span>
                                    <span className={`px-1.5 py-0.2 rounded font-semibold border ${meta ? meta.badgeClass : 'bg-slate-100 text-slate-600'}`}>
                                      {meta ? meta.shortLabel : st.role}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 text-slate-600 font-medium">
                                  {st.branchName || 'Trung tâm'}
                                </td>

                                <td className="py-2.5 px-3">
                                  <div>
                                    <input
                                      type="number"
                                      min="0"
                                      step="500000"
                                      value={st.targetRevenue || 0}
                                      onChange={(e) =>
                                        handleUpdateStaffTarget(st.userId, 'targetRevenue', Number(e.target.value))
                                      }
                                      className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-bold text-indigo-700 outline-none focus:border-indigo-500"
                                    />
                                    <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                                      {Number(st.targetRevenue || 0).toLocaleString('vi-VN')} đ
                                    </span>
                                  </div>
                                </td>

                                <td className="py-2.5 px-3">
                                  <div>
                                    <input
                                      type="number"
                                      min="0"
                                      value={st.targetNewStudents || 0}
                                      onChange={(e) =>
                                        handleUpdateStaffTarget(st.userId, 'targetNewStudents', Number(e.target.value))
                                      }
                                      className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-bold text-amber-700 outline-none focus:border-indigo-500"
                                    />
                                    <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                                      {st.targetNewStudents || 0} bé
                                    </span>
                                  </div>
                                </td>

                                <td className="py-2.5 px-3">
                                  <input
                                    type="text"
                                    value={st.note || ''}
                                    onChange={(e) => handleUpdateStaffTarget(st.userId, 'note', e.target.value)}
                                    placeholder="Ghi chú thêm..."
                                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-indigo-500"
                                  />
                                </td>
                              </tr>
                            );
                          })}

                        {staffTargetList.length === 0 && !loadingStaffTargets && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                              Không tìm thấy nhân viên nào đang hoạt động thuộc chi nhánh này.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Real-time Center Total Box (Tổng Hợp Tự Động) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-purple-50/80 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-indigo-950 uppercase tracking-tight">
                    Tổng Chỉ Tiêu Toàn Cơ Sở (Tháng {staffTargetMonth}/{staffTargetYear})
                  </div>
                  <div className="text-[11px] text-indigo-700">
                    Cộng dồn tự động từ <strong>{staffTargetList.length}</strong> nhân sự
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 divide-x divide-indigo-200/80">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Tổng Doanh Số:</span>
                  <span className="text-base font-black text-indigo-700">
                    {staffTargetList
                      .reduce((sum, item) => sum + (Number(item.targetRevenue) || 0), 0)
                      .toLocaleString('vi-VN')}{' '}
                    đ
                  </span>
                </div>
                <div className="pl-4 text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Tổng Bé Mới:</span>
                  <span className="text-base font-black text-amber-600">
                    {staffTargetList.reduce((sum, item) => sum + (Number(item.targetNewStudents) || 0), 0)} bé
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <form onSubmit={handleSaveStaffTargets} className="flex items-center justify-between pt-2 border-t border-slate-100 shrink-0">
              <span className="text-xs text-slate-500">
                Đã cấu hình cho <strong>{staffTargetList.length}</strong> nhân sự
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowStaffTargetModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={savingStaffTargets || loadingStaffTargets}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingStaffTargets ? 'Đang Lưu...' : 'Lưu Tất Cả Chỉ Tiêu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
