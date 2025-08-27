'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminSidebar({ currentUser, isCollapsed, onToggle }) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState([]);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
    { 
      name: 'Productos', 
      href: '/productos', 
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      submenu: [
        { name: 'Gestionar Productos', href: '/productos', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
        { name: 'Categorías', href: '/categorias', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' }
      ]
    },
    { 
      name: 'Pedidos', 
      href: '/pedidos', 
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      submenu: [
        { name: 'Lista de Pedidos', href: '/pedidos', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { name: 'Buscar Pedido', href: '/pedidos/buscar', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' }
      ]
    },
    { name: 'Usuarios', href: '/usuarios', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
    { name: 'Contactos', href: '/contactos', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  ];

  const isActive = (href) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const toggleSubmenu = (itemName) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isSubmenuExpanded = (itemName) => {
    return expandedItems.includes(itemName);
  };

  const hasActiveSubmenu = (submenu) => {
    return submenu.some(item => isActive(item.href));
  };

  // Expandir automáticamente el submenú si estamos en una página relacionada
  useEffect(() => {
    if (pathname.startsWith('/productos') || pathname.startsWith('/categorias')) {
      setExpandedItems(prev => 
        prev.includes('Productos') ? prev : [...prev, 'Productos']
      );
    }
    if (pathname.startsWith('/pedidos')) {
      setExpandedItems(prev => 
        prev.includes('Pedidos') ? prev : [...prev, 'Pedidos']
      );
    }
    if (pathname.startsWith('/contactos')) {
      setExpandedItems(prev => 
        prev.includes('Contactos') ? prev : [...prev, 'Contactos']
      );
    }
  }, [pathname]);

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} flex flex-col h-screen`}>
      {/* Header del sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold">Admin Panel</h1>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-md hover:bg-gray-700 transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
          </svg>
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => (
          <div key={item.name}>
            {item.submenu ? (
              // Item con submenú
              <div>
                <button
                  onClick={() => !isCollapsed && toggleSubmenu(item.name)}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 group ${
                    hasActiveSubmenu(item.submenu)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  title={isCollapsed ? item.name : ''}
                >
                  <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.name}</span>
                      <svg 
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isSubmenuExpanded(item.name) ? 'rotate-90' : ''
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
                
                {/* Submenú */}
                {!isCollapsed && isSubmenuExpanded(item.name) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                          isActive(subItem.href)
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={subItem.icon} />
                        </svg>
                        <span>{subItem.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Item sin submenú
              <Link
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 group ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                title={isCollapsed ? item.name : ''}
              >
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Información del usuario y logout */}
      <div className="border-t border-gray-700 p-4">
        {!isCollapsed && currentUser && (
          <div className="mb-3">
            <p className="text-xs text-gray-400">Bienvenido,</p>
            <p className="text-sm font-medium text-white">{currentUser.username}</p>
          </div>
        )}
        
        <button 
          onClick={() => {
            localStorage.removeItem('authToken');
            window.location.href = '/login';
          }}
          className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200 ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Cerrar Sesión' : ''}
        >
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
}
