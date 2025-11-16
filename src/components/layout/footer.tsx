"use client";

import { Facebook, Instagram, Twitter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Footer() {

  const sections = [
    {
      id: 'about',
      title: 'MORE ABOUT LEVIS INDIA STORE',
      content: 'Discover the world of Levi\'s, a brand synonymous with quality denim and timeless style since 1873. From iconic jeans to comfortable casual wear, Levi\'s India offers premium products for every lifestyle.'
    },
    {
      id: 'quick',
      title: 'QUICK LINKS',
      links: ["Men's Jeans", "Women's Jeans", "Men's T-Shirts", "Women's Tops", "Belts & Wallets", "Footwear", "Men's Jackets", "Red Tab Member Program", "Store Locator"]
    },
    {
      id: 'support',
      title: 'SUPPORT',
      links: ["Help", "Returns & Exchanges", "Shipping", "About Us"]
    },
    {
      id: 'contact',
      title: 'CONTACT',
      contactItems: [
        { label: 'For Customer care', value: 'customercare@levi.in', type: 'email' },
        { label: 'For Order Escalation', value: 'feedbacklevi@levi.in', type: 'email' },
        { label: 'For Online Orders', value: '1800-123-584', type: 'phone' },
        { label: 'For Store Queries', value: '1800-1020-501', type: 'phone' },
        { label: 'Call Timings', value: 'Mon-Sat : 10AM - 6PM', type: 'text' }
      ]
    },
    {
      id: 'company',
      title: 'COMPANY',
      links: ["About Us", "Careers", "Press", "Blog"]
    },
    {
      id: 'perks',
      title: 'ITS ALL ABOUT THE PERKS',
      isPerks: true
    }
  ];

  return (
    <footer className="bg-white">

      {/* Mobile and Tablet Footer */}
      <div className="md:hidden px-4 py-6 space-y-0">
        {/* Collapsible sections for mobile */}
        {sections.map((section) => (
          <details key={section.id} className="group border-b border-gray-200">
            <summary className="flex items-center justify-between cursor-pointer py-4 select-none">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-900">{section.title}</h3>
              <ChevronDown className="w-4 h-4 text-gray-600 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pb-4 space-y-3">
              {section.isPerks ? (
                <div className="space-y-4">
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full px-0 py-2 border-b border-gray-300 text-sm bg-transparent outline-none placeholder-gray-400 focus:border-gray-900"
                  />
                  <Button className="w-full bg-gray-900 text-white hover:bg-black text-sm py-3">
                    Subscribe
                  </Button>
                  <p className="text-xs text-gray-600">
                    *See <Link href="#" className="underline">Details</Link> on Terms and Conditions and <Link href="#" className="underline">Privacy Policy</Link> for our privacy practices.
                  </p>
                </div>
              ) : section.contactItems ? (
                <div className="space-y-3">
                  {section.contactItems.map((item, idx) => (
                    <div key={idx}>
                      <p className="text-xs font-bold text-gray-900 mb-1">{item.label}</p>
                      <Link href={item.type === 'email' ? `mailto:${item.value}` : `tel:${item.value}`} className="text-xs text-gray-600">
                        {item.value}
                      </Link>
                    </div>
                  ))}
                </div>
              ) : section.content ? (
                <p className="text-xs text-gray-600 leading-relaxed">{section.content}</p>
              ) : (
                <ul className="space-y-2">
                  {section.links?.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-xs text-gray-600">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </details>
        ))}

        {/* Copyright and socials for mobile */}
        <div className="pt-6 space-y-4 text-center">
          <p className="text-xs text-gray-600">© 2025, Levis India Store</p>
          <div className="flex gap-4 justify-center">
            <Link href="#" className="text-gray-600 hover:text-gray-900 transition">
              <Facebook className="w-4 h-4" />
            </Link>
            <Link href="#" className="text-gray-600 hover:text-gray-900 transition">
              <Instagram className="w-4 h-4" />
            </Link>
            <Link href="#" className="text-gray-600 hover:text-gray-900 transition">
              <Twitter className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop and Tablet Footer (md+) */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <details className="group border-b border-gray-200 pb-4 mb-8">
          <summary className="flex items-center justify-between cursor-pointer py-4 select-none">
            <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-gray-900">More About Levi&rsquo;s India Store</h3>
            <ChevronDown className="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" />
          </summary>
          <p className="text-gray-600 text-sm leading-relaxed pb-4">
            Discover the world of Levi&rsquo;s, a brand synonymous with quality denim and timeless style since 1873. From iconic jeans to comfortable casual wear, Levi&rsquo;s India offers premium products for every lifestyle.
          </p>
        </details>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.35em] text-gray-900 mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {["Men's Jeans", "Women's Jeans", "Men's T-Shirts", "Women's Tops", "Belts & Wallets", "Footwear", "Men's Jackets", "Red Tab Member Program", "Store Locator"].map((link) => (
                <li key={link}>
                  <Link href="#" className="text-sm text-gray-600 hover:text-gray-900 transition">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.35em] text-gray-900 mb-6">Support</h4>
            <ul className="space-y-3">
              {["Help", "Returns & Exchanges", "Shipping", "About Us"].map((link) => (
                <li key={link}>
                  <Link href="#" className="text-sm text-gray-600 hover:text-gray-900 transition">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Perks Section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.35em] text-gray-900 mb-6">Its All About The Perks</h4>
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full px-4 py-3 border-b border-gray-300 text-sm bg-transparent outline-none placeholder-gray-400 focus:border-gray-900"
                />
              </div>
              <Button className="w-full bg-gray-900 text-white hover:bg-black">
                Subscribe
              </Button>
              <p className="text-xs text-gray-600">
                *See <Link href="#" className="underline">Details</Link> on Terms and Conditions and <Link href="#" className="underline">Privacy Policy</Link> for our privacy practices.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 pb-8 border-b border-gray-200">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.35em] text-gray-900 mb-6">Contact</h4>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-bold text-gray-900 mb-1">For Customer care</p>
                <Link href="mailto:customercare@levi.in" className="text-gray-600 hover:text-gray-900">customercare@levi.in</Link>
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-1">For Order Escalation</p>
                <Link href="mailto:feedbacklevi@levi.in" className="text-gray-600 hover:text-gray-900">feedbacklevi@levi.in</Link>
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-1">For Online Orders</p>
                <Link href="tel:1800123584" className="text-gray-600 hover:text-gray-900">1800-123-584</Link>
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-1">For Store Queries</p>
                <Link href="tel:1800102501" className="text-gray-600 hover:text-gray-900">1800-1020-501</Link>
              </div>
            </div>
          </div>

          <div>
            <div>
              <p className="font-bold text-gray-900 text-sm mb-2">Call Timings</p>
              <p className="text-sm text-gray-600">Mon-Sat : 10AM - 6PM</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
          <p>
            © 2025, Levis India Store
          </p>

          <div className="flex flex-wrap justify-center gap-6">
            {[
              { label: "Privacy Policy", href: "#" },
              { label: "Terms of use", href: "#" },
              { label: "Returns", href: "#" },
              { label: "Corporate Information", href: "#" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-gray-600 hover:text-gray-900 transition"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex gap-4">
            <Link href="#" className="text-gray-600 hover:text-gray-900 transition">
              <Facebook className="w-4 h-4" />
            </Link>
            <Link href="#" className="text-gray-600 hover:text-gray-900 transition">
              <Instagram className="w-4 h-4" />
            </Link>
            <Link href="#" className="text-gray-600 hover:text-gray-900 transition">
              <Twitter className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
