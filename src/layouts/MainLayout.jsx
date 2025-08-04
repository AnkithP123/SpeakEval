import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ToastContainer } from "react-toastify";
import { Analytics } from "@vercel/analytics/react";
import BottomBar from "../components/BottomBar";
import "react-toastify/dist/ReactToastify.css";
import { cuteAlert } from "cute-alert";

function isMobileDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  const mobileRegex =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  console.log(
    "Mobile device check:",
    mobileRegex.test(userAgent.toLowerCase())
  );
  return mobileRegex.test(userAgent.toLowerCase());
}

document.documentElement.style.setProperty(
  "--cute-alert-max-width",
  document.documentElement.style.getPropertyValue("--cute-alert-min-width") ||
    "40%"
);
cuteAlert({
  type: "warning",
  id: "cute-alert-indev",
  title: "Platform Update In Progress",
  description:
    "We're currently rewriting parts of the platform to better support teachers.\nYou may experience some temporary issues over the next few days.\nIf anything isn't working as expected, please contact us at info@speakeval.org.",
  primaryButtonText: "OK",
});

const isMobile = isMobileDevice();
if (isMobile) {
  document.documentElement.style.setProperty(
    "--cute-alert-max-width",
    document.documentElement.style.getPropertyValue("--cute-alert-min-width") ||
      "20%"
  );
  cuteAlert({
    type: "warning",
    id: "cute-alert-mobile",
    title: "Mobile Device Detected",
    description:
      "This application is not optimized for mobile devices. The experience may be unstable or limited on phones. For the best experience, please use a laptop or desktop computer.",
    primaryButtonText: "OK",
  });
}

function MainLayout({ set, set2, set3, set4 }) {
  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 custom-scrollbar">
      {/* Animated background elements */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMTQ0LCAyMDIsIDI0OSwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIj48L3BhdGg+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIj48L3JlY3Q+PC9zdmc+')] opacity-20"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
      </div>

      <Analytics />
      <Navbar setVar={set} setVar2={set2} setVar3={set3} setVar4={set4} />
      <div className="flex-grow relative z-10 pt-20">
        <Outlet />
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <BottomBar className="mt-auto" />
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0.5rem;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #4fd1c5; /* Change this color to match your theme */
          border-radius: 0.25rem;
          border: 3px solid transparent;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #4fd1c5 transparent;
        }
      `}</style>
    </div>
  );
}

export default MainLayout;
