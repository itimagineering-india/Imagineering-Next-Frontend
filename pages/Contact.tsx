"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Clock,
  Send,
  User,
  AtSign,
  FileText,
  Layers,
  MessageCircle,
  ArrowRight,
  Headphones,
  Globe,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
} from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import ChatWidget from "@/components/chat/ChatWidget";
import contactHeroImage from "@/assets/contactusbanner.jpeg";

export async function getServerSideProps() { return { props: {} }; }

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    description: "Our team will respond within 24 hours",
    contact: "it.imagineering@gmail.com",
    action: "mailto:it.imagineering@gmail.com",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Phone,
    title: "Call Us",
    description: "Mon-Fri from 8am to 6pm EST",
    contact: "+91 9876543212",
    action: "tel:+919876543212",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Chat with us instantly",
    contact: "Start a conversation",
    action: "#chat",
    gradient: "from-purple-500 to-pink-500",
  },
];

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Instagram, href: "#", label: "Instagram" },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatWidgetRef = useRef<{ openChat: () => void }>(null);

  const heroAnimation = useScrollAnimation();
  const methodsAnimation = useScrollAnimation();
  const formAnimation = useScrollAnimation();
  const infoAnimation = useScrollAnimation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setFormData({ name: "", email: "", subject: "", category: "", message: "" });
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1">
        {/* Hero Section with Background */}
        <section className="relative py-12 sm:py-16 md:py-20 lg:py-28 overflow-hidden">
          {/* Background Image with Overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${contactHeroImage})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-primary/70" />

          {/* Decorative Elements */}
          <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 sm:w-96 sm:h-96 bg-white/5 rounded-full blur-3xl" />

          <div
            ref={heroAnimation.ref}
            className={`container relative z-10 px-4 sm:px-6 transition-all duration-700 ${heroAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/20 backdrop-blur-sm text-white/90 text-xs sm:text-sm mb-4 sm:mb-6">
                <Headphones className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>We're here to help</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 px-2">Get in Touch</h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 max-w-2xl mx-auto px-4">
                Have a question or need help? We're here to assist you. Choose the best way to reach us below.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Methods - Floating Cards */}
        <section className="py-8 sm:py-12 -mt-8 sm:-mt-12 md:-mt-16 relative z-20">
          <div className="container px-4 sm:px-6">
            <div
              ref={methodsAnimation.ref}
              className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto transition-all duration-700 delay-200 ${methodsAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              {contactMethods.map((method, index) => (
                <a
                  key={method.title}
                  href={method.action}
                  onClick={(e) => {
                    if (method.action === "#chat") {
                      e.preventDefault();
                      chatWidgetRef.current?.openChat();
                    }
                  }}
                  className="group block"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-card">
                    {/* Gradient Border Effect */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${method.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    />
                    <div className="absolute inset-[2px] bg-card rounded-[calc(var(--radius)-2px)]" />

                    <CardContent className="relative pt-6 sm:pt-8 pb-6 sm:pb-8 px-4 sm:px-6 text-center">
                      <div
                        className={`mx-auto mb-4 sm:mb-5 flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ${method.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}
                      >
                        <method.icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1.5 sm:mb-2">{method.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{method.description}</p>
                      <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm sm:text-base group-hover:gap-3 transition-all duration-300">
                        <span className="break-all">{method.contact}</span>
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      </span>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-8 sm:py-12 md:py-16 lg:py-24 bg-muted/30">
          <div className="container px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 max-w-6xl mx-auto">
              {/* Form */}
              <div
                ref={formAnimation.ref}
                className={`transition-all duration-700 delay-300 ${formAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              >
                <Card className="border-0 shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-primary/80 p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
                      <Send className="h-5 w-5 sm:h-6 sm:w-6" />
                      Send Us a Message
                    </h2>
                    <p className="text-white/80 mt-1 text-xs sm:text-sm">We'll get back to you as soon as possible</p>
                  </div>
                  <CardContent className="p-4 sm:p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-xs sm:text-sm font-medium">
                            Your Name
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                            <Input
                              id="name"
                              placeholder="John Doe"
                              className="pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base border-muted-foreground/20 focus:border-primary transition-colors"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-xs sm:text-sm font-medium">
                            Email Address
                          </Label>
                          <div className="relative">
                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="john@example.com"
                              className="pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base border-muted-foreground/20 focus:border-primary transition-colors"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category" className="text-xs sm:text-sm font-medium">
                            Category
                          </Label>
                          <div className="relative">
                            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground z-10" />
                            <Select
                              value={formData.category}
                              onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                              <SelectTrigger className="pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base border-muted-foreground/20">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General Inquiry</SelectItem>
                                <SelectItem value="support">Technical Support</SelectItem>
                                <SelectItem value="billing">Billing Question</SelectItem>
                                <SelectItem value="partnership">Partnership</SelectItem>
                                <SelectItem value="press">Press Inquiry</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject" className="text-xs sm:text-sm font-medium">
                            Subject
                          </Label>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                            <Input
                              id="subject"
                              placeholder="How can we help?"
                              className="pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base border-muted-foreground/20 focus:border-primary transition-colors"
                              value={formData.subject}
                              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-xs sm:text-sm font-medium">
                          Message
                        </Label>
                        <div className="relative">
                          <MessageCircle className="absolute left-3 top-3 sm:top-4 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                          <Textarea
                            id="message"
                            placeholder="Tell us more about your inquiry..."
                            rows={5}
                            className="pl-9 sm:pl-10 pt-3 text-sm sm:text-base border-muted-foreground/20 focus:border-primary transition-colors resize-none"
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-xl"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <span className="h-3.5 w-3.5 sm:h-4 sm:w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            Send Message
                          </span>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Info Section */}
              <div
                ref={infoAnimation.ref}
                className={`space-y-4 sm:space-y-6 transition-all duration-700 delay-400 ${infoAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              >
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4">We'd Love to Hear From You</h2>
                  <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
                    Whether you have a question about our platform, pricing, or anything else, our team is ready to
                    answer all your questions.
                  </p>
                </div>

                {/* Office Card */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-1.5 sm:w-2 bg-gradient-to-b from-blue-500 to-cyan-500 group-hover:w-2 sm:group-hover:w-3 transition-all duration-300" />
                      <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg">
                          <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-foreground text-base sm:text-lg">Our Office</h3>
                          <p className="text-muted-foreground mt-1.5 sm:mt-2 leading-relaxed text-sm sm:text-base">
                            123 Kolar, Bhopal
                            <br />
                            Madhya Pradesh, India
                            <br />
                            462023
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Hours Card */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-1.5 sm:w-2 bg-gradient-to-b from-green-500 to-emerald-500 group-hover:w-2 sm:group-hover:w-3 transition-all duration-300" />
                      <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shrink-0 shadow-lg">
                          <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-foreground text-base sm:text-lg">Business Hours</h3>
                          <div className="text-muted-foreground mt-1.5 sm:mt-2 space-y-1 text-xs sm:text-sm">
                            <p className="flex flex-col sm:flex-row sm:justify-between sm:gap-8">
                              <span>Monday - Friday:</span>
                              <span className="font-medium text-foreground">8:00 AM - 6:00 PM</span>
                            </p>
                            <p className="flex flex-col sm:flex-row sm:justify-between sm:gap-8">
                              <span>Saturday:</span>
                              <span className="font-medium text-foreground">9:00 AM - 2:00 PM</span>
                            </p>
                            <p className="flex flex-col sm:flex-row sm:justify-between sm:gap-8">
                              <span>Sunday:</span>
                              <span className="font-medium text-foreground">Closed</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Global Support Card */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-1.5 sm:w-2 bg-gradient-to-b from-purple-500 to-pink-500 group-hover:w-2 sm:group-hover:w-3 transition-all duration-300" />
                      <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg">
                          <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-foreground text-base sm:text-lg">Global Support</h3>
                          <p className="text-muted-foreground mt-1.5 sm:mt-2 text-sm sm:text-base">
                            We serve customers worldwide with support in multiple languages and time zones.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Priority Support CTA */}
                <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-primary/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <h3 className="font-bold text-foreground text-base sm:text-lg mb-1.5 sm:mb-2">Need Immediate Help?</h3>
                    <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm">
                      Pro and Business subscribers have access to priority support and live chat with dedicated account
                      managers.
                    </p>
                    <Button variant="default" size="sm" asChild className="shadow-lg text-xs sm:text-sm h-9 sm:h-10">
                      <a href="/pricing" className="inline-flex items-center gap-2">
                        View Plans
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Social Links */}
                <div className="pt-2 sm:pt-4">
                  <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Follow Us</h3>
                  <div className="flex gap-2 sm:gap-3">
                    {socialLinks.map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        aria-label={social.label}
                        className="h-9 w-9 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg"
                      >
                        <social.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <ChatWidget ref={chatWidgetRef} />
    </div>
  );
}
