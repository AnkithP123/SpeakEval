import React from 'react'
import Hero from '../components/Hero'
import HomeCards from '../components/HomeCards'

function HomePage() {
  return (
    <div style={{fontFamily: "Montserrat"}}>

  {/* <!-- Hero --> */}
  
  <Hero title={["Examen Orales!", "Examen Oral", "Oral Exam"]} subtitle="placeholder" />

  {/* <!-- Developers and Employers --> */}
  

  {/* <!-- Browse Jobs --> */}
  

  <HomeCards/>

   
  </div>
  )
}

export default HomePage