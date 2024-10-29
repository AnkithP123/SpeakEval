import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ToastContainer } from 'react-toastify';
import { Analytics } from "@vercel/analytics/react"
import BottomBar from '../components/BottomBar';
import 'react-toastify/dist/ReactToastify.css';

function MainLayout({set, set2}) {
  return (
    <div className='bg-blue-200 min-h-screen flex flex-col'>
      <Analytics />
      <Navbar setVar={set} setVar2={set2}/>
      <div className='flex-grow'>
        <Outlet />
      </div>
      <ToastContainer />
      <BottomBar className='mt-auto' />
    </div>
  );
}

export default MainLayout;
