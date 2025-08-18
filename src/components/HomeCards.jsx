import Card from "./Card2";
import { Link } from "react-router-dom";

function HomeCards() {
  const teacherCards = [
    {
      title: "Question Sets",
      description:
        "For teacher use. Create a new set: configure rubric, settings, and question bank.",
      link: "/configure",
      buttonText: "Configure",
      color: "blue",
    },
    {
      title: "Create Room",
      description: "For Teacher Use. Create a room for your students.",
      link: "/create-room",
      buttonText: "Create",
      color: "cyan",
    },
    {
      title: "Grading",
      description: "For Teacher Use. Grade your students' submissions",
      link: "/teacher-portal",
      buttonText: "Grade",
      color: "purple",
    },
    {
      title: "Create Practice",
      description:
        "For Teacher Use. Create an asynchronous ungraded practice session for your students.",
      link: "/create-practice",
      buttonText: "Create",
      color: "pink",
    },
    {
      title: "Grade Practice Sets",
      description:
        "For Teacher Use. Check the completions and grade the practice sets you assigned to your students",
      link: "/practice-exams",
      buttonText: "Grade",
      color: "teal",
    },
  ];

  const studentCards = [
    {
      title: "Join Room",
      description: "Join a room created by your teacher.",
      link: "/join-room",
      buttonText: "Join",
      color: "purple",
    },
    {
      title: "Join Practice",
      description: "Join a practice session created by your teacher.",
      link: "/practice",
      buttonText: "Join",
      color: "pink",
    },
  ];

  return (
    <section className="py-0 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Teacher Section - Left Side */}
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white text-center mb-8 relative">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                Teacher Resources
              </span>
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {teacherCards.map((card, index) => (
                <div
                  key={index}
                  className="transform transition-all duration-500"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: "fadeInUp 0.5s ease-out forwards",
                  }}
                >
                  <Card color={card.color} className="h-full flex flex-col">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {card.title}
                    </h2>
                    <p className="mt-2 mb-6 text-gray-300 flex-grow">
                      {card.description}
                    </p>
                    <Link
                      to={card.link}
                      className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-white bg-black/50 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/30 group"
                    >
                      <span>{card.buttonText}</span>
                      <svg
                        className="ml-2 w-5 h-5 transform transition-transform duration-300 group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </Link>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Student Section - Right Side */}
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white text-center mb-8 relative">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                Student Resources
              </span>
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {studentCards.map((card, index) => (
                <div
                  key={index}
                  className="transform transition-all duration-500"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: "fadeInUp 0.5s ease-out forwards",
                  }}
                >
                  <Card color={card.color} className="h-full flex flex-col">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {card.title}
                    </h2>
                    <p className="mt-2 mb-6 text-gray-300 flex-grow">
                      {card.description}
                    </p>
                    <Link
                      to={card.link}
                      className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-white bg-black/50 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30 group"
                    >
                      <span>{card.buttonText}</span>
                      <svg
                        className="ml-2 w-5 h-5 transform transition-transform duration-300 group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </Link>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeCards;
