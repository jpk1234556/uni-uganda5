import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { Hostel } from "@/types";
import { motion } from "framer-motion";
import { 
  MapPin, 
  Search, 
  Building2, 
  Users, 
  Star, 
  ShieldCheck, 
  Clock, 
  CheckCircle2,
  Home as HomeIcon,
  Quote,
  Loader2
} from "lucide-react";

// --- Framer Motion Variants ---
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.7 }
};

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: "-100px" },
  transition: { staggerChildren: 0.15 }
};

const itemAnim = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function Home() {
  const [topHostels, setTopHostels] = useState<Hostel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTopHostels();
  }, []);

  const fetchTopHostels = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('hostels')
        .select('*')
        .eq('status', 'approved')
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(3);

      if (error) {
        console.warn("Rating order failed, falling back to standard fetch", error);
        const fallback = await supabase
          .from('hostels')
          .select('*')
          .eq('status', 'approved')
          .limit(3);
        setTopHostels(fallback.data || []);
      } else {
        setTopHostels(data || []);
      }
    } catch (error) {
      console.error("Error fetching top hostels:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* 1. DARK SECTION: Hero & Stats */}
      <section className="dark bg-pattern-dark pt-20 pb-24 border-b border-white/5 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-[100px] opacity-50 pointer-events-none" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-primary/10 rounded-full blur-[100px] opacity-50 pointer-events-none" />

        <div className="container mx-auto px-4 max-w-5xl text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 text-white leading-tight"
          >
            Find Your Perfect<br/>
            <span className="text-gradient-primary">Student Hostel</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-medium"
          >
            Discover verified hostels near your university in Uganda. Compare prices, amenities, and book your home away from home.
          </motion.p>

          {/* Floating Search Card */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-4xl mx-auto bg-white rounded-3xl p-4 md:p-6 shadow-2xl relative z-20 mb-20 text-slate-900 border border-slate-100"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5 text-left">
                <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wide">Select University</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <select className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none transition-all font-semibold text-base">
                    <option value="" disabled selected>Choose your university</option>
                    <option value="makerere">Makerere University</option>
                    <option value="ucu">Uganda Christian University</option>
                    <option value="kyu">Kyambogo University</option>
                    <option value="mubs">MUBS</option>
                    <option value="kiu">KIU</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wide">Search Hostels</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input 
                    className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent outline-none shadow-none font-semibold text-base transition-all"
                    placeholder="Search by name, area, or feature..."
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <Link to="/search" className="flex-1">
                <Button className="w-full h-14 bg-gradient-primary hover:opacity-90 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-primary/25 transition-all transform hover:scale-[1.02]">
                  <Search className="mr-2 h-5 w-5" /> Find Hostels
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Trusted By Stats */}
          <motion.div {...fadeInUp} className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3 tracking-tight">Trusted by Thousands</h2>
            <p className="text-slate-400 font-medium">Join the growing community of students and hostel owners using HostelUganda</p>
          </motion.div>

          {/* Staggered Stat Items */}
          <motion.div 
            {...staggerContainer}
            className="grid grid-cols-2 lg:grid-cols-6 gap-6 md:gap-8 max-w-6xl mx-auto"
          >
            {[
              { icon: Building2, count: "150+", label: "Verified Hostels", sub: "Across all major universities" },
              { icon: Users, count: "5,000+", label: "Students Served", sub: "Happy students accommodated" },
              { icon: MapPin, count: "8", label: "Universities", sub: "Covered across Uganda" },
              { icon: Star, count: "4.5", label: "Average Rating", sub: "From student reviews" },
              { icon: ShieldCheck, count: "100%", label: "Verified Listings", sub: "All hostels verified" },
              { icon: Clock, count: "24hrs", label: "Response Time", sub: "Quick booking confirmation" },
            ].map((stat, i) => (
              <motion.div key={i} variants={itemAnim} className="flex flex-col items-center">
                <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 backdrop-blur-sm transition-transform hover:scale-110">
                  <stat.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-3xl font-extrabold text-white mb-1 tracking-tight">{stat.count}</h3>
                <p className="text-xs text-primary font-bold tracking-wide uppercase mb-1">{stat.label}</p>
                <p className="text-[10px] text-slate-500 font-medium">{stat.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 2. LIGHT SECTION: Top-Rated Hostels */}
      <section className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div {...fadeInUp} className="flex justify-between items-end mb-12">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-wider uppercase mb-3">
                <Star className="h-4 w-4 fill-primary" /> Featured
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-3 tracking-tight">Top-Rated Hostels</h2>
              <p className="text-slate-600 font-medium text-lg">Discover the most popular and highly-rated hostels among students</p>
            </div>
            <Link to="/search" className="hidden md:flex">
              <Button variant="outline" className="rounded-full shadow-sm hover:bg-slate-100 font-bold border-slate-300">View All</Button>
            </Link>
          </motion.div>

          <motion.div {...staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : topHostels.length === 0 ? (
               <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                  <p className="text-slate-500 font-semibold text-lg">No verified hostels available yet.</p>
               </div>
            ) : (
              topHostels.map((hostel, index) => (
                <motion.div variants={itemAnim} key={hostel.id} className={`group ${index === 2 ? 'hidden lg:block' : ''}`}>
                  <Link to={`/hostel/${hostel.id}`} className="block h-full">
                    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-200 flex flex-col h-full">
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                        <img 
                          src={hostel.images?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=800'} 
                          alt={hostel.name} 
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-in-out" 
                        />
                        <div className="absolute top-4 left-4 flex gap-2">
                          {index === 0 && <span className="bg-amber-400 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">Featured</span>}
                          <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Verified</span>
                        </div>
                        <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl shadow-xl border border-white/10">
                          <div className="text-xs text-slate-300 font-semibold mb-0.5">From</div>
                          <div className="font-extrabold text-xl">{hostel.price_range || "Contact"}</div>
                          <div className="text-[10px] text-slate-400 font-medium">per semester</div>
                        </div>
                      </div>
                      <div className="p-7 flex flex-col flex-1">
                        <div className="flex text-xs text-slate-500 font-bold mb-3 items-center tracking-wide uppercase">
                          <MapPin className="h-3.5 w-3.5 mr-1.5 text-primary shrink-0" /> 
                          <span className="truncate">{hostel.address || hostel.university || "Uganda"}</span>
                        </div>
                        <div className="flex justify-between items-start mb-2 gap-3">
                          <h3 className="font-extrabold text-2xl text-slate-900 group-hover:text-primary transition-colors line-clamp-1 flex-1">{hostel.name}</h3>
                          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg text-sm shrink-0">
                            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                            <span className="font-extrabold text-amber-700">{hostel.rating || "4.x"}</span>
                            <span className="text-slate-400 text-xs font-semibold">({hostel.reviews_count || "0"})</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 font-medium line-clamp-2 mb-5 leading-relaxed">{hostel.description || "A verified student hostel located conveniently near the university."}</p>
                        
                        <div className="flex gap-2 text-xs text-slate-600 font-bold mb-6 flex-wrap">
                          {hostel.amenities?.slice(0, 3).map((amenity, i) => (
                             <span key={i} className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">{amenity}</span>
                          ))}
                        </div>

                        <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
                          <div className="text-sm font-extrabold text-emerald-600">
                            {Math.floor(Math.random() * 20) + 5} <span className="text-slate-500 font-semibold">rooms available</span>
                          </div>
                          <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-sm group-hover:shadow-md transition-all px-6">View Details</Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </motion.div>
          
          <div className="mt-8 text-center md:hidden">
            <Link to="/search">
              <Button variant="outline" className="rounded-full shadow-sm font-bold border-slate-300 w-full h-12">View All Hostels</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. LIGHT SECTION: How It Works */}
      <section className="py-28 bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-5 tracking-tight">How It Works</h2>
            <p className="text-slate-600 max-w-2xl mx-auto mb-20 font-medium text-lg">
              Finding your perfect student hostel in Uganda is now easier than ever. Follow these simple steps.
            </p>
          </motion.div>

          <motion.div {...staggerContainer} className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-[60px] left-[10%] right-[10%] h-[2px] bg-slate-100 z-0"></div>

            {[
              { num: 1, title: "Search", desc: "Select your university and browse verified hostels nearby.", icon: Search, color: "bg-amber-500", shadow: "shadow-amber-500/20" },
              { num: 2, title: "Compare", desc: "View hostel details, room types, amenities, and verify photos.", icon: MapPin, color: "bg-primary", shadow: "shadow-primary/20" },
              { num: 3, title: "Apply", desc: "Submit your booking request online with instant host notifications.", icon: CheckCircle2, color: "bg-pink-500", shadow: "shadow-pink-500/20" },
              { num: 4, title: "Move In", desc: "Once confirmed, process your deposit and move into your new home.", icon: HomeIcon, color: "bg-purple-500", shadow: "shadow-purple-500/20" }
            ].map((step) => (
              <motion.div variants={itemAnim} key={step.num} className="relative z-10 flex flex-col items-center group">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold mb-5 shadow-md z-20 transition-transform group-hover:scale-110">{step.num}</div>
                <div className={`w-24 h-24 rounded-3xl ${step.color} mb-8 flex items-center justify-center shadow-xl ${step.shadow} transition-transform group-hover:-translate-y-2 group-hover:rotate-3`}>
                  <step.icon className="h-10 w-10 text-white" />
                </div>
                <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100 w-full h-full flex flex-col transition-shadow group-hover:shadow-lg">
                  <h3 className="font-extrabold text-xl text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4. LIGHT SECTION: What Students Say */}
      <section className="py-28 bg-slate-50">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-5 tracking-tight">What Students Say</h2>
            <p className="text-slate-600 max-w-2xl mx-auto mb-20 font-medium text-lg">
              Join thousands of satisfied students who found their perfect home through HostelUganda
            </p>
          </motion.div>

          <motion.div {...staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              { name: "Nakamya Sarah", role: "Medical Student, Makerere", review: "HostelUganda made my hostel search incredibly easy. I found a perfect room near Mulago Hospital within my budget. The verification system gave me confidence.", img: "1" },
              { name: "Okello James", role: "Engineering Student, Kyambogo", review: "As a first-year student from Gulu, I was worried about finding accommodation in Kampala. This platform helped me find a great hostel in Banda with all amenities.", img: "11" },
              { name: "Aisha Nambi", role: "Business Student, MUBS", review: "The booking process was seamless! I applied online and got confirmed instantly. The photos were accurate and the reviews from other students were very helpful.", img: "5" }
            ].map((testimonial, i) => (
              <motion.div variants={itemAnim} key={i} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-shadow border border-slate-200 relative group">
                <Quote className="absolute top-8 right-8 h-12 w-12 text-slate-50 fill-slate-100 transition-transform group-hover:scale-110 group-hover:text-amber-50 group-hover:fill-amber-50" />
                <div className="flex text-amber-500 mb-6 gap-1">
                  {[1,2,3,4,5].map(star => <Star key={star} className="h-5 w-5 fill-amber-500" />)}
                </div>
                <p className="text-slate-700 leading-relaxed mb-8 font-semibold italic relative z-10">"{testimonial.review}"</p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="h-12 w-12 rounded-full bg-slate-200 overflow-hidden ring-2 ring-slate-100">
                    <img src={`https://i.pravatar.cc/150?img=${testimonial.img}`} alt={testimonial.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900">{testimonial.name}</h4>
                    <p className="text-xs text-slate-500 font-bold tracking-wide uppercase mt-0.5">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

    </div>
  );
}
