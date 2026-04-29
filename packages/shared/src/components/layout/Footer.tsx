import { Link } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import BrandMark from "@/components/layout/BrandMark";
import { appRoutes } from "../../lib/routes";

export default function Footer() {
  return (
    <footer className="w-full bg-[#0f172a] text-slate-400 relative border-t border-slate-800">
      {/* Top Gradient Line to match screenshot */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Column 1: Brand & Socials */}
          <div className="space-y-6">
            <BrandMark compact />
            <p className="text-sm leading-relaxed max-w-xs">
              Uganda's leading platform for student hostel discovery. Find
              verified hostels near your university with ease.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noreferrer"
                className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-primary hover:text-white hover:border-primary transition-all"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://x.com/"
                target="_blank"
                rel="noreferrer"
                className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-primary hover:text-white hover:border-primary transition-all"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noreferrer"
                className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-primary hover:text-white hover:border-primary transition-all"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noreferrer"
                className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-primary hover:text-white hover:border-primary transition-all"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Universities */}
          <div>
            <h4 className="text-white font-semibold mb-6">Universities</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <Link
                  to="/search"
                  className="hover:text-primary transition-colors"
                >
                  Makerere University
                </Link>
              </li>
              <li>
                <Link
                  to="/search"
                  className="hover:text-primary transition-colors"
                >
                  Kyambogo University
                </Link>
              </li>
              <li>
                <Link
                  to="/search"
                  className="hover:text-primary transition-colors"
                >
                  MUBS
                </Link>
              </li>
              <li>
                <Link
                  to="/search"
                  className="hover:text-primary transition-colors"
                >
                  KIU
                </Link>
              </li>
              <li>
                <Link
                  to="/search"
                  className="hover:text-primary transition-colors"
                >
                  UCU
                </Link>
              </li>
              <li>
                <Link
                  to="/search"
                  className="hover:text-primary transition-colors"
                >
                  Nkumba University
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <Link
                  to={appRoutes.search}
                  className="hover:text-primary transition-colors"
                >
                  Browse Hostels
                </Link>
              </li>
              <li>
                <Link
                  to={appRoutes.auth}
                  className="hover:text-primary transition-colors"
                >
                  Student Registration
                </Link>
              </li>
              <li>
                <Link
                  to={appRoutes.faq}
                  className="hover:text-primary transition-colors"
                >
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Us */}
          <div>
            <h4 className="text-white font-semibold mb-6">Contact Us</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3 text-slate-300">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>
                  Kampala, Uganda
                  <br />
                  Plot 123, Jinja Road
                </span>
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span>+256 700 123 456</span>
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span>info@kajuhousing.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="border-t border-slate-800 bg-[#0B1120]">
        <div className="container mx-auto px-4 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium">
          <p>
            &copy; {new Date().getFullYear()} KAJU HOUSING. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="#" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="#" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link to="#" className="hover:text-white transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
