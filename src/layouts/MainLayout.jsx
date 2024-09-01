import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function MainLayout() {
  return (
    <div className='bg-blue-200 min-h-screen'>
      <Navbar />
      <Outlet />
      <ToastContainer />
    </div>
  );
}

export default MainLayout;
