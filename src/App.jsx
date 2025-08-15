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
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { getPin, setPin, setUserName } from "./components/Navbar";
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
import ErrorPage from "./pages/Error";
import urlCache from "./utils/urlCache";
import Test from "./pages/practiceExams-GradingPage.jsx";
import PracticeExams from "./pages/PracticeExams";
import PracticeExamSubmissions from "./pages/PracticeExamSubmissions";
import PracticeExamResponses from "./pages/PracticeExamResponses";

function AudioRecorderRouteWrapper() {
  // AudioRecorder now uses token system from localStorage
  // No URL parameters needed
  return <AudioRecorder />;
}

const maintenance = false;

function App() {
  const [gold, setgold] = React.useState(
    localStorage.getItem("gold") === "true"
  );
  const [ultimate, setultimate] = React.useState(
    localStorage.getItem("ultimate") === "true"
  );

  // Cleanup URL cache on app unmount
  React.useEffect(() => {
    return () => {
      urlCache.destroy();
    };
  }, []);

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
          errorElement={<ErrorPage />}
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
          <Route path="/test" element={<Test />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/download" element={<Download />} />
          <Route path="/teacher-verify" element={<TeacherVerifyPage />} />
          <Route
            path="/create-practice"
            element={<CreatePractice getPin={getPin} />}
          />
          <Route path="/practice" element={<Practice />} />
          <Route path="/practice-exam" element={<PracticeExam />} />
          <Route path="/practice-exams" element={<PracticeExams />} />
          <Route path="/practice-exam-submissions/:examCode" element={<PracticeExamSubmissions />} />
          <Route path="/practice-exam-responses/:examCode/:studentName" element={<PracticeExamResponses />} />
          <Route path="/profile" element={<ProfileCard />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/grade-bot"
            element={<GradeBotCreator getPin={getPin} />}
          />
          <Route path="*" element={<Maintainence />} />
        </Route>
        <Route
          path="/record"
          element={<AudioRecorderRouteWrapper />}
          errorElement={<ErrorPage />}
        />
      </>
    )
  );

  return (
    <RouterProvider
      router={
        maintenance
          ? createBrowserRouter(
              createRoutesFromElements(
                <Route element={null} errorElement={<ErrorPage />}>
                  <Route path="/" element={<HomePage maintenance={true} />} />
                  <Route path="/*" element={<MaintenancePage />} />
                </Route>
              )
            )
          : route
      }
    />
  );
}

export default App;
