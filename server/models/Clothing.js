import { createSupabaseModel } from './supabaseModel.js'

export const Promotion = createSupabaseModel('promotions', {
  idField: 'promotionId',
})

export const Coupon = createSupabaseModel('coupons', {
  idField: 'couponId',
})

export const GiftCard = createSupabaseModel('gift_cards', {
  idField: 'giftCardId',
})

export const LoyaltyTransaction = createSupabaseModel('loyalty_transactions', {
  idField: 'loyaltyTransactionId',
})

export const StoreCreditTransaction = createSupabaseModel('store_credit_transactions', {
  idField: 'storeCreditTransactionId',
})

export const CashierShift = createSupabaseModel('cashier_shifts', {
  idField: 'shiftId',
})
