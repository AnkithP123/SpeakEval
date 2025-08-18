import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // For navigation
import { FaTimes } from "react-icons/fa"; // Close icon
import UpgradePanel from "../components/UpgradePanel";
import TeacherPin from "./TeacherPin"; // Page for teacher pin entry
import { cuteAlert } from "cute-alert";
import { toast } from "react-toastify";

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
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    if (doc) doc.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (doc) doc.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSubscribe = (subscriptionDetails) => {
    setSubscriptionData(subscriptionDetails);
    setShowPinPage(true); // Show the pin entry page if subscribing
  };

  const proceedToCardPage = (teacherPin) => {
    setShowPinPage(false); // Hide the pin entry page
    // Redirect to card payment page, passing both the subscription data and teacher pin
    navigate("/card-payment", { state: { subscriptionData, teacherPin } });
  };

  const sendRequest = async (username) => {
    setShowPinPage(false); // Show the pin entry page if subscribing
    document.documentElement.style.setProperty("cute-alert-z-index", 10000);
    document.documentElement.style.setProperty("-cute-alert-z-index", 10000);
    document.documentElement.style.setProperty("--cute-alert-z-index", 10000);
    cuteAlert({
      type: "success",
      title: "Login Successful",
      description:
        "On the payment page, you will need to enter the email address associated with your account, or you will not receive the subscription. Subscriptions may take up to an hour to activate.",
      primaryButtonText: "OK",
      secondaryButtonText: "Cancel",
    }).then(async (event) => {
      if (event == "primaryButtonClicked") {
        try {
          const response = await fetch(
            "https://www.server.speakeval.org/create-session",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                subscriptionData,
                username,
              }),
            }
          );

          const result = await response.json();

          // Redirect to success page if payment is successful
          if (result.error) {
            console.error(result.error);
            toast.error("Error processing payment: " + result.error);
            cuteAlert({
              type: "error",
              title: "An error occurred",
              description: result.error,
              primaryButtonText: "OK",
            });
            return;
          }

          if (result.paymentLinkUrl) {
            window.open(result.paymentLinkUrl, "_blank", "noopener,noreferrer");
          }
        } catch (err) {
          console.error("Error processing payment:", err);
          cuteAlert({
            type: "error",
            title: "An error occurred",
            description: "Error processing request",
            primaryButtonText: "OK",
          });
        }
      }
    });
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
          className={`fixed inset-0 flex justify-center items-center overflow-auto ${
            closing ? "" : "bg-black bg-opacity-70 z-50"
          }`}
          onClick={handleClose}
          style={{ zIndex: 10000 }} // Increase z-index
        >
          <div
            className="my-8"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the popup
          >
            {showPinPage ? (
              <TeacherPin
                subscriptionData={subscriptionData}
                onPinEntered={sendRequest} // Pass the pin to proceedToCardPage
              />
            ) : (
              <div className="relative">
                <div
                  className={`relative bg-blue-200 bg-opacity-90 p-12 rounded-2xl shadow-2xl flex space-x-8 transition-transform duration-300 ${
                    closing
                      ? "transform translate-y-full"
                      : initialRender
                      ? "transform translate-y-full"
                      : "transform translate-y-0"
                  }`}
                  style={{ marginTop: "200px" }}
                >
                  {closing ? null : (
                    <button
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                      onClick={handleClose}
                    >
                      <FaTimes size={24} />
                    </button>
                  )}
                  <UpgradePanel onSubscribe={handleSubscribe} />
                  <UpgradePanel
                    basicCard={false}
                    onSubscribe={handleSubscribe}
                  />
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
