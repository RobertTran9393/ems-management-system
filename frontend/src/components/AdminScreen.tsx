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
  Briefcase
} from 'lucide-react';

export function AdminScreen() {
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'USERS' | 'BRANCHES' | 'CONFIGS'>('OVERVIEW');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, branchesRes, configsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/core/stats`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/core/users`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/core/branches`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/core/configs`).then((r) => r.json()),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (branchesRes.success) {
        setBranches(branchesRes.data);
        if (branchesRes.data.length > 0 && !newUser.branchId) {
          setNewUser((prev) => ({ ...prev, branchId: branchesRes.data[0].id }));
        }
      }
      if (configsRes.success) setConfigs(configsRes.data);
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

  const handleUpdateConfig = async (key: string, value: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/core/configs/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Đã cập nhật tham số ${key} = ${value}`);
        fetchData();
      }
    } catch (err: any) {
      alert(err.message);
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
      <div className="flex gap-2 border-b border-slate-200 pb-3 mb-6">
        <button
          onClick={() => setActiveSubTab('OVERVIEW')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'OVERVIEW'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Tổng Quan Hệ Thống</span>
        </button>

        <button
          onClick={() => setActiveSubTab('USERS')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
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
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
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
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'CONFIGS'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Tham Số & Định Mức KPI ({configs.length})</span>
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
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800">Cấu Hình Tham Số Nghiệp Vụ Cốt Lõi (SRS v2.0)</h2>
            <span className="text-xs text-slate-500">Toàn bộ thay đổi áp dụng tức thì vào công thức tính</span>
          </div>

          <div className="divide-y divide-slate-100">
            {configs.map((cfg) => (
              <div key={cfg.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-xs font-bold text-indigo-700">{cfg.key}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{cfg.description}</div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue={cfg.value}
                    onBlur={(e) => {
                      if (e.target.value !== cfg.value) {
                        handleUpdateConfig(cfg.key, e.target.value);
                      }
                    }}
                    className="w-36 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[11px] text-slate-400">Tự lưu khi rời chuột</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
