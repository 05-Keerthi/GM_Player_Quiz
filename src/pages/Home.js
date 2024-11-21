import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Star,
  Trophy,
  Rocket,
  Users,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import Card from "../components/CardComp";
import Navbar from "../components/NavbarComp";

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useContext(AuthContext);

  const handleNavigation = (path) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate("/login");
    }
  };

  const plans = [
    {
      icon: <Star className="text-white" />,
      title: "Basic Plan",
      description: "Perfect start for individuals",
      features: [
        "5 Quiz Attempts",
        "Basic Analytics",
        "Standard Support",
      ],
      buttonText: "Get Started",
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-700",
      path: "/create-quiz",
    },
    {
      icon: <Trophy className="text-white" />,
      title: "Pro Plan",
      description: "Elevate your quiz experience",
      features: [
        "Unlimited Quiz Attempts",
        "Advanced Analytics",
        "Priority Support",
      ],
      buttonText: "Upgrade Now",
      bgColor: "bg-gradient-to-br from-purple-500 to-purple-700",
      path: "/create-quiz",
    },
    {
      icon: <Rocket className="text-white" />,
      title: "Business Plan",
      description: "Empower your team's learning",
      features: [
        "Team Collaboration",
        "Custom Branding",
        "Dedicated Account Manager",
      ],
      buttonText: "Explore Business",
      bgColor: "bg-gradient-to-br from-green-500 to-green-700",
      path: "/create-quiz",
    },
    {
      icon: <Users className="text-white" />,
      title: "Enterprise",
      description: "Tailored solutions for large organizations",
      features: [
        "Full Customization",
        "Advanced Security",
        "24/7 Enterprise Support",
      ],
      buttonText: "Contact Sales",
      bgColor: "bg-gradient-to-br from-red-500 to-red-700",
      path: "/create-quiz",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
      
       
          <Navbar />
        
        
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {user?.role === "admin" ? (
              <div className="bg-white rounded-2xl shadow-md p-6 flex items-center space-x-6 hover:shadow-lg transition-shadow">
                <LayoutGrid className="text-blue-600" size={48} />
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Create Quiz</h2>
                  <p className="text-gray-500">Design and launch new quizzes</p>
                  <button
                    onClick={() => handleNavigation("/select-category")}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Create Now
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-md p-6 flex items-center space-x-6 hover:shadow-lg transition-shadow">
                <Trophy className="text-green-600" size={48} />
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Join Quiz</h2>
                  <p className="text-gray-500">Participate in exciting quizzes</p>
                  <button
                    onClick={() => navigate("/join-quiz")}
                    className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Join Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">Choose Your Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {plans.map((plan, index) => (
              <Card
                key={index}
                {...plan}
                onClick={() => handleNavigation(plan.path)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
