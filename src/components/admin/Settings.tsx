import { Save } from 'lucide-react';
import { useState } from 'react';

interface SettingsForm {
  storeName: string;
  storeEmail: string;
  supportEmail: string;
  phoneNumber: string;
  address: string;
  currency: string;
  timezone: string;
  emailNotifications: boolean;
  orderNotifications: boolean;
}

export function Settings() {
  const [settings, setSettings] = useState<SettingsForm>({
    storeName: 'Fashion Store',
    storeEmail: 'contact@fashionstore.com',
    supportEmail: 'support@fashionstore.com',
    phoneNumber: '+1 (555) 123-4567',
    address: '123 Fashion Street, Style City, ST 12345',
    currency: 'USD',
    timezone: 'UTC-7',
    emailNotifications: true,
    orderNotifications: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save to your backend
    console.log('Saving settings:', settings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-gray-600">Manage your store settings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Store Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium mb-6">Store Information</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                id="storeName"
                name="storeName"
                value={settings.storeName}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label htmlFor="storeEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Store Email
              </label>
              <input
                type="email"
                id="storeEmail"
                name="storeEmail"
                value={settings.storeEmail}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label htmlFor="supportEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Support Email
              </label>
              <input
                type="email"
                id="supportEmail"
                name="supportEmail"
                value={settings.supportEmail}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={settings.phoneNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-black focus:border-black"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={settings.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-black focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium mb-6">Regional Settings</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={settings.currency}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-black focus:border-black"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
              </select>
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                id="timezone"
                name="timezone"
                value={settings.timezone}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-black focus:border-black"
              >
                <option value="UTC-12">UTC-12</option>
                <option value="UTC-11">UTC-11</option>
                <option value="UTC-10">UTC-10</option>
                <option value="UTC-9">UTC-9</option>
                <option value="UTC-8">UTC-8</option>
                <option value="UTC-7">UTC-7</option>
                <option value="UTC-6">UTC-6</option>
                <option value="UTC-5">UTC-5</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium mb-6">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailNotifications"
                name="emailNotifications"
                checked={settings.emailNotifications}
                onChange={handleChange}
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700">
                Email Notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="orderNotifications"
                name="orderNotifications"
                checked={settings.orderNotifications}
                onChange={handleChange}
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <label htmlFor="orderNotifications" className="ml-2 block text-sm text-gray-700">
                Order Notifications
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}