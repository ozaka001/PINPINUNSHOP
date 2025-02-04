import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { User as UserIcon, Key, Mail, Phone, MapPin, Camera, Save, Check, AlertCircle } from 'lucide-react';
import type { User } from '../types.js';
import { userService } from '../services/userService.js';
import toast from '../services/toast.js';

interface PasswordUpdate {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function Profile() {
  const { user, login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    postalCode: user?.postalCode || '',
    imageProfile: user?.imageProfile || '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id) {
        try {
          const userData = await userService.getUserById(user.id);
          if (userData) {
            setFormData({
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              phone: userData.phone || '',
              address: userData.address || '',
              city: userData.city || '',
              postalCode: userData.postalCode || '',
              imageProfile: userData.imageProfile || '',
            });
            // Update user context with the fetched data
            login({
              ...user,
              ...userData,
              token: user.token || ''
            }, true); // Use true for rememberMe to maintain existing session
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [user?.id]);

  const [passwordData, setPasswordData] = useState<PasswordUpdate>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<string>('');

  const [imageUrl, setImageUrl] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.error('No user found');
      return;
    }
    
    try {
      const success = await userService.updateUser(user.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        imageProfile: formData.imageProfile,
        updated_at: new Date().toISOString()
      });

      if (success && user) {
        // Update the user context with all the updated information
        login({
          ...user,
          ...formData,
          token: user.token || '' // Ensuring token is a string
        }, true); // Use true for rememberMe to maintain existing session
        setIsEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validate password
    if (passwordData.newPassword.length < 8) {
      setPasswordError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (!user?.id) {
      console.error('User ID is undefined');
      return;
    }

    try {
      const success = await userService.updatePassword(
        user.id,
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (success) {
        setPasswordSuccess('อัพเดทรหัสผ่านเรียบร้อยแล้ว');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setPasswordError('รหัสผ่านปัจจุบันไม่ถูกต้อง');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setPasswordError('เกิดข้อผิดพลาดในการอัพเดทรหัสผ่าน');
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user?.id) {
      try {
        const uploadedImageUrl = await userService.uploadProfilePicture(user.id, file);
        
        // Update local form data with the new image
        setFormData(prev => ({
          ...prev,
          imageProfile: uploadedImageUrl
        }));

        // Update user context with the new image
        if (user) {
          login({
            ...user,
            imageProfile: uploadedImageUrl,
            token: user.token || ''
          }, true); // Use true for rememberMe to maintain existing session
        }

        toast.success('Profile picture updated successfully');
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        toast.error('Failed to upload profile picture');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">โปรไฟล์ของฉัน</h1>
        <p className="text-gray-600">จัดการข้อมูลส่วนตัวของคุณ</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gray-100 rounded-full overflow-hidden">
                {formData.imageProfile ? (
                  <img
                    src={formData.imageProfile}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              {isEditing && (
                <>
                  <button
                    onClick={handleProfilePictureClick}
                    className="absolute bottom-0 right-0 p-2 bg-black rounded-full text-white hover:bg-gray-800"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </>
              )}
            </div>
            <div>
              <h2 className="font-medium text-lg">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            {isEditing ? 'ยกเลิก' : 'แก้ไข'}
          </button>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อ
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="block w-full pl-10 pr-3 py-2 border rounded-lg disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  นามสกุล
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="block w-full pl-10 pr-3 py-2 border rounded-lg disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  อีเมล
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="block w-full pl-10 pr-3 py-2 border rounded-lg disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เบอร์โทรศัพท์
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="block w-full pl-10 pr-3 py-2 border rounded-lg disabled:bg-gray-50"
                    placeholder="0x-xxxx-xxxx"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ที่อยู่
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 text-gray-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <textarea
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows={3}
                    className="block w-full pl-10 pr-3 py-2 border rounded-lg disabled:bg-gray-50 resize-none"
                    placeholder="บ้านเลขที่ ถนน ตำบล/แขวง อำเภอ/เขต"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เมือง/อำเภอ
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="city"
                    value={formData.city || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="block w-full pl-10 pr-3 py-2 border rounded-lg disabled:bg-gray-50"
                    placeholder="เมือง/อำเภอ"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสไปรษณีย์
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="block w-full pl-10 pr-3 py-2 border rounded-lg disabled:bg-gray-50"
                    placeholder="รหัสไปรษณีย์"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button for Profile */}
          {isEditing && (
            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
              >
                <Save className="w-4 h-4" />
                บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          )}
        </form>

        {/* Password Change Form - Always visible but in a separate section */}
        <div className="mt-8 pt-8 border-t">
          <h3 className="text-lg font-medium mb-6">เปลี่ยนรหัสผ่าน</h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่านปัจจุบัน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="block w-full pl-10 pr-3 py-2 border rounded-lg"
                  placeholder="กรอกรหัสผ่านปัจจุบัน"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่านใหม่
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="block w-full pl-10 pr-3 py-2 border rounded-lg"
                  placeholder="กรอกรหัสผ่านใหม่"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ยืนยันรหัสผ่านใหม่
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="block w-full pl-10 pr-3 py-2 border rounded-lg"
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                />
              </div>
            </div>

            {/* Password Update Messages */}
            {passwordError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">{passwordError}</p>
              </div>
            )}

            {passwordSuccess && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <Check className="w-5 h-5" />
                <p className="text-sm">{passwordSuccess}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
              >
                <Key className="w-4 h-4" />
                อัพเดทรหัสผ่าน
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}