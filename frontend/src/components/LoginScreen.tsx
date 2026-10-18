import React, { useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { Lock, Mail, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ Email và Mật khẩu');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/core/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Đăng nhập không thành công');
      }

      localStorage.setItem('ems_token', data.token);
      localStorage.setItem('ems_user', JSON.stringify(data.user));
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(`${err.message || 'Lỗi kết nối máy chủ'} (Target API: ${API_BASE_URL})`);
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('123456');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 items-center justify-center font-black text-white text-3xl shadow-xl shadow-blue-500/20 mb-3">
            SBR
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">HỆ THỐNG QUẢN LÝ EMS</h1>
          <p className="text-xs text-slate-400 mt-1">Toán Trí Tuệ & Kỹ Năng Sống • SRS v2.0</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Đăng Nhập</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sbr.edu.vn"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mật Khẩu</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Đang kiểm tra...</span>
            ) : (
              <>
                <span>Đăng Nhập Hệ Thống</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Fill Demo Accounts */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2.5 text-center">
            Hoặc chọn nhanh tài khoản thử nghiệm:
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillQuickAccount('admin@sbr.edu.vn')}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-left border border-slate-600/50 transition cursor-pointer flex flex-col"
            >
              <span className="font-semibold text-white">Quản trị viên</span>
              <span className="text-[10px] text-slate-400">admin@sbr.edu.vn</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('ketoan@sbr.edu.vn')}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-left border border-slate-600/50 transition cursor-pointer flex flex-col"
            >
              <span className="font-semibold text-white">Kế toán trưởng</span>
              <span className="text-[10px] text-slate-400">ketoan@sbr.edu.vn</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('giaovu@sbr.edu.vn')}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-left border border-slate-600/50 transition cursor-pointer flex flex-col"
            >
              <span className="font-semibold text-white">Giáo vụ đào tạo</span>
              <span className="text-[10px] text-slate-400">giaovu@sbr.edu.vn</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('gv.ngoc@sbr.edu.vn')}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-left border border-slate-600/50 transition cursor-pointer flex flex-col"
            >
              <span className="font-semibold text-white">Giáo viên (Bảo Ngọc)</span>
              <span className="text-[10px] text-slate-400">gv.ngoc@sbr.edu.vn</span>
            </button>
          </div>
          <div className="mt-3 text-[11px] text-center text-slate-500">
            Mật khẩu mặc định toàn bộ tài khoản: <span className="text-slate-300 font-mono">123456</span>
          </div>
        </div>
      </div>
    </div>
  );
}
