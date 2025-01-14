import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ToastContainer } from 'react-toastify';
import { Analytics } from "@vercel/analytics/react"
import BottomBar from '../components/BottomBar';
import 'react-toastify/dist/ReactToastify.css';

function MainLayout({set, set2, set3, set4}) {
  return (
    <div className='bg-blue-200 min-h-screen flex flex-col'>
      <Analytics />
      <Navbar setVar={set} setVar2={set2} setVar3={set3} setVar4={set4} />
      <div className='flex-grow'>
        <Outlet />
      </div>
      <ToastContainer />
      <BottomBar className='mt-auto' />
    </div>
  );
}

export default MainLayout;
