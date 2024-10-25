import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // For navigation
import { FaTimes } from 'react-icons/fa'; // Close icon
import UpgradePanel from '../components/UpgradePanel';
import TeacherPin from './TeacherPin'; // Page for teacher pin entry

function Upgrade({ onClose, doc }) {
  const [showPinPage, setShowPinPage] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [show, setShow] = useState(true);
  const [closing, setClosing] = useState(false); // State for closing animation
  const [initialRender, setInitialRender] = useState(true); // State for initial render animation
  const navigate = useNavigate(); // React Router hook to handle navigation

  useEffect(() => {
    setTimeout(() => setInitialRender(false), 100); // Start the animation after the component mounts

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    if (doc)
      doc.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (doc)
        doc.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSubscribe = (subscriptionDetails) => {
    setSubscriptionData(subscriptionDetails);
    setShowPinPage(true); // Show the pin entry page if subscribing
  };

  const proceedToCardPage = (teacherPin) => {
    setShowPinPage(false); // Hide the pin entry page
    // Redirect to card payment page, passing both the subscription data and teacher pin
    navigate('/card-payment', { state: { subscriptionData, teacherPin } });
  };

  const handleClose = () => {
    setClosing(true); // Trigger closing animation
    setTimeout(() => {
      setShow(false);
      onClose(); // Call the onClose function passed as prop
    }, 300); // Wait for animation to complete before hiding
  };

  return (
    <>
      {show ? (
        <div
          className={`fixed inset-0 flex justify-center items-center overflow-auto ${closing ? '' : "bg-black bg-opacity-70 z-50"}`}
          onClick={handleClose}
        >
          <div
            className="my-8"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the popup
          >
            {showPinPage ? (
              <TeacherPin
                subscriptionData={subscriptionData}
                onPinEntered={proceedToCardPage} // Pass the pin to proceedToCardPage
              />
            ) : (
              <div className="relative">
                <div className={`relative bg-blue-200 bg-opacity-90 p-12 rounded-2xl shadow-2xl flex space-x-8 transition-transform duration-300 ${closing ? 'transform translate-y-full' : initialRender ? 'transform translate-y-full' : 'transform translate-y-0'}`} style={{ marginTop: '200px' }}>
                  {closing ? null : <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    onClick={handleClose}
                  >
                    <FaTimes size={24} />
                  </button>}
                  <UpgradePanel onSubscribe={handleSubscribe} />
                  <UpgradePanel basicCard={false} onSubscribe={handleSubscribe} />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

export default Upgrade;
