import React, { createContext, useContext, useMemo } from 'react';
import { ToastContainer as ReactToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const api = useMemo(() => ({
    showSuccess: (message, duration = 5000, options = {}) =>
      toast.success(message, { autoClose: duration, ...options }),
    showError: (message, duration = 5000, options = {}) =>
      toast.error(message, { autoClose: duration, ...options }),
    showInfo: (message, duration = 5000, options = {}) =>
      toast.info(message, { autoClose: duration, ...options }),
    showWarning: (message, duration = 5000, options = {}) =>
      toast.warn(message, { autoClose: duration, ...options }),
  }), []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ReactToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        transition={Slide}
        theme="dark"
      />
    </ToastContext.Provider>
  );
};