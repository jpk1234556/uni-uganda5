import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold text-white italic">Uni-Nest</span>
            </Link>
            <p className="text-sm text-slate-400">
              Uganda's leading platform for student hostel discovery. Find verified hostels near your university with ease.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Universities</h4>
            <ul className="space-y-2 text-sm">
              <li>Makerere University</li>
              <li>Kyambogo University</li>
              <li>MUBS</li>
              <li>KIU</li>
              <li>UCU</li>
              <li>Nkumba University</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/search" className="hover:text-white">Browse Hostels</Link></li>
              <li><Link to="/auth?mode=signup" className="hover:text-white">Student Registration</Link></li>
              <li><Link to="/faq" className="hover:text-white">FAQs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span>Kampala, Uganda Plot 123, Jinja Road</span>
              </li>
              <li className="flex items-center gap-2">
                <span>+256 700 123 456</span>
              </li>
              <li className="flex items-center gap-2">
                <span>info@kajuhousing.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Uni-Nest. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
