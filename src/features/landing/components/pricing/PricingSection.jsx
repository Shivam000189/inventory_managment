import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { PRICING_PLANS } from '../../data/inventoryData';

export const PricingSection = ({
  billingCycle,
  onBillingCycleChange,
  onSelectPlan
}) => {
  return (
    <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-2xl mx-auto mb-12"
      >
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#0d0d0d] mb-4">
          Predictable pricing for every stage
        </h2>
        <p className="text-[#2f1f13]/70 text-base mb-8">
          Start free for 14 days. Upgrade or scale warehouses anytime with zero hidden
          implementation fees.
        </p>

        {/* Billing Toggle with layoutId animated background */}
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#F6EDE1] border border-[#e0d0bc] relative">
          <button
            onClick={() => onBillingCycleChange('monthly')}
            className={`relative px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer z-10 ${
              billingCycle === 'monthly'
                ? 'text-[#F6EDE1]'
                : 'text-[#2f1f13]/70 hover:text-[#2f1f13]'
            }`}
          >
            {billingCycle === 'monthly' && (
              <motion.div
                layoutId="pricing-billing-pill"
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                className="absolute inset-0 bg-[#2f2a25] rounded-xl shadow-xs -z-10"
              />
            )}
            Monthly Billing
          </button>
          <button
            onClick={() => onBillingCycleChange('annual')}
            className={`relative px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer z-10 ${
              billingCycle === 'annual'
                ? 'text-[#F6EDE1]'
                : 'text-[#2f1f13]/70 hover:text-[#2f1f13]'
            }`}
          >
            {billingCycle === 'annual' && (
              <motion.div
                layoutId="pricing-billing-pill"
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                className="absolute inset-0 bg-[#2f2a25] rounded-xl shadow-xs -z-10"
              />
            )}
            <span>Annual Billing</span>
            <span className="px-2 py-0.5 rounded-full bg-[#7bbd65] text-[#0d0d0d] text-[10px] font-bold">
              Save 20%
            </span>
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-7 items-stretch">
        {PRICING_PLANS.map((plan, index) => {
          const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;

          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              whileHover={{ y: -8 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.16, 1, 0.3, 1]
              }}
              className={`rounded-3xl p-8 flex flex-col justify-between border transition-shadow ${
                plan.highlighted
                  ? 'bg-[#2f2a25] text-[#F6EDE1] border-[#2f2a25] shadow-2xl md:-translate-y-2'
                  : 'bg-[#fbf8f3] text-[#2f1f13] border-[#e3d5c3] shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  {plan.badge && (
                    <motion.span
                      whileHover={{ scale: 1.08 }}
                      className="px-3 py-1 rounded-full bg-[#7bbd65] text-[#0d0d0d] text-xs font-bold"
                    >
                      {plan.badge}
                    </motion.span>
                  )}
                </div>
                <p
                  className={`text-sm mb-6 ${
                    plan.highlighted ? 'text-[#F6EDE1]/70' : 'text-[#2f1f13]/70'
                  }`}
                >
                  {plan.desc}
                </p>

                <div className="flex items-baseline gap-1 mb-8">
                  <motion.span
                    key={price}
                    initial={{ opacity: 0.5, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-4xl sm:text-5xl font-bold"
                  >
                    ${price}
                  </motion.span>
                  <span
                    className={`text-xs ${
                      plan.highlighted ? 'text-[#F6EDE1]/60' : 'text-[#2f1f13]/60'
                    }`}
                  >
                    / month, billed {billingCycle}
                  </span>
                </div>

                <ul className="space-y-3.5 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm">
                      <Check
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          plan.highlighted ? 'text-[#7bbd65]' : 'text-[#2f2a25]'
                        }`}
                      />
                      <span
                        className={
                          plan.highlighted ? 'text-[#F6EDE1]/90' : 'text-[#2f1f13]/85'
                        }
                      >
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectPlan(plan.name)}
                style={{ color: plan.highlighted ? '#0d0d0d' : '#ffffff' }}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer shadow-sm ${
                  plan.highlighted
                    ? 'bg-[#F6EDE1] hover:bg-[#ffffff] text-[#0d0d0d] !text-[#0d0d0d]'
                    : 'landing-btn-dark bg-[#2f2a25] hover:bg-[#0d0d0d] text-white !text-white'
                }`}
              >
                <span style={{ color: plan.highlighted ? '#0d0d0d' : '#ffffff' }}>Start 14-Day Free Trial</span>
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
