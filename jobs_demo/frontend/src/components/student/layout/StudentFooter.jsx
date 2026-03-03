export default function StudentFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="w-full px-4 py-14 grid md:grid-cols-4 gap-10">
        <div>
          <p className="text-xl font-extrabold">
            <span className="text-orange-500">Job</span>Portal
          </p>
          <p className="mt-4 text-slate-400">
            Your trusted partner in finding the perfect job opportunity.
          </p>
        </div>

        <div>
          <p className="font-bold text-white">For Candidates</p>
          <ul className="mt-4 space-y-2 text-slate-400">
            <li>Browse Jobs</li>
            <li>My Applications</li>
            <li>My Profile</li>
            <li>Career Resources</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-white">Quick Links</p>
          <ul className="mt-4 space-y-2 text-slate-400">
            <li>About Us</li>
            <li>Contact</li>
            <li>Privacy Policy</li>
            <li>Terms of Service</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-white">Contact Us</p>
          <ul className="mt-4 space-y-2 text-slate-400">
            <li>Email: info@jobportal.com</li>
            <li>Phone: +91-1800-123-456</li>
            <li>Address: Bangalore, India</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="w-full px-4 py-6 text-sm text-slate-500 flex justify-between">
          <span>© {new Date().getFullYear()} JobPortal. All rights reserved.</span>
          <span className="text-orange-400">Made for JobGateway</span>
        </div>
      </div>
    </footer>
  );
}

