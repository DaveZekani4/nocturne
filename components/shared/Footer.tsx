import { MessageCircle, Users, ShieldCheck } from "lucide-react";

const CONTACTS = [
  { name: "Dio", role: "Director of Socials, Computing", phone: "2349166052133" },
  { name: "Mxrtiegnf", role: "", phone: "2348030979806" },
  { name: "Christabel", role: "Director of Socials, S.C.F", phone: "2349029259343" },
];

// TODO: swap in the real WhatsApp group invite link once it's created
const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/Cw7EvRfdmDU8dn5sRKe6OZ?mode=gi_t";

export default function Footer() {
  return (
    <footer
      id="enquiries"
      className="mt-auto border-t border-border-subtle bg-background px-6 py-9"
    >
      <p className="font-glitch text-xs uppercase tracking-[0.2em] text-neon-purple">
        Enquiries
      </p>
      <p className="mt-2 text-sm text-foreground/70">
        Questions about entry, gear, or the gate protocol? Reach the crew on
        WhatsApp.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {CONTACTS.map((contact) => (
          <a
            key={contact.phone}
            href={`https://wa.me/${contact.phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 border border-border-subtle px-4 py-3"
          >
            <div className="flex items-center gap-2.5">
              <MessageCircle size={16} className="flex-shrink-0 text-neon-purple" />
              <div>
                <div className="font-display font-700 text-sm">
                  {contact.name}
                </div>
                {contact.role && (
                  <div className="font-glitch text-[9.5px] uppercase tracking-wider text-foreground/40">
                    {contact.role}
                  </div>
                )}
              </div>
            </div>
            <span className="font-glitch text-xs text-foreground/60">
              {contact.phone.replace("234", "0")}
            </span>
          </a>
        ))}
      </div>

      <a
        href={WHATSAPP_GROUP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-2 border border-neon-purple bg-neon-purple py-3.5 font-display font-700 text-[13.5px] text-background"
      >
        <Users size={16} /> Join the WhatsApp Group
      </a>

      <div className="mt-6 flex items-center gap-1.5 font-glitch text-[10.5px] tracking-wider text-foreground/50">
        <ShieldCheck size={13} className="text-neon-purple" />
        SECURED BY PAYSTACK · NDPR-READY
      </div>

      <div className="mt-7 flex flex-col items-center gap-1 border-t border-border-subtle pt-5 text-center">
  <p className="font-glitch text-xs tracking-wider text-foreground/60">
    Powered by{" "}
    
      <a href="https://wa.me/2349157678946"
      target="_blank"
      rel="noopener noreferrer"
      className="text-base font-700 text-neon-purple-bright underline underline-offset-2"
    >
      ZekaniK
    </a>
  </p>
  <p className="font-glitch text-xs tracking-wider text-foreground/60">
    Sponsored by <span className="text-neon-purple-bright">AgoraX</span>
  </p>
</div>

    </footer>
  );
}
