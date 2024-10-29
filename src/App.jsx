import React from 'react';
import MainLayout from './layouts/MainLayout';
import Maintainence from './pages/Maintainence';
import HomePage from './pages/HomePage';
import JoinRoom from './pages/JoinRoom';
import Room from './pages/Room';
import CreateRoom from './pages/CreateRoom';
import TeacherPortalRoom from './pages/TeacherPortalRoom';
import TeacherPortalRouter from './pages/TeacherPortalRouter';
import Configure from './pages/Configure';
import FeedbackPage from './pages/FeedbackPage';
import AudioRecorder from './pages/AudioRecorder';
import Upgrade from './pages/Upgrade';
import CardPayment from './pages/CardPayment';
import Upgraded from './pages/Upgraded';
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider, useLocation } from 'react-router-dom';

// Custom component to handle /test route with query parameters
function AudioRecorderRouteWrapper() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const code = queryParams.get('code');
  const participant = queryParams.get('participant');

  // You can pass code and participant as props to AudioRecorder if needed
  return <AudioRecorder code={code} participant={participant} />;
}

function App() {
  const [gold, setGold] = React.useState(false);
  const [ultimate, setUltimate] = React.useState(false);
  const route = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<MainLayout set={gold} set2={ultimate}/>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/create-room" element={<CreateRoom set={setGold} setUltimate={setUltimate}/>} />
          <Route path="/join-room" element={<JoinRoom rooms={[]} />} />
          <Route path="/room/:roomCode" element={<Room />} />
          <Route path="/teacher-portal" element={<TeacherPortalRouter set={setGold} setUltimate={setUltimate}/>} />
          <Route path="/configure" element={<Configure set={setGold} setUltimate={setUltimate}/>} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/upgrade" element={<Upgrade set={setGold} setUltimate={setUltimate}/>} />
          <Route path="/card-payment" element={<CardPayment />} />
          <Route path="/upgraded" element={<Upgraded  set={setGold} setUltimate={setUltimate}/>} />
          <Route path="*" element={<Maintainence />} />
        </Route>
        <Route path="/record" element={<AudioRecorderRouteWrapper />} />
      </>
    )
  );

  return <RouterProvider router={route} />;
}

export default App;
