import React, { useState, useEffect, useMemo } from 'react';
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
  Edit3,
  Gift,
  Percent,
  Sparkles,
  Calculator,
  CheckSquare,
  Square,
  AlertCircle,
  Palette,
  Image,
  Type,
  Upload,
  Eye,
  Undo2,
  LayoutTemplate,
  Check,
  Lock,
  RotateCcw,
  CheckCircle2,
  Search,
  UserCheck,
  Shield,
  Key,
} from 'lucide-react';
import { useBranding, ALL_MODULE_KEYS, DEFAULT_MODULE_NAMES } from '../context/BrandingContext';

const SYSTEM_ROLES_INFO: Record<string, { label: string; desc: string; badgeColor: string }> = {
  ADMIN: {
    label: 'Ban Giám Đốc / Admin',
    desc: 'Toàn quyền tối cao quản trị mọi cơ sở và các phân hệ hệ thống',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  ACCOUNTANT: {
    label: 'Kế Toán / Thu Ngân',
    desc: 'Thu ngân, bán khóa học/học phẩm, biên lai hóa đơn & bảng lương',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  ACADEMIC_AFFAIRS: {
    label: 'Giáo Vụ / Đào Tạo',
    desc: 'Quản lý lịch học, xếp lớp, điểm danh 24 buổi và tình trạng học viên',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  SALE: {
    label: 'Tư Vấn Tuyển Sinh',
    desc: 'Chăm sóc khách hàng, quản lý phễu lead tuyển sinh & ghi danh mới',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  TEACHER: {
    label: 'Giáo Viên Giảng Dạy',
    desc: 'Sổ liên lạc mobile, điểm danh buổi dạy, chấm sao và đánh giá bé',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
  },
};

const MODULE_DESCRIPTIONS: Record<string, string> = {
  POS: 'Thu ngân, bán khóa học/học phẩm, in phiếu thu & áp voucher',
  RECEIPTS: 'Quản lý biên lai, lịch sử giao dịch và doanh số các cơ sở',
  ACADEMIC: 'Quản lý lớp học, lịch học, điểm danh 24 buổi & theo dõi học sinh',
  PAYROLL: 'Bảng lương nhân sự, tính giờ dạy giáo viên & hoa hồng kinh doanh',
  MOBILE: 'Sổ liên lạc di động cho giáo viên điểm danh, chấm sao & gửi nhận xét',
  CRM: 'Phễu tuyển sinh, chăm sóc lead phụ huynh và lịch sử tư vấn',
  ADMIN: 'Quản trị hệ thống, danh mục khóa học, cơ sở, thương hiệu & phân quyền',
};

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

const THEME_PRESETS = [
  {
    id: 'indigo',
    name: 'Indigo Hoàng Gia',
    primary: '#4f46e5',
    accent: '#6366f1',
    desc: 'Hiện đại, chuyên nghiệp & chuẩn mực giáo dục',
  },
  {
    id: 'blue',
    name: 'Xanh Dương Đại Dương',
    primary: '#2563eb',
    accent: '#3b82f6',
    desc: 'Tin cậy, chuẩn mực & công nghệ số',
  },
  {
    id: 'violet',
    name: 'Tím Violet Sáng Tạo',
    primary: '#7c3aed',
    accent: '#8b5cf6',
    desc: 'Kích thích tư duy logic & toán trí tuệ',
  },
  {
    id: 'emerald',
    name: 'Xanh Ngọc Tươi Sáng',
    primary: '#059669',
    accent: '#10b981',
    desc: 'Tươi mới, phát triển bền vững & kỹ năng sống',
  },
  {
    id: 'rose',
    name: 'Đỏ San Hô Năng Động',
    primary: '#e11d48',
    accent: '#f43f5e',
    desc: 'Nhiệt huyết, truyền cảm hứng & tự tin tỏa sáng',
  },
  {
    id: 'amber',
    name: 'Cam Hổ Phách Nhiệt Tình',
    primary: '#ea580c',
    accent: '#f97316',
    desc: 'Ấm áp, thân thiện & tràn đầy năng lượng',
  },
];

export function AdminScreen() {
  const {
    branding,
    updateBranding,
    resetBranding,
    rolePermissions,
    userPermissions,
    updateRolePermissions,
    updateUserPermissions,
  } = useBranding();

  const [activeSubTab, setActiveSubTab] = useState<
    'OVERVIEW' | 'USERS' | 'BRANCHES' | 'COURSES' | 'PRODUCTS' | 'CONFIGS' | 'BRANDING' | 'PERMISSIONS'
  >('OVERVIEW');
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

  // Form state for branding & module names customization
  const [brandingForm, setBrandingForm] = useState({
    systemName: branding.systemName,
    systemSlogan: branding.systemSlogan,
    systemLogoUrl: branding.systemLogoUrl,
    systemLogoText: branding.systemLogoText,
    systemPrimaryColor: branding.systemPrimaryColor,
    systemAccentColor: branding.systemAccentColor,
    moduleNames: { ...branding.moduleNames },
  });

  useEffect(() => {
    setBrandingForm({
      systemName: branding.systemName,
      systemSlogan: branding.systemSlogan,
      systemLogoUrl: branding.systemLogoUrl,
      systemLogoText: branding.systemLogoText,
      systemPrimaryColor: branding.systemPrimaryColor,
      systemAccentColor: branding.systemAccentColor,
      moduleNames: { ...branding.moduleNames },
    });
  }, [branding]);

  // Form state for Role Permissions Matrix
  const [rolePermsForm, setRolePermsForm] = useState<Record<string, string[]>>({ ...rolePermissions });

  useEffect(() => {
    setRolePermsForm({ ...rolePermissions });
  }, [rolePermissions]);

  // User tab submode: LIST (Danh sách tài khoản), MATRIX (Ma trận vai trò), OVERRIDES (Cấp quyền chi tiết)
  const [userTabMode, setUserTabMode] = useState<'LIST' | 'MATRIX' | 'OVERRIDES'>('LIST');

  // State for editing user role & branch
  const [editingUserRole, setEditingUserRole] = useState<any | null>(null);
  const [editRoleForm, setEditRoleForm] = useState<{
    role: string;
    branchId: string;
    fullName: string;
    phone: string;
  }>({
    role: 'TEACHER',
    branchId: '',
    fullName: '',
    phone: '',
  });

  // State for resetting password
  const [resetPassUser, setResetPassUser] = useState<any | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('123456');

  const openEditUserRole = (u: any) => {
    setEditingUserRole(u);
    setEditRoleForm({
      role: u.role,
      branchId: u.branchId || u.branch?.id || (branches[0]?.id || ''),
      fullName: u.fullName || '',
      phone: u.phone || '',
    });
  };

  const handleSaveUserRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserRole) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/core/users/${editingUserRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editRoleForm),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Đã cập nhật vai trò cho nhân sự "${data.data.fullName}" thành công!`);
        setUsers((prev) => prev.map((u) => (u.id === data.data.id ? data.data : u)));
        setEditingUserRole(null);
      } else {
        alert(`Lỗi: ${data.message}`);
      }
    } catch (err: any) {
      alert(`Lỗi khi cập nhật vai trò: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openResetPasswordModal = (u: any) => {
    setResetPassUser(u);
    setNewPasswordInput('123456');
  };

  const handleConfirmResetPassword = async () => {
    if (!resetPassUser) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/core/users/${resetPassUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPasswordInput }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        alert(`✅ ${data.message}`);
        setResetPassUser(null);
      } else {
        alert(`Lỗi: ${data.message}`);
      }
    } catch (err: any) {
      alert(`Lỗi đặt lại mật khẩu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // User-specific permission edit modal state
  const [editingUserPerms, setEditingUserPerms] = useState<any | null>(null);
  const [selectedUserModules, setSelectedUserModules] = useState<string[]>([]);
  const [userPermSearch, setUserPermSearch] = useState('');
  const [userPermRoleFilter, setUserPermRoleFilter] = useState('ALL');
  const [userPermTypeFilter, setUserPermTypeFilter] = useState<'ALL' | 'CUSTOM' | 'DEFAULT'>('ALL');

  const filteredPermUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !userPermSearch ||
        u.fullName?.toLowerCase().includes(userPermSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userPermSearch.toLowerCase()) ||
        u.phone?.includes(userPermSearch);
      const matchRole = userPermRoleFilter === 'ALL' || u.role === userPermRoleFilter;
      const isCustom = Boolean(userPermissions[u.id]);
      const matchType =
        userPermTypeFilter === 'ALL' ||
        (userPermTypeFilter === 'CUSTOM' && isCustom) ||
        (userPermTypeFilter === 'DEFAULT' && !isCustom);
      return matchSearch && matchRole && matchType;
    });
  }, [users, userPermSearch, userPermRoleFilter, userPermTypeFilter, userPermissions]);

  const startEditUserPerms = (user: any) => {
    setEditingUserPerms(user);
    const custom = userPermissions[user.id];
    if (custom && Array.isArray(custom)) {
      setSelectedUserModules([...custom]);
    } else {
      setSelectedUserModules([...(rolePermissions[user.role] || [])]);
    }
  };

  const toggleUserModule = (moduleKey: string) => {
    setSelectedUserModules((prev) =>
      prev.includes(moduleKey) ? prev.filter((m) => m !== moduleKey) : [...prev, moduleKey]
    );
  };

  const handleSaveUserPermissions = async () => {
    if (!editingUserPerms) return;
    try {
      setLoading(true);
      const ok = await updateUserPermissions(editingUserPerms.id, selectedUserModules);
      if (ok) {
        setMessage(`Đã cập nhật phân quyền riêng cho tài khoản "${editingUserPerms.fullName}"!`);
        setEditingUserPerms(null);
      } else {
        alert('Lỗi khi lưu quyền tài khoản');
      }
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetUserToRoleDefault = async (userId: string, userName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa quyền riêng và đưa tài khoản "${userName}" về quyền mặc định của vai trò?`)) return;
    try {
      setLoading(true);
      const ok = await updateUserPermissions(userId, null);
      if (ok) {
        setMessage(`Đã đưa tài khoản "${userName}" về quyền mặc định theo vai trò!`);
        if (editingUserPerms?.id === userId) {
          setEditingUserPerms(null);
        }
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRolePermission = (role: string, moduleKey: string) => {
    setRolePermsForm((prev) => {
      const currentList = prev[role] || [];
      const nextList = currentList.includes(moduleKey)
        ? currentList.filter((m) => m !== moduleKey)
        : [...currentList, moduleKey];
      return { ...prev, [role]: nextList };
    });
  };

  const handleSaveRolePermissions = async () => {
    try {
      setLoading(true);
      const ok = await updateRolePermissions(rolePermsForm);
      if (ok) {
        setMessage('Đã lưu cấu hình ma trận phân quyền vai trò thành công!');
      } else {
        alert('Lỗi khi lưu phân quyền vai trò');
      }
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Kích thước ảnh tối đa 2MB!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setBrandingForm((prev) => ({ ...prev, systemLogoUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandingForm.systemName.trim()) {
      alert('Vui lòng nhập Tên Hệ Thống!');
      return;
    }
    try {
      setLoading(true);
      const ok = await updateBranding(brandingForm);
      if (ok) {
        setMessage('Đã cập nhật giao diện, tên hệ thống, tên module & màu sắc thành công!');
      } else {
        alert('Lỗi khi lưu giao diện');
      }
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefaultBranding = async () => {
    if (!confirm('Bạn có chắc muốn khôi phục giao diện hệ thống về mặc định ban đầu?')) return;
    try {
      setLoading(true);
      const ok = await resetBranding();
      if (ok) {
        setMessage('Đã khôi phục giao diện hệ thống về mặc định!');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  // Course view filter: Tất cả, Khóa học đơn, hoặc Gói combo
  const [courseViewFilter, setCourseViewFilter] = useState<'ALL' | 'SINGLE' | 'COMBOS'>('ALL');

  // Form state for creating course combo
  const [newCombo, setNewCombo] = useState({
    comboCode: '',
    name: '',
    discountType: 'PERCENT' as 'PERCENT' | 'AMOUNT',
    discountValue: 10,
  });
  const [selectedComboCourseIds, setSelectedComboCourseIds] = useState<string[]>([]);

  // Calculated prices for combo package
  const calculatedOriginalPrice = useMemo(() => {
    return selectedComboCourseIds.reduce((sum, cId) => {
      const c = courses.find((item) => item.id === cId);
      return sum + (c ? Number(c.tuitionFee || 0) : 0);
    }, 0);
  }, [selectedComboCourseIds, courses]);

  const calculatedDiscountAmount = useMemo(() => {
    if (newCombo.discountType === 'PERCENT') {
      return Math.round((calculatedOriginalPrice * Number(newCombo.discountValue || 0)) / 100);
    }
    return Math.min(calculatedOriginalPrice, Number(newCombo.discountValue || 0));
  }, [calculatedOriginalPrice, newCombo.discountType, newCombo.discountValue]);

  const calculatedComboPrice = useMemo(() => {
    return Math.max(0, calculatedOriginalPrice - calculatedDiscountAmount);
  }, [calculatedOriginalPrice, calculatedDiscountAmount]);

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

  // Combo Handlers
  const toggleCourseInCombo = (courseId: string) => {
    setSelectedComboCourseIds((prev) => {
      const next = prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId];
      if (next.length >= 2 && !newCombo.name) {
        const selected = courses.filter((c) => next.includes(c.id));
        const autoName = `Combo ${next.length} Khóa: ${selected.map((c) => c.courseCode).join(' + ')}`;
        const autoCode = `COMBO-${next.length}LV-${Date.now().toString().slice(-4)}`;
        setNewCombo((curr) => ({
          ...curr,
          name: curr.name || autoName,
          comboCode: curr.comboCode || autoCode,
        }));
      }
      return next;
    });
  };

  const handleCreateCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedComboCourseIds.length < 2) {
      alert('Vui lòng chọn ít nhất 2 khóa học để tạo gói combo!');
      return;
    }
    if (!newCombo.name.trim() || !newCombo.comboCode.trim()) {
      alert('Vui lòng nhập đầy đủ Mã Gói và Tên Gói Combo!');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/catalog/combos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comboCode: newCombo.comboCode.trim().toUpperCase(),
          name: newCombo.name.trim(),
          totalCourses: selectedComboCourseIds.length,
          originalPrice: calculatedOriginalPrice,
          comboPrice: calculatedComboPrice,
          courseIds: selectedComboCourseIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const savedMoney = calculatedOriginalPrice - calculatedComboPrice;
        setMessage(`Đã tạo gói combo "${data.data.name}" thành công! Mức tiết kiệm ưu đãi: ${savedMoney.toLocaleString('vi-VN')} đ`);
        setNewCombo({
          comboCode: '',
          name: '',
          discountType: 'PERCENT',
          discountValue: 10,
        });
        setSelectedComboCourseIds([]);
        await fetchData();
      } else {
        alert(data.message || 'Lỗi khi tạo combo');
      }
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCombo = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn ngưng hoạt động gói combo "${name}"?`)) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/catalog/combos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMessage(`Đã ngưng hoạt động gói combo "${name}" thành công!`);
        await fetchData();
      } else {
        alert(data.message || 'Lỗi khi ngưng combo');
      }
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
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
          <span>Khóa Học & Gói Combo ({courses.length + combos.length})</span>
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
          onClick={() => {
            setActiveSubTab('USERS');
            setUserTabMode('LIST');
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'USERS' && userTabMode === 'LIST'
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

        <button
          onClick={() => setActiveSubTab('BRANDING')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'BRANDING'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Giao Diện & Thương Hiệu</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('USERS');
            setUserTabMode('MATRIX');
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'USERS' && userTabMode === 'MATRIX'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Bảng Phân Quyền Ma Trận</span>
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

      {/* Subtab: Courses & Course Packages (Combos) */}
      {activeSubTab === 'COURSES' && (
        <div className="space-y-6">
          {/* Sub-filter Navigation: Tất cả / Khóa đơn lẻ / Gói combo */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Chế Độ Xem:</span>
              <button
                type="button"
                onClick={() => setCourseViewFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  courseViewFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất Cả ({courses.length} Khóa + {combos.length} Combo)
              </button>
              <button
                type="button"
                onClick={() => setCourseViewFilter('SINGLE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  courseViewFilter === 'SINGLE'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Khóa Học Đơn Lẻ ({courses.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setCourseViewFilter('COMBOS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  courseViewFilter === 'COMBOS'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Gói Combo Ưu Đãi ({combos.length})</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 pr-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Gói Combo tự động cộng gộp học phí & tính chiết khấu trực quan</span>
            </div>
          </div>

          {/* SECTION 1: KHÓA HỌC ĐƠN LẺ */}
          {(courseViewFilter === 'ALL' || courseViewFilter === 'SINGLE') && (
            <div className="space-y-6">
              {/* Form thêm khóa học đơn mới */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Cài Đặt & Thêm Khóa Học Chuẩn (Đơn Lẻ)
                    </h2>
                    <span className="text-xs text-slate-500">Khóa học đơn lẻ theo lộ trình chuẩn từng cấp độ (24 buổi)</span>
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
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
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

          {/* SECTION 2: GÓI COMBO KHÓA HỌC (NHIỀU KHÓA + CỘNG GỘP GIÁ + ƯU ĐÃI GIẢM GIÁ) */}
          {(courseViewFilter === 'ALL' || courseViewFilter === 'COMBOS') && (
            <div className="space-y-6 pt-2">
              {/* Form Tạo Gói Combo Mới */}
              <div className="bg-white rounded-2xl border-2 border-purple-200 shadow-md overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border-b border-purple-200 flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-bold text-purple-900 flex items-center gap-2">
                      <Gift className="w-4 h-4 text-purple-600" />
                      Cài Đặt & Tạo Gói Combo Khóa Học Ưu Đãi
                    </h2>
                    <span className="text-xs text-purple-700">
                      Tích chọn nhiều khóa học để hệ thống tự động cộng gộp giá gốc & thiết lập mức ưu đãi giảm giá
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    {selectedComboCourseIds.length} khóa đã chọn
                  </span>
                </div>

                <form onSubmit={handleCreateCombo} className="p-5 space-y-6 text-xs">
                  {/* BƯỚC 1: LỰA CHỌN CÁC KHÓA HỌC TRONG GÓI */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">1</span>
                        Lựa Chọn Các Khóa Học Bao Gồm Trong Gói Combo (Tối thiểu 2 khóa):
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Nhấp vào thẻ khóa học để chọn hoặc bỏ chọn
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {courses.map((c) => {
                        const isSelected = selectedComboCourseIds.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => toggleCourseInCombo(c.id)}
                            className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 select-none ${
                              isSelected
                                ? 'border-purple-600 bg-purple-50/70 shadow-sm'
                                : 'border-slate-200 hover:border-purple-300 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="pt-0.5">
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-purple-600 shrink-0" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-400 shrink-0" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-mono font-bold text-purple-900 text-[11px] truncate">
                                  {c.courseCode}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  c.subjectType === 'TOAN_TRI_TUE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {c.subjectType === 'TOAN_TRI_TUE' ? 'Toán Trí Tuệ' : 'Kỹ Năng Sống'}
                                </span>
                              </div>
                              <div className="font-semibold text-slate-800 text-xs mb-1 line-clamp-1" title={c.name}>
                                {c.name}
                              </div>
                              <div className="flex justify-between items-center text-[11px] mt-1 pt-1 border-t border-slate-200/60">
                                <span className="text-slate-500">Level {c.levelOrder} ({c.totalSessions} buổi)</span>
                                <span className="font-bold text-indigo-700">
                                  {Number(c.tuitionFee).toLocaleString('vi-VN')} đ
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Dải tóm tắt lộ trình các khóa đã chọn */}
                    {selectedComboCourseIds.length > 0 && (
                      <div className="mt-3 p-3 bg-purple-50 rounded-xl border border-purple-200 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-purple-900">Lộ trình gói combo:</span>
                        {selectedComboCourseIds.map((cId, idx) => {
                          const course = courses.find((item) => item.id === cId);
                          return (
                            <span
                              key={cId}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-purple-300 font-semibold text-purple-900 text-xs shadow-sm"
                            >
                              <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>
                              <span>{course?.courseCode}: {course?.name}</span>
                              <span className="text-purple-600 text-[11px] font-bold">({Number(course?.tuitionFee).toLocaleString('vi-VN')} đ)</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* BƯỚC 2: CẤU HÌNH THÔNG TIN GÓI & TÙY CHỌN ƯU ĐÃI GIẢM GIÁ */}
                  <div className="pt-2 border-t border-slate-200">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-3">
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">2</span>
                      Thiết Lập Tên Gói, Mã Gói & Chính Sách Giảm Giá:
                    </label>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* Cột trái (7/12): Nhập Mã, Tên & Tùy chọn giảm giá */}
                      <div className="lg:col-span-7 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Mã Gói Combo (In hoa, không dấu)
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="VD: COMBO-SB-2LV"
                              value={newCombo.comboCode}
                              onChange={(e) => setNewCombo({ ...newCombo, comboCode: e.target.value.toUpperCase() })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase bg-white focus:outline-none focus:border-purple-600 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Tên Gói Combo Khóa Học
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="VD: Combo Soroban Cấp Độ 1 + 2 Tiết Kiệm"
                              value={newCombo.name}
                              onChange={(e) => setNewCombo({ ...newCombo, name: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-purple-600 font-semibold"
                            />
                          </div>
                        </div>

                        {/* Tùy chọn ưu đãi giảm giá */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-purple-600" />
                              Tùy Chọn Ưu Đãi Giảm Giá Cho Gói:
                            </span>

                            {/* Toggle giữa % và Tiền mặt */}
                            <div className="flex p-0.5 bg-slate-200 rounded-lg text-xs font-bold">
                              <button
                                type="button"
                                onClick={() => setNewCombo({ ...newCombo, discountType: 'PERCENT', discountValue: 10 })}
                                className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                                  newCombo.discountType === 'PERCENT'
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                <Percent className="w-3 h-3" />
                                <span>Theo % Chiết Khấu</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewCombo({ ...newCombo, discountType: 'AMOUNT', discountValue: 500000 })}
                                className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                                  newCombo.discountType === 'AMOUNT'
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                <Coins className="w-3 h-3" />
                                <span>Số Tiền Giảm (VNĐ)</span>
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                {newCombo.discountType === 'PERCENT' ? 'Mức phần trăm giảm giá (%):' : 'Số tiền giảm trực tiếp (VNĐ):'}
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  max={newCombo.discountType === 'PERCENT' ? 100 : calculatedOriginalPrice}
                                  step={newCombo.discountType === 'PERCENT' ? 1 : 50000}
                                  value={newCombo.discountValue}
                                  onChange={(e) => setNewCombo({ ...newCombo, discountValue: Number(e.target.value) })}
                                  className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-xl bg-white font-bold text-purple-700 focus:outline-none focus:border-purple-600"
                                />
                                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                                  {newCombo.discountType === 'PERCENT' ? '%' : 'VNĐ'}
                                </span>
                              </div>
                            </div>

                            {/* Preset Buttons */}
                            <div className="flex flex-col justify-end">
                              <span className="text-[11px] font-semibold text-slate-500 mb-1">Chọn nhanh:</span>
                              <div className="flex gap-1.5 flex-wrap">
                                {newCombo.discountType === 'PERCENT' ? (
                                  [5, 10, 15, 20, 25].map((val) => (
                                    <button
                                      key={val}
                                      type="button"
                                      onClick={() => setNewCombo({ ...newCombo, discountValue: val })}
                                      className={`px-2 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                                        newCombo.discountValue === val
                                          ? 'bg-purple-600 text-white'
                                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-purple-50'
                                      }`}
                                    >
                                      {val}%
                                    </button>
                                  ))
                                ) : (
                                  [300000, 500000, 1000000, 1500000].map((val) => (
                                    <button
                                      key={val}
                                      type="button"
                                      onClick={() => setNewCombo({ ...newCombo, discountValue: val })}
                                      className={`px-2 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                                        newCombo.discountValue === val
                                          ? 'bg-purple-600 text-white'
                                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-purple-50'
                                      }`}
                                    >
                                      {(val / 1000).toLocaleString('vi-VN')}k
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cột phải (5/12): Bảng Tính Toán Cộng Gộp & Chốt Giá Tự Động */}
                      <div className="lg:col-span-5">
                        <div className="p-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg space-y-3.5 h-full flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between border-b border-purple-500/30 pb-2 mb-3">
                              <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                                <Calculator className="w-4 h-4 text-purple-300" />
                                Bảng Cộng Gộp & Chốt Giá Gói
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/20 text-white">
                                Tự động tính toán
                              </span>
                            </div>

                            <div className="space-y-2.5 text-xs">
                              <div className="flex justify-between items-center text-purple-200">
                                <span>Số khóa học gộp trong gói:</span>
                                <span className="font-bold text-white text-sm">{selectedComboCourseIds.length} khóa học</span>
                              </div>

                              <div className="flex justify-between items-center text-purple-200">
                                <span>Tổng học phí gốc (Cộng gộp):</span>
                                <span className="font-bold text-white text-sm line-through decoration-rose-400">
                                  {calculatedOriginalPrice.toLocaleString('vi-VN')} đ
                                </span>
                              </div>

                              <div className="flex justify-between items-center text-amber-300">
                                <span>Mức ưu đãi giảm giá:</span>
                                <span className="font-bold text-sm">
                                  - {calculatedDiscountAmount.toLocaleString('vi-VN')} đ
                                  {newCombo.discountType === 'PERCENT' && ` (${newCombo.discountValue}%)`}
                                </span>
                              </div>

                              <div className="pt-2 border-t border-purple-500/40 flex justify-between items-end">
                                <div>
                                  <span className="text-[11px] font-bold text-purple-300 uppercase block">Giá Gói Combo Thực Thu:</span>
                                  <span className="text-[10px] text-emerald-300 font-medium">
                                    Tiết kiệm: {(calculatedOriginalPrice - calculatedComboPrice).toLocaleString('vi-VN')} đ
                                  </span>
                                </div>
                                <div className="text-2xl font-black text-emerald-400">
                                  {calculatedComboPrice.toLocaleString('vi-VN')} đ
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2">
                            <button
                              type="submit"
                              disabled={loading || selectedComboCourseIds.length < 2}
                              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                                selectedComboCourseIds.length >= 2
                                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <Gift className="w-4 h-4" />
                              <span>
                                {selectedComboCourseIds.length >= 2
                                  ? 'Lưu & Kích Hoạt Gói Combo Khóa Học'
                                  : 'Vui lòng chọn ít nhất 2 khóa học'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Danh sách Các Gói Combo Đang Khả Dụng */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-purple-50/50 border-b border-purple-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Gift className="w-4 h-4 text-purple-600" />
                      Danh Sách Gói Combo Đang Khả Dụng Trên POS
                    </h3>
                    <span className="text-xs text-slate-500">Các gói combo này sẽ hiển thị tại Mục 2 trên Màn hình Thu Ngân POS</span>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                    {combos.length} gói combo
                  </span>
                </div>

                {combos.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Chưa có gói combo nào. Hãy chọn các khóa học phía trên và nhấn "Lưu & Kích Hoạt Gói Combo".
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                          <th className="p-3.5">Mã Combo</th>
                          <th className="p-3.5">Tên Gói Combo</th>
                          <th className="p-3.5">Các Khóa Trong Gói</th>
                          <th className="p-3.5 text-center">Số Khóa</th>
                          <th className="p-3.5 text-right">Giá Gốc Cộng Gộp</th>
                          <th className="p-3.5 text-right text-purple-700">Giá Ưu Đãi (Combo)</th>
                          <th className="p-3.5 text-right text-emerald-600">Mức Tiết Kiệm</th>
                          <th className="p-3.5 text-center">Trạng Thái</th>
                          <th className="p-3.5 text-center">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {combos.map((combo) => {
                          const original = Number(combo.originalPrice);
                          const finalPrice = Number(combo.comboPrice);
                          const saved = original - finalPrice;
                          const percent = original > 0 ? Math.round((saved / original) * 100) : 0;

                          return (
                            <tr key={combo.id} className="hover:bg-purple-50/40 transition">
                              <td className="p-3.5 font-mono font-bold text-purple-900">{combo.comboCode}</td>
                              <td className="p-3.5 font-bold text-slate-800">{combo.name}</td>
                              <td className="p-3.5">
                                <div className="flex flex-wrap gap-1">
                                  {combo.items && combo.items.length > 0 ? (
                                    combo.items.map((it: any, idx: number) => (
                                      <span
                                        key={it.id || idx}
                                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200"
                                      >
                                        {idx + 1}. {it.course?.courseCode || it.course?.name || 'Khóa'}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 italic">Combo liên tiếp</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3.5 text-center font-bold text-slate-700">
                                {combo.totalCourses} khóa
                              </td>
                              <td className="p-3.5 text-right text-slate-400 line-through">
                                {original.toLocaleString('vi-VN')} đ
                              </td>
                              <td className="p-3.5 text-right font-black text-purple-700 text-sm">
                                {finalPrice.toLocaleString('vi-VN')} đ
                              </td>
                              <td className="p-3.5 text-right font-bold text-emerald-600">
                                -{saved.toLocaleString('vi-VN')} đ ({percent}%)
                              </td>
                              <td className="p-3.5 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {combo.status}
                                </span>
                              </td>
                              <td className="p-3.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCombo(combo.id, combo.name)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                  title="Ngưng hoạt động combo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
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

      {/* Subtab 2: Users Management & Role Matrix */}
      {activeSubTab === 'USERS' && (
        <div className="space-y-6">
          {/* Subview Selector */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setUserTabMode('LIST')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  userTabMode === 'LIST'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>1. Danh Sách Tài Khoản & Nhân Sự ({users.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setUserTabMode('MATRIX')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  userTabMode === 'MATRIX'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>2. Bảng Phân Quyền Ma Trận (Role Matrix)</span>
              </button>

              <button
                type="button"
                onClick={() => setUserTabMode('OVERRIDES')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  userTabMode === 'OVERRIDES'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>3. Cấp Quyền Chi Tiết Từng Tài Khoản</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 pr-2 hidden sm:flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span>Đổi vai trò, cấp quyền module & reset mật khẩu trực tiếp</span>
            </div>
          </div>

          {/* VIEW 1: USER LIST + ADD FORM */}
          {userTabMode === 'LIST' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User List */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2 bg-slate-50">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Danh Sách Nhân Viên & Phân Quyền</h2>
                    <span className="text-xs text-slate-500 font-medium">{users.length} tài khoản trong hệ thống</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setUserTabMode('MATRIX')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer border border-indigo-200"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Mở Bảng Phân Quyền Ma Trận</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const info = SYSTEM_ROLES_INFO[u.role];
                    const hasCustom = Boolean(userPermissions[u.id]);

                    return (
                      <div key={u.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                            {u.fullName?.slice(0, 1)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-900">{u.fullName}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${info?.badgeColor || 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                {u.role}
                              </span>
                              {hasCustom && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  Quyền riêng
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                              <span>{u.email}</span>
                              <span>•</span>
                              <span>{u.phone || 'Chưa cập nhật SĐT'}</span>
                              <span>•</span>
                              <span className="text-indigo-600 font-medium">{u.branch?.name || 'Toàn hệ thống'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons: Đổi vai trò, Reset mật khẩu, Phân quyền module */}
                        <div className="flex items-center flex-wrap gap-2 justify-start md:justify-end shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditUserRole(u)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition cursor-pointer border border-indigo-200"
                            title="Điều chỉnh vai trò và cơ sở cho tài khoản này"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Đổi Vai Trò</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openResetPasswordModal(u)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-semibold transition cursor-pointer border border-amber-200"
                            title="Đặt lại mật khẩu cho tài khoản này"
                          >
                            <Key className="w-3.5 h-3.5 text-amber-600" />
                            <span>Reset MK</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => startEditUserPerms(u)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-semibold transition cursor-pointer border border-purple-200"
                            title="Cấp quyền chi tiết module riêng cho tài khoản"
                          >
                            <Shield className="w-3.5 h-3.5 text-purple-600" />
                            <span>Quyền Module</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
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

          {/* VIEW 2: ROLE MATRIX */}
          {userTabMode === 'MATRIX' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      Bảng Phân Quyền Ma Trận Theo Vai Trò (Role-Based Access Matrix)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Chọn các phân hệ được phép truy cập mặc định cho 5 nhóm vai trò trong hệ thống EMS.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveRolePermissions}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu Ma Trận Quyền Vai Trò</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="p-3.5 min-w-[200px]">Vai Trò Hệ Thống</th>
                      <th className="p-3.5 min-w-[240px]">Mô Tả & Trách Nhiệm</th>
                      {['POS', 'RECEIPTS', 'ACADEMIC', 'PAYROLL', 'MOBILE', 'CRM', 'ADMIN'].map((modKey) => (
                        <th key={modKey} className="p-3.5 text-center min-w-[120px]">
                          <div className="font-bold text-slate-900">
                            {branding.moduleNames?.[modKey] || DEFAULT_MODULE_NAMES[modKey]}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 font-normal mt-0.5">[{modKey}]</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.keys(SYSTEM_ROLES_INFO).map((roleKey) => {
                      const info = SYSTEM_ROLES_INFO[roleKey];
                      const isAdmin = roleKey === 'ADMIN';
                      const activeModules = isAdmin
                        ? ALL_MODULE_KEYS
                        : rolePermsForm[roleKey] || [];

                      return (
                        <tr key={roleKey} className="hover:bg-slate-50/70 transition">
                          <td className="p-3.5 font-semibold">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${info.badgeColor}`}>
                                {roleKey}
                              </span>
                              <span className="text-slate-800 text-xs font-bold">{info.label}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-500 text-[11px] leading-relaxed">
                            {info.desc}
                          </td>
                          {['POS', 'RECEIPTS', 'ACADEMIC', 'PAYROLL', 'MOBILE', 'CRM', 'ADMIN'].map((modKey) => {
                            const isChecked = activeModules.includes(modKey);

                            if (isAdmin) {
                              return (
                                <td key={modKey} className="p-3.5 text-center">
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-black shadow-sm" title="Quản trị viên luôn có toàn quyền">
                                    ✓
                                  </span>
                                </td>
                              );
                            }

                            return (
                              <td key={modKey} className="p-3.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleRolePermission(roleKey, modKey)}
                                  className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition cursor-pointer ${
                                    isChecked
                                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300 scale-105'
                                      : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-500'
                                  }`}
                                  title={`${isChecked ? 'Đang cấp quyền' : 'Không có quyền'}: ${branding.moduleNames?.[modKey] || DEFAULT_MODULE_NAMES[modKey]}`}
                                >
                                  {isChecked ? <Check className="w-4 h-4 font-black" /> : <span className="text-xs font-bold">−</span>}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-amber-50/60 border-t border-amber-100 text-[11px] text-amber-900 flex flex-wrap items-center justify-between gap-2">
                <span>
                  💡 <strong>Ghi chú:</strong> Tài khoản vai trò ADMIN luôn có toàn quyền tất cả phân hệ để tránh trường hợp bị khóa nhầm tài khoản quản trị.
                </span>
                <span className="text-slate-500 font-medium">Thay đổi sẽ áp dụng ngay khi lưu cấu hình</span>
              </div>
            </div>
          )}

          {/* VIEW 3: USER OVERRIDES */}
          {userTabMode === 'OVERRIDES' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-purple-600" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      Danh Sách Nhân Sự & Cấp Quyền Riêng Từng Tài Khoản
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Tuỳ biến cấp thêm hoặc khóa bớt module cho từng nhân viên cụ thể theo yêu cầu công việc.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={userPermSearch}
                      onChange={(e) => setUserPermSearch(e.target.value)}
                      placeholder="Tìm tên, email, sđt..."
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
                    />
                  </div>

                  <select
                    value={userPermRoleFilter}
                    onChange={(e) => setUserPermRoleFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">Tất cả vai trò</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="ACCOUNTANT">ACCOUNTANT</option>
                    <option value="ACADEMIC_AFFAIRS">ACADEMIC_AFFAIRS</option>
                    <option value="SALE">SALE</option>
                    <option value="TEACHER">TEACHER</option>
                  </select>

                  <select
                    value={userPermTypeFilter}
                    onChange={(e) => setUserPermTypeFilter(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="CUSTOM">Chỉ có quyền riêng</option>
                    <option value="DEFAULT">Theo chuẩn vai trò</option>
                  </select>
                </div>
              </div>

              {/* Users Permissions Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="p-3">Nhân Sự</th>
                      <th className="p-3">Cơ Sở</th>
                      <th className="p-3">Vai Trò</th>
                      <th className="p-3">Trạng Thái Quyền</th>
                      <th className="p-3 min-w-[220px]">Phân Hệ Được Phép</th>
                      <th className="p-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPermUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          Không tìm thấy nhân sự phù hợp với bộ lọc tìm kiếm.
                        </td>
                      </tr>
                    ) : (
                      filteredPermUsers.map((u) => {
                        const hasCustom = Boolean(userPermissions[u.id]);
                        const roleDefault = rolePermissions[u.role] || [];
                        const effectiveModules = u.role === 'ADMIN'
                          ? ALL_MODULE_KEYS
                          : (hasCustom ? userPermissions[u.id] : roleDefault);
                        const branchObj = branches.find((b) => b.id === u.branchId);

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/70 transition">
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-xs shadow-sm shrink-0">
                                  {u.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800">{u.fullName}</div>
                                  <div className="text-[11px] text-slate-400">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-slate-600 text-xs">
                              {branchObj?.name || 'Tất cả cơ sở'}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${SYSTEM_ROLES_INFO[u.role]?.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3">
                              {hasCustom ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  ⚙️ Tùy biến riêng ({userPermissions[u.id]?.length || 0})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  🛡️ Chuẩn vai trò ({roleDefault.length})
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {effectiveModules.map((m) => (
                                  <span
                                    key={m}
                                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                                  >
                                    {branding.moduleNames?.[m] || DEFAULT_MODULE_NAMES[m]}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditUserRole(u)}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
                                  title="Đổi vai trò & cơ sở"
                                >
                                  Đổi Vai Trò
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openResetPasswordModal(u)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition"
                                  title="Đặt lại mật khẩu"
                                >
                                  Reset MK
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startEditUserPerms(u)}
                                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition"
                                  title="Cấp quyền module"
                                >
                                  Chỉnh Quyền
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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

      {/* Subtab: Branding & System Interface Customization */}
      {activeSubTab === 'BRANDING' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Palette className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Chỉnh Sửa Giao Diện, Logo & Thương Hiệu Hệ Thống</h2>
              </div>
              <p className="text-xs text-slate-300">
                Tùy biến tên trung tâm, khẩu hiệu đào tạo, hình ảnh logo và bộ màu chủ đạo hiển thị trên toàn bộ Navbar, Màn hình đăng nhập & Báo cáo
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetToDefaultBranding}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Khôi Phục Mặc Định</span>
              </button>
            </div>
          </div>

          {/* Form & Live Preview Grid */}
          <form onSubmit={handleSaveBranding} className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
            {/* CỘT TRÁI (7/12): CÁC Ô CẤU HÌNH GIAO DIỆN */}
            <div className="lg:col-span-7 space-y-5">
              {/* Card 1: Tên Hệ Thống & Slogan */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Type className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    1. Tên Hệ Thống & Khẩu Hiệu Trung Tâm
                  </h3>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tên Hệ Thống Hiển Thị (Brand Name)
                  </label>
                  <input
                    type="text"
                    required
                    value={brandingForm.systemName}
                    onChange={(e) => setBrandingForm({ ...brandingForm, systemName: e.target.value })}
                    placeholder="VD: EMS SBR, Soroban Math Academy..."
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-900 focus:outline-none focus:border-indigo-600 text-sm shadow-sm"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Tên này sẽ xuất hiện trên thanh Navbar góc trái, tiêu đề tab trình duyệt, màn hình đăng nhập và chân trang.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Khẩu Hiệu Đào Tạo (Slogan / Subtitle)
                  </label>
                  <input
                    type="text"
                    value={brandingForm.systemSlogan}
                    onChange={(e) => setBrandingForm({ ...brandingForm, systemSlogan: e.target.value })}
                    placeholder="VD: Toán Trí Tuệ & Kỹ Năng Sống • Nuôi Dưỡng Tương Lai"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white font-medium text-slate-800 focus:outline-none focus:border-indigo-600 text-xs shadow-sm"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Dòng phụ đề nằm ngay dưới tên thương hiệu trên thanh Menu và màn hình Đăng nhập.
                  </span>
                </div>
              </div>

              {/* Card 2: Cấu Hình Logo Hệ Thống */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      2. Cấu Hình Biểu Tượng & Logo Hệ Thống
                    </h3>
                  </div>
                  {brandingForm.systemLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setBrandingForm({ ...brandingForm, systemLogoUrl: '' })}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer underline"
                    >
                      Xóa ảnh (dùng huy hiệu chữ)
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option A: Image Logo */}
                  <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-[11px] text-slate-800 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Cách A: Dùng Ảnh Logo (.PNG, .SVG, .JPG)</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        Tải ảnh từ máy tính:
                      </label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleLogoFileUpload}
                        className="w-full text-[11px] text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        Hoặc dán đường dẫn ảnh trực tuyến (URL):
                      </label>
                      <input
                        type="url"
                        value={brandingForm.systemLogoUrl}
                        onChange={(e) => setBrandingForm({ ...brandingForm, systemLogoUrl: e.target.value })}
                        placeholder="https://domain.com/logo.png"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  {/* Option B: Badge Text Logo */}
                  <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-[11px] text-slate-800 flex items-center gap-1.5">
                      <LayoutTemplate className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Cách B: Dùng Huy Hiệu Ký Tự Viết Tắt</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        Ký tự trên huy hiệu (1 - 5 chữ cái):
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        value={brandingForm.systemLogoText}
                        onChange={(e) => setBrandingForm({ ...brandingForm, systemLogoText: e.target.value.toUpperCase() })}
                        placeholder="VD: SBR, EMS, MATH..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-black font-mono uppercase bg-white focus:outline-none focus:border-indigo-600 text-indigo-700"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Tự động hiển thị nổi bật theo dải màu chuyển sắc gradient nếu chưa có ảnh logo.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Màu Sắc Chủ Đạo (Theme Color) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      3. Màu Sắc Chủ Đạo & Giao Diện (Theme Color)
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 font-bold">
                    Primary: {brandingForm.systemPrimaryColor}
                  </span>
                </div>

                {/* Preset Palettes */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-2">
                    Chọn nhanh bộ phối màu thương hiệu (Theme Presets):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {THEME_PRESETS.map((preset) => {
                      const isSelected =
                        brandingForm.systemPrimaryColor.toLowerCase() === preset.primary.toLowerCase();
                      return (
                        <div
                          key={preset.id}
                          onClick={() =>
                            setBrandingForm({
                              ...brandingForm,
                              systemPrimaryColor: preset.primary,
                              systemAccentColor: preset.accent,
                            })
                          }
                          className={`p-3 rounded-xl border-2 cursor-pointer transition flex items-start gap-2.5 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center -space-x-1 shrink-0 pt-0.5">
                            <span
                              className="w-5 h-5 rounded-full shadow-sm border border-white"
                              style={{ backgroundColor: preset.primary }}
                            />
                            <span
                              className="w-4 h-4 rounded-full shadow-sm border border-white"
                              style={{ backgroundColor: preset.accent }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 text-[11px] truncate flex items-center gap-1">
                              <span>{preset.name}</span>
                              {isSelected && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
                            </div>
                            <div className="text-[10px] text-slate-500 line-clamp-1">{preset.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Color Pickers */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-700 mb-2">
                    Hoặc tùy chỉnh mã màu tùy ý (Custom Hex):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <input
                        type="color"
                        value={brandingForm.systemPrimaryColor}
                        onChange={(e) => setBrandingForm({ ...brandingForm, systemPrimaryColor: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <div className="flex-1">
                        <span className="block text-[10px] font-semibold text-slate-500">Màu Chủ Đạo (Primary):</span>
                        <input
                          type="text"
                          value={brandingForm.systemPrimaryColor}
                          onChange={(e) => setBrandingForm({ ...brandingForm, systemPrimaryColor: e.target.value })}
                          className="font-mono font-bold text-xs text-slate-800 w-full focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <input
                        type="color"
                        value={brandingForm.systemAccentColor}
                        onChange={(e) => setBrandingForm({ ...brandingForm, systemAccentColor: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <div className="flex-1">
                        <span className="block text-[10px] font-semibold text-slate-500">Màu Phụ Trợ (Accent):</span>
                        <input
                          type="text"
                          value={brandingForm.systemAccentColor}
                          onChange={(e) => setBrandingForm({ ...brandingForm, systemAccentColor: e.target.value })}
                          className="font-mono font-bold text-xs text-slate-800 w-full focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Đổi Tên & Nhãn Các Phân Hệ Module */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      4. Đổi Tên & Nhãn Hiển Thị Các Phân Hệ (Module Names)
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400">Hiển thị trực tiếp trên thanh Menu điều hướng</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Phân Hệ 1: POS Bán Hàng & Thu Phí
                    </label>
                    <input
                      type="text"
                      value={brandingForm.moduleNames?.POS || ''}
                      onChange={(e) =>
                        setBrandingForm({
                          ...brandingForm,
                          moduleNames: { ...brandingForm.moduleNames, POS: e.target.value },
                        })
                      }
                      placeholder="VD: Thu Ngân POS, Bán Hàng & Thu Phí..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Phân Hệ 2: Duyệt Chứng Từ Thu Chi
                    </label>
                    <input
                      type="text"
                      value={brandingForm.moduleNames?.RECEIPTS || ''}
                      onChange={(e) =>
                        setBrandingForm({
                          ...brandingForm,
                          moduleNames: { ...brandingForm.moduleNames, RECEIPTS: e.target.value },
                        })
                      }
                      placeholder="VD: Duyệt Chứng Từ, Kế Toán Thu Tiền..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Phân Hệ 3: Quản Lý Đào Tạo & Giáo Vụ
                    </label>
                    <input
                      type="text"
                      value={brandingForm.moduleNames?.ACADEMIC || ''}
                      onChange={(e) =>
                        setBrandingForm({
                          ...brandingForm,
                          moduleNames: { ...brandingForm.moduleNames, ACADEMIC: e.target.value },
                        })
                      }
                      placeholder="VD: Giáo Vụ, Đào Tạo & Lớp Học..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Phân Hệ 4: Tính Bảng Lương & KPI
                    </label>
                    <input
                      type="text"
                      value={brandingForm.moduleNames?.PAYROLL || ''}
                      onChange={(e) =>
                        setBrandingForm({
                          ...brandingForm,
                          moduleNames: { ...brandingForm.moduleNames, PAYROLL: e.target.value },
                        })
                      }
                      placeholder="VD: Bảng Lương, Tính Lương Giáo Viên..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Phân Hệ 5: Cổng Giáo Viên & Mobile
                    </label>
                    <input
                      type="text"
                      value={brandingForm.moduleNames?.MOBILE || ''}
                      onChange={(e) =>
                        setBrandingForm({
                          ...brandingForm,
                          moduleNames: { ...brandingForm.moduleNames, MOBILE: e.target.value },
                        })
                      }
                      placeholder="VD: App Giáo Viên, Cổng Giảng Dạy..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Phân Hệ 6: Tuyển Sinh & Chăm Sóc CRM
                    </label>
                    <input
                      type="text"
                      value={brandingForm.moduleNames?.CRM || ''}
                      onChange={(e) =>
                        setBrandingForm({
                          ...brandingForm,
                          moduleNames: { ...brandingForm.moduleNames, CRM: e.target.value },
                        })
                      }
                      placeholder="VD: Tuyển Sinh CRM, Tư Vấn Khách Hàng..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Phân Hệ 7: Quản Trị Hệ Thống (Admin)
                    </label>
                    <input
                      type="text"
                      value={brandingForm.moduleNames?.ADMIN || ''}
                      onChange={(e) =>
                        setBrandingForm({
                          ...brandingForm,
                          moduleNames: { ...brandingForm.moduleNames, ADMIN: e.target.value },
                        })
                      }
                      placeholder="VD: Quản Trị, Cài Đặt Trung Tâm..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                {/* Quick preset template buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Gợi ý mẫu:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setBrandingForm({
                        ...brandingForm,
                        moduleNames: { ...DEFAULT_MODULE_NAMES },
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition cursor-pointer"
                  >
                    Mặc Định Chuẩn EMS
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBrandingForm({
                        ...brandingForm,
                        moduleNames: {
                          POS: 'Bán Hóa Đơn & Thu Phí',
                          RECEIPTS: 'Kiểm Soát Phiếu Thu',
                          ACADEMIC: 'Học Vụ & Điểm Danh',
                          PAYROLL: 'Lương & Thưởng KPI',
                          MOBILE: 'Sổ Liên Lạc Giáo Viên',
                          CRM: 'Tuyển Sinh & Học Thử',
                          ADMIN: 'Cài Đặt Trung Tâm',
                        },
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-semibold transition cursor-pointer"
                  >
                    Mẫu Trung Tâm Toán Trí Tuệ
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBrandingForm({
                        ...brandingForm,
                        moduleNames: {
                          POS: 'Thu Học Phí & Giáo Cụ',
                          RECEIPTS: 'Thủ Quỹ & Kế Toán',
                          ACADEMIC: 'Quản Lý Lớp & Bé',
                          PAYROLL: 'Lương & Phụ Cấp Cô',
                          MOBILE: 'Cổng Giáo Viên Mầm Non',
                          CRM: 'Đăng Ký & Tư Vấn Phụ Huynh',
                          ADMIN: 'Ban Giám Hiệu',
                        },
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-semibold transition cursor-pointer"
                  >
                    Mẫu Trường Kỹ Năng / Mầm Non
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer hover:opacity-95"
                  style={{
                    background: `linear-gradient(135deg, ${brandingForm.systemPrimaryColor}, ${brandingForm.systemAccentColor})`,
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'Đang lưu...' : 'Lưu & Áp Dụng Thay Đổi Giao Diện Ngay'}</span>
                </button>
              </div>
            </div>

            {/* CỘT PHẢI (5/12): XEM TRƯỚC TRỰC QUAN THỜI GIAN THỰC (LIVE PREVIEWS) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Card Xem Trước Navbar */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Mô Phỏng Thanh Menu (Navbar Preview)
                    </h3>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Trực tiếp
                  </span>
                </div>

                <p className="text-[11px] text-slate-500">
                  Cách thương hiệu xuất hiện trên thanh điều hướng đầu trang của toàn bộ nhân viên:
                </p>

                {/* Simulated Header */}
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-white shadow-inner">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {brandingForm.systemLogoUrl ? (
                        <div className="w-8 h-8 rounded-lg bg-white/10 p-0.5 border border-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={brandingForm.systemLogoUrl}
                            alt="Logo preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs shadow shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${brandingForm.systemPrimaryColor}, ${brandingForm.systemAccentColor})`,
                          }}
                        >
                          {brandingForm.systemLogoText || 'EMS'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                          <span>{brandingForm.systemName || 'Tên hệ thống'}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-white/20 text-indigo-200 font-semibold">
                            v2.0
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {brandingForm.systemSlogan || 'Khẩu hiệu đào tạo'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className="px-2 py-1 rounded-md text-[10px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: brandingForm.systemPrimaryColor }}
                      >
                        Quản Trị
                      </span>
                      <span className="px-2 py-1 rounded-md text-[10px] font-medium text-slate-300 bg-slate-800">
                        POS
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Xem Trước Màn Hình Đăng Nhập */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <LayoutTemplate className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Mô Phỏng Trang Đăng Nhập (Login Card)
                    </h3>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Giao diện trang chào mừng nhân viên và giáo viên khi truy cập hệ thống:
                </p>

                {/* Simulated Login Card */}
                <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-white text-center shadow-inner space-y-3">
                  <div className="flex justify-center">
                    {brandingForm.systemLogoUrl ? (
                      <div className="w-14 h-14 rounded-2xl bg-white/10 p-1 border border-white/20 flex items-center justify-center shadow-lg overflow-hidden">
                        <img
                          src={brandingForm.systemLogoUrl}
                          alt="Logo login preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${brandingForm.systemPrimaryColor}, ${brandingForm.systemAccentColor})`,
                        }}
                      >
                        {brandingForm.systemLogoText || 'EMS'}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="font-bold text-sm text-white">{brandingForm.systemName || 'Tên hệ thống'}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{brandingForm.systemSlogan}</div>
                  </div>

                  <div className="space-y-1.5 pt-1 text-left">
                    <div className="h-7 bg-slate-800 rounded-lg border border-slate-700 px-2.5 flex items-center text-[10px] text-slate-400">
                      email@domain.com
                    </div>
                    <div className="h-7 bg-slate-800 rounded-lg border border-slate-700 px-2.5 flex items-center text-[10px] text-slate-400">
                      ••••••••
                    </div>
                    <div
                      className="h-8 rounded-lg flex items-center justify-center font-bold text-[11px] text-white shadow-md mt-2"
                      style={{
                        background: `linear-gradient(135deg, ${brandingForm.systemPrimaryColor}, ${brandingForm.systemAccentColor})`,
                      }}
                    >
                      Đăng Nhập
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông số màu sắc & Token nhận diện */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100 text-slate-700 space-y-2">
                <div className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Thông Số Kỹ Thuật Đang Áp Dụng:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-slate-400 block text-[10px]">Màu Primary:</span>
                    <span className="font-mono font-bold text-indigo-900">{brandingForm.systemPrimaryColor}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-slate-400 block text-[10px]">Màu Accent:</span>
                    <span className="font-mono font-bold text-indigo-900">{brandingForm.systemAccentColor}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100 col-span-2">
                    <span className="text-slate-400 block text-[10px]">Định dạng Logo:</span>
                    <span className="font-semibold text-slate-800">
                      {brandingForm.systemLogoUrl ? 'Ảnh tuỳ chỉnh (Custom Graphic/Image)' : `Huy hiệu chữ (${brandingForm.systemLogoText || 'EMS'})`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Subtab 8: Permissions & Roles Matrix */}
      {activeSubTab === 'PERMISSIONS' && (
        <div className="space-y-6">
          {/* Header Description Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 max-w-3xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Hệ Thống Phân Quyền Vai Trò & Cấp Quyền Tài Khoản (RBAC)</span>
              </div>
              <h2 className="text-xl font-black tracking-tight">
                Phân Quyền Theo Vai Trò & Phân Quyền Riêng Từng Nhân Sự
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hệ thống hỗ trợ 2 tầng phân quyền: <strong>(1) Ma trận theo vai trò</strong> (áp dụng tự động cho nhân sự theo chức vụ) và <strong>(2) Cấp quyền riêng từng tài khoản</strong> (cho phép bổ sung hoặc rút bớt module đối với từng nhân sự cụ thể mà không làm ảnh hưởng các tài khoản khác).
              </p>
            </div>
          </div>

          {/* SECTION 1: ROLE MATRIX */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    1. Ma Trận Phân Quyền Theo Vai Trò (Role-Based Access)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Chọn các phân hệ được phép truy cập mặc định cho 5 nhóm vai trò trong hệ sinh thái.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveRolePermissions}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lưu Ma Trận Quyền Vai Trò</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-3.5 min-w-[200px]">Vai Trò Hệ Thống</th>
                    <th className="p-3.5 min-w-[240px]">Mô Tả & Trách Nhiệm</th>
                    {['POS', 'RECEIPTS', 'ACADEMIC', 'PAYROLL', 'MOBILE', 'CRM', 'ADMIN'].map((modKey) => (
                      <th key={modKey} className="p-3.5 text-center min-w-[120px]">
                        <div className="font-bold text-slate-900">
                          {branding.moduleNames?.[modKey] || DEFAULT_MODULE_NAMES[modKey]}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 font-normal mt-0.5">[{modKey}]</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.keys(SYSTEM_ROLES_INFO).map((roleKey) => {
                    const info = SYSTEM_ROLES_INFO[roleKey];
                    const isAdmin = roleKey === 'ADMIN';
                    const activeModules = isAdmin
                      ? ALL_MODULE_KEYS
                      : rolePermsForm[roleKey] || [];

                    return (
                      <tr key={roleKey} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5 font-semibold">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${info.badgeColor}`}>
                              {roleKey}
                            </span>
                            <span className="text-slate-800 text-xs font-bold">{info.label}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-500 text-[11px] leading-relaxed">
                          {info.desc}
                        </td>
                        {['POS', 'RECEIPTS', 'ACADEMIC', 'PAYROLL', 'MOBILE', 'CRM', 'ADMIN'].map((modKey) => {
                          const isChecked = activeModules.includes(modKey);

                          if (isAdmin) {
                            return (
                              <td key={modKey} className="p-3.5 text-center">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-black shadow-sm" title="Quản trị viên luôn có toàn quyền">
                                  ✓
                                </span>
                              </td>
                            );
                          }

                          return (
                            <td key={modKey} className="p-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => toggleRolePermission(roleKey, modKey)}
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition cursor-pointer ${
                                  isChecked
                                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300 scale-105'
                                    : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-500'
                                }`}
                                title={`${isChecked ? 'Đang cấp quyền' : 'Không có quyền'}: ${branding.moduleNames?.[modKey] || DEFAULT_MODULE_NAMES[modKey]}`}
                              >
                                {isChecked ? <Check className="w-4 h-4 font-black" /> : <span className="text-xs font-bold">−</span>}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-amber-50/60 border-t border-amber-100 text-[11px] text-amber-900 flex items-center justify-between">
              <span>
                💡 <strong>Ghi chú:</strong> Tài khoản vai trò ADMIN luôn có toàn quyền tất cả phân hệ để tránh trường hợp bị khóa nhầm tài khoản quản trị.
              </span>
              <span className="text-slate-500 font-medium">Đã tải cấu hình từ máy chủ</span>
            </div>
          </div>

          {/* SECTION 2: USER OVERRIDES */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    2. Danh Sách Nhân Sự & Cấp Quyền Riêng (User Overrides)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Tuỳ biến cấp thêm hoặc khóa bớt module cho từng nhân viên cụ thể theo yêu cầu công việc.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userPermSearch}
                    onChange={(e) => setUserPermSearch(e.target.value)}
                    placeholder="Tìm tên, email, sđt..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
                  />
                </div>

                <select
                  value={userPermRoleFilter}
                  onChange={(e) => setUserPermRoleFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="ACCOUNTANT">ACCOUNTANT</option>
                  <option value="ACADEMIC_AFFAIRS">ACADEMIC_AFFAIRS</option>
                  <option value="SALE">SALE</option>
                  <option value="TEACHER">TEACHER</option>
                </select>

                <select
                  value={userPermTypeFilter}
                  onChange={(e) => setUserPermTypeFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="CUSTOM">Chỉ có quyền riêng</option>
                  <option value="DEFAULT">Theo chuẩn vai trò</option>
                </select>
              </div>
            </div>

            {/* Users Permissions Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-3">Nhân Sự</th>
                    <th className="p-3">Cơ Sở</th>
                    <th className="p-3">Vai Trò</th>
                    <th className="p-3">Trạng Thái Quyền</th>
                    <th className="p-3 min-w-[220px]">Phân Hệ Được Phép</th>
                    <th className="p-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPermUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Không tìm thấy nhân sự phù hợp với bộ lọc tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredPermUsers.map((u) => {
                      const hasCustom = Boolean(userPermissions[u.id]);
                      const roleDefault = rolePermissions[u.role] || [];
                      const effectiveModules = u.role === 'ADMIN'
                        ? ALL_MODULE_KEYS
                        : (hasCustom ? userPermissions[u.id] : roleDefault);
                      const branchObj = branches.find((b) => b.id === u.branchId);

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-xs shadow-sm shrink-0">
                                {u.fullName?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800">{u.fullName}</div>
                                <div className="text-[11px] text-slate-400">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600 text-xs">
                            {branchObj?.name || 'Tất cả cơ sở'}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${SYSTEM_ROLES_INFO[u.role]?.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3">
                            {u.role === 'ADMIN' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                                <ShieldCheck className="w-3 h-3" />
                                Toàn Quyền Admin
                              </span>
                            ) : hasCustom ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                                <Sparkles className="w-3 h-3 text-indigo-500" />
                                Quyền Riêng ({userPermissions[u.id]?.length || 0} module)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium">
                                Theo vai trò ({roleDefault.length} module)
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {effectiveModules.map((mKey: string) => (
                                <span
                                  key={mKey}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                                >
                                  {branding.moduleNames?.[mKey] || DEFAULT_MODULE_NAMES[mKey]}
                                </span>
                              ))}
                              {effectiveModules.length === 0 && (
                                <span className="text-[11px] text-rose-500 italic">Không có quyền module nào</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => startEditUserPerms(u)}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                                title="Chỉnh sửa phân quyền riêng cho tài khoản"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Phân quyền riêng</span>
                              </button>

                              {hasCustom && (
                                <button
                                  type="button"
                                  onClick={() => handleResetUserToRoleDefault(u.id, u.fullName)}
                                  className="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                                  title="Xoá quyền riêng và trở về mặc định theo vai trò"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Về mặc định</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER PERMISSIONS */}
      {editingUserPerms && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  {editingUserPerms.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Phân Quyền Riêng: {editingUserPerms.fullName}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{editingUserPerms.email}</span>
                    <span>•</span>
                    <span className="font-semibold text-indigo-600">Vai trò: {editingUserPerms.role}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingUserPerms(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 flex items-center justify-center text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Presets and Quick Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
                <span className="text-xs font-semibold text-indigo-950">Phím Tắt Nhanh:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedUserModules([...ALL_MODULE_KEYS])}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold transition"
                  >
                    Chọn tất cả (7)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUserModules([...(rolePermissions[editingUserPerms.role] || [])])}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold transition"
                  >
                    Nạp từ chuẩn vai trò ({editingUserPerms.role})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUserModules([])}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 text-xs font-semibold transition"
                  >
                    Bỏ chọn hết
                  </button>
                </div>
              </div>

              {/* Module Checkbox Cards */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Chọn Phân Hệ Cho Phép Tài Khoản Này Truy Cập ({selectedUserModules.length}/7):
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {['POS', 'RECEIPTS', 'ACADEMIC', 'PAYROLL', 'MOBILE', 'CRM', 'ADMIN'].map((modKey) => {
                    const isChecked = selectedUserModules.includes(modKey);
                    const modName = branding.moduleNames?.[modKey] || DEFAULT_MODULE_NAMES[modKey];
                    const modDesc = MODULE_DESCRIPTIONS[modKey];

                    return (
                      <div
                        key={modKey}
                        onClick={() => toggleUserModule(modKey)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 select-none ${
                          isChecked
                            ? 'border-indigo-500 bg-indigo-50/60 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition ${
                            isChecked
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'border border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 truncate">{modName}</span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {modKey}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {modDesc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              {userPermissions[editingUserPerms.id] ? (
                <button
                  type="button"
                  onClick={() => handleResetUserToRoleDefault(editingUserPerms.id, editingUserPerms.fullName)}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xoá quyền riêng (Về mặc định vai trò)</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUserPerms(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveUserPermissions}
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu Phân Quyền Riêng</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit User Role & Branch */}
      {editingUserRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Điều Chỉnh Vai Trò & Cơ Sở
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Tài khoản: <span className="font-semibold text-slate-700">{editingUserRole.fullName}</span> ({editingUserRole.email})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUserRole(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 flex items-center justify-center text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveUserRole} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vai Trò Phân Quyền (Role)</label>
                <select
                  value={editRoleForm.role}
                  onChange={(e) => setEditRoleForm({ ...editRoleForm, role: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-slate-800 font-semibold bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="ADMIN">Quản Trị Viên (ADMIN) - Toàn quyền mọi phân hệ</option>
                  <option value="ACADEMIC_AFFAIRS">Giáo Vụ (ACADEMIC_AFFAIRS) - Quản lý lớp, học viên & lịch học</option>
                  <option value="ACCOUNTANT">Kế Toán / Thu Ngân (ACCOUNTANT) - Thu phí POS, biên lai & lương</option>
                  <option value="SALE">Tư Vấn Tuyển Sinh (SALE) - Quản lý Lead CRM & thu phí</option>
                  <option value="TEACHER">Giáo Viên (TEACHER) - Giảng dạy, sổ liên lạc Mobile</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Mỗi vai trò sẽ tự động được cấp quyền truy cập các module tương ứng theo Bảng Phân Quyền Ma Trận.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cơ Sở Phụ Trách</label>
                <select
                  value={editRoleForm.branchId}
                  onChange={(e) => setEditRoleForm({ ...editRoleForm, branchId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-slate-800 bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Họ Và Tên</label>
                  <input
                    type="text"
                    required
                    value={editRoleForm.fullName}
                    onChange={(e) => setEditRoleForm({ ...editRoleForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số Điện Thoại</label>
                  <input
                    type="tel"
                    value={editRoleForm.phone}
                    onChange={(e) => setEditRoleForm({ ...editRoleForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUserRole(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu Thay Đổi Vai Trò</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {resetPassUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Đặt Lại Mật Khẩu (Reset Password)
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Tài khoản: <span className="font-semibold text-slate-700">{resetPassUser.fullName}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetPassUser(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 flex items-center justify-center text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
                <div>Email đăng nhập: <strong className="text-slate-900">{resetPassUser.email}</strong></div>
                <div>Vai trò hiện tại: <span className="font-semibold text-indigo-600">{resetPassUser.role}</span></div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mật Khẩu Mới</label>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Nhập mật khẩu mới (VD: 123456)"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-mono text-sm text-slate-900 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 font-bold"
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setNewPasswordInput('123456')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
                  >
                    Mặc định: 123456
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPasswordInput(Math.random().toString(36).slice(-8))}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
                  >
                    Tạo ngẫu nhiên
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-amber-50 p-3 rounded-xl border border-amber-200/60 leading-relaxed">
                💡 <strong>Lưu ý bảo mật:</strong> Mật khẩu mới sẽ được mã hóa an toàn bằng thuật toán <strong>bcrypt (10 rounds)</strong> ngay khi lưu vào CSDL. Nhân sự có thể dùng mật khẩu này để đăng nhập ngay lập tức.
              </div>

              {/* Modal Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPassUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResetPassword}
                  disabled={loading || !newPasswordInput}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Key className="w-4 h-4" />
                  <span>Xác Nhận Đặt Lại Mật Khẩu</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
