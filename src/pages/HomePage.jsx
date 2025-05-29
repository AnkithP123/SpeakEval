import React, { useEffect } from 'react'
import Hero from '../components/Hero'
import HomeCards from '../components/HomeCards'
import { cuteAlert } from 'cute-alert'

function HomePage({ maintenance }) {
  return (
    <div style={{fontFamily: "Montserrat"}}>

      {/* <!-- Hero --> */}
      {maintenance ? (
        <Hero title={"SpeakEval is undergoing maintenance."} subtitle={"Some features may not work as expected. Please check back later"} static={true}/>
      ) : (
        <Hero
          title={[
            "Welcome To SpeakEval",
            "Bienvenidos a SpeakEval",
            "Bienvenue sur SpeakEval",
            "歡迎來到 SpeakEval",
            "SpeakEval へようこそ"
          ]}
          subtitle="Committed to making oral exams hands-free, quick, and easy!"
        />
      )}

      <HomeCards/>
    </div>
  )
}

export default HomePage