
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, BarChart, CheckCircle } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: "Guaranteed Security",
      description: "We comply with all security and privacy regulations for clinical trials."
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Easily manage roles and permissions for your research team."
    },
    {
      icon: BarChart,
      title: "Real-Time Reports",
      description: "Access updated data and analysis to make informed decisions."
    },
    {
      icon: CheckCircle,
      title: "Regulatory Compliance",
      description: "Tools designed to meet international standards."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-white">T</span>
              </div>
              <span className="ml-3 text-2xl font-bold text-gray-900">THEMISON</span>
            </div>
            <div className="space-x-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/auth/sign-in')}
              >
                Sign In
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate('/auth/sign-up')}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Clinical Trial Management
            <span className="block text-blue-600">Simplified</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            THEMISON is the comprehensive platform for clinical trial management. 
            Manage patients, teams, and data with maximum security and efficiency.
          </p>
          <div className="space-x-4">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate('/auth/sign-up')}
            >
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline">
              View Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
              <feature.icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Join the organizations that trust THEMISON for their clinical trials.
          </p>
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate('/auth/sign-up')}
          >
            Create Free Account
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-white">T</span>
              </div>
              <span className="ml-3 text-xl font-bold">THEMISON</span>
            </div>
            <p className="text-gray-400">
              © 2024 THEMISON. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
