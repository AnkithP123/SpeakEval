"use client";

import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cuteAlert } from "cute-alert";

let username;

const setUserName = (val) => {
  username = val;
  console.log("New Username!", username);
};

const storedUsername = localStorage.getItem("username");
const storedToken = localStorage.getItem("token");
const checkTokenExpiry = async () => {
  if (storedToken) {
    let tokenExpired = await fetch(
      "https://www.server.speakeval.org/expired-token?token=" + storedToken
    );
    let tokenExpiredJson = await tokenExpired.json();
    if (tokenExpiredJson.expired) {
      localStorage.removeItem("username");
      setUserName(null);
    } else {
      setUserName(tokenExpiredJson.decoded.username);
      localStorage.setItem(
        "username",
        tokenExpiredJson.decoded.username
      );
    }
  } else if (!storedToken) {
    localStorage.removeItem("username");
    setUserName(null);
  } else if (storedUsername) {
    setUserName(storedUsername);
    console.log("Username:", storedUsername);
  }
};

checkTokenExpiry();

let pin = null;

const setPin = (val) => {
  pin = val;
};

const getPin = () => {
  return pin;
};

const storedPin = localStorage.getItem("pin");
if (storedPin) {
  setPin(storedPin);
}

function Navbar({ setVar, setVar2, setVar3, setVar4 }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [name, setName] = useState(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoverButton, setHoverButton] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(0);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const chapters = ["Creating a Set", "Updating a Set"];

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener("scroll", handleScroll);
    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  useEffect(() => {
    setName(username);
  }, [username]);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUserName(storedUsername);
    }
    const storedPin = localStorage.getItem("token");
    if (storedPin) {
      setPin(storedPin);
    }
  }, []);

  const handleLogin = () => {
    navigate("/login");
  };

  const handleLogout = () => {
    localStorage.removeItem("gold");
    setVar3(false);
    localStorage.removeItem("ultimate");
    setVar4(false);
    localStorage.removeItem("username");
    setUserName(null);
    localStorage.removeItem("pin");
    setPin(null);
    localStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-black/80 backdrop-blur-md border-b border-cyan-500/30"
            : "bg-gradient-to-r from-blue-900/90 to-purple-900/90 backdrop-blur-sm"
        }`}
        style={{ fontFamily: "Montserrat" }}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex flex-1 items-center justify-center md:justify-start">
              <NavLink
                className="flex flex-shrink-0 items-center mr-4 group transform transition-transform duration-300 hover:scale-105"
                to="/"
              >
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 animate-spin-slow opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <img
                    className="h-[70px] w-[70px] relative p-[3px] transform transition-transform duration-300"
                    src={
                      setVar
                        ? setVar2
                          ? "crownlogo.png"
                          : "goldlogo.png"
                        : "logo.png"
                    }
                    alt=""
                    onError={(e) => {
                      e.target.src = setVar
                        ? setVar2
                          ? "crownlogo.png"
                          : "goldlogo.png"
                        : "logo.png";
                    }}
                  />
                </div>
                {setVar ? (
                  <span
                    className={
                      "hidden md:block text-[50px] font-bold ml-[-10px] bg-clip-text text-transparent bg-gradient-to-r from-[#EBC050] via-[#F5ED88] to-[#EBC764]"
                    }
                    style={{ fontFamily: "Montserrat" }}
                  >
                    peakEval
                  </span>
                ) : (
                  <span
                    className={`hidden md:block text-[50px] font-bold ml-[-10px] transition-all duration-300 ${"bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500"}`}
                    style={{
                      fontFamily: "Montserrat",
                      textShadow: "0 0 15px rgba(80, 200, 255, 0.5)",
                    }}
                  >
                    peakEval
                  </span>
                )}
              </NavLink>
            </div>
            <div className="flex items-center gap-4">
              {username ? (
                <>
                  <button
                    className="text-white text-base rounded-md px-5 py-2.5 bg-gradient-to-r hover:shadow-lg hover:shadow-cyan-500/30 from-cyan-600/50 to-purple-700/50 hover:from-cyan-500 hover:to-purple-600 hover:shadow-cyan-500/30 transition duration-300"
                    onClick={() => setTutorialOpen(true)}
                  >
                    Tutorial
                  </button>
                  <div className="relative dropdown" ref={dropdownRef}>
                    <button
                      ref={buttonRef}
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      onMouseEnter={() => setHoverButton(true)}
                      onMouseLeave={() => setHoverButton(false)}
                      className={`relative overflow-hidden text-white text-base rounded-md px-5 py-2.5 flex items-center transition-all duration-300 ${
                        hoverButton || dropdownOpen
                          ? "bg-gradient-to-r from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/30"
                          : "bg-gradient-to-r from-cyan-600/50 to-purple-700/50"
                      }`}
                    >
                      <span className="relative z-10 flex items-center">
                        {username}
                        <svg
                          className={`ml-2 h-5 w-5 transition-transform duration-300 ${
                            dropdownOpen ? "rotate-180" : ""
                          }`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </button>
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-black/80 backdrop-blur-md border border-cyan-500/30 rounded-md shadow-lg py-1 z-10 animate-fade-in">
                        <button
                          onClick={handleLogout}
                          className="block px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-900/50 w-full text-left transition-colors duration-200"
                        >
                          Logout
                        </button>
                        <button
                          onClick={() => navigate("/update")}
                          className="block px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-900/50 w-full text-left transition-colors duration-200"
                        >
                          Manage Sets
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  onMouseEnter={() => setHoverButton(true)}
                  onMouseLeave={() => setHoverButton(false)}
                  className={`relative overflow-hidden text-white text-base rounded-md px-5 py-2.5 transition-all duration-300 ${
                    hoverButton
                      ? "bg-gradient-to-r from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/30"
                      : "bg-gradient-to-r from-cyan-600/50 to-purple-700/50"
                  }`}
                >
                  <span className="relative z-10">Teacher Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {tutorialOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gradient-to-r from-blue-900/90 to-purple-900/90 text-white rounded-lg shadow-lg w-[80vw] h-[70vh] flex border border-cyan-500/30">
            <div className="w-1/4 border-r border-cyan-500/30 overflow-y-auto p-4 bg-black/50">
              {chapters.map((chapter, idx) => (
                <div
                  key={idx}
                  className={`cursor-pointer px-2 py-1 rounded mb-2 transition-all duration-300 ${
                    idx === currentChapter
                      ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold shadow-md"
                      : "hover:bg-cyan-900/50 text-cyan-300"
                  }`}
                  onClick={() => setCurrentChapter(idx)}
                >
                  {chapter}
                </div>
              ))}
            </div>
            <div className="w-3/4 p-6 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl text-cyan-300 text-center w-full">
                  {chapters[currentChapter]}
                </h2>
                <button
                  className="text-red-500 text-xl hover:text-red-700 transition duration-300"
                  onClick={() => setTutorialOpen(false)}
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <video
                  key={currentChapter}
                  controls
                  className="w-full h-full max-h-[60vh] max-w-[90%] rounded-lg shadow-lg border border-cyan-500/30 bg-black/50"
                  onClick={() =>
                    console.log(
                      `/${currentChapter}-${chapters[currentChapter].replace(
                        /\s+/g,
                        "_"
                      )}`
                    )
                  }
                >
                  <source
                    src={`/${currentChapter}-${chapters[currentChapter].replace(
                      /\s+/g,
                      "_"
                    )}.mov`}
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="text-center mt-4 flex justify-center items-center gap-4">
                <span
                  className={`cursor-pointer text-cyan-300 hover:text-cyan-500 transition duration-300 text-2xl ${
                    currentChapter === 0 ? "opacity-50 pointer-events-none" : ""
                  }`}
                  onClick={() =>
                    setCurrentChapter((prev) =>
                      prev === 0 ? chapters.length - 1 : prev - 1
                    )
                  }
                >
                  ‹
                </span>
                <span className="text-cyan-300">{`${currentChapter + 1} of ${
                  chapters.length
                }`}</span>
                <span
                  className={`cursor-pointer text-cyan-300 hover:text-cyan-500 transition duration-300 text-2xl ${
                    currentChapter === chapters.length - 1
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                  onClick={() =>
                    setCurrentChapter((prev) =>
                      prev === chapters.length - 1 ? 0 : prev + 1
                    )
                  }
                >
                  ›
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { setUserName };
export { username };
export { pin };
export { setPin };
export { getPin };

export default Navbar;
