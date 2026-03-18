"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X, LogOut, Edit2, Check, ChevronLeft, Camera } from "lucide-react";
import { cn } from "../../lib/utils";
import * as api from "../../lib/api";
import { useAuthStore } from "../../lib/auth-store";

interface UserProfile {
  id: number;
  email: string;
  name?: string;
  avatar_url?: string;
  verified: boolean;
  created_at?: string;
  stats?: {
    decisions_count: number;
    accuracy_rate: number;
    favorite_markets: string[];
  };
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const authUser = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: "", email: "", avatar_url: "" });
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Prefer auth store user data if available (faster and works offline)
        if (authUser) {
          setProfile(authUser);
          setEditData({
            name: authUser.name || "",
            email: authUser.email || "",
            avatar_url: authUser.avatar_url || "",
          });
          setAvatarPreview(null);
          return;
        }

        const data = await api.getUserProfile();
        setProfile(data);
        setEditData({
          name: data.name,
          email: data.email,
          avatar_url: data.avatar_url || "",
        });
        setAvatarPreview(null);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isOpen, authUser]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Валидация размера (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Файл слишком большой. Максимум 5MB");
      return;
    }

    // Валидация формата
    if (!file.type.startsWith("image/")) {
      alert("Пожалуйста, выберите изображение");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setEditData({ ...editData, avatar_url: result });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdits = async () => {
    if (!profile || !editData.name.trim()) return;
    
    setSaving(true);
    try {
      // Mock API call - обновить с реальным endpoint
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProfile({
        ...profile,
        name: editData.name,
        email: editData.email,
        avatar_url: editData.avatar_url || profile.avatar_url,
      });
      setAvatarPreview(null);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    if (editData.avatar_url) return editData.avatar_url;
    // Use PNG output to avoid Next.js Image restrictions on SVGs
    return `https://api.dicebear.com/7.x/avataaars/png?seed=${profile?.email || "default"}`;
  };

  if (!isOpen) return null;

  // If no user data is available, show login/register options
  if (!profile) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-full sm:w-96 bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-t-lg sm:rounded-lg border border-purple-500/30 shadow-2xl animate-slideUp">
          <div className="p-6 text-center">
            <div className="text-lg font-semibold text-white mb-2">Добро пожаловать</div>
            <div className="text-sm text-gray-400 mb-6">Войдите в аккаунт или зарегистрируйтесь, чтобы увидеть профиль.</div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/auth/login'}
                className="w-full px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 rounded-lg text-teal-100 transition-colors"
              >
                Войти
              </button>
              <button
                onClick={() => window.location.href = '/auth/signup'}
                className="w-full px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-100 transition-colors"
              >
                Зарегистрироваться
              </button>
            </div>
          </div>
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 rounded-lg text-gray-300"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Modal */}
      <div className="w-full sm:w-96 bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-t-lg sm:rounded-lg border border-purple-500/30 shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            {isEditing && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setAvatarPreview(null);
                }}
                className="p-1 hover:bg-purple-500/10 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} className="text-purple-400" />
              </button>
            )}
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {isEditing ? "Редактировать профиль" : "Профиль"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-purple-500/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-purple-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {isEditing ? (
                // Edit Form
                <div className="space-y-4">
                  {/* Avatar Upload */}
                  <div className="text-center mb-6">
                    <div className="inline-flex relative mb-4 group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-300" />
                      <div className="relative rounded-full overflow-hidden border-2 border-purple-400">
                        <Image
                          src={getAvatarUrl()}
                          alt="Avatar"
                          width={100}
                          height={100}
                          className="w-[100px] h-[100px] object-cover"
                        />
                        {/* Upload overlay */}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Camera size={24} className="text-white" />
                        </button>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-400 mt-3">
                      Наведите на аватарку для смены
                    </p>
                  </div>

                  {/* Name Input */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300 font-medium">Полное имя</label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500/60 transition-colors"
                      placeholder="Ваше имя"
                    />
                  </div>

                  {/* Email Display (Read-only) */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300 font-medium">Email</label>
                    <div className="px-4 py-2 bg-slate-800/50 border border-purple-500/20 rounded-lg text-gray-400">
                      {editData.email}
                    </div>
                    <p className="text-xs text-gray-500">Email нельзя изменить</p>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveEdits}
                    disabled={saving || !editData.name.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors border border-purple-500/50 text-purple-300 font-medium mt-4"
                  >
                    <Check size={16} />
                    <span>{saving ? "Сохранение..." : "Сохранить изменения"}</span>
                  </button>
                </div>
              ) : (
                // Profile View
                <>
                  {/* Avatar & Basic Info */}
                  <div className="text-center">
                    <div className="inline-flex relative mb-4">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-300" />
                      <Image
                        src={getAvatarUrl()}
                        alt="Avatar"
                        width={80}
                        height={80}
                        className="relative rounded-full border-2 border-purple-400 w-[80px] h-[80px] object-cover"
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{profile.name}</h3>
                    <p className="text-sm text-gray-400">{profile.email}</p>
                    {profile.verified && (
                      <span className="inline-block mt-2 px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-xs text-purple-300 font-medium">
                        ✓ Подтверждено
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  {profile.stats && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-500/20">
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                        <div className="text-2xl font-bold text-purple-400">{profile.stats.decisions_count}</div>
                        <div className="text-xs text-gray-400 mt-1">Решений принято</div>
                      </div>
                      <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-4">
                        <div className="text-2xl font-bold text-pink-400">{Math.round(profile.stats.accuracy_rate * 100)}%</div>
                        <div className="text-xs text-gray-400 mt-1">Точность</div>
                      </div>
                    </div>
                  )}

                  {/* Favorite Markets */}
                  {profile.stats?.favorite_markets && profile.stats.favorite_markets.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-purple-500/20">
                      <p className="text-sm font-semibold text-gray-300">Избранные рынки</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.stats.favorite_markets.map((market) => (
                          <span
                            key={market}
                            className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs text-purple-300"
                          >
                            {market}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Member Since */}
                  {profile.created_at && (
                    <div className="text-xs text-gray-500 text-center pt-2">
                      Участник с {new Date(profile.created_at).toLocaleDateString("ru-RU")}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isEditing && (
          <div className="px-6 py-4 border-t border-purple-500/20 flex gap-3">
            <button 
              onClick={() => setIsEditing(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors border border-purple-500/30 text-purple-300"
            >
              <Edit2 size={16} />
              <span className="text-sm">Редактировать</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/30 text-red-400">
              <LogOut size={16} />
              <span className="text-sm">Выход</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
