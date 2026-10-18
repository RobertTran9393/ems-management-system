import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import {
  ShieldCheck,
  Building2,
  Users,
  Settings,
  Sliders,
  Plus,
  RefreshCw,
  CheckCircle,
  Database,
  UserPlus,
  MapPin,
  Clock,
  Briefcase,
  Trash2,
  Filter,
  Tag,
  BookOpen,
  Package,
  Layers,
  Boxes,
  Coins,
  Edit3
} from 'lucide-react';

const BUSINESS_DOMAINS: Record<string, { label: string; color: string; desc: string; placeholderKey: string }> = {
  PAYROLL: {
    label: 'BẢNG LƯƠNG & KPI',
    color: 'bg-amber-50 text-amber-800 border-amber-300',
    desc: 'Gán vào công thức tính bảng lương & hoa hồng giáo viên/sale',
    placeholderKey: 'VD: THUONG_CHUYEN_CAN_GV',
  },
  ACADEMIC: {
    label: 'ĐÀO TẠO & GIÁO VỤ',
    color: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    desc: 'Gán vào quy chế đào tạo, hạn 24 buổi và bảo lưu',
    placeholderKey: 'VD: SO_BUOI_TOI_THIEU_TEST',
  },
  POS: {
    label: 'POS & HỌC PHÍ',
    color: 'bg-blue-50 text-blue-800 border-blue-300',
    desc: 'Gán vào quy trình thu ngân, biểu phí và bán hàng',
    placeholderKey: 'VD: PHU_THU_GIAO_TRINH',
  },
  GENERAL: {
    label: 'QUẢN TRỊ & KHÁC',
    color: 'bg-slate-100 text-slate-700 border-slate-300',
    desc: 'Cấu hình tham số hệ thống chung',
    placeholderKey: 'VD: BAN_KINH_CHAM_CONG_MAC_DINH',
  },
};

