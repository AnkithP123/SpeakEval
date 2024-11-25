import React, { useEffect } from 'react'
import Hero from '../components/Hero'
import HomeCards from '../components/HomeCards'
import { cuteAlert } from 'cute-alert'

function HomePage() {

  useEffect(() => {
    cuteAlert({
      type: "error",
      title: "SpeakEval is undergoing heavy maintenance. Some features may not work as expected",
      description: "We apologize for the inconvenience. Please check back later.",
      primaryButtonText: "Understood"
    });
  });
  return (
    <div style={{fontFamily: "Montserrat"}}>

  {/* <!-- Hero --> */}
  
  <Hero title={["Welcome To SpeakEval", "Bienvenidos a SpeakEval", "Bienvenue sur SpeakEval", "歡迎來到 SpeakEval", "SpeakEval へようこそ"]} subtitle="Committed to making oral exams hands-free, quick, and easy!" />

  {/* <!-- Developers and Employers --> */}
  

  {/* <!-- Browse Jobs --> */}
  

  <HomeCards/>

   
  </div>
  )
}

export default HomePage