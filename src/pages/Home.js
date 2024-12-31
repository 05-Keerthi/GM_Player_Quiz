import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Star,
  Trophy,
  Rocket,
  Users,
  Building,
  Activity,
} from "lucide-react";
import { useAuthContext } from "../context/AuthContext";
import Card from "../components/CardComp";
import Navbar from "../components/NavbarComp";
import UserManagement from "../components/Usercard";
import TenantManagement from "../components/TenantManagement";
import CreateTenantModal from "../models/Tenant/CreateTenantModel";

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleNavigation = (path) => {
    if (path.includes("/join-quiz") || path.includes("-plan")) {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }
    }
    navigate(path);
  };

  const handleAction = (action) => {
    if (action.modalAction) {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }
      setIsCreateModalOpen(true);
    } else if (action.path) {
      handleNavigation(action.path);
    }
  };

  const getRoleBasedActions = () => {
    if (!isAuthenticated) {
      return [
        {
          icon: <Trophy className="text-green-600" size={48} />,
          title: "Join Quiz",
          description: "Participate in exciting quizzes",
          buttonText: "Join Now",
          buttonColor: "bg-green-500 hover:bg-green-600",
          path: "/join-quiz",
        },
      ];
    }

    switch (user?.role) {
      case "superadmin":
        return [
          {
            icon: <Building className="text-purple-600" size={48} />,
            title: "Create Tenant",
            description: "Set up new organization spaces",
            buttonText: "Create Tenant",
            buttonColor: "bg-purple-500 hover:bg-purple-600",
            modalAction: true,
          },
        ];
      case "tenant_admin":
      case "admin":
        return [
          {
            icon: <LayoutGrid className="text-blue-600" size={48} />,
            title: "Create Quiz",
            description: "Design and launch new quizzes",
            buttonText: "Create Now",
            buttonColor: "bg-blue-500 hover:bg-blue-600",
            path: "/selectQuizCategory",
          },
          {
            icon: <Rocket className="text-orange-600" size={48} />,
            title: "View Quizzes",
            description: "Manage and monitor all quizzes",
            buttonText: "Go to Quizzes",
            buttonColor: "bg-orange-500 hover:bg-orange-600",
            path: "/quiz-list",
          },
          {
            icon: <LayoutGrid className="text-blue-600" size={48} />,
            title: "Create Survey",
            description: "Create and launch new surveys",
            buttonText: "Create Now",
            buttonColor: "bg-green-500 hover:bg-blue-600",
            path: "/selectSurveyCategory",
          },
          {
            icon: <Rocket className="text-orange-600" size={48} />,
            title: "View Surveys",
            description: "Manage and monitor all surveys",
            buttonText: "Go to Surveys",
            buttonColor: "bg-orange-500 hover:bg-orange-600",
            path: "/survey-list",
          },
          {
            icon: <Activity className="text-blue-600" size={48} />,
            title: "View Activity Log",
            description: "Manage and monitor activities",
            buttonText: "Go to Activity Log",
            buttonColor: "bg-blue-500 hover:bg-orange-600",
            path: "/activity-log",
          },
          {
            icon: <Rocket className="text-orange-600" size={48} />,
            title: "View Reports",
            description: "Manage and monitor all reports",
            buttonText: "Go to Reports",
            buttonColor: "bg-orange-500 hover:bg-orange-600",
            path: "/reports",
          },
        ];
      case "user":
        return [
          {
            icon: <Trophy className="text-green-600" size={48} />,
            title: "Join Quiz",
            description: "Participate in exciting quizzes",
            buttonText: "Join Now",
            buttonColor: "bg-green-500 hover:bg-green-600",
            path: "/join",
          },
          {
            icon: <Trophy className="text-green-600" size={48} />,
            title: "Join Survey",
            description: "Participate in exciting surveys",
            buttonText: "Join Now",
            buttonColor: "bg-green-500 hover:bg-green-600",
            path: "/joinsurvey",
          },
          {
            icon: <Rocket className="text-orange-600" size={48} />,
            title: "View Reports", // Added for user role
            description: "View reports and your quiz performance",
            buttonText: "View Reports",
            buttonColor: "bg-orange-500 hover:bg-orange-600",
            path: `/userreports/${user?.id}`, // Path to reports page
          },
        ];
      default:
        return [];
    }
  };

  const plans = [
    {
      icon: <Star className="text-white" />,
      title: "Basic Plan",
      description: "Perfect start for individuals",
      features: ["5 Quiz Attempts", "Basic Analytics", "Standard Support"],
      buttonText: "Get Started",
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-700",
      path: "/basic-plan",
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
      path: "/pro-plan",
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
      path: "/business-plan",
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
      path: "/enterprise",
    },
  ];

  const roleBasedActions = getRoleBasedActions();

  const renderSecondSection = () => {
    if (!isAuthenticated) {
      return (
        <>
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
            Choose Your Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => (
              <Card
                key={index}
                {...plan}
                onClick={() => handleNavigation(plan.path)}
              />
            ))}
          </div>
        </>
      );
    }

    switch (user?.role) {
      case "superadmin":
        return (
          <>
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
              Tenant Management
            </h2>
            <TenantManagement />
          </>
        );
      case "tenant_admin":
        return (
          <>
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
              User Management
            </h2>
            <UserManagement />
          </>
        );
      case "admin":
        return null;
      case "user":
        return (
          <>
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
              Choose Your Plan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan, index) => (
                <Card
                  key={index}
                  {...plan}
                  onClick={() => handleNavigation(plan.path)}
                />
              ))}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <Navbar />
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roleBasedActions.map((action, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-md p-6 flex items-center space-x-6 hover:shadow-lg transition-shadow"
              >
                {action.icon}
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {action.title}
                  </h2>
                  <p className="text-gray-500">{action.description}</p>
                  <button
                    onClick={() => handleAction(action)}
                    className={`mt-4 px-4 py-2 text-white rounded-lg transition-colors ${action.buttonColor}`}
                  >
                    {action.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {renderSecondSection()}

        <CreateTenantModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </main>
    </div>
  );
}
