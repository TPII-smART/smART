import Button from "./Button/Button";

export function UserGuide() {
  return (
    <div className="bg-gradient-to-b from-[#0A0B14] to-[#07203c] py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-[#f89b05] to-[#d34813] bg-clip-text text-transparent">
          How It Works
        </h2>
        <p className="text-gray-400 text-center mb-16 text-lg">Three simple steps to secure, transparent freelancing</p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Step 1 */}
          <div className="bg-[#0A0B14] rounded-2xl p-8 border border-[#2a2b3e] hover:border-[#f89b05] transition-all duration-300 hover:shadow-lg hover:shadow-[#f89b05]/20">
            <div className="w-16 h-16 bg-gradient-to-br from-[#f89b05] to-[#d34813] rounded-xl flex items-center justify-center mb-6">
              <span className="text-3xl font-bold text-white">1</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Connect & Create</h3>
            <p className="text-gray-300 leading-relaxed">
              Talent? Showcase your skills and find clients seeking your expertise. Need work done? Post gigs and
              discover the perfect freelancer for your project.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-[#0A0B14] rounded-2xl p-8 border border-[#2a2b3e] hover:border-[#f89b05] transition-all duration-300 hover:shadow-lg hover:shadow-[#f89b05]/20">
            <div className="w-16 h-16 bg-gradient-to-br from-[#d34813] to-[#f89b05] rounded-xl flex items-center justify-center mb-6">
              <span className="text-3xl font-bold text-white">2</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">AI-Verified Quality</h3>
            <p className="text-gray-300 leading-relaxed">
              Every deliverable is automatically analyzed by our AI agent to ensure it matches the job requirements
              guaranteeing quality and accountability.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-[#0A0B14] rounded-2xl p-8 border border-[#2a2b3e] hover:border-[#f89b05] transition-all duration-300 hover:shadow-lg hover:shadow-[#f89b05]/20">
            <div className="w-16 h-16 bg-gradient-to-br from-[#f89b05] to-[#d34813] rounded-xl flex items-center justify-center mb-6">
              <span className="text-3xl font-bold text-white">3</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Decentralized Arbitration</h3>
            <p className="text-gray-300 leading-relaxed">
              Disputes happen. When they do, resolve them fairly through Kleros, a decentralized court system that
              ensures impartial, blockchain-secured justice.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Button
            variant="outline"
            onClick={() =>
              window.open(
                "https://amaranth-solid-pelican-132.mypinata.cloud/ipfs/bafybeiami7neicnhwcgeps6qug3knp33ikd6nctjh77qri2tc3jlzfi2gu",
                "_blank",
              )
            }
          >
            View Full User Manual
          </Button>
        </div>
      </div>
    </div>
  );
}
