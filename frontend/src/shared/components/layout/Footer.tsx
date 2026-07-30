import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#f5f5f7] text-[#1d1d1f] border-t border-zinc-200/60 pt-8 pb-12 px-6 md:px-10 selection:bg-zinc-200">
      <div className="max-w-[1024px] mx-auto">
        
        <div className="text-[11px] leading-[1.6] text-zinc-500 font-normal space-y-3 pb-5 border-b border-zinc-300/60">
          <p>{t("footer.footnote1", "1. 3D Studio Fitting Room simulations require a verified user profile and an active webcam or uploaded mesh file. Real-time rendering precision depends on your local device graphics framework.")}</p>
          <p>
            {t("footer.footnote2Part1", "2. Each couture item in the collection is meticulously hand-woven across traditional ateliers in Ethiopia. Minor differences in the geometric alignment of the ")} 
            <span className="font-semibold text-zinc-700">ጥለት (Tilet)</span> 
            {t("footer.footnote2Part2", " border motifs are natural hallmarks of bespoke artisan craft and should be expected.")}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-y-8 gap-x-4 pt-6 pb-8 text-[12px]">
          <div className="col-span-2 md:col-span-1 pr-4">
            <h4 className="font-semibold tracking-tight text-[#1d1d1f] mb-3">{t("footer.explore", "Explore")}</h4>
            <ul className="space-y-2.5 text-zinc-600 font-normal">
              <li><Link to="/products" className="hover:underline hover:text-black transition-colors">{t("footer.allCollections", "All Collections")}</Link></li>
              <li><a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.bespokeCouture", "Bespoke Couture")}</a></li>
              <li><a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.giftCards", "Gift Cards")}</a></li>
              <li><a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.showroomLocations", "Showroom Locations")}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold tracking-tight text-[#1d1d1f] mb-3">{t("footer.collection", "Collection")}</h4>
            <ul className="space-y-2.5 text-zinc-600 font-normal">
              <li><a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.habeshaKemis", "Habesha Kemis")}</a></li>
              <li><a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.suriSets", "Suri & Sets")}</a></li>
              <li><a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.shemiz", "Shemiz")}</a></li>
              <li><a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.netelaGabi", "Netela & Gabi")}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold tracking-tight text-[#1d1d1f] mb-3">{t("footer.studioAccount", "Studio & Account")}</h4>
            <ul className="space-y-2.5 text-zinc-600 font-normal">
              <li><Link to="/avatar" className="hover:underline hover:text-black transition-colors">{t("nav.fittingRoom", "Fitting Room")}</Link></li>
              <li><a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.createAvatar", "Create Avatar")}</a></li>
              <li><Link to="/orders" className="hover:underline hover:text-black transition-colors">{t("nav.orderHistory", "Order History")}</Link></li>
              <li><a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.manageProfile", "Manage Profile")}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold tracking-tight text-[#1d1d1f] mb-3">{t("footer.atelierHeritage", "Atelier Heritage")}</h4>
            <ul className="space-y-2.5 text-zinc-600 font-normal">
              <li><a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.ourWeavers", "Our Weavers")}</a></li>
              <li><a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.sustainability", "Sustainability")}</a></li>
              <li><a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.patternDictionary", "Pattern Dictionary")}</a></li>
              <li><a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.traceOrigin", "Trace Origin")}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold tracking-tight text-[#1d1d1f] mb-3">{t("footer.tiletValues", "Tilet3D Values")}</h4>
            <ul className="space-y-2.5 text-zinc-600 font-normal">
              <li><a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.findAtelier", "Find an Atelier")}</a></li>
              <li><a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.artisanFund", "Artisan Fund")}</a></li>
              <li><a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.careers", "Careers")}</a></li>
              <li><a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.contactSupport", "Contact Support")}</a></li>
            </ul>
          </div>
        </div>

        <div className="text-[11px] text-zinc-500 pb-4 border-b border-zinc-300/60 font-normal">
          {t("footer.moreWaysToShop", "More ways to shop: ")} 
          <a href="#" className="text-blue-600 underline hover:text-blue-800">{t("footer.findRepresentative", "Find an Atelier Representative")}</a> 
          {t("footer.orCall", " or call ")} <span className="text-[#1d1d1f] font-medium">+251 11 000 0000</span>.
        </div>

        <div className="pt-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-[11px] text-zinc-500 font-normal">
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
            <span className="text-[#1d1d1f] font-medium">{t("footer.copyright", "Copyright © 2026 ጥለት3D Inc.")}</span>
            <span className="hidden md:inline text-zinc-300">|</span>
            <span>{t("footer.rights", "Handcrafted in Addis Ababa, Ethiopia. All rights reserved.")}</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-zinc-600">
            <a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.privacyPolicy", "Privacy Policy")}</a>
            <span className="text-zinc-300">|</span>
            <a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.termsOfUse", "Terms of Use")}</a>
            <span className="text-zinc-300">|</span>
            <a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.salesRefunds", "Sales and Refunds")}</a>
            <span className="text-zinc-300">|</span>
            <a href="#" className="hover:underline hover:text-black transition-colors">{t("footer.legal", "Legal & Compliance")}</a>
            
            <div className="lg:ml-6 mt-1 lg:mt-0 flex items-center text-[#1d1d1f] font-medium hover:underline cursor-pointer">
              <span>{t("footer.region", "ኢትዮጵያ (Ethiopia)")}</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;