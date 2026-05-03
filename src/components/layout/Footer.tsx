import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BrandMark from "@/components/layout/BrandMark";
import { appRoutes } from "@/lib/routes";

export default function Footer() {
  return (
    <footer className="border-t border-border/70 bg-slate-950 text-slate-300">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10 rounded-3xl border border-white/10 bg-white/5 px-6 py-6 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <BrandMark className="mb-4 text-white" compact />
              <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                Ready to find the next place you’ll actually like living in?
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Search verified hostels, compare options quickly, and keep your shortlist organized in one place.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to={appRoutes.search}>
                <Button className="w-full bg-white text-slate-950 hover:bg-slate-100 sm:w-auto">
                  Browse hostels
                </Button>
              </Link>
              <Link to={appRoutes.auth}>
                <Button variant="outline" className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 sm:w-auto">
                  Create account
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-8">
          <div className="col-span-1 md:col-span-1">
            <p className="max-w-sm text-sm leading-6 text-slate-400">
              Uganda's leading platform for student hostel discovery. Find
              verified hostels near your university with less friction.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/90">
              Universities
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Makerere University</li>
              <li>Kyambogo University</li>
              <li>MUBS</li>
              <li>UCU</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/90">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link
                  to={appRoutes.search}
                  className="transition-colors hover:text-white"
                >
                  Browse Hostels
                </Link>
              </li>
              <li>
                <Link
                  to={`${appRoutes.auth}?mode=signup`}
                  className="transition-colors hover:text-white"
                >
                  Student Registration
                </Link>
              </li>
              <li>
                <Link to={appRoutes.faq} className="transition-colors hover:text-white">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/90">
              Contact Us
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2 leading-6">
                <span>Kampala, Uganda Plot 123, Jinja Road</span>
              </li>
              <li className="flex items-center gap-2 leading-6">
                <span>+256 700 123 456</span>
              </li>
              <li className="flex items-center gap-2 leading-6">
                <span>info@kajuhousing.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Uni-Nest. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
