"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UsersIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ClockIcon,
  TrendingUpIcon,
  MessageSquareIcon,
  StarIcon,
  ArrowRightIcon,
} from "lucide-react";

type RoleSelectionPageProps = {
  onSelectRole: (role: "hunter" | "poster") => void;
};

export function RoleSelectionPage({ onSelectRole }: RoleSelectionPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
            🚀 AI-Powered HR Screening Tool
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Revolutionize Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}
              Hiring Process
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Connect job seekers with opportunities through intelligent AI
            conversations. Screen candidates efficiently or get matched with
            your dream job - all powered by advanced AI.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
            <div className="text-3xl font-bold text-blue-600 mb-2">10,000+</div>
            <div className="text-gray-600">Successful Matches</div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
            <div className="text-3xl font-bold text-purple-600 mb-2">85%</div>
            <div className="text-gray-600">Faster Screening</div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
            <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
            <div className="text-gray-600">AI Availability</div>
          </div>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          {/* Job Seeker Card */}
          <Card className="relative overflow-hidden border-2 hover:border-blue-300 transition-all duration-300 hover:shadow-xl group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full -translate-y-16 translate-x-16 opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <UsersIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-gray-900">
                    For Job Seekers
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Get screened for multiple opportunities
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Smart Screening Conversations
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Engage with AI recruiters tailored to specific job roles
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <ClockIcon className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      24/7 Availability
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Practice interviews and get screened anytime, anywhere
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <TrendingUpIcon className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Multiple Role Screening
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Get evaluated for various positions simultaneously
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => onSelectRole("hunter")}
                className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 group"
              >
                Start Getting Screened
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          {/* Employer Card */}
          <Card className="relative overflow-hidden border-2 hover:border-purple-300 transition-all duration-300 hover:shadow-xl group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full -translate-y-16 translate-x-16 opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <BriefcaseIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-gray-900">
                    For Employers
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Automate screening for thousands of candidates
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MessageSquareIcon className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Automated Screening
                    </h4>
                    <p className="text-gray-600 text-sm">
                      AI conducts initial interviews and evaluations
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <TrendingUpIcon className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Scale Your Hiring
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Screen hundreds of candidates simultaneously
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <StarIcon className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Quality Insights
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Get detailed candidate evaluations and summaries
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => onSelectRole("poster")}
                className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 group"
              >
                Start Screening Candidates
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Our AI HR Screening Tool?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="p-4 bg-blue-100 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MessageSquareIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Natural Conversations
              </h3>
              <p className="text-gray-600 text-sm">
                AI that understands context and asks relevant questions
              </p>
            </div>
            <div className="text-center">
              <div className="p-4 bg-green-100 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <ClockIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Save Time</h3>
              <p className="text-gray-600 text-sm">
                Reduce screening time by up to 85% with automation
              </p>
            </div>
            <div className="text-center">
              <div className="p-4 bg-purple-100 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUpIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Better Matches
              </h3>
              <p className="text-gray-600 text-sm">
                AI analyzes compatibility beyond just keywords
              </p>
            </div>
            <div className="text-center">
              <div className="p-4 bg-orange-100 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <StarIcon className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Detailed Insights
              </h3>
              <p className="text-gray-600 text-sm">
                Comprehensive candidate evaluations and reports
              </p>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Trusted by Industry Leaders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-6">
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className="h-5 w-5 text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <p className="text-gray-600 mb-4 italic">
                "This AI screening tool transformed our hiring process. We're
                now able to evaluate 10x more candidates while maintaining
                quality standards."
              </p>
              <div className="text-sm">
                <div className="font-semibold text-gray-900">Sarah Chen</div>
                <div className="text-gray-500">Head of Talent, TechCorp</div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className="h-5 w-5 text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <p className="text-gray-600 mb-4 italic">
                "As a job seeker, this platform helped me practice interviews
                and get screened for multiple roles. I landed my dream job
                within weeks!"
              </p>
              <div className="text-sm">
                <div className="font-semibold text-gray-900">
                  Marcus Rodriguez
                </div>
                <div className="text-gray-500">Software Engineer</div>
              </div>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of companies and job seekers using AI-powered
            screening
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => onSelectRole("hunter")}
              size="lg"
              variant="secondary"
              className="text-lg px-8"
            >
              I'm Looking for Jobs
            </Button>
            <Button
              onClick={() => onSelectRole("poster")}
              size="lg"
              variant="outline"
              className="text-lg px-8 bg-transparent border-white text-white hover:bg-white hover:text-purple-600"
            >
              I'm Hiring Talent
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
