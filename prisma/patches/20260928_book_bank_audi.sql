-- Additive: Bank Audi manual transfer uses the existing reviewed-payment records.
-- Apply the 20260911 Whish patch first. This does not activate Bank Audi checkout.
ALTER TYPE "BookPaymentMethod" ADD VALUE IF NOT EXISTS 'BANK_AUDI';
