import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  CheckCheck,
  Volume2,
  VolumeX,
  X,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Wrench,
  Building2,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    currentUser,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    soundEnabled,
    setSoundEnabled,
    setSelectedTicketId,
    unreadCount,
  } = useApp();

  const userNotifications = notifications.filter((n) => {
    if (!n.targetRoles.includes(currentUser.role)) return false;
    
    // Strict RBAC: Presidents should ONLY see notifications from their assigned building
    if (currentUser.role === 'president') {
      if (n.buildingId && n.buildingId !== currentUser.buildingId) {
        return false;
      }
    }
    
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'ticket_created':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'ticket_status':
        return <Wrench className="w-4 h-4 text-sky-500" />;
      case 'accounting_income':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'accounting_expense':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Building2 className="w-4 h-4 text-[#0A2E6D]" />;
    }
  };

  const handleClickNotification = (n: typeof notifications[0]) => {
    markNotificationAsRead(n.id);
    if (n.ticketId) {
      setSelectedTicketId(n.ticketId);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50"
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#F4F6FA] shadow-2xl z-50 border-l border-[#E2E8F0] flex flex-col text-[#16202E]"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#FFFFFF]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#E8EFF9] text-[#0A2E6D] border border-[#E2E8F0]">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#16202E] text-base">Notificaciones Push</h3>
                  <p className="text-xs text-[#5A6B82]">
                    {unreadCount > 0 ? `${unreadCount} sin leer en tiempo real` : 'Todas leídas'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    soundEnabled ? 'text-[#0A2E6D] hover:bg-[#E8EFF9]' : 'text-[#5A6B82] hover:bg-[#E8EFF9]'
                  }`}
                  title={soundEnabled ? 'Sonido activado' : 'Sonido silenciado'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                <button
                  onClick={onClose}
                  className="p-2 text-[#5A6B82] hover:text-[#16202E] rounded-lg hover:bg-[#E8EFF9] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2.5 bg-[#F4F6FA] border-b border-[#E2E8F0] flex items-center justify-between">
              <span className="text-xs font-medium text-[#5A6B82]">
                Rol actual: <span className="capitalize font-bold text-[#0A2E6D]">{currentUser.role}</span>
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#0A2E6D] hover:text-[#D4B370] transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Marcar todas leídas
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-[#202020]">
              {userNotifications.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#5A6B82]">
                  <Bell className="w-12 h-12 stroke-1 mb-2 text-[#444444]" />
                  <p className="text-sm font-medium text-[#16202E]">Bandeja al día</p>
                  <p className="text-xs mt-1">No hay alertas recientes para tu rol.</p>
                </div>
              ) : (
                userNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleClickNotification(notif)}
                    className={`pt-2 first:pt-0 group p-3 rounded-xl transition-all cursor-pointer ${
                      notif.read
                        ? 'bg-transparent hover:bg-[#F4F6FA] opacity-80'
                        : 'bg-[#F4F6FA] border border-[#E2E8F0] shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 rounded-lg bg-[#F4F6FA] shadow-2xs border border-[#E2E8F0]">
                        {getIcon(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="text-xs font-semibold text-[#16202E] truncate">
                            {notif.title}
                          </h4>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-[#0A2E6D] shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-[#5A6B82] line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>

                        <div className="mt-2 flex items-center justify-between text-[11px] text-[#5A6B82]">
                          {notif.buildingName && (
                            <span className="font-medium text-[#5A6B82] flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-[#5A6B82]" />
                              {notif.buildingName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#5A6B82]" />
                            {new Date(notif.timestamp).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 bg-[#F4F6FA] border-t border-[#E2E8F0] text-center text-xs text-[#5A6B82]">
              Las notificaciones push llegan instantáneamente a los roles correspondientes.
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
