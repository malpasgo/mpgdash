import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, authHelpers, Profile } from '@/lib/supabase';

const UserManagement = () => {
  const { profile, isAdmin } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'executive' | 'finance'>('finance');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load all users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const allProfiles = await authHelpers.getAllProfiles();
      setUsers(allProfiles);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Gagal memuat daftar pengguna.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Check if user is admin
  if (!isAdmin) {
    return (
      <div className="p-8">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Akses Ditolak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Anda tidak memiliki akses untuk mengelola pengguna. Hanya admin yang dapat mengakses halaman ini.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const openModal = (user: Profile | null = null) => {
    setCurrentUser(user);
    setEmail(user?.email || '');
    setPassword(''); // Always empty for security
    setFullName(user?.full_name || '');
    setRole(user?.role || 'finance');
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
    setEmail('');
    setPassword('');
    setFullName('');
    setRole('finance');
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!email || (!currentUser && !password)) {
      setError('Email dan password wajib diisi.');
      return;
    }

    if (!fullName.trim()) {
      setError('Nama lengkap wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (currentUser) {
        // Update existing user profile using authHelpers for proper RLS handling
        const updates: Partial<Profile> = {
          full_name: fullName.trim(),
          role: role
        };

        // Update the profile using the proper auth helper method
        const updatedProfile = await authHelpers.updateProfile(updates);
        if (!updatedProfile) {
          throw new Error('Failed to update profile');
        }

        setSuccess('Pengguna berhasil diperbarui.');
      } else {
        // Create new user with auto-confirm
        try {
          const signUpResult = await authHelpers.signUp(email, password, fullName.trim());
          
          if (signUpResult.user) {
            // Update the role if it's not the default
            if (role !== 'finance') {
              await supabase
                .from('profiles')
                .update({ role })
                .eq('id', signUpResult.user.id);
            }
          }

          setSuccess('Pengguna baru berhasil dibuat dan langsung aktif. User dapat langsung login.');
        } catch (signUpError) {
          throw signUpError;
        }
      }

      // Reload users list
      await loadUsers();
      closeModal();
    } catch (error: any) {
      console.error('Error saving user:', error);
      if (error.message?.includes('User already registered')) {
        setError('Email sudah terdaftar.');
      } else if (error.message?.includes('Password should be at least 6 characters')) {
        setError('Password harus minimal 6 karakter.');
      } else {
        setError(error.message || 'Terjadi kesalahan saat menyimpan pengguna.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userToDelete: Profile) => {
    if (users.length === 1) {
      setError('Tidak dapat menghapus pengguna terakhir.');
      return;
    }

    if (userToDelete.id === profile?.id) {
      setError('Anda tidak dapat menghapus akun sendiri.');
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus pengguna "${userToDelete.full_name || userToDelete.email}"?`)) {
      try {
        setLoading(true);
        setError('');
        setSuccess('');

        // Delete profile first (this will cascade delete the auth user via trigger)
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userToDelete.id);

        if (error) throw error;

        setSuccess('Pengguna berhasil dihapus.');
        await loadUsers();
      } catch (error: any) {
        console.error('Error deleting user:', error);
        setError(error.message || 'Terjadi kesalahan saat menghapus pengguna.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-8">
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Manajemen Pengguna</CardTitle>
          <Button onClick={() => openModal()} disabled={loading}>
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah Pengguna
          </Button>
        </CardHeader>
        <CardContent>
          {/* Status Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Nama</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Role</th>
                  <th className="text-left p-4">Tanggal Dibuat</th>
                  <th className="text-right p-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      Memuat pengguna...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      Belum ada pengguna terdaftar.
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-900">{user.full_name || 'Tanpa Nama'}</p>
                          {user.id === profile?.id && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Anda</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{user.email}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : user.role === 'executive'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : user.role === 'executive' ? 'Executive' : 'Finance'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">
                        {new Date(user.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="p-4 flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => openModal(user)}
                          disabled={loading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          onClick={() => handleDelete(user)}
                          disabled={loading || user.id === profile?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {currentUser ? 'Edit Pengguna' : 'Tambah Pengguna'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              
              <div>
                <label htmlFor="email-modal" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  id="email-modal"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  disabled={!!currentUser} // Disable email editing for existing users
                />
                {currentUser && (
                  <p className="text-xs text-gray-500 mt-1">
                    Email tidak dapat diubah setelah akun dibuat.
                  </p>
                )}
              </div>
              
              {!currentUser && (
                <div>
                  <label htmlFor="password-modal" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <Input
                    id="password-modal"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password (minimal 6 karakter)"
                  />
                </div>
              )}
              
              <div>
                <label htmlFor="role-modal" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <Select value={role} onValueChange={(value: 'admin' | 'executive' | 'finance') => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <div className="mt-6 flex justify-end space-x-4">
              <Button variant="outline" onClick={closeModal} disabled={loading}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;