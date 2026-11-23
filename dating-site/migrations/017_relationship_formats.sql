-- Allow lawful relationship preferences but keep sexual-services advertisements prohibited.
ALTER TABLE public.mm_listings DROP CONSTRAINT IF EXISTS mm_approved_dating_only;
ALTER TABLE public.mm_listings ADD CONSTRAINT mm_approved_dating_only CHECK (status <> 'approved' OR (is_commercial IS FALSE AND category IN ('dating','women-men','women-serious','women-women','men-women','men-serious','men-men','couples','trans-dating','social','events','noncommercial','support')));
ALTER TABLE public.mm_manual_profiles DROP CONSTRAINT IF EXISTS mm_manual_profiles_category_check;
ALTER TABLE public.mm_manual_profiles ADD CONSTRAINT mm_manual_profiles_category_check CHECK (category IN ('dating','women-men','women-serious','women-women','men-women','men-serious','men-men','couples','trans-dating','social','events','noncommercial','support'));
