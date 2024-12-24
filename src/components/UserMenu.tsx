import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { User as UserIcon, MessageSquare, PackageSearch, LogOut, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useWishlist } from '../context/WishlistContext.js';
import type { User } from '../types/index.js';

interface UserMenuProps {
  onClick?: () => void;
}

export function UserMenu({ onClick }: UserMenuProps) {
  const { logout, user } = useAuth();
  const { totalItems: wishlistItems } = useWishlist();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Menu as="div" className="relative inline-block text-left z-50">
      <Menu.Button onClick={onClick} className="flex items-center hover:text-gray-600">
        {user && user.imageProfile ? (
          <img
            src={user.imageProfile}
            alt={user.firstName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <UserIcon className="w-6 h-6" />
        )}
        {user && <span className="ml-2 text-sm hidden md:block">{user.firstName}</span>}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/profile"
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  <UserIcon className="mr-2 h-5 w-5" />
                  โปรไฟล์
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/orders"
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  <PackageSearch className="mr-2 h-5 w-5" />
                  คำสั่งซื้อของฉัน
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/messages"
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  ข้อความของฉัน
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/wishlist"
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } group flex w-full items-center justify-between rounded-md px-2 py-2 text-sm`}
                >
                  <div className="flex items-center">
                    <Heart className="mr-2 h-5 w-5" />
                    สินค้าที่ถูกใจ
                  </div>
                  {wishlistItems > 0 && (
                    <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                      {wishlistItems}
                    </span>
                  )}
                </Link>
              )}
            </Menu.Item>
          </div>
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleLogout}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-red-600`}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  ออกจากระบบ
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}