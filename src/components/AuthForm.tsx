import React, { useState } from 'react';
import { signUpUser, signInUser } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { Shield, Mail, Lock, User, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

interface AuthFormProps {
  onSuccess: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInUser(email, password);
        onSuccess();
      } else if (mode === 'register') {
        if (!fullName.trim()) {
          throw new Error('Vui lòng nhập Họ và Tên');
        }
        await signUpUser(email, password, fullName);
        setMessage('Đăng ký thành công! Vui lòng chờ Super Admin phê duyệt tài khoản.');
        setMode('login');
      } else if (mode === 'forgot_password') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        setMessage('Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi.');
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#090e1a] rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white text-center">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold">
            {mode === 'forgot_password' ? 'Quên mật khẩu' : 'Hệ Thống Quản Lý'}
          </h2>
          <p className="text-blue-100 mt-1 text-sm">
            {mode === 'login' && 'Đăng nhập để tiếp tục'}
            {mode === 'register' && 'Đăng ký tài khoản mới'}
            {mode === 'forgot_password' && 'Nhập email tài khoản của bạn. Chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.'}
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm rounded-lg flex items-start gap-2 border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm rounded-lg flex items-start gap-2 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Họ và Tên Tổ chức/Cá nhân
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    placeholder="VD: Công ty TNHH ABC"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            {mode !== 'forgot_password' && (
              <div>
                <div className="flex justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Mật khẩu
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot_password')}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' && 'Đăng nhập'}
              {mode === 'register' && 'Đăng ký tài khoản'}
              {mode === 'forgot_password' && 'Gửi liên kết đặt lại mật khẩu'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {mode === 'forgot_password' ? (
              <button
                onClick={() => setMode('login')}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                ← Quay lại đăng nhập
              </button>
            ) : mode === 'login' ? (
              <p>
                Chưa có tài khoản?{' '}
                <button
                  onClick={() => setMode('register')}
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  Đăng ký ngay
                </button>
              </p>
            ) : (
              <p>
                Đã có tài khoản?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  Đăng nhập
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
