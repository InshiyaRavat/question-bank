import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Users, Star, ArrowRight, CheckCircle, Heart, Award, Clock, Stethoscope } from "lucide-react";
import Link from "next/link";
import DynamicLogo from "@/components/common/DynamicLogo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <DynamicLogo fallbackText="MedQuest" size="md" showText={true} className="text-slate-900" />
            <Link href="/sign-in">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg cursor-pointer">
                Start Studying
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.1),transparent_50%)]"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Master Your{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Medical Studies
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Comprehensive question bank designed for medical students to excel in their studies and build clinical
              expertise
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-in">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg px-8 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              {/* <Button
                                size="lg"
                                variant="outline"
                                className="text-lg px-8 py-4 bg-white/80 backdrop-blur border-2 border-slate-300 hover:bg-white hover:shadow-lg transition-all duration-300"
                            >
                                View Demo
                            </Button> */}
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Medical Students Choose MedQuest</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Everything you need to excel in your medical education and build clinical expertise
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-slate-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Comprehensive Questions</h3>
                <p className="text-slate-600 leading-relaxed">
                  Access 10,000+ carefully curated questions covering all major medical topics with detailed
                  explanations and clinical correlations
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Heart className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Clinical Case Studies</h3>
                <p className="text-slate-600 leading-relaxed">
                  Practice with real patient scenarios and develop clinical reasoning skills essential for medical
                  practice and patient care
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Smart Learning</h3>
                <p className="text-slate-600 leading-relaxed">
                  AI-powered system adapts to your learning pace and focuses on your weak areas for maximum study
                  efficiency and retention
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Success Stories from Medical Students
            </h2>
            <p className="text-xl text-slate-600">
              Join thousands of medical students who have excelled in their studies with confidence
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-slate-200 shadow-xl bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  MedQuest helped me excel in my medical studies! The explanations are incredibly detailed and the
                  question format is perfect for building clinical knowledge.
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                    <span className="text-white font-semibold">SM</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Sarah Martinez</p>
                    <p className="text-sm text-slate-500">Medical Student, Johns Hopkins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-xl bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  The clinical cases are amazing! They really helped me develop the diagnostic thinking I needed for my
                  medical education and clinical rotations.
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                    <span className="text-white font-semibold">JD</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">James Davis</p>
                    <p className="text-sm text-slate-500">Medical Student, Harvard Medical</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-xl bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  The smart learning feature is a game-changer. It identified my weak areas and helped me focus my study
                  time effectively for all my medical courses.
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                    <span className="text-white font-semibold">AL</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Anna Lee</p>
                    <p className="text-sm text-slate-500">Medical Student, Stanford Medicine</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Excel in Medical Studies?</h2>
            {/* <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                            Join over 50,000 medical students who are already advancing their medical knowledge with MedQuest
                        </p> */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-in">
                <Button
                  size="lg"
                  className="bg-white hover:bg-gray-100 text-blue-600 text-lg px-8 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                >
                  Get Started
                  <CheckCircle className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pay">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4 bg-white/10 backdrop-blur transition-all duration-300 hover:shadow-xl cursor-pointer"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Stethoscope className="h-6 w-6 text-blue-400" />
                <span className="text-lg font-bold text-white">MedQuest</span>
              </div>
              <p className="text-slate-400">
                Empowering medical students worldwide with comprehensive study materials and clinical knowledge.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Study Materials</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                    Question Bank
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                    Clinical Cases
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                    Study Guides
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                    Practice Tests
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Medical Topics</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                    Basic Sciences
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                    Clinical Medicine
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                    Pathology
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                    Pharmacology
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                    Study Groups
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center">
            <p className="text-slate-400">
              © 2025 MedQuest. All rights reserved. Empowering the next generation of physicians.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
