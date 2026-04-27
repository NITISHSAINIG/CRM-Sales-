import React, { useState } from 'react';
import { useAuth } from '../App';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  Moon, 
  Save, 
  Camera,
  Globe,
  Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

export default function Settings() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'language' | 'security'>('profile');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    photoURL: profile?.photoURL || '',
    notifications: profile?.settings?.notifications ?? true,
    darkMode: profile?.settings?.darkMode ?? false,
    language: profile?.settings?.language || 'English',
    region: profile?.settings?.region || 'United States',
  });

  const handleUpdateSettings = async (updates: Partial<typeof formData>) => {
    if (!profile) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      const newSettings = {
        notifications: updates.notifications ?? formData.notifications,
        darkMode: updates.darkMode ?? formData.darkMode,
        language: updates.language ?? formData.language,
        region: updates.region ?? formData.region,
      };

      await updateDoc(userRef, {
        name: updates.name ?? formData.name,
        photoURL: updates.photoURL ?? formData.photoURL,
        settings: newSettings
      });
      
      setFormData(prev => ({ ...prev, ...updates }));
      toast.success('Settings updated successfully!');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUpdateSettings(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings</h2>
        <p className="text-slate-500 dark:text-slate-400">Manage your account settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Nav */}
        <div className="space-y-1">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'language', label: 'Language & Region', icon: Globe },
            { id: 'security', label: 'Security', icon: Lock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-semibold",
                activeTab === tab.id 
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {activeTab === 'profile' && (
            <>
              <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Public Profile</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">This information will be visible to other team members.</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border-2 border-indigo-200 dark:border-indigo-800 overflow-hidden">
                        {formData.photoURL ? (
                          <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10" />
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl cursor-pointer">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">Profile Picture</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">JPG, GIF or PNG. Max size of 800K</p>
                      <input 
                        type="url" 
                        placeholder="Photo URL"
                        className="w-full mt-2 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.photoURL}
                        onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 opacity-60">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="email" 
                          disabled
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:text-slate-400 rounded-xl cursor-not-allowed"
                          value={profile?.email}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Changes
                    </button>
                  </div>
                </form>
              </section>

              <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Appearance</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Customize how the application looks for you.</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Dark Mode</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Adjust the app appearance</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleUpdateSettings({ darkMode: !formData.darkMode })}
                      className={cn(
                        "w-12 h-6 rounded-full relative transition-colors",
                        formData.darkMode ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                        formData.darkMode ? "left-7" : "left-1"
                      )}></div>
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'notifications' && (
            <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Notification Preferences</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Choose how you want to be notified.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Email Notifications</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Receive daily summaries and alerts via email.</p>
                  </div>
                  <button 
                    onClick={() => handleUpdateSettings({ notifications: !formData.notifications })}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-colors",
                      formData.notifications ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                      formData.notifications ? "left-7" : "left-1"
                    )}></div>
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'language' && (
            <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Language & Region</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Set your preferred language and regional settings.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Language</label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.language}
                    onChange={(e) => handleUpdateSettings({ language: e.target.value })}
                  >
                    <option className="dark:bg-slate-900">English</option>
                    <option className="dark:bg-slate-900">Spanish</option>
                    <option className="dark:bg-slate-900">French</option>
                    <option className="dark:bg-slate-900">German</option>
                    <option className="dark:bg-slate-900">Chinese</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Region</label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.region}
                    onChange={(e) => handleUpdateSettings({ region: e.target.value })}
                  >
                    <option className="dark:bg-slate-900">United States</option>
                    <option className="dark:bg-slate-900">United Kingdom</option>
                    <option className="dark:bg-slate-900">Canada</option>
                    <option className="dark:bg-slate-900">Australia</option>
                    <option className="dark:bg-slate-900">India</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'security' && (
            <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Security Settings</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage your account security and access.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <Shield className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Account Role</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Your current access level</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider">
                    {profile?.role}
                  </span>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Two-Factor Authentication</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Add an extra layer of security to your account.</p>
                  <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    Enable 2FA
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
