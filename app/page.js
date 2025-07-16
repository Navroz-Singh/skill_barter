'use client';

import HeroSection from "@/components/ui/hero-section";
import HowItWorksSection from "@/components/ui/how-it-works-section";
import FeaturedSkillsSection from "@/components/ui/featured-skills-section";
import ValuePropositionsSection from "@/components/ui/value-propositions-section";
import SocialProofSection from "@/components/ui/social-proof-section";
import CTASection from "@/components/ui/cta-section";
import Footer from "@/components/ui/footer";

export default function Home() {
    return (
        <div>
            <HeroSection />
            <HowItWorksSection />
            <FeaturedSkillsSection />
            <ValuePropositionsSection />
            <SocialProofSection />
            <CTASection />
            <Footer />
        </div>
    );
}