export function AdminScreen() {
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'USERS' | 'BRANCHES' | 'COURSES' | 'PRODUCTS' | 'CONFIGS'>('OVERVIEW');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [combos, setCombos] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [configFilter, setConfigFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form states for creating user
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'TEACHER',
    contractType: 'FULLTIME',
    baseSalary: 12000000,
    hourlyTeachingRate: 100000,
    branchId: '',
  });

  // Form state for creating branch
  const [newBranch, setNewBranch] = useState({
    code: '',
    name: '',
    address: '',
    gpsLatitude: 21.033333,
    gpsLongitude: 105.799999,
    gpsRadiusMeters: 200,
  });

  // Form state for creating new custom config
  const [newConfig, setNewConfig] = useState({
    key: '',
    value: '',
    category: 'PAYROLL',
    description: '',
  });

  // Form state for creating course
  const [newCourse, setNewCourse] = useState({
    courseCode: '',
    name: '',
    subjectType: 'TOAN_TRI_TUE',
    levelOrder: 1,
    tuitionFee: 3600000,
    totalSessions: 24,
    standardMonths: 3,
    maxMonths: 4,
  });

  // Form state for creating product
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    unit: 'Quyển',
    costPrice: 80000,
    sellingPrice: 150000,
    initialQty: 50,
    branchId: '',
  });

  // Stock adjustment state
  const [adjustingProduct, setAdjustingProduct] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState<number>(10);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, branchesRes, configsRes, coursesRes, combosRes, productsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/core/stats`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE_URL}/api/core/users`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE_URL}/api/core/branches`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE_URL}/api/core/configs`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE_URL}/api/catalog/courses`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE_URL}/api/catalog/combos`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE_URL}/api/inventory/products`).then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (branchesRes.success) {
        setBranches(branchesRes.data);
        if (branchesRes.data.length > 0) {
          if (!newUser.branchId) setNewUser((prev) => ({ ...prev, branchId: branchesRes.data[0].id }));
          if (!newProduct.branchId) setNewProduct((prev) => ({ ...prev, branchId: branchesRes.data[0].id }));
        }
      }
      if (configsRes.success) setConfigs(configsRes.data);
      if (coursesRes.success) setCourses(coursesRes.data);
      if (combosRes.success) setCombos(combosRes.data);
      if (productsRes.success) setProducts(productsRes.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/core/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Đã thêm nhân sự mới thành công! Mật khẩu mặc định: 123456');
        setNewUser({
          fullName: '',
          email: '',
          phone: '',
          role: 'TEACHER',
          contractType: 'FULLTIME',
          baseSalary: 12000000,
          hourlyTeachingRate: 100000,
          branchId: branches[0]?.id || '',
        });
        fetchData();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/core/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBranch),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Đã thêm cơ sở mới thành công!');
        setNewBranch({
          code: '',
          name: '',
          address: '',
          gpsLatitude: 21.033333,
          gpsLongitude: 105.799999,
          gpsRadiusMeters: 200,
        });
        fetchData();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (key: string, value: string, description?: string, category?: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/core/configs/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, description, category }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Đã cập nhật tham số ${key} = ${value} thành công!`);
        await fetchData();
      } else {
        alert(data.message || 'Lỗi khi cập nhật cấu hình');
      }
    } catch (err: any) {
      alert(`Lỗi kết nối máy chủ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfig = async (key: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xoá tham số "${key}" khỏi hệ thống?`)) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/core/configs/${key}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Đã xoá tham số ${key} thành công!`);
        await fetchData();
      } else {
        alert(data.message || 'Lỗi khi xoá tham số');
      }
    } catch (err: any) {
      alert(`Lỗi kết nối máy chủ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Course Handlers
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/catalog/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Đã tạo khóa học "${data.data.name}" thành công!`);
        setNewCourse({
          courseCode: '',
          name: '',
          subjectType: 'TOAN_TRI_TUE',
          levelOrder: courses.length + 1,
          tuitionFee: 3600000,
          totalSessions: 24,
          standardMonths: 3,
          maxMonths: 4,
        });
        await fetchData();
      } else {
        alert(data.message || 'Lỗi khi tạo khóa học');
      }
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async (id: string, updateData: any) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/catalog/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Cập nhật khóa học thành công!');
        await fetchData();
      } else {
        alert(data.message || 'Lỗi khi cập nhật khóa học');
      }
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn ngưng hoạt động khóa học "${name}"?`)) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/catalog/courses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMessage(`Đã ngưng khóa học "${name}" thành công!`);
        await fetchData();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Product Handlers
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/inventory/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Đã thêm sản phẩm "${data.data.name}" thành công!`);
        setNewProduct({
          sku: '',
          name: '',
          unit: 'Quyển',
          costPrice: 80000,
          sellingPrice: 150000,
          initialQty: 50,
          branchId: branches[0]?.id || '',
        });
        await fetchData();
      } else {
        alert(data.message || 'Lỗi khi tạo sản phẩm');
      }
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (id: string, updateData: any) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/inventory/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Cập nhật sản phẩm thành công!');
        await fetchData();
      } else {
        alert(data.message || 'Lỗi khi cập nhật sản phẩm');
      }
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (productId: string, branchId: string, changeQty: number) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/inventory/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          branchId,
          changeQty,
          actionType: 'RESTOCK',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Cập nhật tồn kho thành công!');
        setAdjustingProduct(null);
        await fetchData();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            Quản Trị Hệ Thống & Cài Đặt Trung Tâm
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý danh sách nhân sự, phân quyền vai trò, mạng lưới cơ sở & định mức tài chính KPI (SRS v2.0)
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* Success Notification */}
      {message && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Admin Subtabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('OVERVIEW')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'OVERVIEW'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Tổng Quan</span>
        </button>

        <button
          onClick={() => setActiveSubTab('COURSES')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'COURSES'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Cài Đặt Khóa Học ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PRODUCTS')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'PRODUCTS'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Cài Đặt Sản Phẩm ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('USERS')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'USERS'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Tài Khoản & Nhân Sự ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('BRANCHES')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'BRANCHES'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Mạng Lưới Cơ Sở ({branches.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('CONFIGS')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'CONFIGS'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Tham Số & KPI ({configs.length})</span>
        </button>
      </div>

      {/* Subtab 1: Overview */}
      {activeSubTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Nhân Sự</div>
              <div className="text-3xl font-black text-slate-900 mt-2">{stats?.totalUsers || users.length}</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">Đang hoạt động trên hệ thống</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Học Viên</div>
              <div className="text-3xl font-black text-indigo-600 mt-2">{stats?.totalStudents || 0}</div>
              <div className="text-[11px] text-slate-400 mt-1">Hồ sơ học viên đã đăng ký</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Đơn Hàng POS</div>
              <div className="text-3xl font-black text-blue-600 mt-2">{stats?.totalOrders || 0}</div>
              <div className="text-[11px] text-blue-500 mt-1">Giao dịch thu học phí & giáo cụ</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Số Lớp Đang Mở</div>
              <div className="text-3xl font-black text-amber-600 mt-2">{stats?.totalClasses || 0}</div>
              <div className="text-[11px] text-amber-600 mt-1">Lớp học Soroban & Kỹ năng sống</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg">
            <h3 className="font-bold text-base mb-1">Trạng Thái Hạ Tầng Máy Chủ (Cloud Production)</h3>
            <p className="text-xs text-indigo-200 mb-4">
              Hệ thống đang chạy kiến trúc Modular Monolith trên đám mây với cơ sở dữ liệu PostgreSQL bảo mật.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-white/10 rounded-xl">
                <span className="text-indigo-300 block mb-1">Cơ sở dữ liệu:</span>
                <span className="font-semibold text-white">PostgreSQL 16 Cloud Active</span>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <span className="text-indigo-300 block mb-1">Phiên bản EMS:</span>
                <span className="font-semibold text-white">v2.0.0 (Modular Monolith)</span>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <span className="text-indigo-300 block mb-1">Bảo mật API:</span>
                <span className="font-semibold text-emerald-400">HTTPS SSL + JWT Enabled</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab: Courses & Tuition Settings */}
      {activeSubTab === 'COURSES' && (
        <div className="space-y-6">
          {/* Form thêm khóa học mới */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Cài Đặt & Thêm Khóa Học Mới
                </h2>
                <span className="text-xs text-slate-500">Khóa học sẽ hiển thị ngay trên POS Thu Ngân & Phân Lớp Giáo Vụ</span>
              </div>
            </div>

            <form onSubmit={handleCreateCourse} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Mã Khóa Học (In hoa)</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: SOROBAN-03"
                    value={newCourse.courseCode}
                    onChange={(e) => setNewCourse({ ...newCourse, courseCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase bg-white focus:outline-none focus:border-indigo-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tên Khóa Học</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Toán Trí Tuệ Soroban Cấp Độ 3"
                    value={newCourse.name}
                    onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Phân Loại Bộ Môn</label>
                  <select
                    value={newCourse.subjectType}
                    onChange={(e) => setNewCourse({ ...newCourse, subjectType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-indigo-600 font-semibold"
                  >
                    <option value="TOAN_TRI_TUE">🧮 Toán Trí Tuệ (Soroban)</option>
                    <option value="KY_NANG_SONG">🌱 Kỹ Năng Sống</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Học Phí Niêm Yết (VNĐ)</label>
                  <input
                    type="number"
                    step="10000"
                    required
                    placeholder="VD: 3600000"
                    value={newCourse.tuitionFee}
                    onChange={(e) => setNewCourse({ ...newCourse, tuitionFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-indigo-600 font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Cấp Độ (Level Order)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCourse.levelOrder}
                    onChange={(e) => setNewCourse({ ...newCourse, levelOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Quy Chuẩn Số Buổi</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCourse.totalSessions}
                    onChange={(e) => setNewCourse({ ...newCourse, totalSessions: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kỳ Hạn Chuẩn (Tháng)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCourse.standardMonths}
                    onChange={(e) => setNewCourse({ ...newCourse, standardMonths: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo Khóa Học Mới</span>
                </button>
              </div>
            </form>
          </div>

          {/* Danh sách Khóa Học */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800">Danh Sách Khóa Học & Biểu Phí Đang Áp Dụng</h3>
              <span className="text-xs text-slate-500 font-medium">{courses.length} khóa học</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-3.5">Mã Khóa</th>
                    <th className="p-3.5">Tên Khóa Học</th>
                    <th className="p-3.5">Bộ Môn</th>
                    <th className="p-3.5 text-center">Cấp Độ</th>
                    <th className="p-3.5 text-center">Lộ Trình</th>
                    <th className="p-3.5 text-right">Học Phí Niêm Yết (VNĐ)</th>
                    <th className="p-3.5 text-center">Trạng Thái</th>
                    <th className="p-3.5 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses.map((course) => (
                    <tr key={course.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{course.courseCode}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{course.name}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          course.subjectType === 'TOAN_TRI_TUE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {course.subjectType === 'TOAN_TRI_TUE' ? 'Toán Trí Tuệ' : 'Kỹ Năng Sống'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-indigo-600">Level {course.levelOrder}</td>
                      <td className="p-3.5 text-center text-slate-600">
                        {course.totalSessions} buổi / {course.standardMonths} tháng
                      </td>
                      <td className="p-3.5 text-right">
                        <input
                          type="number"
                          step="10000"
                          defaultValue={Number(course.tuitionFee)}
                          onBlur={(e) => {
                            if (Number(e.target.value) !== Number(course.tuitionFee)) {
                              handleUpdateCourse(course.id, { tuitionFee: Number(e.target.value) });
                            }
                          }}
                          className="w-32 px-2.5 py-1 text-right border border-slate-300 rounded-lg font-bold text-indigo-700 bg-white focus:outline-none focus:border-indigo-600 shadow-sm"
                          title="Sửa học phí rồi rời chuột để lưu"
                        />
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {course.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(course.id, course.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Ngưng kích hoạt khóa học"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab: Products & Inventory Settings */}
      {activeSubTab === 'PRODUCTS' && (
        <div className="space-y-6">
          {/* Form thêm sản phẩm mới */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  Cài Đặt & Thêm Sản Phẩm / Giáo Cụ Mới
                </h2>
                <span className="text-xs text-slate-500">Giáo trình, bàn tính, đồng phục, phụ kiện phục vụ học tập</span>
              </div>
            </div>

            <form onSubmit={handleCreateProduct} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Mã SKU (In hoa)</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: BOOK-SB2"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase bg-white focus:outline-none focus:border-indigo-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tên Sản Phẩm / Giáo Cụ</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Sách Giáo Trình Soroban Cấp 2"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Đơn Vị Tính</label>
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-indigo-600 font-semibold"
                  >
                    <option value="Quyển">Quyển (Sách, giáo trình)</option>
                    <option value="Cái">Cái (Bàn tính, thước kẻ)</option>
                    <option value="Bộ">Bộ (Đồng phục, combo cụ)</option>
                    <option value="Chiếc">Chiếc (Balo, túi xách)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Cơ Sở Nhập Kho Đầu Kỳ</label>
                  <select
                    value={newProduct.branchId}
                    onChange={(e) => setNewProduct({ ...newProduct, branchId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-indigo-600 font-semibold"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Giá Vốn Nhập Kho (VNĐ)</label>
                  <input
                    type="number"
                    step="5000"
                    required
                    value={newProduct.costPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Giá Bán Niêm Yết Lẻ (VNĐ)</label>
                  <input
                    type="number"
                    step="5000"
                    required
                    value={newProduct.sellingPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Số Lượng Nhập Ban Đầu</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newProduct.initialQty}
                    onChange={(e) => setNewProduct({ ...newProduct, initialQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Lưu Sản Phẩm Mới</span>
                </button>
              </div>
            </form>
          </div>

          {/* Danh sách Sản Phẩm & Tồn Kho */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800">Danh Mục Sản Phẩm & Tồn Kho Chi Nhánh</h3>
              <span className="text-xs text-slate-500 font-medium">{products.length} mặt hàng</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-3.5">Mã SKU</th>
                    <th className="p-3.5">Tên Sản Phẩm</th>
                    <th className="p-3.5 text-center">ĐVT</th>
                    <th className="p-3.5 text-right">Giá Vốn (VNĐ)</th>
                    <th className="p-3.5 text-right">Giá Bán Niêm Yết (VNĐ)</th>
                    <th className="p-3.5 text-center">Tồn Kho</th>
                    <th className="p-3.5 text-center">Trạng Thái</th>
                    <th className="p-3.5 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((prod) => {
                    const totalQty = prod.branchStocks?.reduce((acc: number, curr: any) => acc + curr.quantity, 0) || 0;
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 font-mono font-bold text-slate-900">{prod.sku}</td>
                        <td className="p-3.5 font-semibold text-slate-800">{prod.name}</td>
                        <td className="p-3.5 text-center text-slate-600">{prod.unit}</td>
                        <td className="p-3.5 text-right">
                          <input
                            type="number"
                            step="5000"
                            defaultValue={Number(prod.costPrice)}
                            onBlur={(e) => {
                              if (Number(e.target.value) !== Number(prod.costPrice)) {
                                handleUpdateProduct(prod.id, { costPrice: Number(e.target.value) });
                              }
                            }}
                            className="w-28 px-2 py-1 text-right border border-slate-300 rounded-lg text-slate-700 bg-white focus:outline-none focus:border-indigo-600"
                            title="Sửa giá vốn rồi rời chuột để lưu"
                          />
                        </td>
                        <td className="p-3.5 text-right">
                          <input
                            type="number"
                            step="5000"
                            defaultValue={Number(prod.sellingPrice)}
                            onBlur={(e) => {
                              if (Number(e.target.value) !== Number(prod.sellingPrice)) {
                                handleUpdateProduct(prod.id, { sellingPrice: Number(e.target.value) });
                              }
                            }}
                            className="w-28 px-2 py-1 text-right border border-slate-300 rounded-lg font-bold text-indigo-700 bg-white focus:outline-none focus:border-indigo-600 shadow-sm"
                            title="Sửa giá bán rồi rời chuột để lưu"
                          />
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            totalQty > 10 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {totalQty} {prod.unit}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {prod.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const qtyStr = prompt(`Nhập số lượng bổ sung vào kho cho "${prod.name}":`, '10');
                              if (qtyStr && !isNaN(Number(qtyStr)) && branches.length > 0) {
                                handleAdjustStock(prod.id, branches[0].id, Number(qtyStr));
                              }
                            }}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            + Nhập Kho
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Users Management */}
      {activeSubTab === 'USERS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-800">Danh Sách Nhân Viên & Phân Quyền</h2>
              <span className="text-xs text-slate-500 font-medium">{users.length} tài khoản</span>
            </div>

            <div className="divide-y divide-slate-100">
              {users.map((u) => (
                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm">
                      {u.fullName.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-900">{u.fullName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{u.email}</span>
                        <span>•</span>
                        <span>{u.phone || 'Chưa cập nhật SĐT'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {u.role}
                    </span>
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      {u.branch?.name || 'Toàn hệ thống'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add User Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              Thêm Tài Khoản Nhân Sự
            </h2>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Họ Và Tên</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Văn An"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Email Đăng Nhập</label>
                <input
                  type="email"
                  required
                  placeholder="an.hoang@sbr.edu.vn"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Số Điện Thoại</label>
                <input
                  type="tel"
                  placeholder="0912345678"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Vai Trò</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 bg-white"
                  >
                    <option value="TEACHER">Giáo Viên</option>
                    <option value="ACCOUNTANT">Kế Toán</option>
                    <option value="ACADEMIC_AFFAIRS">Giáo Vụ</option>
                    <option value="SALE">Tư Vấn Tuyển Sinh</option>
                    <option value="ADMIN">Quản Trị Viên</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Cơ Sở</label>
                  <select
                    value={newUser.branchId}
                    onChange={(e) => setNewUser({ ...newUser, branchId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 bg-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow transition cursor-pointer"
                >
                  Tạo Tài Khoản (Pass: 123456)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subtab 3: Branches Management */}
      {activeSubTab === 'BRANCHES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {branches.map((b) => (
              <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-xs font-bold">
                      {b.code}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{b.name}</h3>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                    Đang hoạt động
                  </span>
                </div>

                <div className="text-xs text-slate-600 flex items-center gap-1.5 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{b.address}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Tọa độ GPS:</span>
                    <span className="font-mono text-slate-800 font-medium">
                      {Number(b.gpsLatitude).toFixed(4)}, {Number(b.gpsLongitude).toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Bán kính chấm công:</span>
                    <span className="font-semibold text-indigo-600">{b.gpsRadiusMeters}m (Haversine)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Quy mô hiện tại:</span>
                    <span className="font-medium text-slate-800">
                      {b._count?.students || 0} học viên • {b._count?.classes || 0} lớp
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Branch Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Thêm Cơ Sở Đào Tạo Mới
            </h2>

            {/* Google Maps Link / Coordinate Helper */}
            <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200">
              <div className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Lấy Tọa Độ Chuẩn Từ Google Maps:
              </div>
              <p className="text-[10px] text-blue-700 mb-2 leading-relaxed">
                Dán đường link Google Maps hoặc chuỗi tọa độ (ví dụ: <code className="bg-white px-1 py-0.5 rounded font-mono">21.033333, 105.799999</code>) vào ô dưới đây để hệ thống tự động trích xuất:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Dán link hoặc tọa độ Google Maps vào đây..."
                  onChange={(e) => {
                    const text = e.target.value.trim();
                    // Match coordinates like 21.033333, 105.799999 or @21.033333,105.799999
                    const match = text.match(/@?(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || text.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
                    if (match) {
                      setNewBranch((prev) => ({
                        ...prev,
                        gpsLatitude: parseFloat(match[1]),
                        gpsLongitude: parseFloat(match[2]),
                      }));
                      setMessage(`Đã nhận diện tọa độ Google Maps: Lat ${match[1]}, Lng ${match[2]}`);
                    }
                  }}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setNewBranch((prev) => ({
                            ...prev,
                            gpsLatitude: pos.coords.latitude,
                            gpsLongitude: pos.coords.longitude,
                          }));
                          setMessage(`Đã lấy vị trí thực tế tại thiết bị: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
                        },
                        (err) => alert(`Không thể lấy vị trí GPS: ${err.message}`)
                      );
                    } else {
                      alert('Trình duyệt không hỗ trợ Geolocation');
                    }
                  }}
                  title="Lấy vị trí GPS hiện tại của máy tính/điện thoại đang đứng"
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Vị trí hiện tại</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Mã Cơ Sở</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: CN02"
                  value={newBranch.code}
                  onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Tên Cơ Sở</label>
                <input
                  type="text"
                  required
                  placeholder="Cơ sở Đống Đa"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Địa Chỉ</label>
                <input
                  type="text"
                  required
                  placeholder="Số 45 Thái Hà, Đống Đa, Hà Nội"
                  value={newBranch.address}
                  onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Vĩ Độ (Latitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={newBranch.gpsLatitude}
                    onChange={(e) => setNewBranch({ ...newBranch, gpsLatitude: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 font-mono font-bold text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Kinh Độ (Longitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={newBranch.gpsLongitude}
                    onChange={(e) => setNewBranch({ ...newBranch, gpsLongitude: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 font-mono font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Bán Kính Chấm Công Cho Phép (Mét)</label>
                <input
                  type="number"
                  min="50"
                  max="1000"
                  required
                  value={newBranch.gpsRadiusMeters}
                  onChange={(e) => setNewBranch({ ...newBranch, gpsRadiusMeters: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Khuyên dùng: 150m - 200m để đảm bảo giáo viên có mặt đúng tại phòng học</span>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${newBranch.gpsLatitude},${newBranch.gpsLongitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  Kiểm tra vị trí trên Google Maps ↗
                </a>

                <button
                  type="submit"
                  disabled={loading}
                  className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow transition cursor-pointer"
                >
                  Lưu Cơ Sở Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subtab 4: System Configurations & KPI */}
      {activeSubTab === 'CONFIGS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2 justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Cấu Hình Tham Số Nghiệp Vụ Cốt Lõi (SRS v2.0)</h2>
              <span className="text-xs text-slate-500">Toàn bộ thay đổi áp dụng tức thì vào công thức tính bảng lương & đào tạo</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  try {
                    setLoading(true);
                    // 1. Thử gọi API nạp hàng loạt (Batch Endpoint)
                    try {
                      const res = await fetch(`${API_BASE_URL}/api/core/configs/seed-defaults`, {
                        method: 'POST',
                      });
                      const data = await res.json();
                      if (data.success && data.data) {
                        setConfigs(data.data);
                        setMessage('Đã nạp 5 cấu hình chuẩn thành công!');
                        return;
                      }
                    } catch (e) {
                      // Fallback nếu API batch chưa cập nhật
                    }

                    // 2. Fallback nạp đồng thời (Promise.all)
                    const defaultConfigs = [
                      { key: 'NEW_STUDENT_BONUS', value: '200000', category: 'PAYROLL', description: 'Định mức thưởng Học viên Mới cho Giáo viên/Sale' },
                      { key: 'ON_TIME_LEVELUP_BONUS', value: '300000', category: 'PAYROLL', description: 'Định mức thưởng HV Lên khoá Đúng hạn 3 tháng' },
                      { key: 'STANDARD_MONTHS', value: '3', category: 'ACADEMIC', description: 'Hạn chuẩn hoàn thành khoá học (tháng)' },
                      { key: 'MAX_MONTHS', value: '4', category: 'ACADEMIC', description: 'Hạn tối đa hoàn thành khoá học (tháng)' },
                      { key: 'MAX_RESERVATION_DAYS', value: '90', category: 'ACADEMIC', description: 'Thời gian bảo lưu tối đa (ngày)' },
                    ];
                    await Promise.all(
                      defaultConfigs.map((c) =>
                        fetch(`${API_BASE_URL}/api/core/configs/${c.key}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(c),
                        })
                      )
                    );
                    setMessage('Đã khởi tạo bộ 5 tham số cấu hình mặc định thành công!');
                    await fetchData();
                  } catch (e: any) {
                    alert(`Lỗi khi nạp cấu hình: ${e.message}`);
                  } finally {
                    setLoading(false);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-white font-semibold text-xs flex items-center gap-1.5 transition ${
                  loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 cursor-pointer shadow-sm'
                }`}
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{loading ? 'Đang Nạp Dữ Liệu...' : 'Nạp 5 Cấu Hình Chuẩn'}</span>
              </button>
            </div>
          </div>

          {/* Form thêm tham số mới tùy chỉnh có ô chọn Nghiệp Vụ Gắn Kèm */}
          <div className="p-4 bg-indigo-50/50 border-b border-indigo-100">
            <div className="text-xs font-bold text-indigo-900 mb-2.5 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Thêm Tham Số Tùy Chỉnh Mới:</span>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newConfig.key || !newConfig.value) return;
                await handleUpdateConfig(
                  newConfig.key.trim().toUpperCase(),
                  newConfig.value.trim(),
                  newConfig.description.trim(),
                  newConfig.category
                );
                setNewConfig({ key: '', value: '', category: newConfig.category, description: '' });
              }}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs"
            >
              {/* Ô 1: Nghiệp Vụ Gắn Kèm */}
              <div className="sm:col-span-3">
                <label className="block text-[10px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-indigo-600" />
                  Nghiệp Vụ Gắn Kèm:
                </label>
                <select
                  value={newConfig.category}
                  onChange={(e) => setNewConfig({ ...newConfig, category: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:border-indigo-600 shadow-sm"
                >
                  <option value="PAYROLL">💰 Bảng Lương & KPI</option>
                  <option value="ACADEMIC">📚 Đào Tạo & Giáo Vụ</option>
                  <option value="POS">💳 POS & Học Phí</option>
                  <option value="GENERAL">⚙️ Quản Trị & Khác</option>
                </select>
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                  {BUSINESS_DOMAINS[newConfig.category]?.desc}
                </span>
              </div>

              {/* Ô 2: Mã Tham Số */}
              <div className="sm:col-span-3">
                <label className="block text-[10px] font-bold text-slate-700 mb-1">
                  Mã Tham Số (In hoa, cách bởi _):
                </label>
                <input
                  type="text"
                  required
                  placeholder={BUSINESS_DOMAINS[newConfig.category]?.placeholderKey || 'VD: MA_THAM_SO'}
                  value={newConfig.key}
                  onChange={(e) => setNewConfig({ ...newConfig, key: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono font-semibold uppercase focus:outline-none focus:border-indigo-600 shadow-sm"
                />
              </div>

              {/* Ô 3: Giá Trị */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-700 mb-1">
                  Giá Trị:
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: 500000"
                  value={newConfig.value}
                  onChange={(e) => setNewConfig({ ...newConfig, value: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:border-indigo-600 shadow-sm"
                />
              </div>

              {/* Ô 4: Mô Tả / Diễn Giải */}
              <div className="sm:col-span-3">
                <label className="block text-[10px] font-bold text-slate-700 mb-1">
                  Mô Tả / Diễn Giải Nghiệp Vụ:
                </label>
                <input
                  type="text"
                  placeholder="VD: Phụ cấp đi lại cho GV..."
                  value={newConfig.description}
                  onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-600 shadow-sm"
                />
              </div>

              {/* Ô 5: Nút Lưu */}
              <div className="sm:col-span-1 flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-1 shadow transition cursor-pointer"
                  title="Lưu tham số mới"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Lưu</span>
                </button>
              </div>
            </form>
          </div>

          {/* Thanh lọc theo Nghiệp Vụ */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-400 text-[11px] font-bold flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Lọc nghiệp vụ:
            </span>
            <button
              type="button"
              onClick={() => setConfigFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer shrink-0 ${
                configFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Tất cả ({configs.length})
            </button>
            {Object.entries(BUSINESS_DOMAINS).map(([domainKey, domain]) => {
              const count = configs.filter((c) => {
                const detected =
                  c.category ||
                  (c.key.includes('BONUS') || c.key.includes('SALARY') || c.key.includes('ALLOWANCE')
                    ? 'PAYROLL'
                    : c.key.includes('MONTHS') || c.key.includes('RESERVATION') || c.key.includes('DEADLINE')
                    ? 'ACADEMIC'
                    : c.key.includes('FEE') || c.key.includes('PRICE') || c.key.includes('DISCOUNT')
                    ? 'POS'
                    : 'GENERAL');
                return detected === domainKey;
              }).length;

              return (
                <button
                  key={domainKey}
                  type="button"
                  onClick={() => setConfigFilter(domainKey)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    configFilter === domainKey
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{domain.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      configFilter === domainKey ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="divide-y divide-slate-100">
            {configs.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Sliders className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Chưa có tham số cấu hình nào trong cơ sở dữ liệu đám mây</p>
                <p className="text-[11px] text-slate-400 mt-1">Bấm nút "Nạp 5 Cấu Hình Chuẩn" ở góc trên bên phải để nạp ngay các định mức KPI và hạn bảo lưu.</p>
              </div>
            ) : (
              configs
                .filter((c) => {
                  if (configFilter === 'ALL') return true;
                  const detected =
                    c.category ||
                    (c.key.includes('BONUS') || c.key.includes('SALARY') || c.key.includes('ALLOWANCE')
                      ? 'PAYROLL'
                      : c.key.includes('MONTHS') || c.key.includes('RESERVATION') || c.key.includes('DEADLINE')
                      ? 'ACADEMIC'
                      : c.key.includes('FEE') || c.key.includes('PRICE') || c.key.includes('DISCOUNT')
                      ? 'POS'
                      : 'GENERAL');
                  return detected === configFilter;
                })
                .map((cfg) => {
                  const domainKey =
                    cfg.category ||
                    (cfg.key.includes('BONUS') || cfg.key.includes('SALARY') || cfg.key.includes('ALLOWANCE')
                      ? 'PAYROLL'
                      : cfg.key.includes('MONTHS') || cfg.key.includes('RESERVATION') || cfg.key.includes('DEADLINE')
                      ? 'ACADEMIC'
                      : cfg.key.includes('FEE') || cfg.key.includes('PRICE') || cfg.key.includes('DISCOUNT')
                      ? 'POS'
                      : 'GENERAL');
                  const domain = BUSINESS_DOMAINS[domainKey] || BUSINESS_DOMAINS.GENERAL;

                  return (
                    <div key={cfg.id || cfg.key} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {/* Dropdown chỉnh nghiệp vụ trực tiếp nếu cần đổi */}
                          <select
                            value={domainKey}
                            onChange={(e) => handleUpdateConfig(cfg.key, cfg.value, cfg.description, e.target.value)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${domain.color}`}
                            title="Bấm để thay đổi nghiệp vụ gắn kèm"
                          >
                            <option value="PAYROLL">💰 BẢNG LƯƠNG & KPI</option>
                            <option value="ACADEMIC">📚 ĐÀO TẠO & GIÁO VỤ</option>
                            <option value="POS">💳 POS & HỌC PHÍ</option>
                            <option value="GENERAL">⚙️ QUẢN TRỊ & KHÁC</option>
                          </select>
                          <span className="font-mono text-xs font-bold text-slate-900">{cfg.key}</span>
                        </div>
                        <div className="text-xs text-slate-600">{cfg.description || domain.desc}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <span>Phạm vi:</span>
                          <span className="font-medium text-slate-500">{domain.desc}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="relative">
                          <input
                            type="text"
                            defaultValue={cfg.value}
                            onBlur={(e) => {
                              if (e.target.value !== cfg.value) {
                                handleUpdateConfig(cfg.key, e.target.value, cfg.description, domainKey);
                              }
                            }}
                            className="w-36 sm:w-44 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-500 shadow-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteConfig(cfg.key)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title={`Xoá tham số ${cfg.key}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
