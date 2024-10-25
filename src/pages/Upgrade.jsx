import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // For navigation
import UpgradePanel from '../components/UpgradePanel';
import TeacherPin from './TeacherPin'; // Page for teacher pin entry

function Upgrade() {
  const [showPinPage, setShowPinPage] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const navigate = useNavigate(); // React Router hook to handle navigation

  const handleSubscribe = (subscriptionDetails) => {
    setSubscriptionData(subscriptionDetails);
    setShowPinPage(true); // Show the pin entry page if subscribing
  };

  const proceedToCardPage = (teacherPin) => {
    setShowPinPage(false); // Hide the pin entry page
    // Redirect to card payment page, passing both the subscription data and teacher pin
    navigate('/card-payment', { state: { subscriptionData, teacherPin } });
  };

  return (
    <div className="flex justify-center items-center h-screen z-50 fixed inset-0">
      {showPinPage ? (
        <TeacherPin 
          subscriptionData={subscriptionData} 
          onPinEntered={proceedToCardPage} // Pass the pin to proceedToCardPage
        />
      ) : (
        <div className="bg-blue-100 bg-opacity-[80%] p-8 rounded-[25px] shadow-lg flex space-x-6">
          <UpgradePanel onSubscribe={handleSubscribe} />
          <UpgradePanel basicCard={false} onSubscribe={handleSubscribe} />
        </div>
      )}
    </div>
  );
}

export default Upgrade;
