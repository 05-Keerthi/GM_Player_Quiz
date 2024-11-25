import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Star,
  Trophy,
  Rocket,
  Users,
  Building,
} from "lucide-react";
import { useAuthContext } from "../context/AuthContext";
import Card from "../components/CardComp";
import Navbar from "../components/NavbarComp";
import UserManagement from "../components/Usercard";
import TenantManagement from "../components/TenantCard";
import CreateTenantModal from "../models/Tenant/CreateTenantModel";

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleNavigation = (path) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate("/login");
    }
  };

  const handleAction = (action) => {
    if (action.modalAction) {
      setIsCreateModalOpen(true);
    } else if (action.path) {
      handleNavigation(action.path);
    }
  };

  const getRoleBasedActions = () => {
    switch (user?.role) {
      case "superadmin":
        return [
          {
            icon: <Building className="text-purple-600" size={48} />,
            title: "Create Tenant",
            description: "Set up new organization spaces",
            buttonText: "Create Tenant",
            buttonColor: "bg-purple-500 hover:bg-purple-600",
            modalAction: true, // Added this to indicate it should open a modal
          },
          {
            icon: <LayoutGrid className="text-blue-600" size={48} />,
            title: "Create Quiz",
            description: "Design and launch new quizzes",
            buttonText: "Create Now",
            buttonColor: "bg-blue-500 hover:bg-blue-600",
            path: "/select-category",
          },
        ];
      case "admin":
        return [
          {
            icon: <LayoutGrid className="text-blue-600" size={48} />,
            title: "Create Quiz",
            description: "Design and launch new quizzes",
            buttonText: "Create Now",
            buttonColor: "bg-blue-500 hover:bg-blue-600",
            path: "/select-category",
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
            path: "/join-quiz",
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
      case "admin":
        return (
          <>
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
              User Management
            </h2>
            <UserManagement />
          </>
        );
      default:
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

        <section>{renderSecondSection()}</section>

        {/* Create Tenant Modal */}
        <CreateTenantModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </main>
    </div>
  );
}
