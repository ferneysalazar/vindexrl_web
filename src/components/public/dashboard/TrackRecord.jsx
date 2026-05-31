export default function TrackRecord() {
  return (
    <div
      className="bg-[#c0392b] rounded-xl p-7 relative overflow-hidden"
      style={{ boxShadow: '0 6px 24px rgba(192,57,43,0.35)' }}
    >
      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute right-5 -bottom-8 w-20 h-20 rounded-full bg-white/[0.07]" />
      <div className="text-[10px] font-black uppercase tracking-[0.12em] text-white/75 mb-3">
        Proven Track Record
      </div>
      <div className="font-display text-[52px] font-bold text-white leading-none">90+</div>
      <div className="text-[13px] text-white/85 mt-1 mb-4">Successful cases</div>
      <div className="h-px bg-white/20 mb-4" />
      <div className="text-[12px] text-white/70 leading-[1.7]">
        Delivering consistent results through clear advocacy, disciplined execution,
        and client-focused legal excellence.
      </div>
    </div>
  );
}
