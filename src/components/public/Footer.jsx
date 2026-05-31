import Icon from '../shared/Icon';
import Logo from '../shared/Logo';

function FooterLink({ label }) {
  return (
    <div className="flex items-center gap-1.5 mb-2 text-[13px] text-white/50 footer-link cursor-pointer">
      <Icon name="chevron" size={11} color="#c0392b" />
      {label}
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#1e2d4a] mt-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 px-7 pt-10 pb-7">

        <div>
          <Logo />
          <p className="text-[12px] text-white/45 leading-[1.8] mt-4 max-w-[210px]">
            Trusted legal management platform for modern law firms, delivering
            clarity, advocacy, and reliable outcomes.
          </p>
          <div className="flex gap-1.5 mt-4">
            {['star', 'shield', 'check'].map(ic => (
              <button
                key={ic}
                className="w-8 h-8 rounded-md bg-white/[0.08] flex items-center justify-center
                  hover:bg-[#c0392b]/50 transition-colors"
              >
                <Icon name={ic} size={14} color="#fff" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-white font-bold text-[11px] uppercase tracking-[0.1em] mb-4">
            Practice Areas
          </div>
          {['Personal Injury', 'Family Law', 'Criminal Defense', 'Employment Law', 'Real Estate', 'Corporate Law'].map(item => (
            <FooterLink key={item} label={item} />
          ))}
        </div>

        <div>
          <div className="text-white font-bold text-[11px] uppercase tracking-[0.1em] mb-4">
            Quick Links
          </div>
          {['Dashboard', 'Documentos Totales y', 'Client Portal', 'Documents', 'Billing & Invoices', 'Reports'].map(item => (
            <FooterLink key={item} label={item} />
          ))}
        </div>

        <div>
          <div className="text-white font-bold text-[11px] uppercase tracking-[0.1em] mb-4">
            Contact
          </div>
          {[
            { icon: 'phone', text: '+1 200 300 9000' },
            { icon: 'mail',  text: 'contact@vindexrl.com' },
            { icon: 'clock', text: 'Mon–Sat: 08:00 – 20:00' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 mb-3 text-[13px]">
              <Icon name={item.icon} size={14} color="#c0392b" />
              <span className="text-white/55">{item.text}</span>
            </div>
          ))}
          <button
            className="btn-accent mt-2 px-5 py-2 rounded-md text-white text-[11px]
              font-bold tracking-wide cursor-pointer"
            style={{ boxShadow: '0 4px 14px rgba(192,57,43,0.45)' }}
          >
            BOOK APPOINTMENT
          </button>
        </div>
      </div>

      <div className="border-t border-white/[0.08] px-7 py-3.5 flex flex-wrap items-center
        justify-between gap-2 text-[11px] text-white/30">
        <span>© 2026 VindexRL Legal Management. All rights reserved.</span>
        <div className="flex gap-5">
          {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => (
            <span key={l} className="cursor-pointer hover:text-white/75 transition-colors">{l}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}
