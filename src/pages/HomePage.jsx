import React from 'react'
import Hero from '../components/Hero'
import HomeCards from '../components/HomeCards'

function HomePage() {
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