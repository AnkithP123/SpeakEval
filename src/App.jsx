import React from "react";
import MainLayout from "./layouts/MainLayout";
import Maintainence from "./pages/Maintainence";
import HomePage from "./pages/HomePage";
import JoinRoom from "./pages/JoinRoom";
import Room from "./pages/Room";
import CreateRoom from "./pages/CreateRoom";
import TeacherPortalRoom from "./pages/TeacherPortalRoom";
import TeacherPortalRouter from "./pages/TeacherPortalRouter";
import Configure from "./pages/Configure";
import FeedbackPage from "./pages/FeedbackPage";
import AudioRecorder from "./pages/AudioRecorder";
import Upgrade from "./pages/Upgrade";
import CardPayment from "./pages/CardPayment";
import Upgraded from "./pages/Upgraded";
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  useLocation,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { getPin, setPin, setUserName } from "./components/Navbar";
import RoomAndConfigPage from "./pages/UpdateConfig";
import VerifyPage from "./pages/VerifyPage";
import ProfileCard from "./components/StatsCard";
import Download from "./pages/Download";
import TeacherVerifyPage from "./pages/TeacherVerifyPage";
import CreatePractice from "./pages/CreatePractice";
import Practice from "./pages/Practice";
import PracticeExam from "./pages/PracticeExam";
import RegisterPage from "./pages/RegisterPage";
import GradeBotCreator from "./pages/GradeBotCreator";
import ResetPasswordPage from "./pages/ResetPassword";
import Config from "./pages/Config";
import MaintenancePage from "./pages/Maintainence copy";
function AudioRecorderRouteWrapper() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const code = queryParams.get("code");
  const participant = queryParams.get("participant");
  const uuid = queryParams.get("uuid");

  return <AudioRecorder code={code} participant={participant} uuid={uuid} />;
}

const maintenance = true;

function App() {
  const [gold, setgold] = React.useState(
    localStorage.getItem("gold") === "true"
  );
  const [ultimate, setultimate] = React.useState(
    localStorage.getItem("ultimate") === "true"
  );

  const setGold = (val) => {
    setgold(val);
    localStorage.setItem("gold", val);
  };

  const setUltimate = (val) => {
    setultimate(val);
    localStorage.setItem("ultimate", val);
  };

  const route = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route
          path="/"
          element={
            <MainLayout
              set={gold}
              set2={ultimate}
              set3={setGold}
              set4={setUltimate}
            />
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route
            path="/create-room"
            element={
              <CreateRoom
                set={setGold}
                setUltimate={setUltimate}
                getPin={getPin}
              />
            }
          />
          <Route path="/join-room" element={<JoinRoom rooms={[]} />} />
          <Route path="/room/:roomCode" element={<Room />} />
          <Route
            path="/teacher-portal"
            element={
              <TeacherPortalRouter
                set={setGold}
                setUltimate={setUltimate}
                getPin={getPin}
              />
            }
          />
          <Route
            path="/configure"
            element={
              <Config
                isUpdate={false}
                set={setGold}
                setUltimate={setUltimate}
                getPin={getPin}
                subscribed={gold || ultimate}
                setSubscribed={setGold}
              />
            }
          />
          <Route
            path="/update"
            element={
              <Config
                isUpdate={true}
                set={setGold}
                setUltimate={setUltimate}
                getPin={getPin}
                subscribed={gold || ultimate}
                setSubscribed={setGold}
              />
            }
          />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route
            path="/upgrade"
            element={<Upgrade set={setGold} setUltimate={setUltimate} />}
          />
          <Route path="/card-payment" element={<CardPayment />} />
          <Route
            path="/upgraded"
            element={
              <Upgraded
                set={setGold}
                setUltimate={setUltimate}
                getPin={getPin}
              />
            }
          />
          <Route
            path="/login"
            element={
              <LoginPage
                set={setGold}
                setUltimate={setUltimate}
                setUsername={setUserName}
                setPin={setPin}
              />
            }
          />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/download" element={<Download />} />
          <Route path="/teacher-verify" element={<TeacherVerifyPage />} />
          <Route
            path="/create-practice"
            element={<CreatePractice getPin={getPin} />}
          />
          <Route path="/practice" element={<Practice />} />
          <Route path="/practice-exam" element={<PracticeExam />} />
          <Route path="/profile" element={<ProfileCard />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/grade-bot"
            element={<GradeBotCreator getPin={getPin} />}
          />
          <Route path="*" element={<Maintainence />} />
        </Route>
        <Route path="/record" element={<AudioRecorderRouteWrapper />} />
      </>
    )
  );

  return (
    <RouterProvider
      router={
        maintenance
          ? createBrowserRouter(
              createRoutesFromElements(
                <>
                  <Route
                    path="/record"
                    element={<AudioRecorderRouteWrapper />}
                  />
                  <Route path="/" element={<HomePage maintenance={true} />} />
                  <Route path="/*" element={<MaintenancePage />} />
                </>
              )
            )
          : route
      }
    />
  );
}

export default App;
